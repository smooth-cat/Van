import * as vscode from 'vscode';
import * as action from './action/index';
import { MsgType, ReqType } from '../shared/var';
import { emitSelectOrCursorChange, handleCommandMove } from './event-pre-process/select';
import { debounce } from '../shared/utils';
import { NavViewProvider } from './provider';
import { getChangedConf, updateDocCache } from './methods';

const { window, workspace } = vscode;


export function activate(context: vscode.ExtensionContext) {
	const provider = new NavViewProvider(context.extensionUri, context, onResolved);

	context.subscriptions.push(
		// viewType 视图的唯一id。这应该与package.json中views贡献的id匹配
		window.registerWebviewViewProvider('Van', provider),
		// 切换当前编辑文件
		window.onDidChangeActiveTextEditor(event => {
			const { uri } = event?.document || window.activeTextEditor?.document || {};
			if(uri?.scheme === 'file') {
				provider.msg.emit(MsgType.DocSwitch, uri);
			}
		}),
		// 切换选择 或 cursor移动
		window.onDidChangeTextEditorSelection((e) => emitSelectOrCursorChange(e, provider.msg)),
		// 文件内容改变
		workspace.onDidChangeTextDocument(debounce((e) => {
			updateDocCache(e.document);
			action.delSymbolsCache(e.document);
			provider.msg.emit(MsgType.CodeChanged, { uri: e.document.uri });
		})),
		// 删除项目文件
		workspace.onDidDeleteFiles((e) => {
			provider.msg.emit(MsgType.DeleteFile, { uris: e.files });
		}),
		// 新建文件(删除后撤销)
		workspace.onDidCreateFiles(debounce((e) => {
			provider.msg.emit(MsgType.CreateFile, { uris: e.files });
		})),
		// 重命名项目文件
		workspace.onDidRenameFiles((e) => {
			provider.msg.emit(MsgType.RenameFile, { uris: e.files });
		}),
		/**
		 * 注册 cmd shift p 命令，与 package.contributes.commands 联动
		 * provider 通过 postMessage 和 webview
		 */
		vscode.commands.registerCommand('Van.settings', async() => {
			vscode.commands.executeCommand('workbench.action.openSettings', 'Van.settings')
		}),
		vscode.workspace.onDidChangeConfiguration(async (e) => {
			const changedConf = getChangedConf(e);
			if(changedConf) {
				provider.msg.emit(MsgType.ConfigChange, changedConf)
			} 
    }),
		vscode.commands.registerCommand('Van.forward', async() => {
			const res = await vscode.commands.executeCommand('workbench.action.navigateForward')
			handleCommandMove(provider.msg);
		}),
		vscode.commands.registerCommand('Van.backward', async() => {
			const res = await vscode.commands.executeCommand('workbench.action.navigateBack')
			handleCommandMove(provider.msg);
		}),
		vscode.commands.registerCommand('Van.lockMode', () => {
			provider.msg.emit(MsgType.LockModeChange, {});
		})
	);



	function onResolved(self: NavViewProvider) {
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
	}
}

