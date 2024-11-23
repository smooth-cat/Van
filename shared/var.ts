import { DocumentSymbol, Location, Position, Range, Uri } from "vscode";

export enum MsgType {
	DocSwitch = 'DocSwitch',
	CursorMove = 'CursorMove',
	SelectionChange = 'SelectionChange',
	CodeChanged = 'CodeChanged',
	DeleteFile = 'DeleteFile',
	RenameFile = 'RenameFile',
	Request = 'Request',
	Response = 'Response',
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
	wholeText: string;
	lineText: string;
}

export type DocNode = Pick<DocumentSymbol, 'name' | 'kind'> & {
	children: DocNode[],
	location: Loc,
	range: IRange,
}