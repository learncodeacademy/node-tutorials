require("express")()
  .get("/", (req, res, next) => {
    res.send("hello world")
  })
  .listen(3000)
