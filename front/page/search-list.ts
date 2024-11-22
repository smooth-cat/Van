import { el, text } from '../runtime/el';
import { onPropsChanged } from '../runtime/life-circle';
import { FC } from '../runtime/type';
export type Props = {
	input: string,
	show: boolean,
	source: string[],
}
type Data = {
	
}

export const SearchList: FC<Data, Props> = (data, props) => {
	data.value = 10;

	return () => {
		const { source, input, show } = props;
		
		
		
		const showed = source.reduce((arr, it) => {
			const start = it.indexOf(input);
			if(start === -1) return arr;

			const end = start+input.length;

			const item = {
				raw: it,
				prefix : it.slice(0,start),
				matched : it.slice(start, end),
				suffix : it.slice(end),
			}

			arr.push(item);

			return arr;
		}, [] as any[])


		return [
			el('div', { style: `display: ${show ? 'block' : 'none'};` }, 
				showed.map((it) => el('div', { key: it.raw }, [
					text(it.prefix),
					el('span', { style: 'font-weight: 700' }, [
						text(it.matched)
					]),
					text(it.suffix)
				]))
			)
		]
	}
}