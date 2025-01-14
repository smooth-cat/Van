import { Define, FileRef, Reference, Uri } from '../../shared/var';
import { el, fn, text } from '../runtime/el';
import { FC } from '../runtime/type';
import './detail.less';
import { Icon } from '../icon/fc';
import { iClose, iDecSquare, iPlusSquare, iPrevious } from '../icon';
import { DetailFile } from './detail-ref-file';
import { Events } from '../util/var';
import { Tooltip } from '../components/tooltip';
import { AutoHeight } from 'scrollv';
import { onUnmount } from '../runtime/life-circle';
import { watch } from '@vue/reactivity';

export type IActive = {
		uri?: Uri,
		reference?: Reference,
		index?: [number, number]
	};

export type Props = {
  fileRefs: FileRef[];
  define: Define;
  close: () => void;
	active: IActive
};

export type Data = {
	pos: {
		start: number,
		end: number,
	}
}
export const Detail: FC<Data, Props> = (data, props) => {
  data.pos = {
		start:0,
		end:0,
	}
  const expandFolder = () => {
		props.fileRefs.forEach(([uri]) => uri.expand = true);
  };
  const closeFolder = () => {
		props.fileRefs.forEach(([uri]) => uri.expand = false);
  };

  let ins: AutoHeight;
  const handleScroller = (dom: AutoHeight) => {
    ins = dom;
		if(props.active.index != null) {
			const [index, itemCount] = props.active.index;
			ins.scrollv('toItem', {
				index,
				dt: itemCount * /* item */28.5 - 10
			} as any)
		}
  };

	const handle = watch(() => props.active.index, () => {
		if(ins) {
			handleScroller(ins);
		}
	})

  const onSlice = (e) => {
    data.pos = e.detail;
  };

	onUnmount(() => {
		console.log('触发 unmount');
		ins?.destroy();
		handle.stop();
	})

  return () => {
    const { fileRefs, define, close } = props;
    console.log({ fileRefs, define });

    const fileName = define.uri.relativePath.split('/').pop() || '';

    return [
      el('div', { class: 'detail' }, [
        el('div', { class: 'title' }, [
          fn(Tooltip, {
            els: [fn(Icon, { i: iPrevious, size: 18, onclick: close })],
            tip: '退后',
            type: 'bottom',
            class: 'previous'
          }),
          el('div', { title: '关闭', class: 'title-name' }, [text(define.name)])
        ]),
        el('div', { class: 'define' }, [
          el('div', { class: 'define-title' }, [text('定义'), el('span', {}, [text(' definition')])]),
          el('div', { class: 'file-title' }, [
            el('div', { class: 'file-name' }, [text(fileName)]),
            el('div', { class: 'file-path ellipsis', title: define.uri.relativePath }, [text(define.uri.relativePath)])
          ]),
          el('div', { class: 'ref-item fade-ellipsis', title: define.declaration }, [
            text(define.prefix),
            el('span', { class: 'ref-name' }, [text(define.name)]),
            text(define.suffix)
          ])
        ]),
        el('div', { class: 'refs' }, [
          el('div', { class: 'reference-title' }, [
            text('引用'),
            el('span', {}, [text(' references')]),
            el('div', { class: 'tools' }, [
              fn(Tooltip, {
                els: [el('div', { class: 'plus-icon', onclick: expandFolder })],
                tip: '全部展开',
                type: 'bottom'
              }),
              fn(Tooltip, {
                els: [el('div', { class: 'dec-icon', onclick: closeFolder })],
                tip: '全部折叠',
                type: 'bottom-right'
              })
            ])
          ]),
          el(
            'scroll-v',
            {
              ref: handleScroller,
              onslice: onSlice,
              total: fileRefs.length,
              itemHeight: 150,
              pad: 2,
							rate: 1,
							passive: true,
              class: 'reference-container hide-scrollbar'
            },
            fileRefs.slice(data.pos.start, data.pos.end).map(([uri, refs]) => fn(DetailFile, { key: uri.path, uri, refs }))
          )
        ])
      ])
    ];
  };
};
