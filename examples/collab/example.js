(function (prosemirrorExampleSetup, prosemirrorTransform, prosemirrorState, prosemirrorView, prosemirrorHistory, prosemirrorMenu, require$$0, require$$1, require$$2) {
  'use strict';

  function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

  var require$$0__default = /*#__PURE__*/_interopDefaultLegacy(require$$0);
  var require$$1__default = /*#__PURE__*/_interopDefaultLegacy(require$$1);
  var require$$2__default = /*#__PURE__*/_interopDefaultLegacy(require$$2);

  var Rebaseable = function Rebaseable(step, inverted, origin) {
    this.step = step;
    this.inverted = inverted;
    this.origin = origin;
  };

  // : ([Rebaseable], [Step], Transform) → [Rebaseable]
  // Undo a given set of steps, apply a set of other steps, and then
  // redo them.
  function rebaseSteps(steps, over, transform) {
    for (var i = steps.length - 1; i >= 0; i--) { transform.step(steps[i].inverted); }
    for (var i$1 = 0; i$1 < over.length; i$1++) { transform.step(over[i$1]); }
    var result = [];
    for (var i$2 = 0, mapFrom = steps.length; i$2 < steps.length; i$2++) {
      var mapped = steps[i$2].step.map(transform.mapping.slice(mapFrom));
      mapFrom--;
      if (mapped && !transform.maybeStep(mapped).failed) {
        transform.mapping.setMirror(mapFrom, transform.steps.length - 1);
        result.push(new Rebaseable(mapped, mapped.invert(transform.docs[transform.docs.length - 1]), steps[i$2].origin));
      }
    }
    return result
  }

  // This state field accumulates changes that have to be sent to the
  // central authority in the collaborating group and makes it possible
  // to integrate changes made by peers into our local document. It is
  // defined by the plugin, and will be available as the `collab` field
  // in the resulting editor state.
  var CollabState = function CollabState(version, unconfirmed) {
    // : number
    // The version number of the last update received from the central
    // authority. Starts at 0 or the value of the `version` property
    // in the option object, for the editor's value when the option
    // was enabled.
    this.version = version;

    // : [Rebaseable]
    // The local steps that havent been successfully sent to the
    // server yet.
    this.unconfirmed = unconfirmed;
  };

  function unconfirmedFrom(transform) {
    var result = [];
    for (var i = 0; i < transform.steps.length; i++)
      { result.push(new Rebaseable(transform.steps[i],
                                 transform.steps[i].invert(transform.docs[i]),
                                 transform)); }
    return result
  }

  var collabKey = new prosemirrorState.PluginKey("collab");

  // :: (?Object) → Plugin
  //
  // Creates a plugin that enables the collaborative editing framework
  // for the editor.
  //
  // @cn 创建一个能使编辑器支持协同编辑框架的插件。
  //
  //   config::- An optional set of options
  //
  //   @cn 可选参数对象。
  //
  //     version:: ?number
  //     The starting version number of the collaborative editing.
  //     Defaults to 0.
  //
  //     @cn 协同编辑的起始版本号，默认是 0.
  //
  //     clientID:: ?union<number, string>
  //     This client's ID, used to distinguish its changes from those of
  //     other clients. Defaults to a random 32-bit number.
  //
  //     @cn 客户端 ID，用来分别哪些修改是自己做的哪些是其他客户端做的。默认是一个随机的 32 位数字。
  function collab(config) {
    if ( config === void 0 ) { config = {}; }

    config = {version: config.version || 0,
              clientID: config.clientID == null ? Math.floor(Math.random() * 0xFFFFFFFF) : config.clientID};

    return new prosemirrorState.Plugin({
      key: collabKey,

      state: {
        init: function () { return new CollabState(config.version, []); },
        apply: function apply(tr, collab) {
          var newState = tr.getMeta(collabKey);
          if (newState)
            { return newState }
          if (tr.docChanged)
            { return new CollabState(collab.version, collab.unconfirmed.concat(unconfirmedFrom(tr))) }
          return collab
        }
      },

      config: config,
      // This is used to notify the history plugin to not merge steps,
      // so that the history can be rebased.
      historyPreserveItems: true
    })
  }

  // :: (state: EditorState, steps: [Step], clientIDs: [union<number, string>], options: ?Object) → Transaction
  // Create a transaction that represents a set of new steps received from
  // the authority. Applying this transaction moves the state forward to
  // adjust to the authority's view of the document.
  //
  // @cn 创建一个接受自鉴权中心的表示新 steps 集合的 transaction。应用该 transaction 以将 state 向前移动来适应文档的鉴权中心的视图。
  //
  // @comment 「鉴权中心」指的就是协同处理的服务端，那里负责处理接受那些 tr，拒绝哪些 tr。
  //
  //   options::- Additional options.
  //
  //   @cn 可选的配置参数。
  //
  //     mapSelectionBackward:: ?boolean
  //     When enabled (the default is `false`), if the current selection
  //     is a [text selection](#state.TextSelection), its sides are
  //     mapped with a negative bias for this transaction, so that
  //     content inserted at the cursor ends up after the cursor. Users
  //     usually prefer this, but it isn't done by default for reasons
  //     of backwards compatibility.
  //
  //     @cn 启用后（默认是 `false`），如果当前选区是一个 [文本选区](#state.TextSelection)，则它的两侧位置会被这个
  //     transaction 通过一个负向偏移 mapped，以便使插入光标处的内容会以光标所在的位置结尾。用户通常倾向于这样做，不过因为向后兼容的
  //     原因，默认情况下不会这么做。
  function receiveTransaction(state, steps, clientIDs, options) {
    // Pushes a set of steps (received from the central authority) into
    // the editor state (which should have the collab plugin enabled).
    // Will recognize its own changes, and confirm unconfirmed steps as
    // appropriate. Remaining unconfirmed steps will be rebased over
    // remote steps.
    var collabState = collabKey.getState(state);
    var version = collabState.version + steps.length;
    var ourID = collabKey.get(state).spec.config.clientID;

    // Find out which prefix of the steps originated with us
    var ours = 0;
    while (ours < clientIDs.length && clientIDs[ours] == ourID) { ++ours; }
    var unconfirmed = collabState.unconfirmed.slice(ours);
    steps = ours ? steps.slice(ours) : steps;

    // If all steps originated with us, we're done.
    if (!steps.length)
      { return state.tr.setMeta(collabKey, new CollabState(version, unconfirmed)) }

    var nUnconfirmed = unconfirmed.length;
    var tr = state.tr;
    if (nUnconfirmed) {
      unconfirmed = rebaseSteps(unconfirmed, steps, tr);
    } else {
      for (var i = 0; i < steps.length; i++) { tr.step(steps[i]); }
      unconfirmed = [];
    }

    var newCollabState = new CollabState(version, unconfirmed);
    if (options && options.mapSelectionBackward && state.selection instanceof prosemirrorState.TextSelection) {
      tr.setSelection(prosemirrorState.TextSelection.between(tr.doc.resolve(tr.mapping.map(state.selection.anchor, -1)),
                                            tr.doc.resolve(tr.mapping.map(state.selection.head, -1)), -1));
      tr.updated &= ~1;
    }
    return tr.setMeta("rebased", nUnconfirmed).setMeta("addToHistory", false).setMeta(collabKey, newCollabState)
  }

  // :: (state: EditorState) → ?{version: number, steps: [Step], clientID: union<number, string>, origins: [Transaction]}
  // Provides data describing the editor's unconfirmed steps, which need
  // to be sent to the central authority. Returns null when there is
  // nothing to send.
  //
  // @cn 提供编辑器未被确认的 steps 的数据描述，它会被发送给鉴权中心。如果没有需要发送的东西，返回 null。
  //
  // `origins` holds the _original_ transactions that produced each
  // steps. This can be useful for looking up time stamps and other
  // metadata for the steps, but note that the steps may have been
  // rebased, whereas the origin transactions are still the old,
  // unchanged objects.
  //
  // @cn `origins` 值是产生每个 steps 的 _原始_ transactions。对于寻找 steps 的时间戳和其他 metadata 信息很有用，不过记住，steps 可能会被 rebased，
  // 因此原始的 transaction 仍然是旧的，未改变的对象。
  function sendableSteps(state) {
    var collabState = collabKey.getState(state);
    if (collabState.unconfirmed.length == 0) { return null }
    return {
      version: collabState.version,
      steps: collabState.unconfirmed.map(function (s) { return s.step; }),
      clientID: collabKey.get(state).spec.config.clientID,
      get origins() { return this._origins || (this._origins = collabState.unconfirmed.map(function (s) { return s.origin; })) }
    }
  }

  // :: (EditorState) → number
  // Get the version up to which the collab plugin has synced with the
  // central authority.
  //
  // @cn 获取 collab 插件与鉴权中心同步的版本。
  function getVersion(state) {
    return collabKey.getState(state).version
  }

  function crelt() {
    var arguments$1 = arguments;

    var elt = arguments[0];
    if (typeof elt == "string") { elt = document.createElement(elt); }
    var i = 1, next = arguments[1];
    if (next && typeof next == "object" && next.nodeType == null && !Array.isArray(next)) {
      for (var name in next) { if (Object.prototype.hasOwnProperty.call(next, name)) {
        var value = next[name];
        if (typeof value == "string") { elt.setAttribute(name, value); }
        else if (value != null) { elt[name] = value; }
      } }
      i++;
    }
    for (; i < arguments.length; i++) { add(elt, arguments$1[i]); }
    return elt
  }

  function add(elt, child) {
    if (typeof child == "string") {
      elt.appendChild(document.createTextNode(child));
    } else if (child == null) ; else if (child.nodeType != null) {
      elt.appendChild(child);
    } else if (Array.isArray(child)) {
      for (var i = 0; i < child.length; i++) { add(elt, child[i]); }
    } else {
      throw new RangeError("Unsupported child node: " + child)
    }
  }

  var Schema = require$$0__default["default"].Schema;
  var base = require$$1__default["default"].schema;
  var addListNodes = require$$2__default["default"].addListNodes;

  var schema_1 = new Schema({
    nodes: addListNodes(base.spec.nodes, "paragraph block*", "block"),
    marks: base.spec.marks
  });

  // A simple wrapper for XHR.
  function req(conf) {
    var req = new XMLHttpRequest(), aborted = false;
    var result = new Promise(function (success, failure) {
      req.open(conf.method, conf.url, true);
      req.addEventListener("load", function () {
        if (aborted) { return }
        if (req.status < 400) {
          success(req.responseText);
        } else {
          var text = req.responseText;
          if (text && /html/.test(req.getResponseHeader("content-type"))) { text = makePlain(text); }
          var err = new Error("Request failed: " + req.statusText + (text ? "\n\n" + text : ""));
          err.status = req.status;
          failure(err);
        }
      });
      req.addEventListener("error", function () { if (!aborted) { failure(new Error("Network error")); } });
      if (conf.headers) { for (var header in conf.headers) { req.setRequestHeader(header, conf.headers[header]); } }
      req.send(conf.body || null);
    });
    result.abort = function () {
      if (!aborted) {
        req.abort();
        aborted = true;
      }
    };
    return result
  }

  function makePlain(html) {
    var elt = document.createElement("div");
    elt.innerHTML = html;
    return elt.textContent.replace(/\n[^]*|\s+$/g, "")
  }

  function GET(url) {
    return req({url: url, method: "GET"})
  }

  function POST(url, body, type) {
    return req({url: url, method: "POST", body: body, headers: {"Content-Type": type}})
  }

  var Reporter = function Reporter() {
    this.state = this.node = null;
    this.setAt = 0;
  };

  Reporter.prototype.clearState = function clearState () {
    if (this.state) {
      document.body.removeChild(this.node);
      this.state = this.node = null;
      this.setAt = 0;
    }
  };

  Reporter.prototype.failure = function failure (err) {
    this.show("fail", err.toString());
  };

  Reporter.prototype.delay = function delay (err) {
    if (this.state == "fail") { return }
    this.show("delay", err.toString());
  };

  Reporter.prototype.show = function show (type, message) {
    this.clearState();
    this.state = type;
    this.setAt = Date.now();
    this.node = document.body.appendChild(document.createElement("div"));
    this.node.className = "ProseMirror-report ProseMirror-report-" + type;
    this.node.textContent = message;
  };

  Reporter.prototype.success = function success () {
      var this$1$1 = this;

    if (this.state == "fail" && this.setAt > Date.now() - 1000 * 10)
      { setTimeout(function () { return this$1$1.success(); }, 5000); }
    else
      { this.clearState(); }
  };

  var Comment = function Comment(text, id) {
    this.id = id;
    this.text = text;
  };

  function deco(from, to, comment) {
    return prosemirrorView.Decoration.inline(from, to, {class: "comment"}, {comment: comment})
  }

  var CommentState = function CommentState(version, decos, unsent) {
    this.version = version;
    this.decos = decos;
    this.unsent = unsent;
  };

  CommentState.prototype.findComment = function findComment (id) {
    var current = this.decos.find();
    for (var i = 0; i < current.length; i++)
      { if (current[i].spec.comment.id == id) { return current[i] } }
  };

  CommentState.prototype.commentsAt = function commentsAt (pos) {
    return this.decos.find(pos, pos)
  };

  CommentState.prototype.apply = function apply (tr) {
    var action = tr.getMeta(commentPlugin), actionType = action && action.type;
    if (!action && !tr.docChanged) { return this }
    var base = this;
    if (actionType == "receive") { base = base.receive(action, tr.doc); }
    var decos = base.decos, unsent = base.unsent;
    decos = decos.map(tr.mapping, tr.doc);
    if (actionType == "newComment") {
      decos = decos.add(tr.doc, [deco(action.from, action.to, action.comment)]);
      unsent = unsent.concat(action);
    } else if (actionType == "deleteComment") {
      decos = decos.remove([this.findComment(action.comment.id)]);
      unsent = unsent.concat(action);
    }
    return new CommentState(base.version, decos, unsent)
  };

  CommentState.prototype.receive = function receive (ref, doc) {
      var version = ref.version;
      var events = ref.events;
      var sent = ref.sent;

    var set = this.decos;
    for (var i = 0; i < events.length; i++) {
      var event = events[i];
      if (event.type == "delete") {
        var found = this.findComment(event.id);
        if (found) { set = set.remove([found]); }
      } else { // "create"
        if (!this.findComment(event.id))
          { set = set.add(doc, [deco(event.from, event.to, new Comment(event.text, event.id))]); }
      }
    }
    return new CommentState(version, set, this.unsent.slice(sent))
  };

  CommentState.prototype.unsentEvents = function unsentEvents () {
    var result = [];
    for (var i = 0; i < this.unsent.length; i++) {
      var action = this.unsent[i];
      if (action.type == "newComment") {
        var found = this.findComment(action.comment.id);
        if (found) { result.push({type: "create", id: action.comment.id,
                                from: found.from, to: found.to,
                                text: action.comment.text}); }
      } else {
        result.push({type: "delete", id: action.comment.id});
      }
    }
    return result
  };

  CommentState.init = function init (config) {
    var decos = config.comments.comments.map(function (c) { return deco(c.from, c.to, new Comment(c.text, c.id)); });
    return new CommentState(config.comments.version, prosemirrorView.DecorationSet.create(config.doc, decos), [])
  };

  var commentPlugin = new prosemirrorState.Plugin({
    state: {
      init: CommentState.init,
      apply: function apply(tr, prev) { return prev.apply(tr) }
    },
    props: {
      decorations: function decorations(state) { return this.getState(state).decos }
    }
  });

  function randomID() {
    return Math.floor(Math.random() * 0xffffffff)
  }

  // Command for adding an annotation

  var addAnnotation = function(state, dispatch) {
    var sel = state.selection;
    if (sel.empty) { return false }
    if (dispatch) {
      var text = prompt("Annotation text", "");
      if (text)
        { dispatch(state.tr.setMeta(commentPlugin, {type: "newComment", from: sel.from, to: sel.to, comment: new Comment(text, randomID())})); }
    }
    return true
  };

  var annotationIcon = {
    width: 1024, height: 1024,
    path: "M512 219q-116 0-218 39t-161 107-59 145q0 64 40 122t115 100l49 28-15 54q-13 52-40 98 86-36 157-97l24-21 32 3q39 4 74 4 116 0 218-39t161-107 59-145-59-145-161-107-218-39zM1024 512q0 99-68 183t-186 133-257 48q-40 0-82-4-113 100-262 138-28 8-65 12h-2q-8 0-15-6t-9-15v-0q-1-2-0-6t1-5 2-5l3-5t4-4 4-5q4-4 17-19t19-21 17-22 18-29 15-33 14-43q-89-50-141-125t-51-160q0-99 68-183t186-133 257-48 257 48 186 133 68 183z"
  };

  // Comment UI

  var commentUI = function(dispatch) {
    return new prosemirrorState.Plugin({
      props: {
        decorations: function decorations(state) {
          return commentTooltip(state, dispatch)
        }
      }
    })
  };

  function commentTooltip(state, dispatch) {
    var sel = state.selection;
    if (!sel.empty) { return null }
    var comments = commentPlugin.getState(state).commentsAt(sel.from);
    if (!comments.length) { return null }
    return prosemirrorView.DecorationSet.create(state.doc, [prosemirrorView.Decoration.widget(sel.from, renderComments(comments, dispatch, state))])
  }

  function renderComments(comments, dispatch, state) {
    return crelt("div", {class: "tooltip-wrapper"},
                crelt("ul", {class: "commentList"},
                     comments.map(function (c) { return renderComment(c.spec.comment, dispatch, state); })))
  }

  function renderComment(comment, dispatch, state) {
    var btn = crelt("button", {class: "commentDelete", title: "Delete annotation"}, "×");
    btn.addEventListener("click", function () { return dispatch(state.tr.setMeta(commentPlugin, {type: "deleteComment", comment: comment})); }
    );
    return crelt("li", {class: "commentText"}, comment.text, btn)
  }

  var report = new Reporter();

  function badVersion(err) {
    return err.status == 400 && /invalid version/i.test(err)
  }

  var State = function State(edit, comm) {
    this.edit = edit;
    this.comm = comm;
  };

  var EditorConnection = function EditorConnection(report, url) {
    this.report = report;
    this.url = url;
    this.state = new State(null, "start");
    this.request = null;
    this.backOff = 0;
    this.view = null;
    this.dispatch = this.dispatch.bind(this);
    this.start();
  };

  // All state changes go through this
  EditorConnection.prototype.dispatch = function dispatch (action) {
      var this$1$1 = this;

    var newEditState = null;
    if (action.type == "loaded") {
      info.users.textContent = userString(action.users); // FIXME ewww
      var editState = prosemirrorState.EditorState.create({
        doc: action.doc,
        plugins: prosemirrorExampleSetup.exampleSetup({schema: schema_1, history: false, menuContent: menu.fullMenu}).concat([
          prosemirrorHistory.history({preserveItems: true}),
          collab({version: action.version}),
          commentPlugin,
          commentUI(function (transaction) { return this$1$1.dispatch({type: "transaction", transaction: transaction}); })
        ]),
        comments: action.comments
      });
      this.state = new State(editState, "poll");
      this.poll();
    } else if (action.type == "restart") {
      this.state = new State(null, "start");
      this.start();
    } else if (action.type == "poll") {
      this.state = new State(this.state.edit, "poll");
      this.poll();
    } else if (action.type == "recover") {
      if (action.error.status && action.error.status < 500) {
        this.report.failure(action.error);
        this.state = new State(null, null);
      } else {
        this.state = new State(this.state.edit, "recover");
        this.recover(action.error);
      }
    } else if (action.type == "transaction") {
      newEditState = this.state.edit.apply(action.transaction);
    }

    if (newEditState) {
      var sendable;
      if (newEditState.doc.content.size > 40000) {
        if (this.state.comm != "detached") { this.report.failure("Document too big. Detached."); }
        this.state = new State(newEditState, "detached");
      } else if ((this.state.comm == "poll" || action.requestDone) && (sendable = this.sendable(newEditState))) {
        this.closeRequest();
        this.state = new State(newEditState, "send");
        this.send(newEditState, sendable);
      } else if (action.requestDone) {
        this.state = new State(newEditState, "poll");
        this.poll();
      } else {
        this.state = new State(newEditState, this.state.comm);
      }
    }

    // Sync the editor with this.state.edit
    if (this.state.edit) {
      if (this.view)
        { this.view.updateState(this.state.edit); }
      else
        { this.setView(new prosemirrorView.EditorView(document.querySelector("#editor"), {
          state: this.state.edit,
          dispatchTransaction: function (transaction) { return this$1$1.dispatch({type: "transaction", transaction: transaction}); }
        })); }
    } else { this.setView(null); }
  };

  // Load the document from the server and start up
  EditorConnection.prototype.start = function start () {
      var this$1$1 = this;

    this.run(GET(this.url)).then(function (data) {
      data = JSON.parse(data);
      this$1$1.report.success();
      this$1$1.backOff = 0;
      this$1$1.dispatch({type: "loaded",
                     doc: schema_1.nodeFromJSON(data.doc),
                     version: data.version,
                     users: data.users,
                     comments: {version: data.commentVersion, comments: data.comments}});
    }, function (err) {
      this$1$1.report.failure(err);
    });
  };

  // Send a request for events that have happened since the version
  // of the document that the client knows about. This request waits
  // for a new version of the document to be created if the client
  // is already up-to-date.
  EditorConnection.prototype.poll = function poll () {
      var this$1$1 = this;

    var query = "version=" + getVersion(this.state.edit) + "&commentVersion=" + commentPlugin.getState(this.state.edit).version;
    this.run(GET(this.url + "/events?" + query)).then(function (data) {
      this$1$1.report.success();
      data = JSON.parse(data);
      this$1$1.backOff = 0;
      if (data.steps && (data.steps.length || data.comment.length)) {
        var tr = receiveTransaction(this$1$1.state.edit, data.steps.map(function (j) { return prosemirrorTransform.Step.fromJSON(schema_1, j); }), data.clientIDs);
        tr.setMeta(commentPlugin, {type: "receive", version: data.commentVersion, events: data.comment, sent: 0});
        this$1$1.dispatch({type: "transaction", transaction: tr, requestDone: true});
      } else {
        this$1$1.poll();
      }
      info.users.textContent = userString(data.users);
    }, function (err) {
      if (err.status == 410 || badVersion(err)) {
        // Too far behind. Revert to server state
        this$1$1.report.failure(err);
        this$1$1.dispatch({type: "restart"});
      } else if (err) {
        this$1$1.dispatch({type: "recover", error: err});
      }
    });
  };

  EditorConnection.prototype.sendable = function sendable (editState) {
    var steps = sendableSteps(editState);
    var comments = commentPlugin.getState(editState).unsentEvents();
    if (steps || comments.length) { return {steps: steps, comments: comments} }
  };

  // Send the given steps to the server
  EditorConnection.prototype.send = function send (editState, ref) {
      var this$1$1 = this;
      var steps = ref.steps;
      var comments = ref.comments;

    var json = JSON.stringify({version: getVersion(editState),
                               steps: steps ? steps.steps.map(function (s) { return s.toJSON(); }) : [],
                               clientID: steps ? steps.clientID : 0,
                               comment: comments || []});
    this.run(POST(this.url + "/events", json, "application/json")).then(function (data) {
      this$1$1.report.success();
      this$1$1.backOff = 0;
      var tr = steps
          ? receiveTransaction(this$1$1.state.edit, steps.steps, repeat(steps.clientID, steps.steps.length))
          : this$1$1.state.edit.tr;
      tr.setMeta(commentPlugin, {type: "receive", version: JSON.parse(data).commentVersion, events: [], sent: comments.length});
      this$1$1.dispatch({type: "transaction", transaction: tr, requestDone: true});
    }, function (err) {
      if (err.status == 409) {
        // The client's document conflicts with the server's version.
        // Poll for changes and then try again.
        this$1$1.backOff = 0;
        this$1$1.dispatch({type: "poll"});
      } else if (badVersion(err)) {
        this$1$1.report.failure(err);
        this$1$1.dispatch({type: "restart"});
      } else {
        this$1$1.dispatch({type: "recover", error: err});
      }
    });
  };

  // Try to recover from an error
  EditorConnection.prototype.recover = function recover (err) {
      var this$1$1 = this;

    var newBackOff = this.backOff ? Math.min(this.backOff * 2, 6e4) : 200;
    if (newBackOff > 1000 && this.backOff < 1000) { this.report.delay(err); }
    this.backOff = newBackOff;
    setTimeout(function () {
      if (this$1$1.state.comm == "recover") { this$1$1.dispatch({type: "poll"}); }
    }, this.backOff);
  };

  EditorConnection.prototype.closeRequest = function closeRequest () {
    if (this.request) {
      this.request.abort();
      this.request = null;
    }
  };

  EditorConnection.prototype.run = function run (request) {
    return this.request = request
  };

  EditorConnection.prototype.close = function close () {
    this.closeRequest();
    this.setView(null);
  };

  EditorConnection.prototype.setView = function setView (view) {
    if (this.view) { this.view.destroy(); }
    this.view = window.view = view;
  };

  function repeat(val, n) {
    var result = [];
    for (var i = 0; i < n; i++) { result.push(val); }
    return result
  }

  var annotationMenuItem = new prosemirrorMenu.MenuItem({
    title: "Add an annotation",
    run: addAnnotation,
    select: function (state) { return addAnnotation(state); },
    icon: annotationIcon
  });
  var menu = prosemirrorExampleSetup.buildMenuItems(schema_1);
  menu.fullMenu[0].push(annotationMenuItem);

  var info = {
    name: document.querySelector("#docname"),
    users: document.querySelector("#users")
  };
  document.querySelector("#changedoc").addEventListener("click", function (e) {
    GET("/collab-backend/docs/").then(function (data) { return showDocList(e.target, JSON.parse(data)); },
                                      function (err) { return report.failure(err); });
  });

  function userString(n) {
    return "(" + n + " user" + (n == 1 ? "" : "s") + ")"
  }

  var docList;
  function showDocList(node, list) {
    if (docList) { docList.parentNode.removeChild(docList); }

    var ul = docList = document.body.appendChild(crelt("ul", {class: "doclist"}));
    list.forEach(function (doc) {
      ul.appendChild(crelt("li", {"data-name": doc.id},
                          doc.id + " " + userString(doc.users)));
    });
    ul.appendChild(crelt("li", {"data-new": "true", style: "border-top: 1px solid silver; margin-top: 2px"},
                        "Create a new document"));

    var rect = node.getBoundingClientRect();
    ul.style.top = (rect.bottom + 10 + pageYOffset - ul.offsetHeight) + "px";
    ul.style.left = (rect.left - 5 + pageXOffset) + "px";

    ul.addEventListener("click", function (e) {
      if (e.target.nodeName == "LI") {
        ul.parentNode.removeChild(ul);
        docList = null;
        if (e.target.hasAttribute("data-name"))
          { location.hash = "#edit-" + encodeURIComponent(e.target.getAttribute("data-name")); }
        else
          { newDocument(); }
      }
    });
  }
  document.addEventListener("click", function () {
    if (docList) {
      docList.parentNode.removeChild(docList);
      docList = null;
    }
  });

  function newDocument() {
    var name = prompt("Name the new document", "");
    if (name)
      { location.hash = "#edit-" + encodeURIComponent(name); }
  }

  var connection = null;

  function connectFromHash() {
    var isID = /^#edit-(.+)/.exec(location.hash);
    if (isID) {
      if (connection) { connection.close(); }
      info.name.textContent = decodeURIComponent(isID[1]);
      connection = window.connection = new EditorConnection(report, "https://prosemirror.net/collab-backend/docs/" + isID[1]);
      connection.request.then(function () { return connection.view.focus(); });
      return true
    }
  }

  addEventListener("hashchange", connectFromHash);
  connectFromHash() || (location.hash = "#edit-Example");

})(PM.example_setup, PM.transform, PM.state, PM.view, PM.history, PM.menu, PM.model, PM.schema_basic, PM.schema_list);

