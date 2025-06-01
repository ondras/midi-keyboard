midi-keyboard.js: src/*.ts src/**/*.ts
	deno run -A jsr:@orgsoft/dsbuild --in src/midi-keyboard.ts --out $@

check:
	deno check $(MAIN)
