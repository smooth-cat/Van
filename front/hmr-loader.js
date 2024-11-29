const fs = require('fs');
module.exports = function (code, map, meta) {
	const filePath = this.resourcePath;
	const regExp = /(\w+)\s*\:\s*FC/g;

	let matchArr;
	const componentNameList = [];
	while ((matchArr = regExp.exec(code)) !== null) {
		const [_, componentName] = matchArr;
		componentNameList.push({
			componentName,
			hmrId: filePath+componentName,
		});
	}
	
	const hasComponent = !!componentNameList.length;

	const hmr = `
		if(module['hot']) {
			// 给组件打hmrId 方便 dfs 更新
			${componentNameList.map(({ componentName, hmrId }) => `${componentName}['hmrId'] = '${hmrId}'`).join(';')}
			const isUpdate = !!module['hot'].data;
			// console.log('isUpdate', isUpdate);
			// console.log('hot对象', module['hot']);
			module['hot'].accept();
			if(isUpdate) {
				window['__Internal_Event__']?.emit('hmr', [${componentNameList.map(it => it.componentName).join(',')}])
			}
			module['hot'].data = true;
		}
	`

	if(componentNameList.some(({componentName}) => componentName === 'Detail') ) {
		// console.log({hmr});
		// fs.writeFileSync('./hmr.js', hmr);
	}

	return hasComponent ? code+hmr : code
}

