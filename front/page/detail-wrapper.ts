import { toRaw } from "@vue/reactivity";
import { FetchRefRes, ReqType } from "../../shared/var";
import { AsyncState, useAsync } from "../hook/use-async";
import { FC } from "../runtime/type";
import { Events, msg } from "../util/var";
import { Detail, Props } from "./detail";
import { el, fn } from "../runtime/el";

export type WrapperProps = {
	
}
type WrapperData = {
	refs: AsyncState<FetchRefRes>;
}


export const DetailWrapper: FC<WrapperData, Props> = (data, props) => {
	data.key = performance.now();

	const [run, reset] = useAsync('refs', async(pos, uri, cover = false) => {
		
		const res = await msg.request<FetchRefRes>(ReqType.Command, ['fetchReference', toRaw(pos), toRaw(uri)]);
		data.key = performance.now();
		console.log('收到引用详情',res);
		
		if(res.data){
			return res.data;
		} 
	})

	Events.on('open-detail', run)

	return () => {
		const showDetail = !!data.refs.value;
		const fileRefs = data.refs.value?.fileRefs;
		const define = data.refs.value?.define;

		return [
			el('div', {  }, [
				showDetail && fn(Detail, { key: data.key,  fileRefs, define, close: reset })
			])
		]
	}
}
