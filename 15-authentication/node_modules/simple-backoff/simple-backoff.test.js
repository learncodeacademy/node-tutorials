'use strict';

var backoff = require('./simple-backoff.js');
require('should');

describe('Linear backoff', function () {
  var LinearBackoff = backoff.LinearBackoff;
  it('should instantiate with default options', function () {
    new LinearBackoff();
  });
  it('should iterate from min to max by step', function () {
    var b = new LinearBackoff({ min: 0, max: 50, step: 10 });
    [0, 10, 20, 30, 40, 50]
    .forEach(function (val) {
      b.next().should.equal(val);
    });
  });
  it('should not exceed max', function () {
    var b = new LinearBackoff({ min: 0, max: 50, step: 100 });
    [0, 50, 50]
    .forEach(function (val) {
      b.next().should.equal(val);
    });
  });
  it('should reset correctly', function () {
    var b = new LinearBackoff({ min: 0, max: 50, step: 100 });
    b.next().should.equal(0);
    b.reset();
    b.next().should.equal(0);
  });
  it('should vary with jitter, within bounds and averaging to the current value', function () {
    var b = new LinearBackoff({ min: 100, max: 200, step: 100, jitter: 0.5 });
    var sum = 0, eql = 0, next;
    for (var i = 0; i < 1000; i++) {
      b.reset();
      next = b.next();
      if (next === 100) { eql++; }
      next.should.not.be.below(50);
      next.should.not.be.above(150);
      sum += next;
    }
    eql.should.be.below(50);
    (Math.round(sum/10000)*10).should.eql(100);
  });
});
describe('Exponential backoff', function () {
  var ExponentialBackoff = backoff.ExponentialBackoff;
  it('should instantiate with default options', function () {
    new ExponentialBackoff();
  });
  it('should handle a min value of 0', function () {
    var b = new ExponentialBackoff({ min: 0 });
    b.next().should.not.equal(b.next());
  });
  it('should iterate from min to max by factor', function () {
    var b = new ExponentialBackoff({ min: 0, factor: 2 });
    [0, 1, 2, 4, 8, 16]
    .forEach(function (val) {
      b.next().should.equal(val);
    });
  });
  it('should not exceed max', function () {
    var b = new ExponentialBackoff({ min: 0, max: 50, factor: 10 });
    [0, 1, 10, 50, 50]
    .forEach(function (val) {
      b.next().should.equal(val);
    });
  });
  it('should reset correctly', function () {
    var b = new ExponentialBackoff({ min: 0, max: 50, factor: 10 });
    b.next().should.equal(0);
    b.reset();
    b.next().should.equal(0);
  });
  it('should vary with jitter, within bounds and averaging to the current value', function () {
    var b = new ExponentialBackoff({ min: 128, max: 256, factor: 2, jitter: 0.5 });
    var sum = 0, eql = 0, next;
    for (var i = 0; i < 1000; i++) {
      b.reset();
      next = b.next();
      if (next === 128) { eql++; }
      next.should.not.be.below(96);
      next.should.not.be.above(160);
      sum += next;
    }
    eql.should.be.below(50);
    (Math.round(sum/4000)*4).should.eql(128);
  });
});
describe('Fibonacci backoff', function () {
  var FibonacciBackoff = backoff.FibonacciBackoff;
  it('should instantiate with default options', function () {
    new FibonacciBackoff();
  });
  it('should handle a min value of 0', function () {
    var b = new FibonacciBackoff({ min: 0 });
    b.next().should.not.equal(b.next());
  });
  it('should iterate from min to max', function () {
    var b = new FibonacciBackoff({ min: 0, max: 34 });
    [0, 1, 1, 2, 3, 5, 8, 13, 21, 34]
    .forEach(function (val) {
      b.next().should.equal(val);
    });
  });
  it('should not exceed max', function () {
    var b = new FibonacciBackoff({ min: 50, max: 50 });
    [50, 50]
    .forEach(function (val) {
      b.next().should.equal(val);
    });
  });
  it('should reset correctly', function () {
    var b = new FibonacciBackoff({ min: 0, max: 50 });
    b.next().should.equal(0);
    b.reset();
    b.next().should.equal(0);
  });
  it('should vary with jitter, within bounds and averaging to the current value', function () {
    var b = new FibonacciBackoff({ min: 144, max: 233, jitter: 0.5 });
    var sum = 0, eql = 0, next;
    for (var i = 0; i < 1000; i++) {
      b.reset();
      next = b.next();
      if (next === 144) { eql++; }
      next.should.not.be.below(99.5);
      next.should.not.be.above(188.5);
      sum += next;
    }
    eql.should.be.below(50);
    (Math.round(sum/4000)*4).should.eql(144);
  });
});
