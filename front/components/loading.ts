import { el, text } from '../runtime/el';
import { FC } from '../runtime/type';
import './loading.less';
import LoadingImg from '../icon/nav-loading.png';
export type Props = {
	
}
type Data = {
	
}

export const Loading: FC<Data, Props> = (data, props) => {
	data.value = 10;


	return () => {
		return [
			el('div', { class: 'loading-fc loading-img' }, [		
				el('img', { class: 'loading-background', src: LoadingImg }),
				el('div', { class: 'circle-group-wrapper' }, [
					el('div', { class: 'circle-group' }, [					
						el('div', { class: 'circle' }),
						el('div', { class: 'circle' }),
						el('div', { class: 'circle' })
					])		
				]),
			])
		]
	}
}