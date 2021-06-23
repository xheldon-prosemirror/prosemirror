(function (prosemirrorState, prosemirrorView, prosemirrorModel, prosemirrorSchemaBasic, prosemirrorSchemaList, prosemirrorExampleSetup) {
  'use strict';

  // code{

  // 将 prosemirror-schema-list 和基本 schema 放在一起形成一个支持 list 的 schema
  var mySchema = new prosemirrorModel.Schema({
    nodes: prosemirrorSchemaList.addListNodes(prosemirrorSchemaBasic.schema.spec.nodes, "paragraph block*", "block"),
    marks: prosemirrorSchemaBasic.schema.spec.marks
  });

  window.view = new prosemirrorView.EditorView(document.querySelector("#editor"), {
    state: prosemirrorState.EditorState.create({
      doc: prosemirrorModel.DOMParser.fromSchema(mySchema).parse(document.querySelector("#content")),
      plugins: prosemirrorExampleSetup.exampleSetup({schema: mySchema})
    })
  });
  // }

}(PM.state, PM.view, PM.model, PM.schema_basic, PM.schema_list, PM.example_setup));

