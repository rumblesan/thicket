
var util = require('./util');

var DspGraph = {};

var internal = {};

internal.createConstant = function (audioCtx, audioTargetNode, graphAst) {
    audioTargetNode.set(graphAst.value, audioCtx);
    return {
        paramNames: []
    };
};

internal.createParam = function (audioCtx, audioTargetNode, graphAst) {
    var paramName = graphAst.name;
    var defaultValue = graphAst.defaultValue;
    audioTargetNode.set(defaultValue, audioCtx);
    var paramParams = {};
    paramParams.params = {}; // worst name evar
    paramParams.paramNames = [paramName];
    paramParams.params[paramName] = [
        function (newValue) {
            audioTargetNode.set(newValue, audioCtx);
        }
    ];
    return paramParams;
};

internal.createOscillator = function (audioCtx, audioTargetNode, graphAst) {
    var oscillator = audioCtx.createOscillator();
    oscillator.start();

    var waveParam = DspGraph.evaluate(
        audioCtx,
        oscillator.getWaveParam(),
        graphAst.waveshape
    );

    var freqParam = DspGraph.evaluate(
        audioCtx,
        oscillator.frequency,
        graphAst.frequency
    );

    oscillator.connect(audioTargetNode);

    return util.mergeNodeParams([waveParam, freqParam]);
};

internal.createEnvelope = function (audioCtx, audioTargetNode, graphAst) {

    var envParams = {};
    envParams.attack = {
        value: 0,
        set: function (newValue, audioCtx) {
            envParams.attack.value = newValue;
        },
        get: function () {
            return envParams.attack.value;
        }
    };
    envParams.decay = {
        value: 0,
        set: function (newValue, audioCtx) {
            envParams.decay.value = newValue;
        },
        get: function () {
            return envParams.decay.value;
        }
    };

    var attackParams = DspGraph.evaluate(
        audioCtx,
        envParams.attack,
        graphAst.attack
    );

    var decayParams = DspGraph.evaluate(
        audioCtx,
        envParams.decay,
        graphAst.decay
    );

    var trigger = function () {
        var t = audioCtx.currentTime + envParams.attack.value;
        audioTargetNode.linearRampToValueAtTime(
            1.0, t
        );
    };
    var stop = function () {
        var t = audioCtx.currentTime + envParams.decay.value;
        audioTargetNode.linearRampToValueAtTime(
            0.0, t
        );
    };
    var triggerParams = {
        paramNames: ['trigger', 'stop'],
        params: {
            trigger: [trigger],
            stop: [stop]
        }
    };

    return util.mergeNodeParams([attackParams, decayParams, triggerParams]);
};

internal.createFilter = function (audioCtx, audioTargetNode, graphAst) {
    var filter = audioCtx.createBiquadFilter();

    var sourceParams = DspGraph.evaluate(
        audioCtx,
        filter,
        graphAst.source
    );

    var filterTypeParam = DspGraph.evaluate(
        audioCtx,
        filter.getFilterTypeParam(),
        graphAst.filterType
    );

    var freqParam = DspGraph.evaluate(
        audioCtx,
        filter.frequency,
        graphAst.frequency
    );

    var resonanceParam = DspGraph.evaluate(
        audioCtx,
        filter.Q,
        graphAst.resonance
    );

    filter.connect(audioTargetNode);

    return util.mergeNodeParams([sourceParams, filterTypeParam, freqParam, resonanceParam]);
};

internal.createAmp = function (audioCtx, audioTargetNode, graphAst) {
    var amp = audioCtx.createGain();
    amp.gain.value = 0;

    var sourceParams = DspGraph.evaluate(
        audioCtx,
        amp,
        graphAst.source
    );

    var volumeParams = DspGraph.evaluate(
        audioCtx,
        amp.gain,
        graphAst.volume
    );
    amp.connect(audioTargetNode);

    return util.mergeNodeParams([sourceParams, volumeParams]);
};

DspGraph.evaluate = function(audioCtx, audioTargetNode, graphAst) {
    var result;
    switch (graphAst.type) {
        case 'CONSTANT':
            result = internal.createConstant(audioCtx, audioTargetNode, graphAst);
            break;
        case 'PARAM':
            result = internal.createParam(audioCtx, audioTargetNode, graphAst);
            break;
        case 'ARENVELOPE':
            result = internal.createEnvelope(audioCtx, audioTargetNode, graphAst);
            break;
        case 'OSCILLATOR':
            result = internal.createOscillator(audioCtx, audioTargetNode, graphAst);
            break;
        case 'FILTER':
            result = internal.createFilter(audioCtx, audioTargetNode, graphAst);
            break;
        case 'AMP':
            result = internal.createAmp(audioCtx, audioTargetNode, graphAst);
            break;
        default:
            throw new Error("Unknown DSP graph type: " + graphAst.type);
    }
    return result;
};


module.exports = DspGraph;

