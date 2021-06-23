(function (prosemirrorState, prosemirrorView, prosemirrorModel, prosemirrorSchemaBasic, prosemirrorExampleSetup) {
  'use strict';

  // placeholderPlugin{

  var placeholderPlugin = new prosemirrorState.Plugin({
    state: {
      init: function init() { return prosemirrorView.DecorationSet.empty },
      apply: function apply(tr, set) {
        // 调整因为 decoration 的位置，以适应 transaction 引起的文档的改变
        set = set.map(tr.mapping, tr.doc);
        // 查看 transaction 是否增加或者删除任何占位符了
        var action = tr.getMeta(this);
        if (action && action.add) {
          var widget = document.createElement("placeholder");
          var deco = prosemirrorView.Decoration.widget(action.add.pos, widget, {id: action.add.id});
          set = set.add(tr.doc, [deco]);
        } else if (action && action.remove) {
          set = set.remove(set.find(null, null,
                                    function (spec) { return spec.id == action.remove.id; }));
        }
        return set
      }
    },
    props: {
      decorations: function decorations(state) { return this.getState(state) }
    }
  });
  // }

  // findPlaceholder{
  function findPlaceholder(state, id) {
    var decos = placeholderPlugin.getState(state);
    var found = decos.find(null, null, function (spec) { return spec.id == id; });
    return found.length ? found[0].from : null
  }
  // }


  // event{
  document.querySelector("#image-upload").addEventListener("change", function (e) {
    if (view.state.selection.$from.parent.inlineContent && e.target.files.length)
      { startImageUpload(view, e.target.files[0]); }
    view.focus();
  });
  // }

  // startImageUpload{
  function startImageUpload(view, file) {
    // 为 upload 构建一个空的对象来存放占位符们的 ID
    var id = {};

    // 用占位符替换选区
    var tr = view.state.tr;
    if (!tr.selection.empty) { tr.deleteSelection(); }
    tr.setMeta(placeholderPlugin, {add: {id: id, pos: tr.selection.from}});
    view.dispatch(tr);

    uploadFile(file).then(function (url) {
      var pos = findPlaceholder(view.state, id);
      // 如果占位符周围的内容都被删除了，那就删除这个占位符所代表的图片
      if (pos == null) { return }
      // 否则的话，将图片插入占位符所在的位置，然后移除占位符
      view.dispatch(view.state.tr
                    .replaceWith(pos, pos, prosemirrorSchemaBasic.schema.nodes.image.create({src: url}))
                    .setMeta(placeholderPlugin, {remove: {id: id}}));
    }, function () {
      // 如果上传失败，简单移除占位符就好
      view.dispatch(tr.setMeta(placeholderPlugin, {remove: {id: id}}));
    });
  }
  // }

  // 下面这个函数只是假装上传了一个文件然后新建了一个 data URL，
  // 你可以用一个能够真实上传然后获取真实文件 URL 的函数来替换该函数。
  function uploadFile(file) {
    var reader = new FileReader;
    return new Promise(function (accept, fail) {
      reader.onload = function () { return accept(reader.result); };
      reader.onerror = function () { return fail(reader.error); };
      // Some extra delay to make the asynchronicity visible
      setTimeout(function () { return reader.readAsDataURL(file); }, 1500);
    })
  }

  var view = window.view = new prosemirrorView.EditorView(document.querySelector("#editor"), {
    state: prosemirrorState.EditorState.create({
      doc: prosemirrorModel.DOMParser.fromSchema(prosemirrorSchemaBasic.schema).parse(document.querySelector("#content")),
      plugins: prosemirrorExampleSetup.exampleSetup({schema: prosemirrorSchemaBasic.schema}).concat(placeholderPlugin)
    })
  });

}(PM.state, PM.view, PM.model, PM.schema_basic, PM.example_setup));

