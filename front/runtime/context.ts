import { toReactive } from "@vue/reactivity";
import { getVar } from "./global";
import { Component } from "./fc";

/**
 * @param name 
 * @param obj 必须注入一个 value 是响应式对象的 collection
 */
export const inject = (name: string, obj: Record<any, any>) => {
	// 这时 ctx 已经更新为 el.ctx
	const currInit = getVar('curInitFC');
	currInit!.ctx[name] = obj;
}

export const use = (name: string) => {
	const currInit = getVar('curInitFC');
	let point: Component | null | undefined = currInit;

	do {
		const { ctx }  = point!;
		// 向上查找上下文
		if(Reflect.has(ctx, name)) {
			return ctx[name];
		}
		point = point?.el?.owner;
	} while (point != null);
}