import * as vscode from 'vscode';
import { Message } from '../shared/message';
import { MsgType } from '../shared/var';
import { getConfig } from './methods';
import { getDefaultBindingKey, watchBind } from './methods/hack-keybind';
export class NavViewProvider implements vscode.WebviewViewProvider {

	private _view?: vscode.WebviewView;

	constructor(
		public _extensionUri: vscode.Uri,
		public extCtx: vscode.ExtensionContext,
		public onResolved?: (self: NavViewProvider) => void,
	) { }

	disposes: vscode.Disposable[] = [];

	public async resolveWebviewView(
		webviewView: vscode.WebviewView,
		context: vscode.WebviewViewResolveContext,
		_token: vscode.CancellationToken,
	) {
		this.disposes.forEach(v => v.dispose());
		this.disposes = [];
		this._view = webviewView;
		const { webview } = webviewView;

		webview.options = {
			enableScripts: true,
			localResourceRoots: [
				this._extensionUri
			]
		}; 
		
		this.setWebviewHTML(webview);
		/*----------------- 插件在后台不会响应 配置变化，每次显示都刷新一下 -----------------*/
		this.disposes.push(
			webviewView.onDidChangeVisibility(async() => {
				console.log('refresh-webview', 'onDidChangeVisibility');
				if(webviewView.visible) {
					this.setWebviewHTML(webview);
				}
			})
		);

		/*----------------- 绑定变化 -----------------*/
		watchBind(this);

		/*----------------- 通信中心 -----------------*/
		this.msg = new Message(
			(msg) => webview.postMessage(msg),
			(fn) => this.disposes.push(webview.onDidReceiveMessage((msg) => fn(msg))),
		);

		/**
		 * hmr 刷新页面，
		 * setWebviewHTML => unload => Reload =>  setWebviewHTML 会导致死循环，
		 * 目前只对热重载做了处理
		 */
		if(ENV === 'dev') {
			this.msg.on(MsgType.Reload, async() => {
				console.log('refresh-webview', 'Reload');
				this.setWebviewHTML(webview);
			})
		}

		const msgDisposable = new vscode.Disposable(() => this.msg.clear());
		this.disposes.push(msgDisposable);
		this.extCtx.subscriptions.push(...this.disposes);
		this.onResolved?.(this);
	}

	msg?: Message = { emit: () => {} } as any;

	private getSrc = (path: string) => {
		// @ts-ignore
		if(ENV === 'dev') {
			return `http://127.0.0.1:8080/${path}`;
		}
		return this._view?.webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'dist', path));
	}

	 setWebviewHTML = (webview: vscode.Webview) => {
		// Use a nonce to only allow a specific script to be run.
		const nonce = getNonce();
		const keyBind = getDefaultBindingKey(this);
		this.extCtx.subscriptions.push()
		const conf = JSON.stringify(getConfig());
		const translateObj = JSON.stringify(vscode.l10n.bundle || {});
		const keyBindObj = JSON.stringify(keyBind || {});
		console.log('conf', conf);
		console.log('translateObj', translateObj);
		console.log('keyBindObj', keyBindObj);
		const injectVar = `<script nonce="${nonce}">window['conf']=${conf};window['translateObj']=${translateObj};window['keyBindObj']=${keyBindObj}</script>`;
		// const injectedConfigScript = ``;
		// Get the local path to main script run in the webview, then convert it to a uri we can use in the webview.
		const scriptUri = this.getSrc('index.js');
		// Do the same for the stylesheet.
		const cssUri = this.getSrc('index.css')

		const html = `<!DOCTYPE html>
			<html lang="en">
			<head>
				<meta charset="UTF-8">
				<!--
					Use a content security policy to only allow loading images from https or from our extension directory,
					and only allow scripts that have a specific nonce.
				-->
				<!--
				<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource}; script-src 'nonce-${nonce}';">
				-->
				<meta name="viewport" content="width=device-width, initial-scale=1.0">
				<link nonce="${nonce}" href="${cssUri}" rel="stylesheet">
				<title>Van</title>
				${injectVar}
			</head>
			<body>
				<div id='app' data-vscode-context='${JSON.stringify({ preventDefaultContextMenuItems: true })}' ></div>
				<script nonce="${nonce}" src="${scriptUri}"></script>
			</body>
			</html>`;

		webview.html = html;
	}

	// 添加公共方法获取视图状态
	public isVisible() {
		return this._view?.visible;
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