
function IndexController($scope) {
    var hub = $.connection.fleetKeeperHub;
    $scope.endpoints = [];

    hub.client.notify = function (message) {
        if (message == 'BusStarted') {
            $scope.endpoints.push({ name: message });
        }
        
        if (message == 'BusStopped') {
            $scope.endpoints.pop();
        }

        $scope.$apply();
    };
    
    $scope.send = function () {
        $.connection.myHub.server.send('asger');
    };
}