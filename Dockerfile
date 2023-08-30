FROM node:16-alpine As build
ARG BRANCH

RUN apk update && apk upgrade && \
  apk add --no-cache bash git openssh

RUN apk add python3 make gcc g++

WORKDIR /usr/src/app

COPY --chown=node:node package.json package-lock.json ./

# We don't need the standalone Chromium
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD true
RUN npm install

COPY --chown=node:node . .

# Run the build command which creates the production bundle
RUN npm run build

# Set NODE_ENV environment variable
ENV NODE_ENV production

USER node

###################
# PRODUCTION
###################
FROM node:16-alpine As production

# Copy the bundled code from the build stage to the production image
COPY --chown=node:node --from=build /usr/src/app/node_modules ./node_modules
COPY --chown=node:node --from=build /usr/src/app/dist ./dist
COPY --chown=node:node --from=build /usr/src/app/.env ./.env
COPY --chown=node:node --from=build /usr/src/app/swagger.yaml ./swagger.yaml

# Start the server using the production build
# CMD [ "node", "dist/main.js" ]
CMD [ "node", "dist/test.js" ]
EXPOSE 3001
