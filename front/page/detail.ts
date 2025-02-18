import { Define, FileRef, LockType, MsgType, Reference, ReqType, Uri } from '../../shared/var';
import { el, fn, text } from '../runtime/el';
import { FC } from '../runtime/type';
import './detail.less';
import { Icon } from '../icon/fc';
import { iCancel, iClose, iDbExp, iDecSquare, iHalfLock, iLock, iPlusSquare, iPrevious, iRubber, iTool, iUnLock } from '../icon';
import { DetailFile } from './detail-ref-file';
import { msg } from '../util/var';
import { Tooltip } from '../components/tooltip';
import { AutoHeight } from 'scrollv';
import { onUnmount } from '../runtime/life-circle';
import { computed, watch } from '@vue/reactivity';
import { Input } from '../components/input';
import { Expand } from '../components/expand';
import { cNames } from '../runtime/util';
import { useVerify } from '../hook/use-verify';
import { Minimatch } from 'minimatch';
import { useDebounceValue } from '../hook/use-debounce-value';
import { getRelativePath } from '../../shared/utils';
import { useComputed } from '../runtime/build-in-hook';
import { bubbleEvent, BubbleLevel } from '../store/bubble-event';
import { conf, keyBind } from '../store/conf';

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
	search: string;
	searchDebounce: string;
	updateSearch: (v: string) => void;
};

