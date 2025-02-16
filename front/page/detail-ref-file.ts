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
import { eqPos, isFormer, lastFit, searchUpperSymbol } from '../../shared/utils';
import { use } from '../runtime/context';
import { HistoryStore } from '../store/history-stroe';
export type Props = {
  uri: Uri;
	refs: Reference[];
  ignoreRefKey: Set<string>;
  ignorePaths: Set<string>;
  clearable: boolean;
	define?: Define;
	index: number;
	isHistoryItem?: boolean;
};
type Data = {
	hoverI: number;
	loadingSymbol: boolean;
};

export const DetailFile: FC<Data, Props> = (data, props) => {
	data.hoverI = -1;	
	data.loadingSymbol = false;
	const store = use<HistoryStore>('historyStore');

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

  function clickRefItem(reference: Reference, j: number) {
		// TODO: 目前通过 cursor 是否存在判断历史记录列表项，如果是则跳转不需要通知，当然也不需要强刷
    if (props.clearable) {
      const ignoreKey = genIgnoreKey(reference);
      props.ignoreRefKey.add(ignoreKey);
      return;
    }
    const pos = reference.range[0];
    const { uri } = props;
		if(!props.isHistoryItem) {
			msg.request(ReqType.Command, ['gotoLocation', toRaw(uri), toRaw(pos), {}]);
			return;
		}
		// 历史列表则直接修改选择项为当前项
		store.cursor = { i: props.index, j: j };
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

	let emptyTimes = 0;
	async function getRefFileSymbol() {
		if(emptyTimes >= 2) return; 
		if(data.loadingSymbol) return;
		data.loadingSymbol = true;
		const res = await msg.request<IFetchSymbolsRes>(ReqType.Command, ['fetchSymbol', toRaw(props.uri)]);
		if(!res.error) {
			props.uri.symbols = res.data.symbols
		}
		if(!res.data.symbols?.length) {
			emptyTimes++;
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
		msg.request(ReqType.Command, ['gotoLocation', toRaw(props.uri), toRaw(start), { triggerEvent: true, forceRefresh: true }]);
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
			// 是本体则不计算在 upper 上
			if(eqPos(it.range[0], scope.selectionRange[0]) && eqPos(it.range[1], scope.selectionRange[1])) {
				continue;
			}
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
    const { uri, ignoreRefKey, refs, define, index, isHistoryItem } = props;
		const { cursor } = store;
		const showedRefs = uri.showMore ? refs : refs.slice(0, 10);
    const fileName = uri.relativePath.split('/').pop() || t('none');
		
    return [
      el('div', { class: 'ref-file', onmouseenter: getRefFileSymbol }, [
        el('div', { class: cNames('file-title', { 'active-file': isHistoryItem ? cursor.i === index :  uri.active }), onclick: clearFile }, [
          // TODO: 使用 icon-font
          fn(Icon, { class: `file-expand ${uri.expand ? 'expanded' : ''}`, i: iArrow, size: 15, onclick: expand }),
					!define ? false : (define.uri.path === uri.path) && fn(Tooltip, {
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
              showedRefs.reduce((lis, it: Reference, j) => {
								const isDefine = !define ? false : define.range[0].line === it.range[0].line && define.range[0].character === it.range[0].character;
								const isActive = isHistoryItem ? (cursor.i === index && cursor.j === j) : it.active;
                if (ignoreRefKey.has(genIgnoreKey(it))) return lis;
                lis.push(
                  ...[
										el(
											'div',
											{
												class: cNames('ref-line', {
													'define-ref': isDefine,
													'active-ref': isActive,
													'hover-ref': data.hoverI === j
												}),
												onclick: () => clickRefItem(it, j),
												onmouseenter: () => onEnter(j),
												onmouseleave: onLeave
											},
											[fn(Popup, {
												type: 'top-left',
												offset: {
													x: (rect: DOMRect) => rect.width / 3.1
												},
												el: el('div', { style: 'width: 100%;' }, [text(isDefine ? DefineTag : it.range[0].line + 1)]),
												renderer: ({ destroy }) => renderUpper(it, destroy)
											})]
										),
                    
                    el(
                      'div',
                      {
                        class: cNames('ref-lineTextHighlight', {
                          'active-ref': isActive,
                          'hover-ref': data.hoverI === j
                        }),
                        onclick: () => clickRefItem(it, j),
                        onmouseenter: () => onEnter(j),
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
