# Install Docker www.docker.com
docker run -d --name test-mysql -p 3306:3306 -e MYSQL_ALLOW_EMPTY_PASSWORD=yes -e MYSQL_DATABASE=test mysql

# now you can stop, start & remove the DB by name
docker stop test-mysql
docker start test-mysql
docker rm test-mysql

# you can also have multiple databases
# you just can't run more than one at once on the same port
docker run -d --name test-mysql2 -p 3307:3306 -e MYSQL_ALLOW_EMPTY_PASSWORD=yes -e MYSQL_DATABASE=test mysql
# test-mysql2 is now running on port 3307

docker ps

# connect using sequel pro (mac) or MySQL Workbench (mac/pc)


# other ways to install mysql
# go to mysql.com and use the installer
# on Mac, use homebrew (brew.sh): brew install mysql
# I also recommend using brew services to control, start, stop mysql server
