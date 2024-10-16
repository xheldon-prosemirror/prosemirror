(function (prosemirrorSchemaBasic, prosemirrorModel, prosemirrorTransform, prosemirrorMenu, prosemirrorExampleSetup, prosemirrorKeymap, prosemirrorHistory, prosemirrorState, prosemirrorView) {
  'use strict';

  // schema{

  var footnoteSpec = {
    group: "inline",
    content: "inline*",
    inline: true,
    // 这个设置让 view 将该节点当成是一个叶子节点对待，即使它从技术上讲，是有内容的
    atom: true,
    toDOM: function () { return ["footnote", 0]; },
    parseDOM: [{tag: "footnote"}]
  };

  var footnoteSchema = new prosemirrorModel.Schema({
    nodes: prosemirrorSchemaBasic.schema.spec.nodes.addBefore("image", "footnote", footnoteSpec),
    marks: prosemirrorSchemaBasic.schema.spec.marks
  });

  var menu = prosemirrorExampleSetup.buildMenuItems(footnoteSchema);
  menu.insertMenu.content.push(new prosemirrorMenu.MenuItem({
    title: "Insert footnote",
    label: "Footnote",
    select: function select(state) {
      return prosemirrorTransform.insertPoint(state.doc, state.selection.from, footnoteSchema.nodes.footnote) != null
    },
    run: function run(state, dispatch) {
      var ref = state.selection;
      var empty = ref.empty;
      var $from = ref.$from;
      var $to = ref.$to;
      var content = prosemirrorModel.Fragment.empty;
      if (!empty && $from.sameParent($to) && $from.parent.inlineContent)
        { content = $from.parent.content.cut($from.parentOffset, $to.parentOffset); }
      dispatch(state.tr.replaceSelectionWith(footnoteSchema.nodes.footnote.create(null, content)));
    }
  }));

  var FootnoteView = function FootnoteView(node, view, getPos) {
    // 我们后面需要这些
    this.node = node;
    this.outerView = view;
    this.getPos = getPos;

    // 这个是该节点在编辑器中的 DOM 结构（目前为止是空的）
    this.dom = document.createElement("footnote");
    // 这个是当脚注被选中的时候有用
    this.innerView = null;
  };
  // }
  // nodeview_select{
  FootnoteView.prototype.selectNode = function selectNode () {
    this.dom.classList.add("ProseMirror-selectednode");
    if (!this.innerView) { this.open(); }
  };

  FootnoteView.prototype.deselectNode = function deselectNode () {
    this.dom.classList.remove("ProseMirror-selectednode");
    if (this.innerView) { this.close(); }
  };
  // }
  // nodeview_open{
  FootnoteView.prototype.open = function open () {
      var this$1$1 = this;

    // 附加一个 tooltip 到外部节点
    var tooltip = this.dom.appendChild(document.createElement("div"));
    tooltip.className = "footnote-tooltip";
    // 然后在其内添加一个子 ProseMirror 编辑器
    this.innerView = new prosemirrorView.EditorView(tooltip, {
      // 你可以用任何节点作为这个子编辑器的 doc 节点
      state: prosemirrorState.EditorState.create({
        doc: this.node,
        plugins: [prosemirrorKeymap.keymap({
          "Mod-z": function () { return prosemirrorHistory.undo(this$1$1.outerView.state, this$1$1.outerView.dispatch); },
          "Mod-y": function () { return prosemirrorHistory.redo(this$1$1.outerView.state, this$1$1.outerView.dispatch); }
        })]
      }),
      // 魔法发生在这个地方
      dispatchTransaction: this.dispatchInner.bind(this),
      handleDOMEvents: {
        mousedown: function () {
          // 为了避免出现问题，当父编辑器 focus 的时候，脚注的编辑器也要 focus。
          if (this$1$1.outerView.hasFocus()) { this$1$1.innerView.focus(); }
        }
      }
    });
  };

  FootnoteView.prototype.close = function close () {
    this.innerView.destroy();
    this.innerView = null;
    this.dom.textContent = "";
  };
  // }
  // nodeview_dispatchInner{
  FootnoteView.prototype.dispatchInner = function dispatchInner (tr) {
    var ref = this.innerView.state.applyTransaction(tr);
      var state = ref.state;
      var transactions = ref.transactions;
    this.innerView.updateState(state);

    if (!tr.getMeta("fromOutside")) {
      var outerTr = this.outerView.state.tr, offsetMap = prosemirrorTransform.StepMap.offset(this.getPos() + 1);
      for (var i = 0; i < transactions.length; i++) {
        var steps = transactions[i].steps;
        for (var j = 0; j < steps.length; j++)
          { outerTr.step(steps[j].map(offsetMap)); }
      }
      if (outerTr.docChanged) { this.outerView.dispatch(outerTr); }
    }
  };
  // }
  // nodeview_update{
  FootnoteView.prototype.update = function update (node) {
    if (!node.sameMarkup(this.node)) { return false }
    this.node = node;
    if (this.innerView) {
      var state = this.innerView.state;
      var start = node.content.findDiffStart(state.doc.content);
      if (start != null) {
        var ref = node.content.findDiffEnd(state.doc.content);
          var endA = ref.a;
          var endB = ref.b;
        var overlap = start - Math.min(endA, endB);
        if (overlap > 0) { endA += overlap; endB += overlap; }
        this.innerView.dispatch(
          state.tr
            .replace(start, endB, node.slice(start, endA))
            .setMeta("fromOutside", true));
      }
    }
    return true
  };
  // }
  // nodeview_end{
  FootnoteView.prototype.destroy = function destroy () {
    if (this.innerView) { this.close(); }
  };

  FootnoteView.prototype.stopEvent = function stopEvent (event) {
    return this.innerView && this.innerView.dom.contains(event.target)
  };

  FootnoteView.prototype.ignoreMutation = function ignoreMutation () { return true };

  window.view = new prosemirrorView.EditorView(document.querySelector("#editor"), {
    state: prosemirrorState.EditorState.create({
      doc: prosemirrorModel.DOMParser.fromSchema(footnoteSchema).parse(document.querySelector("#content")),
      plugins: prosemirrorExampleSetup.exampleSetup({schema: footnoteSchema, menuContent: menu.fullMenu})
    }),
    nodeViews: {
      footnote: function footnote(node, view, getPos) { return new FootnoteView(node, view, getPos) }
    }
  });
  // }

})(PM.schema_basic, PM.model, PM.transform, PM.menu, PM.example_setup, PM.keymap, PM.history, PM.state, PM.view);

