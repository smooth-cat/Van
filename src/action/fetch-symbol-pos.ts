import { commands, DocumentSymbol, Uri } from "vscode";

export async function fetchSymbolPos(uri: Uri, nestStruct: string[]) {
	uri = Uri.from(uri);
	const docSymbols = (await commands.executeCommand<DocumentSymbol[]>(
		'vscode.executeDocumentSymbolProvider',
		uri,
	)) || [];
	let currArr = docSymbols;
	let found: DocumentSymbol|undefined;
	let i = 0;
	for (; i < nestStruct.length; i++) {
		const expectName = nestStruct[i];
		found = currArr.find(it => it.name === expectName);
		if(!found) return undefined;
		currArr = found.children;
	}
	
	const { selectionRange: { start } } = found!;

	return start;
}