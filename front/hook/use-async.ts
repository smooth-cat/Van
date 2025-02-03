import { getData } from "../runtime/global";
import { Func } from "../runtime/type";

export type AsyncState<T> = {
	value: T,
	error: any,
	loading: boolean,
}

const UseAsyncOption = {
	updated: undefined as (Func|undefined),
	showLoadingOnce: false,
}

type IUseAsyncOpt = Partial<typeof UseAsyncOption>;

export function useAsync<T extends (...args:  any[]) => Promise<any>>(key: string, fn: T, opt: IUseAsyncOpt) {
	opt = {...UseAsyncOption, ...opt};
	const data = getData();
	let state: any = {
		value: undefined,
		error: undefined,
		loading: false,
	};
	data[key] = state;
	// 让 state 变成响应式
	state = data[key];
	
	let count = 0;
	let loadShowedOnce = false;
	const run = (...args: Parameters<T>) => {
		if(!(opt.showLoadingOnce && loadShowedOnce)) {
			state.loading = true;
		}
		loadShowedOnce = true;
		count++;
		const memoCount = count;
		const ctx = { 
			get value () { return state.value  } 
		} as any;
    return fn.apply(ctx, args).then(
			value => {
				state.loading = false;
				// 如果 count 不同说明这个异步结果失效了
				if(count !== memoCount) return;
        state.value = value;
				opt.updated?.call(ctx);
      },
      error => {
				state.loading = false;
				if(count !== memoCount) return;
        state.error = error;
				opt.updated?.call(ctx);
      }
    );
  };

	const reset = () => {
		state.value = undefined;
		state.error = undefined;
		state.loading = false;
		loadShowedOnce = false;
	}

	return [run as T, reset];
}