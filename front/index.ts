import { fn } from "./runtime/el"
import { render } from "./runtime/render"
import { App } from "./page/app"
import { useHmr } from "./runtime/hmr";
useHmr();
render(fn(App), document.getElementById('app')!)
