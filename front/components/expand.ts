import { el, IEl, text } from '../runtime/el';
import { FC } from '../runtime/type';
import './expand.less';
export type Props = {
	expand: boolean;
	els: IEl[];
	class: string;
}
type Data = {
	
}

export const Expand: FC<Data, Props> = (data, props) => {


	return () => {
		const { expand, els } = props;

		return [
			el('div', { style: props.style || '', class: `expand-wrap ${props.class || ''} ${expand ? 'expanded' : ''}` }, [
				el('div', { class: `expand-inner ${expand ? 'expanded' : ''}` }, els)
			])
		]
	}
}