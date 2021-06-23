(function (prosemirrorState, prosemirrorView, prosemirrorModel, prosemirrorSchemaBasic, prosemirrorExampleSetup) {
  'use strict';

  // plugin{

  var selectionSizePlugin = new prosemirrorState.Plugin({
    view: function view(editorView) { return new SelectionSizeTooltip(editorView) }
  });
  // }

  // tooltip{
  var SelectionSizeTooltip = function SelectionSizeTooltip(view) {
    this.tooltip = document.createElement("div");
    this.tooltip.className = "tooltip";
    view.dom.parentNode.appendChild(this.tooltip);

    this.update(view, null);
  };

  SelectionSizeTooltip.prototype.update = function update (view, lastState) {
    var state = view.state;
    // 如果文档或者选区未发生更改，则什么不做
    if (lastState && lastState.doc.eq(state.doc) &&
        lastState.selection.eq(state.selection)) { return }

    // 如果选区为空（光标状态）则隐藏 tooltip
    if (state.selection.empty) {
      this.tooltip.style.display = "none";
      return
    }

    // 否则，重新设置它的位置并且更新它的内容
    this.tooltip.style.display = "";
    var ref = state.selection;
      var from = ref.from;
      var to = ref.to;
    // 这些是在屏幕上的坐标信息
    var start = view.coordsAtPos(from), end = view.coordsAtPos(to);
    // 将 tooltip 所在的父级节点作为参照系
    var box = this.tooltip.offsetParent.getBoundingClientRect();
    // 寻找 tooltip 的中点，当跨行的时候，端点可能更靠近左侧
    var left = Math.max((start.left + end.left) / 2, start.left + 3);
    this.tooltip.style.left = (left - box.left) + "px";
    this.tooltip.style.bottom = (box.bottom - start.top) + "px";
    this.tooltip.textContent = to - from;
  };

  SelectionSizeTooltip.prototype.destroy = function destroy () { this.tooltip.remove(); };

  window.view = new prosemirrorView.EditorView(document.querySelector("#editor"), {
    state: prosemirrorState.EditorState.create({
      doc: prosemirrorModel.DOMParser.fromSchema(prosemirrorSchemaBasic.schema).parse(document.querySelector("#content")),
      plugins: prosemirrorExampleSetup.exampleSetup({schema: prosemirrorSchemaBasic.schema}).concat(selectionSizePlugin)
    })
  });

}(PM.state, PM.view, PM.model, PM.schema_basic, PM.example_setup));

