import { Uri } from "vscode";
import { fetchSymbol } from "./fetch-symbol";
import { SDocNode } from "../../shared/var";

export async function fetchSymbolPos(uri: Uri, symbolKey: string) {
	const keys = symbolKey.split('-').slice(1);
	uri = Uri.from(uri);
	const {symbols: docSymbols} = await fetchSymbol();
	let currArr = docSymbols;
	let found: SDocNode|undefined;
	let i = 0;
	for (; i < keys.length; i++) {
		const expectKey = keys[i];
		found = currArr.find(it => it.selfKey === expectKey);
		if(!found) return undefined;
		currArr = found.children;
	}
	
	const { selectionRange: { start } } = found!;

	return start;
}