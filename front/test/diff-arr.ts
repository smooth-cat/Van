import { reactive, ref } from "@vue/reactivity";
import { el, text } from "../runtime/el";

/**
 * 1. 单个元素 diff ✅
 * 2. key 值重复 ✅
 * 3. 纯移动 ✅
 * 4. 增、移 ✅
 * 5. 增删移 ✅
 * 6. 夹心纯新增 ✅
 * 7. 夹心纯删除 ✅
 * 8. 啥也不改的 ✅
 * 9. 删移 ✅
 * 10. 无 → 有
 * 11. 有 → 无
 */
export function App() {
	const a = reactive({v:AddMove.a });

	const other = AddMove.b

	function onclick() {
		a.v = other;
	}

	return () => {
		return [
			el('div', { onclick }, [text('替换')]),
			el('div', { style: 'display: flex; gap: 8px;' }, a.v.map(({ k, v }) => el('text', { key: k, value: v })))
		];
	}
}
// ✅
const ArrToNone = {
	a: [
		{ k: 'a', v: 0}, 
		{ k: 'b', v: 1}, 
		{ k: 'c', v: 2}, 
		{ k: 'd', v: 3}, 
		{ k: 'e', v: 4}, 
		{ k: 'f', v: 5}, 
	],
	b: [] as any,
}
// ✅
const NoneToArr = {
	a: [] as any,
	b: [
		{ k: 'a', v: 0}, 
		{ k: 'b', v: 1}, 
		{ k: 'c', v: 2}, 
		{ k: 'd', v: 3}, 
		{ k: 'e', v: 4}, 
		{ k: 'f', v: 5}, 
	]
}

// ✅
const DelMove = {
	a: [
		{ k: 'a', v: 0}, 
		{ k: 'b', v: 1}, 
		{ k: 'c', v: 2}, 
		{ k: 'd', v: 3}, 
		{ k: 'e', v: 4}, 
		{ k: 'f', v: 5}, 
	],
	b: [
		{ k: 'a', v: 0}, 
		{ k: 'e', v: 4}, 
		{ k: 'd', v: 3}, 
		{ k: 'b', v: 1}, 
	]
}

// ✅
const NoneChange = {
	a: [
		{ k: 'a', v: 0}, 
		{ k: 'b', v: 1}, 
		{ k: 'c', v: 2}, 
		{ k: 'd', v: 3}, 
		{ k: 'e', v: 4}, 
		{ k: 'f', v: 5}, 
	],
	b: [
		{ k: 'a', v: 0}, 
		{ k: 'b', v: 1}, 
		{ k: 'c', v: 2}, 
		{ k: 'd', v: 3}, 
		{ k: 'e', v: 4}, 
		{ k: 'f', v: 5}, 
	]
}

// ✅
const PureRemove = {
	a: [
		{ k: 'a', v: 0}, 
		{ k: 'b', v: 1}, 
		{ k: 'c', v: 2}, 
		{ k: 'd', v: 3}, 
		{ k: 'e', v: 4}, 
		{ k: 'f', v: 5}, 
	],
	b: [
		// { k: 'a', v: 0}, 
		{ k: 'b', v: 1}, 
		// { k: 'c', v: 2}, 
		{ k: 'd', v: 3}, 
		{ k: 'e', v: 4}, 
		// { k: 'f', v: 5}, 
	]
}

// ✅
const PureInsert = {
	a: [
		{ k: 'a', v: 0}, 
		{ k: 'b', v: 1}, 
		{ k: 'c', v: 2}, 
		{ k: 'd', v: 3}, 
		{ k: 'e', v: 4}, 
		{ k: 'f', v: 5}, 
	],
	b: [
		{ k: 'a', v: 0}, 
		{ k: 'b', v: 1}, 
		// ↓ 夹心
		{ k: 'add1', v: 99}, 
		// ↑ 夹心
		{ k: 'c', v: 2}, 
		{ k: 'd', v: 3}, 
		{ k: 'e', v: 4}, 
		{ k: 'f', v: 5}, 
	]
}
// ✅
const AddMoveDel = {
	a: [
		{ k: 'a', v: 0}, 
		{ k: 'b', v: 1}, 
		{ k: 'c', v: 2}, 
		{ k: 'd', v: 3}, 
		{ k: 'e', v: 4}, 
		{ k: 'f', v: 5}, 
	],
	b: [
		{ k: 'a', v: 0}, 
		// ↓ 进入 diff
		{ k: 'add1', v: 11}, 
		{ k: 'b', v: 1}, 
		{ k: 'add2', v: 12}, 
		{ k: 'add3', v: 13}, 
		{ k: 'd', v: 3}, 
		{ k: 'c', v: 2}, 
		// ↑ 进入 diff
		{ k: 'f', v: 5}, 
	]
}
// ✅
const Move = {
	a: [
		{ k: 'a', v: 0}, 
		{ k: 'b', v: 1}, 
		{ k: 'c', v: 2}, 
		{ k: 'd', v: 3}, 
		{ k: 'e', v: 4}, 
		{ k: 'f', v: 5}, 
	],
	b: [
		{ k: 'a', v: 0}, 
		{ k: 'e', v: 4},  // 1
		{ k: 'c', v: 2}, 
		{ k: 'd', v: 3}, 
		{ k: 'f', v: 5}, 
		{ k: 'b', v: 1},  // 4 调换
	]
}
// ✅
const AddMove = {
	a: [
		{ k: 'a', v: 0}, 
		{ k: 'b', v: 1}, 
		{ k: 'c', v: 2}, 
		{ k: 'd', v: 3}, 
		{ k: 'e', v: 4}, 
		{ k: 'f', v: 5}, 
	],
	b: [
		{ k: 'a', v: 0}, 
		{ k: 'b', v: 1}, 
		// ↓ 进入 diff
		{ k: 'add1', v: 11}, 
		{ k: 'add2', v: 12}, 
		{ k: 'add3', v: 13}, 
		{ k: 'e', v: 4}, 
		{ k: 'd', v: 3}, 
		{ k: 'f', v: 5}, 
		{ k: 'c', v: 2}, 
		// ↑ 进入 diff
	]
}