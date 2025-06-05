export function svg<K extends keyof SVGElementTagNameMap>(name: K): SVGElementTagNameMap[K] {
	return document.createElementNS("http://www.w3.org/2000/svg", name);
}
