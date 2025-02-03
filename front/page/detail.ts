import { Define, FileRef, MsgType, Reference, Uri } from '../../shared/var';
import { el, fn, text } from '../runtime/el';
import { FC } from '../runtime/type';
import './detail.less';
import { Icon } from '../icon/fc';
import { iCancel, iClose, iDbExp, iDecSquare, iHalfLock, iLock, iPlusSquare, iPrevious, iRubber, iTool, iUnLock } from '../icon';
import { DetailFile } from './detail-ref-file';
import { Events, LockType, msg } from '../util/var';
import { Tooltip } from '../components/tooltip';
import { AutoHeight } from 'scrollv';
import { onUnmount } from '../runtime/life-circle';
import { computed, watch } from '@vue/reactivity';
import { Input } from '../components/input';
import { Expand } from '../components/expand';
import { cNames } from '../runtime/util';
import { useVerify } from '../hook/use-verify';
import { glob } from '../../shared/utils';
import { minimatch, Minimatch } from 'minimatch';
import { useDebounceValue } from '../hook/use-debounce-value';

export type IActive = {
  uri?: Uri;
  reference?: Reference;
  index?: [number, number];
};

export type Props = {
  fileRefs: FileRef[];
  define: Define;
  active: IActive;
	lockType: LockType;
  close: () => void;
  updateLock: (v: LockType) => void;
};

