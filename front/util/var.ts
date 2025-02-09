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