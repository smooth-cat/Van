import { commands, DocumentSymbol, TextDocument, TextEditor, Uri, window, workspace, Range, Position } from 'vscode';
import { dfs, pick } from '../../shared/utils';
import { SymbolKind } from '../../shared/var';

export async function fetchSymbol(uri?: Uri) {
  uri = window.activeTextEditor?.document?.uri;
  if (!uri) {
    console.log('当前无打开的文件');
    return;
  }

  uri = Uri.from(uri);

  try {
    const docSymbolsP = commands.executeCommand<DocumentSymbol[]>('vscode.executeDocumentSymbolProvider', uri);
    const docP = workspace.openTextDocument(uri);

    const [doc, docSymbols] = await Promise.all([docP, docSymbolsP]);
    const root = {
      children: docSymbols
    } as DocumentSymbol;

    let fixHandle;
    for (const { test, handle } of fixNode) {
      if (uri.path.match(test)) {
        fixHandle = handle;
        break;
      }
    }

    dfs(
      root,
      (item, stack) => {
				// 重名
				if(item.children?.length) {
					const list = item.children;
					const repeat = new Map<string, DocumentSymbol>();
					list.forEach((it, i) => {
						const record = repeat.get(it.name);
						if(record) {
							it['line'] = it.range.start.line + 1;
							if(!record['__handled']) {
								record['line'] = record.range.start.line + 1;
								record['__handled'] = true;
							}
						} else {
							repeat.set(it.name, it);
						}
					});
					list.sort((a, b) => a.range.start.line - b.range.start.line)
				}
        const parent = stack[stack.length - 1];
        const newNode = pick(item, ['name', 'location' as any, 'kind', 'line', 'selectionRange']);
        if (parent) {
          const { line, character } = item['location'].range.start as Position;
          const selfKey = `${item.name}.${item.kind}.${line}.${character}`;
          const parentKey = parent['newNode']?.key;
          const key = parentKey ? parentKey + '-' + selfKey : selfKey;
          newNode.key = key;
					// newNode.expand = true;
        }
        newNode.range = item?.['location']?.range;
        fixHandle?.(newNode, doc, parent);
        // TODO: var 类型在 ts 包含了 type、箭头函数
        item['newNode'] = newNode;
      },
      (item, stack) => {
        const parent = stack[stack.length - 2];
        if (parent) {
          const newNode = parent['newNode'];
          const { children = [] } = newNode;
          children.push(item['newNode']);
          item['newNode'] = undefined;
          newNode.children = children;
        }
      },
      'children'
    );

    const res = root['newNode'].children;
    console.log('当前活动文件symbols', res);
    return res;
  } catch (error) {
    console.log('获取symbols错误', error);
  }
}
const fixNode = [
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
