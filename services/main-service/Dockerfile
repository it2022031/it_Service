FROM node:iron-slim
ARG NPM_TOKEN
ENV NPM_TOKEN $NPM_TOKEN
WORKDIR /app

COPY . .

WORKDIR /app

RUN echo //npm.pkg.github.com/:_authToken=$NPM_TOKEN >> ~/.npmrc
RUN echo @quintessential-sft:registry=https://npm.pkg.github.com/ >> ~/.npmrc
RUN yarn install --pure-lockfile --non-interactive && yarn build

ENV CONDUIT_SERVER conduit_server

ENV SERVICE_URL 0.0.0.0:5000
ENV SERVICE_IP 0.0.0.0:5000
ENV GRPC_PORT 5000
ENV REGISTER_NAME true

EXPOSE 5000

CMD ["yarn", "start"]
