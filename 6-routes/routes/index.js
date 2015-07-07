var express = require('express');
var router = express.Router();

// http://mysite.com
router.get("/", function(req, res, next) {
  res.send('hello world');
});

// http://mysite.com/profile
router.get("/profile", function(req, res, next) {
  res.send({
    name: "Will Stern"
  });
});

// http://mysite.com/error
router.get("/error", function(req, res, next) {
  res.sendStatus(403);
});



module.exports = router;
