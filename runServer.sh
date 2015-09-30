#!/usr/bin/env bash

xz -kfd public/packages.min.json.xz

if [ "$APP" == "mainSite" ]; then
    node webServer.js
elif [ "$APP" == "api" ]; then
    node apiServer.js
fi
