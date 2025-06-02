import * as midi from "../midi.ts";


export const DEFAULT_OPTIONS = {
	center: 60,
	edge: 100,
	mainStep: 7,
	topRightStep: 3
}

export type Options = typeof DEFAULT_OPTIONS;


export function create(size: number[], options: Partial<Options>) {
	let node = svg("svg");
	let chordGroup = svg("g");
	let noteGroup = svg("g");
	node.append(chordGroup, noteGroup);

	let resolvedOptions = { ...DEFAULT_OPTIONS, ...options };

	let [mainSize, crossSize] = size;
	const rowHeight = Math.sqrt(3)/2 * resolvedOptions.edge;

	let rowsHalf = Math.ceil((crossSize/2) / rowHeight);
	let notesHalf = Math.ceil((mainSize/2) / resolvedOptions.edge);

	for (let y of fromto(rowsHalf)) {
		let isOddRow = Math.abs(y % 2);
		let rowCenterNote = resolvedOptions.center - y * resolvedOptions.topRightStep;
		rowCenterNote += Math.ceil(y/2) * resolvedOptions.mainStep;

		for (let x of fromto(notesHalf)) {
			let note = rowCenterNote + x * resolvedOptions.mainStep;
			if (note < midi.NOTE_MIN || note > midi.NOTE_MAX) { continue; }

			let mainPosition = mainSize/2 + x*resolvedOptions.edge + isOddRow*resolvedOptions.edge/2;
			let crossPosition = crossSize/2 + y*rowHeight;

			[mainPosition, crossPosition] = [Math.round(mainPosition), Math.round(crossPosition)+0.5];

			let noteDom = createNote(midi.noteNumberToLabel(note));
			noteDom.node.setAttribute("transform", `translate(${mainPosition} ${crossPosition})`);
			noteDom.dataset.notes = [note].join(",");
			noteGroup.append(noteDom.node);

			if (x < notesHalf) {
				let label = midi.noteNumberToLabel(note);

				if (y > -rowsHalf) {
					let chordUp = createChord(label.toLowerCase()); // fixme zalezi na topRightStep
					chordUp.node.setAttribute("transform", `translate(${mainPosition} ${crossPosition})`);
					chordUp.dataset.notes = [note, note+resolvedOptions.topRightStep, note+resolvedOptions.mainStep].join(",");
					chordUp.path.setAttribute("d", `M 0 0 l ${resolvedOptions.edge/2} ${-rowHeight} l ${resolvedOptions.edge/2} ${rowHeight} Z`);
					chordUp.text.setAttribute("x", `${resolvedOptions.edge/2}`);
					chordUp.text.setAttribute("y", `${-rowHeight/3}`);
					chordGroup.append(chordUp.node);
				}

				if (y < rowsHalf) {
					let chordDown = createChord(label.toUpperCase());
					chordDown.node.setAttribute("transform", `translate(${mainPosition} ${crossPosition})`);
					chordDown.dataset.notes = [note, note+resolvedOptions.mainStep-resolvedOptions.topRightStep, note+resolvedOptions.mainStep].join(",");
					chordDown.path.setAttribute("d", `M 0 0 l ${resolvedOptions.edge/2} ${rowHeight} l ${resolvedOptions.edge/2} ${-rowHeight} Z`);
					chordDown.text.setAttribute("x", `${resolvedOptions.edge/2}`);
					chordDown.text.setAttribute("y", `${rowHeight/3}`);
					chordGroup.append(chordDown.node);
				}
			}
		}
	}

	return node;
}

function createNote(name: string) {
	let g = svg("g");
	g.classList.add("note");

	let circle = svg("circle");
	let text = svg("text");
	text.textContent = name;

	g.append(circle, text);

	return { node: g, dataset: g.dataset, text };
}

function createChord(name: string) {
	let g = svg("g");
	g.classList.add("chord");

	let path = svg("path");
	let text = svg("text");
	text.textContent = name;

	g.append(path, text);

	return {
		node: g,
		dataset: g.dataset,
		path,
		text
	}
}

function svg<K extends keyof SVGElementTagNameMap>(name: K): SVGElementTagNameMap[K] {
	return document.createElementNS("http://www.w3.org/2000/svg", name);
}

function* range(begin: number, end: number, step=1) {
	for (let i=begin; i<end; i+=step) { yield i; }
}

function fromto(amount: number) { return range(-amount, amount+1); }
