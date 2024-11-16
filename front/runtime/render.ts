import { effect, ReactiveEffect } from "@vue/reactivity";
import { diff, nodeOpr } from "./diff";
import { el, fn, IEl, train } from "./el";
import { Func } from "./type";
import { FlushStatus, getVar, setVar } from "./global";
import { processPatchList } from "./patch";

export let ROOT: IEl;


export const render = (app: IEl, dom: HTMLElement) => {
	ROOT = el('root', {}, [app]);
	ROOT.dom = dom;
	window['root'] = ROOT;
	diff(null, app);
}


const p = Promise.resolve();
// TODO: propsChanged 测试
// TODO: 复测 arr diff
export const dispatchFlush = () => {
	p.then(flush)
}

function flush() {
	setVar('flushStatus', FlushStatus.Flushing);
	const roots = getVar('diffRoots');
	let prev: IEl|undefined;
	// 处理所有更新节点
	while ((prev = roots.poll()) != null) {
		const handled = !prev.FC?.renderEffect.dirty;
		const willDestroy = prev.willDestroy;
		// 已经被父组件更新过，父组件diff时标记为删除，则不需要做重复 diff
		if(handled || willDestroy) continue;
		const curr = nodeOpr.cloneFCNode(prev);
		const parent = prev.parent;
		const childI = prev.index;
		diff(prev, curr);

		// 更新完的 dom 替换旧的
		if(parent != null && childI != null) {
			curr.index = childI;
			const children = parent.$children;
			children[childI] = curr;
			curr.parent = parent;

			if(childI === 0) {
				parent.child = curr;
			}

			const before = children[childI-1];
			const after = children[childI+1];

			
			before && (before.sibling = curr);
			after && (curr.sibling = after);
		}
	}
	// 完成后处理所有 Patch 补丁
	processPatchList()
	setVar('flushStatus', FlushStatus.None);
}