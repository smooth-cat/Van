// @deprecated
const path = require('path');
const fs = require('fs').promises;

class CopyNlsPlugin {
	workspace = path.resolve(__dirname, '../')
	apply(compiler) {
		
		// 在打包之前执行
		compiler.hooks.watchRun.tapPromise('CopyNlsPlugin', async(compiler) => {
			console.log('tap CopyNlsPlugin');
			const paths = await fs.readdir(this.workspace);
			const nlsList = paths.filter((v) => !!v.match(/\.nls\.([\w-]+)\./));
			const enPkg = await fs.readFile(path.resolve(this.workspace, 'package.nls.json'), { encoding: 'utf-8' });
			const enKeys = this.pickKeys(enPkg);
			const promises = nlsList.map((relative) => {
				return new Promise(async(resolve, reject) => {
					const rawP = path.resolve(this.workspace, relative);
					let [_, nlsName] = relative.match(/\.nls\.([\w-]+)\./);
					const targetP = path.resolve(__dirname, `bundle.l10n.${nlsName}.json`)
					let targetText = await fs.readFile(rawP, { encoding: 'utf-8' });
					targetText = targetText.replace(/\{/, () => {
						return `{${enKeys},`
					});
					
				})
			});
			const res = await Promise.all(promises);
		});
		console.log('apply CopyNlsPlugin', compiler.hooks.run.tap);
	}
	pickKeys(str) {
		let i = 0,j=str.length-1;
		for (; i < str.length; i++) {
			const c = str[i];
			if(c === '{') {
				break;
			}
		}
		for (; j >= 0; j--) {
			const c = str[j];
			if(c === '}') {
				break;
			}
		}
		return str.slice(i+1, j);
	}
}

module.exports = CopyNlsPlugin;