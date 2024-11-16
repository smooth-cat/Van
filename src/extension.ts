import * as vscode from 'vscode';
import { Message } from '../shared/message/index';
import { MsgType } from '../shared/var';
import { docProcess } from './doc-process';
import { findReferenceOnSelect } from './select';

const { window } = vscode;

export function activate(context: vscode.ExtensionContext) {

	const provider = new GuideViewProvider(context.extensionUri);

	context.subscriptions.push(
		// viewType 视图的唯一id。这应该与package.json中views贡献的id匹配
		window.registerWebviewViewProvider('code-guide', provider),
		// 切换当前编辑文件
		window.onDidChangeActiveTextEditor(event => {
			const document = event?.document || window.activeTextEditor?.document;
			docProcess(document as any).then((res) => {
				provider.msg.emit(MsgType.DocSwitch, res);
			})
		}),
		window.onDidChangeTextEditorSelection(findReferenceOnSelect)
		/**
		 * 注册 cmd shift p 命令，与 package.contributes.commands 联动
		 * provider 通过 postMessage 和 webview
		 */
		// vscode.commands.registerCommand('', () => {
		// })
	);
}

class GuideViewProvider implements vscode.WebviewViewProvider {

	private _view?: vscode.WebviewView;

	constructor(
		private readonly _extensionUri: vscode.Uri,
	) { }

	public resolveWebviewView(
		webviewView: vscode.WebviewView,
		context: vscode.WebviewViewResolveContext,
		_token: vscode.CancellationToken,
	) {
		this._view = webviewView;
		const { webview } = webviewView;

		webview.options = {
			// Allow scripts in the webview
			enableScripts: true,

			localResourceRoots: [
				this._extensionUri
			]
		}; 
		console.log('abc');
		
		webview.html = this._getHtmlForWebview(webview);
		
		this.msg = new Message(
			(msg) => webview.postMessage(msg) ,
			(fn) => webview.onDidReceiveMessage((msg) => fn(msg)),
		)

	}

	msg: Message = {} as any;


	private getSrc = (...paths: string[]) => {
		return this._view?.webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'dist', ...paths));
	}

	private _getHtmlForWebview(webview: vscode.Webview) {
		
		// Get the local path to main script run in the webview, then convert it to a uri we can use in the webview.
		const scriptUri = this.getSrc('index.js');
		// Do the same for the stylesheet.
		const styleResetUri = this.getSrc('reset.css')
		const styleVSCodeUri = this.getSrc('vscode.css')
		const styleMainUri = this.getSrc('main.css')

		// Use a nonce to only allow a specific script to be run.
		const nonce = getNonce();

		return `<!DOCTYPE html>
			<html lang="en">
			<head>
				<meta charset="UTF-8">
				<!--
					Use a content security policy to only allow loading images from https or from our extension directory,
					and only allow scripts that have a specific nonce.
				-->
				<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource}; script-src 'nonce-${nonce}';">
				<meta name="viewport" content="width=device-width, initial-scale=1.0">
				<link href="" rel="stylesheet">
				<title>Cat Colors</title>
			</head>
			<body>
				<div id='app' ></div>
				<script nonce="${nonce}" src="${scriptUri}"></script>
			</body>
			</html>`;
	}
}

function getNonce() {
	let text = '';
	const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
	for (let i = 0; i < 32; i++) {
		text += possible.charAt(Math.floor(Math.random() * possible.length));
	}
	return text;
}
