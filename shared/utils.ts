import { Position } from "vscode";

export const pick = <T extends Record<any, any>>(t: T, keys: (keyof T)[]) => {
	let obj: any = {};
	for (const key of keys) {
		obj[key] = t[key];
	}
	return obj;
}

export function dfs<K extends string , T extends (Record<any, any> & { [k in K]: T[K]  })>(
  root: T,
  beginWork: (nod: T, stack: T[]) => void,
  completeWork: (nod: T, stack: T[]) => void,
	cKey: K,
) {
  const stack: T[] = [];
  let current = root;
  while (1) {
    beginWork(current, stack);
    stack.push(current);
    // 下沉
    if (current.children?.length) {
      current = current.children[0];
      // @ts-ignore
      current.__$_i = 0;
      continue;
    }
    // 上浮
    complete: while (1) {
      completeWork(current, stack);
      stack.pop()!;

      const currentI = current.__$_i;
      // @ts-ignore
      current.__$_i = undefined;
      if (current === root) {
        return;
      }

      const parent = stack[stack.length - 1];
      const siblingI = currentI! + 1;
      const sibling = parent.children[siblingI];
      if (sibling) {
        sibling.__$_i = siblingI;
        current = sibling;
        break complete;
      }

      current = parent;
    }
  }
}

export const debounce = <T extends Function>(fn: T, timeout = 300) => {
	let timer;
	return (function (this, ...args: any[]) {
		if(timer != null) {
			clearTimeout(timer);
			timer = null;
		}
		timer = setTimeout(() => {
			fn?.call(this, ...args);
			timer = null;
		}, timeout);
	}) as unknown as T;
}

type ISortBy = {
	<T = any, V = any, K = any>(arr: T[], cb: (it:T, i: number, arr: T[]) => V) : [V, T[]][];
	<T = any, V = any, K = any>(arr: T[], cb: (it:T, i: number, arr: T[]) => V, key?: (it:T, i: number, arr: T[]) => K) : [K, T[]][];
}

 export const sortBy: ISortBy = <T = any, V = any, K = any>(arr: T[], cb: (it:T, i: number, arr: T[]) => V, key?: (it:T, i: number, arr: T[]) => K) => {
	const map = new Map<V,T[]>();
	const keyMap = new Map<V, K>();
	for (let i = 0; i <arr.length; i++) {
		const it = arr[i];
		const res = cb(it, i, arr);
		if(key) {
			const k = key(it, i, arr);
			if(!keyMap.has(res)) {
				keyMap.set(res, k);
			}
		}

		let list = map.get(res);
		if(!list) {
			list = [];
			map.set(res, list);
		} 
		list.push(it);
	}

	const list: any[] = []
	map.forEach((value, res) => {
    const k = key ? keyMap.get(res) : res;
    list.push([k, value]);
  });
	
	return list;
 }


 export const isFormer = (a: Position, b: Position, equal = false) => {

  // 同行比列
  if (a.line === b.line) {
    return equal ? a.character <= b.character : a.character < b.character;
  }

  // 不同行比行
  return a.line < b.line;
};