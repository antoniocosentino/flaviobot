FROM node:6.9.5

EXPOSE 1811

WORKDIR /opt/

# for better use of docker layer caching
COPY ./package.json /opt/package.json

RUN npm install --silent

RUN npm install nodemon -g --silent

COPY ./ /opt/

CMD ["nodemon" ]
