import { Message } from "../../shared/message";
import { MsgType } from "../../shared/var";
import { useAsync } from "../hook/use-async"
import { el, text } from "../runtime/el";

// @ts-ignore
const vscode = acquireVsCodeApi();
export const msg = new Message(
	(msg) => vscode.postMessage(msg),
	(fn) => window.addEventListener('message', (e) => fn(e.data)),
)

export const App = (data, props) => {
	data.msg = ''
	msg.on(MsgType.DocSwitch, (value) => {
		console.log('接到新消息', value);
	})

	return () => {
		return [
			el('div', {  }, [
				text(`新消息：${data.msg}`)
			])
		]
	}
}