import { Position, Uri, workspace } from "vscode";

workspace.registerFileSystemProvider
export const getText = (uri: Uri, start: Position, end: Position) => {

}

export const fromPos = (pos: Position) => {
	return new Position(pos.line, pos.character);
}