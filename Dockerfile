# 
# On local machine contains many project
# Different project using different node & npm version
# To avoid effect with each other 
# Tried to run apps in the docker container
#
FROM node:12

RUN mkdir -p /cruise-radar

WORKDIR /cruise-radar

COPY . .

RUN npm i

CMD npm run dev

