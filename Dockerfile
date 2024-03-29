
FROM mhart/alpine-node:10 AS build
WORKDIR /srv
ADD package.json .
RUN npm install
ADD . .

FROM mhart/alpine-node:base-10
COPY --from=build /srv .
EXPOSE 3000
CMD ["node", "index.js"]