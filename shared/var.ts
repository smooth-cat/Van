import { DocumentSymbol } from "vscode";

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

export type DocNode = Pick<DocumentSymbol, 'name' | 'range' | 'kind'> & {
	children: DocNode[],
}