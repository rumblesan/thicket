(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){

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


},{}],2:[function(require,module,exports){

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


},{"./noise":7,"./util":9}],3:[function(require,module,exports){

var DspGraph = require('./dspGraph');

var Effects = {};

/**
 * returns
 *     FXChain: {
 *       params: [paramNames, ...],
 *       paramName1: [setFunctions, ...]
 *     }
 **/

Effects.createChain = function (audioCtx, dspAst, destination) {
    var destinationNode = destination || audioCtx.destination;
    return DspGraph.evaluate(
        audioCtx,
        destinationNode,
        dspAst
    );
};

module.exports = Effects;


},{"./dspGraph":2}],4:[function(require,module,exports){
/*global AudioParam, OscillatorNode, BiquadFilterNode */

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

module.exports = {
    imported: true
};


},{}],5:[function(require,module,exports){

var Helpers = {};

Helpers.dbToNum = function (dbValue) {
    return Math.pow(10, (dbValue/10));
};

module.exports = Helpers;


},{}],6:[function(require,module,exports){
/*jslint browser: true */

require('./globals');

var graphAST = require('./dspAst');
var Synth = require('./synth');
var Effects = require('./effects');
var Helpers = require('./helpers');

var Thicket = {};

Thicket.AST = graphAST;

Thicket.helpers = Helpers;

Thicket.createContext = function () {
    var context;
    window.AudioContext = window.AudioContext||window.webkitAudioContext;
    context = new window.AudioContext();
    return context;
};

Thicket.createSystem = function (audioCtx) {
    var AudioSystem = {};

    AudioSystem.Synth = {};
    AudioSystem.Effects = {};

    AudioSystem.Synth.create = function (dspAst, destination) {
        return Synth.create(audioCtx, dspAst, destination);
    };

    AudioSystem.Effects.create = function (dspAst, destination) {
        return Effects.createChain(audioCtx, dspAst, destination);
    };

    /**
     * synth
     * paramName
     * value
     */
    AudioSystem.Synth.setParam = Synth.setParam;

    /**
     * synth
     * paramName
     */
    AudioSystem.Synth.getParam = Synth.getParam;

    /**
     * synth
     * parameterList
     */
    AudioSystem.Synth.start = Synth.start;

    /**
     * synth
     */
    AudioSystem.Synth.stop = Synth.stop;

    /**
     * synth
     * length
     * parameterList
     */
    AudioSystem.Synth.play = Synth.play;

    return AudioSystem;
};

module.exports = Thicket;

},{"./dspAst":1,"./effects":3,"./globals":4,"./helpers":5,"./synth":8}],7:[function(require,module,exports){

/*
 * Plenty of help for this from
 * http://noisehack.com/generate-noise-web-audio-api/
 */

var noise = {};

noise.createWhite = function (audioCtx) {

    var bufferSize  = 2 * audioCtx.sampleRate,
        noiseBuffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate),
        output      = noiseBuffer.getChannelData(0),
        i;

    for (i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
    }

    var whiteNoise = audioCtx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;
    whiteNoise.loop = true;
    whiteNoise.start(0);

    return whiteNoise;
};

noise.createPink = function (audioCtx) {
    // TODO make this actually white noise
    var white = noise.createWhite(audioCtx);
    return white;
};

noise.createBrown = function (audioCtx) {
    var white = noise.createWhite(audioCtx);
    var filter = audioCtx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value.set(100, audioCtx);
    white.connect(filter);
    return filter;
};

module.exports = noise;


},{}],8:[function(require,module,exports){

var DspGraph = require('./dspGraph');

var Synth = {};


/**
 * returns
 *     Synth: {
 *       paramNames: [paramNames, ...],
 *       params: {
 *           paramName1: [setFunctions, ...],
 *       }
 *     }
 **/
Synth.create = function (audioCtx, dspAst, destination) {
    var destinationNode = destination || audioCtx.destination;
    return DspGraph.evaluate(
        audioCtx,
        destinationNode,
        dspAst
    );
};

Synth.setParam = function (synth, paramName, value) {
    var i;
    if (synth.params[paramName] === undefined) {
        throw new Error('Synth does not have ' + paramName + ' parameter');
    } else {
        for (i = 0; i < synth.params[paramName].length; i += 1) {
            synth.params[paramName][i].set(value);
        }
    }
};

Synth.getParam = function (synth, paramName) {
    var i, output = [];
    if (synth.params[paramName] === undefined) {
        throw new Error('Synth does not have ' + paramName + ' parameter');
    } else {
        for (i = 0; i < synth.params[paramName].length; i += 1) {
            output.push(synth.params[paramName][i].get());
        }
    }
    return output;
};

Synth.start = function (synth, parameterList) {
    var i, t;
    var paramName, paramValue;
    if (synth.params.start === undefined) {
        throw new Error('Synth does not have start parameter');
    } else {
        for (i = 0; i < parameterList.length; i += 2) {
            paramName  = parameterList[i];
            paramValue = parameterList[i+1];
            Synth.setParam(synth, paramName, paramValue);
        }
        for (t = 0; t < synth.params.start.length; t += 1) {
            synth.params.start[t]();
        }
    }
};

Synth.stop = function (synth) {
    var i, t;
    var paramName, paramValue;
    if (synth.params.stop === undefined) {
        throw new Error('Synth does not have stop parameter');
    } else {
        for (t = 0; t < synth.params.stop.length; t += 1) {
            synth.params.stop[t]();
        }
    }
};

Synth.play = function (synth, length, parameterList) {
    var i, t;
    var paramName, paramValue;
    if (synth.params.play === undefined) {
        throw new Error('Synth does not have play parameter');
    } else {
        for (i = 0; i < parameterList.length; i += 2) {
            paramName  = parameterList[i];
            paramValue = parameterList[i+1];
            Synth.setParam(synth, paramName, paramValue);
        }
        for (t = 0; t < synth.params.play.length; t += 1) {
            synth.params.play[t](length);
        }
    }
};

module.exports = Synth;


},{"./dspGraph":2}],9:[function(require,module,exports){

var util = {};

util.mergeNodeParams = function (paramNodes) {
    var output = {
        paramNames: [],
        params: {}
    };
    var node;
    var paramName;
    var n, p, pf;
    for (n = 0; n < paramNodes.length; n += 1) {
        node = paramNodes[n];
        for (p = 0; p < node.paramNames.length; p += 1) {
            paramName = node.paramNames[p];
            if (output.params[paramName] === undefined) {
                output.params[paramName] = [];
                output.paramNames.push(paramName);
            }
            for (pf = 0; pf < node.params[paramName].length; pf += 1) {
                output.params[paramName].push(node.params[paramName][pf]);
            }
        }
    }
    return output;
};

util.createParamNodeSummer = function (audioCtx, audioTargetNode) {
    var paramSummer = {};

    paramSummer.constant = 0;
    paramSummer.names = [];
    paramSummer.values = {};

    paramSummer.setTarget = function () {
        var name, i, v, total = paramSummer.constant;
        for (i = 0; i < paramSummer.names.length; i += 1) {
            name = paramSummer.names[i];
            v = paramSummer.values[name];
            total += v;
        }
        audioTargetNode.set(total, audioCtx);
    };

    paramSummer.createSetNode = function (name) {
        paramSummer.names.push(name);
        paramSummer.values[name] = 0;
        var setNode = {
            set: function (value) {
                paramSummer.values[name] = value;
                paramSummer.setTarget();
            }
        };
        return setNode;
    };

    return paramSummer;
};


module.exports = util;


},{}],10:[function(require,module,exports){
/*jslint browser: true */

var Thicket = require('../../src/');

var audioCtx = Thicket.createContext();
var system = Thicket.createSystem(audioCtx);

var Constant   = Thicket.AST.Contsant;   // value
var Input      = Thicket.AST.Input;      // name
var Param      = Thicket.AST.Param;      // name, defaultValue
var Mix        = Thicket.AST.Mix;        // multiple args
var Multiply   = Thicket.AST.Multiply;   // source, factor
var AREnvelope = Thicket.AST.AREnvelope; // attack, decay
var Oscillator = Thicket.AST.Oscillator; // frequency, waveshape
var Noise      = Thicket.AST.Noise;      // noiseType
var Filter     = Thicket.AST.Filter;     // source, type, frequency, resonance
var Delay      = Thicket.AST.Delay;      // source, delayTime, delayMax, feedback
var Compressor = Thicket.AST.Compressor; // source, threshold, ratio, knee, reduction, attack, release
var Amp        = Thicket.AST.Amp;        // source, volume

var SynthDefs = {};
var FXDefs = {};

SynthDefs.drop = Amp(
                   Filter(
                     Oscillator( Param('freq', 440), 'triangle'),
                     'lowpass',
                     Param('filterFreq', 200),
                     2
                   ),
                   AREnvelope(0.3, 1)
                 );

SynthDefs.hat = Amp(
                  Filter(
                    Noise('white'),
                    'highpass',
                     Param('freq', 800),
                     2
                  ),
                  AREnvelope(0.01, 0.1)
                );

SynthDefs.kick = Amp(
                   Filter(
                     Oscillator( Param('freq', 50), 'triangle'),
                     'lowpass',
                      200,
                      1
                   ),
                   AREnvelope(0.1, 0.5)
                 );


FXDefs.output = Amp(
                  Compressor(
                    Input('master'),
                    -50, 3, 30, -20, 0.1, 0.7
                  ),
                  Param('mastevolume', 0.4)
                );

FXDefs.space = Delay(
                 Input('fxinput'),
                 Param('delaytime', 1),
                 2,
                 Param('feedback', 0.3)
               );

var Audio = {};

Audio.output = system.Effects.create(FXDefs.output);
Audio.master = system.Synth.getParam(Audio.output, 'master')[0];

Audio.spaceEffects = system.Effects.create(FXDefs.space, Audio.master);
Audio.fxBus = system.Synth.getParam(Audio.spaceEffects, 'fxinput')[0];

Audio.drop = system.Synth.create(SynthDefs.drop, Audio.fxBus);
Audio.hat = system.Synth.create(SynthDefs.hat, Audio.fxBus);
Audio.kick = system.Synth.create(SynthDefs.kick, Audio.master);

document.getElementById('playdrop').addEventListener('click', function () {
    system.Synth.play(Audio.drop, 1, []);
});

document.getElementById('playhat').addEventListener('click', function () {
    system.Synth.play(Audio.hat, 0, []);
});

document.getElementById('playkick').addEventListener('click', function () {
    system.Synth.play(Audio.kick, 0.2, []);
});


},{"../../src/":6}]},{},[10]);
