import { Define, DocNode, FetchRefRes, IFetchSymbolsRes, Reference, ReqType, SymbolKind, SymbolMap, Uri } from '../../shared/var';
import { Expand } from '../components/expand';
import { iArrow, iLoading } from '../icon';
import { Icon } from '../icon/fc';
import { el, fn, text } from '../runtime/el';
import { FC } from '../runtime/type';
import { msg } from '../util/var';
import { toRaw } from '@vue/reactivity';
import { onUnmount } from '../runtime/life-circle';
import { cNames } from '../runtime/util';
import { Tooltip } from '../components/tooltip';
import { Popup } from '../components/popup';
import { isFormer, lastFit, searchUpperSymbol } from '../../shared/utils';
export type Props = {
  uri: Uri;
  ignoreRefKey: Set<string>;
  ignorePaths: Set<string>;
  clearable: boolean;
	define: Define;
};
type Data = {
	hoverI: number;
	loadingSymbol: boolean;
};

export const DetailFile: FC<Data, Props> = (data, props) => {
	data.hoverI = -1;	
	data.loadingSymbol = false;

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
    msg.request(ReqType.Command, ['gotoLocation', toRaw(uri), toRaw(pos), true, false]);
  }

  function handleShowMore() {
    props.uri.showMore = true;
  }

  function onEnter(i: number) {
		if(props.clearable) {
			data.hoverI = i;
		}
	}
  function onLeave() {
		data.hoverI = -1;
	}

	async function getRefFileSymbol() {
		if(data.loadingSymbol || props.uri.symbols?.length) return;
		data.loadingSymbol = true;
		const res = await msg.request<IFetchSymbolsRes>(ReqType.Command, ['fetchSymbol', toRaw(props.uri)]);
		if(!res.error) {
			props.uri.symbols = res.data.symbols
		}
		data.loadingSymbol = false;
	}

  onUnmount(() => {
    // dom = undefined as any;
  });

	const DefineTag = 'Def';

	function gotoUpper(upperSymbol: DocNode|undefined, destroy: () => void) {
		if(!upperSymbol) return;
		const [start] = upperSymbol.selectionRange;
		msg.request(ReqType.Command, ['gotoLocation', toRaw(props.uri), toRaw(start), true, true]);
		destroy();
	}


	function renderUpper(it: Reference, destroy: () => void) {
		let upper = 'global';
		let upperKind: SymbolKind = SymbolKind.Class;
		let upperSymbol: DocNode;
		const scopes: DocNode[] = [];
		if(!data.loadingSymbol && props.uri.symbols) {
			const symbols = toRaw(props.uri.symbols);
			const [start, end] = it.range;
			let arr = symbols;
			while (1) {
				const i = searchUpperSymbol(arr, start, end);
				const symbol = arr[i];
				symbol && scopes.push(symbol);
				if(symbol?.children?.length) {
					arr = symbol.children;
				} else {
					break;
				}
			}
		}
		console.log({scopes});
		
		for (let i = scopes.length - 1; i >= 0 ; i--) {
			const scope = scopes[i];
			if([SymbolKind.Class, SymbolKind.Function, SymbolKind.Method].includes(scope.kind)) {
				upper = scope.name;
				upperKind = scope.kind;
				upperSymbol = scope;
				break;
			}
		}

		return [
      data.loadingSymbol
        ? fn(Icon, { i: iLoading, size: 18, style: 'padding-top: 3px;', class: 'loading-icon' })
        : el('div', { class: cNames('popup-upper', { 'can-click': !!upperSymbol }), onclick: () => gotoUpper(upperSymbol, destroy) }, [
            el('div', { class: 'label', style: `${SymbolMap[upperKind]['addition']['labelStyle']}` }, [
              text(upper === 'global' ? 'global' : SymbolMap[upperKind][0])
            ]),
						el('div', { class: 'name' }, [
							text(upper)
						])
          ])
    ];
	}

  return () => {
    const { uri, ignoreRefKey, refs, define } = props;
		const showedRefs = uri.showMore ? refs : refs.slice(0, 10);
    const fileName = uri.relativePath.split('/').pop() || t('none');

    return [
      el('div', { class: 'ref-file', onmouseenter: getRefFileSymbol }, [
        el('div', { class: cNames('file-title', { 'active-file': uri.active }), onclick: clearFile }, [
          // TODO: 使用 icon-font
          fn(Icon, { class: `file-expand ${uri.expand ? 'expanded' : ''}`, i: iArrow, size: 15, onclick: expand }),
					define.uri.path === uri.path && fn(Tooltip, {
						els: [el('div', { class: 'define-circle-flag' }, [text(DefineTag)])],
						tip: t('definition file'),
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
												class: cNames('ref-line', {
													'define-ref': isDefine,
													'active-ref': it.active,
													'hover-ref': data.hoverI === i
												}),
												onclick: () => clickRefItem(it),
												onmouseenter: () => onEnter(i),
												onmouseleave: onLeave
											},
											[fn(Popup, {
												type: 'top-left',
												offset: {
													x: 10
												},
												el: el('div', { style: 'width: 100%;' }, [text(isDefine ? DefineTag : it.range[0].line + 1)]),
												renderer: ({ destroy }) => renderUpper(it, destroy)
											})]
										),
                    
                    el(
                      'div',
                      {
                        class: cNames('ref-lineTextHighlight', {
                          'active-ref': it.active,
                          'hover-ref': data.hoverI === i
                        }),
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
          el('div', { class: 'showMoreBtn', onclick: handleShowMore }, [text(t('show rest'))]),
        el('div', { class: 'ref-file-divide' })
      ])
    ];
  };
};
