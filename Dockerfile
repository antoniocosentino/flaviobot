FROM node:12.3.1

EXPOSE 80

WORKDIR /opt/

# for better use of docker layer caching
COPY ./package.json /opt/package.json

RUN npm install --silent

RUN npm install nodemon -g --silent

COPY ./ /opt/

CMD ["nodemon" ]
