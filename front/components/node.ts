import { DocNode, ReqType, SymbolMap, Uri } from '../../shared/var';
import { el, fn, text } from '../runtime/el';
import { FC } from '../runtime/type';
import './node.less';
import { Events, FrontE, msg } from '../util/var';
import { toRaw } from '@vue/reactivity';
import { iArrow } from '../icon';
import { Icon } from '../icon/fc';
import { Expand } from './expand';
import { useEvent } from '../hook/useEvent';

export type Props = {
	value: DocNode,
	uri: Uri,
}
type Data = {
	expand: boolean;
}


export const Node: FC<Data, Props> = (data, props) => {
	data.expand = true;

	const clickDetailBtn = () => {
		const { value: { selectionRange }, uri } = props;
		msg.request(ReqType.Command, ['gotoLocation', toRaw(uri), toRaw(selectionRange[0])])
	}

	const expand =  () => {
		data.expand = !data.expand;
	}

	useEvent(FrontE.TreeExpand, (state: boolean) => {
		data.expand = state;
	})

	return () => {
		const { value, uri } = props;
		const { children, kind, name, line, start, end } = value;
		const config = SymbolMap[kind];
		const type = config[0];
		const labelStyle = config['addition']['labelStyle'];
		const cssVar = config['addition']['cssVar'];

		const match = start !== -1;

		const prefix = name.slice(0, start);
		const highlight = name.slice(start, end);
		const suffix = name.slice(end);

		const hasChild = !!children?.length;
		const hideExpand = !hasChild ? 'hideExpand' : '';
		

		return [
			fn(Icon, { style: cssVar, class: `mt6 symbol-expand ${hideExpand} ${data.expand ? 'open' : ''}`, i: iArrow, size: 15, onclick: expand }),
			el('div', { class: 'mt6 label', style: labelStyle }, [
				text(type)
			]),
			el('div', { class: 'mt6 name', onclick: clickDetailBtn }, [
				match 
				? el('span', { }, [
					text(prefix),
					el('span', { class: 'highlight' }, [text(highlight)]),
					text(suffix),
				])
				: text(name),
				el('span', { class: 'nameLine' }, [
					text(line ? `L${line}` : ''),
				])
			]),
			hasChild && fn(Expand, { 
				class: 'expand-children',
				style: cssVar,
				expand: data.expand,
				els: [el('div', { class: 'children' }, children.map((subVal) => {
					return fn(Node, { key: subVal.key, value: subVal, uri  })
				})) as any,]
			 }) as any,
		]
	}
}