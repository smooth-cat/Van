
import { el, fn } from "../runtime/el";
import "./app.less";
import { FC } from "../runtime/type";
import { DetailWrapper } from "./detail-wrapper";
import { Outline } from "./outline";
import { msg } from "../util/var";
import { MsgType } from "../../shared/var";
import { onUnmount } from "../runtime/life-circle";
import { useHistoryStore } from "../store/history-store";
import { HistoryWrapper } from "./history";
import { bubbleEvent } from "../store/bubble-event";

export const App: FC = (data, props) => {

	msg.on(MsgType.KeyPress, (key: string) => {
		bubbleEvent.emit(key);
	})

	useHistoryStore();

	return () => {
		return [
			fn(Outline, {  }),
			fn(DetailWrapper, {  }),
			fn(HistoryWrapper, {  })
		]
	}
}