import { Func } from "./type";

export type IAbortCon = Omit<AbortController, 'signal'> & { signal: AbortSignal&{ subAbort: (...fns: Func[]) => void } };

export function AbortCon() {
	const con = new AbortController();
	const signal = con.signal;

	signal['subAbort'] = (...fns) => {
		signal.addEventListener('abort', function t() {
			fns.forEach((v) => v());
			signal.removeEventListener('abort', t);
		})
	}
	return con as IAbortCon;
}

// const con = AbortCon();
// con.signal.subAbort(() => {
// 	console.log('取消事件');
// })