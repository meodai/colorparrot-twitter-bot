include .env

start:
	export $(shell sed 's/=.*//' .env)
	npm start