const express = require("express")
const bodyParser = require("body-parser")
const knex = require("knex")

const db = knex({
  client: "mysql",
  connection: {
    host: "127.0.0.1",
    user: "root",
    database: "test",
  }
})
// GET /users get all users
// GET /user/:id get single user
// POST /users create users
// PUT /users/:id update user
// DELETE /users/:id delete user

express()
  .use(bodyParser.json())
  .get("/users", (req, res, next) => {
    db("users").then((users) => {
      res.send(users)
    }, next)
  })
  .post("/users", (req, res, next) => {

    db("users")
      .insert(req.body)
      .then((userIds) => {
        res.send(userIds)
      }, next)
  })
  .get("/users/:id", (req, res, next) => {
    const { id } = req.params;

    db("users")
      .where("id", id)
      .first()
      .then((users) => {
        if (!users) {
          return res.send(400)
        }
        res.send(users)
      }, next)
  })
  .put("/users/:id", (req, res, next) => {
    const { id } = req.params;

    db("users")
      .where("id", id)
      .update(req.body)
      .then((result) => {
        if (result === 0) {
          return res.send(400)
        }
        res.send(200);
      }, next)
  })
  .delete("/users/:id", (req, res, next) => {
    const { id } = req.params;

    db("users")
      .where("id", id)
      .delete()
      .then((result) => {
        if (result === 0) {
          return res.send(400)
        }
        res.send(200);
      }, next)
  })
  .listen(3000)
