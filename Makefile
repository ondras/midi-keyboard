DSBUILD := jsr:@orgsoft/dsbuild

midi-keyboard.js: src/*.ts src/**/*.ts
	deno run -A $(DSBUILD) --in src/midi-keyboard.ts --out $@

watch:
	deno run -A $(DSBUILD) --in src/midi-keyboard.ts --out midi-keyboard.js --live

check:
	deno check $(MAIN)
