(function (prosemirrorModel, prosemirrorSchemaBasic, prosemirrorMenu, prosemirrorExampleSetup, prosemirrorState, prosemirrorView) {
  'use strict';

  // nodespec{
  // 支持的恐龙类型
  var dinos = ["brontosaurus", "stegosaurus", "triceratops",
                 "tyrannosaurus", "pterodactyl"];

  var dinoNodeSpec = {
    // 恐龙只有一个属性，那就是它的类型，而且必须是上面的类型之一
    // Brontosaurs 是默认的类型
    attrs: {type: {default: "brontosaurus"}},
    inline: true,
    group: "inline",
    draggable: true,

    // 这些节点以一个带有 `dino-type` 属性的 images 节点进行渲染
    // 在 /img/dino/ 目录下有所有的恐龙图片
    toDOM: function (node) { return ["img", {"dino-type": node.attrs.type,
                            src: "/img/dino/" + node.attrs.type + ".png",
                            title: node.attrs.type,
                            class: "dinosaur"}]; },
    // 当格式化一个 image DOM 的时候，如果它的 type 属性是上面所述的恐龙类型之一，那么它就会被转换成一个 dino 节点
    parseDOM: [{
      tag: "img[dino-type]",
      getAttrs: function (dom) {
        var type = dom.getAttribute("dino-type");
        return dinos.indexOf(type) > -1 ? {type: type} : false
      }
    }]
  };

  var dinoSchema = new prosemirrorModel.Schema({
    nodes: prosemirrorSchemaBasic.schema.spec.nodes.addBefore("image", "dino", dinoNodeSpec),
    marks: prosemirrorSchemaBasic.schema.spec.marks
  });

  var content = document.querySelector("#content");
  var startDoc = prosemirrorModel.DOMParser.fromSchema(dinoSchema).parse(content);
  // }

  // command{
  var dinoType = dinoSchema.nodes.dino;

  function insertDino(type) {
    return function(state, dispatch) {
      var ref = state.selection;
      var $from = ref.$from;
      var index = $from.index();
      if (!$from.parent.canReplaceWith(index, index, dinoType))
        { return false }
      if (dispatch)
        { dispatch(state.tr.replaceSelectionWith(dinoType.create({type: type}))); }
      return true
    }
  }

  // 让 example-setup 去 build 它的基本菜单
  var menu = prosemirrorExampleSetup.buildMenuItems(dinoSchema);
  // 增加一个插入恐龙节点的按钮
  dinos.forEach(function (name) { return menu.insertMenu.content.push(new prosemirrorMenu.MenuItem({
    title: "Insert " + name,
    label: name.charAt(0).toUpperCase() + name.slice(1),
    enable: function enable(state) { return insertDino(name)(state) },
    run: insertDino(name)
  })); });

  window.view = new prosemirrorView.EditorView(document.querySelector("#editor"), {
    state: prosemirrorState.EditorState.create({
      doc: startDoc,
      // 传给 exampleSetup 和 我们创建的 menu
      plugins: prosemirrorExampleSetup.exampleSetup({schema: dinoSchema, menuContent: menu.fullMenu})
    })
  });
  // }

}(PM.model, PM.schema_basic, PM.menu, PM.example_setup, PM.state, PM.view));

