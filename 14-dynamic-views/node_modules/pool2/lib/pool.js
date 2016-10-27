'use strict';

var Deque = require('double-ended-queue'),
    HashMap = require('hashmap');

var ResourceRequest = require('./resource-request');

var inherits = require('util').inherits,
    EventEmitter = require('events').EventEmitter,
    debug = require('debug')('pool2');

var assert = require('assert');

var Backoff = require('simple-backoff').FibonacciBackoff;

function deprecate(old, current) {
    if (process.env.NODE_ENV === 'testing') { return; }
    console.log('Pool2: ' + old + ' is deprecated, please use ' + current);
}

/* Object tagging for debugging. I don't want to modify objects when not debugging, so I only tag them
 * if debugging is enabled (setId); however, since I have to access the property of the object in the debug()
 * calls, and this may cause accesses on undefined properties of an object, which may cause deoptimization
 * of the object, I have to create a helper function to avoid this (getId)
 */
var SEQ = 0;

function getId(res) {
    if (!debug.enabled) { return -1; }
    return res.__pool2__id;
}
function setId(res) {
    if (!debug.enabled) { return; }
    if (res && typeof res === 'object') {
        Object.defineProperty(res, '__pool2__id', {
            configurable: false,
            enumerable: false,
            value: SEQ++
        });
    }
}

function validNum(opts, val, standard, allowZero, allowInfinity) { // jshint ignore: line
    if (!opts || !opts.hasOwnProperty(val)) {
        return standard;
    }
    if (allowInfinity && opts[val] === Infinity) {
        return Infinity;
    }
    var num = parseInt(opts[val], 10);
    if (isNaN(num) || num !== +opts[val] || !isFinite(num) || num < 0) {
        throw new RangeError('Pool2: ' + val + ' must be a positive integer, ' + opts[val] + ' given.');
    }
    if (!allowZero && num === 0) {
        throw new RangeError('Pool2: ' + val + ' cannot be 0.');
    }
    return num;
}
function HOP(a, b) { return a && hasOwnProperty.call(a, b); }

function Pool(opts) { // jshint maxcomplexity: 12, maxstatements: 45
    EventEmitter.call(this);

    opts = opts || { };

    if (HOP(opts, 'release')) {
        deprecate('opts.release', 'opts.dispose');
        opts.dispose = opts.release;
    }

    if (HOP(opts, 'releaseTimeout')) {
        deprecate('opts.releaseTimeout', 'opts.disposeTimeout');
        opts.disposeTimeout = opts.releaseTimeout;
    }

    assert(HOP(opts, 'acquire'), 'new Pool(): opts.acquire is required');
    assert(HOP(opts, 'dispose'), 'new Pool(): opts.dispose is required');
    assert(typeof opts.acquire === 'function', 'new Pool(): opts.acquire must be a function');
    assert(typeof opts.dispose === 'function', 'new Pool(): opts.dispose must be a function');
    assert(!HOP(opts, 'destroy') || typeof opts.destroy === 'function', 'new Pool(): opts.destroy must be a function');
    assert(!HOP(opts, 'ping') || typeof opts.ping === 'function', 'new Pool(): opts.ping must be a function');

    this._acquire = opts.acquire;
    this._dispose = opts.dispose;
    this._destroy = opts.destroy || Pool.defaults.destroy;
    this._ping = opts.ping || Pool.defaults.ping;

    this.max = validNum(opts, 'max', Pool.defaults.max);
    this.min = validNum(opts, 'min', Pool.defaults.min, true);

    assert(this.max >= this.min, 'new Pool(): opts.min cannot be greater than opts.max');

    this.maxRequests = validNum(opts, 'maxRequests', Pool.defaults.maxRequests, false, true);
    this.acquireTimeout = validNum(opts, 'acquireTimeout', Pool.defaults.acquireTimeout, true);
    this.disposeTimeout = validNum(opts, 'disposeTimeout', Pool.defaults.disposeTimeout, true);
    this.requestTimeout = validNum(opts, 'requestTimeout', Pool.defaults.requestTimeout, false, true);
    this.pingTimeout = validNum(opts, 'pingTimeout', Pool.defaults.pingTimeout);
    this.idleTimeout = validNum(opts, 'idleTimeout', Pool.defaults.idleTimeout);
    this.syncInterval = validNum(opts, 'syncInterval', Pool.defaults.syncInterval, true);
    this.bailAfter = validNum(opts, 'bailAfter', Pool.defaults.bailAfter, true, true);

    assert(this.syncInterval > 0 || !HOP(opts, 'idleTimeout'), 'new Pool(): Cannot specify opts.idleTimeout when opts.syncInterval is 0');

    this.capabilities = Array.isArray(opts.capabilities) ? opts.capabilities.slice() : [ ];

    if (this.syncInterval !== 0) {
        this.syncTimer = setInterval(function () {
            this._ensureMinimum();
            this._reap();
            this._maybeAllocateResource();
        }.bind(this), this.syncInterval);
    }

    this.live = false;
    this.ending = false;
    this.destroyed = false;

    this.acquiring = 0;

    this.pool = new HashMap();
    this.available = [ ];
    this.requests = new Deque();

    this.started = new Date();
    this.backoff = new Backoff(opts.backoff);

    if (debug.enabled) {
        this._seq = 0;
    }

    setImmediate(this._ensureMinimum.bind(this));
}
inherits(Pool, EventEmitter);

