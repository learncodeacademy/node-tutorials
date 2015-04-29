var math = require("./math");

var command = process.argv[2];
var num1 = parseFloat(process.argv[3]);
var num2 = parseFloat(process.argv[4]);

console.log(math[command](num1, num2));
