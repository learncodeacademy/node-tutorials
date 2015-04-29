var math = require('./math');

var command = process.argv[2];
var arguments = process.argv.slice(3).map(function(arg) {
  return parseFloat(arg);
});

if (math[command]) {
  console.log("running:", command);
  console.log(math[command].apply(math, arguments));
} else {
  console.log("command " + command + " not found!");
  console.log("allowed commands are: ", Object.keys(math).join(', '));
}
