import { Position } from "vscode";
import { ChangedArea, DocNode, Err, IRange, Reference, Uri } from "./var";
import { Func } from "./message/event";

export const pick = <T extends Record<any, any>>(t: T, keys: (keyof T)[]) => {
	let obj: any = {};
	for (const key of keys) {
		obj[key] = t[key];
	}
	return obj;
}

export function dfs<K extends string , T extends (Record<any, any> & { [k in K]: T[K]  })>(
  root: T,
  beginWork: (nod: T, stack: T[]) => void,
  completeWork: (nod: T, stack: T[]) => void,
	cKey: K,
) {
  const stack: T[] = [];
  let current = root;
  while (1) {
    beginWork(current, stack);
    stack.push(current);
    // 下沉
    if (current.children?.length) {
      current = current.children[0];
      // @ts-ignore
      current.__$_i = 0;
      continue;
    }
    // 上浮
    complete: while (1) {
      stack.pop()!;

      const currentI = current.__$_i;
      // @ts-ignore
      current.__$_i = undefined;
			
			completeWork(current, stack);

      if (current === root) {
        return;
      }

      const parent = stack[stack.length - 1];
      const siblingI = currentI! + 1;
      const sibling = parent.children[siblingI];
      if (sibling) {
        sibling.__$_i = siblingI;
        current = sibling;
        break complete;
      }

      current = parent;
    }
  }
}

export const DebounceOpt = {
	leading: false,
	timeout: 300,
}

export type IDebounceOpt = Partial<typeof DebounceOpt>;

export const debounce = <T extends Function>(fn: T, opt: IDebounceOpt = {}) => {
	opt = { ...DebounceOpt, ...opt };
	let timer;
	return (function (this, ...args: any[]) {
		if(timer != null) {
			clearTimeout(timer);
			timer = null;
		} else {
			// 直接触发并结束
			if(opt.leading) {
				return fn?.call(this, ...args);
			}
		}
		timer = setTimeout(() => {
			fn?.call(this, ...args);
			timer = null;
		}, opt.timeout);
	}) as unknown as T;
}

type ISortBy = {
	<T = any, V = any, K = any>(arr: T[], cb: (it:T, i: number, arr: T[]) => V) : [V, T[]][];
	<T = any, V = any, K = any>(arr: T[], cb: (it:T, i: number, arr: T[]) => V, key?: (it:T, i: number, arr: T[]) => K) : [K, T[]][];
}

 export const sortBy: ISortBy = <T = any, V = any, K = any>(arr: T[], cb: (it:T, i: number, arr: T[]) => V, key?: (it:T, i: number, arr: T[]) => K) => {
	const map = new Map<V,T[]>();
	const keyMap = new Map<V, K>();
	for (let i = 0; i <arr.length; i++) {
		const it = arr[i];
		const res = cb(it, i, arr);
		if(key) {
			const k = key(it, i, arr);
			if(!keyMap.has(res)) {
				keyMap.set(res, k);
			}
		}

		let list = map.get(res);
		if(!list) {
			list = [];
			map.set(res, list);
		} 
		list.push(it);
	}

	const list: any[] = []
	map.forEach((value, res) => {
    const k = key ? keyMap.get(res) : res;
    list.push([k, value]);
  });
	
	return list;
 }


 export const isFormer = (a: Position, b: Position, equal = false) => {

  // 同行比列
  if (a.line === b.line) {
    return equal ? a.character <= b.character : a.character < b.character;
  }

  // 不同行比行
  return a.line < b.line;
};

/** 通用 */
export const equalPos = (uri1: Uri|undefined, pos1: Position|undefined, uri2: Uri|undefined, pos2: Position|undefined) => {
	if(!uri1 || !uri2 || !pos1 || !pos2) return false;
	const uriEq = uri1.path === uri2.path;
	const posEq = pos1.line === pos2.line && pos1.character === pos2.character;
	return uriEq && posEq;
}

