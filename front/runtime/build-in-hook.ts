import { computed, ref } from "@vue/reactivity"
import { onPropsChanged } from "./life-circle";

export const useComputed = <T>(getter: () => T, deps: string[]) => {
	const updateFlag = ref(0);
	const computeValue = computed(() => {
		// 触发 getter
		updateFlag.value;
		const getRes = getter();
		return getRes;
	});
	const depSet = new Set(deps)
	onPropsChanged((changedProps) => {
		const hasKey = Object.keys(changedProps).some((key) => depSet.has(key))
		if(hasKey) {
			updateFlag.value++;
		}
	});
	return computeValue;
}

export const useRef = () => {
	let dom: HTMLElement;
	function ref(d) {
		dom = d;
	}
	return [() => dom, ref] as const;
}