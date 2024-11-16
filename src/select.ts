import { commands, Location, Position, Range, TextEditorSelectionChangeEvent } from "vscode";

const isFormer = (a: Position, b: Position) => {
	// 同行比列
	if(a.line === b.line) {
		return a.character < b.character;
	}

	// 不同行比行
	return a.line < b.line;
}

export const findReferenceOnSelect = async(e: TextEditorSelectionChangeEvent) => {
	const { active, anchor } = e.selections[0] || {};
	const {document} = e.textEditor;
	const {uri} = document;
	const aIsFormer = isFormer(active, anchor);

	let former = aIsFormer ? active : anchor;
	const later = aIsFormer ?  anchor : active;

	const range = new Range(former, later);

	const text = document.getText(range);

	let i: number = 0;
	let dtY: number = 0;
	let dtX: number = 0
	for (i = 0; i < text.length; i++) {
		const c = text[i];
		if(c === '\n') {
			dtY++;
			dtX = -1;
			continue;
		}

		dtX++;

		if(!/\s/.test(c)) {
			break;
		}
	}

	const line = dtY > 0 ? former.line + dtY : former.line;
	const character = dtY > 0 ? dtX : former.character + dtX;

	// -1 -> 正好选到 \n 后
	if(line === later.line && (character === later.character || character === -1)) {
		return;
	}

	// 去掉former选中部分多余的空白
	former = new Position(line, character);

	console.log('选中的文本', {text, len: text.length, former});
	try {
		const locations: Location[] = await commands.executeCommand('vscode.executeReferenceProvider', uri, former);
		console.log('当前选中标识符locations', locations);
	} catch (error) {
		console.log('获取🎵错误', error);
	}
}