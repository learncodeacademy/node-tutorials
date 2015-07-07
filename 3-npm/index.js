//fs, http, util, path, events, assert
// var util = require('util');
// console.log(util.isArray({}));

var _ = require('lodash');

var people = [
  {name: "Will", age: 34, likes: "web development"},
  {name: "Laura", age: 28, likes: "pinterest"},
  {name: "Jake", age: 30, likes: "archery"},
];

console.log(_.findWhere(people, {name: 'Will'}));
