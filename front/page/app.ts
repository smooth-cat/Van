
import { el, fn } from "../runtime/el";
import "./app.less";
import { SearchLayout } from "./search-layout";
import { FC } from "../runtime/type";
import { DetailWrapper } from "./detail-wrapper";
export const App: FC = (data, props) => {
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