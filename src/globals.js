/*global AudioParam, OscillatorNode, BiquadFilterNode */

if (window || window.AudioContext || window.webkitAudioContext) {

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
            set: function (waveType) {
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
            set: function (filterType) {
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

