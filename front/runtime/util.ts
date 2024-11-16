export const isObject = val => val !== null && typeof val === 'object';
export const hasOwn = (target: any, key: any) => Object.prototype.hasOwnProperty.call(target, key)