import { commands, Position, Uri } from "vscode";
import { fromPos } from "../methods";
import { NavViewProvider } from "../provider";
import { handleGotoLocation } from "../event-pre-process/select";

const DefaultOpt = {
	triggerEvent: true, 
	forceRefresh: false,
	addHistory: true,
}

type Opt = Partial<typeof DefaultOpt>;

export const gotoLocation = async(uri: Uri, pos: Position, opt: Opt,provider: NavViewProvider) => {
	const { triggerEvent, forceRefresh,  addHistory } = { ...DefaultOpt, ...opt };
	pos = fromPos(pos);
	uri = Uri.from(uri);
	try {
		const res = await commands.executeCommand('editor.action.goToLocations', uri, pos, [], 'goto', '');
		console.log('gotoLocation result', res);
		if(triggerEvent) {
			handleGotoLocation(uri, pos, provider.msg, forceRefresh, addHistory);
		}
	} catch (error) {
		console.log('gotoLocation error', error);
	}
};