Pool.defaults = {
    destroy: function () { },
    ping: function (res, cb) { setImmediate(cb); },
    min: 0,
    max: 10,
    acquireTimeout: 30 * 1000,
    disposeTimeout: 30 * 1000,
    requestTimeout: Infinity,
    pingTimeout: 10 * 1000,
    idleTimeout: 60 * 1000,
    syncInterval: 10 * 1000,
    bailAfter: 0,
    maxRequests: Infinity
};

// return stats on the pool
Pool.prototype.stats = function () {
    var allocated = this.pool.count();
    return {
        min: this.min,
        max: this.max,
        allocated: allocated,
        available: this.max - (allocated - this.available.length),
        queued: this.requests.length,
        maxRequests: this.maxRequests
    };
};

// request a resource from the pool
Pool.prototype.acquire = function (cb) {
    if (this.destroyed || this.ending) {
        cb(new Error('Pool is ' + (this.ending ? 'ending' : 'destroyed')));
        return;
    }

    if (this.requests.length >= this.maxRequests) {
        cb(new Error('Pool is full'));
        return;
    }

    var req = new ResourceRequest(this.requestTimeout, cb);
    req.on('error', this.emit.bind(this, 'warn'));

    this.requests.push(req);
    this.emit('request', req);

    setImmediate(this._maybeAllocateResource.bind(this));

    return req;
};

// release the resource back into the pool
Pool.prototype.release = function (res) { // jshint maxstatements: 17
    var err;

    if (!this.pool.has(res)) {
        err = new Error('Pool.release(): Resource not member of pool');
        err.res = res;
        this.emit('error', err);
        return;
    }

    if (this.available.indexOf(res) > -1) {
        err = new Error('Pool.release(): Resource already released (id=' + getId(res) + ')');
        err.res = res;
        this.emit('error', err);
        return;
    }

    this.pool.set(res, new Date());
    this.available.unshift(res);

    if (this.requests.length === 0 && this.pool.count() === this.available.length) {
        this.emit('drain');
    }

    this._maybeAllocateResource();
};

// destroy the resource -- should be called only on error conditions and the like
Pool.prototype.destroy = function (res) {
    debug('Ungracefully destroying resource (id=%s)', getId(res));
    // make sure resource is not in our available resources array
    var idx = this.available.indexOf(res);
    if (idx > -1) { this.available.splice(idx, 1); }

    // remove from pool if present
    if (this.pool.has(res)) {
        this.pool.remove(res);
    }

    // destroy is fire-and-forget
    try { this._destroy(res); }
    catch (e) { this.emit('warn', e); }

    this._ensureMinimum();
};

// attempt to tear down the resource nicely -- should be called when the resource is still valid
// (that is, the dispose callback is expected to behave correctly)
Pool.prototype.remove = function (res, cb) { // jshint maxcomplexity: 8, maxstatements: 20
    // called sometimes internally for the timeout logic, but don't want to emit an error in those cases
    var timer, skipError = false;
    if (typeof cb === 'boolean') {
        skipError = cb;
        cb = null;
    }

    // ensure resource is not in our available resources array
    var idx = this.available.indexOf(res);
    if (idx > -1) { this.available.splice(idx, 1); }

    if (this.pool.has(res)) {
        this.pool.remove(res);
    } else if (!skipError) {
        // object isn't in our pool -- emit an error
        this.emit('error', new Error('Pool.remove() called on non-member'));
    }

    // if we don't get a response from the dispose callback
    // within the timeout period, attempt to destroy the resource
    if (this.disposeTimeout !== 0) {
        timer = setTimeout(this.destroy.bind(this, res), this.disposeTimeout);
    }

    try {
        debug('Attempting to gracefully remove resource (id=%s)', getId(res));
        this._dispose(res, function (e) {
            clearTimeout(timer);
            if (e) { this.emit('warn', e); }
            else { this._ensureMinimum(); }

            if (typeof cb === 'function') { cb(e); }
        }.bind(this));
    } catch (e) {
        clearTimeout(timer);
        this.emit('warn', e);
        if (typeof cb === 'function') { cb(e); }
    }
};

