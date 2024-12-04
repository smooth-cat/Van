import { dfs, dfsFiber, loopParent } from './dfs';
import { el, fn, IEl, train } from './el';
import { Component } from './fc';
import { getVar } from './global';
import { getMaxInc } from './max-inc';
import { addPatchBag, PatchBag, PatchType } from './patch';
import { Func } from './type';


/**
 * 函数节点状态 unInit init
 *
 * diffNode
 * 递阶段，构建正确的虚拟 dom 树
 * 1. 对比两个 key 相同节点
 * 		1.1 原生节点：
 *    1.2 函数节点(unInit)： subDirty 脏值检查， props 和 data 深度监听发现更新则标记 subDirty
 *        脏组件需要重新执行 render 函数生成新的 children，同时对其他属性浅拷贝
 *        非脏组件则对所有属性浅拷贝
 *
 * 2. 对 新 el children 进行 diff [el, el, fn]
 *
 *    2.1 children 复用的情况：
 * 				2.1.1 el 节点直接 递归递归调用 diffNode
 *        2.1.2 fn 节点直接 递归递归调用 diffNode
 *    2.2 children 不复用情况:
 *        2.2.1 diff 算法计算 el 的 增删移, patch 虚拟 dom 增删移，构建新旧节点 alternate
 *              递归调用 diffNode
 *
 *
 *
 * 归阶段，
 * 1. diff 比较每个原生节点的 prop 变化 patch 虚拟 dom 改动
 */
export function diff(oldRoot, newRoot: IEl) {
  nodeOpr.alternate(oldRoot, newRoot);
  dfsFiber(
    newRoot,
    // beginWork
    node => {
			// console.log('In', node);
			
      return processHandlers(
				[
					newElBeginWork, 
					reuseElBeginWork, 
					newFCBeginWork, 
					reuseFCBeginWork
				], 
				node
			);
    },
    // completeWork
    node => {
			// console.log('Out', node);
      processHandlers(
        [
          newElCpWork,
          reuseElCpWork,
          // newFCCpWork,
          reuseFCCpWork,
        ],
        node
      );
    }
  );
}
/**
 * TODO: 旧节点引用清空
 * 旧节点有两种
 * 1. patch Del 的节点 
 * 2. 和新节点 alternate 的节点
 */
/*----------------- 组件相关 diff -----------------*/
/** bg 新增组件 */
export const newFCBeginWork = (node: IEl) => {
  if (!(isFn(node) && node.alternate == null)) return null;
  // 初始化 FC
	node.FC = new Component(node);
	node.FC.init();
	// 渲染
	node.FC.renderEffect.run();
  return 0;
};
/** cp 新增组件 */
export const newFCCpWork = (node: IEl) => {
  if (!(isFn(node) && node.alternate == null)) return null;
};

/** bg 复用组件 */
export const reuseFCBeginWork = (node: IEl) => {
  if (!(isFn(node) && node.alternate != null)) return null;
	const props = node.props
	const prev = node.alternate;
	const cmp = node.FC = prev.FC!;
	prev.FC = undefined; // 避免在销毁节点时影响到新节点



	let changedProps = {};
	// props 触发的更新
	let propsChanged = false;
	for (const key in props) {
		const value = props[key];
		const prevVal = prev.props[key];
		if(!Object.is(value, prevVal)) {
			propsChanged = true;
			changedProps[key] = value;
		}
	}

	// data 触发的重渲染
	let dataChanged = cmp.renderEffect.dirty;
	
	if(!dataChanged && !propsChanged) {
		// 不需要重新 render 就把旧的 children 复用过来
		node.$children = prev.$children;
		train(node);
		cmp.update(node);
		return 1;
	}

	const propsHooks = cmp.lifeCircles.onPropsChanged;
	let prevProps = propsChanged ? { ...prev.props } : props;

	// 先更新 props 再触发函数
	cmp.update(node, propsChanged ? changedProps : undefined);

	if(propsChanged) {
		propsHooks.forEach(fn => fn(changedProps, prevProps))
	}
	
	cmp.renderEffect.run();
	nodeOpr.diffChildren(prev, node);
	return 0;
};
/** cp 复用组件 */
export const reuseFCCpWork = (node: IEl) => {
  // 执行条件
  if (!(isFn(node) && node.alternate != null)) return null;
	// 复用节点处理完成后删除其所有相关引用
	const prev = node.alternate;
	prev.clear!();
};

