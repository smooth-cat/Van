import { Position } from 'vscode';
import { FetchRefRes, Reference, ReqType, Uri } from '../../shared/var';
import { Expand } from '../components/expand';
import { useEvent } from '../hook/useEvent';
import { iArrow } from '../icon';
import { Icon } from '../icon/fc';
import { el, fn, text } from '../runtime/el';
import { FC } from '../runtime/type';
import { use } from '../runtime/context';
import { AsyncState } from '../hook/use-async';
import { msg } from '../util/var';
import { toRaw, watch } from '@vue/reactivity';
import { onUnmount } from '../runtime/life-circle';
export type Props = {
	uri: Uri
}
type Data = {
}

export const DetailFile: FC<Data, Props> = (data, props) => {

	function expand() {
		props.uri.expand = !props.uri.expand
	}

	function gotoRef(pos: Position) {
		const { uri } = props;
		msg.request(ReqType.Command, ['gotoLocation', toRaw(uri), toRaw(pos)])
	}

	// let dom: HTMLElement;
	// const scrollTrack = (d: HTMLElement) => {
	// 	dom = d;
	// 	handleScroll(props.uri.scroll);
	// }

	// const handle = watch(() => props.uri.scroll, handleScroll)

	// function handleScroll(val: { id: number }) {
	// 	if(!val || !dom) return;
	// 	const i: number = val.id;
	// 	// 计算第 i 项是否在视口内
	// 	const parent = dom.parentElement
	// 	const parentH = parent!.offsetHeight
	// 	const start = parent!.scrollTop;
	// 	const end = start + parentH;

	// 	const top = dom.offsetTop + /* title */32 + i * /* item */28.5;
	// 	const bottom = top+28.5;

	// 	const inView = top >= start && bottom <= end;

	// 	if(!inView) {
	// 		parent!.scrollTo({ top: top - parentH/2, behavior: 'smooth' })
	// 	}
	// }

	onUnmount(() => {
		// handle.stop();
		// dom = undefined as any;
	})

	return () => {
    const { uri, refs } = props;

		

		const fileName = uri.relativePath.split('/').pop() || '无';

    return [
      el('div', { class: 'ref-file' }, [
        el('div', { class: `file-title ${uri.active ? 'active-file' : ''} ` }, [
					// TODO: 使用 icon-font
          fn(Icon, { class: `file-expand ${uri.expand? 'expanded' : ''}`, i: iArrow, size: 15, onclick: expand }),
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
                    el(
                      'div',
                      { class: `ref-line ${it.active ? 'active-ref' : ''}`, onclick: () => gotoRef(it.range[0]) },
                      [text(it.range[0].line + 1)]
                    ),
                    el(
                      'div',
                      {
                        class: `ref-lineTextHighlight ${it.active ? 'active-ref' : ''}`,
                        onclick: () => gotoRef(it.range[0])
                      },
                      [
                        el('div', { class: 'ref-lineText fade-ellipsis', title: it.lineText }, [
                          el('span', { class: 'ref-name' }, [text(it.name)]),
                          text(it.suffix)
                        ])
                      ]
                    )
                  ]
                );
                return lis;
              }, [])
            )
          ],
          expand: uri.expand
        }),
				el('div', { class: 'ref-file-divide' })
      ]),
    ];
  };
}




