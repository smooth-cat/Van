import { onUnmount } from "../runtime/life-circle"
import { Events } from "../util/var"

export const useEvent = (type: string|undefined, fn: Function) => {
	Events.on(type, fn as any);
	onUnmount(() => {
		Events.off(type, fn as any);
	})
}