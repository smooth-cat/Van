import { SymbolKind, Uri } from 'vscode';
import { DocNode } from '../../shared/var';
import { el, fn, text } from '../runtime/el';
import { FC } from '../runtime/type';
import './node.less';
import { Events, SymbolMap } from '../util/var';

export type Props = {
	value: DocNode,
	uri: Uri,
}
type Data = {
	
}


export const Node: FC<Data, Props> = (data, props) => {


	const clickDetailBtn = () => {
		const { value: { range, name }, uri } = props;
		Events.emit('open-detail', range[0], uri, name);
	}

	return () => {
		const { value, uri } = props;
		const { children, kind, name } = value;
		const [type] = SymbolMap[kind];

		const hasChild = !!children?.length;

		

		return [
			el('div', { class: 'doc-node' }, [
				el('div', { class: 'self' }, [
					el('button', { }, [
						text(type)
					]),
					el('span', { class: 'name', onclick: clickDetailBtn }, [
						text(name)
					]),
				]),
				hasChild && el('div', { class: 'children' }, children.map((subVal) => {
					return fn(Node, { value: subVal, uri  })
				}))
			]),
		]
	}
}