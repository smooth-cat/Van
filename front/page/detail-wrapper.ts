import { toRaw } from "@vue/reactivity";
import { FetchRefRes, MsgType, ReqType, TextEditorSelectionChangeKind } from "../../shared/var";
import { AsyncState, useAsync } from "../hook/use-async";
import { FC } from "../runtime/type";
import { Events, msg } from "../util/var";
import { Detail, Props } from "./detail";
import { el, fn } from "../runtime/el";
import { info } from "../components/message";

export type WrapperProps = {
	
}
type WrapperData = {
	refs: AsyncState<FetchRefRes>;
}


export const DetailWrapper: FC<WrapperData, Props> = (data, props) => {
	data.key = performance.now();

	const [run, reset] = useAsync('refs', async(pos, uri, name?: string) => {
		
		const res = await msg.request<FetchRefRes>(ReqType.Command, ['fetchReference', toRaw(pos), toRaw(uri)]);
		data.key = performance.now();
		console.log('收到引用详情',res);
		
		const { define, fileRefs } = res.data || {};

		if(define && !!fileRefs?.length) {
			return res.data;
		} else {

			info(name ? `未找到任何${name}相关的引用！` : '未找到任何引用！');
		}
	})

	Events.on('open-detail', run)

	msg.on(MsgType.CursorMove, ({ pos, uri, kind }) => {
		const isMouseClick = kind === TextEditorSelectionChangeKind.Mouse;

		if(isMouseClick) {
			run(pos, uri);
		}
	})


	return () => {
		const { value: {define,fileRefs } = {} } = data.refs;
		const showDetail = define && !!fileRefs?.length

		return [
			el('div', {  }, [
				showDetail && fn(Detail, { key: data.key,  fileRefs, define, close: reset })
			])
		]
	}
}
