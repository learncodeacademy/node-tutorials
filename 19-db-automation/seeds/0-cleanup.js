
exports.seed = function(knex, Promise) {
  // Deletes ALL existing entries
  return Promise.join(
    knex('posts').del(),
    knex('users').del()
  );
};
