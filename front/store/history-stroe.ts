import { reactive, toRaw } from "@vue/reactivity";
import { inject } from "../runtime/context";
import { onUnmount } from "../runtime/life-circle";
import { Reference, Uri } from "../../shared/var";
import { useConfig } from "../hook/use-defualt";
import { getData } from "../runtime/global";
import { eqPos } from "../../shared/utils";
import { conf } from "./conf";
const DefaultHistoryStore = { 
	historyList: [] as { uri: Uri, refs: Reference[] }[], 
	cursor: {i:0, j:0}, 
	shown: false 
};

export type HistoryStore = typeof DefaultHistoryStore;

export const useHistoryStore = () => {
	const store = reactive({ ...DefaultHistoryStore });
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
	// 不触发 watcher
	store.cursor.i = 0;
	store.cursor.j = 0;
}