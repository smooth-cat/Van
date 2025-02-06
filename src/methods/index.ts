import { commands, DocumentSymbol, Position, TextDocument, Uri, workspace } from 'vscode';
import { isFormer } from '../../shared/utils';
import { SDocNode } from '../../shared/var';
import { vscode } from '../../front/util/var';
import { LRUCache } from './lru-cache';
import { timestamp } from '../../shared/message/event';

workspace.registerFileSystemProvider;
export const getText = (uri: Uri, start: Position, end: Position) => {};

export const fromPos = (pos: Position) => {
  return new Position(pos.line, pos.character);
};

export const getSymbolKey = (docNodes: SDocNode[], pos: Position) => {
	let found: SDocNode|undefined = undefined;
  let currNodes = docNodes;
  while (currNodes?.length) {
    const foundI = binarySearchSymbol(currNodes, pos);
    if (foundI == null) {
      break;
    }
		found = currNodes[foundI];
    currNodes = found.children;
  }
  return found?.key;
};

function binarySearchSymbol(nodes: SDocNode[], pos: Position) {
  let start = 0;
  let end = nodes.length - 1;
  while (start <= end) {
    const mid = (start + end) >>> 1;
    const midV = nodes[mid];
    const midRange = midV.range;
    const { start: s, end: e } = midRange;
    // 比头部小，则往前查找
    if (isFormer(pos, s)) {
      end = mid - 1;
    }
    // 比尾部大
    else if (isFormer(e, pos, true)) {
      start = mid + 1;
    }
    // 在里头，说明找到了
    else {
      return mid;
    }
  }
}

/** html 页面刚切换时找不到 symbol */
export async function retryGetSymbols(uri: Uri, start = timestamp(), i = 0) {
	const now = timestamp();
	
	const docSymbols = await commands.executeCommand<DocumentSymbol[]|undefined>('vscode.executeDocumentSymbolProvider', uri);
	
	console.log('原始标识符',
		docSymbols
	);
	

	if(Array.isArray(docSymbols)) {
		return unRepeatSymbols(docSymbols);
	}

	if(now - start > 3000) {
		console.log('leave with timeout', i);
		return {
			hasRepeat: false,
			symbols: [],
		}
	}
	
	return new Promise<IUnRepeated>((resolve, reject) => {
		console.log('retryGetSymbols', i);
		setTimeout(() => {
			retryGetSymbols(uri, start, i + 1).then(resolve, reject);
		}, 10);
	});
}

type IUnRepeated = ReturnType<typeof unRepeatSymbols>;

/** 同一个文件多个语言功能时，做去重 */
function unRepeatSymbols(docSymbols: DocumentSymbol[]) {
	const keySet = new Set<string>();
 	const filteredSymbols = docSymbols.filter(({ range: { start: { line, character } } }) => {
		const key = `${line}.${character}`;
		if(keySet.has(key)) {
			return false;
		} else {
			keySet.add(key);
			return true;
		}
	});
	return { hasRepeat: filteredSymbols.length !== docSymbols.length, symbols: filteredSymbols }
}

// 允许缓存 1000 个文件对象
export const docCache = new LRUCache<string, TextDocument>(1000);
export async function openDocument(uri: Uri) {
	const {path}= uri;
	const memoed = docCache.get(path);
	if(memoed) return memoed;
	const doc = await workspace.openTextDocument(uri);
	docCache.set(path, doc);
	return doc;
}

export function updateDocCache(newDoc: TextDocument) {
	const { path } = newDoc.uri;
	// 不管有没有先缓存
	// if(!docCache.has(path)) return;
	docCache.set(path, newDoc);
}