import { getData, getProps } from "../runtime/global"

export const useVerify = (key: string, updateProp?: (v: any) => void) => {
	// 拿到的是 component 实例上的 data 和 props 在组件销毁之前都不会被清空或出错
	const data = getData();
	const props = getProps();
	 
	function verify(k: any) {
		return updateProp ? props[key] === k : data[key] === k;
	}

	function update(k: any) {
		updateProp ? updateProp(k) : data[key] = k;
	}

	return [verify, update]
}