import { reactive, ReactiveEffect } from "@vue/reactivity";
import { IEl, train } from "./el";
import { FlushStatus, getVar, setVar } from "./global";
import { dispatchFlush } from "./render";
import { Func } from "./type";
import { AbortCon } from './abort-controller';

export class Component {
	data = reactive({});
	renderEffect: ReactiveEffect;
	props: any;
	ctx: Record<string, any> = {};
	constructor(public el: IEl) {};

	abortCon = AbortCon();

	lifeCircles : Record<any, Func[]> = {
		onUnmount: [],
		onPropsChanged: [],
	}

	update = (el: IEl, changedProps?: Record<any, any>) => {
		this.el = el;
		if(changedProps) {
			Object.assign(this.props, changedProps)
		}
	}

	init = () => {
		setVar('curInitFC', this);
		this.props = this.el.props;
		let createRender = this.el.$type as ((data: any, props: any) => Func)
		this.handleRender(createRender(this.data, this.props));

		// 全部订阅通过 Controller 统一处理
		this.abortCon.signal.subAbort(() => {
			// 删除渲染 effect
			this.renderEffect.stop();
			// 删除生命周期函数
			for (const name in this.lifeCircles) {
				this.lifeCircles[name] = [];
			}
			// 删除直接子dom元素事件监通过 signal 绑定
		})

		setVar('curInitFC', null);
	}

	clear = () => {
		this.lifeCircles.onUnmount.forEach((fn) => fn());
		// 注销 renderEffect，lifeCircles，直接子 dom 元素的事件监听
		this.abortCon.abort();

		this.data = undefined as any;
		this.renderEffect = undefined as any;
		this.el = undefined as any;
		this.ctx = undefined as any;
	}

	handleRender = (render: Func) => {
		const effect = new ReactiveEffect((...args: any[]) => {
			setVar('curRenderFC', this);
			const res = render(...args);
			this.el.$children = res;
			train(this.el);
			setVar('curRenderFC', null);
		});

		effect.scheduler = () => {
      if (!effect.dirty) return;
      const diffRoots = getVar('diffRoots');
      const flushStatus = getVar('flushStatus');
      switch (flushStatus) {
        case FlushStatus.None:
          diffRoots.add(this.el);
          dispatchFlush();
          setVar('flushStatus', FlushStatus.Pending);
          break;
        case FlushStatus.Pending:
          diffRoots.add(this.el);
          break;
        // 直接交给 dirty 进行判断
        case FlushStatus.Flushing:
          diffRoots.add(this.el);
          break;
      }
    };
		this.renderEffect = effect;

	}
}