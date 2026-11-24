FROM node:24-alpine
WORKDIR /app
COPY --chown=node:node package.json server.mjs ./
COPY --chown=node:node public ./public
RUN mkdir -p /app/data && chown node:node /app/data
USER node
ENV HOST=0.0.0.0 PORT=8080 DB_PATH=/app/data/chargewise.sqlite
EXPOSE 8080
VOLUME /app/data
CMD ["node","server.mjs"]
