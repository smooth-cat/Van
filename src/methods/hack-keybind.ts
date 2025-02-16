import { Disposable, ExtensionContext } from "vscode";
import { Message } from "../../shared/message";
import { MsgType } from "../../shared/var";
import { latest, pick } from "../../shared/utils";
import { NavViewProvider } from "../provider";

const path = require('path');
const os = require('os');
const fs = require('fs');
const {readFile} = require('fs/promises');

const bindPath = (() => { 
	let basePath: string;
	let platform = os.platform();

	if (platform === 'win32') {
			basePath = path.resolve(os.homedir(), 'AppData', 'Roaming');
	} else if (platform === 'darwin') {
			basePath = path.resolve(os.homedir(), 'Library', 'Application Support');
	} else {
			basePath = path.resolve(os.homedir(), '.config');
	}
	const bindingPath = path.join(basePath, 'Code', 'User', 'keybindings.json');
	return bindingPath;
})();

export const latestKeyBinding = latest(getKeyBinding);

/** 
 * 获取 pkg 默认的绑定值
 */
export function getDefaultBindingKey(provider: NavViewProvider) {
	const { keybindings } = provider.extCtx.extension.packageJSON.contributes;
	let obj = {};
	for (const { command, key } of keybindings) {
		obj[command] = key;
	}
	return obj;
}

/**
 * 监听最新绑定数据发给客户端
 */
export async function watchBind(provider: NavViewProvider) {	
	const watcher = fs.watch(bindPath, () => {
		latestKeyBinding(provider).then((res) => {
			provider.msg.emit(MsgType.KeyBindChange, res);
		}, () => {
			console.log('过期的数据');
		})
	})
	const disposable = new Disposable(() => watcher.close());

	provider.extCtx.subscriptions.push(disposable);
}


/** 
 * 获取实时绑定的方法
 */
async function getKeyBinding(provider: NavViewProvider): Promise<Record<any, any> | undefined> {
	const comment = /(\/\*[\s\S]*?\*\/)|((?<!http:|https:)\/\/[^\n]*)/g;
	const bindMap = getDefaultBindingKey(provider);
	
	try {
		let keyBind = await readFile(bindPath, {encoding: 'utf-8'});
		keyBind = keyBind.replace(comment, '');
		const binds = JSON.parse(keyBind);
		for (const bind of binds) {
			// 将默认的修改为用户的
			if(Reflect.has(bindMap, bind.command)) {
				bindMap[bind.command] = bind.key;
			}
		}
	} catch (error) {
		console.log('获取绑定key失败', error);
	} finally {
		return bindMap;
	}
}

