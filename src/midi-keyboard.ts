import Synth from "./synth.ts";
import * as midi from "./midi.ts";
import * as tonnetz from "./layout/tonnetz.ts";


export default class MidiKeyboard extends HTMLElement {
	protected outputs: MIDIOutput[] = [new Synth()];
	protected activeNotes = new Set<number>();

	get shadowRoot() { return super.shadowRoot!; }
	get layout() { return this.getAttribute("layout"); }

	constructor() {
		super();
		this.attachShadow({mode:"open"});

		const { shadowRoot } = this;
		shadowRoot.addEventListener("pointerdown", this);
		shadowRoot.addEventListener("pointerup", this);
	}

	async connectedCallback() {
		const { shadowRoot } = this;

		let link = document.createElement("link");
		link.rel = "stylesheet";
		link.href = import.meta.resolve("./midi-keyboard.css");
		shadowRoot.replaceChildren(link);
		await linkLoaded(link);

		let size = [this.offsetWidth, this.offsetHeight];
		let layout = tonnetz.create(size, {});
		this.setAttribute("layout", "tonnetz");
		shadowRoot.append(layout);
	}

	handleEvent(e: PointerEvent) {
		switch (e.type) {
			case "pointerdown":
			case "pointerup":
				let node = (e.target as HTMLElement).closest<HTMLElement>("[data-notes]");
				if (!node) { return; }

//				node.setPointerCapture(e.pointerId);

				this.processEvent(node, e.type);
			break;
		}
	}

	protected processEvent(node: HTMLElement | SVGElement, type: "pointerdown" | "pointerup") {
		console.log(node, type);
		const { outputs } = this;
		let notes = node.dataset.notes!.split(",").map(Number);

		let channel = 0;
		let status = (type == "pointerdown" ? midi.NOTE_ON : midi.NOTE_OFF) + channel;

		notes.forEach(note => {
			let midiMessage = [status, note, 100];
			outputs.forEach(output => output.send(midiMessage));
			this.applyMidiMessage(midiMessage);
		});
	}

	protected applyMidiMessage(data: number[]) {
		const { activeNotes } = this;

		let [status, note, velocity] = data;
		switch (status & 0xF0) {
			case midi.NOTE_ON: velocity ? activeNotes.add(note) : activeNotes.delete(note); break;
			case midi.NOTE_OFF: activeNotes.delete(note); break;
		}

		this.syncActive(note);
	}

	protected syncActive(note: number) {
		const { activeNotes, shadowRoot } = this;

		[...shadowRoot.querySelectorAll<HTMLElement>(`[data-notes*="${note}"]`)].forEach(node => {
			let notes = node.dataset.notes!.split(",").map(Number);
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
