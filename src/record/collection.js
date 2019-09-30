"use strict";
/**
 * Some utils to handle the mutation observer DOM records.
 * It should be more clear to extend the native data structure
 * like Set and Map, but currently Typescript does not support
 * that.
 */
exports.__esModule = true;
var utils_1 = require("../utils");
function deepDelete(addsSet, n) {
    addsSet["delete"](n);
    n.childNodes.forEach(function (childN) { return deepDelete(addsSet, childN); });
}
exports.deepDelete = deepDelete;
function isParentRemoved(removes, n) {
    var parentNode = n.parentNode;
    if (!parentNode) {
        return false;
    }
    var parentId = utils_1.mirror.getId(parentNode);
    if (removes.some(function (r) { return r.id === parentId; })) {
        return true;
    }
    return isParentRemoved(removes, parentNode);
}
exports.isParentRemoved = isParentRemoved;
function isParentDropped(droppedSet, n) {
    var parentNode = n.parentNode;
    if (!parentNode) {
        return false;
    }
    if (droppedSet.has(parentNode)) {
        return true;
    }
    return isParentDropped(droppedSet, parentNode);
}
exports.isParentDropped = isParentDropped;
