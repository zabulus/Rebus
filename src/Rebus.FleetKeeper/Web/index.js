function IndexController($scope) {
    var hub = $.connection.fleetKeeperHub;
    $scope.busses = [];

    hub.client.setBusses = function (busses) {
        $scope.$apply(function() {
            $scope.busses = busses;
        });
    };

    hub.client.addBus = function (bus) {
        $scope.$apply(function() {
            $scope.busses.push(bus);
        });
    };
    
    hub.client.removeBus = function (id) {
        $scope.$apply(function() {
             $scope.busses.splice(_.findWhere($scope.busses, { id: id }));
        });
    };
    
    $scope.send = function () {
        $.connection.myHub.server.send('asger');
    };
}