
function IndexController($scope) {
    var hub = $.connection.fleetKeeperHub;
    $scope.endpoints = [];

    hub.client.notifyBusStarted = function (message) {
        $scope.endpoints.push({ name: message });
        $scope.$apply();
    };
    
    $scope.send = function () {
        $.connection.myHub.server.send('asger');
    };
}