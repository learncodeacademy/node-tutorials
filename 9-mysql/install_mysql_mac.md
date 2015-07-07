#Installing MySQL on OSX#
##Install Homebrew [brew.sh](brew.sh)##
```
ruby -e "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/master/install)"
```

##Update Homebrew & Install MySQL##
```
brew update
brew upgrade
brew install mysql
```

##Start and stop MySQL##
```
mysql.server stop
mysql.server start
mysql.server restart
```

#Managing your database with Knex#
##Install Knex globally and in your project##
```
npm install -g knex
npm install knex
npm install mysql
knex init
```

A `knexfile.js` was just created, let's change the contents of the file to this for development.  Later, we can add staging and production environments:
```
module.exports = {

  development: {
    client: 'mysql',
    connection: {
      database: 'development',
      user: 'root'
    },
    migrations: {
      tableName: 'knex_migrations'
    },
    seeds: {
      directory: './seeds/dev'
    }
  }

};
```

Now Knex knows how to connect to our database.  Let's create our first migration and seed

##Create A New Migration##
Migrations are changes to the database
We store these as files so our database can be easily replicated to any environment
```
knex migrate:make migrationName
knex migrate:latest
knex migrate:rollback
```

##Create A New Seed File##
Seed files are sample data that is used for development
We store these as files so any developer on our team can quickly have a database with information locally on their machine
