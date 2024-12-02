import { Position, Uri } from 'vscode';
import { FetchRefRes, Reference } from '../../shared/var';
import { Expand } from '../components/expand';
import { useEvent } from '../hook/useEvent';
import { iArrow } from '../icon';
import { Icon } from '../icon/fc';
import { el, fn, text } from '../runtime/el';
import { FC } from '../runtime/type';
import { use } from '../runtime/context';
import { isFormer } from '../../shared/utils';
import { AsyncState } from '../hook/use-async';
export type Props = {

}
type Data = {
	expand: boolean;
}

export const DetailFile: FC<Data, Props> = (data, props) => {
	const detailCtx = use<AsyncState<FetchRefRes>>('detail-ctx');

	data.expand = true;
	
	useEvent('refs-expand', (exp: boolean) => {
		data.expand = exp;
	})


	function expand() {
		data.expand  = !data.expand
	}

	function isActiveRef(ref: Reference) {
		const { activePos, activeUri } = detailCtx.value;
		const uri = ref.uri;
		if(uri.path !== activeUri.path) return false;

		const start = ref.range[0];
		const end = ref.range[1];
		const inRange = isFormer(start, activePos, true) && isFormer(activePos, end);

		return inRange;
	}

	function isActiveFile() {
		const { activeUri } = detailCtx.value;
		return props.uri.path === activeUri.path
	}

	return () => {
    const { uri, refs } = props;

		

		const fileName = uri.relativePath.split('/').pop() || '无';

    return [
      el('div', { class: 'ref-file' }, [
        el('div', { class: `file-title ${isActiveFile() ? 'active-file' : ''} ` }, [
          fn(Icon, { class: `file-expand ${data.expand ? 'expanded' : ''}`, i: iArrow, size: 15, onclick: expand }),
          el('div', { class: 'file-name' }, [text(fileName)]),
          el('div', { class: 'file-path ellipsis', title: uri.relativePath }, [text(uri.relativePath)])
        ]),
        fn(Expand, {
          class: 'ref-list',
					// TODO: 优化 els 变化导致的 Expand 组件重新渲染
          els: [
            el(
              'div',
              { class: 'ref-grid' },
              refs.reduce((lis, it: Reference) => {
                lis.push(
                  ...[
                    el('div', { class: `ref-line ${isActiveRef(it) ? 'active-ref': ''}` }, [text(it.range[0].line+1)]),
										el('div', { class: `ref-lineTextHighlight ${isActiveRef(it) ? 'active-ref': ''}` }, [
											el('div', { class: 'ref-lineText fade-ellipsis', title: it.lineText }, [
												el('span', { class: 'ref-name' }, [
													text(it.name)
												]),
												text(it.suffix)
											])
										])
                  ]
                );
                return lis;
              }, [])
            )
          ],
          expand: data.expand
        })
      ]),
      el('div', { class: 'ref-file-divide' })
    ];
  };
}