export type Data = {
  pos: {
    start: number;
    end: number;
  };
  search: string;
	dSearch: string;
  expand: boolean;
	clearable: boolean;
	ignorePaths: Set<String>;
	ignoreRefKey: Set<String>;
};
export const Detail: FC<Data, Props> = (data, props) => {
  data.pos = {
    start: 0,
    end: 0
  };
  data.search = 'node_modules';
	useDebounceValue('search', 'dSearch', 300);
  data.expand = true;
	data.ignorePaths = new Set();
	data.ignoreRefKey = new Set();

  const expandFolder = () => {
    props.fileRefs.forEach(([uri]) => (uri.expand = true));
  };
  const closeFolder = () => {
    props.fileRefs.forEach(([uri]) => (uri.expand = false));
  };

  let ins: AutoHeight;
  const handleScroller = (dom: AutoHeight) => {
    ins = dom;
    if (props.active.index != null) {
      const [index, itemCount] = props.active.index;
      // ins.scrollv('toItem', {
      // 	index,
      // 	dt: itemCount * /* item */28.5 - 10
      // } as any)
    }
  };

  const handle = watch(
    () => props.active.index,
    () => {
      if (ins) {
        handleScroller(ins);
      }
    }
  );

  const onSlice = e => {
    data.pos = {
      start: e.detail.start,
      end: e.detail.end
    };
  };

  function onChange(v: string) {
    data.search = v;
  }

  function toggleTools() {
    data.expand = !data.expand;
  }
  function toggleEnableClear() {
    data.clearable = !data.clearable;
  }

  const [verify, update] = useVerify('lockType', props.updateLock);

	function onKeyDown(e) {
		leaveClearableMode(e);
		if(e.key === 'F12') {
			toggleLock();
		}
	}

	function leaveClearableMode(e) {
		if (e.keyCode === 27) { 
			data.clearable = false;
		}
	}

	function toggleLock() {
		let { lockType, updateLock } = props;
		if(lockType === LockType.Lock) return updateLock(LockType.UnLock);
		updateLock(LockType.Lock);
	}

	function cancelClear() {
		data.ignorePaths.clear();
		data.ignoreRefKey.clear();
	}

	const dispose1 = msg.on(MsgType.LockModeChange, toggleLock);

	const ignoreReg = computed(() => {
		let input = data.dSearch.trim();
		const lastChar = input.at(-1);
		const endWithSlash = lastChar === '\\' || lastChar === '/';
		if(lastChar != null) {
			input += (endWithSlash ? '**' : '/**');
		}
		return new Minimatch(input, { partial: true, dot: true })
	});

	const filteredRefs = computed(() => props.fileRefs.filter(it => {
		const matchGlob = ignoreReg.value.match(it[0].relativePath);
		const matchIgnorePaths = data.ignorePaths.has(it[0].relativePath);
		return !matchGlob && !matchIgnorePaths;
	}));

	window.addEventListener('keyup', onKeyDown)
	

  onUnmount(() => {
    ins?.destroy();
    handle.stop();
		window.removeEventListener('keyup', onKeyDown);
		dispose1();
  });

  return () => {
    const { fileRefs, define, close } = props;

    const fileName = define.uri.relativePath.split('/').pop() || '';

    const showDefine = false;

    return [
      el('div', { class: 'detail' }, [
        el('div', { class: 'title-zone' }, [
          el('div', { class: 'title' }, [
            fn(Tooltip, {
              els: [fn(Icon, { i: iPrevious, size: 18, onclick: close })],
              tip: '退后',
              type: 'bottom',
              class: 'previous'
            }),
            el('div', { class: cNames('tools', { expanded: data.expand }) }, [
              fn(Tooltip, {
                els: [fn(Icon, { i: iTool, size: 18, onclick: toggleTools })],
                tip: data.expand ? '收起工具栏' : '展开工具栏',
                type: 'bottom',
                class: 'tool-icon'
              }),
              fn(Expand, {
                class: 'expand-tools',
                expand: data.expand,
                direction: 'row',
                els: [
                  fn(Tooltip, {
                    els: [
                      fn(Icon, {
                        i: iUnLock,
                        class: cNames({ active: verify(LockType.UnLock) }),
                        size: 15,
                        onclick: () => update(LockType.UnLock)
                      })
                    ],
                    tip: '无锁模式(F12)',
                    type: 'bottom',
										class: 'iUnlock',
                  }),
                  fn(Tooltip, {
                    els: [
                      fn(Icon, {
                        i: iHalfLock,
                        class: cNames({ active: verify(LockType.HalfLock) }),
                        size: 18,
                        onclick: () => update(LockType.HalfLock)
                      })
                    ],
                    tip: '半锁模式(F12)',
                    type: 'bottom'
                  }),
                  fn(Tooltip, {
                    els: [
                      fn(Icon, {
                        i: iLock,
                        class: cNames({ active: verify(LockType.Lock) }),
                        size: 18,
                        onclick: () => update(LockType.Lock)
                      })
                    ],
                    tip: '锁模式(F12)',
                    type: 'bottom'
                  }),
                  fn(Tooltip, {
                    els: [
                      fn(Icon, {
                        i: iRubber,
                        size: 19,
												class: cNames({ active: data.clearable }),
												onclick: toggleEnableClear,
                      })
                    ],
                    tip: data.clearable ? '排除工具(Esc)' : '排除工具',
                    type: 'bottom',
										class: 'clearable-btn'
                  }),
									(data.ignorePaths.size > 0 || data.ignoreRefKey.size > 0) && fn(Tooltip, {
                    els: [
                      fn(Icon, {
                        i: iCancel,
                        class: 'active',
                        size: 14,
                        onclick: cancelClear,
                      })
                    ],
                    tip: '恢复删除项',
                    type: 'bottom',
										class: 'cancel-btn'
                  }),
									fn(Tooltip, {
                    els: [el('div', { class: 'plus-icon', onclick: expandFolder })],
                    tip: '全部展开',
                    type: 'bottom'
                  }),
                  fn(Tooltip, {
                    els: [el('div', { class: 'dec-icon', onclick: closeFolder })],
                    tip: '全部折叠',
                    type: 'bottom'
                  }),
                ]
              })
            ]),
            el('div', { title: '关闭', class: 'title-name' }, [text(define.name)])
          ]),
          fn(Input, { value: data.search, onChange, placeholder: '输入要忽略文件，glob 语法' })
        ]),
        showDefine &&
          el('div', { class: 'define' }, [
            el('div', { class: 'define-title' }, [text('定义'), el('span', {}, [text(' definition')])]),
            el('div', { class: 'file-title' }, [
              el('div', { class: 'file-name' }, [text(fileName)]),
              el('div', { class: 'file-path ellipsis', title: define.uri.relativePath }, [
                text(define.uri.relativePath)
              ])
            ]),
            el('div', { class: 'ref-item fade-ellipsis', title: define.declaration }, [
              text(define.prefix),
              el('span', { class: 'ref-name' }, [text(define.name)]),
              text(define.suffix)
            ])
          ]),
        el('div', { class: cNames('refs', { clearable: data.clearable }) }, [
          el(
            'scroll-v',
            {
              ref: handleScroller,
              onslice: onSlice,
              total: filteredRefs.value.length,
              itemHeight: 300,
              pad: 300,
              rate: 1,
              passive: true,
              class: 'reference-container hide-scrollbar'
            },
            filteredRefs.value
              .slice(data.pos.start, data.pos.end)
              .map(([uri, refs]) => fn(DetailFile, { clearable: data.clearable, ignorePaths: data.ignorePaths, ignoreRefKey: data.ignoreRefKey , key: uri.path, uri, refs }))
          )
        ])
      ])
    ];
  };
};
