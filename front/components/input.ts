import { iCloseSolid } from '../icon';
import { Icon } from '../icon/fc';
import { el, fn, text } from '../runtime/el';
import { FC } from '../runtime/type';
import './input.less';
export type Props = {
  value: string | number;
  onChange: (value: string) => void;
};
type Data = {};

export const Input: FC<Data, Props> = (data, props) => {

	function clear() {
		props.onChange('');	
	}

  return () => {
		const { value, onChange, ...resProps } = props;
    return [
      el('div', { class: 'closeInput' }, [
        el('input', {
          ...resProps,
          class: 'outlineInput',
          value,
          oninput: e => onChange(e.target.value)
        }),
        fn(Icon, { style: `opacity: ${value ? '1' : '0'}`, class: 'close', i: iCloseSolid, size: 18, onclick: clear })
      ])
    ];
  };
};
