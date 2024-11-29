import { Define, FileRef } from '../../shared/var';
import { el, fn, text } from '../runtime/el';
import { FC } from '../runtime/type';
import './detail.less';
import { Icon } from '../icon/fc';
import { iClose } from '../icon';

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
					fn(Icon, { class: 'close', i: iClose, size: 20, onclick: close })
				]),
        el('div', { class: 'define1' }, [
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

