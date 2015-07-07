var express = require('express');
var router = express.Router();
var db = require('../lib/db');

/* GET home page. */
router.get('/', function(req, res, next) {
  db('users')
    .then(function(users) {
      res.send(users);
    })
  ;
});

module.exports = router;
