NODE_ARGS=--expose-gc

install:
	npm install

clean:
	rm -rf node_modules

website:
	node $(NODE_ARGS) webServer.js

api:
	node $(NODE_ARGS) apiServer.js
