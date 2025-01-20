
import { el, fn } from "../runtime/el";
import "./app.less";
import { FC } from "../runtime/type";
import { DetailWrapper } from "./detail-wrapper";
import { Outline } from "./outline";
export const App: FC = (data, props) => {
	data.msg = ''

	return () => {
		return [
			fn(Outline, {  }),
			fn(DetailWrapper, {  }),
		]
	}
}