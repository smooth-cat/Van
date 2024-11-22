import { SymbolKind } from 'vscode';
import { DocNode } from '../../shared/var';
import { el, fn, text } from '../runtime/el';
import { FC } from '../runtime/type';
import './node.less';
import { SymbolMap } from '../util/var';

export type Props = {
	value: DocNode
}
type Data = {
	
}


export const Node: FC<Data, Props> = (data, props) => {


	return () => {
		const { value } = props;
		const { children, kind, name } = value;
		const [type] = SymbolMap[kind];

		const hasChild = !!children?.length;
		return [
			el('div', { class: 'doc-node' }, [
				el('div', { class: 'self' }, [
					el('span', {  }, [
						text(type)
					]),
					el('span', {  }, [
						text(name)
					]),
				]),
				hasChild && el('div', { class: 'children' }, children.map((subVal) => {
					return fn(Node, { value: subVal })
				}))
			]),
		]
	}
}