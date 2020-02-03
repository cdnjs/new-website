#!/usr/bin/env node

// Required imports and data for the app
const throng = require('throng');
const app = require('./app');
const WORKERS = process.env.WEB_CONCURRENCY || 1;

// Start the app
throng({
  workers: WORKERS,
  lifetime: Infinity
}, app);
