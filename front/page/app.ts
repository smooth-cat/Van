import { Message } from "../../shared/message";
import { MsgType, ReqType } from "../../shared/var";
import { useAsync } from "../hook/use-async"
import { el, fn, text } from "../runtime/el";
import { vscode } from "../util/var";
import { Detail, DetailWrapper } from "./detail";
import { Outline } from "./outline";
import { SearchList } from "./search-list";
import "./app.less";
import { SearchLayout } from "./search-layout";
export const App = (data, props) => {
	data.msg = ''

	return () => {
		return [
			el('div', {  }, [
				fn(SearchLayout, {  }),
				fn(DetailWrapper, {  }),
			])
		]
	}
}