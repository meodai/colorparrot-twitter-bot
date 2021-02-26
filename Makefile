include .env
export $(shell sed 's/=.*//' .env)

start:
	npm start

dev:
	npm run start:dev

upgrade-deps:
	npm upgrade color-name-list@latest