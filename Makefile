setup: install

install:
	npm ci

test:
	npm test

test-coverage:
	npm test -- --coverage --coverageProvider=v8

lint:
	npx eslint .

publish:
	npm publish

pkg:
	npx pkg package.json --out-path targets

.PHONY: test

