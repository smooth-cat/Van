import { el } from "./el";

export function template(html: string) {
	const temp = document.createElement('template');
	temp.innerHTML = html;
	return temp.content.firstChild;
}

export const PureFC = (data, props) => {
	const ref = (dom: HTMLElement) => {
		const node = template(props.innerHTML);
		dom.appendChild(node!);
	}

	return () => {
		const { innerHTML, ...divProps } = props;
		return [
			el('div', { ref, ...divProps })
		]
	}
}