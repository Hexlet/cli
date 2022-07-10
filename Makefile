setup: install

install:
	npm ci

test:
	DEBUG=hexlet npm test -- --colors --verbose

test-coverage:
	npm test -- --coverage --coverageProvider=v8

lint:
	npx eslint .

pkg:
	npx pkg package.json --out-path targets

publish:
	npx release-it

.PHONY: test
