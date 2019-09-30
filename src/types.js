"use strict";
exports.__esModule = true;
// 定义事件类型
var EventType;
(function (EventType) {
    EventType[EventType["DomContentLoaded"] = 0] = "DomContentLoaded";
    EventType[EventType["Load"] = 1] = "Load";
    EventType[EventType["FullSnapshot"] = 2] = "FullSnapshot";
    // 全量快照
    EventType[EventType["IncrementalSnapshot"] = 3] = "IncrementalSnapshot";
    EventType[EventType["Meta"] = 4] = "Meta";
})(EventType = exports.EventType || (exports.EventType = {}));
// 定义增量资源
var IncrementalSource;
(function (IncrementalSource) {
    IncrementalSource[IncrementalSource["Mutation"] = 0] = "Mutation";
    IncrementalSource[IncrementalSource["MouseMove"] = 1] = "MouseMove";
    IncrementalSource[IncrementalSource["MouseInteraction"] = 2] = "MouseInteraction";
    IncrementalSource[IncrementalSource["Scroll"] = 3] = "Scroll";
    IncrementalSource[IncrementalSource["ViewportResize"] = 4] = "ViewportResize";
    IncrementalSource[IncrementalSource["Input"] = 5] = "Input";
})(IncrementalSource = exports.IncrementalSource || (exports.IncrementalSource = {}));
// 定义鼠标动作
var MouseInteractions;
(function (MouseInteractions) {
    MouseInteractions[MouseInteractions["MouseUp"] = 0] = "MouseUp";
    MouseInteractions[MouseInteractions["MouseDown"] = 1] = "MouseDown";
    MouseInteractions[MouseInteractions["Click"] = 2] = "Click";
    MouseInteractions[MouseInteractions["ContextMenu"] = 3] = "ContextMenu";
    MouseInteractions[MouseInteractions["DblClick"] = 4] = "DblClick";
    MouseInteractions[MouseInteractions["Focus"] = 5] = "Focus";
    MouseInteractions[MouseInteractions["Blur"] = 6] = "Blur";
    MouseInteractions[MouseInteractions["TouchStart"] = 7] = "TouchStart";
    MouseInteractions[MouseInteractions["TouchMove"] = 8] = "TouchMove";
    MouseInteractions[MouseInteractions["TouchEnd"] = 9] = "TouchEnd";
})(MouseInteractions = exports.MouseInteractions || (exports.MouseInteractions = {}));
// 定义回放事件
var ReplayerEvents;
(function (ReplayerEvents) {
    ReplayerEvents["Start"] = "start";
    ReplayerEvents["Pause"] = "pause";
    ReplayerEvents["Resume"] = "resume";
    ReplayerEvents["Resize"] = "resize";
    ReplayerEvents["Finish"] = "finish";
    ReplayerEvents["FullsnapshotRebuilded"] = "fullsnapshot-rebuilded";
    ReplayerEvents["LoadStylesheetStart"] = "load-stylesheet-start";
    ReplayerEvents["LoadStylesheetEnd"] = "load-stylesheet-end";
    ReplayerEvents["SkipStart"] = "skip-start";
    ReplayerEvents["SkipEnd"] = "skip-end";
})(ReplayerEvents = exports.ReplayerEvents || (exports.ReplayerEvents = {}));
