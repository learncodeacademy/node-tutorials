# we can now run node apps
# - make an app.js
# - run it and go to port 3000
# - we can rsync, use git to pull (git clone your repo)
# a few considerations
# - if this is our only instance, we don't want people to go to port 3000, but an unprivileged user can't open port 80
apt-get update
apt-get install iptables-persistent
iptables -t nat -I PREROUTING -p tcp --dport 80 -j REDIRECT --to-ports 3000


# ssh into your server (as deploy user) and install nvm
curl -o- https://raw.githubusercontent.com/creationix/nvm/v0.32.1/install.sh | bash
nvm install 6

# IMPORTANT!
# .bashrc will prevent nvm from running over ssh, we need to move nvmrc up to the top

# install pm2
npm i -g pm2
# tell pm2 to startup on machine boot
pm2 startup ubuntu
# get the path for this version of pm2 - we'll use this for deployment,
# otherwise deployment will break when we change a version
which pm2


# back on your machine install pm2 to your repo
npm i -D pm2
#add a .nvmrc file if it doesn't exist

# create an ecosystem file
pm2 ecosystem

# change ecosystem.json values for your project
# IMPORTANT! use the FULL path of pm2 - the one you got from "which pm2 on your server"
pm2 deploy production setup
pm2 deploy production

# make a change and redeploy

# now we can monitor our app
ssh deploy@<ip address> pm2 monit
