import { reactive, toRaw } from "@vue/reactivity";
import { inject } from "../runtime/context";
import { Reference, Uri, ReqType } from "../../shared/var";
import { useConfig } from "../hook/use-defualt";
import { getData } from "../runtime/global";
import { eqPos } from "../../shared/utils";
import { conf } from "./conf";
import { deepToRaw, msg } from "../util/var";

const DefaultHistoryStore = { 
	historyList: [] as { uri: Uri, refs: Reference[] }[], 
	cursor: {i:0, j:0}, 
	shown: false,
	loading: false 
};

export type HistoryStore = typeof DefaultHistoryStore;

export const useHistoryStore = () => {
	const store = reactive({ ...DefaultHistoryStore });
	
	// 初始化时从 workspaceState 读取历史记录
	store.loading = true;
	msg.request<any[]>(ReqType.Command, ['getHistoryList']).then(res => {
		if (!res.error) {
			store.historyList = res.data || [];
		}
		store.loading = false;
	});

	inject('historyStore', store);
}

export function unshiftHistory(store: HistoryStore, uri: Uri, ref: Reference) {
	if(store.historyList.length >= conf.HistoryMaxLength) {
		store.historyList.pop();
	}
	const clonedUri = JSON.parse(JSON.stringify(toRaw(uri)));
	clonedUri.active = true;
	clonedUri.expand = true;
	clonedUri.showMore = true;
	const clonedRef = JSON.parse(JSON.stringify(toRaw(ref)));
	clonedRef.active = true;

	const latest = store.historyList[0];
	if(!latest || latest.uri.path !== clonedUri.path) {
		store.historyList.unshift({ uri: clonedUri, refs: [clonedRef] });
	} else {
		const filtered = latest.refs.filter(it => !eqPos(it.range[0], clonedRef.range[0]));
		latest.refs = [clonedRef, ...filtered];
	}
	const rawList = deepToRaw(store.historyList)
	// 保存到 workspaceState
	msg.request(ReqType.Command, ['saveHistoryList', rawList]);

	// 不触发 watcher
	store.cursor.i = 0;
	store.cursor.j = 0;
}

export function clearHistory(store: HistoryStore) {
	store.historyList = [];
	store.cursor = { i: 0, j: 0 };
	// 清空后保存到 workspaceState
	msg.request(ReqType.Command, ['saveHistoryList', []]);
}