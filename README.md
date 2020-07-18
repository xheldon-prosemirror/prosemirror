# ProseMirror 源码阅读/汉化计划

此为个人项目，用来在本人阅读 ProseMirror 源码过程中加注释和汉化使用

因为原作者 [@Marijn](https://github.com/marijnh) 的文档是用自己写的一个文档生成工具（不是 jsDoc）通过扫描源码生成文档然后放到 [官网](https://prosemirror.net/docs/ref/) 上的，因此此处只能通过在源码中添加注释的方式来生成相同的汉化 API 手册。

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
