import * as midi from "./midi.ts";


export default class Synth extends EventTarget implements MIDIOutput {
	readonly id = "synth";
	readonly manufacturer = "ondras";
	readonly name = "web audio synth";
	readonly type = "output";
	readonly version = "0.0.1";
	readonly state = "connected";
	readonly connection = "open";
	onstatechange = null;

	protected ctx = new AudioContext();
	protected playing = new Map<number, OscillatorNode>();

	async open() { return this; }
	async close() { return this; }

	send(data: number[], timestamp?: DOMHighResTimeStamp) {
		let [status, note, velocity] = data;
		switch (status & 0xF0) {
			case midi.NOTE_ON: velocity ? this.noteOn(note) : this.noteOff(note); break;
			case midi.NOTE_OFF: this.noteOff(note); break;
		}
	}

	protected noteOn(note: number) {
		const { playing, ctx } = this;
		if (playing.has(note)) { return; }

		let oscillator = ctx.createOscillator();
		oscillator.frequency.value = midi.noteNumberToFrequency(note);
		oscillator.connect(ctx.destination);
		oscillator.start();

		playing.set(note, oscillator);
	}

	protected noteOff(note: number) {
		const { playing } = this;

		let oscillator = playing.get(note);
		if (!oscillator) { return; }

		oscillator.stop();
		playing.delete(note);
	}
}
