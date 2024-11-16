import { el, IEl, train } from "./el";

const createDom = (text: string) => {
	const domNode = el('text', {value: text});
	// const dom = document.createElement('div')
	// dom.textContent = text;
	const dom = document.createTextNode(text)
	domNode.dom = dom;
	return domNode;
}
function buildTree(deep = 1000, width = 10) {
	const temp: any = () => 1;
	const root = el(temp, {tag: 'root'}, [])
	let parent = root;
	let prevLevelBefore: any = null;

	const createAndInsert = (hw: number, level: number) => {
		const arr: IEl[] = [];
		for (let i = 0; i < hw; i++) {
			const item = createDom(`level${level}`);
			arr[i] = item;
		}
		return arr;
	}

	for (let i = 0; i < deep; i++) {
		const subFn = el(temp, {tag: `level${i}Fn`}, [])
		const former = createDom(`level${i}-前`);
		const later = createDom(`level${i}-后`);
		// 按顺序插入
		document.body.insertBefore(former.dom!, prevLevelBefore);
		document.body.insertBefore(later.dom!, prevLevelBefore);
		
		const hw = width / 2;
		// formers 插入在 former 前
		const formers = createAndInsert(hw, i);
		formers.forEach((it) => document.body.insertBefore(it.dom!, former.dom!))

		// laters 插入在 later 后
		const laters = createAndInsert(hw, i);
		laters.forEach((it) => document.body.insertBefore(it.dom!, prevLevelBefore))

		// if(prevLevelBefore) {
		// 	document.body.insertBefore(former.dom!, prevLevelBefore);
		// 	document.body.insertBefore(later.dom!, prevLevelBefore);
		// } 
		// else {
		// 	document.body.appendChild(former.dom!);
		// 	document.body.appendChild(later.dom!);
		// }
		parent.$children = [
			...formers,
			former,
			subFn,
			later,
			...laters,
		]
		train(parent);
		parent = subFn;
		prevLevelBefore = later.dom;
	}
	return root;
}

export const root = buildTree();



export function dfsFiber1(root) {
	let current = root;
  while (1) {
		let shouldSkip = false;
		if(current.dom) {
			list1.push(current.dom);
			shouldSkip = true;
		}

    // 下沉
    if (!shouldSkip && current.child) {
			current = current.child;
      continue;
    }
    // 上浮
    complete: while (1) {
      // completeWork(current);

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

const list1: any[] = [];
console.time();
dfsFiber1(root);
console.log('用dfs');
console.timeEnd();
// 7.468994140625 ms
// console.log(list1.map(it => it.innerText));


const list: any[] = [];
console.time();
const first = root.firstDom!();
const last = root.lastDom!();

let point: any = first;
while (point != null) {
	list.push(point)
	point = point.nextSibling!;
}
console.log('用dom');
console.timeEnd();
// 0.714111328125
// console.log(list.map(it => it.innerText));