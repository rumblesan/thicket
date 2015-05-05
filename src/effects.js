
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

