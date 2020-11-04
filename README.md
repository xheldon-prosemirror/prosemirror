# ProseMirror 源码阅读/汉化计划

项目地址：[https://prosemirror.xheldon.com](https://prosemirror.xheldon.com)  [![Build Status](https://github.com/xheldon-prosemirror/prosemirror/workflows/Page%20Generator/badge.svg)

此为个人项目，用来在本人阅读 ProseMirror 源码过程中加注释和汉化使用

因为原作者 [@Marijn](https://github.com/marijnh) 的文档是通过扫描源码生成文档然后放到 [官网](https://prosemirror.net/docs/ref/) 上的，因此此处只能通过在源码中添加注释的方式来生成相同的汉化 API 手册。

~~因为是业余时间做这件事，因此这个进度不确定，不要催更。~~
> 2020年09月09日更新：翻译已全部完成

# 安装

本地第一次运行的时候是现 `clone` 远端仓库，因此需要依次运行：

1. `npm install yarn -g` 如果没有安装 `yarn` 的话
2. `bin/pm install`

# 翻译 API 文档可同步官网文档更新的原理

因为 [ProseMirror官网](https://prosemirror.net) 整体的静态文件（包括示例、文档手册等）位于 `website` 的 `public` 目录下。除了 [文档手册](https://prosemirror.net/docs/ref/) 之外，其他内容如示例、指南等页面均固定不变，因此可以直接翻译（这些页面改动频率极低）。
而其 `文档手册` 是通过逐个将 `ProseMirror 子模块` 源文件中的 [注释识别并生成](https://github.com/marijnh/builddocs) 成文档手册的，
因此，在 `install` 后，本地目录会有全部的 `ProseMirror` 子模块，然后 `website` 内有 `make` 命令可以逐个将子模块的源文件中的注释生成成文档手册，
我们只需要在源码中的注释下`添加`中文注释即可。同时，因为只在原始注释下新增而不删除，所以直接 `merge` 原始仓库的后续修改到本仓库不会有冲突。

# 如何翻译

通过将特定开头的注释识别成中文的方式进行翻译，以保证不删除原始文档而只新增，特定的注释需要遵循以下规则：

1. 必须在紧挨着英文原文注释之后，因为中文翻译生成的时候需要找到原文然后将原文放入其内部属性上，以在 hover 的时候能够显示原文
2. 必须和英文原文注释隔开一个空行，是为了生成新的 `p` 标签
3. 注释必须以 `@cn` 开头
4. 如果有译者备注，则必须以 `@comment` 开头

举例：

如下在子模块 `prosemirror-view` 中（本地路径 `./view/src/index.js`）翻译某个 API，则需要这么做：

```js
// ::- An editor view manages the DOM structure that represents an
// editable document. Its state and behavior are determined by its
// [props](#view.DirectEditorProps).
//
// @cn一个编辑器视图负责整个可编辑文档。它的 state 和行为由 props 决定。
// 
// @comment新建编辑器的第一步就是 new 一个 EditorView。
```

# 如何本地预览翻译：

1. `cd` 到 `website` 目录
2. 运行 `make` 命令
3. 运行 `npm run devserver -- --prot 8888`
4. 访问 `localhost:8888` 查看效果

注：通过修改注释来翻译文档后，因为需要重新生成 `doc`，所以需要重启 `devserver` ，这点后续优化。

在线效果可在：[https://prosemirror.xheldon.com/docs/ref/#view.EditorView](https://prosemirror.xheldon.com/docs/ref/#view.EditorView) 查看

# 修改源码（为了研究源码而不是为了翻译）后如何查看效果：

如你在 `prosemirror-view` 子模块中添加了一个 `console.log` 或者修改了一个逻辑，然后想查看效果，需要直接在根目录下运行：

1. `npm run demo`
2. `bin/pm watch` 进行实时刷新，即修改了任一模块的 `src` 下的内容后，就会重新打包文件，供 `demo` 使用。
3. 打开 `localhost:8080` 查看效果。

# 翻译完成后，如何发布到远端

注：其他人想翻译需要先 `fork` 对应的子模块仓库，然后按照上面说的方式进行翻译，完成后提 `PR`。*下列操作仅限 xheldon-prosemirror 团队成员*。

修改完成后，需要 `push` 到远端，此处我已经修改远端地址为 `https://github.com/xheldon-prosemirror/MODULE_NAME` ，因此可以通过运行:
 
 1. `bin/pm commit -a -m 'some comment'` 将改动 `commit`
 2. `bin/pm push` 将代码推向远端的 `xheldon-prosemirror` 仓库而不是原 `ProseMirror` 仓库

# 生成中文的文档及相关示例静态页面的 CI 流程：

通过注释的方式翻译好后，如在 `./view/src/index.js` 中修改了某个注释，后：

1. 依前面步骤 `commit`
2. 自动追加一个文件 `X_CHANGELOG.md`，记录本次修改的变动，然后在 `push` 的时候也一起 `push` 到 `prosemirror` 仓库，以此来触发更新（之前 `push` 的时候只会对应发布相关 `module`，`prosemirror` 本身不会更新
3. 触发 `prosemirror` 的 `CI`
4. `CI` 拉取 `prosemirror` 仓库，然后将当前目录（`website`）下的 `public` 目录 `push` 到本仓库的 `gh` 分支。
5. 稍等片刻后会触发自动编译生成 `GitHub Pages`，之后通过访问 `https://prosemirror.xheldon.com/docs/ref/` 来查看生成的文档

注：原示例页面中有一个 [协同编辑的示例](https://prosemirror.xheldon.com/examples/collab/#edit-Example) ，因为其需要服务端支持而目前`不可用`。

> 2020年11月4日将 `CI` 从 `travis` 变为 `Github Actions`

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
