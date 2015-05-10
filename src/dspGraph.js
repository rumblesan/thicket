
var util = require('./util');
var noise = require('./noise');

var DspGraph = {};

var internal = {};

internal.createConstant = function (audioCtx, audioTargetNode, graphAst) {
    audioTargetNode.set(graphAst.value, audioCtx);
    return {
        paramNames: []
    };
};

internal.createParam = function (audioCtx, audioTargetNode, graphAst) {

    var name  = graphAst.name;
    var value = graphAst.value;
    audioTargetNode.set(value, audioCtx);

    var p = {
        paramNames: [],
        params: {}
    };
    p.paramNames.push(name);
    p.params[name] = [
        {
            set: function (newValue) {
                value = newValue;
                audioTargetNode.set(newValue, audioCtx);
            },
            get: function () {
                return value;
            }
        }
    ];
    return p;
};

internal.createInput = function (audioCtx, audioTargetNode, graphAst) {
    var inputName = graphAst.name;

    var inputParams = {};
    inputParams.params = {};
    inputParams.paramNames = [inputName];
    inputParams.params[inputName] = [
        {
            set: function (sourceNode) {
                sourceNode.connect(audioTargetNode);
            },
            get: function () {
                return audioTargetNode;
            },
        }
    ];
    return inputParams;
};

/* node to sum all inputs together */
internal.createMix = function (audioCtx, audioTargetNode, graphAst) {
    var paramSum     = util.createParamNodeSummer(audioCtx, audioTargetNode);
    var outputParams = [];

    var s, n;
    for (s = 0; s < graphAst.sources; s += 1) {
        n = graphAst.sources[s];
        switch (n.type) {
            case 'CONSTANT':
                paramSum.constant += n.value;
                break;
            case 'PARAM':
                outputParams.push(
                    DspGraph.evaluate(audioCtx, paramSum.createSet(n.name), n)
                );
                break;
            default:
                outputParams.push(
                    DspGraph.evaluate(audioCtx, audioTargetNode, n)
                );
                break;
        }
    }

    return util.mergeNodeParams(outputParams);
};

/* node to multiply all inputs together */
internal.createMultiply = function (audioCtx, audioTargetNode, graphAst) {

    var factor = graphAst.factor.value;

    var multSet = {
        set: function (value, audioCtx) {
            audioTargetNode.set(factor * value, audioCtx);
        }
    };

    var params = DspGraph.evaluate(
        audioCtx,
        multSet,
        graphAst.source
    );

    return params;
};

// No params for a noise source so return an empty param object
internal.createNoise = function (audioCtx, audioTargetNode, graphAst) {
    var audioNode;
    switch(graphAst.noiseType) {
        case 'white':
            audioNode = noise.createWhite(audioCtx);
            break;
        case 'pink':
            audioNode = noise.createPink(audioCtx);
            break;
        case 'brown':
            audioNode = noise.createBrown(audioCtx);
            break;
        default:
            audioNode = noise.createWhite(audioCtx);
            break;
    }
    audioNode.connect(audioTargetNode);
    return {
        paramNames: [],
        params: {}
    };
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

    var play = function (length) {
        var t = audioCtx.currentTime + envParams.attack.value;
        audioTargetNode.linearRampToValueAtTime(
            1.0, t
        );
        audioTargetNode.linearRampToValueAtTime(
            1.0, (t + length)
        );
        audioTargetNode.linearRampToValueAtTime(
            0.0, (t + length + envParams.decay.value)
        );
    };
    var start = function () {
        var t = audioCtx.currentTime + envParams.decay.value;
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
        paramNames: ['play', 'start', 'stop'],
        params: {
            play: [play],
            start: [start],
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

internal.createCompressor = function (audioCtx, audioTargetNode, graphAst) {
    var comp = audioCtx.createDynamicsCompressor();

    var sourceParams = DspGraph.evaluate(
        audioCtx,
        comp,
        graphAst.source
    );

    var thresholdParams = DspGraph.evaluate(audioCtx, comp.threshold, graphAst.threshold);
    var ratioParams     = DspGraph.evaluate(audioCtx, comp.ratio,     graphAst.ratio);
    var kneeParams      = DspGraph.evaluate(audioCtx, comp.knee,      graphAst.knee);
    var reductionParams = DspGraph.evaluate(audioCtx, comp.reduction, graphAst.reduction);
    var attackParams    = DspGraph.evaluate(audioCtx, comp.attack,    graphAst.attack);
    var releaseParams   = DspGraph.evaluate(audioCtx, comp.release,   graphAst.release);

    comp.connect(audioTargetNode);

    return util.mergeNodeParams([
        sourceParams, thresholdParams, kneeParams, reductionParams, attackParams, releaseParams
    ]);
};

internal.createDelay = function (audioCtx, audioTargetNode, graphAst) {
    var feedbackAmp = audioCtx.createGain();
    var mainAmp = audioCtx.createGain();
    var delayNode = audioCtx.createDelay(graphAst.delayMax.value);

    mainAmp.gain.value = 1;

    var sourceParams = DspGraph.evaluate(
        audioCtx,
        mainAmp,
        graphAst.source
    );

    var delayTimeParams = DspGraph.evaluate(
        audioCtx,
        delayNode.delayTime,
        graphAst.delayTime
    );

    var feedbackParams = DspGraph.evaluate(
        audioCtx,
        feedbackAmp.gain,
        graphAst.feedback
    );

    mainAmp.connect(delayNode);
    delayNode.connect(feedbackAmp);
    feedbackAmp.connect(mainAmp);

    mainAmp.connect(audioTargetNode);

    return util.mergeNodeParams([sourceParams, delayTimeParams, feedbackParams]);
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
        case 'INPUT':
            result = internal.createInput(audioCtx, audioTargetNode, graphAst);
            break;
        case 'MIX':
            result = internal.createMix(audioCtx, audioTargetNode, graphAst);
            break;
        case 'MULTIPLY':
            result = internal.createMultiply(audioCtx, audioTargetNode, graphAst);
            break;
        case 'ARENVELOPE':
            result = internal.createEnvelope(audioCtx, audioTargetNode, graphAst);
            break;
        case 'OSCILLATOR':
            result = internal.createOscillator(audioCtx, audioTargetNode, graphAst);
            break;
        case 'NOISE':
            result = internal.createNoise(audioCtx, audioTargetNode, graphAst);
            break;
        case 'FILTER':
            result = internal.createFilter(audioCtx, audioTargetNode, graphAst);
            break;
        case 'AMP':
            result = internal.createAmp(audioCtx, audioTargetNode, graphAst);
            break;
        case 'COMPRESSOR':
            result = internal.createCompressor(audioCtx, audioTargetNode, graphAst);
            break;
        case 'DELAY':
            result = internal.createDelay(audioCtx, audioTargetNode, graphAst);
            break;
        default:
            throw new Error("Unknown DSP graph type: " + graphAst.type);
    }
    return result;
};


module.exports = DspGraph;

