#!/bin/sh
# Exit if any errors
set -e
cd /root/new-website
echo Getting latest website changes...
git pull --rebase

echo npm install for good mesure
/usr/local/bin/npm install

echo Re-generating website...
/usr/local/bin/node update.js

echo Uploading website...
git add .
git commit -am "Updated packages."
git push
git push heroku master
