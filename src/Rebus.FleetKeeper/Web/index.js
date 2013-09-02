
function IndexController($scope) {
    var hub = $.connection.fleetKeeperHub;
    $scope.endpoints = [];

    hub.client.addEndpoint = function (name) {
        $scope.endpoints.push({ name: name });
        $scope.$apply();
    };
    
    $scope.send = function () {
        $.connection.myHub.server.send('asger');
    };
}