(function (prosemirrorView, prosemirrorState, prosemirrorModel, prosemirrorSchemaBasic, prosemirrorExampleSetup) {
  'use strict';

  // lint{
  // 定义一些你可能不想让用户使用的值
  var badWords = /\b(obviously|clearly|evidently|simply)\b/ig;
  // 将标点符号与前面的空格匹配
  var badPunc = / ([,\.!?:]) ?/g;

  function lint(doc) {
    var result = [], lastHeadLevel = null;

    function record(msg, from, to, fix) {
      result.push({msg: msg, from: from, to: to, fix: fix});
    }

    // 遍历在文档中的每个节点
    doc.descendants(function (node, pos) {
      if (node.isText) {
        // 扫描文本节点中的可疑的匹配内容
        var m;
        while (m = badWords.exec(node.text))
          { record(("Try not to say '" + (m[0]) + "'"),
                 pos + m.index, pos + m.index + m[0].length); }
        while (m = badPunc.exec(node.text))
          { record("Suspicious spacing around punctuation",
                 pos + m.index, pos + m.index + m[0].length,
                 fixPunc(m[1] + " ")); }
      } else if (node.type.name == "heading") {
        // 检查标题的等级是否与当前的等级匹配
        var level = node.attrs.level;
        if (lastHeadLevel != null && level > lastHeadLevel + 1)
          { record(("Heading too small (" + level + " under " + lastHeadLevel + ")"),
                 pos + 1, pos + 1 + node.content.size,
                 fixHeader(lastHeadLevel + 1)); }
        lastHeadLevel = level;
      } else if (node.type.name == "image" && !node.attrs.alt) {
        // 确保图片都有一个 alt 属性
        record("Image without alt text", pos, pos + 1, addAlt);
      }
    });

    return result
  }
  // }

  // fix{
  function fixPunc(replacement) {
    return function(ref) {
      var state = ref.state;
      var dispatch = ref.dispatch;

      dispatch(state.tr.replaceWith(this.from, this.to,
                                    state.schema.text(replacement)));
    }
  }

  function fixHeader(level) {
    return function(ref) {
      var state = ref.state;
      var dispatch = ref.dispatch;

      dispatch(state.tr.setNodeMarkup(this.from - 1, null, {level: level}));
    }
  }

  function addAlt(ref) {
    var state = ref.state;
    var dispatch = ref.dispatch;

    var alt = prompt("Alt text", "");
    if (alt) {
      var attrs = Object.assign({}, state.doc.nodeAt(this.from).attrs, {alt: alt});
      dispatch(state.tr.setNodeMarkup(this.from, null, attrs));
    }
  }

  function lintDeco(doc) {
    var decos = [];
    lint(doc).forEach(function (prob) {
      decos.push(prosemirrorView.Decoration.inline(prob.from, prob.to, {class: "problem"}),
                 prosemirrorView.Decoration.widget(prob.from, lintIcon(prob)));
    });
    return prosemirrorView.DecorationSet.create(doc, decos)
  }

  function lintIcon(prob) {
    var icon = document.createElement("div");
    icon.className = "lint-icon";
    icon.title = prob.msg;
    icon.problem = prob;
    return icon
  }

  var lintPlugin = new prosemirrorState.Plugin({
    state: {
      init: function init(_, ref) {
      var doc = ref.doc;
   return lintDeco(doc) },
      apply: function apply(tr, old) { return tr.docChanged ? lintDeco(tr.doc) : old }
    },
    props: {
      decorations: function decorations(state) { return this.getState(state) },
      handleClick: function handleClick(view, _, event) {
        if (/lint-icon/.test(event.target.className)) {
          var ref = event.target.problem;
          var from = ref.from;
          var to = ref.to;
          view.dispatch(
            view.state.tr
              .setSelection(prosemirrorState.TextSelection.create(view.state.doc, from, to))
              .scrollIntoView());
          return true
        }
      },
      handleDoubleClick: function handleDoubleClick(view, _, event) {
        if (/lint-icon/.test(event.target.className)) {
          var prob = event.target.problem;
          if (prob.fix) {
            prob.fix(view);
            view.focus();
            return true
          }
        }
      }
    }
  });

  var state = prosemirrorState.EditorState.create({
    doc: prosemirrorModel.DOMParser.fromSchema(prosemirrorSchemaBasic.schema).parse(document.querySelector("#content")),
    plugins: prosemirrorExampleSetup.exampleSetup({schema: prosemirrorSchemaBasic.schema}).concat(lintPlugin)
  });

  window.view = new prosemirrorView.EditorView(document.querySelector("#editor"), {state: state});
  // }

}(PM.view, PM.state, PM.model, PM.schema_basic, PM.example_setup));

