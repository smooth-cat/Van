### 编辑器操作

1. 切换激活的文件 onDidChangeActiveTextEditor
   1. 大纲 重新构建调用 docProcess **异步**
   2. 详情
      1. 是引用|定义的文件，则切换高亮显示
      2. 无，则关闭详情

2. 切换 (光标|选中) onDidChangeTextEditorSelection  
   1. 详情：新建详情并弹出，已有详情的情况下需要选中有长度才能变更 vscode.executeReferenceProvider **异步**

3. 编辑文件  workspace.onDidChangeTextDocument
   1. 大纲 
      1. 是当前文件，重新构建调用 docProcess  **异步**
   2. 详情
      1. 不论如何都要 根据详情 location，并重新构建详情  **异步**
4. 删除文件  workspace.onDidDeleteFiles
   1. 大纲
      1. 是当前文件，**大纲会根据 (1)onDidChangeActiveTextEditor 重新渲染**  **异步**
   2. 详情
      1. 是定义的文件，**清空+关闭详情**
      2. 是引用的文件，**删除详情中引用文件项**
5. 重命名    workspace.renameDocuments
   1. 大纲
      1. 是当前文件，**改变大纲 uri**
   2. 详情
      1. 是定义的文件，**改变详情的 location.uri**
      2. 是引用的文件，**修改详情中的引用文件项**

### 插件操作

1. 大纲
   1. 点击某标识符，弹出详情，focus 在定义和引用的位置
   2. 搜索操作，弹出搜索结果层，呈现扁平 list 即可
   3. 点击清除，则关闭搜索结果层
2. 详情
   1. 点击引用|定义 跳转至对应位置   **'editor.action.goToLocations'**
      `commands.executeCommand('editor.action.goToLocations', Uri.parse(uri), position, [], 'goto', '') `

