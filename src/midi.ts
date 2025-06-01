export const NOTE_ON = 0x90;
export const NOTE_OFF = 0x80;

export const NOTE_MIN = 21;
export const NOTE_MAX = 127;

const NAMES = ["A", "B♭", "B", "C", "C♯", "D", "D♯", "E", "F", "F♯", "G", "G♯"];

export function noteNumberToFrequency(n: number) {
	return 440 * (2 ** ((n-69)/12));
}

export function noteNumberToLabel(n: number) {
	return NAMES[(n+3) % NAMES.length];
}
