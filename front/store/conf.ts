import { reactive } from "@vue/reactivity";
import { Err, MsgType, ReqType } from "../../shared/var";
import { isMac, msg } from "../util/var";

export const conf = reactive<Record<any, any>>(window['conf']);

// 保证组件重新加载时拿到的 conf 是对的
const dispose = msg.on(MsgType.ConfigChange, (changed) => {
	for (const key in changed) {
		conf[key] = changed[key];	
	}
});

const nameMap = {
	'escape': 'Esc',
	'f12': 'F12',
	'alt': isMac ? 'option' : 'alt',
}
export const keyBind = reactive<Record<any, any>>({});
setBindValue(window['keyBindObj']);
// 第一次主动拿一下 bindingKey
msg.request(ReqType.Command, ['fetchHackKeyBind']).then((res) => {
	// 作废
	if(res.error === Err.UselessResult) return;
	setBindValue(res.data);
});


function setBindValue(obj: Record<any, string>) {
	for (const key in obj) {
		const value = obj[key];
		const handled = value.replace(/[^+ ]+/, (v) => {
			return nameMap[v] || v;
		});
		keyBind[key] = handled;
	}
}

// 保证组件重新加载时拿到的 conf 是对的
const dispose1 = msg.on(MsgType.KeyBindChange, (changed) => {
	setBindValue(changed);
});