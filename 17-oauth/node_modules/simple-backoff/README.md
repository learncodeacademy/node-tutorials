# simple-backoff

Calculates the delay values for various backoff mechanisms. Like [backoff][1], except it doesn't wrap everything up in an arbitrary API. Like [backo][2]/[backo2][3], except it provides three choices of algorithm.

# Usage

    var LinearBackoff = require('simple-backoff').LinearBackoff;
    
    var backoff = new LinearBackoff({
        min: 10,
        step: 50
    });
    console.log(backoff.next());
    console.log(backoff.next());
    backoff.reset();
    console.log(backoff.next());

Outputs:

    10
    60 
    10

# API

### constructor
Three constructors are exported: `LinearBackoff`, `ExponentialBackoff`, and `FibonacciBackoff`. They each have slightly different options, but all accept a basic set of core options, passed as an options bag:

    new LinearBackoff({
        min: 10,
        max: 10000,
        step: 50,
        jitter: 0
    });

    new ExponentialBackoff({
        min: 10,
        max: 10000,
        factor: 2,
        jitter: 0
    }); 

    new FibonacciBackoff({
        min: 10,
        max: 10000,
        jitter: 0
    });

The values shown above are the defaults.

### backoff.next()

Returns the next value in the sequence, with jitter applied (if any). Will not exceed the value of `max`, except by some amount of jitter.

`backoff.next()` will always return an integer `>= 0`.

### backoff.reset()

Resets the sequence to its initial state.

# Options

### min
Specifies the starting/minimum value of the sequence.

### max
Specifies the maximum value of the sequence. Calls to `next` will not increase the sequence above this value.

### step
Used only for `LinearBackoff`. This value is added to the previous value to arrive at the next value in the sequence.

### factor
Used only for `ExponentialBackoff`. This value is multiplied by the previous value to arrive at the next value in the sequence. 

### jitter
A number between 0 and 1, inclusive. The `jitter` value specifies a percentage of the difference between the current and next values, centered on the current value. Jitter is cumulative.

Example:

In a linear sequence, if the current value is `100`, the step is `50`, and the jitter is `0.5`, the result of `backoff.next()` will be a random value between `87.5` and `112.5`:

- The difference between `100` and `150` is `50`
- `50` multiplied by the jitter value is `25`
- A range of `25` centered around `100` is `87.5`-`112.5`

The range of values used for jitter varies slightly depending on the backoff strategy:

- For linear, the range is the same as the step.
- For exponential, the range is the difference between the previous value and the current value. The previous value is calculated from the initial value when applicable.
- For fibonacci, the range is the difference between the last value in the sequence and the current value in the sequence. When these are the same (e.g. at the beginning of a sequence), the range is the same as the current value.

The point of the `jitter` option is to vary values such as reconnect times from clients when a server restarts to avoid everything trying to reconnect at the same time.

[1]: https://www.npmjs.com/package/backoff
[2]: https://www.npmjs.com/package/backo
[3]: https://www.npmjs.com/package/backo2
