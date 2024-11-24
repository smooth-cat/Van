import { el } from "../runtime/el";
import { template } from "../runtime/template";
import './icon.less';

export const Icon = (data, props) => {
	const ref = (dom: HTMLElement) => {
		const node = template(props.i);
		dom.appendChild(node!);
	}

	return () => {
		const { i, ...divProps } = props;
		const extClass = divProps.class ? divProps.class + ' icon-wrap' : 'icon-wrap';
		return [
			el('div', { ref, ...divProps, class: extClass, style: `font-size: ${props.size}px` })
		]
	}
}