export type Data = {
  pos: {
    start: number;
    end: number;
  };
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
    props.updateSearch(v);
  }

  function toggleTools() {
    data.expand = !data.expand;
  }
  function toggleEnableClear() {
    data.clearable = !data.clearable;
		if(data.clearable) {
			bubbleEvent.once('esc', leaveClearableMode);
		} else {
			bubbleEvent.off('esc', leaveClearableMode);
		}
  }

  const [verify, update] = useVerify('lockType', props.updateLock);

	function leaveClearableMode() {
		data.clearable = false;
	}
	leaveClearableMode['bubble'] = BubbleLevel.DetailCancelClear;

	function toggleLock() {
		let { lockType, updateLock } = props;
		if(lockType === LockType.Lock) return updateLock(LockType.UnLock);
		updateLock(LockType.Lock);
	}

	function cancelClear() {
		data.ignorePaths.clear();
		data.ignoreRefKey.clear();
	}

	function delRefFile({ uris }: { uris: Uri[] }) {
    const { fileRefs, active } = props;
		if(!active.index) return;
    let [activeI = -1] = active.index;
    let delCount = 0;
    const deletion = new Set(uris.map(u => u.path));
    for (let i = fileRefs.length - 1; i >= 0; i--) {
      const [uri] = fileRefs[i];
      if (!deletion.has(uri.path)) continue;
      fileRefs.splice(i, 1);
      if (i === activeI) {
        activeI = -1;
      }
      if (i < activeI) {
        delCount++;
      }
    }
    if (activeI !== -1) {
      activeI -= delCount;
    }
		active.index = [activeI, active.index[1]];
  }

	async function renameRefFile({
    uris
  }: {
    uris: {
      oldUri: Uri;
      newUri: Uri;
    }[];
  }) {
		// 为了能够计算出 relativePath
		// TODO: symbolKey 问题
		const result = await msg.request<string>(ReqType.Command, ['fetchWorkspacePath']);
		if(result.error) return;
		const spacePath = result.data;
		const { fileRefs, define } = props;
		const changeMap = new Map(uris.map(it => [it.oldUri.path, it.newUri.path]));
		fileRefs.forEach(([uri]) => {
			if(!changeMap.has(uri.path)) return;
			const fullPath = changeMap.get(uri.path);
			const relativePath = getRelativePath(fullPath, spacePath);
			// @ts-ignore
			uri.path = fullPath;
			uri.relativePath = relativePath;
		});

		// TODO:要修正 define.SymbolKey
		if(!changeMap.has(define.uri.path)) return;
		const fullPath = changeMap.get(define.uri.path);
		const relativePath = getRelativePath(fullPath, spacePath);
		const lastKey = define.symbolKey.slice(define.uri.path.length);
		define.symbolKey = fullPath + lastKey;
		// @ts-ignore
		define.uri.path = fullPath;
		define.uri.relativePath = relativePath;
	}

	
	const dispose2 = msg.on(MsgType.DeleteFile, delRefFile);
	const dispose3 = msg.on(MsgType.RenameFile, renameRefFile);

	const ignoreReg = computed(() => {
		let input = props.debounceSearch.trim();
		const lastChar = input.at(-1);
		const endWithSlash = lastChar === '\\' || lastChar === '/';
		if(lastChar != null) {
			input += (endWithSlash ? '**' : '/**');
		}
		return new Minimatch(input, { partial: true, dot: true })
	});

	const filteredRefs = useComputed(() => props.fileRefs.filter(it => {
		const matchGlob = ignoreReg.value.match(it[0].relativePath);
		const matchIgnorePaths = data.ignorePaths.has(it[0].relativePath);
		return !matchGlob && !matchIgnorePaths;
	}), ['fileRefs']);
	bubbleEvent.on('f12', toggleLock);

  onUnmount(() => {
    ins?.destroy();
    handle.stop();
		bubbleEvent.off('f12', toggleLock);
		bubbleEvent.off('esc', leaveClearableMode);
		dispose2();
		dispose3();
  });

  return () => {
    const { define, close } = props;

    const fileName = define.uri.relativePath.split('/').pop() || '';

    const showDefine = false;

    return [
      el('div', { class: 'detail' }, [
        el('div', { class: 'title-zone' }, [
          el('div', { class: 'title' }, [
            fn(Tooltip, {
              els: [fn(Icon, { i: iPrevious, size: 18, onclick: close })],
              tip: t('close{0}', `(${keyBind['Van.exit_current']})`),
              type: 'bottom-left',
              class: 'previous'
            }),
            el('div', { class: cNames('tools', { expanded: data.expand }) }, [
              fn(Tooltip, {
                els: [fn(Icon, { i: iTool, size: 18, onclick: toggleTools })],
                tip: t(data.expand ? 'collapse tools' : 'expand tools'),
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
                        size: 15,
                        onclick: () => update(LockType.UnLock)
                      })
                    ],
                    tip: `${t('unlock mode')}(${keyBind['Van.toggle_lock_mode']})`,
                    type: 'bottom',
                    class: cNames('iUnlock', { active: verify(LockType.UnLock) })
                  }),
                  fn(Tooltip, {
                    els: [
                      fn(Icon, {
                        i: iHalfLock,
                        size: 18,
                        onclick: () => update(LockType.HalfLock)
                      })
                    ],
                    tip: `${t('half_lock mode')}(${keyBind['Van.toggle_lock_mode']})`,
                    type: 'bottom',
                    class: cNames({ active: verify(LockType.HalfLock) })
                  }),
                  fn(Tooltip, {
                    els: [
                      fn(Icon, {
                        i: iLock,
                        size: 18,
                        onclick: () => update(LockType.Lock)
                      })
                    ],
                    tip: `${t('lock mode')}(${keyBind['Van.toggle_lock_mode']})`,
                    type: 'bottom',
                    class: cNames({ active: verify(LockType.Lock) })
                  }),
                  fn(Tooltip, {
                    els: [
                      fn(Icon, {
                        i: iRubber,
                        size: 19,
                        onclick: toggleEnableClear
                      })
                    ],
                    tip: data.clearable ? `${t('exclude tool')}(${keyBind['Van.exit_current']})` : t('exclude tool'),
                    type: 'bottom',
                    class: cNames('clearable-btn', { active: data.clearable })
                  }),
                  (data.ignorePaths.size > 0 || data.ignoreRefKey.size > 0) &&
                    fn(Tooltip, {
                      els: [
                        fn(Icon, {
                          i: iCancel,
                          size: 14,
                          onclick: cancelClear
                        })
                      ],
                      tip: t('recover excluded'),
                      type: 'bottom',
                      class: 'active cancel-btn'
                    }),
                  fn(Tooltip, {
                    els: [el('div', { class: 'plus-icon', onclick: expandFolder })],
                    tip: t('expand all'),
                    type: 'bottom'
                  }),
                  fn(Tooltip, {
                    els: [el('div', { class: 'dec-icon', onclick: closeFolder })],
                    tip: t('collapse all'),
                    type: 'bottom'
                  })
                ]
              })
            ]),
            el('div', { title: define.name, class: 'title-name' }, [text(define.name)])
          ]),
          fn(Input, { value: props.search, onChange, placeholder: t('input ignore files(glob)') })
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
              .map(([uri, refs], i) =>
                fn(DetailFile, {
                  index: i,
                  define,
                  clearable: data.clearable,
                  ignorePaths: data.ignorePaths,
                  ignoreRefKey: data.ignoreRefKey,
                  key: uri.path,
                  uri,
                  refs
                })
              )
          )
        ])
      ])
    ];
  };
};
