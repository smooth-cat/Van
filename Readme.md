[中文](#van-插件) &nbsp;[English](#van-plugin)
# Van 插件

用于编程导航，提供及**时引用展示**、**代码大纲**等功能。

如果本插件对你有帮助的话，请为它好评哦 😝 祝编码愉快 ~

## 使用

1. 安装插件后可拖动左侧工具栏中的 Van 插件图标到编辑器右侧，即可在右侧边栏常驻。

   

2. 若没看到右侧边栏，可以点击 vscode 右上角的展示右侧边栏按钮。

<img src="https://github.com/smooth-cat/Van/blob/master/readme-img/right-sidebar.png?raw=true" width="700" />

### 及时引用展示

1. 在代码中点击标识符，Van 将自动展示该标识符的所有引用和定义

   <img src="https://github.com/smooth-cat/Van/blob/master/readme-img/detail.png?raw=true" width="700" />

2. 三种引用查看模式
   1. 无锁模式，用户 **单击** 标识符就切换引用展示
   2. 半锁模式，用户通过 **选中** 来切换引用展示
   3. 锁模式，锁住当前展示引用
   4. **F12 可在 无锁 和 锁 模式切换**

   <img src="https://github.com/smooth-cat/Van/blob/master/readme-img/lock-type.png?raw=true" width="700" />

3. 忽略功能
   1. 🧹 模式，点击 引用项/文件 忽略该引用。**Esc** 退出模式
   2. 忽略文件，glob 语法，默认为 node_modules

   <img src="https://github.com/smooth-cat/Van/blob/master/readme-img/clean.png?raw=true" width="700" />
   
4. 上层调用函数跳转，hover 单个引用项的行号，可以查看上层调用函数，点击弹出框可以跳转。
   <img src="https://github.com/smooth-cat/Van/blob/master/readme-img/ref-upper.png?raw=true" width="700" />

### 代码大纲

1. 按类型筛选标识符
2. 名称搜索，@开头支持大小写敏感

<img src="https://github.com/smooth-cat/Van/blob/master/readme-img/outline.png?raw=true" width="700" />

### 打开配置项

1. 在插件中右键，选择菜单中 “🕹设置” 项即可打开配置

<img src="https://github.com/smooth-cat/Van/blob/master/readme-img/setting.png?raw=true" width="700" />

[中文](#van-插件) &nbsp;[English](#van-plugin)
# Van Plugin

For programming navigation, providing **real-time reference display**, **code outline** and other features.

If this plugin helps you, please give it a good review 😝 Happy coding ~

## Usage

1. After installation, drag the Van plugin icon from the left toolbar to the right side of the editor to keep it permanently in the right sidebar.

2. If the right sidebar is not visible, click the "Show Right Sidebar" button in the upper right corner of VS Code.

<img src="https://github.com/smooth-cat/Van/blob/master/readme-img/right-sidebar.png?raw=true" width="700" />

### Real-time Reference Display

1. Click any identifier in the code, and Van will automatically display all references and definitions of that identifier.

   <img src="https://github.com/smooth-cat/Van/blob/master/readme-img/detail.png?raw=true" width="700" />

2. Three Reference Viewing Modes:
   1. **No Lock Mode**: Switch reference displays by **clicking** identifiers
   2. **Semi-Lock Mode**: Switch reference displays by **selecting** identifiers
   3. **Lock Mode**: Lock the current reference display
   4. Press **F12** to toggle between **No Lock** and **Lock** modes

   <img src="https://github.com/smooth-cat/Van/blob/master/readme-img/lock-type.png?raw=true" width="700" />

3. Ignore Functionality
   1. 🧹 **Clean Mode**: Click reference items/files to ignore them. Press **Esc** to exit
   2. Ignored files using glob syntax (default: node_modules)

   <img src="https://github.com/smooth-cat/Van/blob/master/readme-img/clean.png?raw=true" width="700" />
   
4. Jump to the upper level calling function, hover over the line number of a single reference item, you can see the upper level calling function, click the pop-up box to jump.
   <img src="https://github.com/smooth-cat/Van/blob/master/readme-img/ref-upper.png?raw=true" width="700" />

### Code Outline

1. Filter identifiers by type
2. Name search (case-sensitive when starting with @)

<img src="https://github.com/smooth-cat/Van/blob/master/readme-img/outline.png?raw=true" width="700" />

### Open Configuration

1. Right-click in the plugin panel and select "🕹Setting" from the menu to open configurations

<img src="https://github.com/smooth-cat/Van/blob/master/readme-img/setting.png?raw=true" width="700" />