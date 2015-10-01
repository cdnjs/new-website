#!/usr/bin/env bash
if [ "$APP" == "mainSite" ]; then
    node webServer.js
elif [ "$APP" == "api" ]; then
    node apiServer.js
fi
