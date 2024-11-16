import { getData } from "../runtime/global";


export function useAsync(key: string, fn: () => Promise<any>) {
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
	const run = () => {
		state.loading = true;
		count++;
		const memoCount = count;
    fn().then(
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
	return run;
}