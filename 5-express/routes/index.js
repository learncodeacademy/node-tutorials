var express = require('express');
var router = express.Router();


/* GET home page. */
router.get('/', authorize, isAuthorized, function(req, res, next) {
  // res.send("hello world"); //200 text/html
  // res.send(200); //200 text/html
  // res.send({name: 'Will'}); //200 application/json
  res.render('index', { title: 'Express' }); //200 text/html
});

function authorize(req, res, next) {
  if (true) {
    req.isAuthorized = true;
  }
  next();
}

function isAuthorized(req, res, next) {
  if (req.isAuthorized) {
    next();
  } else {
    res.status(403).render('index', {title: "Not authorized"});
  }
}

module.exports = router;
