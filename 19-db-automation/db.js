const knex = require("knex")

const config = require("./knexfile")[process.env.NODE_ENV || "development"]

const db = knex(config)

module.exports = db;
