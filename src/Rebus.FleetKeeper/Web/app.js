require('jquery');
require("angular");
require("angular_animate");

var _ = require("underscore");

require('./lib/jquery.signalR-2.0.0-beta2.js');
require('./lib/jquery.mousewheel.js')($);


$("body").mousewheel(function(event, delta) {
  this.scrollLeft -= (delta * 30);
  event.preventDefault();
});

var patcher = require("json-patch");

var app = angular.module('fleetkeeper', ['ngAnimate']);

app.directive('highlightOnChange', ['$animate',
  function($animate) {
    return {
      link: function($scope, element, attrs) {
        attrs.$observe('highlightOnChange', function(val) {
          var el = $(element);
          el.removeClass('heartbeat');
          _.defer(function() {
            el.addClass('heartbeat')
          });
        });
      }
    };
  }
]);

app.controller('IndexController', function($scope) {
  var hub = $.connection.fleetKeeperHub;
  $scope.services = [];

  hub.client.execute = function(view, patch) {
    $scope.$apply(function() {
      patcher.apply($scope, [{
        op: patch.op,
        path: '/' + view + patch.path,
        value: patch.value
      }]);
    });
  };
});