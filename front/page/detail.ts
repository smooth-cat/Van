import { Define, FileRef } from '../../shared/var';
import { el, fn, text } from '../runtime/el';
import { FC } from '../runtime/type';
import './detail.less';
import { Icon } from '../icon/fc';
import { iClose, iDecSquare, iPlusSquare, iPrevious } from '../icon';
import { DetailFile } from './detail-ref-file';
import { Events } from '../util/var';
import { Tooltip } from '../components/tooltip';

export type Props = {
	fileRefs: FileRef[], 
	define: Define,
	close: () => void;
}

export const Detail: FC<any, Props> = (data, props) => {
	const expandFolder = () => {
		Events.emit('refs-expand', true);
	}
	const closeFolder = () => {
		Events.emit('refs-expand', false);
	}

  return () => {
    const { fileRefs, define, close } = props;
    console.log({ fileRefs, define });

    const fileName = define.uri.relativePath.split('/').pop() || '';

    return [
      el('div', { class: 'detail' }, [
        el('div', { class: 'title' }, [
					fn(Tooltip, { 
						els: [fn(Icon, { i: iPrevious, size: 18, onclick: close }),],
						tip: '退后',
						type: 'bottom',
						class: 'previous'
					}),
					el('div', { title: '关闭', class: 'title-name' }, [
						text(define.name)
					])
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
                els: [fn(Icon, { class: 'plus', i: iPlusSquare, size: 15, onclick: expandFolder })],
                tip: '全部展开',
								type: 'top'
              }),
              fn(Tooltip, {
                els: [fn(Icon, { class: 'dec', i: iDecSquare, size: 16, onclick: closeFolder })],
                tip: '全部折叠',
								type: 'top-right'
              })
            ])
          ]),
          ...fileRefs.map(([uri, refs]) => fn(DetailFile, { uri, refs }))
        ])
      ])
    ];
  };
};

