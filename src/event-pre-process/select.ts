import { commands, Location, Position, Range, TextEditorSelectionChangeEvent, window } from 'vscode';
import { Message } from '../../shared/message';
import { MsgType, TextEditorSelectionChangeKind } from '../../shared/var';
import { debounce } from '../../shared/utils';

const isFormer = (a: Position, b: Position) => {
  // 同行比列
  if (a.line === b.line) {
    return a.character < b.character;
  }

  // 不同行比行
  return a.line < b.line;
};

const isCursorMove = (a: Position, b: Position) => {
	return a.line === b.line && a.character === b.character;
}



/** cursor、选择变化, 输入也会触发 */
export const emitSelectOrCursorChange = async (e: TextEditorSelectionChangeEvent, msg: Message) => {
  // console.log('选择变化');
  // TODO: cursor 移动
  const { active, anchor } = e.selections[0] || {};
  const { document } = e.textEditor;
	const { kind } = e;
	
  const { uri } = document;
	if(isCursorMove(active, anchor)) {
		// if(e.kind !== TextEditorSelectionChangeKind.Mouse) return;
		// 有 4 种： 0.鼠标 1.键盘 2.代码片段等 3.其他系统前进后退指令
		msg.emit(MsgType.CursorMove, {pos: active, uri, kind });
		console.log('CursorMove',e, {pos: active, uri});
		return;
	}
  handleSelection({ active, anchor, document, msg, uri, kind });
};

const handleSelection = debounce(function ({active, anchor, document, msg, uri, kind}) {
	const aIsFormer = isFormer(active, anchor);

  let former = aIsFormer ? active : anchor;
  const later = aIsFormer ? anchor : active;

  const range = new Range(former, later);

  const text = document.getText(range);

  let i: number = 0;
  let dtY: number = 0;
  let dtX: number = 0;
  for (i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === '\n') {
      dtY++;
      dtX = -1;
      continue;
    }

    dtX++;

    if (!/\s/.test(c)) {
      break;
    }
  }

  const line = dtY > 0 ? former.line + dtY : former.line;
  const character = dtY > 0 ? dtX : former.character + dtX;

  // 未选中任何东西 -1 -> 正好选到 \n 后
  if (line === later.line && (character === later.character || character === -1)) {
    return;
  }



  // 去掉former选中部分多余的空白
  former = new Position(line, character);

  console.log('选中的文本', { text, len: text.length, former });

	msg.emit(MsgType.SelectionChange, {
		former,
		later,
		uri,
		kind,
	})
})

export const handleCommandMove = (msg) => {
	const cursor = window.activeTextEditor?.selection.active;
	const uri = window.activeTextEditor?.document.uri;
	console.log('handleCommandMove', cursor, uri);
	
	if(cursor == null || uri == null) return;
	msg.emit(MsgType.CursorMove, {pos: cursor, uri, kind: TextEditorSelectionChangeKind.BackOrForward });
}