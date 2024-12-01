import { Define, FileRef } from '../../shared/var';
import { el, fn, text } from '../runtime/el';
import { FC } from '../runtime/type';
import './detail.less';
import { Icon } from '../icon/fc';
import { iClose } from '../icon';
import { DetailFile } from './detail-ref-file';

export type Props = {
	fileRefs: FileRef[], 
	define: Define,
	close: () => void;
}

export const Detail: FC<any, Props> = (data, props) => {
  return () => {
    const { fileRefs, define, close } = props;
    console.log({ fileRefs, define });

    const fileName = define.uri.relativePath.split('/').pop() || '';

    return [
      el('div', { class: 'detail' }, [
        el('div', { class: 'title' }, [
          text(define.name),
          fn(Icon, { class: 'close', i: iClose, size: 20, onclick: close })
        ]),
        el('div', { class: 'define' }, [
          el('div', { class: 'define-title' }, [text('定义'), el('span', {  }, [text(' definition')])]),
					el('div', { class: 'file-title' }, [
						el('div', { class: 'file-name'}, [text(fileName)]),
						el('div', { class: 'file-path ellipsis', title: define.uri.relativePath }, [text(define.uri.relativePath)]),
					]),
          el('div', { class: 'ref-item fade-ellipsis', title: define.declaration }, [text(define.declaration)])
        ]),
        el('div', { class: 'refs' }, [
          el('div', { class: 'reference-title' }, [text('引用'), el('span', {  }, [text(' references')])]),
          ...fileRefs.map(([uri, refs]) => fn(DetailFile, { uri, refs }))
        ])
      ])
    ];
  };
};

