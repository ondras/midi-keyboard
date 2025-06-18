import { svg } from "../svg.ts";
import * as midi from "../midi.ts";


const NOTES = 12;
const DEFAULT_OPTIONS = {
	center: 60,
	step: 1
}

export type Options = typeof DEFAULT_OPTIONS;
type ChordType = "major" | "minor";
type Wrap = (n: number) => number;

export function resolveOptions(options: Partial<Options>) {
	return { ...DEFAULT_OPTIONS, ...options };
}

export function create(size: number[], options: Partial<Options>) {
	const resolvedOptions = resolveOptions(options);
	function w(n: number) { return wrap(n, resolvedOptions.center); }

	let fragment = document.createDocumentFragment();

	let minSize = Math.min(...size);
	let r = (minSize/2) * 0.78;
	let radius = minSize * 0.1;

	for (let i=0;i<NOTES;i++) {
		let angle = (i * Math.PI * 2) / NOTES - Math.PI/2; // start at the top
		let cx = size[0]/2 + Math.cos(angle) * r;
		let cy = size[1]/2 + Math.sin(angle) * r;
		cx = Math.round(cx) + 0.5;

		let note = w(resolvedOptions.center + i*resolvedOptions.step);
		let nodes = [
			createNote(note, radius),
			createChord(note, "major", radius, w),
			createChord(note, "minor", radius, w)
		];

		nodes.forEach(node => node.setAttribute("transform", `translate(${cx}, ${cy})`));
		fragment.append(...nodes);
	}

	return fragment;
}

function createNote(note: number, radius: number) {
	let g = svg("g");
	g.classList.add("note");
	g.dataset.notes = [note].join(",");
	g.style.setProperty("--hue", String(midi.noteToHue(note)));

	let path = svg("path");
	let a = Math.PI/6;
	let dx = Math.cos(a)*radius;
	let dy = Math.sin(a)*radius;
	path.setAttribute("d", `M 0 0 L ${-dx} ${-dy} A ${radius} ${radius} 0 0 1 ${dx} ${-dy} Z`);
	let text = svg("text");
	text.setAttribute("y", `${-radius/2}`)
	text.textContent = midi.noteNumberToLabel(note).toUpperCase();

	g.append(path, text);
	return g;
}

function createChord(rootNote: number, type: ChordType, radius: number, wrap: Wrap) {
	let g = svg("g");
	g.classList.add("chord");

	let path = svg("path");
	let text = svg("text");
	let xDirection = 0;
	let sweepFlag = 1;
	let a = Math.PI/6;
	let dx = Math.cos(a)*radius;
	let dy = Math.sin(a)*radius;

	switch (type) {
		case "major":
			xDirection = -1;
			sweepFlag = 1;
			text.textContent = "Maj";
			g.dataset.notes = [rootNote, rootNote+4, rootNote+7].map(wrap).join(",");
		break;
		case "minor":
			xDirection = 1;
			sweepFlag = 0;
			text.textContent = "Min";
			g.dataset.notes = [rootNote, rootNote+3, rootNote+7].map(wrap).join(",");
		break;
	}

	path.setAttribute("d", `M 0 0 v ${radius} A ${radius} ${radius} 0 0 ${sweepFlag} ${dx*xDirection} ${-dy} z`);
	text.setAttribute("x", `${radius*xDirection/2}`);
	text.setAttribute("y", `${radius/3}`);

	g.append(path, text);
	return g;
}

function wrap(note: number, center: number) {
	return center + ((note - center) % 12);
}
