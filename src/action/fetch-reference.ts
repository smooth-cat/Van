import { Location, Position, Uri, commands, TextDocument, workspace, Range, LocationLink, DocumentSymbol } from 'vscode';
import { fromPos, getSymbolKey, openDocument, retryGetSymbols } from '../methods';
import { exchange, sortBy } from '../../shared/utils';
import { fetchSymbol } from './fetch-symbol';

export async function fetchReference(pos: Position, uri: Uri) {
  pos = fromPos(pos);
  uri = Uri.from(uri);

  try {
		
		
    const p = Promise.all([
      commands.executeCommand('vscode.executeDefinitionProvider', uri, pos),
      commands.executeCommand('vscode.executeReferenceProvider', uri, pos)
    ]);

    const [definition, locations] = (await p) as [(Location | LocationLink)[], Location[]];
    console.log('当前选中标识符引用', locations);
    console.log('当前选中标识符definition', definition);
		
    const sortEntry = sortBy(
      locations,
      loc => loc.uri.path,
      loc => loc.uri
    );

    const refPromises = sortEntry.map(([uri]) => {
      return openDocument(uri);
    });

    const promises = [...refPromises, handleDefine(definition) as any];
		console.time();
		Promise.all(refPromises).then(() => {
			console.timeEnd();
		})
    const res = await Promise.all(promises);
    const define = res[res.length - 1];

		let defineI: number|undefined =  undefined;
		let activeI: number|undefined =  undefined;
    const fileRefs = sortEntry.map(([uriItem, locs], i) => {
			if(define?.uri?.path === uriItem.path) {
				defineI = i;
			}

			const uriActive = uriItem.path === uri.path;
			if(uriActive) {
				activeI = i;
			}
      const doc = res[i];
      const handledLocs = locs.map(loc => ({
        ...loc,
				active: isActiveRef(uriActive, pos, loc),
        ...getText(doc, loc.range)
      }));

      uriItem = relative(uriItem);
			uriItem['active'] = uriActive;
			uriItem['expand'] = true;
			uriItem['showMore'] = locs.length <= 25;
      return [uriItem, handledLocs] as const;
    });

		if(activeI != null &&  activeI !== 0) {
			exchange(fileRefs, 0, activeI);
		}

		// 定义和 active 相同说明已经位移过了不需要动
		if(defineI != null && defineI !== activeI) {
			// 修正 defineI 的位置
			defineI === 0 && (defineI = activeI);
			if(defineI !== 1) {
				exchange(fileRefs, 1, defineI!);
			}
		}
		
    return {
      fileRefs,
      define,
			activePos: pos,
			activeUri: uri,
    };
  } catch (error) {
    console.log('获取reference错误', error);
  }
}

function isActiveRef(uriSame:boolean, pos: Position, loc: Location) {
	if(!uriSame) return false;
	return loc.range.contains(pos);
}

const handleDefine = async (dif: (Location | LocationLink)[]) => {
  const first = dif[0];
  if (!first) return undefined;

  let loc: Location = first as any;
  if (!(first instanceof Location)) {
    const hasSRange = !!first.targetSelectionRange;
    const start = hasSRange ? first.targetSelectionRange!.start : first.targetRange.start;
    const end = hasSRange ? first.targetSelectionRange!.end : first.targetRange.end;

    const range = new Range(start, end);

    loc = new Location(first.targetUri, range);
  }
  const docP = openDocument(loc.uri);

	const symbolsP = fetchSymbol(loc.uri);

	const [doc, { symbols: docSymbols }] = await Promise.all([docP, symbolsP] as const);

	const symbolKey = getSymbolKey(docSymbols, loc.range.start);
	console.log({ symbolKey, docSymbols });
  const uri = relative(loc.uri);

  let rawRange = first instanceof Location ? first.range : first.targetRange;

  if (rawRange.start.line === rawRange.end.line) {
    rawRange = extStart(rawRange, 60);
  }

  // 声明字符串
  const declaration = doc.getText(rawRange).slice(0,60);

  return {
    ...loc,
    uri,
    ...getText(doc, loc.range),
    declaration,
		symbolKey,
		miss: false,
		delta: 0
  };
};

function extStart(range: Range, len = 60) {
  const end = new Position(range.start.line, range.start.character + len);
  const newRange = new Range(range.start, end);
  return newRange;
}

function getText(document: TextDocument, range: Range) {
	const prefixRange = new Range(new Position(range.start.line, 0), range.start);
	const suffixRange = new Range(new Position(range.end.line, range.end.character), new Position(range.end.line, range.end.character + 60));
	const lineTextRange = extStart(range, 60);

	const prefix = document.getText(prefixRange).slice(0,60);
	const suffix = document.getText(suffixRange).slice(0,60);
  const lineText = document.getText(lineTextRange).slice(0,60);
  const sameLine = range.start.line === range.end.line;
  let name: string;

  if (sameLine) {
    name = lineText.slice(0, range.end.character - range.start.character);
  } else {
    name = document.getText(range);
  }

  return {
    name,
    lineText,
		prefix,
		suffix,
  };
}

export const relative = (uri: Uri) => {
  const workspacePath = workspace.workspaceFolders?.[0].uri.path;
  if (!workspacePath) return uri;
  return {
    ...uri,
    relativePath: uri.path.slice(workspacePath.length + 1)
  } as any as Uri;
};
