require("angular");
var jsonpatch = require("json-patch");

var app = angular.module('fleetkeeper', []);

app.controller('IndexController', function($scope) {
    var hub = $.connection.fleetKeeperHub;
    $scope.services = [];

    hub.client.execute = function (command) {
        $scope.$apply(function () {
            var patch = new jsonpatch.JSONPatch([{
                op: command.action,
                path: command.path,
                value: command.value
            }], true);

            patch.apply($scope);
        });
    };
});