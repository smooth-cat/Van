type Func = (msg: any) => any;

type IMsg = { type: string, data: any };

type IEmit = (msg: IMsg) => void;
type IListener = (fn: Func) => void;

export class Message {
	constructor(private emitter: IEmit, private listener: IListener) {
		this.listener(this.handleMessage);
	}

	subMap = new Map<string, Set<Func>>();

	on = (type: string, fn: Func) => {
		const suber = this.subMap.get(type) || (new Set<Func>());
		suber.add(fn);
		this.subMap.set(type, suber);
	}

	handleMessage = (msg: any) => {
		const { type, data } = msg;
		const suber = this.subMap.get(type);
		suber?.forEach((fn) => {
			fn(data);
		})
	}

	emit = (type: string, data: any) => {
		this.emitter({ type, data });
	}

	clear = () => {
		this.subMap.clear();
		// window.removeEventListener('message', this.handleMessage);
	}
}

// webview
// const vscode = acquireVsCodeApi();
// export const msg = new Message(
// 	(msg) => vscode.postMessage(msg),
// 	(fn) => window.addEventListener('message', (e) => fn(e.data)),
// )

// const webview: any = {};
// const msg = new Message(
// 	(msg) => { webview.postMessage(msg) },
// 	(fn) => { webview.onDidReceiveMessage((msg) => fn(msg)) },
// )