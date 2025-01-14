import { toRaw, toReactive } from "@vue/reactivity";
import { FetchRefRes, MsgType, ReqType, CursorMoveKind, Uri, Reference, FileRef } from "../../shared/var";
import { AsyncState, useAsync } from "../hook/use-async";
import { FC } from "../runtime/type";
import { Events, msg } from "../util/var";
import { Detail, IActive, Props } from "./detail";
import { el, fn } from "../runtime/el";
import { info } from "../components/toast";
import { useEvent } from "../hook/useEvent";
import { inject } from "../runtime/context";
import { Position } from "vscode";
import { equalPos, isFormer, posInReference } from "../../shared/utils";

export type WrapperProps = {
	
}
type WrapperData = {
	refs: AsyncState<FetchRefRes>;
	detailStack: any[];
	active: IActive
}


export const DetailWrapper: FC<WrapperData, Props> = (data, props) => {
	data.active = {
		uri: undefined,
		reference: undefined,
		index: undefined,
	}

	function findActiveByProp(fileRefs: FileRef[]) {
		for (let i = 0; i < fileRefs.length; i++) {
			const [uri, refs] = fileRefs[i];
			if(uri.active) {
				for (let j = 0; j < refs.length; j++) {
					const { active } = refs[j];
					if(active) {
						return [i,j] as const;
					}
				}
			}
		}
		
	}
	function findActiveByPos(uri1, pos, rData: WrapperData) {
		const fileRefs = rData.refs.value.fileRefs;
			for (let i = 0; i < fileRefs.length; i++) {
				const [uri2, refs] = fileRefs[i];
				const uriEq = uri1.path === uri2.path;
				if(!uriEq) continue;
				for (let j = 0; j < refs.length; j++) {
					const { range: [start, end] } = refs[j];
					if(isFormer(start, pos, true) && isFormer(pos, end)) {
						return [i,j] as const;
					}
				}				
			}
	}

	const [run, reset] = useAsync('refs', async function(uri, pos, kind: CursorMoveKind) {
		const rData = toRaw(data);
		// 有详情时，移动位置在包含在详情内则不需重新加载，只改变 激活位置即可
		if(hasRefs()) {
			// 与激活位置相同则说明不需要更新
			if(posInReference(uri, pos, rData.active.uri, rData.active.reference?.range)) {
				return this.value;
			}

			// 在当前引用内，只需更新激活位置，不需要重新获取
			this.found = findActiveByPos(uri, pos, rData);
			if(this.found) {
				return this.value;
			}
		}

		const res = await msg.request<FetchRefRes>(ReqType.Command, ['fetchReference', toRaw(pos), toRaw(uri)]);
		console.log('收到引用详情',res);
		
		const { define, fileRefs } = res.data || {};

		if(define && !!fileRefs?.length) {
			this.found = findActiveByProp(fileRefs);
			return { ...res.data, key: performance.now() };
		} else {
			info('未找到任何引用!');
			return this.value;
		}
	}, function() {
		if(!this.found) {
			// 无found 说明 激活位置已存在，若激活位置已不在视口内依然需要滚动到该位置
			if(data.active.uri) {
				const id = data.active.index![1];
				data.active.uri.expand = true;
				data.active.uri.scroll = { id };
			}
			return;
		}
		if(data.active.uri && data.active.reference) {
			// 把原来的激活取消
			data.active.uri.active = false;
			data.active.reference.active = false;
		}
		
		const [i,j] = this.found;
		const value: FetchRefRes = this.value;
		const newUri = value.fileRefs[i][0];
		const newReference = value.fileRefs[i][1][j];
		newUri.active = true;
		newUri.expand = true;
		newUri.scroll = { id: j };
		newReference.active = true;
		data.active.uri = newUri;
		data.active.reference = newReference;
		data.active.index = this.found;
	})

	msg.on(MsgType.CursorMove, ({ uri, pos,  kind }) => handleMoveOrSelect(uri, pos, kind))
	msg.on(MsgType.SelectionChange, ({ uri, former,  kind }) => handleMoveOrSelect(uri, former, kind));


	function handleMoveOrSelect(uri, pos , kind) {
		// 如果移动到引用列表的任意位置则继续
		const shouldRefresh = [CursorMoveKind.Mouse, CursorMoveKind.BackOrForward, CursorMoveKind.GotoLocation].includes(
      kind
    );
		if(shouldRefresh) {
			run(uri, pos, kind);
		}
	}


	function hasRefs() {
		const { value: {define,fileRefs } = {} } = data.refs;
		const has = define && !!fileRefs?.length
		return has;
	}

	return () => {
		const { value: {define,fileRefs, key } = {} } = data.refs;
		const showDetail = hasRefs();

		return [
			el('div', {  }, [
				showDetail && fn(Detail, { active: data.active, key, fileRefs, define, close: reset })
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