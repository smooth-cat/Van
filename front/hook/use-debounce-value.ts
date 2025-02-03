import { watch } from "@vue/reactivity";
import { getData } from "../runtime/global"
import { onUnmount } from "../runtime/life-circle";

export const useDebounceValue = (rawKey: string, key: string, time = 300) => {
	const data = getData();
	data[key] = data[rawKey];
	let timeout: NodeJS.Timeout;

	const dispose = watch(() => data[rawKey], () => {
		if(timeout) {
			clearTimeout(timeout);
			timeout = undefined;
		}

		timeout = setTimeout(() => {
			data[key] = data[rawKey]
			timeout = undefined;
		}, time);
	});

	onUnmount(() => {
		dispose();
	})
}