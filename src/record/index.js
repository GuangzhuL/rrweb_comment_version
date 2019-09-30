"use strict";
// 合并对象函数，__assign({}, a, {b:1});
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
exports.__esModule = true;
var rrweb_snapshot_1 = require("rrweb-snapshot");
var observer_1 = require("./observer");
var utils_1 = require("../utils");
var types_1 = require("../types");
// 更新现在的时间
function wrapEvent(e) {
    return __assign({}, e, { timestamp: Date.now() });
}
function record(options) {
    if (options === void 0) { options = {}; }
    var emit = options.emit, checkoutEveryNms = options.checkoutEveryNms, checkoutEveryNth = options.checkoutEveryNth;
    // runtime checks for user options
    if (!emit) {
        throw new Error('emit function is required');
    }
    var lastFullSnapshotEvent;
    var incrementalSnapshotCount = 0;
    var wrappedEmit = function (e, isCheckout) {
        emit(e, isCheckout);
        // 如果是全量快照
        if (e.type === types_1.EventType.FullSnapshot) {
            lastFullSnapshotEvent = e;
            // 全量开始之后，增量快照是0开始计算
            incrementalSnapshotCount = 0;
        }
        // 增量快照
        else if (e.type === types_1.EventType.IncrementalSnapshot) {
            // 增量快照自加
            incrementalSnapshotCount++;
            var exceedCount = checkoutEveryNth && incrementalSnapshotCount >= checkoutEveryNth;
            var exceedTime = checkoutEveryNms &&
                e.timestamp - lastFullSnapshotEvent.timestamp > checkoutEveryNms;
            if (exceedCount || exceedTime) {
                // 执行全量快照
                takeFullSnapshot(true);
            }
        }
    };
    // 执行全量快照
    function takeFullSnapshot(isCheckout) {
        if (isCheckout === void 0) { isCheckout = false; }
        // 记录窗口宽高
        wrappedEmit(wrapEvent({
            type: types_1.EventType.Meta,
            data: {
                href: window.location.href,
                width: utils_1.getWindowWidth(),
                height: utils_1.getWindowHeight()
            }
        }), isCheckout);
        // 建立映射
        var _a = rrweb_snapshot_1.snapshot(document), node = _a[0], idNodeMap = _a[1];
        if (!node) {
            return console.warn('Failed to snapshot the document');
        }
        utils_1.mirror.map = idNodeMap;
        // 记录页面所处位置
        wrappedEmit(wrapEvent({
            type: types_1.EventType.FullSnapshot,
            data: {
                node: node,
                initialOffset: {
                    left: document.documentElement.scrollLeft,
                    top: document.documentElement.scrollTop
                }
            }
        }));
    }
    try {
        // 事件操作数组
        var handlers_1 = [];
        // 监听DOM渲染完毕之后，记录第一件事
        handlers_1.push(utils_1.on('DOMContentLoaded', function () {
            wrappedEmit(wrapEvent({
                type: types_1.EventType.DomContentLoaded,
                data: {}
            }));
        }));
        // DOM渲染完成后，开始初始化
        var init_1 = function () {
            // 进行全量快照
            takeFullSnapshot();
            // 进行增量快照
            handlers_1.push(observer_1["default"]({
                mutationCb: function (m) {
                    return wrappedEmit(wrapEvent({
                        type: types_1.EventType.IncrementalSnapshot,
                        data: __assign({ source: types_1.IncrementalSource.Mutation }, m)
                    }));
                },
                // 鼠标移动时的回调
                mousemoveCb: function (positions) {
                    return wrappedEmit(wrapEvent({
                        type: types_1.EventType.IncrementalSnapshot,
                        data: {
                            source: types_1.IncrementalSource.MouseMove,
                            positions: positions
                        }
                    }));
                },
                // 鼠标交互
                mouseInteractionCb: function (d) {
                    return wrappedEmit(wrapEvent({
                        type: types_1.EventType.IncrementalSnapshot,
                        data: __assign({ source: types_1.IncrementalSource.MouseInteraction }, d)
                    }));
                },
                // 滚动
                scrollCb: function (p) {
                    return wrappedEmit(wrapEvent({
                        type: types_1.EventType.IncrementalSnapshot,
                        data: __assign({ source: types_1.IncrementalSource.Scroll }, p)
                    }));
                },
                // 视窗
                viewportResizeCb: function (d) {
                    return wrappedEmit(wrapEvent({
                        type: types_1.EventType.IncrementalSnapshot,
                        data: __assign({ source: types_1.IncrementalSource.ViewportResize }, d)
                    }));
                },
                // 表单
                inputCb: function (v) {
                    return wrappedEmit(wrapEvent({
                        type: types_1.EventType.IncrementalSnapshot,
                        data: __assign({ source: types_1.IncrementalSource.Input }, v)
                    }));
                }
            }));
        };
        // document处于互动或者完成状态，执行初始化函数
        // loading / 加载: document 仍在加载。
        // interactive / 互动 : 文档已经完成加载，文档已被解析，但是诸如图像，样式表和框架之类的子资源仍在加载。
        // complete / 完成 : 文档和所有子资源已完成加载。状态表示 load 事件即将被触发。
        if (document.readyState === 'interactive' ||
            document.readyState === 'complete') {
            init_1();
        }
        else {
            // 资源加载事件（资源还在加载的时候，不执行初始化监控，等资源加载完毕再执行）
            // 当初始的 HTML 文档被完全加载和解析完成之后，DOMContentLoaded 事件被触发，而无需等待样式表、图像和子框架的完成加载
            //  load 应该仅用于检测一个完全加载的页面
            handlers_1.push(utils_1.on('load', function () {
                wrappedEmit(wrapEvent({
                    type: types_1.EventType.Load,
                    data: {}
                }));
                init_1();
            }, window));
        }
        return function () {
            handlers_1.forEach(function (h) { return h(); });
        };
    }
    catch (error) {
        // TODO: handle internal error
        console.warn(error);
    }
}
exports["default"] = record;
