import { nodeOpr } from "./diff";
import { IEl } from "./el";

export enum PatchType {
	Add,
	Del,
	Move,
	PropChange,
}

type Patch = {
	type: PatchType,
	data: InsetData|any,
}


export const patchList = new Set<PatchBag>();
window['patchList'] = patchList;

export const addPatchBag = (it: PatchBag) => {
	if(it.patchSet.length) {
		patchList.add(it)
	}
};
export class PatchBag {
	types = new Set<PatchType>();
	 patchSet: Patch[]= [];
	patch = (type: PatchType, data: any) => {
		this.types.add(type)
		this.patchSet.push({
			type,
			data
		})
	}
	clear = () => {
		this.patchSet = [];
		this.types.clear();
	}
}

type InsetData = {
	fromPrev: IEl,
	fromNext: IEl,
	insPrev: IEl,
	insNext: IEl,
	parent: IEl,
}

// 靠后的节点先在队列前面，靠后的先插入保证 sibling 能找到
function handleAddDelMove (patchSet: Patch[]) {
	for (let i = 0; i < patchSet.length ; i++) {
		const { data, type } = patchSet[i];
		let node: IEl = data
		if(type === PatchType.Del) {
			// TODO: 考虑如何执行 __$_ref_cb，目前获取不到 dom 对应 node
			loopChildrenDom(node, (dom) => {
				dom.remove?.();
			})

			// unmount 销毁 el
			node.clear!({ deep: true });
			continue;
		} 

		const { pDom, sibDom = null } = findParentAndSib(node);

		if(!pDom) {
			console.warn(node, '找不到插入的父节点');
			continue;
		}

		if(type === PatchType.Add ) {
			const { newDoms } = node;
			if(newDoms.size === 0) {
				console.warn('找不到任何新增子节点')
			} 
			else {
				newDoms.forEach((it) => {
					pDom.insertBefore(it, sibDom);
				})
			}
			newDoms.clear();
			continue
		}

		if(type === PatchType.Move) {
			loopChildrenDom(node, (toHandle) => {
				pDom.insertBefore(toHandle, sibDom)
			})
		} 
	}
}

function loopChildrenDom(node: IEl, cb: (dom: HTMLElement|Text) => void) {
	// 删除所有 dom
	const firstDom = node.firstDom!();
	const lastDom = node.lastDom!();
	let point = firstDom;
	while (point !== lastDom) {
		// 先拿到再执行 dom 操作避免操作后 sibling 错误
		const sibling = point.nextSibling;
		cb(point);
		point = sibling as any;
	}
	cb(lastDom);
}

function findParentAndSib(node: IEl) {
	let point = node.parent;
	let sibDom = siblingDom(node);
	let pDom: HTMLElement | undefined = undefined;
	while (point) {
		// 找到 pDom 无论 sibDom 怎么样都需要返回了
		if(point.dom) {
			pDom = point.dom as HTMLElement;
			break;
		}

		// 没找到 sibDom,就找一下上层的 sibDom
		if(!sibDom) {
			sibDom = siblingDom(point);
		}
		point = point.parent;
	}

	return {
		pDom,
		sibDom,
	}
}

function siblingDom(node: IEl) {
	let point = node.sibling;
	while (point != null) {
		const first = point.firstDom!();
		if(first) {
			return first;
		}
	}
}

function handlePropChange (patchSet: Patch[]) {
	patchSet.forEach((it) => {
		const { key, value, isText, node, prevVal } = it.data;
		if(isText) {
			node.dom.textContent = value == null ? '' : value.toString()
		} else {
			nodeOpr.setDomProps(node, key, value, prevVal)
		}
	})
}

export function processPatchList() {
	patchList.forEach((bag) => {
		if(bag.types.has(PatchType.PropChange)) {
			handlePropChange(bag.patchSet);
		} else {
			handleAddDelMove(bag.patchSet);
		}
	})
	patchList.clear();
}