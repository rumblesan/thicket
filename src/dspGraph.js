
var util = require('./util');
var dn = require('./dspnode');
var noise = require('./noise');

var DspGraph = {};

var internal = {};

var config = {
    defaultOutputName: 'default'
};

internal.createConstant = function (audioCtx, audioTargetNode, graphAst) {
    audioTargetNode.set(graphAst.value, audioCtx);
    return dn.create();
};

internal.createParam = function (audioCtx, audioTargetNode, graphAst) {

    var name  = graphAst.name;
    var value = graphAst.value;
    audioTargetNode.set(value, audioCtx);

    var node = dn.create();
    var paramObj = {
                       set: function (newValue) {
                           value = newValue;
                           audioTargetNode.set(newValue, audioCtx);
                       },
                       get: function () {
                           return value;
                       }
                   };

    dn.addParam(node, name, paramObj);

    return node;
};

internal.createInput = function (audioCtx, audioTargetNode, graphAst) {
    var inputName = graphAst.name;

    var node = dn.create();

    var inputObj = {
                       connect: function (sourceNode) {
                           sourceNode.connect(audioTargetNode);
                       },
                       get: function () {
                           return audioTargetNode;
                       },
                   };

    dn.addInput(node, inputName, inputObj);

    return node;
};

/* node to sum all inputs together */
internal.createMix = function (audioCtx, audioTargetNode, graphAst) {
    var setFunction = function (value) {
        audioTargetNode.set(value, audioCtx);
    };

    var paramSum    = dn.createSummer(setFunction);
    var outputNodes = [];

    var s, n;
    for (s = 0; s < graphAst.sources; s += 1) {
        n = graphAst.sources[s];
        switch (n.type) {
            case 'CONSTANT':
                paramSum.incrConstant(n.value);
                break;
            case 'PARAM':
                outputNodes.push(
                    DspGraph.evaluate(audioCtx, paramSum.createSetNode(n.name), n)
                );
                break;
            default:
                outputNodes.push(
                    DspGraph.evaluate(audioCtx, audioTargetNode, n)
                );
                break;
        }
    }

    return dn.merge(outputNodes);
};

/* node to multiply all inputs together */
internal.createMultiply = function (audioCtx, audioTargetNode, graphAst) {

    // TODO Actually make this work

    var factor = graphAst.factor.value;

    var multSet = {
        set: function (value, audioCtx) {
            audioTargetNode.set(factor * value, audioCtx);
        }
    };

    var node = DspGraph.evaluate(
        audioCtx,
        multSet,
        graphAst.source
    );

    return node;
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

    var node = dn.create();
    dn.addOutput(node, config.defaultOutputName, audioNode);

    if (audioTargetNode) {
        audioNode.connect(audioTargetNode);
    }

    return node;
};

internal.createOscillator = function (audioCtx, audioTargetNode, graphAst) {
    var oscillator = audioCtx.createOscillator();
    oscillator.start();

    var waveNode = DspGraph.evaluate(
        audioCtx,
        oscillator.getWaveParam(),
        graphAst.waveshape
    );

    var freqNode = DspGraph.evaluate(
        audioCtx,
        oscillator.frequency,
        graphAst.frequency
    );

    var node = dn.merge([waveNode, freqNode]);
    dn.addOutput(node, config.defaultOutputName, oscillator);

    if (audioTargetNode) {
        oscillator.connect(audioTargetNode);
    }

    return node;
};

internal.createEnvelope = function (audioCtx, audioTargetNode, graphAst) {

    var attackAudioParam = dn.createParamNode();
    var decayAudioParam = dn.createParamNode();

    var attackNode = DspGraph.evaluate(
        audioCtx,
        attackAudioParam,
        graphAst.attack
    );

    var decayNode = DspGraph.evaluate(
        audioCtx,
        decayAudioParam,
        graphAst.decay
    );

    var play = function (length) {
        var t = audioCtx.currentTime + attackAudioParam.value;
        audioTargetNode.linearRampToValueAtTime(
            1.0, t
        );
        audioTargetNode.linearRampToValueAtTime(
            1.0, (t + length)
        );
        audioTargetNode.linearRampToValueAtTime(
            0.0, (t + length + attackAudioParam.value)
        );
    };
    var start = function () {
        var t = audioCtx.currentTime + decayAudioParam.value;
        audioTargetNode.linearRampToValueAtTime(
            1.0, t
        );
    };
    var stop = function () {
        var t = audioCtx.currentTime + decayAudioParam.value;
        audioTargetNode.linearRampToValueAtTime(
            0.0, t
        );
    };

    var envelopeNode = dn.create();
    dn.addEnvelope(envelopeNode, 'start', start);
    dn.addEnvelope(envelopeNode, 'stop', stop);
    dn.addEnvelope(envelopeNode, 'play', play);

    return dn.merge([attackNode, decayNode, envelopeNode]);
};

