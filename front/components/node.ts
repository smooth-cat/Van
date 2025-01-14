import { SymbolKind, Uri } from 'vscode';
import { DocNode, MsgType, ReqType } from '../../shared/var';
import { el, fn, text } from '../runtime/el';
import { FC } from '../runtime/type';
import './node.less';
import { Events, msg, SymbolMap } from '../util/var';
import { toRaw } from '@vue/reactivity';

export type Props = {
	value: DocNode,
	uri: Uri,
}
type Data = {
	
}


export const Node: FC<Data, Props> = (data, props) => {


	const clickDetailBtn = () => {
		const { value: { range }, uri } = props;
		// TODO:  range[0] 不是标识符的正确位置，其包含了 const export 等关机键字
		msg.request(ReqType.Command, ['gotoLocation', toRaw(uri), toRaw(range[0])])
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