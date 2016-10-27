
exports.up = function(knex, Promise) {
  return knex.raw(`
    CREATE TABLE posts (
      id int(11) unsigned NOT NULL AUTO_INCREMENT,
      text longtext,
      user_id int(11) unsigned NOT NULL,
      PRIMARY KEY (id),
      KEY user_id (user_id),
      CONSTRAINT posts_ibfk_1 FOREIGN KEY (user_id) REFERENCES users (id)
    ) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=latin1;
  `)
};

exports.down = function(knex, Promise) {
  return knex.schema.dropTable("posts")
};
