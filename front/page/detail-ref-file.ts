import { Reference } from '../../shared/var';
import { Expand } from '../components/expand';
import { useEvent } from '../hook/useEvent';
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
	
	useEvent('refs-expand', (exp: boolean) => {
		data.expand = exp;
	})


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
                    el('div', { class: 'ref-line' }, [text(it.range[0].line)]),
                    el('div', { class: 'ref-lineText fade-ellipsis', title: it.lineText }, [
											el('span', { class: 'ref-name' }, [
												text(it.name)
											]),
											text(it.suffix)
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




