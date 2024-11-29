import { callComponent, WithEvent } from '../runtime/call-component';
import { el, text } from '../runtime/el';
import { FC } from '../runtime/type';
import './message.less';
export type Props = {
	text: string;
} & WithEvent
type Data = {
	
}

const Info: FC<Data, Props> = (data, props) => {
	return () => {
		return [
			el('div', { class: `message info` }, [
				text(props.text)		
			])
		]
	}
}
export const info = (text: string, delay = 1000) => {
	const [destroy] = callComponent(Info, { text });
	setTimeout(() => {
		destroy();
	}, delay);
}