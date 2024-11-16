import { commands, DocumentSymbol, TextDocument } from "vscode";
import { dfs, pick } from "../shared/utils";

export async function docProcess(doc: TextDocument) {
	try {
		const docSymbols = (await commands.executeCommand<DocumentSymbol[]>(
			'vscode.executeDocumentSymbolProvider',
			doc.uri,
		)) || [];
		
		
		const root = {
			children: docSymbols,
		} as DocumentSymbol;


		dfs(root, 
			(item) => {
				const newNode = pick(item, ['name', 'location' as any, 'kind']);
				newNode.range = item?.['location']?.range;
				item['newNode'] = newNode;
		}, (item, stack) => {
			const parent = stack[stack.length - 2];
			if(parent) {
				const newNode = parent['newNode']
				const { children = [] } = newNode;
				children.push(item['newNode']);
				item['newNode'] = undefined;
				newNode.children = children;
			}
		}, 'children');

		const res = root['newNode'].children
		console.log('当前活动文件symbols', res);
		return res;
	} catch (error) {
		console.log('获取symbols错误', error);
	}
}
