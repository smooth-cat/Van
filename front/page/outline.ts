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
export type Props = {};
type Data = {
  tree: AsyncState<DocNode[]>;
  uri: Uri;
  showLabels: Set<SymbolKind>;
  ignoreLabels: Set<SymbolKind>;
  search: string;
	hasRepeat: boolean;
};

export const Outline: FC<Data, Props> = (data, props) => {
  data.showLabels = new Set([
    ...AllSymbolKinds
  ]);
  data.ignoreLabels = new Set();
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
        if (showLabels.has(node.kind)) {
          node['newNode'] = { ...node, children: undefined };
        }
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

        newNode.start = start;
        newNode.end = end;

        const currNodeMatched = start !== -1 || !!newNode.childMatch;
        // match 传递
        pNewNode.childMatch = currNodeMatched;

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
        fn(LabelFilter, { labels: data.showLabels }),
        fn(OutlineSearch, { value: data.search, updateSearch }),
				data.hasRepeat && el('div', { class: 'hasRepeat',  key: 'hasRepeat', title: '关闭(不再提示)', onclick: closeRepeat }, [
					text('检测到标识符重复，本文件可能被多个语言插件解析！')
				]),
        el('div', { class: 'tree hide-scrollbar' }, [
          tree.loading
            ? text('outline')
            : tree.value &&
              el(
                'div',
                { class: 'children', style: 'padding-left: 0px' },
                filteredTree.value.map(it => fn(Node, { key: it.key, value: it, uri }))
              )
        ])
      ])
    ];
  };
};