// attempt to gracefully close the pool
Pool.prototype.end = function (cb) {
    cb = cb || function () { };

    this.ending = true;

    var closeResources = function () {
        debug('Closing resources');
        clearInterval(this.syncTimer);

        var count = this.pool.count(),
            errors = [ ];

        if (count === 0) {
            cb();
            return;
        }

        this.pool.forEach(function (value, key) {
            this.remove(key, function (err, res) {
                if (err) { errors.push(err); }

                count--;
                if (count === 0) {
                    debug('Resources closed');
                    if (errors.length) { cb(errors); }
                    else { cb(); }
                }
            });
        }.bind(this));
    }.bind(this);

    // begin now, or wait until there are no pending requests
    if (this.available.length === this.pool.count() && this.requests.length === 0 && this.acquiring === 0) {
        closeResources();
    } else {
        debug('Waiting for active requests to conclude before closing resources');
        this.once('drain', closeResources);
    }
};

// close idle resources
Pool.prototype._reap = function () {
    var n = this.pool.count(),
        i, c = 0, res, idleTimestamp,
        idleThreshold = (new Date()) - this.idleTimeout;

    debug('reap (cur=%d, av=%d)', n, this.available.length);

    for (i = this.available.length; n > this.min && i >= 0; i--) {
        res = this.available[i];
        idleTimestamp = this.pool.get(res);

        if (idleTimestamp < idleThreshold) {
            n--; c++;
            this.remove(res);
        }
    }

    if (c) { debug('Shrinking pool: destroying %d idle connections', c); }
};

// attempt to acquire at least the minimum quantity of resources
Pool.prototype._ensureMinimum = function () {
    if (this.ending || this.destroyed) { return; }

    var n = this.min - (this.pool.count() + this.acquiring);
    if (n <= 0) { return; }

    debug('Attempting to acquire minimum resources (cur=%d, min=%d)', this.pool.count(), this.min);
    while (n--) { this._allocateResource(); }
};

// allocate a resource to a waiting request, if possible
Pool.prototype._maybeAllocateResource = function () { // jshint maxstatements: 25, maxcomplexity: 8
    // do nothing if there are no requests to serve
    if (this.requests.length === 0) { return; }

    // call callback if there is a request and a resource to give it
    if (this.available.length) {
        var res, req;

        // if a request has been aborted for some reason, we don't want to attempt to fill it
        // but since we're using a deque, we can't splice it out. instead, we flag the request
        // as fulfilled and ignore it here if we come across it
        do {
            req = this.requests.shift();
        } while (this.requests.length && req.fulfilled);

        if (req.fulfilled) { return; }

        // only check out a resource if we have a requset to fill!
        res = this.available.shift();

        debug('Reserving request for resource (id=%s, req=%s)', getId(res), req.id);

        var aborted = false, abort, timer;

        timer = setTimeout(function () {
            debug('Ping timeout, removing resource (id=%s)', getId(res));
            abort();
        }, this.pingTimeout);

        abort = function () {
            debug('Releasing request to request list (req=%s)', req.id);

            this.emit('requeue', req);

            aborted = true;
            clearTimeout(timer);

            this.requests.unshift(req);
            this.remove(res);
            this._maybeAllocateResource();
        }.bind(this);

        try {
            debug('Pinging resource (id=%s)', getId(res));

            this._ping(res, function (err) {
                if (aborted) {
                    debug('Ping succeeded after timeout, doing nothing (id=%s, req=%s)', getId(res), req.id);
                    return;
                }
                clearTimeout(timer);

                if (err) {
                    debug('Ping errored, releasing resource (id=%s)', getId(res));
                    this.emit('warn', err);
                    abort();
                    return;
                }

                if (!req.fulfilled) {
                    debug('Allocating resource to request (id=%s, req=%s); waited %ds', getId(res), req.id, ((new Date()) - req.ts) / 1000);
                    req.resolve(res);
                } else {
                    debug('Request became fulfilled while pinging resource; discarding (id=%s, req=%s)', getId(res), req.id);
                    // there's no request to serve, but we've still got a resource checked out -- release it
                    this.release(res);
                }
            }.bind(this));
        } catch (err) {
            debug('Synchronous throw attempting to ping resource (id=%s): %s', getId(res), err.message);
            this.emit('error', err);
            abort();
        }

        return;
    }

    // allocate a new resource if there is a request but no resource to give it
    // and there's room in the pool
    var pending = this.requests.length,
        toBeAvailable = this.available.length + this.acquiring,
        toBeTotal = this.pool.count() + this.acquiring;

    if (pending > toBeAvailable && toBeTotal < this.max) {
        debug('Growing pool: no resource to serve request (p=%d, tba=%d, tbt=%d, max=%d)', pending, toBeAvailable, toBeTotal, this.max);
        this._allocateResource();
    } else {
        debug('Not growing pool: pending=%d, to be available=%d', pending, toBeAvailable);
    }
};

