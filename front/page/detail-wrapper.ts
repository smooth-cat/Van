import { toRaw, toReactive } from "@vue/reactivity";
import { FetchRefRes, MsgType, ReqType, CursorMoveKind } from "../../shared/var";
import { AsyncState, useAsync } from "../hook/use-async";
import { FC } from "../runtime/type";
import { Events, msg } from "../util/var";
import { Detail, Props } from "./detail";
import { el, fn } from "../runtime/el";
import { info } from "../components/toast";
import { useEvent } from "../hook/useEvent";
import { inject } from "../runtime/context";

export type WrapperProps = {
	
}
type WrapperData = {
	refs: AsyncState<FetchRefRes>;
	detailStack: any[];
}


export const DetailWrapper: FC<WrapperData, Props> = (data, props) => {
	data.key = performance.now();


	const [run, reset] = useAsync('refs', async(pos, uri, kind: CursorMoveKind) => {
		// 有详情时，移动位置在包含在详情内则不需重新加载，只改变 激活位置即可

		const res = await msg.request<FetchRefRes>(ReqType.Command, ['fetchReference', toRaw(pos), toRaw(uri)]);
		data.key = performance.now();
		console.log('收到引用详情',res);
		
		const { define, fileRefs } = res.data || {};

		if(define && !!fileRefs?.length) {
			return res.data;
		} else {
			info('未找到任何引用!');
			return data.refs.value;
		}
	})

	msg.on(MsgType.CursorMove, ({ pos, uri, kind }) => handleMoveOrSelect(pos, uri, kind))
	msg.on(MsgType.SelectionChange, ({ former, uri, kind }) => handleMoveOrSelect(former, uri, kind));


	function handleMoveOrSelect(pos, uri, kind) {
		// 如果移动到引用列表的任意位置则继续
		const shouldRefresh = [CursorMoveKind.Mouse, CursorMoveKind.BackOrForward, CursorMoveKind.GotoLocation].includes(
      kind
    );
		if(shouldRefresh) {
			run(pos, uri, kind);
		}
	}


	function hasRefs() {
		const { value: {define,fileRefs } = {} } = data.refs;
		const has = define && !!fileRefs?.length
		return has;
	}

	// 将 activePos,activeUri 注入给子组件上下文
	inject('detail-ctx', data.refs);

	return () => {
		const { value: {define,fileRefs,activePos, activeUri } = {} } = data.refs;
		const showDetail = hasRefs();

		return [
			el('div', {  }, [
				showDetail && fn(Detail, { key: data.key, fileRefs, define, close: reset })
			])
		]
	}
}

const useDetailStack = (data) => {
	const detailStack = toReactive([]);
	data.detailStack = detailStack;
	const stackIns = new DetailStack(detailStack);
	return stackIns
}

class DetailStack {
	constructor(public stack: any[], max = 15) {}

	push = (...args: any[]) => {
		const newLen = this.stack.push(...args);
		if(newLen > 15) {
			this.stack.splice(0, newLen - 15);
			return 15
		}
		return newLen;
	}
	pop  = () => {
		return  this.stack.pop();
	}

	peek = () => {
		return this.stack[this.stack.length-1];
	}


}