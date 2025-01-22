import { el, fn, text } from "../runtime/el";
import { onUnmount } from "../runtime/life-circle";
import { FC } from "../runtime/type";
import { mountTest } from "./diffObj";

export const App: FC = (data) => {
	data.show = true;

	function onclick() {
		data.show = !data.show;
		setTimeout(() => {
			const hei = document.getElementById('hei');
			console.log('更新后是否相同', hei === dom, {hei, dom});
		});
	}

	let dom: HTMLElement;
	const ref = (d) => {
		dom = d;
		console.log({dom});
	}

	return () => {
		return [
			el('div', { onclick }, [
				data.show && el('div', { hide: 'true', title: '123' }, [
					text('1')
				]),
				el('div', { id: 'hei', ref, title: '234' }, [
					text('2')
				]),
			])
		]
	}
}
