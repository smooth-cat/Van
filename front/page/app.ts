
import { el, fn } from "../runtime/el";
import "./app.less";
import { FC } from "../runtime/type";
import { DetailWrapper } from "./detail-wrapper";
import { Outline } from "./outline";
import { msg } from "../util/var";
import { MsgType } from "../../shared/var";
import { onUnmount } from "../runtime/life-circle";

export const App: FC = (data, props) => {
	// 保证组件重新加载时拿到的 conf 是对的
	const dispose = msg.on(MsgType.ConfigChange, (changed) => {
		console.log('收到config-change');
		
		for (const key in changed) {
			window['conf'][key] = changed[key];	
		}
	});

	onUnmount(() => {
		dispose()
	})

	return () => {
		return [
			fn(Outline, {  }),
			fn(DetailWrapper, {  }),
		]
	}
}