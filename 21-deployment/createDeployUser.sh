# these are the commands that it takes to get a basic production node server up and running

# ssh in as root and create a deployment user
useradd -m -s /bin/bash deploy
passwd deploy
# enter secure password

# back on your machine, create a new ssh key for this project
mkdir ssh
ssh-keygen -C "nodejs-app"
chmod 600 ssh/id_rsa
# save to ./ssh/id_rsa with no password

# now, install that key on your server
ssh-copy-id -i ssh/id_rsa.pub dep@104.236.108.202

# now you can ssh in without a password...just specify the key
ssh deploy@<your ip> -i ssh/id_rsa

# one more security thing, let's disable logging in with passwords
# log in as root one more time and change configuration so ssh keys are required for login
nano /etc/ssh/sshd_config
ChallengeResponseAuthentication no
PasswordAuthentication no
UsePAM no
# restart ssh with this command
/etc/init.d/sshd restart
# or if that fails, this command
service sshd restart

