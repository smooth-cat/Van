import { isReactive, isRef, toRaw } from "@vue/reactivity";
import { Message } from "../../shared/message";
import { BaseEvent } from "../../shared/message/event";
import { eqPos, isFormer } from "../../shared/utils";
import { ChangedArea, Reference, Uri } from "../../shared/var";
import { AbortCon } from "../runtime/abort-controller";

// @ts-ignore
export const vscode = globalThis.acquireVsCodeApi ? acquireVsCodeApi() : { postMessage: (msg) =>  console.log('模拟postMessage',msg)};

export const msg = new Message(
	(msg) => vscode.postMessage(msg),
	(fn) => window.addEventListener('message', (e) => fn(e.data)),
)

export const Events = new BaseEvent();

export enum FrontE {
	TreeExpand = 'TreeExpand'
}

export const t = (str: string, ...replacer: string[]) => {
	let res: string = window['translateObj'][str] || str;


	let start: number,end: number;
	if(replacer?.length) {
		const chars = res.split('');
		for (let i = chars.length - 1; i >= 0; i--) {
			const c = chars[i];
			if(c === '}') {
				end = i;
			};
			if(c==='{') {
				start = i;
				const len = end + 1 - start;
				// {0} -> replacer[0];
				const index = res.slice(start+1, end).trim();
				chars.splice(start, len, replacer[index]);
			};
		}
		const replaced = chars.join('');
		res = replaced;
	}
	return res;
}



window['t'] = t;

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

// TODO: 页面关闭时释放内存
export const abort = AbortCon();
export const signal = abort.signal;

export const isMac = /macintosh|mac os x/i.test(navigator.userAgent);


export function deepToRaw<T>(val: T): T {
  if (isRef(val)) {
    return deepToRaw(val.value) as T;
  }
  
  if (Array.isArray(val)) {
    return val.map(item => deepToRaw(item)) as T;
  }
  
  if (isReactive(val)) {
    const raw = toRaw(val)
    if (typeof raw === 'object' && raw !== null) {
      return Object.fromEntries(
        Object.entries(raw).map(([key, value]) => [
          key,
          deepToRaw(value)
        ])
      ) as T;
    }
  }
  
  return val;
}