import { computed } from '@vue/reactivity';
import { AllSymbolKinds, SymbolKind, SymbolMap } from '../../shared/var';
import { el, fn, IEl, text } from '../runtime/el';
import { FC } from '../runtime/type';
import { Icon } from '../icon/fc';
import { iTick } from '../icon';
import { cNames } from '../runtime/util';
export type LabelItem = {
  kind: SymbolKind;
  label: string;
};

export type Props = {
  labels: Set<SymbolKind>;
};
type Data = {
  fixType: string;
  fixedPos: {
    top: string;
    left: string;
  };
	visible: boolean;
};

export const LabelFilter: FC<Data, Props> = (data, props) => {
  const { labels } = props;
	const defaultLabels = Array.from(labels);
	data.visible = false;
  data.fixType = '';
  data.fixedPos = {
    top: '-999px',
    left: '-999px'
  };

  const changeSelect = (kind: SymbolKind) => {
    if (labels.has(kind)) {
      labels.delete(kind);
    } else {
      labels.add(kind);
    }
  };

  const renderSelected = () => {
    const selected: IEl[] = [];
    labels.forEach(kind => {
      selected.push(el('div', { class: 'label', style: `${SymbolMap[kind]['addition']['labelStyle']}` }, [text(SymbolMap[kind][0])]));
    });
    return selected;
  };

  const resizeObs = new ResizeObserver(([entry]) => {
    const height = entry.borderBoxSize[0].blockSize;
    // 不得高于2行，实际高度 42

    const needFixedHeight = height > 21;
    if (needFixedHeight && data.fixType) {
      return;
    }
    if (!needFixedHeight && !data.fixType) {
      return;
    }

    data.fixType = needFixedHeight ? 'absolute' : '';
  });

  const labelZoneRef = (dom: HTMLElement) => {
    resizeObs.observe(dom);
  };

  const isAllSelected = () => labels.size === AllSymbolKinds.length;

  const selectAll = () => {
    const allSelected = isAllSelected();
    if (allSelected) {
      labels.clear();
    } else {
      AllSymbolKinds.forEach(v => {
        labels.add(v);
      });
    }
  };

	const setToDefault = () => {
		labels.clear();
		defaultLabels.forEach(it => labels.add(it));
	}

	const toggle = () => {
		data.visible = !data.visible;
	}

	const leave = () => {
		data.visible = false;
	}


  return () => {
    return [
      el('div', {  class: cNames('labelFilter', { 'visible': data.visible }), onmouseleave:leave }, [
        el('div', { class: 'labelZoneWrapper', onclick: toggle }, [
          el(
            'div',
            {
              ellipsisText: `...共${labels.size}项`,
              style: `--ellipsis-left: ${data.fixedPos.left};--ellipsis-top: ${data.fixedPos.top};`,
              class: `fixed-height-layer ${data.fixType}`
            },
            [
              el(
                'div',
                { ref: labelZoneRef, class: `labelZone ${labels.size === 0 ? 'placeholder' : ''}` },
                renderSelected()
              )
            ]
          )
        ]),
        el('div', { class: 'labelDropdown' }, [
          el('div', { class: 'titleSelectAll' }, [
            el('div', { class: 'title' }, [text('可见类型')]),
            el('div', { class: 'labelItem selectAll', onclick: selectAll }, [
              el('div', { class: 'selected', style: `opacity: ${isAllSelected() ? '1' : '0'}` }, [
                fn(Icon, { i: iTick, size: 12 })
              ]),
              el('div', { class: 'label' }, [text('全选')])
            ]),
						el('div', { class: 'label default', onclick: setToDefault }, [text('默认')])
          ]),
          el(
            'div',
            { class: 'labelDropdownList' },
            AllSymbolKinds.map(kind => {
              const selected = labels.has(kind);
              return el('div', { key: kind, class: 'labelItem', onclick: () => changeSelect(kind) }, [
                el('div', { class: 'selected', style: `opacity: ${selected ? '1' : '0'}` }, [
                  fn(Icon, { i: iTick, size: 12 })
                ]),
                el('div', { class: `label`, style: `${SymbolMap[kind]['addition']['labelStyle']}` }, [text(SymbolMap[kind][0])])
              ]);
            })
          )
        ])
      ])
    ];
  };
};
