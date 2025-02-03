import { toRaw } from '@vue/reactivity';
import { FetchRefRes, MsgType, ReqType, RefreshKind, Uri, Reference, FileRef } from '../../shared/var';
import { AsyncState, useAsync } from '../hook/use-async';
import { FC } from '../runtime/type';
import { LockType, msg } from '../util/var';
import { Detail, IActive, Props } from './detail';
import { el, fn } from '../runtime/el';
import { info } from '../components/toast';
import { Position } from 'vscode';
import { isFormer, posInRange } from '../../shared/utils';
import { onUnmount } from '../runtime/life-circle';

export type WrapperProps = {};
type WrapperData = {
  refs: AsyncState<FetchRefRes>;
  detailStack: any[];
  active: IActive;
	lockType: LockType;
};

export const DetailWrapper: FC<WrapperData, Props> = (data, props) => {
  data.active = {
    uri: undefined,
    reference: undefined,
    index: undefined
  };

	data.lockType = LockType.UnLock;

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
    async function (uri, pos, kind: RefreshKind) {
      const rData = toRaw(data);
      if (kind === RefreshKind.DocEdit) {
      } else {
        // 有详情时，移动位置在包含在详情内则不需重新加载，只改变 激活位置即可
        if (hasRefs()) {
          // 与激活位置相同则说明不需要更新
          if (posInRange(uri, pos, rData.active.uri, rData.active.reference?.range)) {
            return this.value;
          }

          // 在当前引用内，只需更新激活位置，不需要重新获取
          this.found = findActiveByPos(uri, pos, rData);
          if (this.found) {
            return this.value;
          }
        }
      }
      const res = await msg.request<FetchRefRes>(ReqType.Command, ['fetchReference', toRaw(pos), toRaw(uri)]);

      const { define, fileRefs } = res.data || {};

      if (define && !!fileRefs?.length) {
        this.found = findActiveByProp(fileRefs);
        return { ...res.data, key: performance.now() };
      } else {
        if (ENV === 'dev') {
          info('未找到任何引用!');
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
      }
    }
  );

  const dispose1 = msg.on(MsgType.CursorMove, ({ uri, pos, kind }) => handleMoveOrSelect(uri, pos, kind));
  const dispose2 = msg.on(MsgType.SelectionChange, ({ uri, former, kind }) => handleMoveOrSelect(uri, former, kind, true));
  const dispose3 = msg.on(MsgType.CodeChanged, async ({ uri }: { uri: Uri }) => {
    const rData = toRaw(data);
    if (!hasRefs()) return;
    const define = rData.refs.value.define;
    const fileRefs = rData.refs.value.fileRefs;

    const { symbolKey } = define;
    let newDefinePos: Position;
    // 改的是定义文件，需要重新查询定义所处的位置
    if (uri.path === define.uri.path) {
      const res = await msg.request<Position | undefined>(ReqType.Command, [
        'fetchSymbolPos',
        toRaw(define.uri),
        symbolKey
      ]);
      if (!res.data) return;
      newDefinePos = res.data;
      run(uri, define.range[0], RefreshKind.DocEdit);
    }
    // 改的是激活文件
    else if (uri.path === rData.active.uri?.path) {
      run(uri, define.range[0], RefreshKind.DocEdit);
    }
    // 改的既不是激活项，也不是定义项则直接使用激活项重新渲染
    else {
      run(uri, rData.active.reference?.range[0], RefreshKind.DocEdit);
    }
  });

  onUnmount(() => {
    dispose1();
    dispose2();
    dispose3();
  });

  function handleMoveOrSelect(uri, pos, kind, isSelect = false) {
		let shouldRefresh = false;

		const hasData = hasRefs();
		const normalCase = [
			RefreshKind.Mouse,
			RefreshKind.BackOrForward,
			RefreshKind.GotoLocation,
			RefreshKind.DocEdit
		].includes(kind);

		switch (data.lockType) {
			case LockType.UnLock:
				shouldRefresh = normalCase;
				break;
			case LockType.HalfLock:
				const isMouseSelect = kind === RefreshKind.Mouse && isSelect;
				shouldRefresh = normalCase && (isMouseSelect || !hasData);
				break;
			case LockType.Lock:
				shouldRefresh = normalCase && !hasData;
				break;
		
			default:
				break;
		}
    if (shouldRefresh) {
      run(uri, pos, kind);
    }
  }

  function hasRefs() {
    const { value: { define, fileRefs } = {} } = data.refs;
    const has = define && !!fileRefs?.length;
    return has;
  }

	const updateLock = (v: LockType) => data.lockType = v;

  return () => {
    const { value: { define, fileRefs, key } = {} } = data.refs;
    const showDetail = hasRefs();

    return [el('div', {}, [showDetail && fn(Detail, { updateLock, lockType: data.lockType, active: data.active, key, fileRefs, define, close: reset })])];
  };
};
