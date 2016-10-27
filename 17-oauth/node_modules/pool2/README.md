# Pool2

A generic resource pool

## Usage

The values below are the defaults

    var Pool = require('pool2');
    var pool = new Pool({
        acquire: function (cb) { cb(null, resource); },
        acquireTimeout: 30*1000,

        dispose: function (res, cb) { cb(); },
        disposeTimeout: 30*1000,

        destroy: function (res) { },

        ping: function (res, cb) { cb(); },
        pingTimeout: 10*1000,

        capabilities: ['tags'],

        min: 0,
        max: 10,

        maxRequests: Infinity,
        requestTimeout: Infinity,

        idleTimeout: 60*1000,
        syncInterval: 10*1000,

        backoff: { },
        bailAfter: 0       
    });

    pool.acquire(function (err, rsrc) {
        // do stuff
        pool.release(rsrc);
    });

    pool.stats();
    /* {
        min: 0,
        max: 10,
        allocated: 0,
        available: 0,
        queued: 0,
        maxRequests: Infinity
    } */

    pool.remove(rsrc);
    pool.destroy(rsrc);

    pool.end(function (errs) {
        // errs is null or an array of errors from resources that were released
    });

    pool._destroyPool();

## Constructor options

### acquire
Required. The function that acquires a resource (e.g. opens a database connection) on behalf of the pool. Accepts a node-style callback.

### acquireTimeout
An integer, in milliseconds, to specify how long to wait for a call to `acquire` before failing.

### dispose
Required. The function that disposes of a resource (e.g. gracefully closes a database connection) on behalf of the pool. Accepts the resource to dispose of, which is the same object returned by the acquire function, and a node-style callback.

### disposeTimeout
An integer, in milliseconds, to specify how long to wait for a call to `dispose` before failing. Resources that fail the `dispose` call will still be removed from the pool, but undefined behavior may occur: if a dispose call fails, it may leave dangling sockets or handles that prevent graceful exit of an application.

### destroy
Optional. This function is called with a resource that is destroyed, either by a timeout or failed call to `dispose`, or an explicit call to `pool.destroy()`. There is no node-style callback: this function is a last resort, and is fire-and-forget.

### ping
Optional. A function to check whether a resource is still alive (e.g. send `SELECT 1` on a database connection). Accepts the resource to test and a node-style callback.

### pingTimeout
An integer, in milliseconds, to specify how long to wait for the `ping` function before giving up and disposing of the resource.

### capabilities
An array of strings. This is used in conjunction with clustering to specify which pools in the cluster to select from. For example, you might have a pool of connections to a database master with read-write capability, and another pool of connections to a slave with read-only capability. One would be defined as `capabilities: ['read', 'write']`, and the other as `capabilities: ['read']`. When acquiring from the cluster, you could use `cluster.acquire('read', ...)` and be served a connection from either pool, but if you used `cluster.acquire('write', ...)`, you would only receive connections from the master (read-write) pool.

### min
An integer greater than zero. The minimum number of resources to maintain in the pool. If the pool contains fewer resources than this, it will attempt to acquire more until it reaches this value.

### max
An integer greater than or equal to `min`. The maximum number of resources the pool may contain. Requests for resources will not cause new resources to be allocated when this number of resources are currently held in the pool (whether checked out or not). If all resources are checked out, requests are queued until one becomes available.

### maxRequests
An integer greater than 0 (`Infinity` is also valid), to specify the maximum number of requests that the pool instance will allow. If the request queue exceeds this number, calls to `acquire` will fail with the error `Pool is full`.

### requestTimeout
An integer, in milliseconds (`Infinity` is also valid), to specify how long to wait for a successful resource request before failing.

### idleTimeout
An integer, in milliseconds, to specify how long a resource must be idle before it may be disposed of. Resources are periodically checked (see `syncInterval` below) for idleness, and idle resources are disposed of unless they would bring the pool below the configured `min` value.

### syncInterval
An integer, in milliseconds, to specify how often to dispose of idle resources and/or open new resources to fulfill the pool minimum.

