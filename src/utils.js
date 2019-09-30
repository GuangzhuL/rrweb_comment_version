"use strict";
exports.__esModule = true;
function on(type, fn, target) {
    if (target === void 0) { target = document; }
    // capture： 捕抓阶段捕获；passive： true，表示不调用preventEvent()时间，优化性能
    var options = { capture: true, passive: true };
    target.addEventListener(type, fn, options);
    return function () { return target.removeEventListener(type, fn, options); };
}
exports.on = on;
// 映射
exports.mirror = {
    map: {},
    getId: function (n) {
        // if n is not a serialized INode, use -1 as its id.
        if (!n.__sn) {
            return -1;
        }
        return n.__sn.id;
    },
    getNode: function (id) {
        return exports.mirror.map[id] || null;
    },
    // TODO: use a weakmap to get rid of manually memory management
    removeNodeFromMap: function (n) {
        var id = n.__sn && n.__sn.id;
        delete exports.mirror.map[id];
        if (n.childNodes) {
            n.childNodes.forEach(function (child) {
                return exports.mirror.removeNodeFromMap(child);
            });
        }
    },
    has: function (id) {
        return exports.mirror.map.hasOwnProperty(id);
    }
};
// copy from underscore and modified
// 函数节流，简单地讲，就是让一个函数无法在很短的时间间隔内连续调用，只有当上一次函数执行后过了你规定的时间间隔，才能进行下一次该函数的调用
function throttle(func, wait, options) {
    if (options === void 0) { options = {}; }
    var timeout = null;
    var previous = 0;
    // tslint:disable-next-line: only-arrow-functions
    return function () {
        var now = Date.now();
        if (!previous && options.leading === false) {
            previous = now;
        }
        var remaining = wait - (now - previous);
        var context = this;
        var args = arguments;
        if (remaining <= 0 || remaining > wait) {
            if (timeout) {
                window.clearTimeout(timeout);
                timeout = null;
            }
            previous = now;
            func.apply(context, args);
        }
        else if (!timeout && options.trailing !== false) {
            timeout = window.setTimeout(function () {
                previous = options.leading === false ? 0 : Date.now();
                timeout = null;
                func.apply(context, args);
            }, remaining);
        }
    };
}
exports.throttle = throttle;
function hookSetter(target, key, d) {
    var original = Object.getOwnPropertyDescriptor(target, key);
    Object.defineProperty(target, key, {
        set: function (value) {
            var _this = this;
            // put hooked setter into event loop to avoid of set latency
            // 注意为了避免我们在 setter 中的逻辑阻塞被录制页面的正常交互，我们应该把逻辑放入 event loop 中异步执行
            setTimeout(function () {
                d.set.call(_this, value);
            }, 0);
            if (original && original.set) {
                original.set.call(this, value);
            }
        }
    });
    return function () { return hookSetter(target, key, original || {}); };
}
exports.hookSetter = hookSetter;
// 获取高度
function getWindowHeight() {
    return (window.innerHeight ||
        (document.documentElement && document.documentElement.clientHeight) ||
        (document.body && document.body.clientHeight));
}
exports.getWindowHeight = getWindowHeight;
// 获取宽度
function getWindowWidth() {
    return (window.innerWidth ||
        (document.documentElement && document.documentElement.clientWidth) ||
        (document.body && document.body.clientWidth));
}
exports.getWindowWidth = getWindowWidth;
var BLOCK_CLASS = 'rr-block';
function isBlocked(node) {
    if (!node) {
        return false;
    }
    if (node.nodeType === node.ELEMENT_NODE) {
        return (node.classList.contains(BLOCK_CLASS) ||
            isBlocked(node.parentNode));
    }
    return isBlocked(node.parentNode);
}
exports.isBlocked = isBlocked;
function isAncestorRemoved(target) {
    var id = exports.mirror.getId(target);
    if (!exports.mirror.has(id)) {
        return true;
    }
    if (target.parentNode &&
        target.parentNode.nodeType === target.DOCUMENT_NODE) {
        return false;
    }
    // if the root is not document, it means the node is not in the DOM tree anymore
    if (!target.parentNode) {
        return true;
    }
    return isAncestorRemoved(target.parentNode);
}
exports.isAncestorRemoved = isAncestorRemoved;
