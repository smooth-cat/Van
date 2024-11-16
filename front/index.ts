import { reactive, ref } from "@vue/reactivity"
import { el, fn, text } from "./runtime/el"
import { render } from "./runtime/render"
import { App } from "./page/app"

import { Message } from '../shared/message/index';

render(fn(App), document.getElementById('app')!)
