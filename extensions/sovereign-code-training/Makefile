.PHONY: build watch test lint clean

build:
	npm run build

watch:
	npm run watch

test:
	npm test

lint:
	npm run lint

clean:
	rm -rf dist node_modules

install:
	npm install

pretest: build

.DEFAULT_GOAL := build
