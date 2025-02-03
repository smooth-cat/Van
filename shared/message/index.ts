import { ExtPromise } from "../promise";
import { MsgType } from "../var";
import { timestamp } from "./event";

type Func = (msg: any) => any;

type IMsg = { type: string, data: any };

type IEmit = (msg: IMsg) => void;
type IListener = (fn: Func) => void;

export class Message {
  constructor(private emitter: IEmit, private listener: IListener) {
		this.listenReq();
    this.listener(this.handleMessage);
  }

  subMap = new Map<string, Set<Func>>();

  on = (type: string, fn: Func) => {
    const suber = this.subMap.get(type) || new Set<Func>();
    suber.add(fn);
    this.subMap.set(type, suber);
		return () => {
			suber.delete(fn);
		}
  };

  handleMessage = (msg: any) => {
    const { type, data } = msg;
    const suber = this.subMap.get(type);
    suber?.forEach(fn => {
      fn(data);
    });
  };

  emit = (type: string, data: any) => {
    this.emitter({ type, data });
  };

  clear = () => {
    this.subMap.clear();
		this.reqSubMap.clear();
		this.idToPromise.clear();
    // window.removeEventListener('message', this.handleMessage);
  };
  reqId = 0;
	reqSubMap = new Map<string, (res: Res, data: any) => void>();
  idToPromise = new Map<number, ExtPromise<ResDt>>();
  request = <T = any>(type: string, data: any) => {
    const promise = new ExtPromise<ResDt<T>>();
		this.reqId++;
		if(ENV === 'dev') {
			const start = timestamp();
			promise.then((res) => {
				const duration = timestamp() - start;
				console.log('requestTime', {
					duration,
					type,
					query: data,
					res,
				});
			})
		}
    this.emit(MsgType.Request, { reqType: type, reqData: data, reqId: this.reqId });
    this.idToPromise.set(this.reqId, promise as any);
    return promise;
  };
  
  private listenReq = () => {
    // 收到请求，获取监听器，存在的话就执行
    this.on(MsgType.Request, ({ reqType, reqData, reqId }) => {
      const listener = this.reqSubMap.get(reqType);
      if (!listener) return;
      const res = new Res(reqType, reqId, this.emit.bind(this));
      listener(res, reqData);
    });

    // 收到响应，找对应 id 的 promise 执行 resolve
    this.on(MsgType.Response, ({ reqData, reqId }) => {
      const pro = this.idToPromise.get(reqId);
      pro?.resolve(reqData);
      this.idToPromise.delete(reqId);
    });
  };

  onReq = (type: string, fn: (res: Res, data: any) => void) => {
    if (this.reqSubMap.has(type)) return;
    this.reqSubMap.set(type, fn);
  };
}

class Res {
  constructor(public reqType: string, public reqId: number, public emit: (type, data) => void) {}

  send(data: any) {
    const { reqId, reqType } = this;
    this.emit(MsgType.Response, { reqId, reqType, reqData: data });
  }
}

export type ResDt<T = any> = {
	data: T, error: any 
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