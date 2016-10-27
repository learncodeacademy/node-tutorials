const express = require("express")
const bodyParser = require("body-parser")
const session = require("express-session")
const passport = require("passport")
const authRoutes = require("./routes/auth")
const postsRoutes = require("./routes/posts")
const db = require("./db")
require("./passport")

express()
  .set("view engine", "hjs")
  .use(bodyParser.json())
  .use(bodyParser.urlencoded({extended: false}))
  .use(session({ secret: "i love dogs", resave: false, saveUninitialized: false }))
  .use(passport.initialize())
  .use(passport.session())
  .use(authRoutes)
  .use(postsRoutes)
  .get("/", (req, res, next) => {
    res.send({
      session: req.session,
      user: req.user,
      authenticated: req.isAuthenticated(),
    })
  })
  .listen(3000)

