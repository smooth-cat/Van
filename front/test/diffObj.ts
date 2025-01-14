function diffObj(obj, cb, set = new Set(), keys = []) {
	if(set.has(obj)) {
		return;
	}

	set.add(obj);
	for (const key in obj) {
		if (Object.prototype.hasOwnProperty.call(obj, key)) {
			const el = obj[key];
			cb(obj, key, el, keys.join('.'))
			if(typeof el === 'object' && el != null) {
				// @ts-ignore
				keys.push(key)
				diffObj(el, cb, set, keys);
				keys.pop()
			}
		}
	}
}
export const test = {
	// @ts-ignore ✅ 测试 sibling 正确性
	sibling: (root=getRoot()) => diffObj(root, (t,k,v,p) => { 
		if(Object.prototype.hasOwnProperty.call(t, '$type')) {
			if(t.parent) {
				if(t.parent.$children[t.index+1] !== t.sibling ) {
					console.log({t,k,v,p, pnext:t.parent[t.index+1], sib: t.sibling });
				}
			}
		}
	}),
	// @ts-ignore ✅ 测试 newDoms 清空
	newDoms: (root=getRoot()) => diffObj(root, (t,k,v,p) => { 
		if(k === 'newDoms' && v.size > 0) {
			console.log({t,k,v,p});
		}
	}),

	// @ts-ignore ✅ 测试 owner 循环引用
	owner: (root=getRoot()) => diffObj(root, (t,k,v,p) => { 
		if(k === 'owner' && v.el.FC !== v) {
			console.log({t,k,v,p});
		}
	}),
	
	// @ts-ignore ✅ alternate 是否全部删除
	alternate: (root=getRoot()) => diffObj(root, (t,k,v,p) => { 
		if(k === 'alternate') {
			console.log({t,k,v,p});
		}
	}),
	// @ts-ignore ✅ child 引用是否正确
	child: (root=getRoot()) => diffObj(root, (t,k,v,p) => { 
		if(Object.prototype.hasOwnProperty.call(t, '$type')) {
			if(t.$children[0] !== t.child) {
				console.log({t,k,v,p});
			}
		}
	}),
	// @ts-ignore ✅ 是否引用已清空的 el
	clear: (root=getRoot()) => diffObj(root, (t,k,v,p) => { 
		if(Object.prototype.hasOwnProperty.call(t, '$type') && t.$type === undefined) {
			console.log({t,k,v,p});
		}
	}),

	// @ts-ignore ✅ index 和 parent 正确
	index: (root=getRoot()) => diffObj(root, (t,k,v,p) => { 
		if(t.$type) {
			if(!t.parent) {
				console.log('parent不存在', t, p);
			} else {
				if(t.parent.$children[t.index] !== t) {
					console.log({t,k,v,p})
				}
			}
		}
	}),


	// @ts-ignore ✅ el->FC->el 引用正确 FC 个数
	circleRef: (root=getRoot()) => diffObj(root, (t,k,v,p) => { 
		k==='FC' && console.log({t,k,v,p, isEq: t.FC?.el === t });
	}),

	testAll(root=getRoot()) {
		for (const key in this) {
			if (Object.prototype.hasOwnProperty.call(this, key)) {
				if(key === 'testAll') continue;
				const doTest = this[key];
				// @ts-ignore
				doTest(root);
			}
		}
	}
}
const getRoot = () => {
	let root;
	window['roots'].forEach((it) => root = it);
	console.log({ root });
	return root;
}

export const mountTest = () => {
	window['test'] = test;
}
