var buster = require("buster");
var jsonpatch = require("json-patch");
var patcher = require("../js/patcher.js");

var assert = buster.referee.assert;

buster.testCase("patcher.walk", {
    "finds root": function () {
        var obj = {
            asger: 1
        };
        var result = patcher.walk(obj, '');
        assert.same(result, obj);
    },

    "finds property": function () {
        var obj = {
            asger: 1
        };
        var result = patcher.walk(obj, 'asger');
        assert.same(result, 1);
    },
    
    "finds deep property": function () {
        var obj = {
            asger: {
                property: 1
            }
        };
        var result = patcher.walk(obj, 'asger/property');
        assert.same(result, 1);
    },

    "finds deep property through array": function () {
        var obj = {
            asger: [
                { property: 1 },
                { property: 2 },
                { property: 3 }
            ]
        };
        var result = patcher.walk(obj, 'asger/1/property');
        assert.same(result, 2);
    }
});