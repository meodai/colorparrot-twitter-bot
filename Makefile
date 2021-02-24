include .env
export $(shell sed 's/=.*//' .env)

start:
	npm start

dev:
	npm run start:dev