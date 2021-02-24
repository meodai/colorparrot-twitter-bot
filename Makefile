include .env

start:
	export $(shell sed 's/=.*//' .env)
	npm start

dev:
	export $(shell sed 's/=.*//' .env)
	npm run start:dev