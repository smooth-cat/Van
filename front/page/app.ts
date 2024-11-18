import { Message } from "../../shared/message";
import { MsgType } from "../../shared/var";
import { useAsync } from "../hook/use-async"
import { el, text } from "../runtime/el";
import { vscode } from "../util/var";

export const msg = new Message(
	(msg) => vscode.postMessage(msg),
	(fn) => window.addEventListener('message', (e) => fn(e.data)),
)

export const App = (data, props) => {
	data.msg = ''
	msg.on(MsgType.DocSwitch, (value) => {
		console.log('接到新消息', value);
	})

	const exec = (command: string) => {
		msg.emit(MsgType.Command, [command])
	}

	return () => {
		return [
			el('div', {  }, [
				text(`新消息：${data.msg}`),
				el('button', { onclick: () => exec('workbench.action.navigateBack') }, [
					text('向后')
				]),
				el('button', { onclick: () => exec('workbench.action.navigateForward') }, [
					text('向前')
				]),
			])
		]
	}
}