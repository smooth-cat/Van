import { callComponent, WithEvent } from '../runtime/call-component';
import { el, text } from '../runtime/el';
import { FC } from '../runtime/type';
import './toast.less';
export type Props = {
	text: string;
	level: string;
} & WithEvent
type Data = {
	
}

const Info: FC<Data, Props> = (data, props) => {
	return () => {
		return [
			el('div', { class: `message ${props.level}` }, [
				text(props.text)		
			])
		]
	}
}

function createToast(level: string) {
	return  (text: string, delay = 1500) => {
		const [destroy] = callComponent(Info, { text, level });
		setTimeout(() => {
			destroy();
		}, delay);
	}
}

export const info = createToast('info');
export const warn = createToast('warn');
export const error = createToast('error');