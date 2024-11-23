import { MsgType, Reference, ReqType } from '../../shared/var';
import { AsyncState, useAsync } from '../hook/use-async';
import { el, fn, text } from '../runtime/el';
import { FC } from '../runtime/type';
import { Events, msg } from '../util/var';
import { toRaw } from '@vue/reactivity';
export type WrapperProps = {
	
}
type WrapperData = {
	refs: AsyncState<Reference[]>;
}


export const DetailWrapper: FC<WrapperData, Props> = (data, props) => {
	data.key = performance.now();

	const [run, reset] = useAsync('refs', async(pos, uri, cover = false) => {
		
		const res = await msg.request<Reference[]>(ReqType.Command, ['fetchReference', toRaw(pos), toRaw(uri)]);
		data.key = performance.now();
		console.log('收到引用详情',res);
		
		if(Array.isArray(res.data)){
			return res.data;
		} 
	})

	Events.on('open-detail', run)

	return () => {
		const showDetail = !!data.refs.value;

		return [
			el('div', {  }, [
				showDetail && fn(Detail, { key: data.key,  references: data.refs.value })
			])
		]
	}
}

export type Props = {
	references: Reference[]
}

export const Detail: FC<any, Props> = (data, props) => {
	data.value = 10;


	return () => {
		const { references } = props;
		console.log({ references });

		return [
			el('div', { class: 'detail' }, references.map((it) => el('div', { class: 'detail-list' }, [
				text(it.lineText)
			])))
		]
	}
}