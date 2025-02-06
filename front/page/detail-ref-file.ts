import { Define, FetchRefRes, Reference, ReqType, Uri } from '../../shared/var';
import { Expand } from '../components/expand';
import { iArrow } from '../icon';
import { Icon } from '../icon/fc';
import { el, fn, text } from '../runtime/el';
import { FC } from '../runtime/type';
import { msg } from '../util/var';
import { toRaw } from '@vue/reactivity';
import { onUnmount } from '../runtime/life-circle';
import { cNames } from '../runtime/util';
import { Tooltip } from '../components/tooltip';
export type Props = {
  uri: Uri;
  ignoreRefKey: Set<string>;
  ignorePaths: Set<string>;
  clearable: boolean;
	define: Define;
};
type Data = {
	hoverI: number;
};

export const DetailFile: FC<Data, Props> = (data, props) => {
  const { uri } = props;
	data.hoverI = -1;	

  function genIgnoreKey(it: Reference) {
    return `${it.lineText}.${it.range[0].line}.${it.range[0].character}.${props.uri.relativePath}`;
  }

  function expand(e: Event) {
    e.stopPropagation();
    props.uri.expand = !props.uri.expand;
  }

  function clearFile() {
		if(props.clearable) {
			props.ignorePaths.add(props.uri.relativePath);
		}
  }

  function clickRefItem(reference: Reference) {
    if (props.clearable) {
      const ignoreKey = genIgnoreKey(reference);
      props.ignoreRefKey.add(ignoreKey);
      return;
    }
    const pos = reference.range[0];
    const { uri } = props;
    msg.request(ReqType.Command, ['gotoLocation', toRaw(uri), toRaw(pos), true]);
  }

  function handleShowMore() {
    uri.showMore = true;
  }

  function onEnter(i: number) {
		if(props.clearable) {
			data.hoverI = i;
		}
	}
  function onLeave() {
		data.hoverI = -1;
	}

  onUnmount(() => {
    // dom = undefined as any;
  });

	const DefineTag = 'Def';

  return () => {
    const { uri, ignoreRefKey, refs, define } = props;
		const showedRefs = uri.showMore ? refs : refs.slice(0, 10);
    const fileName = uri.relativePath.split('/').pop() || '无';

    return [
      el('div', { class: 'ref-file' }, [
        el('div', { class: cNames('file-title', { 'active-file': uri.active }), onclick: clearFile }, [
          // TODO: 使用 icon-font
          fn(Icon, { class: `file-expand ${uri.expand ? 'expanded' : ''}`, i: iArrow, size: 15, onclick: expand }),
					define.uri.path === uri.path && fn(Tooltip, {
						els: [el('div', { class: 'define-circle-flag' }, [text(DefineTag)])],
						tip: '定义文件',
						type: 'bottom',
						class: 'define-wrapper'
					}),
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
              showedRefs.reduce((lis, it: Reference, i) => {
								const isDefine = define.range[0].line === it.range[0].line && define.range[0].character === it.range[0].character;
                if (ignoreRefKey.has(genIgnoreKey(it))) return lis;
                lis.push(
                  ...[
                    el(
                      'div',
                      {
                        class: cNames('ref-line', { 'define-ref': isDefine, 'active-ref': it.active, 'hover-ref': data.hoverI === i }),
                        onclick: () => clickRefItem(it),
                        onmouseenter: () => onEnter(i),
                        onmouseleave: onLeave
                      },
                      [text(isDefine ? DefineTag : it.range[0].line + 1)]
                    ),
                    el(
                      'div',
                      {
                        class: cNames('ref-lineTextHighlight', { 'active-ref': it.active, 'hover-ref': data.hoverI === i }) ,
												onclick: () => clickRefItem(it),
                        onmouseenter: () => onEnter(i),
                        onmouseleave: onLeave
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
        uri.expand &&
          !uri.showMore &&
          el('div', { class: 'showMoreBtn', onclick: handleShowMore }, [text('点击查看剩余项')]),
        el('div', { class: 'ref-file-divide' })
      ])
    ];
  };
};
