import { DocumentSymbol, Location, Position, Range, Uri as RawUri } from "vscode";

export type Uri = RawUri & {
	relativePath: string;
	active: boolean;
}

export enum MsgType {
	DocSwitch = 'DocSwitch',
	CursorMove = 'CursorMove',
	SelectionChange = 'SelectionChange',
	CodeChanged = 'CodeChanged',
	DeleteFile = 'DeleteFile',
	RenameFile = 'RenameFile',
	Request = 'Request',
	Response = 'Response',
	Reload = 'Reload',
}

export enum ReqType {
	Command = 'Command',
	Eval = 'Eval'
}


export type IRange = [Position, Position]

export type Loc = {
	uri: Uri,
	range: IRange,
}

export type Reference = Loc & {
	name: string;
	lineText: string;
	suffix: string;
	prefix: string;
	active: boolean;
}

export type Define = Reference & {
	/** 包含声明关键字的字符串 */
	declaration: string;
};

export type FileRef = [Uri, Reference[]];

export type FetchRefRes = {
	define: Define,
	fileRefs: FileRef[],
	key: number,
}

export type DocNode = Pick<DocumentSymbol, 'name' | 'kind'> & {
	children: DocNode[],
	location: Loc,
	range: IRange,
}

export enum CursorMoveKind {
	/**
	 * Selection changed due to typing in the editor.
	 */
	Keyboard = 1,
	/**
	 * Selection change due to clicking in the editor.
	 */
	Mouse = 2,
	/**
	 * Selection changed because a command ran.
	 */
	Command = 3,

	BackOrForward = 'BackOrForward',
	GotoLocation = 'GotoLocation'
}