export const eqPos = (pos1: Position, pos2: Position) => {
	const posEq = pos1.line === pos2.line && pos1.character === pos2.character;
	return posEq;
}

/** @deprecated 仅 webview */
export const posInRange = (uri1: Uri|undefined, pos1: Position|undefined, uri2: Uri|undefined, range: IRange|undefined) => {
	if(!uri1 || !uri2 || !pos1 || !range) return false;
	const uriEq = uri1.path === uri2.path;
	const [start, end] = range;
	const inRange = isFormer(start, pos1, true) && isFormer(pos1, end);
	return uriEq && inRange;
}


export const exchange = (arr: any[], i: number, j: number) => {
  const temp = arr[i];
  arr[i] = arr[j];
  arr[j] = temp;
};

export function getRelativePath(fullPath: string, workspacePath: string) {
	return fullPath.slice(workspacePath.length + 1);
}


/**
 * [0,start]  满足条件
 * [end,length-1] 不满足条件
 */
export function lastFit<T>(arr: T[], fit: (midV: T) => boolean) {
  const len = arr.length;
  let start = -1;
  let end = len;

  while (start + 1 < end) {
    const mid = (start + end) >> 1;
    const midV = arr[mid];
    // 满足条件将, 且数组具有单调性，将 start 扩充至 mid
    if (fit(midV)) {
      start = mid;
    } 
    // 不满足条件将，将 end 扩充至 mid
    else {
      end = mid;
    }
  }
  return start;
}

export function searchUpperSymbol(symbols: DocNode[], lead: Position, tail: Position) {
	let start = 0;
	let end = symbols.length - 1;
	while (start <= end) {
		const mid = (start + end) >> 1;
		const midV = symbols[mid].range;
		if(isFormer(midV[0], lead, true) && isFormer(tail, midV[1], true)) {
			return mid;
		}
		// 起始位置在末尾位置后，则 start 缩进
		if(isFormer(midV[1], lead)) {
			start = mid + 1;
		} else {
			end = mid - 1;
		}
	}
	return -1;
}

export function latest<T extends Func>(func: T) {
	let id = 0;
	return (async function (...args: any[]) {
		id++;
		const memoId = id;
		const res = await func.call(this, ...args);
		if(memoId !== id) {
			throw Err.UselessResult;
		}
		return res;
	}) as unknown as T
}

