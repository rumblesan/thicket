/*global AudioParam, OscillatorNode, BiquadFilterNode */

AudioParam.prototype.set = function (newValue, audioCtx) {
    this.value.setValueAtTime(newValue, audioCtx.currentTime);
};

OscillatorNode.prototype.getWaveParam = function () {
    var self = this;
    return {
        set: function (waveType, audioCtx) {
            self.type = waveType;
        },
        get: function () {
            return self.type;
        }
    };
};

BiquadFilterNode.prototype.getFilterTypeParam = function () {
    var self = this;
    return {
        set: function (filterType, audioCtx) {
            self.type = filterType;
        },
        get: function () {
            return self.type;
        }
    };
};

module.exports = {
    imported: true
};

