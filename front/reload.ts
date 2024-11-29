import RsEvent from "@rspack/core/hot/emitter";
import { msg } from "./util/var";
import { MsgType } from "../shared/var";

RsEvent.on('webpackHotUpdate', (key) => {
	console.log('触发了热更新事件', key);
})

window.addEventListener('unload', () => {
	msg.emit(MsgType.Reload, '')
})

