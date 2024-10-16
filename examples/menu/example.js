(function (prosemirrorState, prosemirrorCommands, prosemirrorSchemaBasic, prosemirrorView, prosemirrorKeymap, prosemirrorModel) {
  'use strict';

  // MenuView{
  var MenuView = function MenuView(items, editorView) {
    var this$1$1 = this;

    this.items = items;
    this.editorView = editorView;

    this.dom = document.createElement("div");
    this.dom.className = "menubar";
    items.forEach(function (ref) {
      var dom = ref.dom;

      return this$1$1.dom.appendChild(dom);
    });
    this.update();

    this.dom.addEventListener("mousedown", function (e) {
      e.preventDefault();
      editorView.focus();
      items.forEach(function (ref) {
        var command = ref.command;
        var dom = ref.dom;

        if (dom.contains(e.target))
          { command(editorView.state, editorView.dispatch, editorView); }
      });
    });
  };

  MenuView.prototype.update = function update () {
      var this$1$1 = this;

    this.items.forEach(function (ref) {
        var command = ref.command;
        var dom = ref.dom;

      var active = command(this$1$1.editorView.state, null, this$1$1.editorView);
      dom.style.display = active ? "" : "none";
    });
  };

  MenuView.prototype.destroy = function destroy () { this.dom.remove(); };

  function menuPlugin(items) {
    return new prosemirrorState.Plugin({
      view: function view(editorView) {
        var menuView = new MenuView(items, editorView);
        editorView.dom.parentNode.insertBefore(menuView.dom, editorView.dom);
        return menuView
      }
    })
  }

  // 创建菜单图标的辅助函数
  function icon(text, name) {
    var span = document.createElement("span");
    span.className = "menuicon " + name;
    span.title = name;
    span.textContent = text;
    return span
  }

  // 创建一个给定级别的标题图标
  function heading(level) {
    return {
      command: prosemirrorCommands.setBlockType(prosemirrorSchemaBasic.schema.nodes.heading, {level: level}),
      dom: icon("H" + level, "heading")
    }
  }

  var menu = menuPlugin([
    {command: prosemirrorCommands.toggleMark(prosemirrorSchemaBasic.schema.marks.strong), dom: icon("B", "strong")},
    {command: prosemirrorCommands.toggleMark(prosemirrorSchemaBasic.schema.marks.em), dom: icon("i", "em")},
    {command: prosemirrorCommands.setBlockType(prosemirrorSchemaBasic.schema.nodes.paragraph), dom: icon("p", "paragraph")},
    heading(1), heading(2), heading(3),
    {command: prosemirrorCommands.wrapIn(prosemirrorSchemaBasic.schema.nodes.blockquote), dom: icon(">", "blockquote")}
  ]);

  window.view = new prosemirrorView.EditorView(document.querySelector("#editor"), {
    state: prosemirrorState.EditorState.create({
      doc: prosemirrorModel.DOMParser.fromSchema(prosemirrorSchemaBasic.schema).parse(document.querySelector("#content")),
      plugins: [prosemirrorKeymap.keymap(prosemirrorCommands.baseKeymap), menu]
    })
  });

})(PM.state, PM.commands, PM.schema_basic, PM.view, PM.keymap, PM.model);