export function fixDefineRange(uri: Uri, area: ChangedArea, reference: Reference, updateName = false) {
	if(reference.miss) return true;
	if(uri.path !== reference.uri.path) return false;
	const [changedStart, changedEnd] = area.range;
	const [refStart, refEnd] = reference.range;
	// 无修改
	// [-][~]
	if(isFormer(refEnd, changedStart)) return false;
	// 破坏标识符
	//     [-- --]
	//  [~~ ~~]
	if(isFormer(changedStart, refStart) && isFormer(refStart, changedEnd)) {
		reference.miss = true;
		return true;
	}
	//  重命名，从替换位置开始拼接，碰 \s 终止，作为新标识符
	//  [----]
	//  [~~~~ ~~]
	if(isFormer(refStart, changedStart, true)) {
		const symbolRegexp = /^[\p{L}_$][\p{L}\p{N}_$]*/u
		const wrapI = area.text.indexOf('\n');
		let firstLine = wrapI === -1 ? area.text : area.text.slice(0, wrapI);
		const isMultiReplacer = wrapI !== -1;
		let prefix = '';
		// 处理空白符
		if(eqPos(refStart, changedStart)) {
			const blankStart = firstLine.match(/^[ \t\f\r]*/)?.[0] || '';
			if(blankStart.length) {
				refStart.character += blankStart.length;
				refEnd.character += blankStart.length;
				firstLine = firstLine.slice(blankStart.length);
			}
		} else {
			// 头部一定同行，因为 define 是一行的，同时 start 又在 define 之内
			prefix = reference.name.slice(0, changedStart.character - refStart.character);
		}

		let suffix = '';
		if(isFormer(changedEnd, refEnd)) {
			suffix = reference.name.slice(changedEnd.character - refEnd.character);
		}

		const total = isMultiReplacer ? prefix + firstLine : prefix + firstLine + suffix;


		// 直接用 prefix 拼上 第一行  然后匹配标识符				
		const symbol = total.match(symbolRegexp)?.[0] || '';
		refEnd.character = refStart.character + symbol.length;
		if(symbol && updateName) {
			reference.name = symbol;
		}
		return false;
	}

	// 改变位置
	// [~][-]
	const prevLines = changedEnd.line - changedStart.line;
	let currLines = 0;
	let lastLineStart = 0;
	const reg = /\n/g;
	let catches: RegExpExecArray;
	while ((catches = reg.exec(area.text)) !== null) {
		currLines++;
		lastLineStart = catches.index + 1;
	}
	const lastLineReplacedLen = Math.max(0, area.text.length - lastLineStart);
	const dtLine = currLines - prevLines;
	const addLine = () => {
		
		refStart.line += dtLine;
		
		refEnd.line += dtLine;
	}			
	// 和定义值不同行，只需要考虑行变化
	if(changedEnd.line < refStart.line) {
		addLine();
		return false;
	}
	addLine();

	// end 和定义同行, end + xxx  = start，因此 dtEnd = dtC
	// 1. 新数据是单行，则 defineStart.c = changedStart.c + text.length;
	// 2. 新数据多行，则 defineStart = lastLineReplacedLen
	const dtC = currLines === 0 ? changedStart.character + area.text.length - changedEnd.character : lastLineReplacedLen - changedEnd.character;

	 
	refStart.character += dtC; 
	
	refEnd.character += dtC;
	return false;
}

export const fixHistory = (e, historyList: { uri: Uri, refs: Reference[] }[]) => {
	const uri: Uri = e.uri;
	const areas: ChangedArea[] = [...e.areas];
	const sortFn = (a, b) => isFormer(a.range[0], b.range[0]) ? -1 : 1;

	areas.sort(sortFn);
	const foundArr  = historyList.filter((it) => it.uri.path === uri.path);
	if(!foundArr) return;
	const list: Reference[] = [];
	for (const found of foundArr) {
		list.push(...found.refs);
	}
	list.sort(sortFn);

	let i = areas.length - 1;
	let j = list.length - 1;
	while (i >= 0 && j >= 0) {
		const change = areas[i];
		const ref = list[j];
		const [ changeStart ] = change.range;
		const [ refStart, refEnd ] = ref.range;

		// 改的位置在所有区域之后则跳过
		if(isFormer(refStart, changeStart, true)) {
			// 从 j 往前找相同的标识符都做 rename 处理
			let p = j-1;
			for (; p >=0; p--) {
				const prevRef = list[p];
				if(eqPos(prevRef.range[0], refStart)) {
					// fix 同节点
					fixDefineRange(uri, change, prevRef, true);
				}
			}
			// 说明找到了相同的标识符
			if(p < j-1) {
				j = p;
			}
			// fix 本节点
			fixDefineRange(uri, change, ref, true);
			i--;
			continue;
		}

		// 改的位置在 refs 之前，则全部应用
		for (let p = i; p >= 0; p--) {
			const change = areas[i];
			const refMiss = fixDefineRange(uri, change, ref, true);
			if(refMiss) break;
		}
		// 处理完成该 ref 的位置
		j--;
	}
}

const MaxSpaceCount = 2;
export function getShotPrefixText(prefix: string) {
	if(!prefix || prefix.trim() === '') return prefix;
	let len = prefix.length;
	let spaceCount = 0;
	for (let i = len-1; i >= 0; i--) {
		const char = prefix[i];		
		if(char === ' ') {
			spaceCount++;
			if(spaceCount > MaxSpaceCount) {
				const shotPrefix = prefix.slice(i);
				return shotPrefix;
			}
		}
	}
	return prefix;
}