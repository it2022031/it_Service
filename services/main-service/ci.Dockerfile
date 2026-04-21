FROM node:iron-alpine
ARG NPM_TOKEN
ENV NPM_TOKEN $NPM_TOKEN
COPY . /app

WORKDIR /app

RUN echo //npm.pkg.github.com/:_authToken=$NPM_TOKEN >> ~/.npmrc
RUN echo @quintessential-sft:registry=https://npm.pkg.github.com/ >> ~/.npmrc
RUN yarn install --production --pure-lockfile --non-interactive --cache-folder ./ycache; rm -rf ./ycache

EXPOSE 5000

WORKDIR /app/services/main-service

CMD ["yarn", "start"]
