'use strict';

var inherits = require('util').inherits,
    EventEmitter = require('events').EventEmitter,
    debug = require('debug')('pool2');

var _id = 0;

// this has promisey semantics but can't really be replaced with a simple promise
function ResourceRequest(timeout, callback) {
    if (typeof timeout === 'function') {
        callback = timeout;
        timeout = Infinity;
    }
    if (typeof callback !== 'function') {
        throw new Error('new ResourceRequest(): callback is required');
    }
    
    EventEmitter.call(this);
    
    this.id = _id++;
    this.ts = new Date();
    this.cb = callback;
    this.fulfilled = false;
    this.timer = null;
    
    debug('New ResourceRequest (id=%s, timeout=%s)', this.id, timeout);
    
    if (timeout !== Infinity) { this.setTimeout(timeout); }
}
inherits(ResourceRequest, EventEmitter);

ResourceRequest.prototype.setTimeout = function (_duration) {
    if (_duration === Infinity) {
        debug('ResourceRequest: setTimeout called with Infinity: clearing timeout');
        this.clearTimeout();
        return;
    }
    
    var duration = parseInt(_duration, 10);
    
    if (isNaN(duration) || duration <= 0) {
        throw new Error('ResourceRequest.setTimeout(): invalid duration: ' + duration);
    }
    
    var now = new Date(),
        elapsed = now - this.ts;
    
    if (elapsed > duration) {
        setImmediate(this._rejectTimeout.bind(this));
    } else {
        this.timer = setTimeout(this._rejectTimeout.bind(this), duration - elapsed);
    }
};
ResourceRequest.prototype.clearTimeout = function () {
    debug('ResourceRequest: clearing timeout (id=%s)', this.id);
    clearTimeout(this.timer);
    this.timer = null;
};
ResourceRequest.prototype.resolve = function (res) {
    debug('ResourceRequest: resolve (id=%s)', this.id);
    this._fulfill(null, res);
};
ResourceRequest.prototype.reject = function (err) {
    debug('ResourceRequest: reject (id=%s)', this.id);
    this._fulfill(err);
};
ResourceRequest.prototype.abort = function (msg) {
    msg = msg || 'No reason given';
    
    debug('ResourceRequest: abort (id=%s)', this.id);
    this.reject(new Error('ResourceRequest aborted: ' + msg));
};
ResourceRequest.prototype._rejectTimeout = function () {
    debug('ResourceRequest: rejectTimeout (id=%s)', this.id);
    this.reject(new Error('ResourceRequest timed out'));
};
ResourceRequest.prototype._fulfill = function (err, res) {
    if (err !== null) {
        debug('ResourceRequest: fulfilling with error: %s (id=%s)', err.message, this.id);
        // ensure any error gets emitted
        this.emit('error', err);
    } else {
        debug('ResourceRequest: fulfilling with resource (id=%s)', this.id);
    }
    
    // if we've already fulfilled this request, don't try to do it again
    if (this.fulfilled) {
        debug('ResourceRequest: redundant fulfill, not calling callback (id=%s)', this.id);
        // but make sure somebody knows about it
        this.emit('error', new Error('ResourceRequest already fulfilled'));
        return;
    }
    
    this.fulfilled = true;
    this.clearTimeout();
    this.cb.apply(this, arguments);
};

module.exports = ResourceRequest;
