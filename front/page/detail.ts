import { el, text } from '../runtime/el';
import { FC } from '../runtime/type';
export type Props = {
	
}
type Data = {
	
}

export const Detail: FC<Data, Props> = (data, props) => {
	data.value = 10;


	return () => {
		return [
			el('div', {  }, [
				text('detail')
			])
		]
	}
}