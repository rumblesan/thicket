
var util = {};

/**
 * obj:     Object
 * mapFunc: function (string, <V>): <T>
 * return:  Array<T>
 */
util.mapObject = function (obj, mapFunc) {
    var out = [];
    var key;
    for (key in obj) {
        if (obj.hasOwnProperty(key)) {
            out.push(mapFunc(key, obj[key]));
        }
    }
    return out;
};

/**
 * obj:      Object
 * initial:  <T>
 * foldFunc: function (<T>, string, <V>): <T>
 * return:   <T>
 */
util.foldObject = function (obj, initial, foldFunc) {
    var out = initial;
    var key;
    for (key in obj) {
        if (obj.hasOwnProperty(key)) {
            out = foldFunc(out, key, obj[key]);
        }
    }
    return out;
};

/**
 * obj:    Object
 * return: Array<String>
 */
util.getObjectKeys = function (obj) {
    var keys = [];
    util.mapObject(obj, function (k) {
        keys.push(k);
    });
    return keys;
};

/**
 * arr:     Array<A>
 * mapFunc: function (<A>): <B>
 * return:  Array<B>
 */
util.mapArray = function (arr, mapFunc) {
    var out = [];
    var i;
    for (i = 0; i < arr.length; i += 1) {
        out.push(mapFunc(arr[i]));
    }
    return out;
};

/**
 * arr:      Array<A>
 * initial:  <B>
 * foldFunc: function (<B>, <A>): <B>
 * return:   <B>
 */
util.foldArray = function (arr, initial, foldFunc) {
    var out = initial;
    var i;
    for (i = 0; i < arr.length; i += 1) {
        out = foldFunc(out, arr[i]);
    }
    return out;
};

module.exports = util;

