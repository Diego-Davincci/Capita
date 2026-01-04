FROM node:22-alpine AS build

# install dependencies + build
WORKDIR /app

COPY package.json yarn.lock ./

RUN yarn install --frozen-lockfile

ENV PATH /app/node_modules/.bin:$PATH

COPY . .

ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

RUN yarn build

# nginx server
FROM nginx:1.25.4-alpine3.18

COPY ./nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /var/www/html/

EXPOSE 5173

ENTRYPOINT [ "nginx", "-g", "daemon off;" ]
