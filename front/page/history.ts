import { ChangedArea, MsgType, Reference, ReqType, Uri } from '../../shared/var';
import { Tooltip } from '../components/tooltip';
import { HistoryStore } from '../store/history-stroe';
import { iDelete, iPrevious } from '../icon';
import { Icon } from '../icon/fc';
import { use } from '../runtime/context';
import { el, fn, text } from '../runtime/el';
import { onUnmount } from '../runtime/life-circle';
import { FC } from '../runtime/type';
import { fixDefineRange, msg } from '../util/var';
import { DetailFile } from './detail-ref-file';
import './history.less';
import { bubbleEvent, BubbleLevel } from '../store/bubble-event';
import { keyBind } from '../store/conf';
import Empty from '../icon/nav-empty.png';
import { toRaw, watch } from '@vue/reactivity';
import { info } from '../components/toast';
import { eqPos, isFormer } from '../../shared/utils';
export type Props = {
	
}
type Data = {
	
}

export const HistoryWrapper: FC<Data, Props> = (data, props) => {
	
	const store = use<HistoryStore>('historyStore');

	function toggleShown() {
		store.shown = !store.shown;
	}

	const dispose = msg.on(MsgType.HistoryCursorMove, (type: 'backward'|'forward') => {
		const [_, newCursor] = traverseFromPosition(
      store.historyList,
      store.cursor.i,
      store.cursor.j,
      2,
      'refs',
			// 这是一个倒序列表
      type === 'backward' ? 'forward' : 'backward'
    );
		if(newCursor) {
			store.cursor = newCursor;
		} else {
			info(t('No more history'))
		}
	});

	const dispose2 = msg.on(MsgType.CodeChanged, (e) => {
		const uri: Uri = e.uri;
		const areas: ChangedArea[] = [...e.areas];
		const sortFn = (a, b) => isFormer(a.range[0], b.range[0]) ? -1 : 1;

		areas.sort(sortFn);
		const foundArr  = store.historyList.filter((it) => it.uri.path === uri.path);
		if(!foundArr) return;
		const list: Reference[] = [];
		for (const found of foundArr) {
			list.push(...found.refs);
		}
		list.sort(sortFn);

		let i = areas.length - 1;
		let j = list.length - 1;
		while (i >= 0 && j >= 0) {
			const change = areas[i];
			const ref = list[j];
			const [ changeStart ] = change.range;
			const [ refStart, refEnd ] = ref.range;

			// 改的位置在所有区域之后则跳过
			if(isFormer(refStart, changeStart, true)) {
				// 从 j 往前找相同的标识符都做 rename 处理
				for (let p = j-1; p >=0; p--) {
					const prevRef = list[p];
					if(eqPos(prevRef.range[0], refStart)) {
						// fix 同节点
						fixDefineRange(uri, change, prevRef, true);
					}
				}
				// fix 本节点
				fixDefineRange(uri, change, ref, true);
				i--;
				continue;
			}

			// 改的位置在 refs 之前，则全部应用
			for (let p = i; p >= 0; p--) {
				const change = areas[i];
				const refMiss = fixDefineRange(uri, change, ref, true);
				if(refMiss) break;
			}
			// 处理完成该 ref 的位置
			j--;

		}
	})


	const wHandle= watch(() => store.cursor, (value) => {
		const { i, j } = value;
		const uri = store.historyList[i]?.uri;
		const ref = store.historyList[i]?.refs?.[j];
		if(!uri || !ref) return;

			// TODO: 考虑详情是否需要更新
			msg.request(ReqType.Command, ['gotoLocation', toRaw(uri), toRaw(ref.range[0]), { triggerEvent: true, forceRefresh: true, addHistory: false }]);
	});

	bubbleEvent.on('cmd+0', toggleShown);

	onUnmount(() => {
		dispose();
		dispose2();
		wHandle.stop();
		bubbleEvent.off('cmd+0', toggleShown);
	})

	return () => {
		return [
			store.shown && fn(History, {  })
		]
	}
}


/**
 * 从指定位置开始遍历二维数组
 * @param {Array[]} arr 二维数组
 * @param {number} i 起始行索引
 * @param {number} j 起始列索引
 * @param {number} n 要遍历的项数
 * @param {'forward'|'backward'} direction 遍历方向（默认向前）
 * @returns {Array} 遍历结果数组
 */
function traverseFromPosition(arr, i: number, j: number, n: number, subKey: string = '',direction = 'forward') {
  // 参数校验
  if (!Array.isArray(arr) || arr.length === 0 || 
      i < 0 || i >= arr.length || 
      j < 0 || (arr[i] && j >= arr[i].length)) {
    return [];
  }

  const result: {i:number, j:number}[] = [];
  let currentRow = i;
  let currentCol = j;
  let step = 0;

  // 方向系数：forward=1（正向遍历）, backward=-1（反向遍历）
  const stepDelta = direction === 'forward' ? 1 : -1;

  while (step < n) {
    // 确保当前行存在
    if (currentRow < 0 || currentRow >= arr.length) break;

    const subArr = (subKey ? arr[currentRow][subKey] :  arr[currentRow])|| [];
    // 确保当前列有效
    if (currentCol >= 0 && currentCol < subArr.length) {
      result.push({i:currentRow, j:currentCol});
      step++;
    }

    // 计算下一个位置
    currentCol += stepDelta;

    // 处理列越界
    if (currentCol < 0 || currentCol >= subArr.length) {
      currentRow += stepDelta;
      currentCol = direction === 'forward' ? 0 : (arr[currentRow]?.length - 1 || 0);
    }
  }
  return result.slice(0, n); // 确保不超过 n 项
}

export const History: FC<Data, Props> = (data, props) => {
	
	const store = use<HistoryStore>('historyStore');
	const temp = new Set<string>()

	function close() {
		store.shown = false;
	}

	function deleteAll() {
		store.historyList = [];
		store.cursor = { i: 0, j: 0}
	}

	close['bubble'] = BubbleLevel.History;

	bubbleEvent.on('esc',close);

	onUnmount(() => {
		bubbleEvent.off('esc',close);
	})

	return () => {
		const { historyList, cursor } = store;

		return [
			el('div', { class: 'history' }, [
				el('div', { class: 'history-title' }, [
					fn(Tooltip, {
						els: [fn(Icon, { i: iPrevious, size: 18, onclick: close })],
						tip: t('close{0}', `(${keyBind['Van.exit_current']})`),
						type: 'bottom-left',
					}),
					fn(Tooltip, {
						els: [fn(Icon, { i: iDelete, size: 18, onclick: deleteAll })],
						tip: t('clear history'),
						type: 'bottom',
					}),
					el('div', { class: 'history-title-name' }, [
						text(t('History List'))
					]),
				]),
				el('div', { class: 'history-list hide-scrollbar' }, !historyList?.length ? [
					el('div', { class: 'loading-wrapper' }, [
						el('img', { class: 'loading-img', src: Empty })
					])
				] : historyList.map(({ uri, refs }, i) => {
					return fn(DetailFile, {
            index: i,
            clearable: false,
            ignorePaths: temp,
            ignoreRefKey: temp,
            uri,
            refs,
            isHistoryItem: true,
          });
				}))
			])
		]
	}
}