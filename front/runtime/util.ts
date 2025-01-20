export const isObject = val => val !== null && typeof val === 'object';
export const hasOwn = (target: any, key: any) => Object.prototype.hasOwnProperty.call(target, key);


type NameItem = Record<string, any> | string;
export const cNames = (...args: NameItem[]) => {
	return args.reduce((value, item) => {
		if(typeof item === 'string') {
			return value + ' ' + item;
		}
		for (const key in item) {
			const bool = item[key];
			if(bool) {
				value += ' ' + key;
			}
		}
		return value;
	}, '')
}