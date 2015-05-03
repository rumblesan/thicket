/*jslint browser: true */

require('./globals');

var graphAST = require('./dspAst');
var Synth = require('./synth');

var Thicket = {};

Thicket.AST = graphAST;

Thicket.createContext = function () {
    var context;
    window.AudioContext = window.AudioContext||window.webkitAudioContext;
    context = new window.AudioContext();
    return context;
};

var createSystem = function (audioCtx) {
    var AudioSystem = {};

    AudioSystem.createSynth = function (dspAst, destination) {
        return Synth.createSynth(audioCtx, dspAst, destination);
    };

    return AudioSystem;
};

module.exports = Thicket;
