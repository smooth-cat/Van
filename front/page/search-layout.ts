import { el, fn, text } from '../runtime/el';
import { onPropsChanged } from '../runtime/life-circle';
import { FC } from '../runtime/type';
import { Outline } from './outline';
import { SearchList } from './search-list';
export type Props = {
	
}
type Data = {
	
}

export const SearchLayout: FC<Data, Props> = (data, props) => {
	data.input = '';



	return () => {
		const trimmedInput = data.input.trim();
		const showList = trimmedInput.length > 0;
		
		const temp = [
			'123',
			'456',
			'789',
			'abc',
			'cde',
			'cdefgalsdkfj',
			'alsdkfjasdfa',
		]

		return [
			el('div', {  }, [
				el('input', { value: data.input, oninput: (e) => data.input = e.target.value }),		
				fn(Outline, { show: true }),
				fn(SearchList, { show: showList, input: trimmedInput, source: temp }),
			])
		]
	}
}