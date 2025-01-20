import { DocumentSymbol, Position, Range, Uri, workspace } from 'vscode';
import { dfs, isFormer } from '../../shared/utils';

workspace.registerFileSystemProvider;
export const getText = (uri: Uri, start: Position, end: Position) => {};

export const fromPos = (pos: Position) => {
  return new Position(pos.line, pos.character);
};

export const getSymbolNestStruct = (docSymbols: DocumentSymbol[], pos: Position): string[] => {
  const struct: string[] = [];
  let currNodes = docSymbols;
  while (currNodes?.length !== 0) {
    const foundI = binarySearchSymbol(currNodes, pos);
    if (foundI == null) {
      break;
    }
    const found = currNodes[foundI];
    struct.push(found.name);
    currNodes = found.children;
  }
  return struct;
};

function binarySearchSymbol(nodes: DocumentSymbol[], pos: Position) {
  let start = 0;
  let end = nodes.length - 1;
  while (start <= end) {
    const mid = (start + end) >>> 1;
    const midV = nodes[mid];
    const midRange = (midV?.range) ?? (midV?.['location']?.range) as Range;
    const { start: s, end: e } = midRange;
    // 比头部小，则往前查找
    if (isFormer(pos, s)) {
      end = mid - 1;
    }
    // 比尾部大
    else if (isFormer(e, pos, true)) {
      start = mid + 1;
    }
    // 在里头，说明找到了
    else {
      return mid;
    }
  }
}
