const express = require("express");
const bodyParser = require("body-parser");
const users = require("./routes/users");
const app = express();

app
  .use(bodyParser.json())
  .use(bodyParser.urlencoded({extended: false}))
  .use("/users", users)
;


app.listen(3000);