// create a new resource
Pool.prototype._allocateResource = function () {
    if (this.destroyed) {
        debug('Not allocating resource: destroyed');
        return;
    }

    debug('Attempting to acquire resource (cur=%d, ac=%d)', this.pool.count(), this.acquiring);

    // acquiring is asynchronous, don't over-allocate due to in-progress resource allocation
    this.acquiring++;

    var onError, timer;

    onError = function (err) {
        clearTimeout(timer);

        debug('Couldn\'t allocate new resource: %s', err.message);

        // throw an error if we haven't successfully allocated a resource within
        // the alloted time
        var now = new Date();
        if (this.live === false && now - this.started >= this.bailAfter) {
            debug('Destroying pool: unable to aquire a resource within %ds', this.bailAfter/1000);
            this._destroyPool();
            this.emit('error', err);
            return;
        }

        // timed out allocations are dropped; this could leave us below the
        // minimum threshold; try to bring us up to the minimum, but don't spam
        setTimeout(this._ensureMinimum.bind(this), this.backoff.next());
    }.bind(this);

    if (this.acquireTimeout !== 0) {
        timer = setTimeout(function () {
            debug('Timed out acquiring resource');
            timer = null;
            this.acquiring--;

            onError(new Error('Timed out acquiring resource'));
        }.bind(this), this.acquireTimeout);
    }

    try {
        this._acquire(function (err, res) { // jshint maxstatements: 25
            if (!err && !res) {
              onError(new Error('Acquire callback gave no error and no resource -- check your Pool instance\'s acquire function'));
              return;
            }

            setId(res);

            if (timer) {
                clearTimeout(timer);
                timer = null;
                this.acquiring--;
            } else if (!err) {
                debug('Attempting to gracefully clean up late-arrived resource (id=%s)', getId(res));
                this.remove(res, true);
                return;
            }

            if (err) {
                onError(err);
                return;
            }

            this.live = true;

            debug('Successfully allocated new resource (cur=%d, ac=%d, id=%s)', this.pool.count(), this.acquiring, getId(res));

            this.pool.set(res, new Date());
            this.available.unshift(res);

            // normally 'drain' is emitted when the pending requests queue is empty; pending requests
            // are the primary source of acquiring new resources. the pool minimum can cause resources
            // to be acquired with no pending requests, however. if pool.end() is called while resources
            // are being acquired to fill the minimum, the 'drain' event will never get triggered because
            // there were no requests pending. in this case, we want to trigger the cleanup routine that
            // normally binds to 'drain'
            if (this.ending && this.requests.length === 0 && this.acquiring === 0) {
                this.emit('drain');
                return;
            }

            // we've successfully acquired a resource, and we only get
            // here if something wants it, so... do that
            this._maybeAllocateResource();
        }.bind(this));
    } catch (e) {
        onError(e);
    }
};

// destroy the pool itself
Pool.prototype._destroyPool = function () {
    this.destroyed = true;
    clearInterval(this.syncTimer);
    this.pool.forEach(function (value, key) {
        this.destroy(key);
    }.bind(this));
    this.pool.clear();

    // requests is a deque, no forEach
    var req;
    while (( req = this.requests.shift() )) {
        req.reject(new Error('Pool was destroyed'));
    }

    this.acquiring = 0;
    this.available.length = 0;
};

Pool._validNum = validNum;

module.exports = Pool;
