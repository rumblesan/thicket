
var DspGraph = require('./dspGraph');

var Effects = {};

/**
 * returns
 *     FXChain: {
 *       params: [paramNames, ...],
 *       paramName1: [setFunctions, ...]
 *     }
 **/

Effects.createChain = function (audioCtx, dspAst) {
    var destinationNode = null;
    return DspGraph.evaluate(
        audioCtx,
        destinationNode,
        dspAst
    );
};

module.exports = Effects;

