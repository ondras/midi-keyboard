import Synth from "./synth.ts";
import * as midi from "./midi.ts";
import * as tonnetz from "./layout/tonnetz.ts";
import * as circle from "./layout/circle.ts";
import { svg as svgNode } from "./svg.ts";

import "./midi-keyboard-config.ts";


export type Options = ({type:"tonnetz"}&Partial<tonnetz.Options>) | ({type:"circle"}&Partial<circle.Options>);

export default class MidiKeyboard extends HTMLElement {
	protected outputs: MIDIOutput[] = [new Synth()];
	protected svg = svgNode("svg");
	protected _options: Options;

	// active notes, can be held multiple times
	protected activeNotes = new Map<number, number>();

	get shadowRoot() { return super.shadowRoot!; }
	get layout() { return this.getAttribute("layout"); }
	get options() { return this._options; }

	constructor() {
		super();
		this.attachShadow({mode:"open"});

		const { shadowRoot, svg } = this;
		shadowRoot.addEventListener("pointerdown", this);

		let ro = new ResizeObserver(() => this.redraw());
		ro.observe(svg);

		midi.requestAccess().then(midiAccess => {
			let outputs = [...midiAccess.outputs.values()];
			this.outputs.push(...outputs);
		});
	}

	protected redraw() {
		const { svg, offsetWidth, offsetHeight, options } = this;
		if (!options) { return; }

		let size = [offsetWidth, offsetHeight];

		switch (options.type) {
			case "tonnetz": svg.replaceChildren(tonnetz.create(size, options)); break;
			case "circle": svg.replaceChildren(circle.create(size, options)); break;
		}
	}

	configure(options: Options) {
		this._options = options;
		this.setAttribute("layout", options.type);
		this.dispatchEvent(new Event("change"));
		this.redraw();
	}

	async connectedCallback() {
		const { shadowRoot, svg } = this;

		let link = document.createElement("link");
		link.rel = "stylesheet";
		link.href = import.meta.resolve("./midi-keyboard.css");
		shadowRoot.replaceChildren(link, svg);
		await linkLoaded(link);

		this.configure({
			type: "tonnetz"
//			type: "circle"
		})
	}

	handleEvent(e: PointerEvent) {
		let node = (e.target as HTMLElement).closest<HTMLElement>("[data-notes]");
		if (!node) { return; }

		switch (e.type) {
			case "pointerdown":
				let ac = new AbortController();
				let { signal } = ac;
				let abort = () => {
					ac.abort();
					this.processEvent(node, "off");
				}
				node.addEventListener("pointerup", abort, {signal})
				node.addEventListener("pointerleave", abort, {signal})
				this.processEvent(node, "on");
				node.parentNode!.append(node);
			break;
		}
	}

	protected processEvent(node: HTMLElement | SVGElement, type: "on" | "off") {
		const { outputs, activeNotes } = this;
		let nodeNotes = parseNotes(node);

		let channel = 0;
		let changedNotes: number[] = [];

		nodeNotes.forEach(note => {
			let playingCount = activeNotes.get(note) || 0;
			playingCount += (type == "on" ? 1 : -1);

			if (playingCount == 0) { // stopped
				activeNotes.delete(note);
				changedNotes.push(note);
				let midiMessage = [midi.NOTE_OFF+channel, note, 100];
				outputs.forEach(output => output.send(midiMessage));
			} else {
				activeNotes.set(note, playingCount);
				if (playingCount == 1) { // started
					changedNotes.push(note);
					let midiMessage = [midi.NOTE_ON+channel, note, 100];
					outputs.forEach(output => output.send(midiMessage));
				}
			}
		});

		changedNotes.forEach(note => this.syncActive(note));
	}

	protected onMidiMessage(data: number[]) {
		const { activeNotes } = this;

		let [status, note, velocity] = data;
		switch (status & 0xF0) {
			case midi.NOTE_ON: velocity ? activeNotes.set(note, 1) : activeNotes.delete(note); break;
			case midi.NOTE_OFF: activeNotes.delete(note); break;
		}

		this.syncActive(note);
	}

	protected syncActive(note: number) {
		const { activeNotes, shadowRoot } = this;

		[...shadowRoot.querySelectorAll<HTMLElement>(`[data-notes*="${note}"]`)].forEach(node => {
			let notes = parseNotes(node);
			let isActive = notes.every(note => activeNotes.has(note));
			node.classList.toggle("active", isActive);
		});
	}
}
customElements.define("midi-keyboard", MidiKeyboard);

function linkLoaded(link: Element) {
	let { resolve, promise } = Promise.withResolvers();
	link.addEventListener("load", resolve);
	return promise;
}

function parseNotes(node: HTMLElement | SVGElement) {
	return node.dataset.notes!.split(",").map(Number);
}
