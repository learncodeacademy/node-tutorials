'use strict';

var inherits = require('util').inherits;

function Backoff(opts) {
  opts = opts || { };
  
  var min = parseInt(opts.min, 10),
      max = parseInt(opts.max, 10),
      jitter = parseFloat(opts.jitter);
  
  this.min = !isNaN(min) ? min : 10;
  this.max = !isNaN(max) ? max: 10*1000;
  this.jitter = !isNaN(jitter) && jitter > 0 && jitter <= 1 ? jitter : 0;
  
  this.reset();
}
Backoff.prototype.next = function () {
  if (this.jitter) {
    var spread = this._spread() * this.jitter;
    this.cur += (Math.random() * spread) - (spread / 2);
  }
  
  this.cur = Math.max(0, Math.min(this.max, Math.floor(this.cur)));
  
  var cur = this.cur;
  
  this._step();
  return cur;
};
Backoff.prototype.reset = function () {
  this._reset();
};

function LinearBackoff(opts) {
  opts = opts || { };
  Backoff.call(this, opts);
  var step = parseInt(opts.step, 10);
  this.step = !isNaN(step) && step > 0 ? step : 50;
}
inherits(LinearBackoff, Backoff);
LinearBackoff.prototype._spread = function () {
  return this.step;
};
LinearBackoff.prototype._step = function () {
  this.cur = this.cur + this.step;
};
LinearBackoff.prototype._reset = function () {
  this.cur = this.min;
};

function FibonacciBackoff(opts) {
  opts = opts || { };
  Backoff.call(this, opts);
  this.last = 0;
}
inherits(FibonacciBackoff, Backoff);
FibonacciBackoff.prototype._spread = function () {
  return (this.cur === this.last) ? this.cur : this.cur - this.last;
};
FibonacciBackoff.prototype._step = function () {
  var next = this.last + this.cur;
  if (next === 0) { next = 1; }
  this.last = this.cur;
  this.cur = next;
};
FibonacciBackoff.prototype._reset = function () {
  this.cur = this.min;
  this.last = 0;
};

function ExponentialBackoff(opts) {
  opts = opts || { };
  Backoff.call(this, opts);
  var factor = parseFloat(opts.factor);
  this.factor = !isNaN(factor) && factor > 1 ? factor : 2;
}
inherits(ExponentialBackoff, Backoff);
ExponentialBackoff.prototype._spread = function () {
  return this.cur - (this.cur / this.factor);
};
ExponentialBackoff.prototype._step = function () {
  if (this.cur === 0) { this.cur = 1; }
  else { this.cur *= this.factor; }
};
ExponentialBackoff.prototype._reset = function () {
  this.cur = this.min;
};

module.exports = {
  Backoff: Backoff,
  LinearBackoff: LinearBackoff,
  FibonacciBackoff: FibonacciBackoff,
  ExponentialBackoff: ExponentialBackoff
};
