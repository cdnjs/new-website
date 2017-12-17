NODE_ARGS=--expose-gc
IMAGE_NAME=cdnjs-new-website

install:
	npm install

clean:
	rm -rf node_modules

website:
	node $(NODE_ARGS) webServer.js

api:
	node $(NODE_ARGS) apiServer.js

build-dev-container:
	@docker build . -t $(IMAGE_NAME)

run-dev-container:
	@docker run --name=$(IMAGE_NAME) -p 5500:5500 -d $(IMAGE_NAME)

stop-dev-container:
	@docker stop $(IMAGE_NAME)
	@docker rm $(IMAGE_NAME)

container-logs:
	@docker logs $(IMAGE_NAME)