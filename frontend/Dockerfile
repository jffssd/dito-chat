FROM node:10-alpine

RUN apk add --no-cache --virtual .persistent-deps \
  curl \
  openssl \
  make \
  gcc \
  g++ \
  python \
  py-pip

WORKDIR /usr/src/app

COPY . .

RUN npm install && npm install -g serve

EXPOSE 5000

CMD [ "serve", "-s", "build"]