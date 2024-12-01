import { el, IEl, text } from '../runtime/el';
import { FC } from '../runtime/type';
import './tooltip.less'
export type Props = {
	els: IEl[],
	tip: string,
	class?: string,
}
type Data = {
	
}

export const Tooltip: FC<Data, Props> = (data, props) => {
	return () => {
		const { class: className='' } = props;
		return [
			el('div', { class: `tooltip-wrap ${className}` }, [
				el('div', { class: 'tooltip-inner', tip: props.tip }, props.els)
			])
		]
	}
}