/*----------------- 原生节点相关 diff -----------------*/
/** bg 新增节点，创建节点 */
export const newElBeginWork = (node: IEl) => {
  // 执行条件
  if (!(isEl(node) && node.alternate == null)) return null;
  // 创建本节点 dom
  // 文本节点
  if (node.$type === 'text') {
		const value = node?.props?.value
    node.dom = document.createTextNode(value == null ? '' : value.toString());
  }
  // 普通节点
  else {
    node.dom = document.createElement(node.$type as string);
    for (const key in node.props) {
      const value = node.props[key];
			// 将 ref 收集起来，等到 dom 全部上了屏幕后再触发
			if(key === 'ref') {
				typeof value === 'function' && getVar('newRefEls').add(node);
			} else {
				nodeOpr.setDomProps(node, key, value)
			}
    }
  }
  return 0;
};
/** cp 新增节点，向上加入新增父节点 */
export const newElCpWork = (node: IEl) => {
  if (!(isEl(node) && node.alternate == null)) return null;

	let point: IEl|undefined = node;
	let prePoint : IEl = node;
  while ((point = point.parent) != null) {
		// 父节点复用了，把新增的节点记在需要 Patch 的子节点上
		if (point.alternate) {
			prePoint.newEls.add(node)
      break;
    }

    // 父节点是新节点直接使用 appendChild 并退出
		// 首屏 ROOT 会走这个逻辑，因为首屏 App 没有 alternate，
		// 那么所有 #app 的直接 dom 都被挂在到 #app 下面
    if (typeof point.$type === 'string' && point.dom) {
      point.dom.appendChild(node.dom!);
			break;
    }
		prePoint = point;
  } 
 
};

/** bg 复用原生节点需要向下继续 diff */
export const reuseElBeginWork = (node: IEl) => {
  if (!(isEl(node) && node.alternate != null)) return null;
  const prev = node.alternate!;
  // 子组件节点脏，进行 diff
  // 子组件节点不脏，也得进行 diff，这个节点的原生节点可能是脏的
  nodeOpr.diffChildren(prev, node);
  return 0;
};
/** cp 复用原生节点比较 props 打补丁 */
export const reuseElCpWork = (node: IEl) => {
  if (!(isEl(node) && node.alternate != null)) return null;

  const patcher = new PatchBag();
  const prevNode = node.alternate!;
  for (const key in node.props) {
    const value = node.props[key];
    const prevVal = prevNode.props[key];
    if (!Object.is(value, prevVal)) {
      patcher.patch(PatchType.PropChange, {
				key,
        prevVal,
        value,
        isText: node.$type === 'text',
        node
      });
    }
  }

	// 拷贝 __$_ref_cb 回调函数用于删除
	if(prevNode.props['__$_ref_cb']) {
		node.props['__$_ref_cb'] = prevNode.props['__$_ref_cb'];
	}

	addPatchBag(patcher)

	node.dom = prevNode.dom;
	// 处理完成后
	const prev = node.alternate;
	prev.clear!();
};

export const processHandlers = (fns: ((node: IEl) => number | null | void)[], node: IEl) => {
  for (const handler of fns) {
    const shouldSkip = handler(node);
    if (shouldSkip !== null) {
			// 1是跳过，0继续
      return shouldSkip as unknown as boolean;
    }
  }
	return false;
};
const isEl = (node: IEl) => typeof node.$type === 'string';
const isFn = (node: IEl) => typeof node.$type === 'function';

