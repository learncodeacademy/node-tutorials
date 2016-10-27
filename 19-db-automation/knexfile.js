module.exports = {
  development: {
    client: "mysql",
    connection: {
      host: "127.0.0.1",
      user: "root",
      database: "test",
    }
  },
  production: {
    client: "mysql",
    connection: {
      host: "production",
      user: "production",
      database: "test",
    }
  }
}
