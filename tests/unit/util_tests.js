
var util = require('../../src/util');

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

    'merging parameter nodes works correctly': function (test) {
        var paramNode1 = {
            paramNames: ['param1', 'param2'],
            params: {
                param1: [function (v) {
                    return v;
                }],
                param2: [function (v) {
                    return v;
                }]
            }
        };
        var paramNode2 = {
            paramNames: ['param2', 'param3'],
            params: {
                param2: [function (v) {
                    return v;
                }],
                param3: [function (v) {
                    return v;
                }]
            }
        };

        var merged = util.mergeNodeParams([paramNode1, paramNode2]);

        test.ok(merged.params.param1);
        test.ok(merged.params.param2);
        test.ok(merged.params.param3);
        test.equal(merged.paramNames.length, 3);
        test.equal(merged.params.param1.length, 1);
        test.equal(merged.params.param2.length, 2);
        test.equal(merged.params.param3.length, 1);
        test.done();
    },

    'param summer works correctly': function (test) {
        var targetNode = {};
        targetNode.value = 0;
        targetNode.set = function (v) {
            targetNode.value = v;
        };
        var paramSummer = util.createParamNodeSummer({}, targetNode);

        paramSummer.constant = 10;
        paramSummer.setTarget();
        test.equal(targetNode.value, 10);

        var fooNode = paramSummer.createSetNode('foo');
        var barNode = paramSummer.createSetNode('bar');

        fooNode.set(4);
        test.equal(targetNode.value, 14);

        barNode.set(2);
        test.equal(targetNode.value, 16);

        fooNode.set(-14);
        test.equal(targetNode.value, -2);

        test.done();
    }

};


