import * as vscode from 'vscode';
import { Message } from '../shared/message';
import { MsgType } from '../shared/var';
export class GuideViewProvider implements vscode.WebviewViewProvider {

	private _view?: vscode.WebviewView;

	constructor(
		private readonly _extensionUri: vscode.Uri,
		public onResolved?: (self: GuideViewProvider) => void,
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
		
		webview.html = this._getHtmlForWebview(webview);
		
		this.msg = new Message(
			(msg) => { console.log('编辑器事件', msg);
			 webview.postMessage(msg)} ,
			(fn) => webview.onDidReceiveMessage((msg) => fn(msg)),
		)

		this.msg.on(MsgType.Reload, () => {
			console.log('收到reload');
			
			webview.html = this._getHtmlForWebview(webview);
		})

		this.onResolved?.(this);
	}

	msg: Message = {} as any;


	private getSrc = (path: string) => {
		// @ts-ignore
		if(ENV === 'dev') {
			return `http://127.0.0.1:8080/${path}`;
		}
		return this._view?.webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'dist', path));
	}

	private _getHtmlForWebview(webview: vscode.Webview) {
		
		// Get the local path to main script run in the webview, then convert it to a uri we can use in the webview.
		const scriptUri = this.getSrc('index.js');
		// Do the same for the stylesheet.
		const cssUri = this.getSrc('index.css')

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
				<!--
				<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource}; script-src 'nonce-${nonce}';">
				-->
				<meta name="viewport" content="width=device-width, initial-scale=1.0">
				<link nonce="${nonce}" href="${cssUri}" rel="stylesheet">
				<title>Cat Colors</title>
			</head>
			<body>
				<div id='app' data-vscode-context='${JSON.stringify({ preventDefaultContextMenuItems: true })}' ></div>
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
