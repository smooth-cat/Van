import { fn } from "./runtime/el"
import { render } from "./runtime/render"
import { App } from "./page/app"
import { useHmr } from "./runtime/hmr";
import { define, AutoHeight } from "scrollv";
useHmr();
define('scroll-v', AutoHeight);
render(fn(App), document.getElementById('app')!)
