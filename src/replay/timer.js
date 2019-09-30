"use strict";
exports.__esModule = true;
var Timer = /** @class */ (function () {
    function Timer(config, actions) {
        if (actions === void 0) { actions = []; }
        this.timeOffset = 0;
        this.actions = actions;
        this.config = config;
    }
    /**
     * Add an action after the timer starts.
     * @param action
     */
    Timer.prototype.addAction = function (action) {
        var index = this.findActionIndex(action);
        this.actions.splice(index, 0, action);
    };
    /**
     * Add all actions before the timer starts
     * @param actions
     */
    Timer.prototype.addActions = function (actions) {
        var _a;
        (_a = this.actions).push.apply(_a, actions);
    };
    Timer.prototype.start = function () {
        this.actions.sort(function (a1, a2) { return a1.delay - a2.delay; });
        this.timeOffset = 0;
        var lastTimestamp = performance.now();
        var _a = this, actions = _a.actions, config = _a.config;
        var self = this;
        function check(time) {
            self.timeOffset += (time - lastTimestamp) * config.speed;
            lastTimestamp = time;
            while (actions.length) {
                var action = actions[0];
                if (self.timeOffset >= action.delay) {
                    actions.shift();
                    action.doAction();
                }
                else {
                    break;
                }
            }
            if (actions.length > 0) {
                self.raf = requestAnimationFrame(check);
            }
        }
        this.raf = requestAnimationFrame(check);
    };
    Timer.prototype.clear = function () {
        if (this.raf) {
            cancelAnimationFrame(this.raf);
        }
        this.actions.length = 0;
    };
    Timer.prototype.findActionIndex = function (action) {
        var start = 0;
        var end = this.actions.length - 1;
        while (start <= end) {
            var mid = Math.floor((start + end) / 2);
            if (this.actions[mid].delay < action.delay) {
                start = mid + 1;
            }
            else if (this.actions[mid].delay > action.delay) {
                end = mid - 1;
            }
            else {
                return mid;
            }
        }
        return start;
    };
    return Timer;
}());
exports["default"] = Timer;