type ElKey = [any, any];

export const nodeOpr = {
  alternate(a, b) {
    if (a && b) {
      a.alternate = b;
      b.alternate = a;
    }
  },
	setDomProps(node: IEl, key: string, value: any, prevVal?: any) {
		const dom = node.dom as HTMLElement;
		const signal = node.owner?.abortCon.signal;
		// TODO: 考虑等 dom 真正挂到 旧 dom 树上后再触发，这样在ref中可以处理父 dom 结构
		// if(key === 'ref') {
		// 	// 新建元素触发的
		// 	if(!prevVal && typeof value === 'function') {
		// 		const cb = value(dom);
		// 		if(typeof cb === 'function') {
		// 			node.props['__$_ref_cb'] = cb;
		// 		}
		// 	}
		// 	return;
		// }

		if(key.indexOf('on') === 0) {
			prevVal && dom.removeEventListener(key.slice(2), prevVal)
			value && dom.addEventListener(key.slice(2), value, { signal });
		} else {
			if(key === 'style') {
				this.setDomStyle(dom, value);
			} else {
				dom.setAttribute(key, value == null ? '' : value.toString());
			}
		}
	},
	setDomStyle(dom: HTMLElement, value: string) {
		value.split(';').forEach((str) => {
			let [key, value] = str.split(':');
			if(key == null || value == null) return;

			key = key.trim();
			value = value.trim();
			if(key && value) {
				dom.style.setProperty(key, value);
			}
		})
	},
  assign(a: IEl, b: IEl) {
    ['type', 'props', 'data'].forEach(k => (a[k] = b[k]));
  },
  cloneFCNode(prev: IEl, props?: any) {
		const newNode = fn(prev.$type as Func, props ?? prev.props);
    return newNode;
  },
  tagKey(el: IEl) {
    return `${el.$type}.${el.props.key}`;
  },
  isEq(a: IEl, b: IEl) {
    return a.props.key === b.props.key && a.$type === b.$type;
  },
  diffChildren(prev: IEl, curr: IEl) {
		const patcher = new PatchBag();
    const prevList = prev.$children;
    const currList = curr.$children;
    /*----------------- 处理头部相同元素 -----------------*/
    /** 停在第一个不相同的元素 */
    let startI = 0;
		while (startI < prevList.length && startI < currList.length) {
			const prev = prevList[startI];
      const curr = currList[startI];
      if (!this.isEq(prev, curr)) {
        break;
      }
      this.alternate(prev, curr);
			startI++;
		}

		/*----------------- 处理纯尾删除、尾新增 -----------------*/
		// 尾部删除
		if(startI === currList.length) {
			if(startI < prevList.length) {
				patchPureDel(patcher, prevList, startI, prevList.length - 1);
				addPatchBag(patcher);
				return;
			}
			// 均越界说明完全相同
			return 
		}
		// 尾部新增
		if(startI === prevList.length) {
			if(startI < currList.length) {
				patchPureAdd(patcher, currList, startI, currList.length - 1);
				addPatchBag(patcher);
				return;
			}
			// 均越界说明完全相同
			return;
		}

		/*----------------- 处理尾部相同元素 -----------------*/
		// startI < 两数组.length
    let endI1 = prevList.length - 1;
    let endI2 = currList.length - 1;
		// 最多 startI meet endI
		while (startI <= endI1 && startI <=  endI2) {
			const prev = prevList[endI1];
      const curr = currList[endI2];
      if (!this.isEq(prev, curr)) {
        break;
      }
      this.alternate(prev, curr);
			endI1--; endI2--;
		}

		/*----------------- 头、中间纯新增删除 -----------------*/
		// meet 时，若 vEndI1 = vEndI2, 则 endI2--, endI2+1 = startI，curr 所有项都能找到 prev
		if(startI === endI2 + 1) {
			// 删除
			if(startI <= endI1) {
				patchPureDel(patcher, prevList, startI, endI1);
				addPatchBag(patcher);
				return;
			}
			return 
		}
		// meet 时， 因为 vEndI1 = vEndI2, endI1--, endI1+1 = startI，prev 所有项都能找到 curr
		if(startI === endI1 + 1) {
			// 新增
			if(startI <= endI2) {
				patchPureAdd(patcher, currList, startI, endI2);
				addPatchBag(patcher);
				return;
			}
			return 
		}

    /*----------------- 3. 增删移混合处理 -----------------*/
    const prevKeyMap = new Map<ElKey, number>();
    for (let i = startI; i <= endI1; i++) {
      const prevItem = prevList[i];
      prevKeyMap.set(this.tagKey(prevItem), i);
    }

    let minPrevIInCurr = Infinity;
    let hasMove = false;
    const currI2prevI: (number | undefined)[] = [];
    for (let i = endI2; i >= startI; i--) {
      const currItem = currList[i];
      const key = this.tagKey(currItem);
      let prevI = prevKeyMap.get(key);

			// // 有 prevI 但是 tag 不同，仍然视为新增项。而原来这一项就让其存在 map 中成为删除项
			// if(prevI && !this.isEq(currItem, prevList[prevI])) {
			// 	prevI = undefined;
			// }

      currI2prevI[i] = prevI;
      // 新增
      if (!prevI) {
        // 靠后的节点先在队列前面，但是应该先处理在前的插入
        patcher.patch(PatchType.Add, currItem);
        continue;
      }

      // 构建 alternate
      this.alternate(currItem, prevList[prevI]);

      // prevKeyMap 剩余项为删除项
      prevKeyMap.delete(key);

      // 移动 保持 min 最小
      if (prevI < minPrevIInCurr) {
        minPrevIInCurr = prevI;
      }
      // 这个 index 比靠后的 index 大说明 ，发生了位移
      else {
        hasMove = true;
      }
    }

    if (!hasMove) {
      patchMixDel(patcher, prevKeyMap, prevList);
      addPatchBag(patcher);
      return;
    }

    // 为了移动+新增顺序正确 清空新增 patch
    patcher.clear();

    const maxInc = getMaxInc(currI2prevI);

    let j = maxInc.length - 1;
    for (let i = currI2prevI.length - 1; i >= startI; i--) {
      const prevI = currI2prevI[i];
      const refI = maxInc[j];

      // 新增
      if (!prevI) {
        const currItem = currList[i];
        patcher.patch(PatchType.Add, currItem);
        continue;
      }

      //  碰到固定点
      if (prevI === refI) {
        (j > 0) && (j--);
        continue;
      }

			// 碰到移动点
			const currItem = currList[i];
			patcher.patch(PatchType.Move, currItem);
    }

    patchMixDel(patcher, prevKeyMap, prevList);
    addPatchBag(patcher);
  },
	replaceNode(parent: IEl|undefined, childI: number|undefined, curr: IEl) {
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
};


function patchPureAdd(patcher, currList, start, end) {
	// 靠后的先添加
	for (let i = end; i >= start; i--) {
		const it = currList[i];
		patcher.patch(PatchType.Add, it);
	}
}
function patchPureDel(patcher, prevList, start, end) {
	for (let i = end; i >= start; i--) {
		const it = prevList[i];
		// it.willDestroy = true;
		patcher.patch(PatchType.Del, it);
	}
}

function patchMixDel(patcher, prevKeyMap, prevList) {
	prevKeyMap.forEach(prevI => {
		const it = prevList[prevI];
		// 假设删除的同时还修改了内部的 data，就可以通过这个标志不触发渲染
		// it.willDestroy = true;
		patcher.patch(PatchType.Del, it);
	});
}

// 通过
// nodeOpr.diffChildren(
// 	el('div', {}, [
// 		el('div', {key: 'a'}, [])
// 	]),
// 	el('div', {}, [
// 		el('div', {key: 'b'}, [])
// 	])
// )