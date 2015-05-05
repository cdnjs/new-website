#!/usr/bin/env bash
if [ "$APP" == "mainSite" ]; then
    node server.js
elif [ "$APP" == "api" ]; then
    node apiServer.js
fi
