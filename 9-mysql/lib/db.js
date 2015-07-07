var db = require('knex')({
  client: 'mysql',
  connection: {
    host     : '127.0.0.1',
    user     : 'root',
    database : 'development'
  }
});

module.exports = db;
