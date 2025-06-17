import type MidiKeyboard from "./midi-keyboard.ts";
import type { Options } from "./midi-keyboard.ts";

import * as midi from "./midi.ts";
import * as circle from "./layout/circle.ts";
import * as tonnetz from "./layout/tonnetz.ts";


export default class MidiKeyboardConfig extends HTMLElement {
	static get observedAttributes() { return ["for"]; }
	protected midiKeyboard?: MidiKeyboard;

	get shadowRoot() { return super.shadowRoot!; }
	protected getForm(name: string) { return this.shadowRoot.querySelector<HTMLFormElement>(`form[name="${name}"]`)!; }
	protected get layout() { return this.shadowRoot.querySelector<HTMLSelectElement>("[name=layout]")!; }

	constructor() {
		super();
		this.attachShadow({mode:"open"});
		this.hidden = true;
	}

	async attributeChangedCallback(name: string, oldValue: string, newValue: string) {
		switch (name) {
			case "for":
				if (!newValue) { return; }
				let node = document.getElementById(newValue);
				if (!node) { return; }
				await customElements.whenDefined(node.localName);
				let mk = node as MidiKeyboard;

				this.midiKeyboard = mk;
				this.loadConfig(mk);

				mk.addEventListener("change", _ => this.loadConfig(mk)); // fixme removeeventlistener
			break;
		}
	}

	connectedCallback() {
		const { shadowRoot } = this;
		shadowRoot.innerHTML = HTML;

		let link = document.createElement("link");
		link.rel = "stylesheet";
		link.href = import.meta.resolve("./midi-keyboard-config.css");
		shadowRoot.append(link);

		let tonnetz = this.getForm("tonnetz");
		generateTones(tonnetz.elements["root"]);
		generateOctaves(tonnetz.elements["octave"]);

		let circle = this.getForm("circle");
		generateTones(circle.elements["root"]);
		generateOctaves(circle.elements["octave"]);

		shadowRoot.querySelector("[name=ear]")!.addEventListener("click", _ => this.hidden = !this.hidden);

		[tonnetz, circle].forEach(form => form.addEventListener("input", e => {
			const { midiKeyboard } = this;
			if (!midiKeyboard) { return; }

			let config = this.getConfig();
			midiKeyboard.configure(config);
		}));

		this.layout.addEventListener("change", e => {
			const { midiKeyboard, layout } = this;
			if (!midiKeyboard) { return; }

			midiKeyboard.configure({type: layout.value} as Options);
		})
	}

	protected loadConfig(midiKeyboard: MidiKeyboard) {
		const { layout } = this;
		let options = midiKeyboard.options;

		if (!options) {
			layout.value = "";
			return;
		}

		layout.value = options.type;
		let form = this.getForm(options.type);

		switch (options.type) {
			case "circle": {
				let resolvedOptions = circle.resolveOptions(options);
				form.elements["step"].value = resolvedOptions.step;
				form.elements["root"].value = resolvedOptions.center % 12;
				form.elements["octave"].value = Math.floor(resolvedOptions.center/12)-2;
			} break;

			case "tonnetz": {
				let resolvedOptions = tonnetz.resolveOptions(options);
				form.elements["wrap"].checked = resolvedOptions.wrap;
				form.elements["invert"].checked = resolvedOptions.invert;
				form.elements["direction"].value = resolvedOptions.mainAxis;
				form.elements["root"].value = resolvedOptions.center % 12;
				form.elements["octave"].value = Math.floor(resolvedOptions.center/12)-2;
			} break;
		}
	}

	protected getConfig(): Options {
		const { layout } = this;
		const type = layout.value as "circle" | "tonnetz";
		let form = this.getForm(type);

		switch (type) {
			case "circle":
				return {
					type,
					step: Number(form.elements["step"].value),
					center: 12*(Number(form.elements["octave"].value)+2) + Number(form.elements["root"].value)
				}
			break;

			case "tonnetz":
				return {
					type,
					center: 12*(Number(form.elements["octave"].value)+2) + Number(form.elements["root"].value),
					wrap: form.elements["wrap"].checked,
					invert: form.elements["invert"].checked,
					mainAxis: form.elements["direction"].value
				}
			break;
		}
	}
}

const HTML = `
<label>Layout:
	<select name="layout">
		<option value="tonnetz">Tonnetz</option>
		<option value="circle">Circle</option>
	</select>
</label>

<form name="tonnetz">
	<label>Root note: <select name="root"></select></label>
	<label>Octave: <select name="octave"></select></label>
	<label>Direction: <select name="direction">
		<option value="horizontal">Horizontal</option>
		<option value="vertical">Vertical</option>
	</select></label>
	<label>Invert: <input type="checkbox" name="invert" /></label>
	<label>Wrap: <input type="checkbox" name="wrap" /></label>
	<label>Edge length: <input type="range" name="edge" min="50" max="150" /></label>
</form>

<form name="circle">
	<label>Root note: <select name="root"></select></label>
	<label>Octave: <select name="octave"></select></label>
	<label>Step: <select name="step">
		<option value="1">1 semitone</option>
		<option value="5">5 semitones (4ths)</option>
		<option value="7">7 semitones (5ths)</option>
	</select></label>
</form>

<button name="ear">⚙️</button>
`;

function generateTones(select: HTMLSelectElement) {
	for (let i=0;i<12;i++) {
		let option = new Option(midi.noteNumberToLabel(i), String(i));
		select.append(option);
	}
}

function generateOctaves(select: HTMLSelectElement) {
	for (let i=0;i<7;i++) {
		let option = new Option(String(i));
		select.append(option);
	}
}

customElements.define("midi-keyboard-config", MidiKeyboardConfig);
