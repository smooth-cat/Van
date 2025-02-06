import { commands, Position, Uri } from "vscode";
import { fromPos } from "../methods";
import { NavViewProvider } from "../provider";
import { handleGotoLocation } from "../event-pre-process/select";

export const gotoLocation = async(uri: Uri, pos: Position, triggerEvent: boolean,provider: NavViewProvider) => {
	pos = fromPos(pos);
	uri = Uri.from(uri);
	try {
		const res = await commands.executeCommand('editor.action.goToLocations', uri, pos, [], 'goto', '');
		console.log('gotoLocation result', res);
		if(triggerEvent) {
			handleGotoLocation(uri, pos, provider.msg);
		}
	} catch (error) {
		console.log('gotoLocation error', error);
	}
};