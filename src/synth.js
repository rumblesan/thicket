
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

