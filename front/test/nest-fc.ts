import { el, fn, text } from "../runtime/el";
import { FC } from "../runtime/type";

export const App: FC = (data) => {
	data.value = '你好';

	function onclick() {
		data.value = data.value + '1'
	}

	return () => {
		return [
			el('div', {
				onclick,
			}, [text(data.value)]),
			fn(child, { value: data.value })
		]
	}
}

const child: FC = (data, props) => {
	data.a  = 0;
	const onclick = () => {
		data.a++;
	}

	return () => {
		const { value } = props;

		return [
			el('div', {
				onclick,
			}, [text('加1')]),
			el('div', {}, [text(data.a)]),
			el('div', {}, [text(`父组件的数据：${value}`)])
		]
	}
}