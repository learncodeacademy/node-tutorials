var express = require('express');
var router = express.Router();

// http://mysite.com/users/1/save?test=1
router.get('/:id/:action', function(req, res) {
  res.send({
    id: req.params.id, //id: "1"
    action: req.params.action, //action: "save"
    isTest: req.query.test, //query: "1"
  })
});


module.exports = router;
