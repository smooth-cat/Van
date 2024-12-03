import { dfs } from "./dfs";
import { diff, nodeOpr } from "./diff";
import { fn, IEl } from "./el";
import { __Internal_Event__ } from "./global";
import { findParentAndSib, loopChildrenDom } from "./patch";
import { ROOTS } from "./render";
import { Func } from "./type";

export function useHmr() {
	__Internal_Event__.on('hmr', ([...newTypeList]: any[]) => {
	
		const replaceCouples: [IEl, Func][] = [];
	
		ROOTS.forEach((ROOT) => {
			dfs(ROOT, (el) => {
				if(typeof el.$type === 'string') return;
				const hmrId = el.$type['hmrId'];
				const i = newTypeList.findIndex((it) => it.hmrId === hmrId);
				if(!~i) return;
		
				const newType = newTypeList[i];
				replaceCouples.push([el, newType]);
				return true;
			}, (el) => {});
		})

	
		if(replaceCouples.length === 0) {
			// 修改的内容和组件无关，则刷新页面
			window.location.reload();
			return;
		}
	
		replaceCouples.forEach(([prev, newType]) => {
			const hmrNode = fn(newType, prev.props);
			const parent = prev.parent;
			// 先将新节点放到 虚拟树中
			nodeOpr.replaceNode(parent, prev.index, hmrNode);

			// 把旧的销毁
			loopChildrenDom(prev, (dom) => {
				dom.remove?.();
			})
			prev.clear!({ deep: true });
			
			// hmr Node 只有父节点是复用节点是，才会让子节点挂载 newDoms
			parent!.alternate = true as any;
			// 生成新的 dom
			diff(null, hmrNode);
			parent!.alternate = undefined;

			const { pDom, sibDom = null } = findParentAndSib(hmrNode);
	
			if(!pDom) {
				console.warn(hmrNode, '找不到插入的父节点');
				return;
			}
	
			// 插入对应位置
			hmrNode.newDoms.forEach((dom) => {
				pDom.insertBefore(dom, sibDom);
			});
			hmrNode.newDoms.clear();
		});
	})
}