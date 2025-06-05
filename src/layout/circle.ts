import { svg } from "../svg.ts";
import * as midi from "../midi.ts";


const NOTES = 12;
export const DEFAULT_OPTIONS = {
	center: 60,
	step: 1,
	edge: 60
}

export type Options = typeof DEFAULT_OPTIONS;
type ChordType = "major" | "minor";

export function create(size: number[], options: Partial<Options>) {
	let resolvedOptions = { ...DEFAULT_OPTIONS, ...options };
	let fragment = document.createDocumentFragment();

	let minSize = Math.min(...size);
	let r = (minSize/2) * 3/4;

	for (let i=0;i<NOTES;i++) {
		let angle = (i * Math.PI * 2) / NOTES;
		angle -= Math.PI/2; // start at the top
		let cx = size[0]/2 + Math.cos(angle) * r;
		let cy = size[1]/2 + Math.sin(angle) * r;

		let note = resolvedOptions.center + i*resolvedOptions.step % 12;
		let noteNode = createNote(note);
		noteNode.setAttribute("transform", `translate(${cx}, ${cy-resolvedOptions.edge/2})`);

		let chordMajor = createChord(note, "major", resolvedOptions);
		chordMajor.setAttribute("transform", `translate(${cx-resolvedOptions.edge/3}, ${cy+resolvedOptions.edge/3})`);

		let chordMinor = createChord(note, "minor", resolvedOptions);
		chordMinor.setAttribute("transform", `translate(${cx+resolvedOptions.edge/3}, ${cy+resolvedOptions.edge/3})`);

		fragment.append(noteNode, chordMajor, chordMinor);
	}

	return fragment;
}

function createNote(note: number) {
	let g = svg("g");
	g.classList.add("note");
	g.dataset.notes = [note].join(",");

	let circle = svg("circle");
	let text = svg("text");
	text.textContent = midi.noteNumberToLabel(note).toUpperCase();

	g.append(circle, text);

	return g;
}

function createChord(rootNote: number, type: ChordType, resolvedOptions: Options) {
	const height = Math.sqrt(3)/2 * resolvedOptions.edge;

	let g = svg("g");
	g.classList.add("chord");

	let path = svg("path");
	let text = svg("text");
	let label = midi.noteNumberToLabel(rootNote);
	let yDirection = 0;

	switch (type) {
		case "major":
			yDirection = -1;
			text.textContent = label.toUpperCase();
			g.dataset.notes = [rootNote, rootNote+4, rootNote+7].join(",");
		break;
		case "minor":
			yDirection = 1;
			text.textContent = label.toLowerCase();
			g.dataset.notes = [rootNote, rootNote+3, rootNote+7].join(",");
		break;
	}

	path.setAttribute("d", `M ${-resolvedOptions.edge/2} ${yDirection*height/2} h ${resolvedOptions.edge} l ${-resolvedOptions.edge/2} ${-yDirection*height} Z`);
	text.setAttribute("y", `${yDirection * height / 6}`);

	g.append(path, text);
	return g;
}
