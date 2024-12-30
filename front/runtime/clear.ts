import { dfs } from "./dfs";
import { IEl } from "./el";
const DefaultClearOpt = {
	isUnmount: false,
	deep: false,
}

type ClearOpt= Partial<typeof DefaultClearOpt>;

function doClear(node: IEl) {
  if (node.FC) {
    // console.log('fc clear', node.FC);

    node.FC.clear();
    node.FC = undefined;
  }
  // node.$type = undefined as any;
  node.props = undefined as any;
  // node.clear = undefined;
  // 双向引用解绑
  if (node.alternate) {
    node.alternate.alternate = undefined;
    node.alternate = undefined;
  }
  node.$children = [];
  node.__i = undefined;
  node.child = undefined;
  node.sibling = undefined;
  node.parent = undefined;
  node.dom = undefined;
  node.firstDom = undefined;
  node.lastDom = undefined;
  node.level = undefined;
  node.index = undefined;
  node.owner = undefined;
  node.newEls.clear();
  node.newEls = undefined as any;
}

export function clear(this: IEl, opt: ClearOpt = {}) {
	// if(this.$type === 'scroll-v') {
	// 	debugger
	// }
	opt = { ...DefaultClearOpt, ...opt };

	if(!opt.deep) {
		doClear(this);
		return;
	}
	
	dfs(this, () => {}, doClear);
}