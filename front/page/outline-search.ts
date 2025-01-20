import { iClose, iCloseSolid, iDbExp } from '../icon';
import { Icon } from '../icon/fc';
import { el, fn, text } from '../runtime/el';
import { FC } from '../runtime/type';
import { Events, FrontE } from '../util/var';
import { Outline } from './outline';
export type Props = {
	value: string;
	updateSearch: (v: string) => void;
}
type Data = {
	
}

export const OutlineSearch: FC<Data, Props> = (data, props) => {

	function clear() {
		props.updateSearch('');
	}
	function expand() {
		Events.emit(FrontE.TreeExpand, true);
	}
	function shrink() {
		Events.emit(FrontE.TreeExpand, false);
		
	}

	return () => {
		const { value, updateSearch } = props;
		return [
			el('div', { class: 'outlineSearch' }, [
				el('div', { class: 'closeInput' }, [
					el('input', { class: 'outlineInput', placeholder: '搜索 @开头大小写敏感', value, oninput: (e) => updateSearch(e.target.value)  }),
					fn(Icon, { style: `opacity: ${value ? '1' : '0'}`, class: 'close', i: iCloseSolid, size: 18, onclick: clear })
				]),
				el('div', { class: `tools` }, [
						fn(Icon, { class: 'expand',key: 'expand', i: iDbExp, size: 12, onclick: shrink }),
						fn(Icon, { class: 'shrink',key: 'shrink', i: iDbExp, size: 12, onclick: expand }),
					]
				)
			])
		]
	}
}