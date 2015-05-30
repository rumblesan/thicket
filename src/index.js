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

    /**
     * synth
     * inputName
     */
    AudioSystem.Synth.getInputs = Synth.getInputs;

    /**
     * synth
     * inputName
     * sourceSynth
     * sourceOutputName
     */
    AudioSystem.Synth.connectSynthToInputs = Synth.connectSynthToInputs;

    /**
     * synth
     * inputName
     * sourceNode
     */
    AudioSystem.Synth.connectToInputs = Synth.connectToInputs;

    /**
     * synth
     * outputName
     */
    AudioSystem.Synth.getOutputs = Synth.getOutputs;

    AudioSystem.out = [audioCtx.destination];

    return AudioSystem;
};

module.exports = Thicket;