internal.createFilter = function (audioCtx, audioTargetNode, graphAst) {
    var filter = audioCtx.createBiquadFilter();

    var sourceNode = DspGraph.evaluate(
        audioCtx,
        filter,
        graphAst.source
    );

    var filterTypeNode = DspGraph.evaluate(
        audioCtx,
        filter.getFilterTypeParam(),
        graphAst.filterType
    );

    var freqNode = DspGraph.evaluate(
        audioCtx,
        filter.frequency,
        graphAst.frequency
    );

    var resonanceNode = DspGraph.evaluate(
        audioCtx,
        filter.Q,
        graphAst.resonance
    );

    var node =  dn.merge([sourceNode, filterTypeNode, freqNode, resonanceNode]);
    dn.addOutput(node, config.defaultOutputName, filter);

    if (audioTargetNode) {
        filter.connect(audioTargetNode);
    }

    return node;
};

internal.createAmp = function (audioCtx, audioTargetNode, graphAst) {
    var amp = audioCtx.createGain();
    amp.gain.value = 0;

    var sourceNode = DspGraph.evaluate(
        audioCtx,
        amp,
        graphAst.source
    );

    var volumeNode = DspGraph.evaluate(
        audioCtx,
        amp.gain,
        graphAst.volume
    );

    var node =  dn.merge([sourceNode, volumeNode]);
    dn.addOutput(node, config.defaultOutputName, amp);

    if (audioTargetNode) {
        amp.connect(audioTargetNode);
    }

    return node;
};

internal.createCompressor = function (audioCtx, audioTargetNode, graphAst) {
    var comp = audioCtx.createDynamicsCompressor();

    var sourceNode = DspGraph.evaluate(
        audioCtx,
        comp,
        graphAst.source
    );

    var thresholdNode = DspGraph.evaluate(audioCtx, comp.threshold, graphAst.threshold);
    var ratioNode     = DspGraph.evaluate(audioCtx, comp.ratio,     graphAst.ratio);
    var kneeNode      = DspGraph.evaluate(audioCtx, comp.knee,      graphAst.knee);
    var reductionNode = DspGraph.evaluate(audioCtx, comp.reduction, graphAst.reduction);
    var attackNode    = DspGraph.evaluate(audioCtx, comp.attack,    graphAst.attack);
    var releaseNode   = DspGraph.evaluate(audioCtx, comp.release,   graphAst.release);

    var node = dn.merge([
        sourceNode, thresholdNode, kneeNode, reductionNode, attackNode, releaseNode
    ]);
    dn.addOutput(node, config.defaultOutputName, comp);

    if (audioTargetNode) {
        comp.connect(audioTargetNode);
    }

    return node;
};

internal.createDelay = function (audioCtx, audioTargetNode, graphAst) {
    var feedbackAmp = audioCtx.createGain();
    var mainAmp = audioCtx.createGain();
    var delayNode = audioCtx.createDelay(graphAst.delayMax.value);

    mainAmp.gain.value = 1;

    var sourceNode = DspGraph.evaluate(
        audioCtx,
        mainAmp,
        graphAst.source
    );

    var delayTimeNode = DspGraph.evaluate(
        audioCtx,
        delayNode.delayTime,
        graphAst.delayTime
    );

    var feedbackNode = DspGraph.evaluate(
        audioCtx,
        feedbackAmp.gain,
        graphAst.feedback
    );

    mainAmp.connect(delayNode);
    delayNode.connect(feedbackAmp);
    feedbackAmp.connect(mainAmp);

    var node = dn.merge([sourceNode, delayTimeNode, feedbackNode]);
    dn.addOutput(node, config.defaultOutputName, mainAmp);

    if (audioTargetNode) {
        mainAmp.connect(audioTargetNode);
    }

    return node;
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