### backoff
An object, passed as-is to [simple-backoff](https://www.npmjs.com/package/simple-backoff), which governs the retry rate for failed allocations. `pool2` uses the Fibonacci strategy for backoff timing. Currently only an explicit failure or timeout on an allocation is retried in this fashion; all other errors and removals of resources that may cause the pool's resource collection to fall under the minimum are remedied on the `syncInterval` or an explicit allocation request when no resources are available.

### bailAfter
An integer, in milliseconds (`Infinity` is also valid), to specify how long to wait for a successful allocation before failing. `pool2` has a concept of whether a pool is "live", defined by whether it has succeeded in allocating *any* resource yet. When a pool is initialized, its `live` property is set to `false`, and a timestamp is taken. When an allocation succeeds, the `live` property is set to true. When an allocation fails, if `live` is `false`, the difference between the current timestamp and the initial timestamp is taken: if this value is greater than `bailAfter`, the pool is destroyed and an error is emitted.

The primary purpose of this functionality is to allow for applications to crash and notify the user when configuration is incorrect or some other problem occurs (database isn't started, network configuration has changed, etc.)

The default for this value is 0, meaning that if the *very first* allocation request fails, pool2 will fail. `Infinity` is an acceptable value, allowing you to retry infinitely. Retries follow the backoff settings, if supplied, though an extra try or two may result from the `syncInterval` setting as well.

## Instance methods

### pool.acquire()
Acquire a resource from the pool. Accepts a node-style callback, which is given either the resource or an error. Calls to acquire are queued and served in first in, first out order. Currently, acquire requests are queued indefinitely. Requests are subject to the `maxRequests` option; if the queue is full, a call to `acquire` will be rejected with the error `Pool is full`.

### pool.remove()
Remove a resource from the pool gracefully. This method should be preferred over `destroy` (see below). This method is fire-and-forget: it does not take a callback, even though the underlying `dispose` function does.

### pool.destroy()
Remove a resource from the pool "ungracefully". This immediately removes the resource without attempting to clean it up. Suitable for removing resources that encounter a fatal error and cannot otherwise be nicely dealt with.

### pool.stats()
Returns some information about the current state of the pool:

    {
        min: 0,
        max: 10,
        allocated: 0,
        available: 0,
        queued: 0,
        maxRequests: Infinity
    }

### pool.end()
Attempt to gracefully shut everything down. Calls to `acquire` after calling `end` will be rejected with the error `Pool is ending` (or `Pool is destroyed` once shutdown has completed). Pending resources will not be disposed of until they are released by whatever has checked them out. When all resources have been released back to the pool, calls the `dispose` function on each of them and collects any errors. These errors are passed along to the callback, if provided.

Example:

    pool.end(function (errors) {
        if (!errors.length) { return; }
        console.error('Encountered some errors while shutting down:', errors);
    });

### pool._destroyPool()
This is an internal method used by pool2 itself primarily during testing. Rejects all pending requests and destroys all open resources; disables timers and sets the pool's status to destroyed. You shouldn't need to call this, but I'm documenting it here anyway.

## Clustering

    var pool1 = new Pool(opts1),
        pool2 = new Pool(opts2);

    var cluster = new Pool.Cluster([pool1, pool2]);

    cluster.acquire(function (err, rsrc) {
        // do stuff
        cluster.release(rsrc);
    });

    cluster.acquire('read', function (err, rsrc) {
        // if you specify a capability, only pools tagged with that capability
        // will be used to serve the request
    });

    cluster.addPool(new Pool(...));
    var pool = cluster.pools[0];
    cluster.removePool(pool);

    cluster.end(function (errs) {
        // errs is an array of errors returned from ending the pools
    });

## Constructor options

`Pool.Cluster` takes only one argument to its constructor: an array of `Pool` instances.

## Instance methods

### cluster.addPool()
Add a pool to the cluster.

### cluster.removePool()
Remove a pool from the cluster.

### cluster.pools
An array of pools in the cluster.

### cluster.acquire(callback)
Just like `pool.acquire`, except it draws a resource from any of the pools in the cluster. Resources are drawn from the pool with the most idle resources first; otherwise, order is undefined.

### cluster.acquire('capability', callback)
Like `cluster.acquire`, except only pools that list `'capability'` in their `capabilities` array are considered.

### cluster.end()
Calls `pool.end()` on all pools in this cluster, consolidates any errors, and calls back with them

## Debugging
Pool2 makes use of the [debug](https://www.npmjs.com/package/debug) module. For a detailed look at what exactly the pool is doing, execute your program with `DEBUG=pool2` set.
