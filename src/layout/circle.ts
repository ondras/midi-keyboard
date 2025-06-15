import { svg } from "../svg.ts";
import * as midi from "../midi.ts";


const NOTES = 12;
export const DEFAULT_OPTIONS = {
	center: 60,
	step: 1,
	radius: 50
}

export type Options = typeof DEFAULT_OPTIONS;
type ChordType = "major" | "minor";

export function create(size: number[], options: Partial<Options>) {
	const resolvedOptions = { ...DEFAULT_OPTIONS, ...options };

	let fragment = document.createDocumentFragment();

	let minSize = Math.min(...size);
	let r = (minSize/2) * 3/4;
	let radius = minSize * 0.08;

	for (let i=0;i<NOTES;i++) {
		let angle = (i * Math.PI * 2) / NOTES;
		angle -= Math.PI/2; // start at the top
		let cx = size[0]/2 + Math.cos(angle) * r;
		let cy = size[1]/2 + Math.sin(angle) * r;
		cx = Math.round(cx) + 0.5;
		cy = Math.round(cy) + 0.5;

		let note = resolvedOptions.center + i*resolvedOptions.step % 12;

		let noteNode = createNote(note, radius);
		noteNode.style.setProperty("--hue", String(midi.noteToHue(note)));
		let chordMajor = createChord(note, "major", radius);
		let chordMinor = createChord(note, "minor", radius);

		[noteNode, chordMajor, chordMinor].forEach(node => {
			node.setAttribute("transform", `translate(${cx}, ${cy})`);
			fragment.append(node);
		});
	}

	return fragment;
}

function createNote(note: number, radius: number) {
	let g = svg("g");
	g.classList.add("note");
	g.dataset.notes = [note].join(",");

	let path = svg("path");
	path.setAttribute("d", `M ${-radius} 0 h ${2*radius} a ${radius} ${radius} 0 1 0 ${-2*radius} 0`);
	let text = svg("text");
	text.setAttribute("y", `${-radius/2}`)
	text.textContent = midi.noteNumberToLabel(note).toUpperCase();

	g.append(path, text);

	return g;
}

function createChord(rootNote: number, type: ChordType, radius: number) {
	let g = svg("g");
	g.classList.add("chord");

	let path = svg("path");
	let text = svg("text");
	let xDirection = 0;
	let sweepFlag = 1;

	switch (type) {
		case "major":
			xDirection = -1;
			sweepFlag = 1;
			text.textContent = "Maj";
			g.dataset.notes = [rootNote, rootNote+4, rootNote+7].map(fit).join(",");
		break;
		case "minor":
			xDirection = 1;
			sweepFlag = 0;
			text.textContent = "Min";
			g.dataset.notes = [rootNote, rootNote+3, rootNote+7].map(fit).join(",");
		break;
	}

	path.setAttribute("d", `M 0 0 v ${radius} a ${radius} ${radius} 0 0 ${sweepFlag} ${radius*xDirection} ${-radius} z`);
	text.setAttribute("x", `${radius*xDirection/2.5}`);
	text.setAttribute("y", `${radius/2.5}`);

	g.append(path, text);
	return g;
}

function fit(note: number) {
	return 60 + ((note - 60) % 12);
}