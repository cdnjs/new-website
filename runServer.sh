#!/bin/sh

export WEB_CONCURRENCY=1

wget -O public/packages.min.json https://storage.googleapis.com/cdnjs-assets/package.min.js

git clone https://github.com/cdnjs/SRIs.git ./sri

(
    cd ./sri
    echo "SRIs at:"
    git log -n 1 | cat
)

if [ x"$APP" = x"mainSite" ]; then
    node --expose-gc --max-old-space-size=2048 webServer/main.js
elif [ x"$APP" = x"api" ]; then
    node --expose-gc --max-old-space-size=2048 apiServer.js
else
    echo "Please provide valid \$APP variable: api or mainSite" 1>&2
    exit 1
fi
