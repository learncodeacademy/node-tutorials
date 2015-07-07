var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', {
    title: "your awesome site",
    friends: ["Will", "Laura", "John Travolta"],
    enemies: [
      {
        name: "skeletor",
        power: 10,
        isDead: false,
      },
      {
        name: "venom",
        power: 8,
        isDead: true,
      },
      {
        name: "loki",
        power: 22,
        isDead: false,
      }
    ]
  });
});

module.exports = router;
