import { watch } from "@vue/reactivity";
import { getData, getProps } from "../runtime/global"
import { onPropsChanged, onUnmount } from "../runtime/life-circle";
import { debounce, IDebounceOpt } from "../../shared/utils";

export const useDebounceValue = (rawKey: string, key: string, isProps: boolean, opt?: IDebounceOpt) => {
	const data = getData();
	const props = getProps();
	const rawValue = () => isProps ? props[rawKey] : data[rawKey];
	data[key] = rawValue();

	const debounceValue = debounce(() => {
		const value = rawValue();
		data[key] = value;
	}, opt);

	if(isProps) {
		onPropsChanged(debounceValue);
	} else {
		const dispose = watch(() => data[rawKey], debounceValue);
		onUnmount(() => {
			dispose();
		})
	}
}