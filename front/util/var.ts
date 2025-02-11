import { Message } from "../../shared/message";
import { BaseEvent } from "../../shared/message/event";

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