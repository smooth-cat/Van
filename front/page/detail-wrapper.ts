import { toRaw, watch } from '@vue/reactivity';
import { FetchRefRes, MsgType, ReqType, RefreshKind, Uri, Reference, FileRef, LockType, Define, ChangedArea } from '../../shared/var';
import { AsyncState, useAsync } from '../hook/use-async';
import { FC } from '../runtime/type';
import { msg } from '../util/var';
import { Detail, IActive, Props } from './detail';
import { el, fn } from '../runtime/el';
import { info } from '../components/toast';
import { Position } from 'vscode';
import { debounce, eqPos, fixDefineRange, isFormer, posInRange } from '../../shared/utils';
import { onUnmount } from '../runtime/life-circle';
import { use } from '../runtime/context';
import { HistoryStore, unshiftHistory } from '../store/history-store';
import { bubbleEvent, BubbleLevel } from '../store/bubble-event';
import { conf } from '../store/conf';
import { useDebounceValue } from '../hook/use-debounce-value';

export type WrapperProps = {};
type WrapperData = {
  refs: AsyncState<FetchRefRes>;
  detailStack: any[];
  active: IActive;
	lockType: LockType;
};

export const DetailWrapper: FC<WrapperData, Props> = (data, props) => {
	const rData = toRaw(data);
  data.active = {
    uri: undefined,
    reference: undefined,
    index: undefined
  };
	const history = use<HistoryStore>('historyStore');
	data.lockType = conf.LockMode;
	// 为用户在修改默认值后能即时看到效果
	const wHandle = watch(() => conf.LockMode, (v) => {
		data.lockType = v;
	})

  function findActiveByProp(fileRefs: FileRef[]) {
    for (let i = 0; i < fileRefs.length; i++) {
      const [uri, refs] = fileRefs[i];
      if (uri.active) {
        for (let j = 0; j < refs.length; j++) {
          const { active } = refs[j];
          if (active) {
            return [i, j] as const;
          }
        }
      }
    }
  }
  function findActiveByPos(uri1, pos, rData: WrapperData) {
    const fileRefs = rData.refs.value.fileRefs;
    for (let i = 0; i < fileRefs.length; i++) {
      const [uri2, refs] = fileRefs[i];
      const uriEq = uri1.path === uri2.path;
      if (!uriEq) continue;
      for (let j = 0; j < refs.length; j++) {
        const {
          range: [start, end]
        } = refs[j];
        if (isFormer(start, pos, true) && isFormer(pos, end)) {
          return [i, j] as const;
        }
      }
    }
  }

	const modeHandler = {
		[LockType.UnLock]: function(uri, pos) {
			// 没有引用部分需要更新
			if(!hasRefs()) {
				return true;
			};
			
			// 与激活位置相同则说明不需要更新
			if (posInRange(uri, pos, rData.active.uri, rData.active.reference?.range)) {
				return;
			}

			// 在当前引用内，只需更新激活位置，不需要重新获取
			this.found = findActiveByPos(uri, pos, rData);

			// 没在当前引用中找到则需要更新
			return !this.found;
		},
		[LockType.HalfLock]: function(uri, pos, kind, isSelect) {
			// 没有引用部分需要更新
			if(!hasRefs()) {
				return true;
			};
			
			// 位置是当前引用不更新
			if (posInRange(uri, pos, rData.active.uri, rData.active.reference?.range)) {
				return;
			}
			// 在当前引用内，只需更新激活位置，不需要重新获取
			this.found = findActiveByPos(uri, pos, rData);
			if(this.found) {
				return;
			}

			// 不在当前引用内，必须是 mouse select 才更新
			return isSelect;
		},
		[LockType.Lock]: function(uri, pos) {
			// 没有引用部分需要更新
			if(!hasRefs()) {
				return true;
			};
			
			// 位置是当前引用不更新
			if (posInRange(uri, pos, rData.active.uri, rData.active.reference?.range)) {
				return;
			}

			// 不论 pos 是否在当前引用都不予更新
			this.found = findActiveByPos(uri, pos, rData);
			return;
		},
	}

  /**
   * 更新 define 嵌套层级
   * 1. 初始化
   *
   * 更新 active 嵌套层级
   * 1. 初始化
   * 2. 激活点位移动
   */
  const [run, reset] = useAsync(
    'refs',
    async function (uri, pos, kind: RefreshKind, isSelect = false) {
			this.kind = kind;
      if (
        kind === RefreshKind.DocEdit ||
        kind === RefreshKind.GotoLocationRefresh ||
        kind === RefreshKind.CreateFile ||
        kind === RefreshKind.GotoHistoryLocation
      ) {
      } else {
        // 有详情时，移动位置在包含在详情内则不需重新加载，只改变 激活位置即可
        const shouldRequest = modeHandler[data.lockType].call(this, uri, pos, kind, isSelect);
        if (!shouldRequest) return this.value;
      }

			accChanges.markDel();
			accChanges.markLoadKind(kind);
      const res = await msg.request<FetchRefRes>(ReqType.Command, ['fetchReference', toRaw(pos), toRaw(uri)]);
			accChanges.markLoadKind();
      const { define, fileRefs } = res.data || {};

      if (define && !!fileRefs?.length) {
				accChanges.doDel();
        this.found = findActiveByProp(fileRefs);
				let newKey = performance.now();
				if(kind === RefreshKind.DocEdit && this.value?.key) {
					newKey = this.value.key;
				}
        return { ...res.data, key: newKey };
      } else {
				if(kind === RefreshKind.DocEdit) {
					accChanges.clear();
					this.refreshFail = true;
				} else {
					accChanges.resetDel();
				}
        if (ENV === 'dev') {
          info(t('no reference found!'));
        }
        return this.value;
      }
    },
    {
      updated: function () {
        if (!this.found) {
          // 无found 说明 激活位置已存在，若激活位置已不在视口内依然需要滚动到该位置
          if (data.active.uri) {
            const id = data.active.index![1];
            data.active.uri.expand = true;
            data.active.uri.scroll = { id };
          }
          return;
        }
        if (data.active.uri && data.active.reference) {
          // 把原来的激活取消
          data.active.uri.active = false;
          data.active.reference.active = false;
        }

        const [i, j] = this.found;
        const value: FetchRefRes = this.value;
        const newUri = value.fileRefs[i][0];
        const newReference = value.fileRefs[i][1][j];
        newUri.active = true;
        newUri.expand = true;
        newUri.scroll = { id: j };
        newReference.active = true;
        data.active.uri = newUri;
        data.active.reference = newReference;
        data.active.index = this.found;

				// TODO: 更新时，根据行，刷新历史记录
				const ignoreKinds = [RefreshKind.DocEdit, RefreshKind.GotoHistoryLocation, RefreshKind.CreateFile];
				if(!ignoreKinds.includes(this.kind)) {
					unshiftHistory(history, newUri, newReference);
				}
				// 刷新失败则直接关闭详情
				if(this.refreshFail) {
					reset();
				}
      }
    }
  );

  const dispose1 = msg.on(MsgType.CursorMove, ({ uri, pos, kind }) => handleMoveOrSelect(uri, pos, kind));
  const dispose2 = msg.on(MsgType.SelectionChange, ({ uri, former, kind }) => handleMoveOrSelect(uri, former, kind, true));
  

	const handleCodeChange = debounce(async({ uri }: { uri: Uri }) => {
    if (!hasRefs()) return;
		// 已经发起了新请求，则不需要通过编辑修改
		if(accChanges._loadKind != null && accChanges._loadKind !== RefreshKind.DocEdit) {
			return;
		}

		const define = applyAccAreas();

    const { symbolKey } = define;
    let newDefinePos: Position;
    // 改的是定义文件，需要重新查询定义所处的位置
    if (uri.path === define.uri.path) {
			// 方案1 使用 pos + define.delta 的方案
			if(!define.miss) {
				const pos = define.range[0];
				run(uri, pos, RefreshKind.DocEdit);
				return; 
			}

			// 方案2 后备，但是对 类型定义的标识符有问题
      const res = await msg.request<Position | undefined>(ReqType.Command, [
        'fetchSymbolPos',
        toRaw(define.uri),
        symbolKey
      ]);
      if (!res.data) return;
      newDefinePos = res.data;
      run(uri, newDefinePos, RefreshKind.DocEdit);
    }
    // 改的是激活文件
    else if (uri.path === rData.active.uri?.path) {
      run(uri, define.range[0], RefreshKind.DocEdit);
    }
    // 改的既不是激活项，也不是定义项则直接使用激活项重新渲染
    else {
      run(uri, rData.active.reference?.range[0], RefreshKind.DocEdit);
    }
  })
	
	function applyAccAreas() {
		const define = rData.refs.value?.define;
		const cloned: Define = JSON.parse(JSON.stringify(define));

		accChanges.list.forEach((props) => {
			fixDefineRangeImmediate(props.uri, props.areas, cloned);
		});
		accChanges.clear();
		console.log('move-res', cloned.range);
		return cloned;
	}

	let accChanges = new ChangedRecorder();

	const dispose3 = msg.on(MsgType.CodeChanged, (props) => {
		console.log('areas', props.areas);
		accChanges.add(props);
		// if(data.refs.loading) {
		// 	accChanges.push(props);
		// 	console.log('CodeChanged And Loading');
		// } else {
		// 	fixDefineRangeImmediate(props.uri, props.areas);
		// }
		handleCodeChange(props);
	});
	const dispose4 = msg.on(MsgType.CreateFile, () => {
		const fileRefs = rData.refs.value?.fileRefs;
		if(!fileRefs?.length) return;
		
		const found = fileRefs.find(it => it[0].active) || fileRefs[0];

		const [uri, refs] = found;
		if(!refs?.length) return;
		const foundRef = refs.find(it => it.active) || refs[0];
		
		run(uri, foundRef.range[0], RefreshKind.CreateFile);
	});

	reset['bubble'] = BubbleLevel.Detail;
	bubbleEvent.on('esc', reset);

  onUnmount(() => {
    dispose1();
    dispose2();
    dispose3();
		dispose4();
		bubbleEvent.off('esc', reset);
		wHandle.stop();
		wHandle1.stop();
  });

  function handleMoveOrSelect(uri, pos, kind, isSelect = false) {
		let shouldRefresh = false;

		// const hasData = hasRefs();
		const normalCase = [
			RefreshKind.Mouse,
			RefreshKind.BackOrForward,
			RefreshKind.GotoLocation,
			RefreshKind.GotoLocationRefresh,
			RefreshKind.GotoHistoryLocation
		].includes(kind);
		shouldRefresh = normalCase;
		
    if (shouldRefresh) {
      run(uri, pos, kind, isSelect);
    }
  }

  function hasRefs() {
    const { value: { define, fileRefs } = {} } = data.refs;
    const has = define && !!fileRefs?.length;
    return has;
  }

	const updateLock = (v: LockType) => data.lockType = v;


	// TODO: search 不要每次进 detail 都重置为 默认值
  data.search = conf.IgnoreRefFile;
	const wHandle1 = watch(() => conf.IgnoreRefFile, (v) => data.search = v);
	useDebounceValue('search', 'debounceSearch', false);
	function updateSearch(v: boolean) {
		data.search = v;
	}

  return () => {
    const { value: { define, fileRefs, key } = {} } = data.refs;
    const showDetail = hasRefs();

    return [
      el('div', {}, [
        showDetail &&
          fn(Detail, {
            search: data.search,
            debounceSearch: data.debounceSearch,
            updateSearch,
            updateLock,
            lockType: data.lockType,
            active: data.active,
            key,
            fileRefs,
            define,
            close: reset
          })
      ])
    ];
  };
};


type ChangedItem = { areas: ChangedArea[], uri: Uri}
class ChangedRecorder {
	list: Array<ChangedItem> = [];
	add = (it: ChangedItem) => this.list.push(it);

	_delPos = -1
	markDel = () => {
		this._delPos = this.list.length;
	}

	_loadKind: RefreshKind;
	markLoadKind = (v?: RefreshKind) => this._loadKind = v;

	_apply = false;
	markApply = (v: boolean) => this._apply = v;

	resetDel = () => {
		this._delPos = -1;
	}

	doDel = () => {
		if(this._delPos > 0) {
			this.list = this.list.slice(this._delPos);
		}
		this.resetDel();
	}

	clear = () => {
		this.list = [];
	}
}

function fixDefineRangeImmediate(uri: Uri, areas: ChangedArea[], reference: Reference) {
	for (const area of areas) {
		const refMiss = fixDefineRange(uri, area, reference);
		if(refMiss) break;
	}
}

