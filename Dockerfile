FROM node:8
LABEL Dave Cremins <davecremins@gmail.com>

RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

COPY package.json /usr/src/app/
RUN npm install && npm cache clean --force
COPY . /usr/src/app

ENV NODE_ENV development
ENV APP mainSite
ENV PORT 5500

EXPOSE 5500

RUN chmod +x /usr/src/app/runServer.sh
CMD ["/bin/bash" , "-c" , "/usr/src/app/runServer.sh"]