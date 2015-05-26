
all: build minify

build:
	@browserify lib/index.js --standalone hookly > hookly.js

minify:
	@uglifyjs hookly.js --compress --mangle --stats --output hookly.min.js --source-map hookly.min.js.map

clean:
	@rm hookly.js hookly.min.js hookly.min.js.map

test:
	./node_modules/minijasminenode2/bin/minijn --verbose --forceexit **/*_spec.js


