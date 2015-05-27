all: build minify headerify

build:
	@browserify lib/index.js --standalone hookly > hookly.js

minify:
	@uglifyjs hookly.js --compress --mangle --stats --output hookly.min.js --source-map hookly.min.js.map

headerify:
	@cat ./lib/header.js
	@cat ./lib/header.js > tmp.js && cat hookly.js >> tmp.js && mv tmp.js hookly.js
	@cat ./lib/header.js > tmp.js && cat hookly.min.js >> tmp.js && mv tmp.js hookly.min.js

clean:
	@rm hookly.js hookly.min.js hookly.min.js.map

test:
	./node_modules/.bin/minijasminenode2 --verbose --forceexit **/*_spec.js


