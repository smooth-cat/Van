import { el, IEl, text } from '../runtime/el';
import { FC } from '../runtime/type';
import './expand.less';
export type Props = {
	expand: boolean;
	els: IEl[];
	class: string;
	direction: 'col' | 'row'
}
type Data = {
	
}

export const Expand: FC<Data, Props> = (data, props) => {


	return () => {
		const { expand, els, direction='col' } = props;

		const expandName = `expanded-${direction}`;
		const contractedName = `contracted-${direction}`;

		return [
			el('div', { style: props.style || '', class: `expand-wrap ${props.class || ''} ${expand ? expandName : contractedName}` }, [
				el('div', { class: `expand-inner ${expand ? 'expanded' : ''}` }, els)
			])
		]
	}
}