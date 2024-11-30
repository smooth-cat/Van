import { Expand } from '../components/expand';
import { iArrow } from '../icon';
import { Icon } from '../icon/fc';
import { el, fn, text } from '../runtime/el';
import { FC } from '../runtime/type';
export type Props = {
	
}
type Data = {
	expand: boolean;
}

export const DetailFile: FC<Data, Props> = (data, props) => {
	data.expand = true;


	function expand() {
		data.expand  = !data.expand
	}

	return () => {
    const { uri, refs } = props;

		const fileName = uri.relativePath.split('/').pop() || '无';

    return [
      el('div', { class: 'ref-file' }, [
				el('div', { class: 'file-title' }, [
					fn(Icon, { class: `file-expand ${data.expand ? 'expanded' : ''}`, i: iArrow, size: 15, onclick: expand }),
					el('div', { class: 'file-name' }, [text(fileName)]),
					el('div', { class: 'file-path' }, [text(uri.relativePath)]),
				]),
        fn(Expand, {
          class: 'ref-list',
          els: refs.map(it => el('div', { class: 'ref-item' }, [text(it.lineText)])),
					expand: data.expand,
        })
      ])
    ];
  };
}