import { Location, Position, Uri, commands, TextDocument, workspace, Range, LocationLink } from "vscode";
import { fromPos } from "../methods";

export async function fetchReference  (pos: Position, uri: Uri) {
	
	pos = fromPos(pos);

	uri = Uri.from(uri);

	const docMap = new Map<Uri, Thenable<TextDocument>>();
	const iToDocI = new Map<number, number>();

	let docIdx = 0;
  try {
		const p = Promise.all([
      commands.executeCommand('vscode.executeDefinitionProvider', uri, pos),
      commands.executeCommand('vscode.executeReferenceProvider', uri, pos)
    ]);
		
    const [definition, locations ] = (await p) as [(Location|LocationLink)[], Location[]];
    console.log('当前选中标识符引用', locations);
    console.log('当前选中标识符definition', definition);
		
		locations.forEach((loc, i) => {
			const uri = loc.uri;
			let promise = docMap.get(uri);
			if(!promise) {
				const toAdd = workspace.openTextDocument(uri);
				toAdd['i'] = docIdx++;
				promise = toAdd;
				docMap.set(uri, promise);
			}
			iToDocI.set(i, promise['i']);
		});

		const promises = [...Array.from(docMap.values()), handleDefine(definition) as any];
		
		const res = await Promise.all(promises);

		const defineLoc = res[res.length - 1];

		const handledLocation = locations.map((it, i) => {
			const docI = iToDocI.get(i);
			const document = res[docI!];
	
			return {
				...it,
				...getText(document, extRange(it.range))
			}
		})

		// TODO: 按文件分类 和 define 

		return handledLocation;
  } catch (error) {
    console.log('获取reference错误', error);
  }
}

const handleDefine = async(dif: (Location|LocationLink)[]) => {
	const first = dif[0];
	if(!first) return undefined;

	let loc: Location = first as any;
	if(!(first instanceof Location)) {
		const range = new Range(first.targetRange.start, first.targetSelectionRange?.end || first.targetRange.end); 
		
		loc = new Location(first.targetUri, range);
	}
	const doc = await workspace.openTextDocument(loc.uri);

	return {
		...loc,
		...getText(doc, loc.range),
	}
}

function extRange(range: Range) {
	const end = new Position(range.end.line, range.end.character + 20)
	const newRange =  new Range(range.start, end);
	return newRange;
}

function getText(document: TextDocument, range: Range) {
	const wholeText = document.getText(range);
	let lineText = '';
	for (let i = 0; i < wholeText.length; i++) {
		const char = wholeText[i];
		if(char==='\n') break;
		lineText += char;
	}
	return {
		wholeText,
		lineText,
	}
}