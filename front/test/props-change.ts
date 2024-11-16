import { ref } from "@vue/reactivity";
import { el, fn, text } from "../runtime/el";
import { onPropsChanged } from "../runtime/life-circle";

export function App(data) {
	data.value = ''

	const innerInput = (v) => {
		data.value = v
	}

	return () => {
		return [
			text('父亲12'),
			el('input', { value: data.value, oninput: (e) => innerInput(e.target.value) }),
			fn(Child, { value: data.value, innerInput })
		]
	}
}

export const Child = (data, props) => {
	data.value = '';
	onPropsChanged((changed) => {
		if(changed.value != null) {
			setTimeout(() => {
				data.value = `异步数据：${changed.value}`;
			},1000)
		} 
	})

	return () => {
		return [el('div', {  }, [
			text(data.value)
		])]
	}
}