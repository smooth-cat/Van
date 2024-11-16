import { getVar } from "./global";
import { Func } from "./type";



export function onUnmount(fn: Func) {
	const cmp = getVar('curInitFC')!;
	cmp.lifeCircles.onUnmount.push(fn);
}

export function onPropsChanged(fn: (changedProps: any, oldProps: any) =>  void) {
	const cmp = getVar('curInitFC')!;
	cmp.lifeCircles.onPropsChanged.push(fn);
}