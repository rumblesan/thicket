
var dsp = {};

var checkConst = function (v) {
    var out;
    switch (typeof v) {
        case 'number':
            out = dsp.Constant(v);
            break;
        case 'string':
            out = dsp.Constant(v);
            break;
        default:
            if (v.type !== undefined) {
                // Assuming v is a DSP Graph
                out = v;
            } else {
                throw Error.create("Invalid value in DSP Graph: " + v);
            }
    }
    return out;
};

dsp.Constant = function (value) {
    return {
        type: 'CONSTANT',
        value: value
    };
};

dsp.Input = function (name) {
    return {
        type: 'INPUT',
        name: name
    };
};

dsp.Param = function (name, value) {
    return {
        type: 'PARAM',
        name: name,
        value: value
    };
};

dsp.Mix = function (/* args */) {
    return {
        type: 'MIX',
        sources: arguments
    };
};

/* only meant to be used for multiplying params
 * Amp should be used with signals
 */
dsp.Multiply = function (source, factor) {
    return {
        type: 'MULTIPLY',
        source: source,
        factor: factor
    };
};

dsp.AREnvelope = function (attack, decay) {
    return {
        type: 'ARENVELOPE',
        attack: checkConst(attack),
        decay: checkConst(decay)
    };
};

dsp.Oscillator = function (frequency, waveshape) {
    return {
        type: 'OSCILLATOR',
        frequency: checkConst(frequency),
        waveshape: checkConst(waveshape)
    };
};

dsp.Noise = function (noiseType) {
    return {
        type: 'NOISE',
        noiseType: checkConst(noiseType)
    };
};

dsp.Filter = function (source, filterType, frequency, resonance) {
    return {
        type: 'FILTER',
        source: source,
        filterType: checkConst(filterType),
        frequency: checkConst(frequency),
        resonance: checkConst(resonance)
    };
};

dsp.Delay = function (source, delayTime, delayMax, feedback) {
    return {
        type: 'DELAY',
        source: source,
        delayTime: checkConst(delayTime),
        delayMax: checkConst(delayMax),
        feedback: checkConst(feedback)
    };
};

dsp.Compressor = function (source, threshold, ratio, knee, reduction, attack, release) {
    return {
        type: 'COMPRESSOR',
        source: source,
        threshold: checkConst(threshold),
        ratio: checkConst(ratio),
        knee: checkConst(knee),
        reduction: checkConst(reduction),
        attack: checkConst(attack),
        release: checkConst(release)
    };
};

dsp.Amp = function (source, volume) {
    return {
        type: 'AMP',
        source: source,
        volume: checkConst(volume)
    };
};

module.exports = dsp;

