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

router.get('/withfooter', function(req, res, next) {
  res.render('index', {
    title: "your awesome site",
    footerMsg: "have a great day",
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
    ],
    partials: {footer: 'footer'}
  });
});

module.exports = router;
