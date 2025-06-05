import * as midi from "../midi.ts";


type MainAxisType = "horizontal" | "vertical";
type ChordType = "major" | "minor";
export const DEFAULT_OPTIONS = {
	center: 60,
	edge: 100,
	mainAxis: "horizontal" as MainAxisType,
	invert: false
}

export type Options = typeof DEFAULT_OPTIONS;
const MAIN_AXIS_STEP = 7;

export function create(size: number[], options: Partial<Options>) {
	let resolvedOptions = { ...DEFAULT_OPTIONS, ...options };
	const CROSS_AXIS_STEP = (resolvedOptions.invert ? 4 : 3);
	const invertY = (resolvedOptions.mainAxis == "vertical" ? -1 : 1);

	let node = svg("svg");
	let chordGroup = svg("g");
	let noteGroup = svg("g");
	node.append(chordGroup, noteGroup);

	let [mainSize, crossSize] = size;
	if (resolvedOptions.mainAxis == "vertical") { [mainSize, crossSize] = [crossSize, mainSize]; }

	const stripeHeight = Math.sqrt(3)/2 * resolvedOptions.edge;
	let stripesHalf = Math.ceil((crossSize/2) / stripeHeight);
	let notesHalf = Math.ceil((mainSize/2) / resolvedOptions.edge);

	for (let stripeIndex of fromto(stripesHalf)) {
		let isOddRow = Math.abs(stripeIndex % 2);
		let rowCenterNote = resolvedOptions.center - stripeIndex * CROSS_AXIS_STEP;
		rowCenterNote += Math.ceil(stripeIndex/2) * MAIN_AXIS_STEP;

		for (let noteIndex of fromto(notesHalf)) {
			let note = rowCenterNote + noteIndex * MAIN_AXIS_STEP;
			if (note < midi.NOTE_MIN || note > midi.NOTE_MAX) { continue; }

			let mainPosition = mainSize/2 + invertY*resolvedOptions.edge*(noteIndex + isOddRow/2);
			let crossPosition = crossSize/2 + stripeIndex*stripeHeight;

			[mainPosition, crossPosition] = [Math.round(mainPosition), Math.round(crossPosition)+0.5];
			let translate = computeTranslate(mainPosition, crossPosition, resolvedOptions.mainAxis);

			let noteNode = createNote(note);
			noteNode.setAttribute("transform", translate);
			noteGroup.append(noteNode);

			if (noteIndex < notesHalf) {
				if (stripeIndex > -stripesHalf) { // up/left: minor on normal, major on inverted
					let type: ChordType = (resolvedOptions.invert ? "minor" : "major");
					let chordLeftOrUp = createChord(note, type, resolvedOptions);
					chordLeftOrUp.setAttribute("transform", translate);
					chordGroup.append(chordLeftOrUp);
				}

				if (stripeIndex < stripesHalf) { // down/right: major on normal, minor on inverted
					let type: ChordType = (resolvedOptions.invert ? "major" : "minor");
					let chordRightOrDown = createChord(note, type, resolvedOptions);
					chordRightOrDown.setAttribute("transform", translate);
					chordGroup.append(chordRightOrDown);
				}
			}
		}
	}

	return node;
}

function computeTranslate(mainPosition: number, crossPosition: number, mainAxis: MainAxisType) {
	switch (mainAxis) {
		case "horizontal": return `translate(${mainPosition} ${crossPosition})`; break;
		case "vertical": return `translate(${crossPosition} ${mainPosition})`; break;
	}
}

function createNote(note: number) {
	let g = svg("g");
	g.classList.add("note");
	g.dataset.notes = [note].join(",");

	let circle = svg("circle");
	let text = svg("text");
	text.textContent = midi.noteNumberToLabel(note);

	g.append(circle, text);

	return g;
}

function createChord(rootNote: number, type: ChordType, resolvedOptions: Options) {
	const stripeHeight = Math.sqrt(3)/2 * resolvedOptions.edge;

	let g = svg("g");
	g.classList.add("chord");

	let path = svg("path");
	let text = svg("text");
	let label = midi.noteNumberToLabel(rootNote);
	let midpointFactor = (resolvedOptions.invert ? -1 : 1);

	switch (type) {
		case "major":
			midpointFactor *= 1;
			text.textContent = label.toUpperCase();
			g.dataset.notes = [rootNote, rootNote+4, rootNote+7].join(",");
		break;
		case "minor":
			midpointFactor *= -1;
			text.textContent = label.toLowerCase();
			g.dataset.notes = [rootNote, rootNote+3, rootNote+7].join(",");
		break;
	}

	switch (resolvedOptions.mainAxis) {
		case "horizontal":
			path.setAttribute("d", `M 0 0 h ${resolvedOptions.edge} l ${-resolvedOptions.edge/2} ${midpointFactor*stripeHeight} Z`);
			text.setAttribute("x", `${resolvedOptions.edge/2}`);
			text.setAttribute("y", `${midpointFactor*stripeHeight/3}`);
		break;
		case "vertical":
			path.setAttribute("d", `M 0 0 v ${-resolvedOptions.edge} l ${midpointFactor*stripeHeight} ${resolvedOptions.edge/2} Z`);
			text.setAttribute("x", `${midpointFactor*stripeHeight/3}`);
			text.setAttribute("y", `${-resolvedOptions.edge/2}`);
		break;
	}

	g.append(path, text);
	return g;
}

function svg<K extends keyof SVGElementTagNameMap>(name: K): SVGElementTagNameMap[K] {
	return document.createElementNS("http://www.w3.org/2000/svg", name);
}

function* range(begin: number, end: number, step=1) {
	for (let i=begin; i<end; i+=step) { yield i; }
}

function fromto(amount: number) { return range(-amount, amount+1); }
