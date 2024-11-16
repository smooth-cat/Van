export type WithChildren = Record<any, any> & { $children: WithChildren[]; __i?: number };

export type Callback<T extends  WithChildren> = (node: T, loopParent: BoundLoopParent<T>, parents: T[]) => boolean|void;
type BoundLoopParent<T extends  WithChildren> = (callback: (parent: T) => boolean) => void;

export function loopParent<T extends  WithChildren>(node: T, callback: (parent: T) => boolean|void) {
  let point = node;
  while ((point = point.parent) != null) {
    const res = callback(point);
    if(res) break;
  } 
 
}

export function dfs<T extends WithChildren>(root: T, beginWork: Callback<T>, completeWork: Callback<T>) {
  const stack: T[] = [];
  let current = root;
  while (1) {
    const loop: BoundLoopParent<T> = (callback) => loopParent(current, callback);
    const shouldSkip = beginWork(current, loop, stack);
    stack.push(current);
    // 下沉
    if (!shouldSkip && current.$children?.length) {
      current = current.$children[0];
      current.__i = 0;
      continue;
    }
    // 上浮
    complete: while (1) {
			stack.pop();
			
      const currentI = current.__i;
      current.__i = undefined;

      completeWork(current, loop, stack);

      if (current === root) {
        return;
      }

      const parent = stack[stack.length - 1];
      const siblingI = currentI! + 1;
      const sibling = parent.$children[siblingI];
      if (sibling) {
        sibling.__i = siblingI;
        current = sibling;
        break complete;
      }
      current = parent;
    }
  }
}

type NodeHandler<T> = (node: T) => boolean|void;
export function dfsFiber <T extends WithChildren>(root: T, beginWork: NodeHandler<T>, completeWork: NodeHandler<T>) {
	let current = root;
  while (1) {
		const shouldSkip = beginWork(current);
    // 下沉
    if (!shouldSkip && current.child) {
			current = current.child;
      continue;
    }
    // 上浮
    complete: while (1) {
      completeWork(current);

      if (current === root) {
        return;
      }

      const parent = current.parent;
      const sibling = current.sibling;
      if (sibling) {
        current = sibling;
        break complete;
      }
      current = parent;
    }
	}
}

