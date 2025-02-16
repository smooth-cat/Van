import { latestKeyBinding } from "../methods/hack-keybind";
import { NavViewProvider } from "../provider";

export function fetchHackKeyBind(provider: NavViewProvider) {
	return latestKeyBinding(provider);
}