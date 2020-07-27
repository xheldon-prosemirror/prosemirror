# ProseMirror 源码阅读/汉化计划

此为个人项目，用来在本人阅读 ProseMirror 源码过程中加注释和汉化使用

因为原作者 [@Marijn](https://github.com/marijnh) 的文档是通过扫描源码生成文档然后放到 [官网](https://prosemirror.net/docs/ref/) 上的，因此此处只能通过在源码中添加注释的方式来生成相同的汉化 API 手册。

后续会考虑仿照官网，将生成的文档、示例发布到网站上（待翻译的差不多的时候）。这个过程随缘翻译，不要催更。

本项目仅含 ProseMirror 的 demo，本地第一次运行的时候是现 clone 远端仓库，因此需要依次运行：

1. `npm install yarn -g` 如果没有安装 `yarn` 的话
2. `npm install`
3. `bin/pm install`

之后开始开发：

1. `npm run demo`
2. `bin/pm watch` 进行实时刷新，即修改了任一模块的 src 下的内容，也会重新生成 dist 文件，供 demo 使用。

修改完成后，需要 push 到远端，此处我已经修改远端地址为 `https://github.com/xheldon-prosemirror/MODULE_NAME` ，因此可以通过运行:
 
 1. `bin/pm commit -a -m 'some comment'` 将改动 `commit`
 2. `bin/pm push` 将代码推向远端的 `xheldon-prosemirror` 仓库而不是原 `ProseMirror` 仓库

# 如何注释及备注

我通过修改字符串的方式，将特定开头的注释识别成中文翻译，特定的注释需要遵循以下规则：

1. 必须在紧挨着英文原文注释之后，因为中文翻译生成的时候需要找到原文然后将原文放入其内部属性上，以在 hover 的时候能够显示原文
2. 必须和英文原文注释隔开一个空行，是为了生成新的 p 标签
3. 注释必须以 `@cn` 开头
4. 如果有译者备注，则必须以 `@comment` 开头

如此只增加不删除的操作，若原仓库有修改，则只需要 merge 即可，不会产生冲突

举例：

```js
// ::- An editor view manages the DOM structure that represents an
// editable document. Its state and behavior are determined by its
// [props](#view.DirectEditorProps).
//
// @cn一个编辑器视图负责整个可编辑文档。它的 state 和行为由 props 决定
// @comment新建编辑器的第一步就是 new 一个 EditorView
```

效果可在：[https://prosemirror.xheldon.com/docs/ref/#view.EditorView](https://prosemirror.xheldon.com/docs/ref/#view.EditorView) 查看

# 生成中文的文档及相关示例静态页面的 CI 流程：

通过注释的方式翻译好后，如在 `/view/src/index.js` 中修改了某个注释，后：

1. 依前面步骤 `commit`
2. 自动追加一个文件 `X_CHANGELOG.md`，记录本次修改的变动，然后在 `push` 的时候也一起 `push` 到 `prosemirror` 仓库，以此来触发更新（之前 `push` 的时候只会对应发布相关 `module`，`prosemirror` 本身不会更新
3. 触发 `prosemirror` 的 `CI`
4. `CI` 拉取 `prosemirror` 仓库，然后将当前目录（`website`）下的 `public` `push` 到 `https://github.com/Xheldon/prosemirror-doc-cn/` 仓库
5. 稍等片刻后会自动触发 `Jekyll` 的自动编译生成 `GitHub Pages`，之后通过访问 `https://prosemirror.xheldon.com/docs/ref/` 来查看生成的文档

注：原示例页面中有一个 [协同编辑的示例](https://prosemirror.xheldon.com/examples/collab/#edit-Example )，因为其需要服务端支持而目前`不可用`。

以下是原始 README：
 
 ---
 
[ [**WEBSITE**](https://prosemirror.net) | [**ISSUES**](https://github.com/prosemirror/prosemirror/issues) | [**FORUM**](https://discuss.prosemirror.net) | [**GITTER**](https://gitter.im/ProseMirror/prosemirror) ]

ProseMirror is a well-behaved rich semantic content editor based on
contentEditable, with support for collaborative editing and custom
document schemas.

The ProseMirror library consists of a number of separate
[modules](https://github.com/prosemirror/). This repository just
serves as a central issue tracker, and holds a script to help easily
check out all the core modules for development.

The [project page](https://prosemirror.net) has more information, a
number of [examples](https://prosemirror.net/examples/) and the
[documentation](https://prosemirror.net/docs/).

This code is released under an
[MIT license](https://github.com/prosemirror/prosemirror/tree/master/LICENSE).
There's a [forum](http://discuss.prosemirror.net) for general
discussion and support requests, and the
[Github bug tracker](https://github.com/prosemirror/prosemirror/issues)
is the place to report issues.

**STOP READING HERE IF YOU'RE SIMPLY _USING_ PROSEMIRROR. YOU CAN
INSTALL THE SEPARATE [NPM
MODULES](https://www.npmjs.com/search?q=prosemirror-) FOR THAT. THE
INSTRUCTIONS BELOW ONLY APPLY WHEN _DEVELOPING_ PROSEMIRROR!**

## Setting up a dev environment

Clone this repository, and make sure you have
[node](https://nodejs.org/en/) and [yarn](https://yarnpkg.com/) (due
to a string of issues with NPM 5, NPM is not currently supported)
installed. Next, from the cloned directory run:

    bin/pm install

This will fetch the submodules, install their dependencies, and build
them.

The `bin/pm` script in this repository provides functionality for
working with the repositories:

 * `bin/pm build` rebuilds all the modules

 * `bin/pm watch` sets up a process that automatically rebuilds the
   modules when they change

 * `bin/pm status` prints the git status of all submodules

 * `bin/pm commit <args>` runs `git commit` with the given arguments
   in all submodules that have pending changes

 * `bin/pm test` runs the (non-browser) tests in all modules

 * `bin/pm push` runs `git push` in all modules.

 * `bin/pm grep <pattern>` greps through the source code for the
   modules for the given pattern

(Functionality for managing releases will be added in the future.)

## Running the demo

To run the demo in `demo/`, do `npm run demo`, and go to
[localhost:8080](http://localhost:8080/). This loads the individual
JavaScript files from the distribution's `dist` directories, and will
only need a refresh when those are changed.

We aim to be an inclusive, welcoming community. To make that explicit,
we have a [code of
conduct](http://contributor-covenant.org/version/1/1/0/) that applies
to communication around the project.
