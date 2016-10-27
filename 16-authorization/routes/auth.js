const passport = require("passport")
const router = require("express").Router()

router
  .get("/login", (req, res, next) => {
    res.render("login")
  })
  .post("/login", passport.authenticate("local", {
    successRedirect: "/posts",
    failureRedirect: "/login",
  }))
  .get("/logout", (req, res, next) => {
    req.session.destroy((err) => {
      res.redirect("/login")
    })
  })
  .get("/signup", (req, res, next) => {
    res.render("signup")
  })
  .post("/signup", passport.authenticate("local-register", {
    successRedirect: "/posts",
    failureRedirect: "/signup",
  }))

module.exports = router
