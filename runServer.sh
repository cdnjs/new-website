#!/usr/bin/env bash
if [ "$APP" == "mainSite" ]; then
    node --expose-gc webServer.js
elif [ "$APP" == "api" ]; then
    node --expose-gc apiServer.js
fi
