import { Uri } from 'vscode';
import { AllSymbolKinds, DocNode, IFetchSymbolsRes, MsgType, ReqType, SymbolKind } from '../../shared/var';
import { el, fn, text } from '../runtime/el';
import { FC } from '../runtime/type';
import { msg } from '../util/var';
import { AsyncState, useAsync } from '../hook/use-async';
import { Node } from '../components/node';
import './outline.less';
import { LabelFilter, LabelItem } from './outline-label-filter';
import { computed, toRaw } from '@vue/reactivity';
import { dfs } from '../../shared/utils';
import { OutlineSearch } from './outline-search';
import { onUnmount } from '../runtime/life-circle';
import { Icon } from '../icon/fc';
import { iWarn } from '../icon';
import { info, warn } from '../components/toast';
import Empty from '../icon/nav-empty.png';
import { Loading } from '../components/loading';
import { useConfig } from '../hook/use-defualt';
export type Props = {};
type Data = {
  tree: AsyncState<DocNode[]>;
  uri: Uri;
	defaultLabels: SymbolKind[];
  showLabels: Set<SymbolKind>;
  search: string;
	hasRepeat: boolean;
};

export const Outline: FC<Data, Props> = (data, props) => {
	useConfig('defaultLabels', 'OutlineTags');
  data.showLabels = new Set([
    ...data.defaultLabels
  ]);
  data.search = '';
	data.hasRepeat = false;

  const [run] = useAsync(
    'tree',
    async function (uri?: Uri) {
      const res = await msg.request<IFetchSymbolsRes>(ReqType.Command, ['fetchSymbol', uri]);
      const { hasRepeat, symbols } = res.data;
      this.hasRepeat = hasRepeat;
      if (Array.isArray(symbols)) {
        return symbols;
      }
    },
    {
      updated: function () {
        if (data.tree.value?.[0]) {
          data.uri = data.tree.value[0].location.uri;
        }

        if (!noShowWarn) {
          data.hasRepeat = !!this.hasRepeat;
        }

        if (this.hasRepeat) {
          // warn('标识符重复，本文件可能被多个语言插件解析！');
        }
      },
      showLoadingOnce: true
    }
  );

  run();

  const dispose1 = msg.on(MsgType.DocSwitch, run);
  const dispose2 = msg.on(MsgType.CodeChanged, ({ uri }) => run(uri));
  onUnmount(() => {
    dispose1();
    dispose2();
  });

  const filteredTree = computed(() => {
    const value = data.tree.value;
    if (!value) return [];
    let nodes = toRaw(value);
    const showLabels = data.showLabels;
    const root = { children: nodes, newNode: {} } as any as DocNode;
    const { search, useLowerCase } = trimSearch();
    dfs(
      root,
      node => {
				node['newNode'] = { ...node, children: undefined };
      },
      (node, stack) => {
        const parent = stack.at(-1);
        if (!parent) return;
        const newNode: DocNode = node['newNode'];
        const pNewNode: DocNode = parent['newNode'];
        node['newNode'] = undefined;
        if (!pNewNode || !newNode) return;

        const nodeName = useLowerCase ? newNode.name.toLowerCase() : newNode.name;
        const start = nodeName.indexOf(search);
        const end = start + search.length;

				const matchLabel = showLabels.has(newNode.kind);
				const matchName = start !== -1;

        newNode.start = start;
        newNode.end = end;

        const currNodeMatched = (matchLabel && matchName) || !!newNode.childMatch;

				if(currNodeMatched) {
					// match 传递
					pNewNode.childMatch = true;
				}

        if (!currNodeMatched) return;

        const { children = [] } = pNewNode;
        children.push(newNode);
        pNewNode.children = children;
      },
      'children'
    );
    const res: DocNode[] = root['newNode'].children || [];
    console.log('filtered new node', res);
    return res;
  });

  function updateSearch(v) {
    data.search = v;
  }

  function trimSearch() {
    const input = data.search.trim();
    const useLowerCase = input.indexOf('@') !== 0;
    return {
      search: useLowerCase ? input.toLowerCase() : input.slice(1).trim(),
      useLowerCase
    };
  }

	let noShowWarn = false;
	function closeRepeat() {
		data.hasRepeat = false;
		noShowWarn=true;
	}

  return () => {

    const { tree, uri } = data;
    return [
      el('div', { class: 'outline' }, [
        fn(LabelFilter, { labels: data.showLabels, defaultLabels: data.defaultLabels }),
        fn(OutlineSearch, { value: data.search, updateSearch }),
				data.hasRepeat && el('div', { class: 'hasRepeat',  key: 'hasRepeat', title: t('close(not show again)'), onclick: closeRepeat }, [
					text(t('Duplicate identifiers detected, this file may be parsed by multiple language plugins!'))
				]),
        el('div', { class: 'tree hide-scrollbar' }, [
          tree.loading
            ? fn(Loading)
            : !filteredTree.value?.length 
							? el('img', { class: 'loading-img', src: Empty })
							: el(
                'div',
                { class: 'children', style: 'padding-left: 0px' },
                filteredTree.value.map(it => fn(Node, { key: it.key, value: it, uri }))
              )
        ])
      ])
    ];
  };
};
