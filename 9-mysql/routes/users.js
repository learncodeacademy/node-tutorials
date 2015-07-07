var express = require('express');
var router = express.Router();
var db = require('../lib/db');

/* GET users listing. */
router.get('/', function(req, res, next) {
  db('users')
    .then(function(users) {
      res.send(users);
    })
  ;
});

router.get('/:column/:value', function(req, res, next) {
  var query = {};
  query[req.params.column] = req.params.value;

  db('users')
    .where(query)
    .then(function(users) {
      res.send(users);
    })
  ;
});

module.exports = router;
