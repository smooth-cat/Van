type Executor<T> = (resolve: (value: T | PromiseLike<T>) => void, reject: (reason?: any) => void) => void

export class ExtPromise<T = any> extends Promise<T> {
	resolve: (value: T) => void;
	reject: (error: any) => void;
	constructor(exec = (() => {}) as Executor<T>) {
		let resolveTemp,rejectTemp
		const wrapped = (resolve, reject) => {
			resolveTemp = resolve;
			rejectTemp = reject;
			return exec(resolve, reject);
		}
		super(wrapped);
		this.resolve = resolveTemp;
		this.reject = rejectTemp;
	}

	static cover = () => {

	}
}

