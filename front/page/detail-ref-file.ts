import { Position } from 'vscode';
import { FetchRefRes, Reference, ReqType, Uri } from '../../shared/var';
import { Expand } from '../components/expand';
import { iArrow } from '../icon';
import { Icon } from '../icon/fc';
import { el, fn, text } from '../runtime/el';
import { FC } from '../runtime/type';
import { use } from '../runtime/context';
import { AsyncState } from '../hook/use-async';
import { msg } from '../util/var';
import { computed, toRaw, watch } from '@vue/reactivity';
import { onUnmount } from '../runtime/life-circle';
import { cNames } from '../runtime/util';
export type Props = {
  uri: Uri;
  ignoreRefKey: Set<string>;
  ignorePaths: Set<string>;
  clearable: boolean;
};
type Data = {
	hoverI: number;
};

export const DetailFile: FC<Data, Props> = (data, props) => {
  const { uri } = props;
	data.hoverI = -1;	

  function genIgnoreKey(it: Reference) {
    return `${it.prefix}.${it.suffix}.${props.uri.relativePath}`;
  }

  const showedRefs = computed(() => (uri.showMore ? props.refs : props.refs.slice(0, 10)));

  function expand(e: Event) {
    e.stopPropagation();
    props.uri.expand = !props.uri.expand;
  }

  function clearFile() {
    props.ignorePaths.add(props.uri.relativePath);
  }

  function clickRefItem(reference: Reference) {
    if (props.clearable) {
      const ignoreKey = genIgnoreKey(reference);
      props.ignoreRefKey.add(ignoreKey);
      return;
    }
    const pos = reference.range[0];
    const { uri } = props;
    msg.request(ReqType.Command, ['gotoLocation', toRaw(uri), toRaw(pos)]);
  }

  function handleShowMore() {
    uri.showMore = true;
  }

  function onEnter(i: number) {
		data.hoverI = i;
	}
  function onLeave() {
		data.hoverI = -1;
	}

  onUnmount(() => {
    // dom = undefined as any;
  });

  return () => {
    const { uri, ignoreRefKey } = props;

    const fileName = uri.relativePath.split('/').pop() || '无';

    return [
      el('div', { class: 'ref-file' }, [
        el('div', { class: `file-title ${uri.active ? 'active-file' : ''} `, onclick: clearFile }, [
          // TODO: 使用 icon-font
          fn(Icon, { class: `file-expand ${uri.expand ? 'expanded' : ''}`, i: iArrow, size: 15, onclick: expand }),
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
              showedRefs.value.reduce((lis, it: Reference, i) => {
                if (ignoreRefKey.has(genIgnoreKey(it))) return lis;
                lis.push(
                  ...[
                    el(
                      'div',
                      {
                        class: cNames('ref-line', { 'active-ref': it.active, 'hover-ref': data.hoverI === i }),
                        onclick: () => clickRefItem(it),
                        onmouseenter: () => onEnter(i),
                        onmouseleave: onLeave
                      },
                      [text(it.range[0].line + 1)]
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
