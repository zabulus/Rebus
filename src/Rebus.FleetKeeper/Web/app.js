require('jquery');
require('./lib/jquery.signalR-2.0.0-beta2.js');
require('./lib/jquery.mousewheel.js')($);
require("angular");
              
$("body").mousewheel(function (event, delta) {
    this.scrollLeft -= (delta * 30);
    event.preventDefault();
});

var patcher = require("json-patch");

var app = angular.module('fleetkeeper', []);

app.controller('IndexController', function($scope) {
    var hub = $.connection.fleetKeeperHub;
    $scope.services = [];

    hub.client.execute = function (view, patch) {
        $scope.$apply(function () {
            patcher.apply($scope, [{
                op: patch.op,
                path: '/' + view + patch.path,
                value: patch.value
            }]);
        });
    };
});