import * as vscode from 'vscode';
import * as action from './action/index';
import { Message } from '../shared/message/index';
import { MsgType, ReqType } from '../shared/var';
import { emitSelectOrCursorChange, handleCommandMove } from './event-pre-process/select';
import { debounce } from '../shared/utils';
import { GuideViewProvider } from './provider';

const { window, workspace } = vscode;


export function activate(context: vscode.ExtensionContext) {

	const provider = new GuideViewProvider(context.extensionUri, onResolved);

	context.subscriptions.push(
		// viewType 视图的唯一id。这应该与package.json中views贡献的id匹配
		window.registerWebviewViewProvider('code-guide', provider),
		// 切换当前编辑文件
		window.onDidChangeActiveTextEditor(event => {
			const { uri } = event?.document || window.activeTextEditor?.document || {};
			if(uri) {
				provider.msg.emit(MsgType.DocSwitch, uri);
			}
		}),
		// 切换选择 或 cursor移动
		window.onDidChangeTextEditorSelection((e) => emitSelectOrCursorChange(e, provider.msg)),
		// 文件内容改变
		workspace.onDidChangeTextDocument((e) => {
			console.log('文档改变', e.contentChanges);
			debounce((e) => {
				provider.msg.emit(MsgType.CodeChanged, { uri: e.document.uri })
			})(e)
		}),
		// 删除项目文件
		workspace.onDidDeleteFiles((e) => {
			provider.msg.emit(MsgType.DeleteFile, { uris: e.files });
		}),
		// 重命名项目文件
		workspace.onDidRenameFiles((e) => {
			provider.msg.emit(MsgType.RenameFile, { uris: e.files });
		}),
		/**
		 * 注册 cmd shift p 命令，与 package.contributes.commands 联动
		 * provider 通过 postMessage 和 webview
		 */
		vscode.commands.registerCommand('code-guide.forward', async() => {
			const res = await vscode.commands.executeCommand('workbench.action.navigateForward')
			handleCommandMove(provider.msg);
		}),
		vscode.commands.registerCommand('code-guide.backward', async() => {
			const res = await vscode.commands.executeCommand('workbench.action.navigateBack')
			handleCommandMove(provider.msg);
		})
	);

	function onResolved(self: GuideViewProvider) {
		self.msg.onReq(ReqType.Command, async(res, data: any[]) => {
			const [name, ...args] = data;
			try {
				const result = action[name](...args, self);
				if(result instanceof Promise) {
					result.then((v) => {
						res.send({ data: v });
					})
				} else {
					res.send({ data: result });
				}
			} catch (error) {
				res.send({ error: error ?? 'unknown error' });
			}
		});

		self.msg.onReq(ReqType.Eval, async(res, data: string) => {
			console.log('接到eval指令', data);
			try {
				const result = eval(data);
				if(result instanceof Promise) {
					result.then((v) => {
						res.send({ data: v });
					})
				} else {
					res.send({ data: result });
				}
			} catch (error) {
				res.send({ error: error ?? 'unknown error' });
			}
		});

		self.msg.onReq('', (res, data) => {

		})
	}
}

