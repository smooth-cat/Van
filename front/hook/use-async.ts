import { getData } from "../runtime/global";

export type AsyncState<T> = {
	value: T,
	error: any,
	loading: boolean,
}

export function useAsync<T extends (...args:  any[]) => Promise<any>>(key: string, fn: T) {
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
	const run = (...args: Parameters<T>) => {
		state.loading = true;
		count++;
		const memoCount = count;
    return fn(...args).then(
			value => {
				// 如果 count 不同说明这个异步结果失效了
				if(count !== memoCount) return;
        state.value = value;
        state.loading = false;
      },
      error => {
				if(count !== memoCount) return;
        state.error = error;
        state.loading = false;
      }
    );
  };

	const reset = () => {
		state.value = undefined;
		state.error = undefined;
		state.loading = false;
	}

	return [run as T, reset];
}