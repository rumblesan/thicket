/*global AudioParam, OscillatorNode, BiquadFilterNode */

var root = this;

if (root.AudioContext || root.webkitAudioContext) {

    AudioParam.prototype.set = function (newValue, audioCtx) {
        if (this.setValueAtTime) {
            this.setValueAtTime(newValue, audioCtx.currentTime);
        } else {
            this.value = newValue;
        }
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

}

module.exports = {
    imported: true
};

