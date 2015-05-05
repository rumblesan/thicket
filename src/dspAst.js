
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

dsp.Param = function (name, defaultValue) {
    return {
        type: 'PARAM',
        name: name,
        defaultValue: defaultValue
    };
};

dsp.AREnvelope = function (attack, decay) {
    return {
        type: 'ARENVELOPE',
        attack: checkConst(attack),
        decay: checkConst(decay)
    };
};

dsp.Oscillator = function(frequency, waveshape) {
    return {
        type: 'OSCILLATOR',
        frequency: checkConst(frequency),
        waveshape: checkConst(waveshape)
    };
};

dsp.Filter = function(source, filterType, frequency, resonance) {
    return {
        type: 'FILTER',
        source: source,
        filterType: checkConst(filterType),
        frequency: checkConst(frequency),
        resonance: checkConst(resonance)
    };
};

dsp.Amp = function(source, volume) {
    return {
        type: 'AMP',
        source: source,
        volume: checkConst(volume)
    };
};

module.exports = dsp;

