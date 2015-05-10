
var DSPNode = require('../../src/dspnode');

/*
  ======== A Handy Little Nodeunit Reference ========
  https://github.com/caolan/nodeunit

  Test methods:
    test.expect(numAssertions)
    test.done()
  Test assertions:
    test.ok(value, [message])
    test.equal(actual, expected, [message])
    test.notEqual(actual, expected, [message])
    test.deepEqual(actual, expected, [message])
    test.notDeepEqual(actual, expected, [message])
    test.strictEqual(actual, expected, [message])
    test.notStrictEqual(actual, expected, [message])
    test.throws(block, [error], [message])
    test.doesNotThrow(block, [error], [message])
    test.ifError(value)
*/

module.exports = {

    'merging dsp nodes works correctly': function (test) {

        var dspnode1 = DSPNode.create();
        DSPNode.addParam(dspnode1, 'param1', function (v) {
            return v;
        });
        DSPNode.addParam(dspnode1, 'param2', function (v) {
            return v;
        });
        DSPNode.addInput(dspnode1, 'input1', {});
        DSPNode.addEnvelope(dspnode1, 'start', function () {
        });
        DSPNode.addEnvelope(dspnode1, 'stop', function () {
        });
        DSPNode.addEnvelope(dspnode1, 'play', function () {
        });

        var dspnode2 = DSPNode.create();
        DSPNode.addParam(dspnode2, 'param2', function (v) {
            return v;
        });
        DSPNode.addParam(dspnode2, 'param3', function (v) {
            return v;
        });
        DSPNode.addEnvelope(dspnode2, 'start', function () {
        });
        DSPNode.addEnvelope(dspnode2, 'stop', function () {
        });


        var merged = DSPNode.merge([dspnode1, dspnode2]);

        test.ok(merged.params.param1, 'has param1');
        test.ok(merged.params.param2, 'has param2');
        test.ok(merged.params.param3, 'has param3');
        test.equal(merged.params.param1.length, 1, 'has 1 param1 function');
        test.equal(merged.params.param2.length, 2, 'has 2 param2 function');
        test.equal(merged.params.param3.length, 1, 'has 1 param3 function');
        test.equal(merged.inputs.input1.length, 1, 'has 1 input1 input');
        test.ok(merged.envelopes.start, 'has start envelope');
        test.ok(merged.envelopes.start.length, 2, 'has 1 start envelope function');
        test.ok(merged.envelopes.stop, 'has stop envelope');
        test.ok(merged.envelopes.stop.length, 2, 'has 1 stop envelope function');
        test.ok(merged.envelopes.play, 'has play envelope');
        test.ok(merged.envelopes.play.length, 1, 'has 1 play envelope function');
        test.done();
    },

    'param summer works correctly': function (test) {
        var targetnode = {};
        targetnode.value = 0;
        targetnode.set = function (v) {
            targetnode.value = v;
        };
        var paramsummer = DSPNode.createSummer(targetnode.set);
        paramsummer.incrConstant(10);
        paramsummer.setTarget();
        test.equal(targetnode.value, 10, 'initial setTarget should set to 10');

        var foonode = paramsummer.createSetNode('foo');
        var barnode = paramsummer.createSetNode('bar');

        foonode.set(4);
        test.equal(targetnode.value, 14, 'changing foo should change value');

        barnode.set(2);
        test.equal(targetnode.value, 16, 'changing bar should change value');

        foonode.set(-14);
        test.equal(targetnode.value, -2, 'changing foo again should change value');

        test.done();
    }

};


