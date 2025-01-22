import { Func } from "./type";
import { getVar } from "./global";
import { Component } from "./fc";
import { hasOwn, isObject } from "./util";
import { clear } from "./clear";
export type InitFn = (data,props) => any

export type IEl = {
	$type: string|Func,
	props: Record<any,any>,
	alternate?: IEl,
	$children: IEl[]; 
	__i?: number,
	child?: IEl,
	sibling?: IEl,
	parent?: IEl,
	dom?: HTMLElement | Text,
	// 
	clear?: (opt?: ClearOpt) => void,
	firstDom?: () => HTMLElement | Text,
	lastDom?: () => HTMLElement | Text,
	FC?: Component,
	level?: number,
	willDestroy?: boolean,
	index?: number, 
	owner?: Component,
	newEls: Set<IEl>, 
} 

export function text(value: any, $children: IEl[]=[]): IEl {
	const $: IEl = {
		$type: 'text',
		props: {value},
		$children,
		newEls: new Set(),
	};
	$.clear = clear.bind($);
	$.firstDom = firstDom.bind($);
	$.lastDom = lastDom.bind($);
	initOwner($);
	// train($);


	return $;
}
export function el(type: string, props: Record<any, any>= {}, $children: any[]=[]): IEl {
	const $: IEl = {
		$type: type,
		props,
		$children,
		newEls: new Set(),
	};
	$.clear = clear.bind($);
	$.firstDom = firstDom.bind($);
	$.lastDom = lastDom.bind($);

	// 给 ref 上 id 保证 diff 时 ref 的对象是唯一确定
	if(props.ref) {
		const ref = props.ref;
		// 给函数生成唯一 id 作为 key 的一部分
		if (!hasOwn(ref, 'toString')) {
			ref['id'] = ++id;
			ref.toString = function () {
				return this.id;
			};
		} 
	}

	initOwner($);
	train($);


	return $;
}
let id = 0;
export function fn(type: InitFn, props: Record<any, any> = {}): IEl {
	const $: IEl = {
		$type: type,
		props,
		$children: [],
		level: 0,
		newEls: new Set(),
	};
	
	// 给函数生成唯一 id 作为 key 的一部分
	if(!hasOwn(type, 'toString')) {
		type['id'] = ++id;
		type.toString = function () {
			return this.id;
		}
	} 

	const curRenderFC = getVar('curRenderFC');
	if(curRenderFC) {
		// 创建 node 时继承父组件的所有 ctx
		$.owner = curRenderFC;
		$.level = curRenderFC.el.level! + 1;
	}

	$.clear = clear.bind($);
	$.firstDom = firstDom.bind($);
	$.lastDom = lastDom.bind($);

	return $
}

function initOwner($: IEl) {
	const curRenderFC = getVar('curRenderFC');
	if(curRenderFC) {
		// 创建 node 时继承父组件的所有 ctx
		$.owner = curRenderFC;
	}
}


const DefaultClearOpt = {
	isUnmount: false,
	deep: false,
}

type ClearOpt= Partial<typeof DefaultClearOpt>;

// function clear(this: IEl, opt: ClearOpt = {}) {
// 	opt = { ...DefaultClearOpt, ...opt };

// 	if(opt.deep) {
// 		this.$children.forEach((c) => {
// 			c.clear?.(opt);
// 		})
// 	}

// 	if(this.FC) {
// 		// console.log('fc clear', this.FC);
		
// 		this.FC.clear();
// 		this.FC = undefined;
// 	}
// 	// this.$type = undefined as any;
// 	this.props = undefined as any;
// 	// this.clear = undefined;
// 	// 双向引用解绑
// 	if(this.alternate) {
// 		this.alternate.alternate = undefined;
// 		this.alternate = undefined;
// 	}
// 	this.$children = [];
// 	this.__i = undefined;
// 	this.child = undefined;
// 	this.sibling = undefined;
// 	this.parent = undefined;
// 	// this.dom=undefined;
// 	this.firstDom=undefined;
// 	this.lastDom=undefined
// 	this.level = undefined;
// 	this.index = undefined;   
// 	this.owner = undefined;
// 	this.newEls.clear();
// 	this.newEls = undefined as any;
// 	// console.log('clear el', this.dom ? this.dom : this);
// }

function firstDom(this: IEl) {
	// if(this.memoFirst) return this.memoFirst;
	if(this.dom) return this.dom;

	for (const it of this.$children) {
		const cDom = it.firstDom!();
		if(cDom) {
			// this.memoFirst = cDom;
			return cDom
		}	
	}
}

function lastDom(this: IEl) {
	// if(this.memoLast) return this.memoLast;
	if(this.dom) return this.dom;

	const len = this.$children.length;
	for (let i = len - 1; i >=0; i--) {
		const it = this.$children[i];
		const cDom = it.lastDom!();
		if(cDom) {
			// this.memoLast = cDom;
			return cDom
		}	
	}
}

export const train = (el: IEl) => {
	let prev;
	let delCount = 0;
	const newChildren = el.$children.filter((child, i) => {
		if(!isObject(child)) {
			delCount++;
			return false;
		}

		child.index = i - delCount;
		child.parent = el;
		// 第一项
		if(!prev) {
			el.child = child;
		} 
		// 后续项
		else {
			prev.sibling = child;
		}
		prev = child;

		return true;
	});
	el.$children = newChildren;
}