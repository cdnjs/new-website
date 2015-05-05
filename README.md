new-website
===========

Website of https://cdnjs.com

[![Dependency Status](https://david-dm.org/cdnjs/new-website.svg?theme=shields.io)](https://david-dm.org/cdnjs/new-website)

## Dependencies

* [Node](https://nodejs.org)
* [MongoDB](https://mongodb.org)
* A registered [Twitter application](https://apps.twitter.com/).

## Setup

```sh
cd path/to/repo
npm install
```

## Running

```sh
CONSUMER_KEY=<twitter app consumer key>
CONSUMER_SECRET=<twitter app consumer secret>
ACCESS_TOKEN=<twitter app access token>
ACCESS_TOKEN_SECRETt=<twitter app access token secret>
MONGOHQ_URL=<mongodb url>
APP=[mainSite|api]
./runServer.sh
```

**Note**: Make sure `mongod` is running if you're using a local database.

**Heads up**: `runServer.sh` script only works on Bash. If you're using another shell run `node [server|apiServer].js` instead.
