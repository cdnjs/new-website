#!/bin/sh
# Exit if any errors
set -e
cd /root/new-website
echo Getting latest website changes...
git pull --rebase

echo npm install for good mesure
/usr/local/bin/npm install

echo Re-generating website...
./update.js

echo Uploading website...
git add .
git commit -am "Updated packages."
git pull --rebase
git push
git push heroku master

echo reindex algolia-search research
GITHUB_OAUTH_TOKEN=
ALGOLIA_API_KEY=
./reindex.js
