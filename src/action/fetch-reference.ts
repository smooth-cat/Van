import { Location, Position, Uri, commands, TextDocument, workspace, Range, LocationLink } from 'vscode';
import { fromPos } from '../methods';
import { sortBy } from '../../shared/utils';

export async function fetchReference(pos: Position, uri: Uri) {
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

    const [definition, locations] = (await p) as [(Location | LocationLink)[], Location[]];
    console.log('当前选中标识符引用', locations);
    console.log('当前选中标识符definition', definition);

    const sortEntry = sortBy(
      locations,
      loc => loc.uri.path,
      loc => loc.uri
    );

    const refPromises = sortEntry.map(([uri]) => {
      return workspace.openTextDocument(uri);
    });

    const promises = [...refPromises, handleDefine(definition) as any];

    const res = await Promise.all(promises);

    const define = res[res.length - 1];

    const fileRefs = sortEntry.map(([uri, locs], i) => {
      const doc = res[i];
      const handledLocs = locs.map(loc => ({
        ...loc,
        ...getText(doc, loc.range)
      }));

      uri = relative(uri);

      return [uri, handledLocs] as const;
    });

    // TODO: 按文件分类 和 define

    return {
      fileRefs,
      define
    };
  } catch (error) {
    console.log('获取reference错误', error);
  }
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
  const doc = await workspace.openTextDocument(loc.uri);

  const uri = relative(loc.uri);

  let rawRange = first instanceof Location ? first.range : first.targetRange;

  if (rawRange.start.line === rawRange.end.line) {
    rawRange = extStart(rawRange, 2000);
  }

  // 声明字符串
  const declaration = doc.getText(rawRange);

  return {
    ...loc,
    uri,
    ...getText(doc, loc.range),
    declaration
  };
};

function extStart(range: Range, len = 40) {
  const end = new Position(range.start.line, range.start.character + len);
  const newRange = new Range(range.start, end);
  return newRange;
}

function getText(document: TextDocument, range: Range) {
  const lineText = document.getText(extStart(range, 2000));
  const sameLine = range.start.line === range.end.line;
  let name: string;

  if (sameLine) {
    name = lineText.slice(0, range.end.character - range.start.character);
  } else {
    name = document.getText(range);
  }

  return {
    name,
    lineText
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
