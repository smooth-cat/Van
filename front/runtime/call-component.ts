import { BaseEvent } from "../../shared/message/event";
import { ExtPromise } from "../../shared/promise";
import { fn, IEl } from "./el";
import { render, unmount } from "./render";
import { FC } from "./type";

export type WithEvent = {
	event?: BaseEvent;
	destroy?: () => void;
}

export const callComponent = <T extends FC<any, WithEvent>>(type: T,  props: Record<any, any>) => {
	function destroy() {
		if(root) {
			unmount(root);
		}
		event.clear();
		rootDom.remove();
	}
	const event = new BaseEvent();
	const rootDom = document.createElement('div');
	const root = render(fn(type, { ...props, event, destroy  }), rootDom);
	document.body.appendChild(rootDom);
	return [destroy, event] as const;
}