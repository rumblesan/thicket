/*jslint browser: true */

var Thicket = require('../../src/');

var audioCtx = Thicket.createContext();
var system = Thicket.createSystem(audioCtx);

var Constant   = Thicket.AST.Contsant;   // value
var Input      = Thicket.AST.Input;      // name
var Param      = Thicket.AST.Param;      // name, value
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

Audio.masterOut = system.Effects.create(FXDefs.output);
system.Synth.connectToMasterOut(Audio.masterOut, 'default');

Audio.spaceEffects = system.Effects.create(FXDefs.space);
system.Synth.connectSynthToInputs(Audio.masterOut, 'master', Audio.spaceEffects, 'default');

Audio.drop = system.Synth.create(SynthDefs.drop);
Audio.hat = system.Synth.create(SynthDefs.hat);
Audio.kick = system.Synth.create(SynthDefs.kick);

system.Synth.connectToInputs(Audio.spaceEffects, 'fxinput', system.Synth.getOutputs(Audio.drop, 'default'));
system.Synth.connectToInputs(Audio.spaceEffects, 'fxinput', system.Synth.getOutputs(Audio.hat, 'default'));
system.Synth.connectToInputs(Audio.masterOut, 'master', system.Synth.getOutputs(Audio.kick, 'default'));

document.getElementById('playdrop').addEventListener('click', function () {
    system.Synth.play(Audio.drop, 1, ['freq', 220]);
});

document.getElementById('playhat').addEventListener('click', function () {
    system.Synth.play(Audio.hat, 0);
});

document.getElementById('playkick').addEventListener('click', function () {
    system.Synth.play(Audio.kick, 0.2);
});

