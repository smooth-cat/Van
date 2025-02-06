import { Uri } from "vscode";
import { fetchSymbol } from "./fetch-symbol";
import { SDocNode } from "../../shared/var";

export async function fetchSymbolPos(uri: Uri, symbolKey: string) {
	uri = Uri.from(uri);
	// symbolKey = `path-k1-k2`，
	const keys = symbolKey.slice(uri.path.length+1).split('-');
	const {symbols: docSymbols} = await fetchSymbol(uri);
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