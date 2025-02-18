[中文](#van-插件) &nbsp;[English](#van-plugin)
# Van 插件

用于编程导航，提供 **即时引用展示**、**代码大纲**、**历史记录** 等功能。

如果本插件对你有帮助的话，请为它好评哦 😝 祝编码愉快 ~

### 注意

如果你使用了 AI 编程工具如 cursor、copilot、windsurf 等，

可把 Van 插件置于左侧边栏，通过 `mac: option + 1` 或 `win: alt + 1` 在插件和资源管理器之间快速切换

## 使用

1. 安装插件后可拖动左侧工具栏中的 Van 插件图标到编辑器右侧，即可在右侧边栏常驻。

2. 若没看到右侧边栏，可以点击 vscode 右上角的展示右侧边栏按钮。

<img src="https://github.com/smooth-cat/Van/blob/master/readme-img/right-sidebar.png?raw=true" width="650" style="float: left" />

### 快捷键

插件中右键菜单 - “🚀快捷键”  可打开插件的快捷键配置。插件快捷键如下：

1. 切换 Van 面板：`mac: option + 1` 、 `win: alt + 1`
2. 打开历史记录：`mac: option + 2` 、 `win: alt + 2`
3. 切换锁模式：`mac: option + s` 、 `win: alt + s`
4. 退出当前 抽屉 | 模式：`Esc`

### 即时引用展示

即时引用将会根据用户 **鼠标** 点击位置，实时展示标识符相关引用

1. 在代码中点击标识符，Van 将自动展示该标识符的所有引用和定义

   <img src="https://github.com/smooth-cat/Van/blob/master/readme-img/detail.png?raw=true" width="650" style="float: left" />

2. 三种引用查看模式
   1. 无锁模式，用户 **单击** 标识符就切换引用展示
   2. 半锁模式，用户通过 **选中** 来切换引用展示
   3. 锁模式，锁住当前展示引用
   4. **`mac: option + s` 、 `win: alt + s` 可在 无锁 和 锁 模式切换**

   <img src="https://github.com/smooth-cat/Van/blob/master/readme-img/lock-type.png?raw=true" width="650" style="float: left" />

3. 忽略功能
   1. 🧹 模式，点击 引用项/文件 忽略该引用。**Esc** 退出模式
   2. 忽略文件，glob 语法，默认为 node_modules

   <img src="https://github.com/smooth-cat/Van/blob/master/readme-img/clean.png?raw=true" width="650" style="float: left" />

4. 上层调用函数跳转，hover 单个引用项的行号，可以查看上层调用函数，点击弹出框可以跳转。
   <img src="https://github.com/smooth-cat/Van/blob/master/readme-img/ref-upper.png?raw=true" width="650" style="float: left" />

### 代码大纲

代码大纲会呈现代码中各作用域下的标识符

1. 按类型筛选标识符
2. 名称搜索，@开头支持大小写敏感

<img src="https://github.com/smooth-cat/Van/blob/master/readme-img/outline.png?raw=true" width="650" style="float: left" />

### 历史记录

1. 插件中右键菜单 可打开历史记录界面，快捷键： `mac: option + 2` 、 `win: alt + 2`
1. 历史记录支持通过右键菜单 - "🤡前进👉️" 或 "👈️后退🤡" 实现跳转

<img src="https://github.com/smooth-cat/Van/blob/master/readme-img/history.png?raw=true" width="700" style="float: left" />

### 右键菜单

1. 历史记录 -- 查看浏览标识符的历史记录
1. 前进/后退 -- 向前、向后查看历史
1. 设置 -- 查看插件设置
1. 快捷键 -- 查看插件快捷键

<img src="https://github.com/smooth-cat/Van/blob/master/readme-img/menu.png?raw=true" width="700" style="float: left" />

[中文](#van-插件) &nbsp;[English](#van-plugin)

# Van Plugin

For programming navigation, providing features like **Real-time Reference Display**, **Code Outline**, **History**, and more.

If this plugin helps you, please leave a positive review 😝 Happy coding ~

### Note

If you are using AI programming tools like cursor, copilot, windsurf, etc.,

You can place the Van plugin in the left sidebar and switch between the plugin and the resource manager through `mac: option + 1` or `win: alt + 1`

## Usage

1. After installation, drag the Van plugin icon from the left toolbar to the right side of the editor to keep it in the right sidebar.
2. If the right sidebar is not visible, click the "Show Right Sidebar" button in the top-right corner of VSCode.

<img src="https://github.com/smooth-cat/Van/blob/master/readme-img/right-sidebar.png?raw=true" width="650" style="float: left" />

### Shortcuts

Right-click in the plugin panel → "🚀 Shortcuts" to view configurable shortcuts. Default shortcuts:

1. Switch Van Panel: `mac: option + 1`, `win: alt + 1`
2. Open History: `mac: option + 2`, `win: alt + 2`
3. Toggle Lock Mode: `mac: option + s`, `win: alt + s`
4. Exit Current Drawer | Mode: `Esc`

### Real-time Reference Display

Displays identifier references based on the **mouse click position** in real-time.

1. Click any identifier in code to automatically show all its references and definitions.

   <img src="https://github.com/smooth-cat/Van/blob/master/readme-img/detail.png?raw=true" width="650" style="float: left" />

2. Three reference viewing modes:
   - **Unlocked Mode**: Switch reference display by clicking identifiers
   - **Semi-lock Mode**: Switch reference display by selecting identifiers
   - **Locked Mode**: Lock current reference display
   - **`mac: option + s`, `win: alt + s`** toggles between Unlocked and Locked modes.

   <img src="https://github.com/smooth-cat/Van/blob/master/readme-img/lock-type.png?raw=true" width="650" style="float: left" />

3. Ignore Functionality
   - **🧹 Clean Mode**: Click any reference/file to ignore it. Press **Esc** to exit.
   - Ignored files use glob syntax (default: node_modules).

   <img src="https://github.com/smooth-cat/Van/blob/master/readme-img/clean.png?raw=true" width="650" style="float: left" />

4. Upper Call Function Navigation: Hover over line numbers in reference items to view upper call functions. Click the popup to jump.

   <img src="https://github.com/smooth-cat/Van/blob/master/readme-img/ref-upper.png?raw=true" width="650" style="float: left" />

### Code Outline

Displays identifiers within different code scopes.

1. Filter identifiers by type
2. Search by name (case-sensitive when starting with @)

<img src="https://github.com/smooth-cat/Van/blob/master/readme-img/outline.png?raw=true" width="650" style="float: left" />

### History

1. Right-click in the plugin panel → "History" to view navigation history (Shortcut: `mac: option + 2`, `win: alt + 2`)
2. Use "🤡 Forward 👉️" or "👈️ Back 🤡" in the right-click menu to navigate history.

<img src="https://github.com/smooth-cat/Van/blob/master/readme-img/history.png?raw=true" width="700" style="float: left" />

### Right-click Menu

1. History - View navigation history
2. Forward/Backward - Navigate history
3. Settings - Configure plugin settings
4. Shortcuts - View shortcut keys

<img src="https://github.com/smooth-cat/Van/blob/master/readme-img/menu.png?raw=true" width="700" style="float: left" />