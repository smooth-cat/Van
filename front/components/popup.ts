import { BaseEvent } from '../../shared/message/event';
import { useRef } from '../runtime/build-in-hook';
import { callComponent, WithEvent } from '../runtime/call-component';
import { el, IEl, text } from '../runtime/el';
import { FC } from '../runtime/type';
import './popup.less';

export type RendererProps = {
	event: BaseEvent, destroy: () => void
}
export type Props = WithEvent & {
	renderer: (rendererProps: RendererProps) => IEl[],
	type?: 'top'|'top-left'|'top-right'|'bottom'|'bottom-left'|'bottom-right'| 'left'|'left-top'|'left-bottom'|'right'|'right-top'|'right-bottom',
	offset?: {x?: number, y?: number},
	target?: HTMLElement,
}
type Data = {
	
}

function numberWithSign(value: number) {
  return value >= 0 ? ` + ${value}px` : ` - ${value}px`; // 正数加+，负数保留-
}

export const Modal: FC<Data, Props> = (data, props) => {

	const { target, event:e, destroy, offset={} } = props;
	const {x=0,y=0} = offset;
	const offX = numberWithSign(x);
	const offY = numberWithSign(y);
	const { top, left, right, bottom, width, height } = target.getBoundingClientRect();
	const [d, ref] = useRef();

	console.log({ offX,
offY });
	e.on('mouseleave', onMouseLeave);

	function onMouseLeave(event: MouseEvent) {
		const mouseOverDom = document.elementFromPoint(event.clientX, event.clientY);
		const leaveTarget = event.target;
		// 触发离开是获取到的 dom 和 监听的是同一个，说明确实离开了
		const isLeave = mouseOverDom === leaveTarget;
		if(isLeave) {
			return destroy();
		}

		if((target?.contains(mouseOverDom))  || d()?.contains(mouseOverDom)) return;
		destroy();
	}

	return () => {
    const { renderer, type = 'top-left', class: className = '' } = props;

    const space = '2px';

    const inTopOrBottom = type.match(/(top|bottom)/);
    const obj = { transform: '' } as any;
    if (inTopOrBottom) {
      const [y, x] = type.split('-');

      if (!x) {
        obj.left = `${left + width / 2}px`;
        obj.transform = `translateX(-50%)`;
      } else if (x === 'left') {
        obj.left = `${left}px`;
      } else {
        obj.left = `${right}px`;
        obj.transform = `translateX(-100%)`;
      }

      if (y === 'top') {
        obj.top = `${top}px`;
        obj.transform += ` translateY(-100%)`;
        obj['padding-bottom'] = space;
      } else {
        obj.top = `${bottom}px`;
        obj['padding-top'] = space;
      }
    } 
		else {
			const [x, y] = type.split('-');

      if (!y) {
        obj.top = `${top + height / 2}px`;
        obj.transform = `translateY(-50%)`;
      } else if (y === 'top') {
        obj.top = `${top}px`;
      } else {
        obj.top = `${bottom}px`;
        obj.transform = `translateY(-100%)`;
      }

      if (x === 'left') {
        obj.left = `${left}px`;
        obj.transform += ` translateX(-100%)`;
        obj['padding-right'] = space;
      } else {
        obj.left = `${right}px`;
        obj['padding-left'] = space;
      }
		}

		let hasX = false;
		let hasY = false;
		(obj.transform as string).replace(/translate(X|Y)\(([^\)]+)\)/g, (match, d, val) => {
			console.log({d,val});
			let off;
			if(d === 'X') {
				hasX = true;
				off = offX;
			} else {
				hasY = true;
				off = offY;
			}
			return `translate${d}(calc(${val}${off}))`;
		});

		if(!hasX) {
			obj.transform += ` translateX(${x}px)`;
		}
		if(!hasY) {
			obj.transform += ` translateY(${y}px)`;
		}

		obj.transform = obj.transform.trim();

    let style = '';
    for (const key in obj) {
      const value = obj[key];
      const str = `${key}:${value};`;
      style += str;
    }

    return [
      el('div', { ref, class: `${className} popup-wrapper`, style, onmouseleave: onMouseLeave }, [
        el('div', { class: 'popup-content' }, renderer({ event: e, destroy }))
      ])
    ];
  };
}

export const usePopup = (props: Props) => {
	let e;
	let handlers;
	function onmouseenter(event) {
		if(e) return;
		handlers = callComponent(Modal, {...props, target: event.target });
		e = handlers[1];
		e.on('will-destroy', () => e = undefined);
	}
	function onmouseleave(event) {
		e?.emit('mouseleave', event);
	}

	function getHandlers() {
		return handlers;
	}

	return [{ onmouseenter, onmouseleave }, getHandlers] as const;
}


export type IPopupProps = Props & {
	el: IEl;
}

export const Popup: FC<Data, IPopupProps> = (data, props) => {
  const [events] = usePopup(props);

  return () => {
    const { el } = props;

    const { onmouseenter, onmouseleave } = el.props;

    const MouseEnter = e => {
      events.onmouseenter(e);
      onmouseenter?.(e);
    };
    const MouseLeave = e => {
      events.onmouseleave(e);
      onmouseleave?.(e);
    };

    el.props.onmouseenter = MouseEnter;
    el.props.onmouseleave = MouseLeave;

    return [el];
  };
};