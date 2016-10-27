
exports.up = function(knex, Promise) {
  return knex.raw(`
    CREATE TABLE users (
      id int(11) unsigned NOT NULL AUTO_INCREMENT,
      email varchar(255) DEFAULT NULL,
      password varchar(255) DEFAULT NULL,
      first_name varchar(255) DEFAULT NULL,
      last_name varchar(255) DEFAULT NULL,
      is_admin tinyint(1) DEFAULT NULL,
      oauth_provider varchar(255) DEFAULT NULL,
      oauth_id varchar(255) DEFAULT NULL,
      PRIMARY KEY (id)
    ) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=latin1;
  `)
};

exports.down = function(knex, Promise) {
  return knex.schema.dropTable("users")
};
