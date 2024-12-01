import { el, IEl, text } from '../runtime/el';
import { FC } from '../runtime/type';
import './tooltip.less'
export type Props = {
	els: IEl[],
	tip: string,
	class?: string,
	needOverflow?: boolean,
	type?: 'top'|'top-left'|'top-right'|'bottom'|'bottom-left'|'bottom-right'
}
type Data = {
	
}

export const Tooltip: FC<Data, Props> = (data, props) => {
	return () => {
		const { class: className='', type = 'top-left' } = props;

		const space = '2px';

		const [y, x] = type.split('-');
		const obj = {} as any;
		if(!x) {
			obj.left = '50%';
			obj.transform = 'translateX(-50%)';
		} else {
			x === 'left' ? obj.left = '0' : obj.right = '0';
		}

		if(y === 'top') {
			obj.top = '0';
			obj.transform != null ? obj.transform += `translateY(calc(-100% - ${space}))` : obj.transform = `translateY(calc(-100% - ${space}))`
		} else {
			obj.top = '100%';
			obj.transform != null ? obj.transform += `translateY(${space})` : obj.transform = `translateY(${space})`
		}		
		let style = ``;

		for (const key in obj) {
			const value = obj[key];	
			style+= `--tip-${key}:${value};`
		}

		const overflowClass = props.needOverflow ? 'needOverflow' : 'noOverflow';
		return [
			el('div', { class: `tooltip-wrap ${className}` }, [
				el('div', { class:`tooltip-inner ${overflowClass}`, tip: props.tip, style }, props.els)
			])
		]
	}
}