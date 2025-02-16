import { MsgType } from "../../shared/var";
import { getData } from "../runtime/global"
import { onUnmount } from "../runtime/life-circle";
import { msg } from "../util/var";

export const useConfig = (dataKey: string, configKey: string) => {
	const data = getData();
	const confValue = window['conf'][configKey];
	data[dataKey] = confValue;
}