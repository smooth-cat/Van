import { workspace } from "vscode";

export function fetchWorkspacePath() {
	const workspacePath = workspace.workspaceFolders?.[0].uri.path;
	return workspacePath;
}