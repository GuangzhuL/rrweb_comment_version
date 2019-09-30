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
var utils_1 = require("../utils");
var types_1 = require("../types");
var collection_1 = require("./collection");
/**
 * Mutation observer will merge several mutations into an array and pass
 * it to the callback function, this may make tracing added nodes hard.
 * For example, if we append an element el_1 into body, and then append
 * another element el_2 into el_1, these two mutations may be passed to the
 * callback function together when the two operations were done.
 * Generally we need trace child nodes of newly added node, but in this
 * case if we count el_2 as el_1's child node in the first mutation record,
 * then we will count el_2 again in the secoond mutation record which was
 * duplicated.
 * To avoid of duplicate counting added nodes, we will use a Set to store
 * added nodes and its child nodes during iterate mutation records. Then
 * collect added nodes from the Set which will has no duplicate copy. But
 * this also cause newly added node will not be serialized with id ASAP,
 * which means all the id related calculation should be lazy too.
 * @param cb mutationCallBack
 */
// 监控页面DOM变动
function initMutationObserver(cb) {
    // new MutationObserver(callback),callback是一个回调函数，该回调函数接受两个参数，第一个是变动数组，第二个是观察器实例
    var observer = new MutationObserver(function (mutations) {
        // 文本
        var texts = [];
        // 属性
        var attributes = [];
        // 移除节点
        var removes = [];
        // 添加节点
        var adds = [];
        var addsSet = new Set();
        var droppedSet = new Set();
        var genAdds = function (n) {
            if (utils_1.isBlocked(n)) {
                return;
            }
            addsSet.add(n);
            droppedSet["delete"](n);
            n.childNodes.forEach(function (childN) { return genAdds(childN); });
        };
        mutations.forEach(function (mutation) {
            var type = mutation.type, target = mutation.target, oldValue = mutation.oldValue, addedNodes = mutation.addedNodes, removedNodes = mutation.removedNodes, attributeName = mutation.attributeName;
            // 观察器所能观察的 DOM 变动类型
            switch (type) {
                // 节点内容或节点文本的变动
                case 'characterData': {
                    var value = target.textContent;
                    if (!utils_1.isBlocked(target) && value !== oldValue) {
                        texts.push({
                            value: value,
                            node: target
                        });
                    }
                    break;
                }
                // 属性的变动
                case 'attributes': {
                    var value = target.getAttribute(attributeName);
                    if (utils_1.isBlocked(target) || value === oldValue) {
                        return;
                    }
                    var item = attributes.find(function (a) { return a.node === target; });
                    if (!item) {
                        item = {
                            node: target,
                            attributes: {}
                        };
                        attributes.push(item);
                    }
                    // overwrite attribute if the mutations was triggered in same time
                    item.attributes[attributeName] = value;
                    break;
                }
                // 子节点的变动（指新增，删除或者更改）
                case 'childList': {
                    addedNodes.forEach(function (n) { return genAdds(n); });
                    removedNodes.forEach(function (n) {
                        var nodeId = utils_1.mirror.getId(n);
                        var parentId = utils_1.mirror.getId(target);
                        if (utils_1.isBlocked(n)) {
                            return;
                        }
                        // removed node has not been serialized yet, just remove it from the Set
                        if (addsSet.has(n)) {
                            collection_1.deepDelete(addsSet, n);
                            droppedSet.add(n);
                        }
                        else if (addsSet.has(target) && nodeId === -1) {
                            /**
                             * If target was newly added and removed child node was
                             * not serialized, it means the child node has been removed
                             * before callback fired, so we can ignore it.
                             * TODO: verify this
                             */
                        }
                        else if (utils_1.isAncestorRemoved(target)) {
                            /**
                             * If parent id was not in the mirror map any more, it
                             * means the parent node has already been removed. So
                             * the node is also removed which we do not need to track
                             * and replay.
                             */
                        }
                        else {
                            removes.push({
                                parentId: parentId,
                                id: nodeId
                            });
                        }
                        utils_1.mirror.removeNodeFromMap(n);
                    });
                    break;
                }
                default:
                    break;
            }
        });
        Array.from(addsSet).forEach(function (n) {
            if (!collection_1.isParentDropped(droppedSet, n) && !collection_1.isParentRemoved(removes, n)) {
                adds.push({
                    parentId: utils_1.mirror.getId(n.parentNode),
                    previousId: !n.previousSibling
                        ? n.previousSibling
                        : utils_1.mirror.getId(n.previousSibling),
                    nextId: !n.nextSibling
                        ? n.nextSibling
                        : utils_1.mirror.getId(n.nextSibling),
                    node: rrweb_snapshot_1.serializeNodeWithId(n, document, utils_1.mirror.map, true)
                });
            }
            else {
                droppedSet.add(n);
            }
        });
        var payload = {
            texts: texts
                .map(function (text) { return ({
                id: utils_1.mirror.getId(text.node),
                value: text.value
            }); })
                // text mutation's id was not in the mirror map means the target node has been removed
                .filter(function (text) { return utils_1.mirror.has(text.id); }),
            attributes: attributes
                .map(function (attribute) { return ({
                id: utils_1.mirror.getId(attribute.node),
                attributes: attribute.attributes
            }); })
                // attribute mutation's id was not in the mirror map means the target node has been removed
                .filter(function (attribute) { return utils_1.mirror.has(attribute.id); }),
            removes: removes,
            adds: adds
        };
        // payload may be empty if the mutations happened in some blocked elements
        if (!payload.texts.length &&
            !payload.attributes.length &&
            !payload.removes.length &&
            !payload.adds.length) {
            return;
        }
        cb(payload);
    });
    observer.observe(document, {
        attributes: true,
        attributeOldValue: true,
        characterData: true,
        characterDataOldValue: true,
        childList: true,
        subtree: true
    });
    return observer;
}
// 监控鼠标变动
function initMousemoveObserver(cb) {
    // 存放鼠标位置
    var positions = [];
    var timeBaseline;
    var wrappedCb = utils_1.throttle(function () {
        var totalOffset = Date.now() - timeBaseline;
        // 返回一个新数组，每个元素的值都被处理过
        cb(positions.map(function (p) {
            p.timeOffset -= totalOffset;
            return p;
        }));
        positions = [];
        timeBaseline = null;
    }, 500);
    var updatePosition = utils_1.throttle(function (evt) {
        var clientX = evt.clientX, clientY = evt.clientY, target = evt.target;
        if (!timeBaseline) {
            timeBaseline = Date.now();
        }
        // 保存下来的信息
        positions.push({
            x: clientX,
            y: clientY,
            id: utils_1.mirror.getId(target),
            timeOffset: Date.now() - timeBaseline
        });
        wrappedCb();
    }, 50, {
        trailing: false
    });
    return utils_1.on('mousemove', updatePosition);
}
// 监控鼠标交互
function initMouseInteractionObserver(cb) {
    // 操作数组
    var handlers = [];
    var getHandler = function (eventKey) {
        return function (event) {
            // 隐私区域
            if (utils_1.isBlocked(event.target)) {
                return;
            }
            var id = utils_1.mirror.getId(event.target);
            var clientX = event.clientX, clientY = event.clientY;
            // 需要给出的数据
            cb({
                type: types_1.MouseInteractions[eventKey],
                id: id,
                x: clientX,
                y: clientY
            });
        };
    };
    Object.keys(types_1.MouseInteractions)
        .filter(function (key) { return Number.isNaN(Number(key)); })
        .forEach(function (eventKey) {
        var eventName = eventKey.toLowerCase();
        var handler = getHandler(eventKey);
        handlers.push(utils_1.on(eventName, handler));
    });
    return function () {
        handlers.forEach(function (h) { return h(); });
    };
}
// 监控页面滚动
function initScrollObserver(cb) {
    var updatePosition = utils_1.throttle(function (evt) {
        if (!evt.target || utils_1.isBlocked(evt.target)) {
            return;
        }
        var id = utils_1.mirror.getId(evt.target);
        if (evt.target === document) {
            var scrollEl = (document.scrollingElement || document.documentElement);
            cb({
                id: id,
                x: scrollEl.scrollLeft,
                y: scrollEl.scrollTop
            });
        }
        else {
            cb({
                id: id,
                x: evt.target.scrollLeft,
                y: evt.target.scrollTop
            });
        }
    }, 100);
    return utils_1.on('scroll', updatePosition);
}
// 视窗调整
function initViewportResizeObserver(cb) {
    var updateDimension = utils_1.throttle(function () {
        var height = utils_1.getWindowHeight();
        var width = utils_1.getWindowWidth();
        cb({
            width: Number(width),
            height: Number(height)
        });
    }, 200);
    return utils_1.on('resize', updateDimension, window);
}
var INPUT_TAGS = ['INPUT', 'TEXTAREA', 'SELECT'];
var HOOK_PROPERTIES = [
    [HTMLInputElement.prototype, 'value'],
    [HTMLInputElement.prototype, 'checked'],
    [HTMLSelectElement.prototype, 'value'],
    [HTMLTextAreaElement.prototype, 'value'],
];
var IGNORE_CLASS = 'rr-ignore';
var m = new WeakMap();
// var k = {};
// 设置键值对
// m.set(k, 1);
// 取值
// m.get(k);   //1
var lastInputValueMap = new WeakMap();
// 表单监控
function initInputObserver(cb) {
    function eventHandler(event) {
        var target = event.target;
        if (!target ||
            !target.tagName ||
            INPUT_TAGS.indexOf(target.tagName) < 0 ||
            utils_1.isBlocked(target)) {
            return;
        }
        var type = target.type;
        if (type === 'password' ||
            target.classList.contains(IGNORE_CLASS)) {
            return;
        }
        var text = target.value;
        var isChecked = false;
        if (type === 'radio' || type === 'checkbox') {
            isChecked = target.checked;
        }
        // 去重
        cbWithDedup(target, { text: text, isChecked: isChecked });
        // if a radio was checked
        // the other radios with the same name attribute will be unchecked.
        var name = target.name;
        // 如果多个 radio 元素的组件 name 属性相同，那么当一个被选择时其他都会被反选，但是不会触发任何事件
        if (type === 'radio' && name && isChecked) {
            document
                .querySelectorAll("input[type=\"radio\"][name=\"" + name + "\"]")
                .forEach(function (el) {
                if (el !== target) {
                    cbWithDedup(el, {
                        text: el.value,
                        isChecked: !isChecked
                    });
                }
            });
        }
    }
    // 去重
    function cbWithDedup(target, v) {
        var lastInputValue = lastInputValueMap.get(target);
        if (!lastInputValue ||
            lastInputValue.text !== v.text ||
            lastInputValue.isChecked !== v.isChecked) {
            lastInputValueMap.set(target, v);
            var id = utils_1.mirror.getId(target);
            // 将一批未选中的放进去我们的队列
            cb(__assign({}, v, { id: id }));
        }
    }
    var handlers = [
        'input',
        'change',
    ].map(function (eventName) { return utils_1.on(eventName, eventHandler); });
    // 通过代码直接设置这些元素的属性也不会触发事件，我们可以通过劫持对应属性的 setter 来达到监听的目的
    var propertyDescriptor = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value');
    if (propertyDescriptor && propertyDescriptor.set) {
        handlers.push.apply(handlers, HOOK_PROPERTIES.map(function (p) {
            return utils_1.hookSetter(p[0], p[1], {
                set: function () {
                    // mock to a normal event
                    eventHandler({ target: this });
                }
            });
        }));
    }
    return function () {
        handlers.forEach(function (h) { return h(); });
    };
}
function initObservers(o) {
    var mutationObserver = initMutationObserver(o.mutationCb);
    var mousemoveHandler = initMousemoveObserver(o.mousemoveCb);
    var mouseInteractionHandler = initMouseInteractionObserver(o.mouseInteractionCb);
    var scrollHandler = initScrollObserver(o.scrollCb);
    var viewportResizeHandler = initViewportResizeObserver(o.viewportResizeCb);
    var inputHandler = initInputObserver(o.inputCb);
    return function () {
        mutationObserver.disconnect();
        mousemoveHandler();
        mouseInteractionHandler();
        scrollHandler();
        viewportResizeHandler();
        inputHandler();
    };
}
exports["default"] = initObservers;
