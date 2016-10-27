const express = require("express");
const favicon = require("serve-favicon");

const app = express();
const staticAssets = __dirname + "/public";
const faviconPath = __dirname + "/public/favicon.ico";

app
  .set("views", __dirname + "/views")
  .set("view engine", "hjs")
  .use(express.static(staticAssets))
  .use(favicon(faviconPath))
  .get("/", (req, res) => {
    var title = "still another title";
    var tweets = [
      "my first tweet",
      "other tweet",
      "yet another tweet",
    ];

    res.render("index", {
      title: title,
      tweets: tweets,
      showTweets: true,
      partials: {header: "tweets", tweets: "tweets"}
    })
  })
;

app.listen(3000);
