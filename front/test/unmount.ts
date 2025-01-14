import { el, fn, text } from "../runtime/el";
import { onUnmount } from "../runtime/life-circle";
import { FC } from "../runtime/type";
import { mountTest } from "./diffObj";

export const App: FC = (data) => {
	data.value = '你好';
	data.show = true;

	function onclick() {
		data.value = data.value + '1'
	}

	function toggle(params) {
		data.show = !data.show
	}

	return () => {
		return [
			el('div', {
				onclick,
			}, [text(data.value)]),
			el('div', {
				onclick: toggle,
			}, [text('切换')]),
			fn(child, { value: data.value }),
			data.show  && fn(child, { value: data.value })
		]
	}
}

const child: FC = (data, props) => {
	data.a  = 0;
	const onclick = () => {
		data.a++;
	}

	onUnmount(() => {
		console.log('child 销毁');
	})

	return () => {
		const { value } = props;

		return [
			el('div', {
				onclick,
			}, [text('加1')]),
			el('div', {}, [text(data.a)]),
			el('div', {}, [text(`父组件的数据：${value}`)]),
			fn(gChild, {  })
		]
	}
}

const gChild: FC = (data) => {

	onUnmount(() => {
		console.log('gChild 销毁');
	})

	return () => {
		return [
			el('div', {  }, [
				text('gChild')
			])
		]
	}
}
mountTest();
