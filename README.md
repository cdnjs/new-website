new-website
===========

Website of https://cdnjs.com, for the cdn content, see [cdnjs/cdnjs](https://github.com/cdnjs/cdnjs) repo.

[![Dependency Status](https://david-dm.org/cdnjs/new-website.svg?theme=shields.io)](https://david-dm.org/cdnjs/new-website)

## Dependencies

* [Node](https://nodejs.org)

## Setup

```sh
cd path/to/repo
npm install
```

## Running

```sh
npm install          # install nodejs dependencies
npm run dev:web      # for the website
npm run dev:api      # for the API
```

**Note**:

  * The artifacts/meta data is on the [meta](https://github.com/cdnjs/new-website/tree/meta) branch.

## SRIs

When we are deploying the website/api a sri directory is created by cloning https://github.com/cdnjs/SRIs.
