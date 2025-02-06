import { commands, DocumentSymbol, TextDocument, TextEditor, Uri, window, workspace, Range, Position } from 'vscode';
import { dfs, isFormer, lastFit, pick } from '../../shared/utils';
import { DocNode, SDocNode, SymbolKind } from '../../shared/var';
import { openDocument, retryGetSymbols } from '../methods';
import { LRUCache } from '../methods/lru-cache';
export type FetchSymbolRes = {
	hasRepeat: boolean;
	symbols: SDocNode[];
};
export const symbolCache = new LRUCache<string, FetchSymbolRes>(100);

export async function fetchSymbol(uri: Uri) {
  uri = uri ?? window.activeTextEditor?.document?.uri;
  if (!uri) {
    console.log('当前无打开的文件');
    return { hasRepeat: false, symbols: [] as SDocNode[]};
  }

	if(symbolCache.has(uri.path)) {
		return symbolCache.get(uri.path);
	}

  uri = Uri.from(uri);
	console.log('看看uri',uri);
	
  try {
    // const docSymbolsP = commands.executeCommand<DocumentSymbol[]>('vscode.executeDocumentSymbolProvider', uri);
    const docSymbolsP = retryGetSymbols(uri);
    const docP = openDocument(uri);

    const [doc, { hasRepeat, symbols }] = await Promise.all([docP, docSymbolsP]);
    const root = {
			key: uri.path,
			selfKey: uri.path,
      children: symbols,
    } as any as SDocNode;

    let kindFix;
    for (const { test, handle } of fixNode) {
      if (uri.path.match(test)) {
        kindFix = handle;
        break;
      }
    }
    dfs(
      root,
      (item, stack) => {
        // if(item.children?.length) {
        // 	item.children.sort((a, b) => a.range.start.line - b.range.start.line)
        // }

        const parent = stack.at(-1);
        const newNode = pick(item, ['key', 'selfKey', 'name', 'location' as any, 'kind', 'line', 'selectionRange']);
        newNode.range = item?.['location']?.range;
        // TODO: 子类型修正依赖于 旧 的 parent 需要注意
        kindFix?.(newNode, doc, parent);
        item['newNode'] = newNode;

        if (!parent) return;
        const { repeat = new Map<string, DocumentSymbol>(), key: pSelfKey } = parent['newNode'] as any;
        const selfKey = `${newNode.name}.${newNode.kind}`;
        const record = repeat.get(selfKey);

        if (record) {
          // 修正第一个记录项
          if (record['_i'] === 0) {
            record['_i']++;
            const rSelfKey = `${selfKey}.${record['_i']}`;
            record.key = `${pSelfKey}-${rSelfKey}`;
            record.selfKey = rSelfKey;
          }
          newNode['_i'] = record['_i'] + 1;
          repeat.set(selfKey, newNode);
        } else {
          newNode['_i'] = 0;
          repeat.set(selfKey, newNode);
        }
        // 不一定对，如果后续重名会修改末尾的 i
        const firstSelfKey = `${selfKey}.${newNode['_i']}`;
        newNode.key = `${pSelfKey}-${firstSelfKey}`;
        newNode.selfKey = firstSelfKey;
        parent['newNode'].repeat = repeat;
      },
      (item, stack) => {
        const newNode: DocumentSymbol = item['newNode'];
        const parent = stack.at(-1);
        const childs = newNode.children;
        childs?.sort((a, b) => {
          return isFormer(a.range.start, b.range.start) ? -1 : 1;
        });

        if (!parent) return;

        const newNodeP = parent['newNode'];
        const children: DocumentSymbol[] = newNodeP.children || [];
        // 二分查找，找到前一个比当前项小的 i，插入在其后面, 相当于 (logN + N) * N，实测比 sort 慢
        // const prevI = lastFit(children, v => {
        //   const is = isFormer(v.range.start, newNode.range.start);
        //   return is;
        // });
        // children.splice(prevI + 1, 0, newNode);
        children.push(newNode);
        item['newNode'] = undefined;
        newNodeP.children = children;
      },
      'children'
    );

    const res = root['newNode'].children;
    console.log('当前活动文件symbols', res);
		const gotResult = { hasRepeat, symbols: res as SDocNode[]};
		// 长度为0的可能是未成功Fetch的
		if(res.length !== 0) {
			symbolCache.set(uri.path, gotResult);
		}
    return gotResult
  } catch (error) {
    console.log('获取symbols错误', error);
		return { hasRepeat: false, symbols: [] as SDocNode[]};
  }
}
export function delSymbolsCache(newDoc: TextDocument) {
	symbolCache.delete(newDoc.uri.path);
}

export const fixNode = [
  {
    test: /\.(js|ts|tsx)$/,
    handle(node: DocumentSymbol, doc: TextDocument, parent?: DocumentSymbol) {
      // 需要区分箭头函数、type 和 普通变量
      if (node.kind === SymbolKind.Variable) {
        const prefixRange = new Range(node.range.start, node.selectionRange.start);
        const suffixRange = new Range(node.selectionRange.end, node.range.end);
        if (doc.getText(prefixRange).match(/type\s*$/)) {
          node.kind = SymbolKind.Interface;
          return;
        }

				if (parent?.kind === SymbolKind.Enum) {
          node.kind = SymbolKind.Enum;
          return;
        }

        let suffixCode = doc.getText(suffixRange);
        const i = suffixCode.indexOf('=');
        if (i === -1) return;

        suffixCode = suffixCode.slice(i + 1).trim();

        const startWithoutBrace = suffixCode.match(/^[^\{]/);
        const endWithBrace = suffixCode.match(/\}\;*$/);
        if (startWithoutBrace && endWithBrace) {
          node.kind = SymbolKind.Function;
          return;
        }
      }

      if (node.kind === SymbolKind.Module) {
        const prefixRange = new Range(node.range.start, node.selectionRange.start);
        if (doc.getText(prefixRange).match(/namespace\s*$/)) {
          node.kind = SymbolKind.Namespace;
          return;
        }
      }

      if (node.kind === SymbolKind.Method) {
        node.kind = SymbolKind.Function;
        return;
      }

      if (node.kind === SymbolKind.Property) {
        if (parent?.kind === SymbolKind.Class) {
          const suffixRange = new Range(node.selectionRange.end, node.range.end);
          node.kind = SymbolKind.Function;
          let suffixCode = doc.getText(suffixRange);
          const i = suffixCode.indexOf('=');
          if (i === -1) return;

          suffixCode = suffixCode.slice(i + 1).trim();

          const startWithoutBrace = suffixCode.match(/^[^\{]/);
          const endWithBrace = suffixCode.match(/\}\;*$/);
          if (startWithoutBrace && endWithBrace) {
            node.kind = SymbolKind.Function;
          }
        }
        return;
      }
    }
  }
];
