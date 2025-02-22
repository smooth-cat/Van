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