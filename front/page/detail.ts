import { Define, FetchRefRes, FileRef, MsgType, Reference, ReqType } from '../../shared/var';
import { AsyncState, useAsync } from '../hook/use-async';
import { el, fn, text } from '../runtime/el';
import { FC } from '../runtime/type';
import { Events, msg } from '../util/var';
import { toRaw } from '@vue/reactivity';
import './detail.less';
import { Icon } from '../icon/fc';
import { iArrow, iClose } from '../icon';
export type WrapperProps = {
	
}
type WrapperData = {
	refs: AsyncState<FetchRefRes>;
}


export const DetailWrapper: FC<WrapperData, Props> = (data, props) => {
	data.key = performance.now();

	const [run, reset] = useAsync('refs', async(pos, uri, cover = false) => {
		
		const res = await msg.request<FetchRefRes>(ReqType.Command, ['fetchReference', toRaw(pos), toRaw(uri)]);
		data.key = performance.now();
		console.log('收到引用详情',res);
		
		if(res.data){
			return res.data;
		} 
	})

	Events.on('open-detail', run)

	return () => {
		const showDetail = !!data.refs.value;
		const fileRefs = data.refs.value?.fileRefs;
		const define = data.refs.value?.define;

		return [
			el('div', {  }, [
				showDetail && fn(Detail, { key: data.key,  fileRefs, define, close: reset })
			])
		]
	}
}

export type Props = {
	fileRefs: FileRef[], 
	define: Define,
	close: () => void;
}

export const Detail: FC<any, Props> = (data, props) => {


	return () => {
		const { fileRefs,  define, close } = props;
		console.log({ fileRefs,  define });

		return [
      el('div', { class: 'detail' }, [
        el('h3', { class: 'title' }, [
					text(define.name),
					fn(Icon, { class: 'close', i: iClose, size: 30, onclick: close })
				]),
        el('div', { class: 'define' }, [
					el('div', { class: 'file-path' }, [text(define.uri.relativePath)]),
					el('div',  { class: 'ref-item' }, [text(define.declaration)])
				]),
        el(
          'div',
          { class: 'refs' },
          fileRefs.map(([uri, refs]) =>
            el('div', { class: 'ref-file' }, [
              el('div', { class: 'file-path' }, [text(uri.relativePath)]),
              el(
                'div',
                { class: 'ref-list' },
                refs.map(it => el('div', { class: 'ref-item' }, [text(it.lineText)]))
              )
            ])
          )
        )
      ])
    ];
	}
}

