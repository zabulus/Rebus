;(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
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

app.directive('highlightOnChange', function($animate) {
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
});

app.controller('IndexController', function($scope) {
  var hub = $.connection.fleetKeeperHub;
  $scope.version = -1;
  $scope.services = {};

  hub.client.execute = function(view, patch) {
    $scope.$apply(function() {
      if (patch.version != $scope.version+1 && $scope.version != -1)
        return;

      $scope.version = patch.version;

      patcher.apply($scope, [{
        op: patch.op,
        path: '/' + view + patch.path,
        value: patch.value
      }]);
    });
  };
});
},{"./lib/jquery.mousewheel.js":2,"./lib/jquery.signalR-2.0.0-beta2.js":3,"json-patch":4,"underscore":5}],2:[function(require,module,exports){
/*! Copyright (c) 2013 Brandon Aaron (http://brandonaaron.net)
 * Licensed under the MIT License (LICENSE.txt).
 *
 * Thanks to: http://adomas.org/javascript-mouse-wheel/ for some pointers.
 * Thanks to: Mathias Bank(http://www.mathias-bank.de) for a scope bug fix.
 * Thanks to: Seamus Leahy for adding deltaX and deltaY
 *
 * Version: 3.1.3
 *
 * Requires: 1.2.2+
 */

(function (factory) {
    if ( typeof define === 'function' && define.amd ) {
        // AMD. Register as an anonymous module.
        define(['jquery'], factory);
    } else if (typeof exports === 'object') {
        // Node/CommonJS style for Browserify
        module.exports = factory;
    } else {
        // Browser globals
        factory(jQuery);
    }
}(function ($) {

    var toFix = ['wheel', 'mousewheel', 'DOMMouseScroll', 'MozMousePixelScroll'];
    var toBind = 'onwheel' in document || document.documentMode >= 9 ? ['wheel'] : ['mousewheel', 'DomMouseScroll', 'MozMousePixelScroll'];
    var lowestDelta, lowestDeltaXY;

    if ( $.event.fixHooks ) {
        for ( var i = toFix.length; i; ) {
            $.event.fixHooks[ toFix[--i] ] = $.event.mouseHooks;
        }
    }

    $.event.special.mousewheel = {
        setup: function() {
            if ( this.addEventListener ) {
                for ( var i = toBind.length; i; ) {
                    this.addEventListener( toBind[--i], handler, false );
                }
            } else {
                this.onmousewheel = handler;
            }
        },

        teardown: function() {
            if ( this.removeEventListener ) {
                for ( var i = toBind.length; i; ) {
                    this.removeEventListener( toBind[--i], handler, false );
                }
            } else {
                this.onmousewheel = null;
            }
        }
    };

    $.fn.extend({
        mousewheel: function(fn) {
            return fn ? this.bind("mousewheel", fn) : this.trigger("mousewheel");
        },

        unmousewheel: function(fn) {
            return this.unbind("mousewheel", fn);
        }
    });


    function handler(event) {
        var orgEvent = event || window.event,
            args = [].slice.call(arguments, 1),
            delta = 0,
            deltaX = 0,
            deltaY = 0,
            absDelta = 0,
            absDeltaXY = 0,
            fn;
        event = $.event.fix(orgEvent);
        event.type = "mousewheel";

        // Old school scrollwheel delta
        if ( orgEvent.wheelDelta ) { delta = orgEvent.wheelDelta; }
        if ( orgEvent.detail )     { delta = orgEvent.detail * -1; }

        // New school wheel delta (wheel event)
        if ( orgEvent.deltaY ) {
            deltaY = orgEvent.deltaY * -1;
            delta  = deltaY;
        }
        if ( orgEvent.deltaX ) {
            deltaX = orgEvent.deltaX;
            delta  = deltaX * -1;
        }

        // Webkit
        if ( orgEvent.wheelDeltaY !== undefined ) { deltaY = orgEvent.wheelDeltaY; }
        if ( orgEvent.wheelDeltaX !== undefined ) { deltaX = orgEvent.wheelDeltaX * -1; }

        // Look for lowest delta to normalize the delta values
        absDelta = Math.abs(delta);
        if ( !lowestDelta || absDelta < lowestDelta ) { lowestDelta = absDelta; }
        absDeltaXY = Math.max(Math.abs(deltaY), Math.abs(deltaX));
        if ( !lowestDeltaXY || absDeltaXY < lowestDeltaXY ) { lowestDeltaXY = absDeltaXY; }

        // Get a whole value for the deltas
        fn = delta > 0 ? 'floor' : 'ceil';
        delta  = Math[fn](delta / lowestDelta);
        deltaX = Math[fn](deltaX / lowestDeltaXY);
        deltaY = Math[fn](deltaY / lowestDeltaXY);

        // Add event and delta to the front of the arguments
        args.unshift(event, delta, deltaX, deltaY);

        return ($.event.dispatch || $.event.handle).apply(this, args);
    }

}));

},{}],3:[function(require,module,exports){
/* jquery.signalR.core.js */
/*global window:false */
/*!
 * ASP.NET SignalR JavaScript Library v2.0.0-beta2
 * http://signalr.net/
 *
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *
 */

/// <reference path="Scripts/jquery-1.6.4.js" />
/// <reference path="jquery.signalR.version.js" />
(function ($, window) {
    "use strict";

    if (typeof ($) !== "function") {
        // no jQuery!
        throw new Error("SignalR: jQuery not found. Please ensure jQuery is referenced before the SignalR.js file.");
    }

    var signalR,
        _connection,
        _pageLoaded = (window.document.readyState === "complete"),
        _pageWindow = $(window),
        _negotiateAbortText = "__Negotiate Aborted__",
        events = {
            onStart: "onStart",
            onStarting: "onStarting",
            onReceived: "onReceived",
            onError: "onError",
            onConnectionSlow: "onConnectionSlow",
            onReconnecting: "onReconnecting",
            onReconnect: "onReconnect",
            onStateChanged: "onStateChanged",
            onDisconnect: "onDisconnect"
        },

        log = function (msg, logging) {
            if (logging === false) {
                return;
            }
            var m;
            if (typeof (window.console) === "undefined") {
                return;
            }
            m = "[" + new Date().toTimeString() + "] SignalR: " + msg;
            if (window.console.debug) {
                window.console.debug(m);
            } else if (window.console.log) {
                window.console.log(m);
            }
        },

        changeState = function (connection, expectedState, newState) {
            if (expectedState === connection.state) {
                connection.state = newState;

                $(connection).triggerHandler(events.onStateChanged, [{ oldState: expectedState, newState: newState }]);
                return true;
            }

            return false;
        },

        isDisconnecting = function (connection) {
            return connection.state === signalR.connectionState.disconnected;
        },

        configureStopReconnectingTimeout = function (connection) {
            var stopReconnectingTimeout,
                onReconnectTimeout;

            // Check if this connection has already been configured to stop reconnecting after a specified timeout.
            // Without this check if a connection is stopped then started events will be bound multiple times.
            if (!connection._.configuredStopReconnectingTimeout) {
                onReconnectTimeout = function (connection) {
                    connection.log("Couldn't reconnect within the configured timeout (" + connection.disconnectTimeout + "ms), disconnecting.");
                    connection.stop(/* async */ false, /* notifyServer */ false);
                };

                connection.reconnecting(function () {
                    var connection = this;

                    // Guard against state changing in a previous user defined even handler
                    if (connection.state === signalR.connectionState.reconnecting) {
                        stopReconnectingTimeout = window.setTimeout(function () { onReconnectTimeout(connection); }, connection.disconnectTimeout);
                    }
                });

                connection.stateChanged(function (data) {
                    if (data.oldState === signalR.connectionState.reconnecting) {
                        // Clear the pending reconnect timeout check
                        window.clearTimeout(stopReconnectingTimeout);
                    }
                });

                connection._.configuredStopReconnectingTimeout = true;
            }
        };

    signalR = function (url, qs, logging) {
        /// <summary>Creates a new SignalR connection for the given url</summary>
        /// <param name="url" type="String">The URL of the long polling endpoint</param>
        /// <param name="qs" type="Object">
        ///     [Optional] Custom querystring parameters to add to the connection URL.
        ///     If an object, every non-function member will be added to the querystring.
        ///     If a string, it's added to the QS as specified.
        /// </param>
        /// <param name="logging" type="Boolean">
        ///     [Optional] A flag indicating whether connection logging is enabled to the browser
        ///     console/log. Defaults to false.
        /// </param>

        return new signalR.fn.init(url, qs, logging);
    };

    signalR._ = {
        defaultContentType: "application/x-www-form-urlencoded; charset=UTF-8",
        ieVersion: (function () {
            var version,
                matches;

            if (window.navigator.appName === 'Microsoft Internet Explorer') {
                // Check if the user agent has the pattern "MSIE (one or more numbers).(one or more numbers)";
                matches = /MSIE ([0-9]+\.[0-9]+)/.exec(window.navigator.userAgent);

                if (matches) {
                    version = window.parseFloat(matches[1]);
                }
            }

            // undefined value means not IE
            return version;
        })()
    };

    signalR.events = events;

    signalR.changeState = changeState;

    signalR.isDisconnecting = isDisconnecting;

    signalR.connectionState = {
        connecting: 0,
        connected: 1,
        reconnecting: 2,
        disconnected: 4
    };

    signalR.hub = {
        start: function () {
            // This will get replaced with the real hub connection start method when hubs is referenced correctly
            throw new Error("SignalR: Error loading hubs. Ensure your hubs reference is correct, e.g. <script src='/signalr/js'></script>.");
        }
    };

    _pageWindow.load(function () { _pageLoaded = true; });

    function validateTransport(requestedTransport, connection) {
        /// <summary>Validates the requested transport by cross checking it with the pre-defined signalR.transports</summary>
        /// <param name="requestedTransport" type="Object">The designated transports that the user has specified.</param>
        /// <param name="connection" type="signalR">The connection that will be using the requested transports.  Used for logging purposes.</param>
        /// <returns type="Object" />

        if ($.isArray(requestedTransport)) {
            // Go through transport array and remove an "invalid" tranports
            for (var i = requestedTransport.length - 1; i >= 0; i--) {
                var transport = requestedTransport[i];
                if ($.type(requestedTransport) !== "object" && ($.type(transport) !== "string" || !signalR.transports[transport])) {
                    connection.log("Invalid transport: " + transport + ", removing it from the transports list.");
                    requestedTransport.splice(i, 1);
                }
            }

            // Verify we still have transports left, if we dont then we have invalid transports
            if (requestedTransport.length === 0) {
                connection.log("No transports remain within the specified transport array.");
                requestedTransport = null;
            }
        } else if ($.type(requestedTransport) !== "object" && !signalR.transports[requestedTransport] && requestedTransport !== "auto") {
            connection.log("Invalid transport: " + requestedTransport.toString());
            requestedTransport = null;
        }
        else if (requestedTransport === "auto" && signalR._.ieVersion <= 8) {
            // If we're doing an auto transport and we're IE8 then force longPolling, #1764
            return ["longPolling"];

        }

        return requestedTransport;
    }

    function getDefaultPort(protocol) {
        if (protocol === "http:") {
            return 80;
        }
        else if (protocol === "https:") {
            return 443;
        }
    }

    function addDefaultPort(protocol, url) {
        // Remove ports  from url.  We have to check if there's a / or end of line
        // following the port in order to avoid removing ports such as 8080.
        if (url.match(/:\d+$/)) {
            return url;
        } else {
            return url + ":" + getDefaultPort(protocol);
        }
    }

    function ConnectingMessageBuffer(connection, drainCallback) {
        var that = this,
            buffer = [];

        that.tryBuffer = function (message) {
            if (connection.state === $.signalR.connectionState.connecting) {
                buffer.push(message);

                return true;
            }

            return false;
        };

        that.drain = function () {
            // Ensure that the connection is connected when we drain (do not want to drain while a connection is not active)
            if (connection.state === $.signalR.connectionState.connected) {
                while (buffer.length > 0) {
                    drainCallback(buffer.shift());
                }
            }
        };

        that.clear = function () {
            buffer = [];
        };
    }

    signalR.fn = signalR.prototype = {
        init: function (url, qs, logging) {
            var $connection = $(this);

            this.url = url;
            this.qs = qs;
            this._ = {
                connectingMessageBuffer: new ConnectingMessageBuffer(this, function (message) {
                    $connection.triggerHandler(events.onReceived, [message]);
                }),
                onFailedTimeoutHandle: null
            };
            if (typeof (logging) === "boolean") {
                this.logging = logging;
            }
        },

        _parseResponse: function (response) {
            var that = this;

            if (!response) {
                return response;
            } else if (that.ajaxDataType === "text") {
                return that.json.parse(response);
            } else {
                return response;
            }
        },

        json: window.JSON,

        isCrossDomain: function (url, against) {
            /// <summary>Checks if url is cross domain</summary>
            /// <param name="url" type="String">The base URL</param>
            /// <param name="against" type="Object">
            ///     An optional argument to compare the URL against, if not specified it will be set to window.location.
            ///     If specified it must contain a protocol and a host property.
            /// </param>
            var link;

            url = $.trim(url);
            if (url.indexOf("http") !== 0) {
                return false;
            }

            against = against || window.location;

            // Create an anchor tag.
            link = window.document.createElement("a");
            link.href = url;

            // When checking for cross domain we have to special case port 80 because the window.location will remove the 
            return link.protocol + addDefaultPort(link.protocol, link.host) !== against.protocol + addDefaultPort(against.protocol, against.host);
        },

        ajaxDataType: "text",

        contentType: "application/json; charset=UTF-8",

        logging: false,

        state: signalR.connectionState.disconnected,

        keepAliveData: {},

        clientProtocol: "1.3",

        reconnectDelay: 2000,

        transportConnectTimeout: 0, // This will be modified by the server in respone to the negotiate request.  It will add any value sent down from the server to the client value.

        disconnectTimeout: 30000, // This should be set by the server in response to the negotiate request (30s default)

        keepAliveWarnAt: 2 / 3, // Warn user of slow connection if we breach the X% mark of the keep alive timeout

        start: function (options, callback) {
            /// <summary>Starts the connection</summary>
            /// <param name="options" type="Object">Options map</param>
            /// <param name="callback" type="Function">A callback function to execute when the connection has started</param>
            var connection = this,
                config = {
                    waitForPageLoad: true,
                    transport: "auto",
                    jsonp: false
                },
                initialize,
                deferred = connection._deferral || $.Deferred(), // Check to see if there is a pre-existing deferral that's being built on, if so we want to keep using it
                parser = window.document.createElement("a");

            // Persist the deferral so that if start is called multiple times the same deferral is used.
            connection._deferral = deferred;

            if (!connection.json) {
                // no JSON!
                throw new Error("SignalR: No JSON parser found. Please ensure json2.js is referenced before the SignalR.js file if you need to support clients without native JSON parsing support, e.g. IE<8.");
            }

            if ($.type(options) === "function") {
                // Support calling with single callback parameter
                callback = options;
            } else if ($.type(options) === "object") {
                $.extend(config, options);
                if ($.type(config.callback) === "function") {
                    callback = config.callback;
                }
            }

            config.transport = validateTransport(config.transport, connection);

            // If the transport is invalid throw an error and abort start
            if (!config.transport) {
                throw new Error("SignalR: Invalid transport(s) specified, aborting start.");
            }

            connection._.config = config;

            // Check to see if start is being called prior to page load
            // If waitForPageLoad is true we then want to re-direct function call to the window load event
            if (!_pageLoaded && config.waitForPageLoad === true) {
                _pageWindow.load(function () {
                    connection.start(options, callback);
                });
                return deferred.promise();
            }

            configureStopReconnectingTimeout(connection);

            // If we're already connecting just return the same deferral as the original connection start
            if (connection.state === signalR.connectionState.connecting) {
                return deferred.promise();
            }
            else if (changeState(connection,
                            signalR.connectionState.disconnected,
                            signalR.connectionState.connecting) === false) {
                // We're not connecting so try and transition into connecting.
                // If we fail to transition then we're either in connected or reconnecting.

                deferred.resolve(connection);
                return deferred.promise();
            }

            // Resolve the full url
            parser.href = connection.url;
            if (!parser.protocol || parser.protocol === ":") {
                connection.protocol = window.document.location.protocol;
                connection.host = window.document.location.host;
                connection.baseUrl = connection.protocol + "//" + connection.host;
            }
            else {
                connection.protocol = parser.protocol;
                connection.host = parser.host;
                connection.baseUrl = parser.protocol + "//" + parser.host;
            }

            // Set the websocket protocol
            connection.wsProtocol = connection.protocol === "https:" ? "wss://" : "ws://";

            // If jsonp with no/auto transport is specified, then set the transport to long polling
            // since that is the only transport for which jsonp really makes sense.
            // Some developers might actually choose to specify jsonp for same origin requests
            // as demonstrated by Issue #623.
            if (config.transport === "auto" && config.jsonp === true) {
                config.transport = "longPolling";
            }

            if (this.isCrossDomain(connection.url)) {
                connection.log("Auto detected cross domain url.");

                if (config.transport === "auto") {
                    // Try webSockets and longPolling since SSE doesn't support CORS
                    // TODO: Support XDM with foreverFrame
                    config.transport = ["webSockets", "longPolling"];
                }

                // Determine if jsonp is the only choice for negotiation, ajaxSend and ajaxAbort.
                // i.e. if the browser doesn't supports CORS
                // If it is, ignore any preference to the contrary, and switch to jsonp.
                if (!config.jsonp) {
                    config.jsonp = !$.support.cors;

                    if (config.jsonp) {
                        connection.log("Using jsonp because this browser doesn't support CORS");
                    }
                }

                connection.contentType = signalR._.defaultContentType;
            }

            connection.ajaxDataType = config.jsonp ? "jsonp" : "text";

            $(connection).bind(events.onStart, function (e, data) {
                if ($.type(callback) === "function") {
                    callback.call(connection);
                }
                deferred.resolve(connection);
            });

            initialize = function (transports, index) {
                index = index || 0;
                if (index >= transports.length) {
                    // No transport initialized successfully
                    $(connection).triggerHandler(events.onError, ["SignalR: No transport could be initialized successfully. Try specifying a different transport or none at all for auto initialization."]);
                    deferred.reject("SignalR: No transport could be initialized successfully. Try specifying a different transport or none at all for auto initialization.");
                    // Stop the connection if it has connected and move it into the disconnected state
                    connection.stop();
                    return;
                }

                // The connection was aborted
                if (connection.state === signalR.connectionState.disconnected) {
                    return;
                }

                var transportName = transports[index],
                    transport = $.type(transportName) === "object" ? transportName : signalR.transports[transportName],
                    initializationComplete = false,
                    onFailed = function () {
                        // Check if we've already triggered onFailed, onStart
                        if (!initializationComplete) {
                            initializationComplete = true;
                            window.clearTimeout(connection._.onFailedTimeoutHandle);
                            transport.stop(connection);
                            initialize(transports, index + 1);
                        }
                    };

                connection.transport = transport;

                if (transportName.indexOf("_") === 0) {
                    // Private member
                    initialize(transports, index + 1);
                    return;
                }

                try {
                    connection._.onFailedTimeoutHandle = window.setTimeout(function () {
                        connection.log(transport.name + " timed out when trying to connect.");
                        onFailed();
                    }, connection.transportConnectTimeout);

                    transport.start(connection, function () { // success
                        // The connection was aborted while initializing transports
                        if (connection.state === signalR.connectionState.disconnected) {
                            return;
                        }

                        if (!initializationComplete) {
                            initializationComplete = true;

                            window.clearTimeout(connection._.onFailedTimeoutHandle);

                            if (transport.supportsKeepAlive && connection.keepAliveData.activated) {
                                signalR.transports._logic.monitorKeepAlive(connection);
                            }

                            changeState(connection,
                                        signalR.connectionState.connecting,
                                        signalR.connectionState.connected);

                            // Drain any incoming buffered messages (messages that came in prior to connect)
                            connection._.connectingMessageBuffer.drain();

                            $(connection).triggerHandler(events.onStart);

                            // wire the stop handler for when the user leaves the page
                            _pageWindow.unload(function () {
                                connection.stop(false /* async */);
                            });
                        }
                    }, onFailed);
                }
                catch (error) {
                    connection.log("SignalR: " + transport.name + " transport threw '" + error.message + "' when attempting to start.");
                    onFailed();
                }
            };

            var url = connection.url + "/negotiate";

            url = signalR.transports._logic.addQs(url, connection.qs);

            // Add the client version to the negotiate request.  We utilize the same addQs method here
            // so that it can append the clientVersion appropriately to the URL
            url = signalR.transports._logic.addQs(url, {
                clientProtocol: connection.clientProtocol
            });

            connection.log("Negotiating with '" + url + "'.");

            // Save the ajax negotiate request object so we can abort it if stop is called while the request is in flight.
            connection._.negotiateRequest = $.ajax({
                url: url,
                global: false,
                cache: false,
                type: "GET",
                contentType: connection.contentType,
                data: {},
                dataType: connection.ajaxDataType,
                error: function (error, statusText) {
                    // We don't want to cause any errors if we're aborting our own negotiate request.
                    if (statusText !== _negotiateAbortText) {
                        $(connection).triggerHandler(events.onError, [error.responseText]);
                        deferred.reject("SignalR: Error during negotiation request: " + error.responseText);
                        // Stop the connection if negotiate failed
                        connection.stop();
                    }
                },
                success: function (result) {
                    var res = connection._parseResponse(result),
                        keepAliveData = connection.keepAliveData;

                    connection.appRelativeUrl = res.Url;
                    connection.id = res.ConnectionId;
                    connection.token = res.ConnectionToken;
                    connection.webSocketServerUrl = res.WebSocketServerUrl;

                    // Once the server has labeled the PersistentConnection as Disconnected, we should stop attempting to reconnect
                    // after res.DisconnectTimeout seconds.
                    connection.disconnectTimeout = res.DisconnectTimeout * 1000; // in ms

                    // If the connection already has a transportConnectTimeout set then keep it, otherwise use the servers value.
                    connection.transportConnectTimeout = connection.transportConnectTimeout + res.TransportConnectTimeout * 1000;

                    // If we have a keep alive
                    if (res.KeepAliveTimeout) {
                        // Register the keep alive data as activated
                        keepAliveData.activated = true;

                        // Timeout to designate when to force the connection into reconnecting converted to milliseconds
                        keepAliveData.timeout = res.KeepAliveTimeout * 1000;

                        // Timeout to designate when to warn the developer that the connection may be dead or is hanging.
                        keepAliveData.timeoutWarning = keepAliveData.timeout * connection.keepAliveWarnAt;

                        // Instantiate the frequency in which we check the keep alive.  It must be short in order to not miss/pick up any changes
                        keepAliveData.checkInterval = (keepAliveData.timeout - keepAliveData.timeoutWarning) / 3;
                    }
                    else {
                        keepAliveData.activated = false;
                    }

                    if (!res.ProtocolVersion || res.ProtocolVersion !== connection.clientProtocol) {
                        $(connection).triggerHandler(events.onError, ["You are using a version of the client that isn't compatible with the server. Client version " + connection.clientProtocol + ", server version " + res.ProtocolVersion + "."]);
                        deferred.reject("You are using a version of the client that isn't compatible with the server. Client version " + connection.clientProtocol + ", server version " + res.ProtocolVersion + ".");
                        return;
                    }

                    $(connection).triggerHandler(events.onStarting);

                    var transports = [],
                        supportedTransports = [];

                    $.each(signalR.transports, function (key) {
                        if (key === "webSockets" && !res.TryWebSockets) {
                            // Server said don't even try WebSockets, but keep processing the loop
                            return true;
                        }
                        supportedTransports.push(key);
                    });

                    if ($.isArray(config.transport)) {
                        // ordered list provided
                        $.each(config.transport, function () {
                            var transport = this;
                            if ($.type(transport) === "object" || ($.type(transport) === "string" && $.inArray("" + transport, supportedTransports) >= 0)) {
                                transports.push($.type(transport) === "string" ? "" + transport : transport);
                            }
                        });
                    } else if ($.type(config.transport) === "object" ||
                                    $.inArray(config.transport, supportedTransports) >= 0) {
                        // specific transport provided, as object or a named transport, e.g. "longPolling"
                        transports.push(config.transport);
                    } else { // default "auto"
                        transports = supportedTransports;
                    }
                    initialize(transports);
                }
            });

            return deferred.promise();
        },

        starting: function (callback) {
            /// <summary>Adds a callback that will be invoked before anything is sent over the connection</summary>
            /// <param name="callback" type="Function">A callback function to execute before each time data is sent on the connection</param>
            /// <returns type="signalR" />
            var connection = this;
            $(connection).bind(events.onStarting, function (e, data) {
                callback.call(connection);
            });
            return connection;
        },

        send: function (data) {
            /// <summary>Sends data over the connection</summary>
            /// <param name="data" type="String">The data to send over the connection</param>
            /// <returns type="signalR" />
            var connection = this;

            if (connection.state === signalR.connectionState.disconnected) {
                // Connection hasn't been started yet
                throw new Error("SignalR: Connection must be started before data can be sent. Call .start() before .send()");
            }

            if (connection.state === signalR.connectionState.connecting) {
                // Connection hasn't been started yet
                throw new Error("SignalR: Connection has not been fully initialized. Use .start().done() or .start().fail() to run logic after the connection has started.");
            }

            connection.transport.send(connection, data);
            // REVIEW: Should we return deferred here?
            return connection;
        },

        received: function (callback) {
            /// <summary>Adds a callback that will be invoked after anything is received over the connection</summary>
            /// <param name="callback" type="Function">A callback function to execute when any data is received on the connection</param>
            /// <returns type="signalR" />
            var connection = this;
            $(connection).bind(events.onReceived, function (e, data) {
                if (!connection._.connectingMessageBuffer.tryBuffer(data)) {
                    callback.call(connection, data);
                }
            });
            return connection;
        },

        stateChanged: function (callback) {
            /// <summary>Adds a callback that will be invoked when the connection state changes</summary>
            /// <param name="callback" type="Function">A callback function to execute when the connection state changes</param>
            /// <returns type="signalR" />
            var connection = this;
            $(connection).bind(events.onStateChanged, function (e, data) {
                callback.call(connection, data);
            });
            return connection;
        },

        error: function (callback) {
            /// <summary>Adds a callback that will be invoked after an error occurs with the connection</summary>
            /// <param name="callback" type="Function">A callback function to execute when an error occurs on the connection</param>
            /// <returns type="signalR" />
            var connection = this;
            $(connection).bind(events.onError, function (e, data) {
                callback.call(connection, data);
            });
            return connection;
        },

        disconnected: function (callback) {
            /// <summary>Adds a callback that will be invoked when the client disconnects</summary>
            /// <param name="callback" type="Function">A callback function to execute when the connection is broken</param>
            /// <returns type="signalR" />
            var connection = this;
            $(connection).bind(events.onDisconnect, function (e, data) {
                callback.call(connection);
            });
            return connection;
        },

        connectionSlow: function (callback) {
            /// <summary>Adds a callback that will be invoked when the client detects a slow connection</summary>
            /// <param name="callback" type="Function">A callback function to execute when the connection is slow</param>
            /// <returns type="signalR" />
            var connection = this;
            $(connection).bind(events.onConnectionSlow, function (e, data) {
                callback.call(connection);
            });

            return connection;
        },

        reconnecting: function (callback) {
            /// <summary>Adds a callback that will be invoked when the underlying transport begins reconnecting</summary>
            /// <param name="callback" type="Function">A callback function to execute when the connection enters a reconnecting state</param>
            /// <returns type="signalR" />
            var connection = this;
            $(connection).bind(events.onReconnecting, function (e, data) {
                callback.call(connection);
            });
            return connection;
        },

        reconnected: function (callback) {
            /// <summary>Adds a callback that will be invoked when the underlying transport reconnects</summary>
            /// <param name="callback" type="Function">A callback function to execute when the connection is restored</param>
            /// <returns type="signalR" />
            var connection = this;
            $(connection).bind(events.onReconnect, function (e, data) {
                callback.call(connection);
            });
            return connection;
        },

        stop: function (async, notifyServer) {
            /// <summary>Stops listening</summary>
            /// <param name="async" type="Boolean">Whether or not to asynchronously abort the connection</param>
            /// <param name="notifyServer" type="Boolean">Whether we want to notify the server that we are aborting the connection</param>
            /// <returns type="signalR" />
            var connection = this;

            // Verify that we should wait for page load to call stop.
            if (!_pageLoaded && (!connection._.config || connection._.config.waitForPageLoad === true)) {
                // Can only stop connections after the page has loaded
                _pageWindow.load(function () {
                    connection.stop(async, notifyServer);
                });

                return;
            }

            if (connection.state === signalR.connectionState.disconnected) {
                return;
            }

            try {
                connection.log("SignalR: Stopping connection.");

                // Clear this no matter what
                window.clearTimeout(connection._.onFailedTimeoutHandle);

                if (connection.transport) {
                    if (notifyServer !== false) {
                        connection.transport.abort(connection, async);
                    }

                    if (connection.transport.supportsKeepAlive && connection.keepAliveData.activated) {
                        signalR.transports._logic.stopMonitoringKeepAlive(connection);
                    }

                    connection.transport.stop(connection);
                    connection.transport = null;
                }

                if (connection._.negotiateRequest) {
                    // If the negotiation request has already completed this will noop.
                    connection._.negotiateRequest.abort(_negotiateAbortText);
                    delete connection._.negotiateRequest;
                }

                // Trigger the disconnect event
                $(connection).triggerHandler(events.onDisconnect);

                delete connection.messageId;
                delete connection.groupsToken;

                // Remove the ID and the deferral on stop, this is to ensure that if a connection is restarted it takes on a new id/deferral.
                delete connection.id;
                delete connection._deferral;
                delete connection._.config;

                // Clear out our message buffer
                connection._.connectingMessageBuffer.clear();
            }
            finally {
                changeState(connection, connection.state, signalR.connectionState.disconnected);
            }

            return connection;
        },

        log: function (msg) {
            log(msg, this.logging);
        }
    };

    signalR.fn.init.prototype = signalR.fn;

    signalR.noConflict = function () {
        /// <summary>Reinstates the original value of $.connection and returns the signalR object for manual assignment</summary>
        /// <returns type="signalR" />
        if ($.connection === signalR) {
            $.connection = _connection;
        }
        return signalR;
    };

    if ($.connection) {
        _connection = $.connection;
    }

    $.connection = $.signalR = signalR;

}(window.jQuery, window));
/* jquery.signalR.transports.common.js */
// Copyright (c) Microsoft Open Technologies, Inc. All rights reserved. See License.md in the project root for license information.

/*global window:false */
/// <reference path="jquery.signalR.core.js" />

(function ($, window) {
    "use strict";

    var signalR = $.signalR,
        events = $.signalR.events,
        changeState = $.signalR.changeState,
        transportLogic;

    signalR.transports = {};

    function checkIfAlive(connection) {
        var keepAliveData = connection.keepAliveData,
            diff,
            timeElapsed;

        // Only check if we're connected
        if (connection.state === signalR.connectionState.connected) {
            diff = new Date();

            diff.setTime(diff - keepAliveData.lastKeepAlive);
            timeElapsed = diff.getTime();

            // Check if the keep alive has completely timed out
            if (timeElapsed >= keepAliveData.timeout) {
                connection.log("Keep alive timed out.  Notifying transport that connection has been lost.");

                // Notify transport that the connection has been lost
                connection.transport.lostConnection(connection);
            }
            else if (timeElapsed >= keepAliveData.timeoutWarning) {
                // This is to assure that the user only gets a single warning
                if (!keepAliveData.userNotified) {
                    connection.log("Keep alive has been missed, connection may be dead/slow.");
                    $(connection).triggerHandler(events.onConnectionSlow);
                    keepAliveData.userNotified = true;
                }
            }
            else {
                keepAliveData.userNotified = false;
            }
        }

        // Verify we're monitoring the keep alive
        // We don't want this as a part of the inner if statement above because we want keep alives to continue to be checked
        // in the event that the server comes back online (if it goes offline).
        if (keepAliveData.monitoring) {
            window.setTimeout(function () {
                checkIfAlive(connection);
            }, keepAliveData.checkInterval);
        }
    }

    function isConnectedOrReconnecting(connection) {
        return connection.state === signalR.connectionState.connected ||
               connection.state === signalR.connectionState.reconnecting;
    }

    transportLogic = signalR.transports._logic = {
        pingServer: function (connection, transport) {
            /// <summary>Pings the server</summary>
            /// <param name="connection" type="signalr">Connection associated with the server ping</param>
            /// <returns type="signalR" />
            var baseUrl = transport === "webSockets" ? "" : connection.baseUrl,
                url = baseUrl + connection.appRelativeUrl + "/ping",
                deferral = $.Deferred();

            url = this.addQs(url, connection.qs);

            $.ajax({
                url: url,
                global: false,
                cache: false,
                type: "GET",
                contentType: connection.contentType,
                data: {},
                dataType: connection.ajaxDataType,
                success: function (result) {
                    var data = connection._parseResponse(result);

                    if (data.Response === "pong") {
                        deferral.resolve();
                    }
                    else {
                        deferral.reject("SignalR: Invalid ping response when pinging server: " + (data.responseText || data.statusText));
                    }
                },
                error: function (data) {
                    deferral.reject("SignalR: Error pinging server: " + (data.responseText || data.statusText));
                }
            });

            return deferral.promise();
        },

        addQs: function (url, qs) {
            var appender = url.indexOf("?") !== -1 ? "&" : "?",
                firstChar;

            if (!qs) {
                return url;
            }

            if (typeof (qs) === "object") {
                return url + appender + $.param(qs);
            }

            if (typeof (qs) === "string") {
                firstChar = qs.charAt(0);

                if (firstChar === "?" || firstChar === "&") {
                    appender = "";
                }

                return url + appender + qs;
            }

            throw new Error("Query string property must be either a string or object.");
        },

        getUrl: function (connection, transport, reconnecting, poll) {
            /// <summary>Gets the url for making a GET based connect request</summary>
            var baseUrl = transport === "webSockets" ? "" : connection.baseUrl,
                url = baseUrl + connection.appRelativeUrl,
                qs = "transport=" + transport + "&connectionToken=" + window.encodeURIComponent(connection.token);

            if (connection.data) {
                qs += "&connectionData=" + window.encodeURIComponent(connection.data);
            }

            if (connection.groupsToken) {
                qs += "&groupsToken=" + window.encodeURIComponent(connection.groupsToken);
            }

            if (!reconnecting) {
                url += "/connect";
            } else {
                if (poll) {
                    // longPolling transport specific
                    url += "/poll";
                } else {
                    url += "/reconnect";
                }

                if (connection.messageId) {
                    qs += "&messageId=" + window.encodeURIComponent(connection.messageId);
                }
            }
            url += "?" + qs;
            url = transportLogic.addQs(url, connection.qs);
            url += "&tid=" + Math.floor(Math.random() * 11);
            return url;
        },

        maximizePersistentResponse: function (minPersistentResponse) {
            return {
                MessageId: minPersistentResponse.C,
                Messages: minPersistentResponse.M,
                Initialized: typeof (minPersistentResponse.S) !== "undefined" ? true : false,
                Disconnect: typeof (minPersistentResponse.D) !== "undefined" ? true : false,
                TimedOut: typeof (minPersistentResponse.T) !== "undefined" ? true : false,
                LongPollDelay: minPersistentResponse.L,
                GroupsToken: minPersistentResponse.G
            };
        },

        updateGroups: function (connection, groupsToken) {
            if (groupsToken) {
                connection.groupsToken = groupsToken;
            }
        },

        ajaxSend: function (connection, data) {
            var url = connection.url + "/send" + "?transport=" + connection.transport.name + "&connectionToken=" + window.encodeURIComponent(connection.token);
            url = this.addQs(url, connection.qs);
            return $.ajax({
                url: url,
                global: false,
                type: connection.ajaxDataType === "jsonp" ? "GET" : "POST",
                contentType: signalR._.defaultContentType,
                dataType: connection.ajaxDataType,
                data: {
                    data: data
                },
                success: function (result) {
                    if (result) {
                        $(connection).triggerHandler(events.onReceived, [connection._parseResponse(result)]);
                    }
                },
                error: function (errData, textStatus) {
                    if (textStatus === "abort" || textStatus === "parsererror") {
                        // The parsererror happens for sends that don't return any data, and hence
                        // don't write the jsonp callback to the response. This is harder to fix on the server
                        // so just hack around it on the client for now.
                        return;
                    }
                    $(connection).triggerHandler(events.onError, [errData]);
                }
            });
        },

        ajaxAbort: function (connection, async) {
            if (typeof (connection.transport) === "undefined") {
                return;
            }

            // Async by default unless explicitly overidden
            async = typeof async === "undefined" ? true : async;

            var url = connection.url + "/abort" + "?transport=" + connection.transport.name + "&connectionToken=" + window.encodeURIComponent(connection.token);
            url = this.addQs(url, connection.qs);
            $.ajax({
                url: url,
                async: async,
                timeout: 1000,
                global: false,
                type: "POST",
                contentType: connection.contentType,
                dataType: connection.ajaxDataType,
                data: {}
            });

            connection.log("Fired ajax abort async = " + async);
        },

        tryInitialize: function (persistentResponse, onInitialized) {
            if (persistentResponse.Initialized) {
                onInitialized();
            }
        },

        processMessages: function (connection, minData, onInitialized) {
            var data,
                $connection = $(connection);

            // If our transport supports keep alive then we need to update the last keep alive time stamp.
            // Very rarely the transport can be null.
            if (connection.transport && connection.transport.supportsKeepAlive && connection.keepAliveData.activated) {
                this.updateKeepAlive(connection);
            }

            if (minData) {
                data = this.maximizePersistentResponse(minData);

                if (data.Disconnect) {
                    connection.log("Disconnect command received from server");

                    // Disconnected by the server
                    connection.stop(false, false);
                    return;
                }

                this.updateGroups(connection, data.GroupsToken);

                if (data.MessageId) {
                    connection.messageId = data.MessageId;
                }

                if (data.Messages) {
                    $.each(data.Messages, function (index, message) {
                        $connection.triggerHandler(events.onReceived, [message]);
                    });

                    transportLogic.tryInitialize(data, onInitialized);
                }
            }
        },

        monitorKeepAlive: function (connection) {
            var keepAliveData = connection.keepAliveData,
                that = this;

            // If we haven't initiated the keep alive timeouts then we need to
            if (!keepAliveData.monitoring) {
                keepAliveData.monitoring = true;

                // Initialize the keep alive time stamp ping
                that.updateKeepAlive(connection);

                // Save the function so we can unbind it on stop
                connection.keepAliveData.reconnectKeepAliveUpdate = function () {
                    that.updateKeepAlive(connection);
                };

                // Update Keep alive on reconnect
                $(connection).bind(events.onReconnect, connection.keepAliveData.reconnectKeepAliveUpdate);

                connection.log("Now monitoring keep alive with a warning timeout of " + keepAliveData.timeoutWarning + " and a connection lost timeout of " + keepAliveData.timeout);
                // Start the monitoring of the keep alive
                checkIfAlive(connection);
            }
            else {
                connection.log("Tried to monitor keep alive but it's already being monitored");
            }
        },

        stopMonitoringKeepAlive: function (connection) {
            var keepAliveData = connection.keepAliveData;

            // Only attempt to stop the keep alive monitoring if its being monitored
            if (keepAliveData.monitoring) {
                // Stop monitoring
                keepAliveData.monitoring = false;

                // Remove the updateKeepAlive function from the reconnect event
                $(connection).unbind(events.onReconnect, connection.keepAliveData.reconnectKeepAliveUpdate);

                // Clear all the keep alive data
                connection.keepAliveData = {};
                connection.log("Stopping the monitoring of the keep alive");
            }
        },

        updateKeepAlive: function (connection) {
            connection.keepAliveData.lastKeepAlive = new Date();
        },

        ensureReconnectingState: function (connection) {
            if (changeState(connection,
                        signalR.connectionState.connected,
                        signalR.connectionState.reconnecting) === true) {
                $(connection).triggerHandler(events.onReconnecting);
            }
            return connection.state === signalR.connectionState.reconnecting;
        },

        clearReconnectTimeout: function (connection) {
            if (connection && connection._.reconnectTimeout) {
                window.clearTimeout(connection._.reconnectTimeout);
                delete connection._.reconnectTimeout;
            }
        },

        reconnect: function (connection, transportName) {
            var transport = signalR.transports[transportName],
                that = this;

            // We should only set a reconnectTimeout if we are currently connected
            // and a reconnectTimeout isn't already set.
            if (isConnectedOrReconnecting(connection) && !connection._.reconnectTimeout) {

                connection._.reconnectTimeout = window.setTimeout(function () {
                    transport.stop(connection);

                    if (that.ensureReconnectingState(connection)) {
                        connection.log(transportName + " reconnecting");
                        transport.start(connection);
                    }
                }, connection.reconnectDelay);
            }
        },

        foreverFrame: {
            count: 0,
            connections: {}
        }
    };

}(window.jQuery, window));
/* jquery.signalR.transports.webSockets.js */
// Copyright (c) Microsoft Open Technologies, Inc. All rights reserved. See License.md in the project root for license information.

/*global window:false */
/// <reference path="jquery.signalR.transports.common.js" />

(function ($, window) {
    "use strict";

    var signalR = $.signalR,
        events = $.signalR.events,
        changeState = $.signalR.changeState,
        transportLogic = signalR.transports._logic;

    signalR.transports.webSockets = {
        name: "webSockets",

        supportsKeepAlive: true,

        send: function (connection, data) {
            connection.socket.send(data);
        },

        start: function (connection, onSuccess, onFailed) {
            var url,
                opened = false,
                that = this,
                reconnecting = !onSuccess,
                $connection = $(connection);

            if (!window.WebSocket) {
                onFailed();
                return;
            }

            if (!connection.socket) {
                if (connection.webSocketServerUrl) {
                    url = connection.webSocketServerUrl;
                }
                else {
                    url = connection.wsProtocol + connection.host;
                }

                url += transportLogic.getUrl(connection, this.name, reconnecting);

                connection.log("Connecting to websocket endpoint '" + url + "'");
                connection.socket = new window.WebSocket(url);

                connection.socket.onopen = function () {
                    opened = true;
                    connection.log("Websocket opened");

                    transportLogic.clearReconnectTimeout(connection);

                    if (changeState(connection,
                                    signalR.connectionState.reconnecting,
                                    signalR.connectionState.connected) === true) {
                        $connection.triggerHandler(events.onReconnect);
                    }
                };

                connection.socket.onclose = function (event) {
                    // Only handle a socket close if the close is from the current socket.
                    // Sometimes on disconnect the server will push down an onclose event
                    // to an expired socket.

                    if (this === connection.socket) {
                        if (!opened) {
                            if (onFailed) {
                                onFailed();
                            }
                            else if (reconnecting) {
                                that.reconnect(connection);
                            }
                            return;
                        }
                        else if (typeof event.wasClean !== "undefined" && event.wasClean === false) {
                            // Ideally this would use the websocket.onerror handler (rather than checking wasClean in onclose) but
                            // I found in some circumstances Chrome won't call onerror. This implementation seems to work on all browsers.
                            $(connection).triggerHandler(events.onError, [event.reason]);
                            connection.log("Unclean disconnect from websocket." + event.reason);
                        }
                        else {
                            connection.log("Websocket closed");
                        }

                        that.reconnect(connection);
                    }
                };

                connection.socket.onmessage = function (event) {
                    var data = connection._parseResponse(event.data),
                        $connection = $(connection);

                    if (data) {
                        // data.M is PersistentResponse.Messages
                        if ($.isEmptyObject(data) || data.M) {
                            transportLogic.processMessages(connection, data, onSuccess);
                        } else {
                            // For websockets we need to trigger onReceived
                            // for callbacks to outgoing hub calls.
                            $connection.triggerHandler(events.onReceived, [data]);
                        }
                    }
                };
            }
        },

        reconnect: function (connection) {
            transportLogic.reconnect(connection, this.name);
        },

        lostConnection: function (connection) {
            this.reconnect(connection);
        },

        stop: function (connection) {
            // Don't trigger a reconnect after stopping
            transportLogic.clearReconnectTimeout(connection);

            if (connection.socket) {
                connection.log("Closing the Websocket");
                connection.socket.close();
                connection.socket = null;
            }
        },

        abort: function (connection) {
        }
    };

}(window.jQuery, window));
/* jquery.signalR.transports.serverSentEvents.js */
// Copyright (c) Microsoft Open Technologies, Inc. All rights reserved. See License.md in the project root for license information.

/*global window:false */
/// <reference path="jquery.signalR.transports.common.js" />

(function ($, window) {
    "use strict";

    var signalR = $.signalR,
        events = $.signalR.events,
        changeState = $.signalR.changeState,
        transportLogic = signalR.transports._logic;

    signalR.transports.serverSentEvents = {
        name: "serverSentEvents",

        supportsKeepAlive: true,

        timeOut: 3000,

        start: function (connection, onSuccess, onFailed) {
            var that = this,
                opened = false,
                $connection = $(connection),
                reconnecting = !onSuccess,
                url,
                reconnectTimeout;

            if (connection.eventSource) {
                connection.log("The connection already has an event source. Stopping it.");
                connection.stop();
            }

            if (!window.EventSource) {
                if (onFailed) {
                    connection.log("This browser doesn't support SSE.");
                    onFailed();
                }
                return;
            }

            url = transportLogic.getUrl(connection, this.name, reconnecting);

            try {
                connection.log("Attempting to connect to SSE endpoint '" + url + "'");
                connection.eventSource = new window.EventSource(url);
            }
            catch (e) {
                connection.log("EventSource failed trying to connect with error " + e.Message);
                if (onFailed) {
                    // The connection failed, call the failed callback
                    onFailed();
                }
                else {
                    $connection.triggerHandler(events.onError, [e]);
                    if (reconnecting) {
                        // If we were reconnecting, rather than doing initial connect, then try reconnect again
                        that.reconnect(connection);
                    }
                }
                return;
            }

            if (reconnecting) {
                reconnectTimeout = window.setTimeout(function () {
                    if (opened === false) {
                        // If we're reconnecting and the event source is attempting to connect,
                        // don't keep retrying. This causes duplicate connections to spawn.
                        if (connection.eventSource.readyState !== window.EventSource.CONNECTING &&
                            connection.eventSource.readyState !== window.EventSource.OPEN) {
                            // If we were reconnecting, rather than doing initial connect, then try reconnect again
                            that.reconnect(connection);
                        }
                    }
                },
                that.timeOut);
            }

            connection.eventSource.addEventListener("open", function (e) {
                connection.log("EventSource connected");

                if (reconnectTimeout) {
                    window.clearTimeout(reconnectTimeout);
                }

                transportLogic.clearReconnectTimeout(connection);

                if (opened === false) {
                    opened = true;

                    if (changeState(connection,
                                         signalR.connectionState.reconnecting,
                                         signalR.connectionState.connected) === true) {
                        $connection.triggerHandler(events.onReconnect);
                    }
                }
            }, false);

            connection.eventSource.addEventListener("message", function (e) {
                // process messages
                if (e.data === "initialized") {
                    return;
                }

                transportLogic.processMessages(connection, connection._parseResponse(e.data), onSuccess);
            }, false);

            connection.eventSource.addEventListener("error", function (e) {
                // Only handle an error if the error is from the current Event Source.
                // Sometimes on disconnect the server will push down an error event
                // to an expired Event Source.
                if (this === connection.eventSource) {
                    if (!opened) {
                        if (onFailed) {
                            onFailed();
                        }

                        return;
                    }

                    connection.log("EventSource readyState: " + connection.eventSource.readyState);

                    if (e.eventPhase === window.EventSource.CLOSED) {
                        // We don't use the EventSource's native reconnect function as it
                        // doesn't allow us to change the URL when reconnecting. We need
                        // to change the URL to not include the /connect suffix, and pass
                        // the last message id we received.
                        connection.log("EventSource reconnecting due to the server connection ending");
                        that.reconnect(connection);
                    } else {
                        // connection error
                        connection.log("EventSource error");
                        $connection.triggerHandler(events.onError);
                    }
                }
            }, false);
        },

        reconnect: function (connection) {
            transportLogic.reconnect(connection, this.name);
        },

        lostConnection: function (connection) {
            this.reconnect(connection);
        },

        send: function (connection, data) {
            transportLogic.ajaxSend(connection, data);
        },

        stop: function (connection) {
            // Don't trigger a reconnect after stopping
            transportLogic.clearReconnectTimeout(connection);

            if (connection && connection.eventSource) {
                connection.log("EventSource calling close()");
                connection.eventSource.close();
                connection.eventSource = null;
                delete connection.eventSource;
            }
        },

        abort: function (connection, async) {
            transportLogic.ajaxAbort(connection, async);
        }
    };

}(window.jQuery, window));
/* jquery.signalR.transports.foreverFrame.js */
// Copyright (c) Microsoft Open Technologies, Inc. All rights reserved. See License.md in the project root for license information.

/*global window:false */
/// <reference path="jquery.signalR.transports.common.js" />

(function ($, window) {
    "use strict";

    var signalR = $.signalR,
        events = $.signalR.events,
        changeState = $.signalR.changeState,
        transportLogic = signalR.transports._logic,
        // Used to prevent infinite loading icon spins in older versions of ie
        // We build this object inside a closure so we don't pollute the rest of   
        // the foreverFrame transport with unnecessary functions/utilities.
        loadPreventer = (function () {
            var loadingFixIntervalId = null,
                loadingFixInterval = 1000,
                attachedTo = 0;

            return {
                prevent: function () {
                    // Prevent additional iframe removal procedures from newer browsers
                    if (signalR._.ieVersion <= 8) {
                        // We only ever want to set the interval one time, so on the first attachedTo
                        if (attachedTo === 0) {
                            // Create and destroy iframe every 3 seconds to prevent loading icon, super hacky
                            loadingFixIntervalId = window.setInterval(function () {
                                var tempFrame = $("<iframe style='position:absolute;top:0;left:0;width:0;height:0;visibility:hidden;' src=''></iframe>");

                                $("body").append(tempFrame);
                                tempFrame.remove();
                                tempFrame = null;
                            }, loadingFixInterval);
                        }

                        attachedTo++;
                    }
                },
                cancel: function () {                   
                    // Only clear the interval if there's only one more object that the loadPreventer is attachedTo
                    if (attachedTo === 1) {
                        window.clearInterval(loadingFixIntervalId);
                    }

                    if (attachedTo > 0) {
                        attachedTo--;
                    }
                }
            };
        })();

    signalR.transports.foreverFrame = {
        name: "foreverFrame",

        supportsKeepAlive: true,

        start: function (connection, onSuccess, onFailed) {
            var that = this,
                frameId = (transportLogic.foreverFrame.count += 1),
                url,
                frame = $("<iframe data-signalr-connection-id='" + connection.id + "' style='position:absolute;top:0;left:0;width:0;height:0;visibility:hidden;' src=''></iframe>");

            if (window.EventSource) {
                // If the browser supports SSE, don't use Forever Frame
                if (onFailed) {
                    connection.log("This browser supports SSE, skipping Forever Frame.");
                    onFailed();
                }
                return;
            }

            // Start preventing loading icon
            // This will only perform work if the loadPreventer is not attached to another connection.
            loadPreventer.prevent();

            // Build the url
            url = transportLogic.getUrl(connection, this.name);
            url += "&frameId=" + frameId;

            // Set body prior to setting URL to avoid caching issues.
            $("body").append(frame);

            frame.prop("src", url);
            transportLogic.foreverFrame.connections[frameId] = connection;

            connection.log("Binding to iframe's readystatechange event.");
            frame.bind("readystatechange", function () {
                if ($.inArray(this.readyState, ["loaded", "complete"]) >= 0) {
                    connection.log("Forever frame iframe readyState changed to " + this.readyState + ", reconnecting");

                    that.reconnect(connection);
                }
            });

            connection.frame = frame[0];
            connection.frameId = frameId;

            if (onSuccess) {
                connection.onSuccess = function () {
                    onSuccess();
                    delete connection.onSuccess;
                };
            }
        },

        reconnect: function (connection) {
            var that = this;
            window.setTimeout(function () {
                if (connection.frame && transportLogic.ensureReconnectingState(connection)) {
                    var frame = connection.frame,
                        src = transportLogic.getUrl(connection, that.name, true) + "&frameId=" + connection.frameId;
                    connection.log("Updating iframe src to '" + src + "'.");
                    frame.src = src;
                }
            }, connection.reconnectDelay);
        },

        lostConnection: function (connection) {
            this.reconnect(connection);
        },

        send: function (connection, data) {
            transportLogic.ajaxSend(connection, data);
        },

        receive: function (connection, data) {
            var cw;

            transportLogic.processMessages(connection, data, connection.onSuccess);
            // Delete the script & div elements
            connection.frameMessageCount = (connection.frameMessageCount || 0) + 1;
            if (connection.frameMessageCount > 50) {
                connection.frameMessageCount = 0;
                cw = connection.frame.contentWindow || connection.frame.contentDocument;
                if (cw && cw.document) {
                    $("body", cw.document).empty();
                }
            }
        },

        stop: function (connection) {
            var cw = null;

            // Stop attempting to prevent loading icon
            loadPreventer.cancel();

            if (connection.frame) {
                if (connection.frame.stop) {
                    connection.frame.stop();
                } else {
                    try {
                        cw = connection.frame.contentWindow || connection.frame.contentDocument;
                        if (cw.document && cw.document.execCommand) {
                            cw.document.execCommand("Stop");
                        }
                    }
                    catch (e) {
                        connection.log("SignalR: Error occured when stopping foreverFrame transport. Message = " + e.message);
                    }
                }
                $(connection.frame).remove();
                delete transportLogic.foreverFrame.connections[connection.frameId];
                connection.frame = null;
                connection.frameId = null;
                delete connection.frame;
                delete connection.frameId;
                delete connection.onSuccess;
                connection.log("Stopping forever frame");
            }
        },

        abort: function (connection, async) {
            transportLogic.ajaxAbort(connection, async);
        },

        getConnection: function (id) {
            return transportLogic.foreverFrame.connections[id];
        },

        started: function (connection) {
            if (changeState(connection,
                signalR.connectionState.reconnecting,
                signalR.connectionState.connected) === true) {
                // If there's no onSuccess handler we assume this is a reconnect
                $(connection).triggerHandler(events.onReconnect);
            }
        }
    };

}(window.jQuery, window));
/* jquery.signalR.transports.longPolling.js */
// Copyright (c) Microsoft Open Technologies, Inc. All rights reserved. See License.md in the project root for license information.

/*global window:false */
/// <reference path="jquery.signalR.transports.common.js" />

(function ($, window) {
    "use strict";

    var signalR = $.signalR,
        events = $.signalR.events,
        changeState = $.signalR.changeState,
        isDisconnecting = $.signalR.isDisconnecting,
        transportLogic = signalR.transports._logic;

    signalR.transports.longPolling = {
        name: "longPolling",

        supportsKeepAlive: false,

        reconnectDelay: 3000,

        start: function (connection, onSuccess, onFailed) {
            /// <summary>Starts the long polling connection</summary>
            /// <param name="connection" type="signalR">The SignalR connection to start</param>
            var that = this,
                fireConnect = function () {
                    fireConnect = $.noop;
                    onSuccess();
                    // Reset onFailed to null because it shouldn't be called again
                    onFailed = null;
                    connection.log("LongPolling connected");
                },
                tryFailConnect = function () {
                    if (onFailed) {
                        onFailed();
                        onFailed = null;
                        connection.log("LongPolling failed to connect.");
                        return true;
                    }
                    
                    return false;
                },
                reconnectErrors = 0,
                reconnectTimeoutId = null,
                fireReconnected = function (instance) {
                    window.clearTimeout(reconnectTimeoutId);
                    reconnectTimeoutId = null;

                    if (changeState(connection,
                                    signalR.connectionState.reconnecting,
                                    signalR.connectionState.connected) === true) {
                        // Successfully reconnected!
                        connection.log("Raising the reconnect event");
                        $(instance).triggerHandler(events.onReconnect);
                    }
                },
                // 1 hour
                maxFireReconnectedTimeout = 3600000;

            if (connection.pollXhr) {
                connection.log("Polling xhr requests already exists, aborting.");
                connection.stop();
            }

            connection.messageId = null;

            window.setTimeout(function () {
                (function poll(instance, raiseReconnect) {
                    var messageId = instance.messageId,
                        connect = (messageId === null),
                        reconnecting = !connect,
                        polling = !raiseReconnect,
                        url = transportLogic.getUrl(instance, that.name, reconnecting, polling);

                    // If we've disconnected during the time we've tried to re-instantiate the poll then stop.
                    if (isDisconnecting(instance) === true) {
                        return;
                    }

                    connection.log("Attempting to connect to '" + url + "' using longPolling.");
                    instance.pollXhr = $.ajax({
                        url: url,
                        global: false,
                        cache: false,
                        type: "GET",
                        dataType: connection.ajaxDataType,
                        contentType: connection.contentType,
                            success: function (result) {
                                var minData = connection._parseResponse(result),
                                    delay = 0,
                                data;

                            // Reset our reconnect errors so if we transition into a reconnecting state again we trigger
                            // reconnected quickly
                            reconnectErrors = 0;

                            // If there's currently a timeout to trigger reconnect, fire it now before processing messages
                            if (reconnectTimeoutId !== null) {
                                fireReconnected();
                            }

                            if (minData) {
                                data = transportLogic.maximizePersistentResponse(minData);
                            }

                            transportLogic.processMessages(instance, minData, fireConnect);

                            if (data &&
                                $.type(data.LongPollDelay) === "number") {
                                delay = data.LongPollDelay;
                            }

                            if (data && data.Disconnect) {
                                return;
                            }

                            if (isDisconnecting(instance) === true) {
                                return;
                            }

                            // We never want to pass a raiseReconnect flag after a successful poll.  This is handled via the error function
                            if (delay > 0) {
                                window.setTimeout(function () {
                                    poll(instance, false);
                                }, delay);
                            } else {
                                poll(instance, false);
                            }
                        },

                        error: function (data, textStatus) {
                            // Stop trying to trigger reconnect, connection is in an error state
                            // If we're not in the reconnect state this will noop
                            window.clearTimeout(reconnectTimeoutId);
                            reconnectTimeoutId = null;

                            if (textStatus === "abort") {
                                connection.log("Aborted xhr requst.");
                                return;
                            }

                            if (!tryFailConnect()) {

                                // Increment our reconnect errors, we assume all errors to be reconnect errors
                                // In the case that it's our first error this will cause Reconnect to be fired
                                // after 1 second due to reconnectErrors being = 1.
                                reconnectErrors++;

                                if (connection.state !== signalR.connectionState.reconnecting) {
                                    connection.log("An error occurred using longPolling. Status = " + textStatus + ". " + data.responseText);
                                    $(instance).triggerHandler(events.onError, [data.responseText]);
                                }

                                // Transition into the reconnecting state
                                transportLogic.ensureReconnectingState(instance);

                                // Call poll with the raiseReconnect flag as true after the reconnect delay
                                window.setTimeout(function () {
                                    poll(instance, true);
                                }, that.reconnectDelay);
                            }
                        }
                    });


                    // This will only ever pass after an error has occured via the poll ajax procedure.
                    if (reconnecting && raiseReconnect === true) {
                        // We wait to reconnect depending on how many times we've failed to reconnect.
                        // This is essentially a heuristic that will exponentially increase in wait time before
                        // triggering reconnected.  This depends on the "error" handler of Poll to cancel this 
                        // timeout if it triggers before the Reconnected event fires.
                        // The Math.min at the end is to ensure that the reconnect timeout does not overflow.
                        reconnectTimeoutId = window.setTimeout(function () { fireReconnected(instance); }, Math.min(1000 * (Math.pow(2, reconnectErrors) - 1), maxFireReconnectedTimeout));
                    }
                }(connection));
            }, 250); // Have to delay initial poll so Chrome doesn't show loader spinner in tab
        },

        lostConnection: function (connection) {
            throw new Error("Lost Connection not handled for LongPolling");
        },

        send: function (connection, data) {
            transportLogic.ajaxSend(connection, data);
        },

        stop: function (connection) {
            /// <summary>Stops the long polling connection</summary>
            /// <param name="connection" type="signalR">The SignalR connection to stop</param>
            if (connection.pollXhr) {
                connection.pollXhr.abort();
                connection.pollXhr = null;
                delete connection.pollXhr;
            }
        },

        abort: function (connection, async) {
            transportLogic.ajaxAbort(connection, async);
        }
    };

}(window.jQuery, window));
/* jquery.signalR.hubs.js */
// Copyright (c) Microsoft Open Technologies, Inc. All rights reserved. See License.md in the project root for license information.

/*global window:false */
/// <reference path="jquery.signalR.core.js" />

(function ($, window) {
    "use strict";

    // we use a global id for tracking callbacks so the server doesn't have to send extra info like hub name
    var callbackId = 0,
        callbacks = {},
        eventNamespace = ".hubProxy";

    function makeEventName(event) {
        return event + eventNamespace;
    }

    // Equivalent to Array.prototype.map
    function map(arr, fun, thisp) {
        var i,
            length = arr.length,
            result = [];
        for (i = 0; i < length; i += 1) {
            if (arr.hasOwnProperty(i)) {
                result[i] = fun.call(thisp, arr[i], i, arr);
            }
        }
        return result;
    }

    function getArgValue(a) {
        return $.isFunction(a) ? null : ($.type(a) === "undefined" ? null : a);
    }

    function hasMembers(obj) {
        for (var key in obj) {
            // If we have any properties in our callback map then we have callbacks and can exit the loop via return
            if (obj.hasOwnProperty(key)) {
                return true;
            }
        }

        return false;
    }

    // hubProxy
    function hubProxy(hubConnection, hubName) {
        /// <summary>
        ///     Creates a new proxy object for the given hub connection that can be used to invoke
        ///     methods on server hubs and handle client method invocation requests from the server.
        /// </summary>
        return new hubProxy.fn.init(hubConnection, hubName);
    }

    hubProxy.fn = hubProxy.prototype = {
        init: function (connection, hubName) {
            this.state = {};
            this.connection = connection;
            this.hubName = hubName;
            this._ = {
                callbackMap: {}
            };
        },

        hasSubscriptions: function () {
            return hasMembers(this._.callbackMap);
        },

        on: function (eventName, callback) {
            /// <summary>Wires up a callback to be invoked when a invocation request is received from the server hub.</summary>
            /// <param name="eventName" type="String">The name of the hub event to register the callback for.</param>
            /// <param name="callback" type="Function">The callback to be invoked.</param>
            var that = this,
                callbackMap = that._.callbackMap;

            // Normalize the event name to lowercase
            eventName = eventName.toLowerCase();

            // If there is not an event registered for this callback yet we want to create its event space in the callback map.
            if (!callbackMap[eventName]) {
                callbackMap[eventName] = {};
            }

            // Map the callback to our encompassed function
            callbackMap[eventName][callback] = function (e, data) {
                callback.apply(that, data);
            };

            $(that).bind(makeEventName(eventName), callbackMap[eventName][callback]);

            return that;
        },

        off: function (eventName, callback) {
            /// <summary>Removes the callback invocation request from the server hub for the given event name.</summary>
            /// <param name="eventName" type="String">The name of the hub event to unregister the callback for.</param>
            /// <param name="callback" type="Function">The callback to be invoked.</param>
            var that = this,
                callbackMap = that._.callbackMap,
                callbackSpace;

            // Normalize the event name to lowercase
            eventName = eventName.toLowerCase();

            callbackSpace = callbackMap[eventName];

            // Verify that there is an event space to unbind
            if (callbackSpace) {
                // Only unbind if there's an event bound with eventName and a callback with the specified callback
                if (callbackSpace[callback]) {
                    $(that).unbind(makeEventName(eventName), callbackSpace[callback]);

                    // Remove the callback from the callback map
                    delete callbackSpace[callback];

                    // Check if there are any members left on the event, if not we need to destroy it.
                    if (!hasMembers(callbackSpace)) {
                        delete callbackMap[eventName];
                    }
                }
                else if (!callback) { // Check if we're removing the whole event and we didn't error because of an invalid callback
                    $(that).unbind(makeEventName(eventName));

                    delete callbackMap[eventName];
                }
            }

            return that;
        },

        invoke: function (methodName) {
            /// <summary>Invokes a server hub method with the given arguments.</summary>
            /// <param name="methodName" type="String">The name of the server hub method.</param>

            var that = this,
                args = $.makeArray(arguments).slice(1),
                argValues = map(args, getArgValue),
                data = { H: that.hubName, M: methodName, A: argValues, I: callbackId },
                d = $.Deferred(),
                callback = function (minResult) {
                    var result = that._maximizeHubResponse(minResult);

                    // Update the hub state
                    $.extend(that.state, result.State);

                    if (result.Error) {
                        // Server hub method threw an exception, log it & reject the deferred
                        if (result.StackTrace) {
                            that.connection.log(result.Error + "\n" + result.StackTrace);
                        }
                        d.rejectWith(that, [result.Error]);
                    } else {
                        // Server invocation succeeded, resolve the deferred
                        d.resolveWith(that, [result.Result]);
                    }
                };

            callbacks[callbackId.toString()] = { scope: that, method: callback };
            callbackId += 1;

            if (!$.isEmptyObject(that.state)) {
                data.S = that.state;
            }
            
            that.connection.send(that.connection.json.stringify(data));

            return d.promise();
        },

        _maximizeHubResponse: function (minHubResponse) {
            return {
                State: minHubResponse.S,
                Result: minHubResponse.R,
                Id: minHubResponse.I,
                Error: minHubResponse.E,
                StackTrace: minHubResponse.T
            };
        }
    };

    hubProxy.fn.init.prototype = hubProxy.fn;

    // hubConnection
    function hubConnection(url, options) {
        /// <summary>Creates a new hub connection.</summary>
        /// <param name="url" type="String">[Optional] The hub route url, defaults to "/signalr".</param>
        /// <param name="options" type="Object">[Optional] Settings to use when creating the hubConnection.</param>
        var settings = {
            qs: null,
            logging: false,
            useDefaultPath: true
        };

        $.extend(settings, options);

        if (!url || settings.useDefaultPath) {
            url = (url || "") + "/signalr";
        }
        return new hubConnection.fn.init(url, settings);
    }

    hubConnection.fn = hubConnection.prototype = $.connection();

    hubConnection.fn.init = function (url, options) {
        var settings = {
            qs: null,
            logging: false,
            useDefaultPath: true
        },
            connection = this;

        $.extend(settings, options);

        // Call the base constructor
        $.signalR.fn.init.call(connection, url, settings.qs, settings.logging);

        // Object to store hub proxies for this connection
        connection.proxies = {};

        // Wire up the received handler
        connection.received(function (minData) {
            var data, proxy, dataCallbackId, callback, hubName, eventName;
            if (!minData) {
                return;
            }

            if (typeof (minData.I) !== "undefined") {
                // We received the return value from a server method invocation, look up callback by id and call it
                dataCallbackId = minData.I.toString();
                callback = callbacks[dataCallbackId];
                if (callback) {
                    // Delete the callback from the proxy
                    callbacks[dataCallbackId] = null;
                    delete callbacks[dataCallbackId];

                    // Invoke the callback
                    callback.method.call(callback.scope, minData);
                }
            } else {
                data = this._maximizeClientHubInvocation(minData);

                // We received a client invocation request, i.e. broadcast from server hub
                connection.log("Triggering client hub event '" + data.Method + "' on hub '" + data.Hub + "'.");

                // Normalize the names to lowercase
                hubName = data.Hub.toLowerCase();
                eventName = data.Method.toLowerCase();

                // Trigger the local invocation event
                proxy = this.proxies[hubName];

                // Update the hub state
                $.extend(proxy.state, data.State);
                $(proxy).triggerHandler(makeEventName(eventName), [data.Args]);
            }
        });
    };

    hubConnection.fn._maximizeClientHubInvocation = function (minClientHubInvocation) {
        return {
            Hub: minClientHubInvocation.H,
            Method: minClientHubInvocation.M,
            Args: minClientHubInvocation.A,
            State: minClientHubInvocation.S
        };
    };

    hubConnection.fn._registerSubscribedHubs = function () {
        /// <summary>
        ///     Sets the starting event to loop through the known hubs and register any new hubs 
        ///     that have been added to the proxy.
        /// </summary>
        var connection = this;

        if (!connection._subscribedToHubs) {
            connection._subscribedToHubs = true;
            connection.starting(function () {
                // Set the connection's data object with all the hub proxies with active subscriptions.
                // These proxies will receive notifications from the server.
                var subscribedHubs = [];

                $.each(connection.proxies, function (key) {
                    if (this.hasSubscriptions()) {
                        subscribedHubs.push({ name: key });
                    }
                });

                connection.data = connection.json.stringify(subscribedHubs);
            });
        }
    };

    hubConnection.fn.createHubProxy = function (hubName) {
        /// <summary>
        ///     Creates a new proxy object for the given hub connection that can be used to invoke
        ///     methods on server hubs and handle client method invocation requests from the server.
        /// </summary>
        /// <param name="hubName" type="String">
        ///     The name of the hub on the server to create the proxy for.
        /// </param>

        // Normalize the name to lowercase
        hubName = hubName.toLowerCase();

        var proxy = this.proxies[hubName];
        if (!proxy) {
            proxy = hubProxy(this, hubName);
            this.proxies[hubName] = proxy;
        }

        this._registerSubscribedHubs();

        return proxy;
    };

    hubConnection.fn.init.prototype = hubConnection.fn;

    $.hubConnection = hubConnection;

}(window.jQuery, window));
/* jquery.signalR.version.js */
// Copyright (c) Microsoft Open Technologies, Inc. All rights reserved. See License.md in the project root for license information.

/*global window:false */
/// <reference path="jquery.signalR.core.js" />
(function ($) {
    $.signalR.version = "2.0.0-beta2";
}(window.jQuery));

},{}],4:[function(require,module,exports){
// Generated by CoffeeScript 1.6.2
(function() {
  var __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; },
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  (function(root, factory) {
    if (typeof exports !== 'undefined') {
      return factory(root, exports);
    } else if (typeof define === 'function' && define.amd) {
      return define(['exports'], function(exports) {
        return root.jsonpatch = factory(root, exports);
      });
    } else {
      return root.jsonpatch = factory(root, {});
    }
  })(this, function(root) {
    var AddPatch, CopyPatch, InvalidPatchError, InvalidPointerError, JSONPatch, JSONPatchError, JSONPointer, MovePatch, PatchConflictError, RemovePatch, ReplacePatch, TestPatch, apply, compile, hasOwnProperty, isArray, isEqual, isObject, isString, operationMap, toString, _isEqual, _ref, _ref1, _ref2, _ref3, _ref4, _ref5;

    toString = Object.prototype.toString;
    hasOwnProperty = Object.prototype.hasOwnProperty;
    isArray = function(obj) {
      return toString.call(obj) === '[object Array]';
    };
    isObject = function(obj) {
      return toString.call(obj) === '[object Object]';
    };
    isString = function(obj) {
      return toString.call(obj) === '[object String]';
    };
    _isEqual = function(a, b, stack) {
      var className, key, length, result, size;

      if (a === b) {
        return a !== 0 || 1 / a === 1 / b;
      }
      if (a === null || b === null) {
        return a === b;
      }
      className = toString.call(a);
      if (className !== toString.call(b)) {
        return false;
      }
      switch (className) {
        case '[object String]':
          String(a) === String(b);
          break;
        case '[object Number]':
          a = +a;
          b = +b;
          if (a !== a) {
            b !== b;
          } else {
            if (a === 0) {
              1 / a === 1 / b;
            } else {
              a === b;
            }
          }
          break;
        case '[object Boolean]':
          +a === +b;
      }
      if (typeof a !== 'object' || typeof b !== 'object') {
        return false;
      }
      length = stack.length;
      while (length--) {
        if (stack[length] === a) {
          return true;
        }
      }
      stack.push(a);
      size = 0;
      result = true;
      if (className === '[object Array]') {
        size = a.length;
        result = size === b.length;
        if (result) {
          while (size--) {
            if (!(result = __indexOf.call(a, size) >= 0 === __indexOf.call(b, size) >= 0 && _isEqual(a[size], b[size], stack))) {
              break;
            }
          }
        }
      } else {
        if (__indexOf.call(a, "constructor") >= 0 !== __indexOf.call(b, "constructor") >= 0 || a.constructor !== b.constructor) {
          return false;
        }
        for (key in a) {
          if (hasOwnProperty.call(a, key)) {
            size++;
            if (!(result = hasOwnProperty.call(b, key) && _isEqual(a[key], b[key], stack))) {
              break;
            }
          }
        }
        if (result) {
          for (key in b) {
            if (hasOwnProperty.call(b, key) && !size--) {
              break;
            }
          }
          result = !size;
        }
      }
      stack.pop();
      return result;
    };
    isEqual = function(a, b) {
      return _isEqual(a, b, []);
    };
    JSONPatchError = (function(_super) {
      __extends(JSONPatchError, _super);

      function JSONPatchError(message) {
        this.message = message != null ? message : 'JSON patch error';
        this.name = 'JSONPatchError';
      }

      return JSONPatchError;

    })(Error);
    InvalidPointerError = (function(_super) {
      __extends(InvalidPointerError, _super);

      function InvalidPointerError(message) {
        this.message = message != null ? message : 'Invalid pointer';
        this.name = 'InvalidPointer';
      }

      return InvalidPointerError;

    })(Error);
    InvalidPatchError = (function(_super) {
      __extends(InvalidPatchError, _super);

      function InvalidPatchError(message) {
        this.message = message != null ? message : 'Invalid patch';
        this.name = 'InvalidPatch';
      }

      return InvalidPatchError;

    })(JSONPatchError);
    PatchConflictError = (function(_super) {
      __extends(PatchConflictError, _super);

      function PatchConflictError(message) {
        this.message = message != null ? message : 'Patch conflict';
        this.name = 'PatchConflictError';
      }

      return PatchConflictError;

    })(JSONPatchError);
    JSONPointer = (function() {
      function JSONPointer(path) {
        var i, step, steps, _i, _len;

        steps = [];
        if (path && (steps = path.split('/')).shift() !== '') {
          throw new InvalidPointerError();
        }
        for (i = _i = 0, _len = steps.length; _i < _len; i = ++_i) {
          step = steps[i];
          steps[i] = step.replace('~1', '/').replace('~0', '~');
        }
        this.accessor = steps.pop();
        this.steps = steps;
        this.path = path;
      }

      JSONPointer.prototype.getReference = function(parent) {
        var step, _i, _len, _ref;

        _ref = this.steps;
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          step = _ref[_i];
          if (isArray(parent)) {
            step = parseInt(step, 10);
          }
          if (!(step in parent)) {
            throw new PatchConflictError('Array location out of ', 'bounds or not an instance property');
          }
          parent = parent[step];
        }
        return parent;
      };

      JSONPointer.prototype.coerce = function(reference, accessor) {
        if (isArray(reference)) {
          if (isString(accessor)) {
            if (accessor === '-') {
              accessor = reference.length;
            } else if (/^[-+]?\d+$/.test(accessor)) {
              accessor = parseInt(accessor, 10);
            } else {
              throw new InvalidPointerError('Invalid array index number');
            }
          }
        }
        return accessor;
      };

      return JSONPointer;

    })();
    JSONPatch = (function() {
      function JSONPatch(patch) {
        if (!('path' in patch)) {
          throw new InvalidPatchError();
        }
        this.validate(patch);
        this.patch = patch;
        this.path = new JSONPointer(patch.path);
        this.initialize(patch);
      }

      JSONPatch.prototype.initialize = function() {};

      JSONPatch.prototype.validate = function(patch) {};

      JSONPatch.prototype.apply = function(document) {
        throw new Error('Method not implemented');
      };

      return JSONPatch;

    })();
    AddPatch = (function(_super) {
      __extends(AddPatch, _super);

      function AddPatch() {
        _ref = AddPatch.__super__.constructor.apply(this, arguments);
        return _ref;
      }

      AddPatch.prototype.validate = function(patch) {
        if (!('value' in patch)) {
          throw new InvalidPatchError();
        }
      };

      AddPatch.prototype.apply = function(document) {
        var accessor, reference, value;

        reference = this.path.getReference(document);
        accessor = this.path.accessor;
        value = this.patch.value;
        if (isArray(reference)) {
          accessor = this.path.coerce(reference, accessor);
          if (accessor < 0 || accessor > reference.length) {
            throw new PatchConflictError("Index " + accessor + " out of bounds");
          }
          reference.splice(accessor, 0, value);
        } else if (accessor == null) {
          document = value;
        } else {
          reference[accessor] = value;
        }
        return document;
      };

      return AddPatch;

    })(JSONPatch);
    RemovePatch = (function(_super) {
      __extends(RemovePatch, _super);

      function RemovePatch() {
        _ref1 = RemovePatch.__super__.constructor.apply(this, arguments);
        return _ref1;
      }

      RemovePatch.prototype.apply = function(document) {
        var accessor, reference;

        reference = this.path.getReference(document);
        accessor = this.path.accessor;
        if (isArray(reference)) {
          accessor = this.path.coerce(reference, accessor);
          if (!(accessor in reference)) {
            throw new PatchConflictError("Value at " + accessor + " does not exist");
          }
          reference.splice(accessor, 1);
        } else {
          if (!(accessor in reference)) {
            throw new PatchConflictError("Value at " + accessor + " does not exist");
          }
          delete reference[accessor];
        }
        return document;
      };

      return RemovePatch;

    })(JSONPatch);
    ReplacePatch = (function(_super) {
      __extends(ReplacePatch, _super);

      function ReplacePatch() {
        _ref2 = ReplacePatch.__super__.constructor.apply(this, arguments);
        return _ref2;
      }

      ReplacePatch.prototype.validate = function(patch) {
        if (!('value' in patch)) {
          throw new InvalidPatchError();
        }
      };

      ReplacePatch.prototype.apply = function(document) {
        var accessor, reference, value;

        reference = this.path.getReference(document);
        accessor = this.path.accessor;
        value = this.patch.value;
        if (isArray(reference)) {
          accessor = this.path.coerce(reference, accessor);
          if (!(accessor in reference)) {
            throw new PatchConflictError("Value at " + accessor + " does not exist");
          }
          reference.splice(accessor, 1, value);
        } else {
          if (!(accessor in reference)) {
            throw new PatchConflictError("Value at " + accessor + " does not exist");
          }
          reference[accessor] = value;
        }
        return document;
      };

      return ReplacePatch;

    })(JSONPatch);
    TestPatch = (function(_super) {
      __extends(TestPatch, _super);

      function TestPatch() {
        _ref3 = TestPatch.__super__.constructor.apply(this, arguments);
        return _ref3;
      }

      TestPatch.prototype.validate = function(patch) {
        if (!('value' in patch)) {
          throw new InvalidPatchError();
        }
      };

      TestPatch.prototype.apply = function(document) {
        var accessor, reference, value;

        reference = this.path.getReference(document);
        accessor = this.path.accessor;
        value = this.patch.value;
        if (isArray(reference)) {
          accessor = this.path.coerce(reference, accessor);
        }
        return isEqual(reference[accessor], value);
      };

      return TestPatch;

    })(JSONPatch);
    MovePatch = (function(_super) {
      __extends(MovePatch, _super);

      function MovePatch() {
        _ref4 = MovePatch.__super__.constructor.apply(this, arguments);
        return _ref4;
      }

      MovePatch.prototype.initialize = function(patch) {
        var i, len, within, _i;

        this.from = new JSONPointer(patch.from);
        len = this.from.steps.length;
        within = true;
        for (i = _i = 0; 0 <= len ? _i <= len : _i >= len; i = 0 <= len ? ++_i : --_i) {
          if (this.from.steps[i] !== this.path.steps[i]) {
            within = false;
            break;
          }
        }
        if (within) {
          if (this.path.steps.length !== len) {
            throw new InvalidPatchError("'to' member cannot be a descendent of 'path'");
          }
          if (this.from.accessor === this.path.accessor) {
            return this.apply = function(document) {
              return document;
            };
          }
        }
      };

      MovePatch.prototype.validate = function(patch) {
        if (!('from' in patch)) {
          throw new InvalidPatchError();
        }
      };

      MovePatch.prototype.apply = function(document) {
        var accessor, reference, value;

        reference = this.from.getReference(document);
        accessor = this.from.accessor;
        if (isArray(reference)) {
          accessor = this.from.coerce(reference, accessor);
          if (!(accessor in reference)) {
            throw new PatchConflictError("Value at " + accessor + " does not exist");
          }
          value = reference.splice(accessor, 1)[0];
        } else {
          if (!(accessor in reference)) {
            throw new PatchConflictError("Value at " + accessor + " does not exist");
          }
          value = reference[accessor];
          delete reference[accessor];
        }
        reference = this.path.getReference(document);
        accessor = this.path.accessor;
        if (isArray(reference)) {
          accessor = this.path.coerce(reference, accessor);
          if (accessor < 0 || accessor > reference.length) {
            throw new PatchConflictError("Index " + accessor + " out of bounds");
          }
          reference.splice(accessor, 0, value);
        } else {
          if (accessor in reference) {
            throw new PatchConflictError("Value at " + accessor + " exists");
          }
          reference[accessor] = value;
        }
        return document;
      };

      return MovePatch;

    })(JSONPatch);
    CopyPatch = (function(_super) {
      __extends(CopyPatch, _super);

      function CopyPatch() {
        _ref5 = CopyPatch.__super__.constructor.apply(this, arguments);
        return _ref5;
      }

      CopyPatch.prototype.apply = function(document) {
        var accessor, reference, value;

        reference = this.from.getReference(document);
        accessor = this.from.accessor;
        if (isArray(reference)) {
          accessor = this.from.coerce(reference, accessor);
          if (!(accessor in reference)) {
            throw new PatchConflictError("Value at " + accessor + " does not exist");
          }
          value = reference.slice(accessor, accessor + 1)[0];
        } else {
          if (!(accessor in reference)) {
            throw new PatchConflictError("Value at " + accessor + " does not exist");
          }
          value = reference[accessor];
        }
        reference = this.path.getReference(document);
        accessor = this.path.accessor;
        if (isArray(reference)) {
          accessor = this.path.coerce(reference, accessor);
          if (accessor < 0 || accessor > reference.length) {
            throw new PatchConflictError("Index " + accessor + " out of bounds");
          }
          reference.splice(accessor, 0, value);
        } else {
          if (accessor in reference) {
            throw new PatchConflictError("Value at " + accessor + " exists");
          }
          reference[accessor] = value;
        }
        return document;
      };

      return CopyPatch;

    })(MovePatch);
    operationMap = {
      add: AddPatch,
      remove: RemovePatch,
      replace: ReplacePatch,
      move: MovePatch,
      copy: CopyPatch,
      test: TestPatch
    };
    compile = function(patch) {
      var klass, ops, p, _i, _len;

      ops = [];
      for (_i = 0, _len = patch.length; _i < _len; _i++) {
        p = patch[_i];
        if (!(klass = operationMap[p.op])) {
          throw new InvalidPatchError();
        }
        ops.push(new klass(p));
      }
      return function(document) {
        var op, result, _j, _len1;

        result = document;
        for (_j = 0, _len1 = ops.length; _j < _len1; _j++) {
          op = ops[_j];
          result = op.apply(document);
        }
        return result;
      };
    };
    apply = function(document, patch) {
      return compile(patch)(document);
    };
    root.apply = apply;
    root.compile = compile;
    root.JSONPointer = JSONPointer;
    root.JSONPatch = JSONPatch;
    root.JSONPatchError = JSONPatchError;
    root.InvalidPointerError = InvalidPointerError;
    root.InvalidPatchError = InvalidPatchError;
    root.PatchConflictError = PatchConflictError;
    return root;
  });

}).call(this);

},{}],5:[function(require,module,exports){
//     Underscore.js 1.5.2
//     http://underscorejs.org
//     (c) 2009-2013 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
//     Underscore may be freely distributed under the MIT license.

(function() {

  // Baseline setup
  // --------------

  // Establish the root object, `window` in the browser, or `exports` on the server.
  var root = this;

  // Save the previous value of the `_` variable.
  var previousUnderscore = root._;

  // Establish the object that gets returned to break out of a loop iteration.
  var breaker = {};

  // Save bytes in the minified (but not gzipped) version:
  var ArrayProto = Array.prototype, ObjProto = Object.prototype, FuncProto = Function.prototype;

  // Create quick reference variables for speed access to core prototypes.
  var
    push             = ArrayProto.push,
    slice            = ArrayProto.slice,
    concat           = ArrayProto.concat,
    toString         = ObjProto.toString,
    hasOwnProperty   = ObjProto.hasOwnProperty;

  // All **ECMAScript 5** native function implementations that we hope to use
  // are declared here.
  var
    nativeForEach      = ArrayProto.forEach,
    nativeMap          = ArrayProto.map,
    nativeReduce       = ArrayProto.reduce,
    nativeReduceRight  = ArrayProto.reduceRight,
    nativeFilter       = ArrayProto.filter,
    nativeEvery        = ArrayProto.every,
    nativeSome         = ArrayProto.some,
    nativeIndexOf      = ArrayProto.indexOf,
    nativeLastIndexOf  = ArrayProto.lastIndexOf,
    nativeIsArray      = Array.isArray,
    nativeKeys         = Object.keys,
    nativeBind         = FuncProto.bind;

  // Create a safe reference to the Underscore object for use below.
  var _ = function(obj) {
    if (obj instanceof _) return obj;
    if (!(this instanceof _)) return new _(obj);
    this._wrapped = obj;
  };

  // Export the Underscore object for **Node.js**, with
  // backwards-compatibility for the old `require()` API. If we're in
  // the browser, add `_` as a global object via a string identifier,
  // for Closure Compiler "advanced" mode.
  if (typeof exports !== 'undefined') {
    if (typeof module !== 'undefined' && module.exports) {
      exports = module.exports = _;
    }
    exports._ = _;
  } else {
    root._ = _;
  }

  // Current version.
  _.VERSION = '1.5.2';

  // Collection Functions
  // --------------------

  // The cornerstone, an `each` implementation, aka `forEach`.
  // Handles objects with the built-in `forEach`, arrays, and raw objects.
  // Delegates to **ECMAScript 5**'s native `forEach` if available.
  var each = _.each = _.forEach = function(obj, iterator, context) {
    if (obj == null) return;
    if (nativeForEach && obj.forEach === nativeForEach) {
      obj.forEach(iterator, context);
    } else if (obj.length === +obj.length) {
      for (var i = 0, length = obj.length; i < length; i++) {
        if (iterator.call(context, obj[i], i, obj) === breaker) return;
      }
    } else {
      var keys = _.keys(obj);
      for (var i = 0, length = keys.length; i < length; i++) {
        if (iterator.call(context, obj[keys[i]], keys[i], obj) === breaker) return;
      }
    }
  };

  // Return the results of applying the iterator to each element.
  // Delegates to **ECMAScript 5**'s native `map` if available.
  _.map = _.collect = function(obj, iterator, context) {
    var results = [];
    if (obj == null) return results;
    if (nativeMap && obj.map === nativeMap) return obj.map(iterator, context);
    each(obj, function(value, index, list) {
      results.push(iterator.call(context, value, index, list));
    });
    return results;
  };

  var reduceError = 'Reduce of empty array with no initial value';

  // **Reduce** builds up a single result from a list of values, aka `inject`,
  // or `foldl`. Delegates to **ECMAScript 5**'s native `reduce` if available.
  _.reduce = _.foldl = _.inject = function(obj, iterator, memo, context) {
    var initial = arguments.length > 2;
    if (obj == null) obj = [];
    if (nativeReduce && obj.reduce === nativeReduce) {
      if (context) iterator = _.bind(iterator, context);
      return initial ? obj.reduce(iterator, memo) : obj.reduce(iterator);
    }
    each(obj, function(value, index, list) {
      if (!initial) {
        memo = value;
        initial = true;
      } else {
        memo = iterator.call(context, memo, value, index, list);
      }
    });
    if (!initial) throw new TypeError(reduceError);
    return memo;
  };

  // The right-associative version of reduce, also known as `foldr`.
  // Delegates to **ECMAScript 5**'s native `reduceRight` if available.
  _.reduceRight = _.foldr = function(obj, iterator, memo, context) {
    var initial = arguments.length > 2;
    if (obj == null) obj = [];
    if (nativeReduceRight && obj.reduceRight === nativeReduceRight) {
      if (context) iterator = _.bind(iterator, context);
      return initial ? obj.reduceRight(iterator, memo) : obj.reduceRight(iterator);
    }
    var length = obj.length;
    if (length !== +length) {
      var keys = _.keys(obj);
      length = keys.length;
    }
    each(obj, function(value, index, list) {
      index = keys ? keys[--length] : --length;
      if (!initial) {
        memo = obj[index];
        initial = true;
      } else {
        memo = iterator.call(context, memo, obj[index], index, list);
      }
    });
    if (!initial) throw new TypeError(reduceError);
    return memo;
  };

  // Return the first value which passes a truth test. Aliased as `detect`.
  _.find = _.detect = function(obj, iterator, context) {
    var result;
    any(obj, function(value, index, list) {
      if (iterator.call(context, value, index, list)) {
        result = value;
        return true;
      }
    });
    return result;
  };

  // Return all the elements that pass a truth test.
  // Delegates to **ECMAScript 5**'s native `filter` if available.
  // Aliased as `select`.
  _.filter = _.select = function(obj, iterator, context) {
    var results = [];
    if (obj == null) return results;
    if (nativeFilter && obj.filter === nativeFilter) return obj.filter(iterator, context);
    each(obj, function(value, index, list) {
      if (iterator.call(context, value, index, list)) results.push(value);
    });
    return results;
  };

  // Return all the elements for which a truth test fails.
  _.reject = function(obj, iterator, context) {
    return _.filter(obj, function(value, index, list) {
      return !iterator.call(context, value, index, list);
    }, context);
  };

  // Determine whether all of the elements match a truth test.
  // Delegates to **ECMAScript 5**'s native `every` if available.
  // Aliased as `all`.
  _.every = _.all = function(obj, iterator, context) {
    iterator || (iterator = _.identity);
    var result = true;
    if (obj == null) return result;
    if (nativeEvery && obj.every === nativeEvery) return obj.every(iterator, context);
    each(obj, function(value, index, list) {
      if (!(result = result && iterator.call(context, value, index, list))) return breaker;
    });
    return !!result;
  };

  // Determine if at least one element in the object matches a truth test.
  // Delegates to **ECMAScript 5**'s native `some` if available.
  // Aliased as `any`.
  var any = _.some = _.any = function(obj, iterator, context) {
    iterator || (iterator = _.identity);
    var result = false;
    if (obj == null) return result;
    if (nativeSome && obj.some === nativeSome) return obj.some(iterator, context);
    each(obj, function(value, index, list) {
      if (result || (result = iterator.call(context, value, index, list))) return breaker;
    });
    return !!result;
  };

  // Determine if the array or object contains a given value (using `===`).
  // Aliased as `include`.
  _.contains = _.include = function(obj, target) {
    if (obj == null) return false;
    if (nativeIndexOf && obj.indexOf === nativeIndexOf) return obj.indexOf(target) != -1;
    return any(obj, function(value) {
      return value === target;
    });
  };

  // Invoke a method (with arguments) on every item in a collection.
  _.invoke = function(obj, method) {
    var args = slice.call(arguments, 2);
    var isFunc = _.isFunction(method);
    return _.map(obj, function(value) {
      return (isFunc ? method : value[method]).apply(value, args);
    });
  };

  // Convenience version of a common use case of `map`: fetching a property.
  _.pluck = function(obj, key) {
    return _.map(obj, function(value){ return value[key]; });
  };

  // Convenience version of a common use case of `filter`: selecting only objects
  // containing specific `key:value` pairs.
  _.where = function(obj, attrs, first) {
    if (_.isEmpty(attrs)) return first ? void 0 : [];
    return _[first ? 'find' : 'filter'](obj, function(value) {
      for (var key in attrs) {
        if (attrs[key] !== value[key]) return false;
      }
      return true;
    });
  };

  // Convenience version of a common use case of `find`: getting the first object
  // containing specific `key:value` pairs.
  _.findWhere = function(obj, attrs) {
    return _.where(obj, attrs, true);
  };

  // Return the maximum element or (element-based computation).
  // Can't optimize arrays of integers longer than 65,535 elements.
  // See [WebKit Bug 80797](https://bugs.webkit.org/show_bug.cgi?id=80797)
  _.max = function(obj, iterator, context) {
    if (!iterator && _.isArray(obj) && obj[0] === +obj[0] && obj.length < 65535) {
      return Math.max.apply(Math, obj);
    }
    if (!iterator && _.isEmpty(obj)) return -Infinity;
    var result = {computed : -Infinity, value: -Infinity};
    each(obj, function(value, index, list) {
      var computed = iterator ? iterator.call(context, value, index, list) : value;
      computed > result.computed && (result = {value : value, computed : computed});
    });
    return result.value;
  };

  // Return the minimum element (or element-based computation).
  _.min = function(obj, iterator, context) {
    if (!iterator && _.isArray(obj) && obj[0] === +obj[0] && obj.length < 65535) {
      return Math.min.apply(Math, obj);
    }
    if (!iterator && _.isEmpty(obj)) return Infinity;
    var result = {computed : Infinity, value: Infinity};
    each(obj, function(value, index, list) {
      var computed = iterator ? iterator.call(context, value, index, list) : value;
      computed < result.computed && (result = {value : value, computed : computed});
    });
    return result.value;
  };

  // Shuffle an array, using the modern version of the 
  // [Fisher-Yates shuffle](http://en.wikipedia.org/wiki/Fisher–Yates_shuffle).
  _.shuffle = function(obj) {
    var rand;
    var index = 0;
    var shuffled = [];
    each(obj, function(value) {
      rand = _.random(index++);
      shuffled[index - 1] = shuffled[rand];
      shuffled[rand] = value;
    });
    return shuffled;
  };

  // Sample **n** random values from an array.
  // If **n** is not specified, returns a single random element from the array.
  // The internal `guard` argument allows it to work with `map`.
  _.sample = function(obj, n, guard) {
    if (arguments.length < 2 || guard) {
      return obj[_.random(obj.length - 1)];
    }
    return _.shuffle(obj).slice(0, Math.max(0, n));
  };

  // An internal function to generate lookup iterators.
  var lookupIterator = function(value) {
    return _.isFunction(value) ? value : function(obj){ return obj[value]; };
  };

  // Sort the object's values by a criterion produced by an iterator.
  _.sortBy = function(obj, value, context) {
    var iterator = lookupIterator(value);
    return _.pluck(_.map(obj, function(value, index, list) {
      return {
        value: value,
        index: index,
        criteria: iterator.call(context, value, index, list)
      };
    }).sort(function(left, right) {
      var a = left.criteria;
      var b = right.criteria;
      if (a !== b) {
        if (a > b || a === void 0) return 1;
        if (a < b || b === void 0) return -1;
      }
      return left.index - right.index;
    }), 'value');
  };

  // An internal function used for aggregate "group by" operations.
  var group = function(behavior) {
    return function(obj, value, context) {
      var result = {};
      var iterator = value == null ? _.identity : lookupIterator(value);
      each(obj, function(value, index) {
        var key = iterator.call(context, value, index, obj);
        behavior(result, key, value);
      });
      return result;
    };
  };

  // Groups the object's values by a criterion. Pass either a string attribute
  // to group by, or a function that returns the criterion.
  _.groupBy = group(function(result, key, value) {
    (_.has(result, key) ? result[key] : (result[key] = [])).push(value);
  });

  // Indexes the object's values by a criterion, similar to `groupBy`, but for
  // when you know that your index values will be unique.
  _.indexBy = group(function(result, key, value) {
    result[key] = value;
  });

  // Counts instances of an object that group by a certain criterion. Pass
  // either a string attribute to count by, or a function that returns the
  // criterion.
  _.countBy = group(function(result, key) {
    _.has(result, key) ? result[key]++ : result[key] = 1;
  });

  // Use a comparator function to figure out the smallest index at which
  // an object should be inserted so as to maintain order. Uses binary search.
  _.sortedIndex = function(array, obj, iterator, context) {
    iterator = iterator == null ? _.identity : lookupIterator(iterator);
    var value = iterator.call(context, obj);
    var low = 0, high = array.length;
    while (low < high) {
      var mid = (low + high) >>> 1;
      iterator.call(context, array[mid]) < value ? low = mid + 1 : high = mid;
    }
    return low;
  };

  // Safely create a real, live array from anything iterable.
  _.toArray = function(obj) {
    if (!obj) return [];
    if (_.isArray(obj)) return slice.call(obj);
    if (obj.length === +obj.length) return _.map(obj, _.identity);
    return _.values(obj);
  };

  // Return the number of elements in an object.
  _.size = function(obj) {
    if (obj == null) return 0;
    return (obj.length === +obj.length) ? obj.length : _.keys(obj).length;
  };

  // Array Functions
  // ---------------

  // Get the first element of an array. Passing **n** will return the first N
  // values in the array. Aliased as `head` and `take`. The **guard** check
  // allows it to work with `_.map`.
  _.first = _.head = _.take = function(array, n, guard) {
    if (array == null) return void 0;
    return (n == null) || guard ? array[0] : slice.call(array, 0, n);
  };

  // Returns everything but the last entry of the array. Especially useful on
  // the arguments object. Passing **n** will return all the values in
  // the array, excluding the last N. The **guard** check allows it to work with
  // `_.map`.
  _.initial = function(array, n, guard) {
    return slice.call(array, 0, array.length - ((n == null) || guard ? 1 : n));
  };

  // Get the last element of an array. Passing **n** will return the last N
  // values in the array. The **guard** check allows it to work with `_.map`.
  _.last = function(array, n, guard) {
    if (array == null) return void 0;
    if ((n == null) || guard) {
      return array[array.length - 1];
    } else {
      return slice.call(array, Math.max(array.length - n, 0));
    }
  };

  // Returns everything but the first entry of the array. Aliased as `tail` and `drop`.
  // Especially useful on the arguments object. Passing an **n** will return
  // the rest N values in the array. The **guard**
  // check allows it to work with `_.map`.
  _.rest = _.tail = _.drop = function(array, n, guard) {
    return slice.call(array, (n == null) || guard ? 1 : n);
  };

  // Trim out all falsy values from an array.
  _.compact = function(array) {
    return _.filter(array, _.identity);
  };

  // Internal implementation of a recursive `flatten` function.
  var flatten = function(input, shallow, output) {
    if (shallow && _.every(input, _.isArray)) {
      return concat.apply(output, input);
    }
    each(input, function(value) {
      if (_.isArray(value) || _.isArguments(value)) {
        shallow ? push.apply(output, value) : flatten(value, shallow, output);
      } else {
        output.push(value);
      }
    });
    return output;
  };

  // Flatten out an array, either recursively (by default), or just one level.
  _.flatten = function(array, shallow) {
    return flatten(array, shallow, []);
  };

  // Return a version of the array that does not contain the specified value(s).
  _.without = function(array) {
    return _.difference(array, slice.call(arguments, 1));
  };

  // Produce a duplicate-free version of the array. If the array has already
  // been sorted, you have the option of using a faster algorithm.
  // Aliased as `unique`.
  _.uniq = _.unique = function(array, isSorted, iterator, context) {
    if (_.isFunction(isSorted)) {
      context = iterator;
      iterator = isSorted;
      isSorted = false;
    }
    var initial = iterator ? _.map(array, iterator, context) : array;
    var results = [];
    var seen = [];
    each(initial, function(value, index) {
      if (isSorted ? (!index || seen[seen.length - 1] !== value) : !_.contains(seen, value)) {
        seen.push(value);
        results.push(array[index]);
      }
    });
    return results;
  };

  // Produce an array that contains the union: each distinct element from all of
  // the passed-in arrays.
  _.union = function() {
    return _.uniq(_.flatten(arguments, true));
  };

  // Produce an array that contains every item shared between all the
  // passed-in arrays.
  _.intersection = function(array) {
    var rest = slice.call(arguments, 1);
    return _.filter(_.uniq(array), function(item) {
      return _.every(rest, function(other) {
        return _.indexOf(other, item) >= 0;
      });
    });
  };

  // Take the difference between one array and a number of other arrays.
  // Only the elements present in just the first array will remain.
  _.difference = function(array) {
    var rest = concat.apply(ArrayProto, slice.call(arguments, 1));
    return _.filter(array, function(value){ return !_.contains(rest, value); });
  };

  // Zip together multiple lists into a single array -- elements that share
  // an index go together.
  _.zip = function() {
    var length = _.max(_.pluck(arguments, "length").concat(0));
    var results = new Array(length);
    for (var i = 0; i < length; i++) {
      results[i] = _.pluck(arguments, '' + i);
    }
    return results;
  };

  // Converts lists into objects. Pass either a single array of `[key, value]`
  // pairs, or two parallel arrays of the same length -- one of keys, and one of
  // the corresponding values.
  _.object = function(list, values) {
    if (list == null) return {};
    var result = {};
    for (var i = 0, length = list.length; i < length; i++) {
      if (values) {
        result[list[i]] = values[i];
      } else {
        result[list[i][0]] = list[i][1];
      }
    }
    return result;
  };

  // If the browser doesn't supply us with indexOf (I'm looking at you, **MSIE**),
  // we need this function. Return the position of the first occurrence of an
  // item in an array, or -1 if the item is not included in the array.
  // Delegates to **ECMAScript 5**'s native `indexOf` if available.
  // If the array is large and already in sort order, pass `true`
  // for **isSorted** to use binary search.
  _.indexOf = function(array, item, isSorted) {
    if (array == null) return -1;
    var i = 0, length = array.length;
    if (isSorted) {
      if (typeof isSorted == 'number') {
        i = (isSorted < 0 ? Math.max(0, length + isSorted) : isSorted);
      } else {
        i = _.sortedIndex(array, item);
        return array[i] === item ? i : -1;
      }
    }
    if (nativeIndexOf && array.indexOf === nativeIndexOf) return array.indexOf(item, isSorted);
    for (; i < length; i++) if (array[i] === item) return i;
    return -1;
  };

  // Delegates to **ECMAScript 5**'s native `lastIndexOf` if available.
  _.lastIndexOf = function(array, item, from) {
    if (array == null) return -1;
    var hasIndex = from != null;
    if (nativeLastIndexOf && array.lastIndexOf === nativeLastIndexOf) {
      return hasIndex ? array.lastIndexOf(item, from) : array.lastIndexOf(item);
    }
    var i = (hasIndex ? from : array.length);
    while (i--) if (array[i] === item) return i;
    return -1;
  };

  // Generate an integer Array containing an arithmetic progression. A port of
  // the native Python `range()` function. See
  // [the Python documentation](http://docs.python.org/library/functions.html#range).
  _.range = function(start, stop, step) {
    if (arguments.length <= 1) {
      stop = start || 0;
      start = 0;
    }
    step = arguments[2] || 1;

    var length = Math.max(Math.ceil((stop - start) / step), 0);
    var idx = 0;
    var range = new Array(length);

    while(idx < length) {
      range[idx++] = start;
      start += step;
    }

    return range;
  };

  // Function (ahem) Functions
  // ------------------

  // Reusable constructor function for prototype setting.
  var ctor = function(){};

  // Create a function bound to a given object (assigning `this`, and arguments,
  // optionally). Delegates to **ECMAScript 5**'s native `Function.bind` if
  // available.
  _.bind = function(func, context) {
    var args, bound;
    if (nativeBind && func.bind === nativeBind) return nativeBind.apply(func, slice.call(arguments, 1));
    if (!_.isFunction(func)) throw new TypeError;
    args = slice.call(arguments, 2);
    return bound = function() {
      if (!(this instanceof bound)) return func.apply(context, args.concat(slice.call(arguments)));
      ctor.prototype = func.prototype;
      var self = new ctor;
      ctor.prototype = null;
      var result = func.apply(self, args.concat(slice.call(arguments)));
      if (Object(result) === result) return result;
      return self;
    };
  };

  // Partially apply a function by creating a version that has had some of its
  // arguments pre-filled, without changing its dynamic `this` context.
  _.partial = function(func) {
    var args = slice.call(arguments, 1);
    return function() {
      return func.apply(this, args.concat(slice.call(arguments)));
    };
  };

  // Bind all of an object's methods to that object. Useful for ensuring that
  // all callbacks defined on an object belong to it.
  _.bindAll = function(obj) {
    var funcs = slice.call(arguments, 1);
    if (funcs.length === 0) throw new Error("bindAll must be passed function names");
    each(funcs, function(f) { obj[f] = _.bind(obj[f], obj); });
    return obj;
  };

  // Memoize an expensive function by storing its results.
  _.memoize = function(func, hasher) {
    var memo = {};
    hasher || (hasher = _.identity);
    return function() {
      var key = hasher.apply(this, arguments);
      return _.has(memo, key) ? memo[key] : (memo[key] = func.apply(this, arguments));
    };
  };

  // Delays a function for the given number of milliseconds, and then calls
  // it with the arguments supplied.
  _.delay = function(func, wait) {
    var args = slice.call(arguments, 2);
    return setTimeout(function(){ return func.apply(null, args); }, wait);
  };

  // Defers a function, scheduling it to run after the current call stack has
  // cleared.
  _.defer = function(func) {
    return _.delay.apply(_, [func, 1].concat(slice.call(arguments, 1)));
  };

  // Returns a function, that, when invoked, will only be triggered at most once
  // during a given window of time. Normally, the throttled function will run
  // as much as it can, without ever going more than once per `wait` duration;
  // but if you'd like to disable the execution on the leading edge, pass
  // `{leading: false}`. To disable execution on the trailing edge, ditto.
  _.throttle = function(func, wait, options) {
    var context, args, result;
    var timeout = null;
    var previous = 0;
    options || (options = {});
    var later = function() {
      previous = options.leading === false ? 0 : new Date;
      timeout = null;
      result = func.apply(context, args);
    };
    return function() {
      var now = new Date;
      if (!previous && options.leading === false) previous = now;
      var remaining = wait - (now - previous);
      context = this;
      args = arguments;
      if (remaining <= 0) {
        clearTimeout(timeout);
        timeout = null;
        previous = now;
        result = func.apply(context, args);
      } else if (!timeout && options.trailing !== false) {
        timeout = setTimeout(later, remaining);
      }
      return result;
    };
  };

  // Returns a function, that, as long as it continues to be invoked, will not
  // be triggered. The function will be called after it stops being called for
  // N milliseconds. If `immediate` is passed, trigger the function on the
  // leading edge, instead of the trailing.
  _.debounce = function(func, wait, immediate) {
    var timeout, args, context, timestamp, result;
    return function() {
      context = this;
      args = arguments;
      timestamp = new Date();
      var later = function() {
        var last = (new Date()) - timestamp;
        if (last < wait) {
          timeout = setTimeout(later, wait - last);
        } else {
          timeout = null;
          if (!immediate) result = func.apply(context, args);
        }
      };
      var callNow = immediate && !timeout;
      if (!timeout) {
        timeout = setTimeout(later, wait);
      }
      if (callNow) result = func.apply(context, args);
      return result;
    };
  };

  // Returns a function that will be executed at most one time, no matter how
  // often you call it. Useful for lazy initialization.
  _.once = function(func) {
    var ran = false, memo;
    return function() {
      if (ran) return memo;
      ran = true;
      memo = func.apply(this, arguments);
      func = null;
      return memo;
    };
  };

  // Returns the first function passed as an argument to the second,
  // allowing you to adjust arguments, run code before and after, and
  // conditionally execute the original function.
  _.wrap = function(func, wrapper) {
    return function() {
      var args = [func];
      push.apply(args, arguments);
      return wrapper.apply(this, args);
    };
  };

  // Returns a function that is the composition of a list of functions, each
  // consuming the return value of the function that follows.
  _.compose = function() {
    var funcs = arguments;
    return function() {
      var args = arguments;
      for (var i = funcs.length - 1; i >= 0; i--) {
        args = [funcs[i].apply(this, args)];
      }
      return args[0];
    };
  };

  // Returns a function that will only be executed after being called N times.
  _.after = function(times, func) {
    return function() {
      if (--times < 1) {
        return func.apply(this, arguments);
      }
    };
  };

  // Object Functions
  // ----------------

  // Retrieve the names of an object's properties.
  // Delegates to **ECMAScript 5**'s native `Object.keys`
  _.keys = nativeKeys || function(obj) {
    if (obj !== Object(obj)) throw new TypeError('Invalid object');
    var keys = [];
    for (var key in obj) if (_.has(obj, key)) keys.push(key);
    return keys;
  };

  // Retrieve the values of an object's properties.
  _.values = function(obj) {
    var keys = _.keys(obj);
    var length = keys.length;
    var values = new Array(length);
    for (var i = 0; i < length; i++) {
      values[i] = obj[keys[i]];
    }
    return values;
  };

  // Convert an object into a list of `[key, value]` pairs.
  _.pairs = function(obj) {
    var keys = _.keys(obj);
    var length = keys.length;
    var pairs = new Array(length);
    for (var i = 0; i < length; i++) {
      pairs[i] = [keys[i], obj[keys[i]]];
    }
    return pairs;
  };

  // Invert the keys and values of an object. The values must be serializable.
  _.invert = function(obj) {
    var result = {};
    var keys = _.keys(obj);
    for (var i = 0, length = keys.length; i < length; i++) {
      result[obj[keys[i]]] = keys[i];
    }
    return result;
  };

  // Return a sorted list of the function names available on the object.
  // Aliased as `methods`
  _.functions = _.methods = function(obj) {
    var names = [];
    for (var key in obj) {
      if (_.isFunction(obj[key])) names.push(key);
    }
    return names.sort();
  };

  // Extend a given object with all the properties in passed-in object(s).
  _.extend = function(obj) {
    each(slice.call(arguments, 1), function(source) {
      if (source) {
        for (var prop in source) {
          obj[prop] = source[prop];
        }
      }
    });
    return obj;
  };

  // Return a copy of the object only containing the whitelisted properties.
  _.pick = function(obj) {
    var copy = {};
    var keys = concat.apply(ArrayProto, slice.call(arguments, 1));
    each(keys, function(key) {
      if (key in obj) copy[key] = obj[key];
    });
    return copy;
  };

   // Return a copy of the object without the blacklisted properties.
  _.omit = function(obj) {
    var copy = {};
    var keys = concat.apply(ArrayProto, slice.call(arguments, 1));
    for (var key in obj) {
      if (!_.contains(keys, key)) copy[key] = obj[key];
    }
    return copy;
  };

  // Fill in a given object with default properties.
  _.defaults = function(obj) {
    each(slice.call(arguments, 1), function(source) {
      if (source) {
        for (var prop in source) {
          if (obj[prop] === void 0) obj[prop] = source[prop];
        }
      }
    });
    return obj;
  };

  // Create a (shallow-cloned) duplicate of an object.
  _.clone = function(obj) {
    if (!_.isObject(obj)) return obj;
    return _.isArray(obj) ? obj.slice() : _.extend({}, obj);
  };

  // Invokes interceptor with the obj, and then returns obj.
  // The primary purpose of this method is to "tap into" a method chain, in
  // order to perform operations on intermediate results within the chain.
  _.tap = function(obj, interceptor) {
    interceptor(obj);
    return obj;
  };

  // Internal recursive comparison function for `isEqual`.
  var eq = function(a, b, aStack, bStack) {
    // Identical objects are equal. `0 === -0`, but they aren't identical.
    // See the [Harmony `egal` proposal](http://wiki.ecmascript.org/doku.php?id=harmony:egal).
    if (a === b) return a !== 0 || 1 / a == 1 / b;
    // A strict comparison is necessary because `null == undefined`.
    if (a == null || b == null) return a === b;
    // Unwrap any wrapped objects.
    if (a instanceof _) a = a._wrapped;
    if (b instanceof _) b = b._wrapped;
    // Compare `[[Class]]` names.
    var className = toString.call(a);
    if (className != toString.call(b)) return false;
    switch (className) {
      // Strings, numbers, dates, and booleans are compared by value.
      case '[object String]':
        // Primitives and their corresponding object wrappers are equivalent; thus, `"5"` is
        // equivalent to `new String("5")`.
        return a == String(b);
      case '[object Number]':
        // `NaN`s are equivalent, but non-reflexive. An `egal` comparison is performed for
        // other numeric values.
        return a != +a ? b != +b : (a == 0 ? 1 / a == 1 / b : a == +b);
      case '[object Date]':
      case '[object Boolean]':
        // Coerce dates and booleans to numeric primitive values. Dates are compared by their
        // millisecond representations. Note that invalid dates with millisecond representations
        // of `NaN` are not equivalent.
        return +a == +b;
      // RegExps are compared by their source patterns and flags.
      case '[object RegExp]':
        return a.source == b.source &&
               a.global == b.global &&
               a.multiline == b.multiline &&
               a.ignoreCase == b.ignoreCase;
    }
    if (typeof a != 'object' || typeof b != 'object') return false;
    // Assume equality for cyclic structures. The algorithm for detecting cyclic
    // structures is adapted from ES 5.1 section 15.12.3, abstract operation `JO`.
    var length = aStack.length;
    while (length--) {
      // Linear search. Performance is inversely proportional to the number of
      // unique nested structures.
      if (aStack[length] == a) return bStack[length] == b;
    }
    // Objects with different constructors are not equivalent, but `Object`s
    // from different frames are.
    var aCtor = a.constructor, bCtor = b.constructor;
    if (aCtor !== bCtor && !(_.isFunction(aCtor) && (aCtor instanceof aCtor) &&
                             _.isFunction(bCtor) && (bCtor instanceof bCtor))) {
      return false;
    }
    // Add the first object to the stack of traversed objects.
    aStack.push(a);
    bStack.push(b);
    var size = 0, result = true;
    // Recursively compare objects and arrays.
    if (className == '[object Array]') {
      // Compare array lengths to determine if a deep comparison is necessary.
      size = a.length;
      result = size == b.length;
      if (result) {
        // Deep compare the contents, ignoring non-numeric properties.
        while (size--) {
          if (!(result = eq(a[size], b[size], aStack, bStack))) break;
        }
      }
    } else {
      // Deep compare objects.
      for (var key in a) {
        if (_.has(a, key)) {
          // Count the expected number of properties.
          size++;
          // Deep compare each member.
          if (!(result = _.has(b, key) && eq(a[key], b[key], aStack, bStack))) break;
        }
      }
      // Ensure that both objects contain the same number of properties.
      if (result) {
        for (key in b) {
          if (_.has(b, key) && !(size--)) break;
        }
        result = !size;
      }
    }
    // Remove the first object from the stack of traversed objects.
    aStack.pop();
    bStack.pop();
    return result;
  };

  // Perform a deep comparison to check if two objects are equal.
  _.isEqual = function(a, b) {
    return eq(a, b, [], []);
  };

  // Is a given array, string, or object empty?
  // An "empty" object has no enumerable own-properties.
  _.isEmpty = function(obj) {
    if (obj == null) return true;
    if (_.isArray(obj) || _.isString(obj)) return obj.length === 0;
    for (var key in obj) if (_.has(obj, key)) return false;
    return true;
  };

  // Is a given value a DOM element?
  _.isElement = function(obj) {
    return !!(obj && obj.nodeType === 1);
  };

  // Is a given value an array?
  // Delegates to ECMA5's native Array.isArray
  _.isArray = nativeIsArray || function(obj) {
    return toString.call(obj) == '[object Array]';
  };

  // Is a given variable an object?
  _.isObject = function(obj) {
    return obj === Object(obj);
  };

  // Add some isType methods: isArguments, isFunction, isString, isNumber, isDate, isRegExp.
  each(['Arguments', 'Function', 'String', 'Number', 'Date', 'RegExp'], function(name) {
    _['is' + name] = function(obj) {
      return toString.call(obj) == '[object ' + name + ']';
    };
  });

  // Define a fallback version of the method in browsers (ahem, IE), where
  // there isn't any inspectable "Arguments" type.
  if (!_.isArguments(arguments)) {
    _.isArguments = function(obj) {
      return !!(obj && _.has(obj, 'callee'));
    };
  }

  // Optimize `isFunction` if appropriate.
  if (typeof (/./) !== 'function') {
    _.isFunction = function(obj) {
      return typeof obj === 'function';
    };
  }

  // Is a given object a finite number?
  _.isFinite = function(obj) {
    return isFinite(obj) && !isNaN(parseFloat(obj));
  };

  // Is the given value `NaN`? (NaN is the only number which does not equal itself).
  _.isNaN = function(obj) {
    return _.isNumber(obj) && obj != +obj;
  };

  // Is a given value a boolean?
  _.isBoolean = function(obj) {
    return obj === true || obj === false || toString.call(obj) == '[object Boolean]';
  };

  // Is a given value equal to null?
  _.isNull = function(obj) {
    return obj === null;
  };

  // Is a given variable undefined?
  _.isUndefined = function(obj) {
    return obj === void 0;
  };

  // Shortcut function for checking if an object has a given property directly
  // on itself (in other words, not on a prototype).
  _.has = function(obj, key) {
    return hasOwnProperty.call(obj, key);
  };

  // Utility Functions
  // -----------------

  // Run Underscore.js in *noConflict* mode, returning the `_` variable to its
  // previous owner. Returns a reference to the Underscore object.
  _.noConflict = function() {
    root._ = previousUnderscore;
    return this;
  };

  // Keep the identity function around for default iterators.
  _.identity = function(value) {
    return value;
  };

  // Run a function **n** times.
  _.times = function(n, iterator, context) {
    var accum = Array(Math.max(0, n));
    for (var i = 0; i < n; i++) accum[i] = iterator.call(context, i);
    return accum;
  };

  // Return a random integer between min and max (inclusive).
  _.random = function(min, max) {
    if (max == null) {
      max = min;
      min = 0;
    }
    return min + Math.floor(Math.random() * (max - min + 1));
  };

  // List of HTML entities for escaping.
  var entityMap = {
    escape: {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#x27;'
    }
  };
  entityMap.unescape = _.invert(entityMap.escape);

  // Regexes containing the keys and values listed immediately above.
  var entityRegexes = {
    escape:   new RegExp('[' + _.keys(entityMap.escape).join('') + ']', 'g'),
    unescape: new RegExp('(' + _.keys(entityMap.unescape).join('|') + ')', 'g')
  };

  // Functions for escaping and unescaping strings to/from HTML interpolation.
  _.each(['escape', 'unescape'], function(method) {
    _[method] = function(string) {
      if (string == null) return '';
      return ('' + string).replace(entityRegexes[method], function(match) {
        return entityMap[method][match];
      });
    };
  });

  // If the value of the named `property` is a function then invoke it with the
  // `object` as context; otherwise, return it.
  _.result = function(object, property) {
    if (object == null) return void 0;
    var value = object[property];
    return _.isFunction(value) ? value.call(object) : value;
  };

  // Add your own custom functions to the Underscore object.
  _.mixin = function(obj) {
    each(_.functions(obj), function(name) {
      var func = _[name] = obj[name];
      _.prototype[name] = function() {
        var args = [this._wrapped];
        push.apply(args, arguments);
        return result.call(this, func.apply(_, args));
      };
    });
  };

  // Generate a unique integer id (unique within the entire client session).
  // Useful for temporary DOM ids.
  var idCounter = 0;
  _.uniqueId = function(prefix) {
    var id = ++idCounter + '';
    return prefix ? prefix + id : id;
  };

  // By default, Underscore uses ERB-style template delimiters, change the
  // following template settings to use alternative delimiters.
  _.templateSettings = {
    evaluate    : /<%([\s\S]+?)%>/g,
    interpolate : /<%=([\s\S]+?)%>/g,
    escape      : /<%-([\s\S]+?)%>/g
  };

  // When customizing `templateSettings`, if you don't want to define an
  // interpolation, evaluation or escaping regex, we need one that is
  // guaranteed not to match.
  var noMatch = /(.)^/;

  // Certain characters need to be escaped so that they can be put into a
  // string literal.
  var escapes = {
    "'":      "'",
    '\\':     '\\',
    '\r':     'r',
    '\n':     'n',
    '\t':     't',
    '\u2028': 'u2028',
    '\u2029': 'u2029'
  };

  var escaper = /\\|'|\r|\n|\t|\u2028|\u2029/g;

  // JavaScript micro-templating, similar to John Resig's implementation.
  // Underscore templating handles arbitrary delimiters, preserves whitespace,
  // and correctly escapes quotes within interpolated code.
  _.template = function(text, data, settings) {
    var render;
    settings = _.defaults({}, settings, _.templateSettings);

    // Combine delimiters into one regular expression via alternation.
    var matcher = new RegExp([
      (settings.escape || noMatch).source,
      (settings.interpolate || noMatch).source,
      (settings.evaluate || noMatch).source
    ].join('|') + '|$', 'g');

    // Compile the template source, escaping string literals appropriately.
    var index = 0;
    var source = "__p+='";
    text.replace(matcher, function(match, escape, interpolate, evaluate, offset) {
      source += text.slice(index, offset)
        .replace(escaper, function(match) { return '\\' + escapes[match]; });

      if (escape) {
        source += "'+\n((__t=(" + escape + "))==null?'':_.escape(__t))+\n'";
      }
      if (interpolate) {
        source += "'+\n((__t=(" + interpolate + "))==null?'':__t)+\n'";
      }
      if (evaluate) {
        source += "';\n" + evaluate + "\n__p+='";
      }
      index = offset + match.length;
      return match;
    });
    source += "';\n";

    // If a variable is not specified, place data values in local scope.
    if (!settings.variable) source = 'with(obj||{}){\n' + source + '}\n';

    source = "var __t,__p='',__j=Array.prototype.join," +
      "print=function(){__p+=__j.call(arguments,'');};\n" +
      source + "return __p;\n";

    try {
      render = new Function(settings.variable || 'obj', '_', source);
    } catch (e) {
      e.source = source;
      throw e;
    }

    if (data) return render(data, _);
    var template = function(data) {
      return render.call(this, data, _);
    };

    // Provide the compiled function source as a convenience for precompilation.
    template.source = 'function(' + (settings.variable || 'obj') + '){\n' + source + '}';

    return template;
  };

  // Add a "chain" function, which will delegate to the wrapper.
  _.chain = function(obj) {
    return _(obj).chain();
  };

  // OOP
  // ---------------
  // If Underscore is called as a function, it returns a wrapped object that
  // can be used OO-style. This wrapper holds altered versions of all the
  // underscore functions. Wrapped objects may be chained.

  // Helper function to continue chaining intermediate results.
  var result = function(obj) {
    return this._chain ? _(obj).chain() : obj;
  };

  // Add all of the Underscore functions to the wrapper object.
  _.mixin(_);

  // Add all mutator Array functions to the wrapper.
  each(['pop', 'push', 'reverse', 'shift', 'sort', 'splice', 'unshift'], function(name) {
    var method = ArrayProto[name];
    _.prototype[name] = function() {
      var obj = this._wrapped;
      method.apply(obj, arguments);
      if ((name == 'shift' || name == 'splice') && obj.length === 0) delete obj[0];
      return result.call(this, obj);
    };
  });

  // Add all accessor Array functions to the wrapper.
  each(['concat', 'join', 'slice'], function(name) {
    var method = ArrayProto[name];
    _.prototype[name] = function() {
      return result.call(this, method.apply(this._wrapped, arguments));
    };
  });

  _.extend(_.prototype, {

    // Start chaining a wrapped Underscore object.
    chain: function() {
      this._chain = true;
      return this;
    },

    // Extracts the result from a wrapped and chained object.
    value: function() {
      return this._wrapped;
    }

  });

}).call(this);

},{}]},{},[1])
//@ sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlcyI6WyJDOlxcd29ya3NwYWNlXFxSZWJ1c1xcc3JjXFxSZWJ1cy5GbGVldEtlZXBlclxcV2ViXFxhcHAuanMiLCJDOlxcd29ya3NwYWNlXFxSZWJ1c1xcc3JjXFxSZWJ1cy5GbGVldEtlZXBlclxcV2ViXFxsaWJcXGpxdWVyeS5tb3VzZXdoZWVsLmpzIiwiQzpcXHdvcmtzcGFjZVxcUmVidXNcXHNyY1xcUmVidXMuRmxlZXRLZWVwZXJcXFdlYlxcbGliXFxqcXVlcnkuc2lnbmFsUi0yLjAuMC1iZXRhMi5qcyIsIkM6XFx3b3Jrc3BhY2VcXFJlYnVzXFxzcmNcXFJlYnVzLkZsZWV0S2VlcGVyXFxXZWJcXG5vZGVfbW9kdWxlc1xcanNvbi1wYXRjaFxcanNvbnBhdGNoLmpzIiwiQzpcXHdvcmtzcGFjZVxcUmVidXNcXHNyY1xcUmVidXMuRmxlZXRLZWVwZXJcXFdlYlxcbm9kZV9tb2R1bGVzXFx1bmRlcnNjb3JlXFx1bmRlcnNjb3JlLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNySEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwcUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25oQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsInNvdXJjZXNDb250ZW50IjpbInJlcXVpcmUoJ2pxdWVyeScpO1xyXG5yZXF1aXJlKFwiYW5ndWxhclwiKTtcclxucmVxdWlyZShcImFuZ3VsYXJfYW5pbWF0ZVwiKTtcclxuXHJcbnZhciBfID0gcmVxdWlyZShcInVuZGVyc2NvcmVcIik7XHJcblxyXG5yZXF1aXJlKCcuL2xpYi9qcXVlcnkuc2lnbmFsUi0yLjAuMC1iZXRhMi5qcycpO1xyXG5yZXF1aXJlKCcuL2xpYi9qcXVlcnkubW91c2V3aGVlbC5qcycpKCQpO1xyXG5cclxuXHJcbiQoXCJib2R5XCIpLm1vdXNld2hlZWwoZnVuY3Rpb24oZXZlbnQsIGRlbHRhKSB7XHJcbiAgdGhpcy5zY3JvbGxMZWZ0IC09IChkZWx0YSAqIDMwKTtcclxuICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xyXG59KTtcclxuXHJcbnZhciBwYXRjaGVyID0gcmVxdWlyZShcImpzb24tcGF0Y2hcIik7XHJcblxyXG52YXIgYXBwID0gYW5ndWxhci5tb2R1bGUoJ2ZsZWV0a2VlcGVyJywgWyduZ0FuaW1hdGUnXSk7XHJcblxyXG5hcHAuZGlyZWN0aXZlKCdoaWdobGlnaHRPbkNoYW5nZScsIGZ1bmN0aW9uKCRhbmltYXRlKSB7XHJcbiAgcmV0dXJuIHtcclxuICAgIGxpbms6IGZ1bmN0aW9uKCRzY29wZSwgZWxlbWVudCwgYXR0cnMpIHtcclxuICAgICAgYXR0cnMuJG9ic2VydmUoJ2hpZ2hsaWdodE9uQ2hhbmdlJywgZnVuY3Rpb24odmFsKSB7XHJcbiAgICAgICAgdmFyIGVsID0gJChlbGVtZW50KTtcclxuICAgICAgICBlbC5yZW1vdmVDbGFzcygnaGVhcnRiZWF0Jyk7XHJcbiAgICAgICAgXy5kZWZlcihmdW5jdGlvbigpIHtcclxuICAgICAgICAgIGVsLmFkZENsYXNzKCdoZWFydGJlYXQnKVxyXG4gICAgICAgIH0pO1xyXG4gICAgICB9KTtcclxuICAgIH1cclxuICB9O1xyXG59KTtcclxuXHJcbmFwcC5jb250cm9sbGVyKCdJbmRleENvbnRyb2xsZXInLCBmdW5jdGlvbigkc2NvcGUpIHtcclxuICB2YXIgaHViID0gJC5jb25uZWN0aW9uLmZsZWV0S2VlcGVySHViO1xyXG4gICRzY29wZS52ZXJzaW9uID0gLTE7XHJcbiAgJHNjb3BlLnNlcnZpY2VzID0ge307XHJcblxyXG4gIGh1Yi5jbGllbnQuZXhlY3V0ZSA9IGZ1bmN0aW9uKHZpZXcsIHBhdGNoKSB7XHJcbiAgICAkc2NvcGUuJGFwcGx5KGZ1bmN0aW9uKCkge1xyXG4gICAgICBpZiAocGF0Y2gudmVyc2lvbiAhPSAkc2NvcGUudmVyc2lvbisxICYmICRzY29wZS52ZXJzaW9uICE9IC0xKVxyXG4gICAgICAgIHJldHVybjtcclxuXHJcbiAgICAgICRzY29wZS52ZXJzaW9uID0gcGF0Y2gudmVyc2lvbjtcclxuXHJcbiAgICAgIHBhdGNoZXIuYXBwbHkoJHNjb3BlLCBbe1xyXG4gICAgICAgIG9wOiBwYXRjaC5vcCxcclxuICAgICAgICBwYXRoOiAnLycgKyB2aWV3ICsgcGF0Y2gucGF0aCxcclxuICAgICAgICB2YWx1ZTogcGF0Y2gudmFsdWVcclxuICAgICAgfV0pO1xyXG4gICAgfSk7XHJcbiAgfTtcclxufSk7IiwiLyohIENvcHlyaWdodCAoYykgMjAxMyBCcmFuZG9uIEFhcm9uIChodHRwOi8vYnJhbmRvbmFhcm9uLm5ldClcbiAqIExpY2Vuc2VkIHVuZGVyIHRoZSBNSVQgTGljZW5zZSAoTElDRU5TRS50eHQpLlxuICpcbiAqIFRoYW5rcyB0bzogaHR0cDovL2Fkb21hcy5vcmcvamF2YXNjcmlwdC1tb3VzZS13aGVlbC8gZm9yIHNvbWUgcG9pbnRlcnMuXG4gKiBUaGFua3MgdG86IE1hdGhpYXMgQmFuayhodHRwOi8vd3d3Lm1hdGhpYXMtYmFuay5kZSkgZm9yIGEgc2NvcGUgYnVnIGZpeC5cbiAqIFRoYW5rcyB0bzogU2VhbXVzIExlYWh5IGZvciBhZGRpbmcgZGVsdGFYIGFuZCBkZWx0YVlcbiAqXG4gKiBWZXJzaW9uOiAzLjEuM1xuICpcbiAqIFJlcXVpcmVzOiAxLjIuMitcbiAqL1xuXG4oZnVuY3Rpb24gKGZhY3RvcnkpIHtcbiAgICBpZiAoIHR5cGVvZiBkZWZpbmUgPT09ICdmdW5jdGlvbicgJiYgZGVmaW5lLmFtZCApIHtcbiAgICAgICAgLy8gQU1ELiBSZWdpc3RlciBhcyBhbiBhbm9ueW1vdXMgbW9kdWxlLlxuICAgICAgICBkZWZpbmUoWydqcXVlcnknXSwgZmFjdG9yeSk7XG4gICAgfSBlbHNlIGlmICh0eXBlb2YgZXhwb3J0cyA9PT0gJ29iamVjdCcpIHtcbiAgICAgICAgLy8gTm9kZS9Db21tb25KUyBzdHlsZSBmb3IgQnJvd3NlcmlmeVxuICAgICAgICBtb2R1bGUuZXhwb3J0cyA9IGZhY3Rvcnk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgLy8gQnJvd3NlciBnbG9iYWxzXG4gICAgICAgIGZhY3RvcnkoalF1ZXJ5KTtcbiAgICB9XG59KGZ1bmN0aW9uICgkKSB7XG5cbiAgICB2YXIgdG9GaXggPSBbJ3doZWVsJywgJ21vdXNld2hlZWwnLCAnRE9NTW91c2VTY3JvbGwnLCAnTW96TW91c2VQaXhlbFNjcm9sbCddO1xuICAgIHZhciB0b0JpbmQgPSAnb253aGVlbCcgaW4gZG9jdW1lbnQgfHwgZG9jdW1lbnQuZG9jdW1lbnRNb2RlID49IDkgPyBbJ3doZWVsJ10gOiBbJ21vdXNld2hlZWwnLCAnRG9tTW91c2VTY3JvbGwnLCAnTW96TW91c2VQaXhlbFNjcm9sbCddO1xuICAgIHZhciBsb3dlc3REZWx0YSwgbG93ZXN0RGVsdGFYWTtcblxuICAgIGlmICggJC5ldmVudC5maXhIb29rcyApIHtcbiAgICAgICAgZm9yICggdmFyIGkgPSB0b0ZpeC5sZW5ndGg7IGk7ICkge1xuICAgICAgICAgICAgJC5ldmVudC5maXhIb29rc1sgdG9GaXhbLS1pXSBdID0gJC5ldmVudC5tb3VzZUhvb2tzO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgJC5ldmVudC5zcGVjaWFsLm1vdXNld2hlZWwgPSB7XG4gICAgICAgIHNldHVwOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIGlmICggdGhpcy5hZGRFdmVudExpc3RlbmVyICkge1xuICAgICAgICAgICAgICAgIGZvciAoIHZhciBpID0gdG9CaW5kLmxlbmd0aDsgaTsgKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuYWRkRXZlbnRMaXN0ZW5lciggdG9CaW5kWy0taV0sIGhhbmRsZXIsIGZhbHNlICk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB0aGlzLm9ubW91c2V3aGVlbCA9IGhhbmRsZXI7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG5cbiAgICAgICAgdGVhcmRvd246IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgaWYgKCB0aGlzLnJlbW92ZUV2ZW50TGlzdGVuZXIgKSB7XG4gICAgICAgICAgICAgICAgZm9yICggdmFyIGkgPSB0b0JpbmQubGVuZ3RoOyBpOyApIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5yZW1vdmVFdmVudExpc3RlbmVyKCB0b0JpbmRbLS1pXSwgaGFuZGxlciwgZmFsc2UgKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHRoaXMub25tb3VzZXdoZWVsID0gbnVsbDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH07XG5cbiAgICAkLmZuLmV4dGVuZCh7XG4gICAgICAgIG1vdXNld2hlZWw6IGZ1bmN0aW9uKGZuKSB7XG4gICAgICAgICAgICByZXR1cm4gZm4gPyB0aGlzLmJpbmQoXCJtb3VzZXdoZWVsXCIsIGZuKSA6IHRoaXMudHJpZ2dlcihcIm1vdXNld2hlZWxcIik7XG4gICAgICAgIH0sXG5cbiAgICAgICAgdW5tb3VzZXdoZWVsOiBmdW5jdGlvbihmbikge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMudW5iaW5kKFwibW91c2V3aGVlbFwiLCBmbik7XG4gICAgICAgIH1cbiAgICB9KTtcblxuXG4gICAgZnVuY3Rpb24gaGFuZGxlcihldmVudCkge1xuICAgICAgICB2YXIgb3JnRXZlbnQgPSBldmVudCB8fCB3aW5kb3cuZXZlbnQsXG4gICAgICAgICAgICBhcmdzID0gW10uc2xpY2UuY2FsbChhcmd1bWVudHMsIDEpLFxuICAgICAgICAgICAgZGVsdGEgPSAwLFxuICAgICAgICAgICAgZGVsdGFYID0gMCxcbiAgICAgICAgICAgIGRlbHRhWSA9IDAsXG4gICAgICAgICAgICBhYnNEZWx0YSA9IDAsXG4gICAgICAgICAgICBhYnNEZWx0YVhZID0gMCxcbiAgICAgICAgICAgIGZuO1xuICAgICAgICBldmVudCA9ICQuZXZlbnQuZml4KG9yZ0V2ZW50KTtcbiAgICAgICAgZXZlbnQudHlwZSA9IFwibW91c2V3aGVlbFwiO1xuXG4gICAgICAgIC8vIE9sZCBzY2hvb2wgc2Nyb2xsd2hlZWwgZGVsdGFcbiAgICAgICAgaWYgKCBvcmdFdmVudC53aGVlbERlbHRhICkgeyBkZWx0YSA9IG9yZ0V2ZW50LndoZWVsRGVsdGE7IH1cbiAgICAgICAgaWYgKCBvcmdFdmVudC5kZXRhaWwgKSAgICAgeyBkZWx0YSA9IG9yZ0V2ZW50LmRldGFpbCAqIC0xOyB9XG5cbiAgICAgICAgLy8gTmV3IHNjaG9vbCB3aGVlbCBkZWx0YSAod2hlZWwgZXZlbnQpXG4gICAgICAgIGlmICggb3JnRXZlbnQuZGVsdGFZICkge1xuICAgICAgICAgICAgZGVsdGFZID0gb3JnRXZlbnQuZGVsdGFZICogLTE7XG4gICAgICAgICAgICBkZWx0YSAgPSBkZWx0YVk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCBvcmdFdmVudC5kZWx0YVggKSB7XG4gICAgICAgICAgICBkZWx0YVggPSBvcmdFdmVudC5kZWx0YVg7XG4gICAgICAgICAgICBkZWx0YSAgPSBkZWx0YVggKiAtMTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFdlYmtpdFxuICAgICAgICBpZiAoIG9yZ0V2ZW50LndoZWVsRGVsdGFZICE9PSB1bmRlZmluZWQgKSB7IGRlbHRhWSA9IG9yZ0V2ZW50LndoZWVsRGVsdGFZOyB9XG4gICAgICAgIGlmICggb3JnRXZlbnQud2hlZWxEZWx0YVggIT09IHVuZGVmaW5lZCApIHsgZGVsdGFYID0gb3JnRXZlbnQud2hlZWxEZWx0YVggKiAtMTsgfVxuXG4gICAgICAgIC8vIExvb2sgZm9yIGxvd2VzdCBkZWx0YSB0byBub3JtYWxpemUgdGhlIGRlbHRhIHZhbHVlc1xuICAgICAgICBhYnNEZWx0YSA9IE1hdGguYWJzKGRlbHRhKTtcbiAgICAgICAgaWYgKCAhbG93ZXN0RGVsdGEgfHwgYWJzRGVsdGEgPCBsb3dlc3REZWx0YSApIHsgbG93ZXN0RGVsdGEgPSBhYnNEZWx0YTsgfVxuICAgICAgICBhYnNEZWx0YVhZID0gTWF0aC5tYXgoTWF0aC5hYnMoZGVsdGFZKSwgTWF0aC5hYnMoZGVsdGFYKSk7XG4gICAgICAgIGlmICggIWxvd2VzdERlbHRhWFkgfHwgYWJzRGVsdGFYWSA8IGxvd2VzdERlbHRhWFkgKSB7IGxvd2VzdERlbHRhWFkgPSBhYnNEZWx0YVhZOyB9XG5cbiAgICAgICAgLy8gR2V0IGEgd2hvbGUgdmFsdWUgZm9yIHRoZSBkZWx0YXNcbiAgICAgICAgZm4gPSBkZWx0YSA+IDAgPyAnZmxvb3InIDogJ2NlaWwnO1xuICAgICAgICBkZWx0YSAgPSBNYXRoW2ZuXShkZWx0YSAvIGxvd2VzdERlbHRhKTtcbiAgICAgICAgZGVsdGFYID0gTWF0aFtmbl0oZGVsdGFYIC8gbG93ZXN0RGVsdGFYWSk7XG4gICAgICAgIGRlbHRhWSA9IE1hdGhbZm5dKGRlbHRhWSAvIGxvd2VzdERlbHRhWFkpO1xuXG4gICAgICAgIC8vIEFkZCBldmVudCBhbmQgZGVsdGEgdG8gdGhlIGZyb250IG9mIHRoZSBhcmd1bWVudHNcbiAgICAgICAgYXJncy51bnNoaWZ0KGV2ZW50LCBkZWx0YSwgZGVsdGFYLCBkZWx0YVkpO1xuXG4gICAgICAgIHJldHVybiAoJC5ldmVudC5kaXNwYXRjaCB8fCAkLmV2ZW50LmhhbmRsZSkuYXBwbHkodGhpcywgYXJncyk7XG4gICAgfVxuXG59KSk7XG4iLCIvKiBqcXVlcnkuc2lnbmFsUi5jb3JlLmpzICovXHJcbi8qZ2xvYmFsIHdpbmRvdzpmYWxzZSAqL1xyXG4vKiFcclxuICogQVNQLk5FVCBTaWduYWxSIEphdmFTY3JpcHQgTGlicmFyeSB2Mi4wLjAtYmV0YTJcclxuICogaHR0cDovL3NpZ25hbHIubmV0L1xyXG4gKlxyXG4gKiBDb3B5cmlnaHQgKEMpIE1pY3Jvc29mdCBDb3Jwb3JhdGlvbi4gQWxsIHJpZ2h0cyByZXNlcnZlZC5cclxuICpcclxuICovXHJcblxyXG4vLy8gPHJlZmVyZW5jZSBwYXRoPVwiU2NyaXB0cy9qcXVlcnktMS42LjQuanNcIiAvPlxyXG4vLy8gPHJlZmVyZW5jZSBwYXRoPVwianF1ZXJ5LnNpZ25hbFIudmVyc2lvbi5qc1wiIC8+XHJcbihmdW5jdGlvbiAoJCwgd2luZG93KSB7XHJcbiAgICBcInVzZSBzdHJpY3RcIjtcclxuXHJcbiAgICBpZiAodHlwZW9mICgkKSAhPT0gXCJmdW5jdGlvblwiKSB7XHJcbiAgICAgICAgLy8gbm8galF1ZXJ5IVxyXG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcIlNpZ25hbFI6IGpRdWVyeSBub3QgZm91bmQuIFBsZWFzZSBlbnN1cmUgalF1ZXJ5IGlzIHJlZmVyZW5jZWQgYmVmb3JlIHRoZSBTaWduYWxSLmpzIGZpbGUuXCIpO1xyXG4gICAgfVxyXG5cclxuICAgIHZhciBzaWduYWxSLFxyXG4gICAgICAgIF9jb25uZWN0aW9uLFxyXG4gICAgICAgIF9wYWdlTG9hZGVkID0gKHdpbmRvdy5kb2N1bWVudC5yZWFkeVN0YXRlID09PSBcImNvbXBsZXRlXCIpLFxyXG4gICAgICAgIF9wYWdlV2luZG93ID0gJCh3aW5kb3cpLFxyXG4gICAgICAgIF9uZWdvdGlhdGVBYm9ydFRleHQgPSBcIl9fTmVnb3RpYXRlIEFib3J0ZWRfX1wiLFxyXG4gICAgICAgIGV2ZW50cyA9IHtcclxuICAgICAgICAgICAgb25TdGFydDogXCJvblN0YXJ0XCIsXHJcbiAgICAgICAgICAgIG9uU3RhcnRpbmc6IFwib25TdGFydGluZ1wiLFxyXG4gICAgICAgICAgICBvblJlY2VpdmVkOiBcIm9uUmVjZWl2ZWRcIixcclxuICAgICAgICAgICAgb25FcnJvcjogXCJvbkVycm9yXCIsXHJcbiAgICAgICAgICAgIG9uQ29ubmVjdGlvblNsb3c6IFwib25Db25uZWN0aW9uU2xvd1wiLFxyXG4gICAgICAgICAgICBvblJlY29ubmVjdGluZzogXCJvblJlY29ubmVjdGluZ1wiLFxyXG4gICAgICAgICAgICBvblJlY29ubmVjdDogXCJvblJlY29ubmVjdFwiLFxyXG4gICAgICAgICAgICBvblN0YXRlQ2hhbmdlZDogXCJvblN0YXRlQ2hhbmdlZFwiLFxyXG4gICAgICAgICAgICBvbkRpc2Nvbm5lY3Q6IFwib25EaXNjb25uZWN0XCJcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICBsb2cgPSBmdW5jdGlvbiAobXNnLCBsb2dnaW5nKSB7XHJcbiAgICAgICAgICAgIGlmIChsb2dnaW5nID09PSBmYWxzZSkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHZhciBtO1xyXG4gICAgICAgICAgICBpZiAodHlwZW9mICh3aW5kb3cuY29uc29sZSkgPT09IFwidW5kZWZpbmVkXCIpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBtID0gXCJbXCIgKyBuZXcgRGF0ZSgpLnRvVGltZVN0cmluZygpICsgXCJdIFNpZ25hbFI6IFwiICsgbXNnO1xyXG4gICAgICAgICAgICBpZiAod2luZG93LmNvbnNvbGUuZGVidWcpIHtcclxuICAgICAgICAgICAgICAgIHdpbmRvdy5jb25zb2xlLmRlYnVnKG0pO1xyXG4gICAgICAgICAgICB9IGVsc2UgaWYgKHdpbmRvdy5jb25zb2xlLmxvZykge1xyXG4gICAgICAgICAgICAgICAgd2luZG93LmNvbnNvbGUubG9nKG0pO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgY2hhbmdlU3RhdGUgPSBmdW5jdGlvbiAoY29ubmVjdGlvbiwgZXhwZWN0ZWRTdGF0ZSwgbmV3U3RhdGUpIHtcclxuICAgICAgICAgICAgaWYgKGV4cGVjdGVkU3RhdGUgPT09IGNvbm5lY3Rpb24uc3RhdGUpIHtcclxuICAgICAgICAgICAgICAgIGNvbm5lY3Rpb24uc3RhdGUgPSBuZXdTdGF0ZTtcclxuXHJcbiAgICAgICAgICAgICAgICAkKGNvbm5lY3Rpb24pLnRyaWdnZXJIYW5kbGVyKGV2ZW50cy5vblN0YXRlQ2hhbmdlZCwgW3sgb2xkU3RhdGU6IGV4cGVjdGVkU3RhdGUsIG5ld1N0YXRlOiBuZXdTdGF0ZSB9XSk7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIGlzRGlzY29ubmVjdGluZyA9IGZ1bmN0aW9uIChjb25uZWN0aW9uKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBjb25uZWN0aW9uLnN0YXRlID09PSBzaWduYWxSLmNvbm5lY3Rpb25TdGF0ZS5kaXNjb25uZWN0ZWQ7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgY29uZmlndXJlU3RvcFJlY29ubmVjdGluZ1RpbWVvdXQgPSBmdW5jdGlvbiAoY29ubmVjdGlvbikge1xyXG4gICAgICAgICAgICB2YXIgc3RvcFJlY29ubmVjdGluZ1RpbWVvdXQsXHJcbiAgICAgICAgICAgICAgICBvblJlY29ubmVjdFRpbWVvdXQ7XHJcblxyXG4gICAgICAgICAgICAvLyBDaGVjayBpZiB0aGlzIGNvbm5lY3Rpb24gaGFzIGFscmVhZHkgYmVlbiBjb25maWd1cmVkIHRvIHN0b3AgcmVjb25uZWN0aW5nIGFmdGVyIGEgc3BlY2lmaWVkIHRpbWVvdXQuXHJcbiAgICAgICAgICAgIC8vIFdpdGhvdXQgdGhpcyBjaGVjayBpZiBhIGNvbm5lY3Rpb24gaXMgc3RvcHBlZCB0aGVuIHN0YXJ0ZWQgZXZlbnRzIHdpbGwgYmUgYm91bmQgbXVsdGlwbGUgdGltZXMuXHJcbiAgICAgICAgICAgIGlmICghY29ubmVjdGlvbi5fLmNvbmZpZ3VyZWRTdG9wUmVjb25uZWN0aW5nVGltZW91dCkge1xyXG4gICAgICAgICAgICAgICAgb25SZWNvbm5lY3RUaW1lb3V0ID0gZnVuY3Rpb24gKGNvbm5lY3Rpb24pIHtcclxuICAgICAgICAgICAgICAgICAgICBjb25uZWN0aW9uLmxvZyhcIkNvdWxkbid0IHJlY29ubmVjdCB3aXRoaW4gdGhlIGNvbmZpZ3VyZWQgdGltZW91dCAoXCIgKyBjb25uZWN0aW9uLmRpc2Nvbm5lY3RUaW1lb3V0ICsgXCJtcyksIGRpc2Nvbm5lY3RpbmcuXCIpO1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbm5lY3Rpb24uc3RvcCgvKiBhc3luYyAqLyBmYWxzZSwgLyogbm90aWZ5U2VydmVyICovIGZhbHNlKTtcclxuICAgICAgICAgICAgICAgIH07XHJcblxyXG4gICAgICAgICAgICAgICAgY29ubmVjdGlvbi5yZWNvbm5lY3RpbmcoZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciBjb25uZWN0aW9uID0gdGhpcztcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgLy8gR3VhcmQgYWdhaW5zdCBzdGF0ZSBjaGFuZ2luZyBpbiBhIHByZXZpb3VzIHVzZXIgZGVmaW5lZCBldmVuIGhhbmRsZXJcclxuICAgICAgICAgICAgICAgICAgICBpZiAoY29ubmVjdGlvbi5zdGF0ZSA9PT0gc2lnbmFsUi5jb25uZWN0aW9uU3RhdGUucmVjb25uZWN0aW5nKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHN0b3BSZWNvbm5lY3RpbmdUaW1lb3V0ID0gd2luZG93LnNldFRpbWVvdXQoZnVuY3Rpb24gKCkgeyBvblJlY29ubmVjdFRpbWVvdXQoY29ubmVjdGlvbik7IH0sIGNvbm5lY3Rpb24uZGlzY29ubmVjdFRpbWVvdXQpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgICAgICAgIGNvbm5lY3Rpb24uc3RhdGVDaGFuZ2VkKGZ1bmN0aW9uIChkYXRhKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKGRhdGEub2xkU3RhdGUgPT09IHNpZ25hbFIuY29ubmVjdGlvblN0YXRlLnJlY29ubmVjdGluZykge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBDbGVhciB0aGUgcGVuZGluZyByZWNvbm5lY3QgdGltZW91dCBjaGVja1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB3aW5kb3cuY2xlYXJUaW1lb3V0KHN0b3BSZWNvbm5lY3RpbmdUaW1lb3V0KTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICAgICAgICBjb25uZWN0aW9uLl8uY29uZmlndXJlZFN0b3BSZWNvbm5lY3RpbmdUaW1lb3V0ID0gdHJ1ZTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH07XHJcblxyXG4gICAgc2lnbmFsUiA9IGZ1bmN0aW9uICh1cmwsIHFzLCBsb2dnaW5nKSB7XHJcbiAgICAgICAgLy8vIDxzdW1tYXJ5PkNyZWF0ZXMgYSBuZXcgU2lnbmFsUiBjb25uZWN0aW9uIGZvciB0aGUgZ2l2ZW4gdXJsPC9zdW1tYXJ5PlxyXG4gICAgICAgIC8vLyA8cGFyYW0gbmFtZT1cInVybFwiIHR5cGU9XCJTdHJpbmdcIj5UaGUgVVJMIG9mIHRoZSBsb25nIHBvbGxpbmcgZW5kcG9pbnQ8L3BhcmFtPlxyXG4gICAgICAgIC8vLyA8cGFyYW0gbmFtZT1cInFzXCIgdHlwZT1cIk9iamVjdFwiPlxyXG4gICAgICAgIC8vLyAgICAgW09wdGlvbmFsXSBDdXN0b20gcXVlcnlzdHJpbmcgcGFyYW1ldGVycyB0byBhZGQgdG8gdGhlIGNvbm5lY3Rpb24gVVJMLlxyXG4gICAgICAgIC8vLyAgICAgSWYgYW4gb2JqZWN0LCBldmVyeSBub24tZnVuY3Rpb24gbWVtYmVyIHdpbGwgYmUgYWRkZWQgdG8gdGhlIHF1ZXJ5c3RyaW5nLlxyXG4gICAgICAgIC8vLyAgICAgSWYgYSBzdHJpbmcsIGl0J3MgYWRkZWQgdG8gdGhlIFFTIGFzIHNwZWNpZmllZC5cclxuICAgICAgICAvLy8gPC9wYXJhbT5cclxuICAgICAgICAvLy8gPHBhcmFtIG5hbWU9XCJsb2dnaW5nXCIgdHlwZT1cIkJvb2xlYW5cIj5cclxuICAgICAgICAvLy8gICAgIFtPcHRpb25hbF0gQSBmbGFnIGluZGljYXRpbmcgd2hldGhlciBjb25uZWN0aW9uIGxvZ2dpbmcgaXMgZW5hYmxlZCB0byB0aGUgYnJvd3NlclxyXG4gICAgICAgIC8vLyAgICAgY29uc29sZS9sb2cuIERlZmF1bHRzIHRvIGZhbHNlLlxyXG4gICAgICAgIC8vLyA8L3BhcmFtPlxyXG5cclxuICAgICAgICByZXR1cm4gbmV3IHNpZ25hbFIuZm4uaW5pdCh1cmwsIHFzLCBsb2dnaW5nKTtcclxuICAgIH07XHJcblxyXG4gICAgc2lnbmFsUi5fID0ge1xyXG4gICAgICAgIGRlZmF1bHRDb250ZW50VHlwZTogXCJhcHBsaWNhdGlvbi94LXd3dy1mb3JtLXVybGVuY29kZWQ7IGNoYXJzZXQ9VVRGLThcIixcclxuICAgICAgICBpZVZlcnNpb246IChmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIHZhciB2ZXJzaW9uLFxyXG4gICAgICAgICAgICAgICAgbWF0Y2hlcztcclxuXHJcbiAgICAgICAgICAgIGlmICh3aW5kb3cubmF2aWdhdG9yLmFwcE5hbWUgPT09ICdNaWNyb3NvZnQgSW50ZXJuZXQgRXhwbG9yZXInKSB7XHJcbiAgICAgICAgICAgICAgICAvLyBDaGVjayBpZiB0aGUgdXNlciBhZ2VudCBoYXMgdGhlIHBhdHRlcm4gXCJNU0lFIChvbmUgb3IgbW9yZSBudW1iZXJzKS4ob25lIG9yIG1vcmUgbnVtYmVycylcIjtcclxuICAgICAgICAgICAgICAgIG1hdGNoZXMgPSAvTVNJRSAoWzAtOV0rXFwuWzAtOV0rKS8uZXhlYyh3aW5kb3cubmF2aWdhdG9yLnVzZXJBZ2VudCk7XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKG1hdGNoZXMpIHtcclxuICAgICAgICAgICAgICAgICAgICB2ZXJzaW9uID0gd2luZG93LnBhcnNlRmxvYXQobWF0Y2hlc1sxXSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIC8vIHVuZGVmaW5lZCB2YWx1ZSBtZWFucyBub3QgSUVcclxuICAgICAgICAgICAgcmV0dXJuIHZlcnNpb247XHJcbiAgICAgICAgfSkoKVxyXG4gICAgfTtcclxuXHJcbiAgICBzaWduYWxSLmV2ZW50cyA9IGV2ZW50cztcclxuXHJcbiAgICBzaWduYWxSLmNoYW5nZVN0YXRlID0gY2hhbmdlU3RhdGU7XHJcblxyXG4gICAgc2lnbmFsUi5pc0Rpc2Nvbm5lY3RpbmcgPSBpc0Rpc2Nvbm5lY3Rpbmc7XHJcblxyXG4gICAgc2lnbmFsUi5jb25uZWN0aW9uU3RhdGUgPSB7XHJcbiAgICAgICAgY29ubmVjdGluZzogMCxcclxuICAgICAgICBjb25uZWN0ZWQ6IDEsXHJcbiAgICAgICAgcmVjb25uZWN0aW5nOiAyLFxyXG4gICAgICAgIGRpc2Nvbm5lY3RlZDogNFxyXG4gICAgfTtcclxuXHJcbiAgICBzaWduYWxSLmh1YiA9IHtcclxuICAgICAgICBzdGFydDogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAvLyBUaGlzIHdpbGwgZ2V0IHJlcGxhY2VkIHdpdGggdGhlIHJlYWwgaHViIGNvbm5lY3Rpb24gc3RhcnQgbWV0aG9kIHdoZW4gaHVicyBpcyByZWZlcmVuY2VkIGNvcnJlY3RseVxyXG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJTaWduYWxSOiBFcnJvciBsb2FkaW5nIGh1YnMuIEVuc3VyZSB5b3VyIGh1YnMgcmVmZXJlbmNlIGlzIGNvcnJlY3QsIGUuZy4gPHNjcmlwdCBzcmM9Jy9zaWduYWxyL2pzJz48L3NjcmlwdD4uXCIpO1xyXG4gICAgICAgIH1cclxuICAgIH07XHJcblxyXG4gICAgX3BhZ2VXaW5kb3cubG9hZChmdW5jdGlvbiAoKSB7IF9wYWdlTG9hZGVkID0gdHJ1ZTsgfSk7XHJcblxyXG4gICAgZnVuY3Rpb24gdmFsaWRhdGVUcmFuc3BvcnQocmVxdWVzdGVkVHJhbnNwb3J0LCBjb25uZWN0aW9uKSB7XHJcbiAgICAgICAgLy8vIDxzdW1tYXJ5PlZhbGlkYXRlcyB0aGUgcmVxdWVzdGVkIHRyYW5zcG9ydCBieSBjcm9zcyBjaGVja2luZyBpdCB3aXRoIHRoZSBwcmUtZGVmaW5lZCBzaWduYWxSLnRyYW5zcG9ydHM8L3N1bW1hcnk+XHJcbiAgICAgICAgLy8vIDxwYXJhbSBuYW1lPVwicmVxdWVzdGVkVHJhbnNwb3J0XCIgdHlwZT1cIk9iamVjdFwiPlRoZSBkZXNpZ25hdGVkIHRyYW5zcG9ydHMgdGhhdCB0aGUgdXNlciBoYXMgc3BlY2lmaWVkLjwvcGFyYW0+XHJcbiAgICAgICAgLy8vIDxwYXJhbSBuYW1lPVwiY29ubmVjdGlvblwiIHR5cGU9XCJzaWduYWxSXCI+VGhlIGNvbm5lY3Rpb24gdGhhdCB3aWxsIGJlIHVzaW5nIHRoZSByZXF1ZXN0ZWQgdHJhbnNwb3J0cy4gIFVzZWQgZm9yIGxvZ2dpbmcgcHVycG9zZXMuPC9wYXJhbT5cclxuICAgICAgICAvLy8gPHJldHVybnMgdHlwZT1cIk9iamVjdFwiIC8+XHJcblxyXG4gICAgICAgIGlmICgkLmlzQXJyYXkocmVxdWVzdGVkVHJhbnNwb3J0KSkge1xyXG4gICAgICAgICAgICAvLyBHbyB0aHJvdWdoIHRyYW5zcG9ydCBhcnJheSBhbmQgcmVtb3ZlIGFuIFwiaW52YWxpZFwiIHRyYW5wb3J0c1xyXG4gICAgICAgICAgICBmb3IgKHZhciBpID0gcmVxdWVzdGVkVHJhbnNwb3J0Lmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgdHJhbnNwb3J0ID0gcmVxdWVzdGVkVHJhbnNwb3J0W2ldO1xyXG4gICAgICAgICAgICAgICAgaWYgKCQudHlwZShyZXF1ZXN0ZWRUcmFuc3BvcnQpICE9PSBcIm9iamVjdFwiICYmICgkLnR5cGUodHJhbnNwb3J0KSAhPT0gXCJzdHJpbmdcIiB8fCAhc2lnbmFsUi50cmFuc3BvcnRzW3RyYW5zcG9ydF0pKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY29ubmVjdGlvbi5sb2coXCJJbnZhbGlkIHRyYW5zcG9ydDogXCIgKyB0cmFuc3BvcnQgKyBcIiwgcmVtb3ZpbmcgaXQgZnJvbSB0aGUgdHJhbnNwb3J0cyBsaXN0LlwiKTtcclxuICAgICAgICAgICAgICAgICAgICByZXF1ZXN0ZWRUcmFuc3BvcnQuc3BsaWNlKGksIDEpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAvLyBWZXJpZnkgd2Ugc3RpbGwgaGF2ZSB0cmFuc3BvcnRzIGxlZnQsIGlmIHdlIGRvbnQgdGhlbiB3ZSBoYXZlIGludmFsaWQgdHJhbnNwb3J0c1xyXG4gICAgICAgICAgICBpZiAocmVxdWVzdGVkVHJhbnNwb3J0Lmxlbmd0aCA9PT0gMCkge1xyXG4gICAgICAgICAgICAgICAgY29ubmVjdGlvbi5sb2coXCJObyB0cmFuc3BvcnRzIHJlbWFpbiB3aXRoaW4gdGhlIHNwZWNpZmllZCB0cmFuc3BvcnQgYXJyYXkuXCIpO1xyXG4gICAgICAgICAgICAgICAgcmVxdWVzdGVkVHJhbnNwb3J0ID0gbnVsbDtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0gZWxzZSBpZiAoJC50eXBlKHJlcXVlc3RlZFRyYW5zcG9ydCkgIT09IFwib2JqZWN0XCIgJiYgIXNpZ25hbFIudHJhbnNwb3J0c1tyZXF1ZXN0ZWRUcmFuc3BvcnRdICYmIHJlcXVlc3RlZFRyYW5zcG9ydCAhPT0gXCJhdXRvXCIpIHtcclxuICAgICAgICAgICAgY29ubmVjdGlvbi5sb2coXCJJbnZhbGlkIHRyYW5zcG9ydDogXCIgKyByZXF1ZXN0ZWRUcmFuc3BvcnQudG9TdHJpbmcoKSk7XHJcbiAgICAgICAgICAgIHJlcXVlc3RlZFRyYW5zcG9ydCA9IG51bGw7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2UgaWYgKHJlcXVlc3RlZFRyYW5zcG9ydCA9PT0gXCJhdXRvXCIgJiYgc2lnbmFsUi5fLmllVmVyc2lvbiA8PSA4KSB7XHJcbiAgICAgICAgICAgIC8vIElmIHdlJ3JlIGRvaW5nIGFuIGF1dG8gdHJhbnNwb3J0IGFuZCB3ZSdyZSBJRTggdGhlbiBmb3JjZSBsb25nUG9sbGluZywgIzE3NjRcclxuICAgICAgICAgICAgcmV0dXJuIFtcImxvbmdQb2xsaW5nXCJdO1xyXG5cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiByZXF1ZXN0ZWRUcmFuc3BvcnQ7XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gZ2V0RGVmYXVsdFBvcnQocHJvdG9jb2wpIHtcclxuICAgICAgICBpZiAocHJvdG9jb2wgPT09IFwiaHR0cDpcIikge1xyXG4gICAgICAgICAgICByZXR1cm4gODA7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2UgaWYgKHByb3RvY29sID09PSBcImh0dHBzOlwiKSB7XHJcbiAgICAgICAgICAgIHJldHVybiA0NDM7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGZ1bmN0aW9uIGFkZERlZmF1bHRQb3J0KHByb3RvY29sLCB1cmwpIHtcclxuICAgICAgICAvLyBSZW1vdmUgcG9ydHMgIGZyb20gdXJsLiAgV2UgaGF2ZSB0byBjaGVjayBpZiB0aGVyZSdzIGEgLyBvciBlbmQgb2YgbGluZVxyXG4gICAgICAgIC8vIGZvbGxvd2luZyB0aGUgcG9ydCBpbiBvcmRlciB0byBhdm9pZCByZW1vdmluZyBwb3J0cyBzdWNoIGFzIDgwODAuXHJcbiAgICAgICAgaWYgKHVybC5tYXRjaCgvOlxcZCskLykpIHtcclxuICAgICAgICAgICAgcmV0dXJuIHVybDtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICByZXR1cm4gdXJsICsgXCI6XCIgKyBnZXREZWZhdWx0UG9ydChwcm90b2NvbCk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGZ1bmN0aW9uIENvbm5lY3RpbmdNZXNzYWdlQnVmZmVyKGNvbm5lY3Rpb24sIGRyYWluQ2FsbGJhY2spIHtcclxuICAgICAgICB2YXIgdGhhdCA9IHRoaXMsXHJcbiAgICAgICAgICAgIGJ1ZmZlciA9IFtdO1xyXG5cclxuICAgICAgICB0aGF0LnRyeUJ1ZmZlciA9IGZ1bmN0aW9uIChtZXNzYWdlKSB7XHJcbiAgICAgICAgICAgIGlmIChjb25uZWN0aW9uLnN0YXRlID09PSAkLnNpZ25hbFIuY29ubmVjdGlvblN0YXRlLmNvbm5lY3RpbmcpIHtcclxuICAgICAgICAgICAgICAgIGJ1ZmZlci5wdXNoKG1lc3NhZ2UpO1xyXG5cclxuICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgdGhhdC5kcmFpbiA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgLy8gRW5zdXJlIHRoYXQgdGhlIGNvbm5lY3Rpb24gaXMgY29ubmVjdGVkIHdoZW4gd2UgZHJhaW4gKGRvIG5vdCB3YW50IHRvIGRyYWluIHdoaWxlIGEgY29ubmVjdGlvbiBpcyBub3QgYWN0aXZlKVxyXG4gICAgICAgICAgICBpZiAoY29ubmVjdGlvbi5zdGF0ZSA9PT0gJC5zaWduYWxSLmNvbm5lY3Rpb25TdGF0ZS5jb25uZWN0ZWQpIHtcclxuICAgICAgICAgICAgICAgIHdoaWxlIChidWZmZXIubGVuZ3RoID4gMCkge1xyXG4gICAgICAgICAgICAgICAgICAgIGRyYWluQ2FsbGJhY2soYnVmZmVyLnNoaWZ0KCkpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgdGhhdC5jbGVhciA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgYnVmZmVyID0gW107XHJcbiAgICAgICAgfTtcclxuICAgIH1cclxuXHJcbiAgICBzaWduYWxSLmZuID0gc2lnbmFsUi5wcm90b3R5cGUgPSB7XHJcbiAgICAgICAgaW5pdDogZnVuY3Rpb24gKHVybCwgcXMsIGxvZ2dpbmcpIHtcclxuICAgICAgICAgICAgdmFyICRjb25uZWN0aW9uID0gJCh0aGlzKTtcclxuXHJcbiAgICAgICAgICAgIHRoaXMudXJsID0gdXJsO1xyXG4gICAgICAgICAgICB0aGlzLnFzID0gcXM7XHJcbiAgICAgICAgICAgIHRoaXMuXyA9IHtcclxuICAgICAgICAgICAgICAgIGNvbm5lY3RpbmdNZXNzYWdlQnVmZmVyOiBuZXcgQ29ubmVjdGluZ01lc3NhZ2VCdWZmZXIodGhpcywgZnVuY3Rpb24gKG1lc3NhZ2UpIHtcclxuICAgICAgICAgICAgICAgICAgICAkY29ubmVjdGlvbi50cmlnZ2VySGFuZGxlcihldmVudHMub25SZWNlaXZlZCwgW21lc3NhZ2VdKTtcclxuICAgICAgICAgICAgICAgIH0pLFxyXG4gICAgICAgICAgICAgICAgb25GYWlsZWRUaW1lb3V0SGFuZGxlOiBudWxsXHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgIGlmICh0eXBlb2YgKGxvZ2dpbmcpID09PSBcImJvb2xlYW5cIikge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5sb2dnaW5nID0gbG9nZ2luZztcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIF9wYXJzZVJlc3BvbnNlOiBmdW5jdGlvbiAocmVzcG9uc2UpIHtcclxuICAgICAgICAgICAgdmFyIHRoYXQgPSB0aGlzO1xyXG5cclxuICAgICAgICAgICAgaWYgKCFyZXNwb25zZSkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc3BvbnNlO1xyXG4gICAgICAgICAgICB9IGVsc2UgaWYgKHRoYXQuYWpheERhdGFUeXBlID09PSBcInRleHRcIikge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoYXQuanNvbi5wYXJzZShyZXNwb25zZSk7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzcG9uc2U7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICBqc29uOiB3aW5kb3cuSlNPTixcclxuXHJcbiAgICAgICAgaXNDcm9zc0RvbWFpbjogZnVuY3Rpb24gKHVybCwgYWdhaW5zdCkge1xyXG4gICAgICAgICAgICAvLy8gPHN1bW1hcnk+Q2hlY2tzIGlmIHVybCBpcyBjcm9zcyBkb21haW48L3N1bW1hcnk+XHJcbiAgICAgICAgICAgIC8vLyA8cGFyYW0gbmFtZT1cInVybFwiIHR5cGU9XCJTdHJpbmdcIj5UaGUgYmFzZSBVUkw8L3BhcmFtPlxyXG4gICAgICAgICAgICAvLy8gPHBhcmFtIG5hbWU9XCJhZ2FpbnN0XCIgdHlwZT1cIk9iamVjdFwiPlxyXG4gICAgICAgICAgICAvLy8gICAgIEFuIG9wdGlvbmFsIGFyZ3VtZW50IHRvIGNvbXBhcmUgdGhlIFVSTCBhZ2FpbnN0LCBpZiBub3Qgc3BlY2lmaWVkIGl0IHdpbGwgYmUgc2V0IHRvIHdpbmRvdy5sb2NhdGlvbi5cclxuICAgICAgICAgICAgLy8vICAgICBJZiBzcGVjaWZpZWQgaXQgbXVzdCBjb250YWluIGEgcHJvdG9jb2wgYW5kIGEgaG9zdCBwcm9wZXJ0eS5cclxuICAgICAgICAgICAgLy8vIDwvcGFyYW0+XHJcbiAgICAgICAgICAgIHZhciBsaW5rO1xyXG5cclxuICAgICAgICAgICAgdXJsID0gJC50cmltKHVybCk7XHJcbiAgICAgICAgICAgIGlmICh1cmwuaW5kZXhPZihcImh0dHBcIikgIT09IDApIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgYWdhaW5zdCA9IGFnYWluc3QgfHwgd2luZG93LmxvY2F0aW9uO1xyXG5cclxuICAgICAgICAgICAgLy8gQ3JlYXRlIGFuIGFuY2hvciB0YWcuXHJcbiAgICAgICAgICAgIGxpbmsgPSB3aW5kb3cuZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImFcIik7XHJcbiAgICAgICAgICAgIGxpbmsuaHJlZiA9IHVybDtcclxuXHJcbiAgICAgICAgICAgIC8vIFdoZW4gY2hlY2tpbmcgZm9yIGNyb3NzIGRvbWFpbiB3ZSBoYXZlIHRvIHNwZWNpYWwgY2FzZSBwb3J0IDgwIGJlY2F1c2UgdGhlIHdpbmRvdy5sb2NhdGlvbiB3aWxsIHJlbW92ZSB0aGUgXHJcbiAgICAgICAgICAgIHJldHVybiBsaW5rLnByb3RvY29sICsgYWRkRGVmYXVsdFBvcnQobGluay5wcm90b2NvbCwgbGluay5ob3N0KSAhPT0gYWdhaW5zdC5wcm90b2NvbCArIGFkZERlZmF1bHRQb3J0KGFnYWluc3QucHJvdG9jb2wsIGFnYWluc3QuaG9zdCk7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgYWpheERhdGFUeXBlOiBcInRleHRcIixcclxuXHJcbiAgICAgICAgY29udGVudFR5cGU6IFwiYXBwbGljYXRpb24vanNvbjsgY2hhcnNldD1VVEYtOFwiLFxyXG5cclxuICAgICAgICBsb2dnaW5nOiBmYWxzZSxcclxuXHJcbiAgICAgICAgc3RhdGU6IHNpZ25hbFIuY29ubmVjdGlvblN0YXRlLmRpc2Nvbm5lY3RlZCxcclxuXHJcbiAgICAgICAga2VlcEFsaXZlRGF0YToge30sXHJcblxyXG4gICAgICAgIGNsaWVudFByb3RvY29sOiBcIjEuM1wiLFxyXG5cclxuICAgICAgICByZWNvbm5lY3REZWxheTogMjAwMCxcclxuXHJcbiAgICAgICAgdHJhbnNwb3J0Q29ubmVjdFRpbWVvdXQ6IDAsIC8vIFRoaXMgd2lsbCBiZSBtb2RpZmllZCBieSB0aGUgc2VydmVyIGluIHJlc3BvbmUgdG8gdGhlIG5lZ290aWF0ZSByZXF1ZXN0LiAgSXQgd2lsbCBhZGQgYW55IHZhbHVlIHNlbnQgZG93biBmcm9tIHRoZSBzZXJ2ZXIgdG8gdGhlIGNsaWVudCB2YWx1ZS5cclxuXHJcbiAgICAgICAgZGlzY29ubmVjdFRpbWVvdXQ6IDMwMDAwLCAvLyBUaGlzIHNob3VsZCBiZSBzZXQgYnkgdGhlIHNlcnZlciBpbiByZXNwb25zZSB0byB0aGUgbmVnb3RpYXRlIHJlcXVlc3QgKDMwcyBkZWZhdWx0KVxyXG5cclxuICAgICAgICBrZWVwQWxpdmVXYXJuQXQ6IDIgLyAzLCAvLyBXYXJuIHVzZXIgb2Ygc2xvdyBjb25uZWN0aW9uIGlmIHdlIGJyZWFjaCB0aGUgWCUgbWFyayBvZiB0aGUga2VlcCBhbGl2ZSB0aW1lb3V0XHJcblxyXG4gICAgICAgIHN0YXJ0OiBmdW5jdGlvbiAob3B0aW9ucywgY2FsbGJhY2spIHtcclxuICAgICAgICAgICAgLy8vIDxzdW1tYXJ5PlN0YXJ0cyB0aGUgY29ubmVjdGlvbjwvc3VtbWFyeT5cclxuICAgICAgICAgICAgLy8vIDxwYXJhbSBuYW1lPVwib3B0aW9uc1wiIHR5cGU9XCJPYmplY3RcIj5PcHRpb25zIG1hcDwvcGFyYW0+XHJcbiAgICAgICAgICAgIC8vLyA8cGFyYW0gbmFtZT1cImNhbGxiYWNrXCIgdHlwZT1cIkZ1bmN0aW9uXCI+QSBjYWxsYmFjayBmdW5jdGlvbiB0byBleGVjdXRlIHdoZW4gdGhlIGNvbm5lY3Rpb24gaGFzIHN0YXJ0ZWQ8L3BhcmFtPlxyXG4gICAgICAgICAgICB2YXIgY29ubmVjdGlvbiA9IHRoaXMsXHJcbiAgICAgICAgICAgICAgICBjb25maWcgPSB7XHJcbiAgICAgICAgICAgICAgICAgICAgd2FpdEZvclBhZ2VMb2FkOiB0cnVlLFxyXG4gICAgICAgICAgICAgICAgICAgIHRyYW5zcG9ydDogXCJhdXRvXCIsXHJcbiAgICAgICAgICAgICAgICAgICAganNvbnA6IGZhbHNlXHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgaW5pdGlhbGl6ZSxcclxuICAgICAgICAgICAgICAgIGRlZmVycmVkID0gY29ubmVjdGlvbi5fZGVmZXJyYWwgfHwgJC5EZWZlcnJlZCgpLCAvLyBDaGVjayB0byBzZWUgaWYgdGhlcmUgaXMgYSBwcmUtZXhpc3RpbmcgZGVmZXJyYWwgdGhhdCdzIGJlaW5nIGJ1aWx0IG9uLCBpZiBzbyB3ZSB3YW50IHRvIGtlZXAgdXNpbmcgaXRcclxuICAgICAgICAgICAgICAgIHBhcnNlciA9IHdpbmRvdy5kb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiYVwiKTtcclxuXHJcbiAgICAgICAgICAgIC8vIFBlcnNpc3QgdGhlIGRlZmVycmFsIHNvIHRoYXQgaWYgc3RhcnQgaXMgY2FsbGVkIG11bHRpcGxlIHRpbWVzIHRoZSBzYW1lIGRlZmVycmFsIGlzIHVzZWQuXHJcbiAgICAgICAgICAgIGNvbm5lY3Rpb24uX2RlZmVycmFsID0gZGVmZXJyZWQ7XHJcblxyXG4gICAgICAgICAgICBpZiAoIWNvbm5lY3Rpb24uanNvbikge1xyXG4gICAgICAgICAgICAgICAgLy8gbm8gSlNPTiFcclxuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIlNpZ25hbFI6IE5vIEpTT04gcGFyc2VyIGZvdW5kLiBQbGVhc2UgZW5zdXJlIGpzb24yLmpzIGlzIHJlZmVyZW5jZWQgYmVmb3JlIHRoZSBTaWduYWxSLmpzIGZpbGUgaWYgeW91IG5lZWQgdG8gc3VwcG9ydCBjbGllbnRzIHdpdGhvdXQgbmF0aXZlIEpTT04gcGFyc2luZyBzdXBwb3J0LCBlLmcuIElFPDguXCIpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBpZiAoJC50eXBlKG9wdGlvbnMpID09PSBcImZ1bmN0aW9uXCIpIHtcclxuICAgICAgICAgICAgICAgIC8vIFN1cHBvcnQgY2FsbGluZyB3aXRoIHNpbmdsZSBjYWxsYmFjayBwYXJhbWV0ZXJcclxuICAgICAgICAgICAgICAgIGNhbGxiYWNrID0gb3B0aW9ucztcclxuICAgICAgICAgICAgfSBlbHNlIGlmICgkLnR5cGUob3B0aW9ucykgPT09IFwib2JqZWN0XCIpIHtcclxuICAgICAgICAgICAgICAgICQuZXh0ZW5kKGNvbmZpZywgb3B0aW9ucyk7XHJcbiAgICAgICAgICAgICAgICBpZiAoJC50eXBlKGNvbmZpZy5jYWxsYmFjaykgPT09IFwiZnVuY3Rpb25cIikge1xyXG4gICAgICAgICAgICAgICAgICAgIGNhbGxiYWNrID0gY29uZmlnLmNhbGxiYWNrO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBjb25maWcudHJhbnNwb3J0ID0gdmFsaWRhdGVUcmFuc3BvcnQoY29uZmlnLnRyYW5zcG9ydCwgY29ubmVjdGlvbik7XHJcblxyXG4gICAgICAgICAgICAvLyBJZiB0aGUgdHJhbnNwb3J0IGlzIGludmFsaWQgdGhyb3cgYW4gZXJyb3IgYW5kIGFib3J0IHN0YXJ0XHJcbiAgICAgICAgICAgIGlmICghY29uZmlnLnRyYW5zcG9ydCkge1xyXG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiU2lnbmFsUjogSW52YWxpZCB0cmFuc3BvcnQocykgc3BlY2lmaWVkLCBhYm9ydGluZyBzdGFydC5cIik7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGNvbm5lY3Rpb24uXy5jb25maWcgPSBjb25maWc7XHJcblxyXG4gICAgICAgICAgICAvLyBDaGVjayB0byBzZWUgaWYgc3RhcnQgaXMgYmVpbmcgY2FsbGVkIHByaW9yIHRvIHBhZ2UgbG9hZFxyXG4gICAgICAgICAgICAvLyBJZiB3YWl0Rm9yUGFnZUxvYWQgaXMgdHJ1ZSB3ZSB0aGVuIHdhbnQgdG8gcmUtZGlyZWN0IGZ1bmN0aW9uIGNhbGwgdG8gdGhlIHdpbmRvdyBsb2FkIGV2ZW50XHJcbiAgICAgICAgICAgIGlmICghX3BhZ2VMb2FkZWQgJiYgY29uZmlnLndhaXRGb3JQYWdlTG9hZCA9PT0gdHJ1ZSkge1xyXG4gICAgICAgICAgICAgICAgX3BhZ2VXaW5kb3cubG9hZChmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY29ubmVjdGlvbi5zdGFydChvcHRpb25zLCBjYWxsYmFjayk7XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgIHJldHVybiBkZWZlcnJlZC5wcm9taXNlKCk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGNvbmZpZ3VyZVN0b3BSZWNvbm5lY3RpbmdUaW1lb3V0KGNvbm5lY3Rpb24pO1xyXG5cclxuICAgICAgICAgICAgLy8gSWYgd2UncmUgYWxyZWFkeSBjb25uZWN0aW5nIGp1c3QgcmV0dXJuIHRoZSBzYW1lIGRlZmVycmFsIGFzIHRoZSBvcmlnaW5hbCBjb25uZWN0aW9uIHN0YXJ0XHJcbiAgICAgICAgICAgIGlmIChjb25uZWN0aW9uLnN0YXRlID09PSBzaWduYWxSLmNvbm5lY3Rpb25TdGF0ZS5jb25uZWN0aW5nKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gZGVmZXJyZWQucHJvbWlzZSgpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGVsc2UgaWYgKGNoYW5nZVN0YXRlKGNvbm5lY3Rpb24sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzaWduYWxSLmNvbm5lY3Rpb25TdGF0ZS5kaXNjb25uZWN0ZWQsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzaWduYWxSLmNvbm5lY3Rpb25TdGF0ZS5jb25uZWN0aW5nKSA9PT0gZmFsc2UpIHtcclxuICAgICAgICAgICAgICAgIC8vIFdlJ3JlIG5vdCBjb25uZWN0aW5nIHNvIHRyeSBhbmQgdHJhbnNpdGlvbiBpbnRvIGNvbm5lY3RpbmcuXHJcbiAgICAgICAgICAgICAgICAvLyBJZiB3ZSBmYWlsIHRvIHRyYW5zaXRpb24gdGhlbiB3ZSdyZSBlaXRoZXIgaW4gY29ubmVjdGVkIG9yIHJlY29ubmVjdGluZy5cclxuXHJcbiAgICAgICAgICAgICAgICBkZWZlcnJlZC5yZXNvbHZlKGNvbm5lY3Rpb24pO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGRlZmVycmVkLnByb21pc2UoKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgLy8gUmVzb2x2ZSB0aGUgZnVsbCB1cmxcclxuICAgICAgICAgICAgcGFyc2VyLmhyZWYgPSBjb25uZWN0aW9uLnVybDtcclxuICAgICAgICAgICAgaWYgKCFwYXJzZXIucHJvdG9jb2wgfHwgcGFyc2VyLnByb3RvY29sID09PSBcIjpcIikge1xyXG4gICAgICAgICAgICAgICAgY29ubmVjdGlvbi5wcm90b2NvbCA9IHdpbmRvdy5kb2N1bWVudC5sb2NhdGlvbi5wcm90b2NvbDtcclxuICAgICAgICAgICAgICAgIGNvbm5lY3Rpb24uaG9zdCA9IHdpbmRvdy5kb2N1bWVudC5sb2NhdGlvbi5ob3N0O1xyXG4gICAgICAgICAgICAgICAgY29ubmVjdGlvbi5iYXNlVXJsID0gY29ubmVjdGlvbi5wcm90b2NvbCArIFwiLy9cIiArIGNvbm5lY3Rpb24uaG9zdDtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgICAgIGNvbm5lY3Rpb24ucHJvdG9jb2wgPSBwYXJzZXIucHJvdG9jb2w7XHJcbiAgICAgICAgICAgICAgICBjb25uZWN0aW9uLmhvc3QgPSBwYXJzZXIuaG9zdDtcclxuICAgICAgICAgICAgICAgIGNvbm5lY3Rpb24uYmFzZVVybCA9IHBhcnNlci5wcm90b2NvbCArIFwiLy9cIiArIHBhcnNlci5ob3N0O1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAvLyBTZXQgdGhlIHdlYnNvY2tldCBwcm90b2NvbFxyXG4gICAgICAgICAgICBjb25uZWN0aW9uLndzUHJvdG9jb2wgPSBjb25uZWN0aW9uLnByb3RvY29sID09PSBcImh0dHBzOlwiID8gXCJ3c3M6Ly9cIiA6IFwid3M6Ly9cIjtcclxuXHJcbiAgICAgICAgICAgIC8vIElmIGpzb25wIHdpdGggbm8vYXV0byB0cmFuc3BvcnQgaXMgc3BlY2lmaWVkLCB0aGVuIHNldCB0aGUgdHJhbnNwb3J0IHRvIGxvbmcgcG9sbGluZ1xyXG4gICAgICAgICAgICAvLyBzaW5jZSB0aGF0IGlzIHRoZSBvbmx5IHRyYW5zcG9ydCBmb3Igd2hpY2gganNvbnAgcmVhbGx5IG1ha2VzIHNlbnNlLlxyXG4gICAgICAgICAgICAvLyBTb21lIGRldmVsb3BlcnMgbWlnaHQgYWN0dWFsbHkgY2hvb3NlIHRvIHNwZWNpZnkganNvbnAgZm9yIHNhbWUgb3JpZ2luIHJlcXVlc3RzXHJcbiAgICAgICAgICAgIC8vIGFzIGRlbW9uc3RyYXRlZCBieSBJc3N1ZSAjNjIzLlxyXG4gICAgICAgICAgICBpZiAoY29uZmlnLnRyYW5zcG9ydCA9PT0gXCJhdXRvXCIgJiYgY29uZmlnLmpzb25wID09PSB0cnVlKSB7XHJcbiAgICAgICAgICAgICAgICBjb25maWcudHJhbnNwb3J0ID0gXCJsb25nUG9sbGluZ1wiO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBpZiAodGhpcy5pc0Nyb3NzRG9tYWluKGNvbm5lY3Rpb24udXJsKSkge1xyXG4gICAgICAgICAgICAgICAgY29ubmVjdGlvbi5sb2coXCJBdXRvIGRldGVjdGVkIGNyb3NzIGRvbWFpbiB1cmwuXCIpO1xyXG5cclxuICAgICAgICAgICAgICAgIGlmIChjb25maWcudHJhbnNwb3J0ID09PSBcImF1dG9cIikge1xyXG4gICAgICAgICAgICAgICAgICAgIC8vIFRyeSB3ZWJTb2NrZXRzIGFuZCBsb25nUG9sbGluZyBzaW5jZSBTU0UgZG9lc24ndCBzdXBwb3J0IENPUlNcclxuICAgICAgICAgICAgICAgICAgICAvLyBUT0RPOiBTdXBwb3J0IFhETSB3aXRoIGZvcmV2ZXJGcmFtZVxyXG4gICAgICAgICAgICAgICAgICAgIGNvbmZpZy50cmFuc3BvcnQgPSBbXCJ3ZWJTb2NrZXRzXCIsIFwibG9uZ1BvbGxpbmdcIl07XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgLy8gRGV0ZXJtaW5lIGlmIGpzb25wIGlzIHRoZSBvbmx5IGNob2ljZSBmb3IgbmVnb3RpYXRpb24sIGFqYXhTZW5kIGFuZCBhamF4QWJvcnQuXHJcbiAgICAgICAgICAgICAgICAvLyBpLmUuIGlmIHRoZSBicm93c2VyIGRvZXNuJ3Qgc3VwcG9ydHMgQ09SU1xyXG4gICAgICAgICAgICAgICAgLy8gSWYgaXQgaXMsIGlnbm9yZSBhbnkgcHJlZmVyZW5jZSB0byB0aGUgY29udHJhcnksIGFuZCBzd2l0Y2ggdG8ganNvbnAuXHJcbiAgICAgICAgICAgICAgICBpZiAoIWNvbmZpZy5qc29ucCkge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbmZpZy5qc29ucCA9ICEkLnN1cHBvcnQuY29ycztcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKGNvbmZpZy5qc29ucCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25uZWN0aW9uLmxvZyhcIlVzaW5nIGpzb25wIGJlY2F1c2UgdGhpcyBicm93c2VyIGRvZXNuJ3Qgc3VwcG9ydCBDT1JTXCIpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICBjb25uZWN0aW9uLmNvbnRlbnRUeXBlID0gc2lnbmFsUi5fLmRlZmF1bHRDb250ZW50VHlwZTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgY29ubmVjdGlvbi5hamF4RGF0YVR5cGUgPSBjb25maWcuanNvbnAgPyBcImpzb25wXCIgOiBcInRleHRcIjtcclxuXHJcbiAgICAgICAgICAgICQoY29ubmVjdGlvbikuYmluZChldmVudHMub25TdGFydCwgZnVuY3Rpb24gKGUsIGRhdGEpIHtcclxuICAgICAgICAgICAgICAgIGlmICgkLnR5cGUoY2FsbGJhY2spID09PSBcImZ1bmN0aW9uXCIpIHtcclxuICAgICAgICAgICAgICAgICAgICBjYWxsYmFjay5jYWxsKGNvbm5lY3Rpb24pO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgZGVmZXJyZWQucmVzb2x2ZShjb25uZWN0aW9uKTtcclxuICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgICBpbml0aWFsaXplID0gZnVuY3Rpb24gKHRyYW5zcG9ydHMsIGluZGV4KSB7XHJcbiAgICAgICAgICAgICAgICBpbmRleCA9IGluZGV4IHx8IDA7XHJcbiAgICAgICAgICAgICAgICBpZiAoaW5kZXggPj0gdHJhbnNwb3J0cy5sZW5ndGgpIHtcclxuICAgICAgICAgICAgICAgICAgICAvLyBObyB0cmFuc3BvcnQgaW5pdGlhbGl6ZWQgc3VjY2Vzc2Z1bGx5XHJcbiAgICAgICAgICAgICAgICAgICAgJChjb25uZWN0aW9uKS50cmlnZ2VySGFuZGxlcihldmVudHMub25FcnJvciwgW1wiU2lnbmFsUjogTm8gdHJhbnNwb3J0IGNvdWxkIGJlIGluaXRpYWxpemVkIHN1Y2Nlc3NmdWxseS4gVHJ5IHNwZWNpZnlpbmcgYSBkaWZmZXJlbnQgdHJhbnNwb3J0IG9yIG5vbmUgYXQgYWxsIGZvciBhdXRvIGluaXRpYWxpemF0aW9uLlwiXSk7XHJcbiAgICAgICAgICAgICAgICAgICAgZGVmZXJyZWQucmVqZWN0KFwiU2lnbmFsUjogTm8gdHJhbnNwb3J0IGNvdWxkIGJlIGluaXRpYWxpemVkIHN1Y2Nlc3NmdWxseS4gVHJ5IHNwZWNpZnlpbmcgYSBkaWZmZXJlbnQgdHJhbnNwb3J0IG9yIG5vbmUgYXQgYWxsIGZvciBhdXRvIGluaXRpYWxpemF0aW9uLlwiKTtcclxuICAgICAgICAgICAgICAgICAgICAvLyBTdG9wIHRoZSBjb25uZWN0aW9uIGlmIGl0IGhhcyBjb25uZWN0ZWQgYW5kIG1vdmUgaXQgaW50byB0aGUgZGlzY29ubmVjdGVkIHN0YXRlXHJcbiAgICAgICAgICAgICAgICAgICAgY29ubmVjdGlvbi5zdG9wKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIC8vIFRoZSBjb25uZWN0aW9uIHdhcyBhYm9ydGVkXHJcbiAgICAgICAgICAgICAgICBpZiAoY29ubmVjdGlvbi5zdGF0ZSA9PT0gc2lnbmFsUi5jb25uZWN0aW9uU3RhdGUuZGlzY29ubmVjdGVkKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIHZhciB0cmFuc3BvcnROYW1lID0gdHJhbnNwb3J0c1tpbmRleF0sXHJcbiAgICAgICAgICAgICAgICAgICAgdHJhbnNwb3J0ID0gJC50eXBlKHRyYW5zcG9ydE5hbWUpID09PSBcIm9iamVjdFwiID8gdHJhbnNwb3J0TmFtZSA6IHNpZ25hbFIudHJhbnNwb3J0c1t0cmFuc3BvcnROYW1lXSxcclxuICAgICAgICAgICAgICAgICAgICBpbml0aWFsaXphdGlvbkNvbXBsZXRlID0gZmFsc2UsXHJcbiAgICAgICAgICAgICAgICAgICAgb25GYWlsZWQgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIENoZWNrIGlmIHdlJ3ZlIGFscmVhZHkgdHJpZ2dlcmVkIG9uRmFpbGVkLCBvblN0YXJ0XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICghaW5pdGlhbGl6YXRpb25Db21wbGV0ZSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaW5pdGlhbGl6YXRpb25Db21wbGV0ZSA9IHRydWU7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB3aW5kb3cuY2xlYXJUaW1lb3V0KGNvbm5lY3Rpb24uXy5vbkZhaWxlZFRpbWVvdXRIYW5kbGUpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHJhbnNwb3J0LnN0b3AoY29ubmVjdGlvbik7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpbml0aWFsaXplKHRyYW5zcG9ydHMsIGluZGV4ICsgMSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9O1xyXG5cclxuICAgICAgICAgICAgICAgIGNvbm5lY3Rpb24udHJhbnNwb3J0ID0gdHJhbnNwb3J0O1xyXG5cclxuICAgICAgICAgICAgICAgIGlmICh0cmFuc3BvcnROYW1lLmluZGV4T2YoXCJfXCIpID09PSAwKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgLy8gUHJpdmF0ZSBtZW1iZXJcclxuICAgICAgICAgICAgICAgICAgICBpbml0aWFsaXplKHRyYW5zcG9ydHMsIGluZGV4ICsgMSk7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY29ubmVjdGlvbi5fLm9uRmFpbGVkVGltZW91dEhhbmRsZSA9IHdpbmRvdy5zZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29ubmVjdGlvbi5sb2codHJhbnNwb3J0Lm5hbWUgKyBcIiB0aW1lZCBvdXQgd2hlbiB0cnlpbmcgdG8gY29ubmVjdC5cIik7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG9uRmFpbGVkKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgfSwgY29ubmVjdGlvbi50cmFuc3BvcnRDb25uZWN0VGltZW91dCk7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIHRyYW5zcG9ydC5zdGFydChjb25uZWN0aW9uLCBmdW5jdGlvbiAoKSB7IC8vIHN1Y2Nlc3NcclxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gVGhlIGNvbm5lY3Rpb24gd2FzIGFib3J0ZWQgd2hpbGUgaW5pdGlhbGl6aW5nIHRyYW5zcG9ydHNcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGNvbm5lY3Rpb24uc3RhdGUgPT09IHNpZ25hbFIuY29ubmVjdGlvblN0YXRlLmRpc2Nvbm5lY3RlZCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoIWluaXRpYWxpemF0aW9uQ29tcGxldGUpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGluaXRpYWxpemF0aW9uQ29tcGxldGUgPSB0cnVlO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHdpbmRvdy5jbGVhclRpbWVvdXQoY29ubmVjdGlvbi5fLm9uRmFpbGVkVGltZW91dEhhbmRsZSk7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHRyYW5zcG9ydC5zdXBwb3J0c0tlZXBBbGl2ZSAmJiBjb25uZWN0aW9uLmtlZXBBbGl2ZURhdGEuYWN0aXZhdGVkKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc2lnbmFsUi50cmFuc3BvcnRzLl9sb2dpYy5tb25pdG9yS2VlcEFsaXZlKGNvbm5lY3Rpb24pO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNoYW5nZVN0YXRlKGNvbm5lY3Rpb24sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzaWduYWxSLmNvbm5lY3Rpb25TdGF0ZS5jb25uZWN0aW5nLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc2lnbmFsUi5jb25uZWN0aW9uU3RhdGUuY29ubmVjdGVkKTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBEcmFpbiBhbnkgaW5jb21pbmcgYnVmZmVyZWQgbWVzc2FnZXMgKG1lc3NhZ2VzIHRoYXQgY2FtZSBpbiBwcmlvciB0byBjb25uZWN0KVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29ubmVjdGlvbi5fLmNvbm5lY3RpbmdNZXNzYWdlQnVmZmVyLmRyYWluKCk7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJChjb25uZWN0aW9uKS50cmlnZ2VySGFuZGxlcihldmVudHMub25TdGFydCk7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gd2lyZSB0aGUgc3RvcCBoYW5kbGVyIGZvciB3aGVuIHRoZSB1c2VyIGxlYXZlcyB0aGUgcGFnZVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgX3BhZ2VXaW5kb3cudW5sb2FkKGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25uZWN0aW9uLnN0b3AoZmFsc2UgLyogYXN5bmMgKi8pO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9LCBvbkZhaWxlZCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBjYXRjaCAoZXJyb3IpIHtcclxuICAgICAgICAgICAgICAgICAgICBjb25uZWN0aW9uLmxvZyhcIlNpZ25hbFI6IFwiICsgdHJhbnNwb3J0Lm5hbWUgKyBcIiB0cmFuc3BvcnQgdGhyZXcgJ1wiICsgZXJyb3IubWVzc2FnZSArIFwiJyB3aGVuIGF0dGVtcHRpbmcgdG8gc3RhcnQuXCIpO1xyXG4gICAgICAgICAgICAgICAgICAgIG9uRmFpbGVkKCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH07XHJcblxyXG4gICAgICAgICAgICB2YXIgdXJsID0gY29ubmVjdGlvbi51cmwgKyBcIi9uZWdvdGlhdGVcIjtcclxuXHJcbiAgICAgICAgICAgIHVybCA9IHNpZ25hbFIudHJhbnNwb3J0cy5fbG9naWMuYWRkUXModXJsLCBjb25uZWN0aW9uLnFzKTtcclxuXHJcbiAgICAgICAgICAgIC8vIEFkZCB0aGUgY2xpZW50IHZlcnNpb24gdG8gdGhlIG5lZ290aWF0ZSByZXF1ZXN0LiAgV2UgdXRpbGl6ZSB0aGUgc2FtZSBhZGRRcyBtZXRob2QgaGVyZVxyXG4gICAgICAgICAgICAvLyBzbyB0aGF0IGl0IGNhbiBhcHBlbmQgdGhlIGNsaWVudFZlcnNpb24gYXBwcm9wcmlhdGVseSB0byB0aGUgVVJMXHJcbiAgICAgICAgICAgIHVybCA9IHNpZ25hbFIudHJhbnNwb3J0cy5fbG9naWMuYWRkUXModXJsLCB7XHJcbiAgICAgICAgICAgICAgICBjbGllbnRQcm90b2NvbDogY29ubmVjdGlvbi5jbGllbnRQcm90b2NvbFxyXG4gICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICAgIGNvbm5lY3Rpb24ubG9nKFwiTmVnb3RpYXRpbmcgd2l0aCAnXCIgKyB1cmwgKyBcIicuXCIpO1xyXG5cclxuICAgICAgICAgICAgLy8gU2F2ZSB0aGUgYWpheCBuZWdvdGlhdGUgcmVxdWVzdCBvYmplY3Qgc28gd2UgY2FuIGFib3J0IGl0IGlmIHN0b3AgaXMgY2FsbGVkIHdoaWxlIHRoZSByZXF1ZXN0IGlzIGluIGZsaWdodC5cclxuICAgICAgICAgICAgY29ubmVjdGlvbi5fLm5lZ290aWF0ZVJlcXVlc3QgPSAkLmFqYXgoe1xyXG4gICAgICAgICAgICAgICAgdXJsOiB1cmwsXHJcbiAgICAgICAgICAgICAgICBnbG9iYWw6IGZhbHNlLFxyXG4gICAgICAgICAgICAgICAgY2FjaGU6IGZhbHNlLFxyXG4gICAgICAgICAgICAgICAgdHlwZTogXCJHRVRcIixcclxuICAgICAgICAgICAgICAgIGNvbnRlbnRUeXBlOiBjb25uZWN0aW9uLmNvbnRlbnRUeXBlLFxyXG4gICAgICAgICAgICAgICAgZGF0YToge30sXHJcbiAgICAgICAgICAgICAgICBkYXRhVHlwZTogY29ubmVjdGlvbi5hamF4RGF0YVR5cGUsXHJcbiAgICAgICAgICAgICAgICBlcnJvcjogZnVuY3Rpb24gKGVycm9yLCBzdGF0dXNUZXh0KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgLy8gV2UgZG9uJ3Qgd2FudCB0byBjYXVzZSBhbnkgZXJyb3JzIGlmIHdlJ3JlIGFib3J0aW5nIG91ciBvd24gbmVnb3RpYXRlIHJlcXVlc3QuXHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKHN0YXR1c1RleHQgIT09IF9uZWdvdGlhdGVBYm9ydFRleHQpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgJChjb25uZWN0aW9uKS50cmlnZ2VySGFuZGxlcihldmVudHMub25FcnJvciwgW2Vycm9yLnJlc3BvbnNlVGV4dF0pO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBkZWZlcnJlZC5yZWplY3QoXCJTaWduYWxSOiBFcnJvciBkdXJpbmcgbmVnb3RpYXRpb24gcmVxdWVzdDogXCIgKyBlcnJvci5yZXNwb25zZVRleHQpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBTdG9wIHRoZSBjb25uZWN0aW9uIGlmIG5lZ290aWF0ZSBmYWlsZWRcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29ubmVjdGlvbi5zdG9wKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgIHN1Y2Nlc3M6IGZ1bmN0aW9uIChyZXN1bHQpIHtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgcmVzID0gY29ubmVjdGlvbi5fcGFyc2VSZXNwb25zZShyZXN1bHQpLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBrZWVwQWxpdmVEYXRhID0gY29ubmVjdGlvbi5rZWVwQWxpdmVEYXRhO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICBjb25uZWN0aW9uLmFwcFJlbGF0aXZlVXJsID0gcmVzLlVybDtcclxuICAgICAgICAgICAgICAgICAgICBjb25uZWN0aW9uLmlkID0gcmVzLkNvbm5lY3Rpb25JZDtcclxuICAgICAgICAgICAgICAgICAgICBjb25uZWN0aW9uLnRva2VuID0gcmVzLkNvbm5lY3Rpb25Ub2tlbjtcclxuICAgICAgICAgICAgICAgICAgICBjb25uZWN0aW9uLndlYlNvY2tldFNlcnZlclVybCA9IHJlcy5XZWJTb2NrZXRTZXJ2ZXJVcmw7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIC8vIE9uY2UgdGhlIHNlcnZlciBoYXMgbGFiZWxlZCB0aGUgUGVyc2lzdGVudENvbm5lY3Rpb24gYXMgRGlzY29ubmVjdGVkLCB3ZSBzaG91bGQgc3RvcCBhdHRlbXB0aW5nIHRvIHJlY29ubmVjdFxyXG4gICAgICAgICAgICAgICAgICAgIC8vIGFmdGVyIHJlcy5EaXNjb25uZWN0VGltZW91dCBzZWNvbmRzLlxyXG4gICAgICAgICAgICAgICAgICAgIGNvbm5lY3Rpb24uZGlzY29ubmVjdFRpbWVvdXQgPSByZXMuRGlzY29ubmVjdFRpbWVvdXQgKiAxMDAwOyAvLyBpbiBtc1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAvLyBJZiB0aGUgY29ubmVjdGlvbiBhbHJlYWR5IGhhcyBhIHRyYW5zcG9ydENvbm5lY3RUaW1lb3V0IHNldCB0aGVuIGtlZXAgaXQsIG90aGVyd2lzZSB1c2UgdGhlIHNlcnZlcnMgdmFsdWUuXHJcbiAgICAgICAgICAgICAgICAgICAgY29ubmVjdGlvbi50cmFuc3BvcnRDb25uZWN0VGltZW91dCA9IGNvbm5lY3Rpb24udHJhbnNwb3J0Q29ubmVjdFRpbWVvdXQgKyByZXMuVHJhbnNwb3J0Q29ubmVjdFRpbWVvdXQgKiAxMDAwO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAvLyBJZiB3ZSBoYXZlIGEga2VlcCBhbGl2ZVxyXG4gICAgICAgICAgICAgICAgICAgIGlmIChyZXMuS2VlcEFsaXZlVGltZW91dCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBSZWdpc3RlciB0aGUga2VlcCBhbGl2ZSBkYXRhIGFzIGFjdGl2YXRlZFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBrZWVwQWxpdmVEYXRhLmFjdGl2YXRlZCA9IHRydWU7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBUaW1lb3V0IHRvIGRlc2lnbmF0ZSB3aGVuIHRvIGZvcmNlIHRoZSBjb25uZWN0aW9uIGludG8gcmVjb25uZWN0aW5nIGNvbnZlcnRlZCB0byBtaWxsaXNlY29uZHNcclxuICAgICAgICAgICAgICAgICAgICAgICAga2VlcEFsaXZlRGF0YS50aW1lb3V0ID0gcmVzLktlZXBBbGl2ZVRpbWVvdXQgKiAxMDAwO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gVGltZW91dCB0byBkZXNpZ25hdGUgd2hlbiB0byB3YXJuIHRoZSBkZXZlbG9wZXIgdGhhdCB0aGUgY29ubmVjdGlvbiBtYXkgYmUgZGVhZCBvciBpcyBoYW5naW5nLlxyXG4gICAgICAgICAgICAgICAgICAgICAgICBrZWVwQWxpdmVEYXRhLnRpbWVvdXRXYXJuaW5nID0ga2VlcEFsaXZlRGF0YS50aW1lb3V0ICogY29ubmVjdGlvbi5rZWVwQWxpdmVXYXJuQXQ7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBJbnN0YW50aWF0ZSB0aGUgZnJlcXVlbmN5IGluIHdoaWNoIHdlIGNoZWNrIHRoZSBrZWVwIGFsaXZlLiAgSXQgbXVzdCBiZSBzaG9ydCBpbiBvcmRlciB0byBub3QgbWlzcy9waWNrIHVwIGFueSBjaGFuZ2VzXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGtlZXBBbGl2ZURhdGEuY2hlY2tJbnRlcnZhbCA9IChrZWVwQWxpdmVEYXRhLnRpbWVvdXQgLSBrZWVwQWxpdmVEYXRhLnRpbWVvdXRXYXJuaW5nKSAvIDM7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBrZWVwQWxpdmVEYXRhLmFjdGl2YXRlZCA9IGZhbHNlO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKCFyZXMuUHJvdG9jb2xWZXJzaW9uIHx8IHJlcy5Qcm90b2NvbFZlcnNpb24gIT09IGNvbm5lY3Rpb24uY2xpZW50UHJvdG9jb2wpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgJChjb25uZWN0aW9uKS50cmlnZ2VySGFuZGxlcihldmVudHMub25FcnJvciwgW1wiWW91IGFyZSB1c2luZyBhIHZlcnNpb24gb2YgdGhlIGNsaWVudCB0aGF0IGlzbid0IGNvbXBhdGlibGUgd2l0aCB0aGUgc2VydmVyLiBDbGllbnQgdmVyc2lvbiBcIiArIGNvbm5lY3Rpb24uY2xpZW50UHJvdG9jb2wgKyBcIiwgc2VydmVyIHZlcnNpb24gXCIgKyByZXMuUHJvdG9jb2xWZXJzaW9uICsgXCIuXCJdKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgZGVmZXJyZWQucmVqZWN0KFwiWW91IGFyZSB1c2luZyBhIHZlcnNpb24gb2YgdGhlIGNsaWVudCB0aGF0IGlzbid0IGNvbXBhdGlibGUgd2l0aCB0aGUgc2VydmVyLiBDbGllbnQgdmVyc2lvbiBcIiArIGNvbm5lY3Rpb24uY2xpZW50UHJvdG9jb2wgKyBcIiwgc2VydmVyIHZlcnNpb24gXCIgKyByZXMuUHJvdG9jb2xWZXJzaW9uICsgXCIuXCIpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgICAgICAkKGNvbm5lY3Rpb24pLnRyaWdnZXJIYW5kbGVyKGV2ZW50cy5vblN0YXJ0aW5nKTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIHRyYW5zcG9ydHMgPSBbXSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgc3VwcG9ydGVkVHJhbnNwb3J0cyA9IFtdO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAkLmVhY2goc2lnbmFsUi50cmFuc3BvcnRzLCBmdW5jdGlvbiAoa2V5KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChrZXkgPT09IFwid2ViU29ja2V0c1wiICYmICFyZXMuVHJ5V2ViU29ja2V0cykge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gU2VydmVyIHNhaWQgZG9uJ3QgZXZlbiB0cnkgV2ViU29ja2V0cywgYnV0IGtlZXAgcHJvY2Vzc2luZyB0aGUgbG9vcFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgc3VwcG9ydGVkVHJhbnNwb3J0cy5wdXNoKGtleSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGlmICgkLmlzQXJyYXkoY29uZmlnLnRyYW5zcG9ydCkpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gb3JkZXJlZCBsaXN0IHByb3ZpZGVkXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICQuZWFjaChjb25maWcudHJhbnNwb3J0LCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgdHJhbnNwb3J0ID0gdGhpcztcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICgkLnR5cGUodHJhbnNwb3J0KSA9PT0gXCJvYmplY3RcIiB8fCAoJC50eXBlKHRyYW5zcG9ydCkgPT09IFwic3RyaW5nXCIgJiYgJC5pbkFycmF5KFwiXCIgKyB0cmFuc3BvcnQsIHN1cHBvcnRlZFRyYW5zcG9ydHMpID49IDApKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdHJhbnNwb3J0cy5wdXNoKCQudHlwZSh0cmFuc3BvcnQpID09PSBcInN0cmluZ1wiID8gXCJcIiArIHRyYW5zcG9ydCA6IHRyYW5zcG9ydCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoJC50eXBlKGNvbmZpZy50cmFuc3BvcnQpID09PSBcIm9iamVjdFwiIHx8XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICQuaW5BcnJheShjb25maWcudHJhbnNwb3J0LCBzdXBwb3J0ZWRUcmFuc3BvcnRzKSA+PSAwKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIHNwZWNpZmljIHRyYW5zcG9ydCBwcm92aWRlZCwgYXMgb2JqZWN0IG9yIGEgbmFtZWQgdHJhbnNwb3J0LCBlLmcuIFwibG9uZ1BvbGxpbmdcIlxyXG4gICAgICAgICAgICAgICAgICAgICAgICB0cmFuc3BvcnRzLnB1c2goY29uZmlnLnRyYW5zcG9ydCk7XHJcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHsgLy8gZGVmYXVsdCBcImF1dG9cIlxyXG4gICAgICAgICAgICAgICAgICAgICAgICB0cmFuc3BvcnRzID0gc3VwcG9ydGVkVHJhbnNwb3J0cztcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgaW5pdGlhbGl6ZSh0cmFuc3BvcnRzKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gZGVmZXJyZWQucHJvbWlzZSgpO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIHN0YXJ0aW5nOiBmdW5jdGlvbiAoY2FsbGJhY2spIHtcclxuICAgICAgICAgICAgLy8vIDxzdW1tYXJ5PkFkZHMgYSBjYWxsYmFjayB0aGF0IHdpbGwgYmUgaW52b2tlZCBiZWZvcmUgYW55dGhpbmcgaXMgc2VudCBvdmVyIHRoZSBjb25uZWN0aW9uPC9zdW1tYXJ5PlxyXG4gICAgICAgICAgICAvLy8gPHBhcmFtIG5hbWU9XCJjYWxsYmFja1wiIHR5cGU9XCJGdW5jdGlvblwiPkEgY2FsbGJhY2sgZnVuY3Rpb24gdG8gZXhlY3V0ZSBiZWZvcmUgZWFjaCB0aW1lIGRhdGEgaXMgc2VudCBvbiB0aGUgY29ubmVjdGlvbjwvcGFyYW0+XHJcbiAgICAgICAgICAgIC8vLyA8cmV0dXJucyB0eXBlPVwic2lnbmFsUlwiIC8+XHJcbiAgICAgICAgICAgIHZhciBjb25uZWN0aW9uID0gdGhpcztcclxuICAgICAgICAgICAgJChjb25uZWN0aW9uKS5iaW5kKGV2ZW50cy5vblN0YXJ0aW5nLCBmdW5jdGlvbiAoZSwgZGF0YSkge1xyXG4gICAgICAgICAgICAgICAgY2FsbGJhY2suY2FsbChjb25uZWN0aW9uKTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIHJldHVybiBjb25uZWN0aW9uO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIHNlbmQ6IGZ1bmN0aW9uIChkYXRhKSB7XHJcbiAgICAgICAgICAgIC8vLyA8c3VtbWFyeT5TZW5kcyBkYXRhIG92ZXIgdGhlIGNvbm5lY3Rpb248L3N1bW1hcnk+XHJcbiAgICAgICAgICAgIC8vLyA8cGFyYW0gbmFtZT1cImRhdGFcIiB0eXBlPVwiU3RyaW5nXCI+VGhlIGRhdGEgdG8gc2VuZCBvdmVyIHRoZSBjb25uZWN0aW9uPC9wYXJhbT5cclxuICAgICAgICAgICAgLy8vIDxyZXR1cm5zIHR5cGU9XCJzaWduYWxSXCIgLz5cclxuICAgICAgICAgICAgdmFyIGNvbm5lY3Rpb24gPSB0aGlzO1xyXG5cclxuICAgICAgICAgICAgaWYgKGNvbm5lY3Rpb24uc3RhdGUgPT09IHNpZ25hbFIuY29ubmVjdGlvblN0YXRlLmRpc2Nvbm5lY3RlZCkge1xyXG4gICAgICAgICAgICAgICAgLy8gQ29ubmVjdGlvbiBoYXNuJ3QgYmVlbiBzdGFydGVkIHlldFxyXG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiU2lnbmFsUjogQ29ubmVjdGlvbiBtdXN0IGJlIHN0YXJ0ZWQgYmVmb3JlIGRhdGEgY2FuIGJlIHNlbnQuIENhbGwgLnN0YXJ0KCkgYmVmb3JlIC5zZW5kKClcIik7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGlmIChjb25uZWN0aW9uLnN0YXRlID09PSBzaWduYWxSLmNvbm5lY3Rpb25TdGF0ZS5jb25uZWN0aW5nKSB7XHJcbiAgICAgICAgICAgICAgICAvLyBDb25uZWN0aW9uIGhhc24ndCBiZWVuIHN0YXJ0ZWQgeWV0XHJcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJTaWduYWxSOiBDb25uZWN0aW9uIGhhcyBub3QgYmVlbiBmdWxseSBpbml0aWFsaXplZC4gVXNlIC5zdGFydCgpLmRvbmUoKSBvciAuc3RhcnQoKS5mYWlsKCkgdG8gcnVuIGxvZ2ljIGFmdGVyIHRoZSBjb25uZWN0aW9uIGhhcyBzdGFydGVkLlwiKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgY29ubmVjdGlvbi50cmFuc3BvcnQuc2VuZChjb25uZWN0aW9uLCBkYXRhKTtcclxuICAgICAgICAgICAgLy8gUkVWSUVXOiBTaG91bGQgd2UgcmV0dXJuIGRlZmVycmVkIGhlcmU/XHJcbiAgICAgICAgICAgIHJldHVybiBjb25uZWN0aW9uO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIHJlY2VpdmVkOiBmdW5jdGlvbiAoY2FsbGJhY2spIHtcclxuICAgICAgICAgICAgLy8vIDxzdW1tYXJ5PkFkZHMgYSBjYWxsYmFjayB0aGF0IHdpbGwgYmUgaW52b2tlZCBhZnRlciBhbnl0aGluZyBpcyByZWNlaXZlZCBvdmVyIHRoZSBjb25uZWN0aW9uPC9zdW1tYXJ5PlxyXG4gICAgICAgICAgICAvLy8gPHBhcmFtIG5hbWU9XCJjYWxsYmFja1wiIHR5cGU9XCJGdW5jdGlvblwiPkEgY2FsbGJhY2sgZnVuY3Rpb24gdG8gZXhlY3V0ZSB3aGVuIGFueSBkYXRhIGlzIHJlY2VpdmVkIG9uIHRoZSBjb25uZWN0aW9uPC9wYXJhbT5cclxuICAgICAgICAgICAgLy8vIDxyZXR1cm5zIHR5cGU9XCJzaWduYWxSXCIgLz5cclxuICAgICAgICAgICAgdmFyIGNvbm5lY3Rpb24gPSB0aGlzO1xyXG4gICAgICAgICAgICAkKGNvbm5lY3Rpb24pLmJpbmQoZXZlbnRzLm9uUmVjZWl2ZWQsIGZ1bmN0aW9uIChlLCBkYXRhKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoIWNvbm5lY3Rpb24uXy5jb25uZWN0aW5nTWVzc2FnZUJ1ZmZlci50cnlCdWZmZXIoZGF0YSkpIHtcclxuICAgICAgICAgICAgICAgICAgICBjYWxsYmFjay5jYWxsKGNvbm5lY3Rpb24sIGRhdGEpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgcmV0dXJuIGNvbm5lY3Rpb247XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgc3RhdGVDaGFuZ2VkOiBmdW5jdGlvbiAoY2FsbGJhY2spIHtcclxuICAgICAgICAgICAgLy8vIDxzdW1tYXJ5PkFkZHMgYSBjYWxsYmFjayB0aGF0IHdpbGwgYmUgaW52b2tlZCB3aGVuIHRoZSBjb25uZWN0aW9uIHN0YXRlIGNoYW5nZXM8L3N1bW1hcnk+XHJcbiAgICAgICAgICAgIC8vLyA8cGFyYW0gbmFtZT1cImNhbGxiYWNrXCIgdHlwZT1cIkZ1bmN0aW9uXCI+QSBjYWxsYmFjayBmdW5jdGlvbiB0byBleGVjdXRlIHdoZW4gdGhlIGNvbm5lY3Rpb24gc3RhdGUgY2hhbmdlczwvcGFyYW0+XHJcbiAgICAgICAgICAgIC8vLyA8cmV0dXJucyB0eXBlPVwic2lnbmFsUlwiIC8+XHJcbiAgICAgICAgICAgIHZhciBjb25uZWN0aW9uID0gdGhpcztcclxuICAgICAgICAgICAgJChjb25uZWN0aW9uKS5iaW5kKGV2ZW50cy5vblN0YXRlQ2hhbmdlZCwgZnVuY3Rpb24gKGUsIGRhdGEpIHtcclxuICAgICAgICAgICAgICAgIGNhbGxiYWNrLmNhbGwoY29ubmVjdGlvbiwgZGF0YSk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICByZXR1cm4gY29ubmVjdGlvbjtcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICBlcnJvcjogZnVuY3Rpb24gKGNhbGxiYWNrKSB7XHJcbiAgICAgICAgICAgIC8vLyA8c3VtbWFyeT5BZGRzIGEgY2FsbGJhY2sgdGhhdCB3aWxsIGJlIGludm9rZWQgYWZ0ZXIgYW4gZXJyb3Igb2NjdXJzIHdpdGggdGhlIGNvbm5lY3Rpb248L3N1bW1hcnk+XHJcbiAgICAgICAgICAgIC8vLyA8cGFyYW0gbmFtZT1cImNhbGxiYWNrXCIgdHlwZT1cIkZ1bmN0aW9uXCI+QSBjYWxsYmFjayBmdW5jdGlvbiB0byBleGVjdXRlIHdoZW4gYW4gZXJyb3Igb2NjdXJzIG9uIHRoZSBjb25uZWN0aW9uPC9wYXJhbT5cclxuICAgICAgICAgICAgLy8vIDxyZXR1cm5zIHR5cGU9XCJzaWduYWxSXCIgLz5cclxuICAgICAgICAgICAgdmFyIGNvbm5lY3Rpb24gPSB0aGlzO1xyXG4gICAgICAgICAgICAkKGNvbm5lY3Rpb24pLmJpbmQoZXZlbnRzLm9uRXJyb3IsIGZ1bmN0aW9uIChlLCBkYXRhKSB7XHJcbiAgICAgICAgICAgICAgICBjYWxsYmFjay5jYWxsKGNvbm5lY3Rpb24sIGRhdGEpO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgcmV0dXJuIGNvbm5lY3Rpb247XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgZGlzY29ubmVjdGVkOiBmdW5jdGlvbiAoY2FsbGJhY2spIHtcclxuICAgICAgICAgICAgLy8vIDxzdW1tYXJ5PkFkZHMgYSBjYWxsYmFjayB0aGF0IHdpbGwgYmUgaW52b2tlZCB3aGVuIHRoZSBjbGllbnQgZGlzY29ubmVjdHM8L3N1bW1hcnk+XHJcbiAgICAgICAgICAgIC8vLyA8cGFyYW0gbmFtZT1cImNhbGxiYWNrXCIgdHlwZT1cIkZ1bmN0aW9uXCI+QSBjYWxsYmFjayBmdW5jdGlvbiB0byBleGVjdXRlIHdoZW4gdGhlIGNvbm5lY3Rpb24gaXMgYnJva2VuPC9wYXJhbT5cclxuICAgICAgICAgICAgLy8vIDxyZXR1cm5zIHR5cGU9XCJzaWduYWxSXCIgLz5cclxuICAgICAgICAgICAgdmFyIGNvbm5lY3Rpb24gPSB0aGlzO1xyXG4gICAgICAgICAgICAkKGNvbm5lY3Rpb24pLmJpbmQoZXZlbnRzLm9uRGlzY29ubmVjdCwgZnVuY3Rpb24gKGUsIGRhdGEpIHtcclxuICAgICAgICAgICAgICAgIGNhbGxiYWNrLmNhbGwoY29ubmVjdGlvbik7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICByZXR1cm4gY29ubmVjdGlvbjtcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICBjb25uZWN0aW9uU2xvdzogZnVuY3Rpb24gKGNhbGxiYWNrKSB7XHJcbiAgICAgICAgICAgIC8vLyA8c3VtbWFyeT5BZGRzIGEgY2FsbGJhY2sgdGhhdCB3aWxsIGJlIGludm9rZWQgd2hlbiB0aGUgY2xpZW50IGRldGVjdHMgYSBzbG93IGNvbm5lY3Rpb248L3N1bW1hcnk+XHJcbiAgICAgICAgICAgIC8vLyA8cGFyYW0gbmFtZT1cImNhbGxiYWNrXCIgdHlwZT1cIkZ1bmN0aW9uXCI+QSBjYWxsYmFjayBmdW5jdGlvbiB0byBleGVjdXRlIHdoZW4gdGhlIGNvbm5lY3Rpb24gaXMgc2xvdzwvcGFyYW0+XHJcbiAgICAgICAgICAgIC8vLyA8cmV0dXJucyB0eXBlPVwic2lnbmFsUlwiIC8+XHJcbiAgICAgICAgICAgIHZhciBjb25uZWN0aW9uID0gdGhpcztcclxuICAgICAgICAgICAgJChjb25uZWN0aW9uKS5iaW5kKGV2ZW50cy5vbkNvbm5lY3Rpb25TbG93LCBmdW5jdGlvbiAoZSwgZGF0YSkge1xyXG4gICAgICAgICAgICAgICAgY2FsbGJhY2suY2FsbChjb25uZWN0aW9uKTtcclxuICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gY29ubmVjdGlvbjtcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICByZWNvbm5lY3Rpbmc6IGZ1bmN0aW9uIChjYWxsYmFjaykge1xyXG4gICAgICAgICAgICAvLy8gPHN1bW1hcnk+QWRkcyBhIGNhbGxiYWNrIHRoYXQgd2lsbCBiZSBpbnZva2VkIHdoZW4gdGhlIHVuZGVybHlpbmcgdHJhbnNwb3J0IGJlZ2lucyByZWNvbm5lY3Rpbmc8L3N1bW1hcnk+XHJcbiAgICAgICAgICAgIC8vLyA8cGFyYW0gbmFtZT1cImNhbGxiYWNrXCIgdHlwZT1cIkZ1bmN0aW9uXCI+QSBjYWxsYmFjayBmdW5jdGlvbiB0byBleGVjdXRlIHdoZW4gdGhlIGNvbm5lY3Rpb24gZW50ZXJzIGEgcmVjb25uZWN0aW5nIHN0YXRlPC9wYXJhbT5cclxuICAgICAgICAgICAgLy8vIDxyZXR1cm5zIHR5cGU9XCJzaWduYWxSXCIgLz5cclxuICAgICAgICAgICAgdmFyIGNvbm5lY3Rpb24gPSB0aGlzO1xyXG4gICAgICAgICAgICAkKGNvbm5lY3Rpb24pLmJpbmQoZXZlbnRzLm9uUmVjb25uZWN0aW5nLCBmdW5jdGlvbiAoZSwgZGF0YSkge1xyXG4gICAgICAgICAgICAgICAgY2FsbGJhY2suY2FsbChjb25uZWN0aW9uKTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIHJldHVybiBjb25uZWN0aW9uO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIHJlY29ubmVjdGVkOiBmdW5jdGlvbiAoY2FsbGJhY2spIHtcclxuICAgICAgICAgICAgLy8vIDxzdW1tYXJ5PkFkZHMgYSBjYWxsYmFjayB0aGF0IHdpbGwgYmUgaW52b2tlZCB3aGVuIHRoZSB1bmRlcmx5aW5nIHRyYW5zcG9ydCByZWNvbm5lY3RzPC9zdW1tYXJ5PlxyXG4gICAgICAgICAgICAvLy8gPHBhcmFtIG5hbWU9XCJjYWxsYmFja1wiIHR5cGU9XCJGdW5jdGlvblwiPkEgY2FsbGJhY2sgZnVuY3Rpb24gdG8gZXhlY3V0ZSB3aGVuIHRoZSBjb25uZWN0aW9uIGlzIHJlc3RvcmVkPC9wYXJhbT5cclxuICAgICAgICAgICAgLy8vIDxyZXR1cm5zIHR5cGU9XCJzaWduYWxSXCIgLz5cclxuICAgICAgICAgICAgdmFyIGNvbm5lY3Rpb24gPSB0aGlzO1xyXG4gICAgICAgICAgICAkKGNvbm5lY3Rpb24pLmJpbmQoZXZlbnRzLm9uUmVjb25uZWN0LCBmdW5jdGlvbiAoZSwgZGF0YSkge1xyXG4gICAgICAgICAgICAgICAgY2FsbGJhY2suY2FsbChjb25uZWN0aW9uKTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIHJldHVybiBjb25uZWN0aW9uO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIHN0b3A6IGZ1bmN0aW9uIChhc3luYywgbm90aWZ5U2VydmVyKSB7XHJcbiAgICAgICAgICAgIC8vLyA8c3VtbWFyeT5TdG9wcyBsaXN0ZW5pbmc8L3N1bW1hcnk+XHJcbiAgICAgICAgICAgIC8vLyA8cGFyYW0gbmFtZT1cImFzeW5jXCIgdHlwZT1cIkJvb2xlYW5cIj5XaGV0aGVyIG9yIG5vdCB0byBhc3luY2hyb25vdXNseSBhYm9ydCB0aGUgY29ubmVjdGlvbjwvcGFyYW0+XHJcbiAgICAgICAgICAgIC8vLyA8cGFyYW0gbmFtZT1cIm5vdGlmeVNlcnZlclwiIHR5cGU9XCJCb29sZWFuXCI+V2hldGhlciB3ZSB3YW50IHRvIG5vdGlmeSB0aGUgc2VydmVyIHRoYXQgd2UgYXJlIGFib3J0aW5nIHRoZSBjb25uZWN0aW9uPC9wYXJhbT5cclxuICAgICAgICAgICAgLy8vIDxyZXR1cm5zIHR5cGU9XCJzaWduYWxSXCIgLz5cclxuICAgICAgICAgICAgdmFyIGNvbm5lY3Rpb24gPSB0aGlzO1xyXG5cclxuICAgICAgICAgICAgLy8gVmVyaWZ5IHRoYXQgd2Ugc2hvdWxkIHdhaXQgZm9yIHBhZ2UgbG9hZCB0byBjYWxsIHN0b3AuXHJcbiAgICAgICAgICAgIGlmICghX3BhZ2VMb2FkZWQgJiYgKCFjb25uZWN0aW9uLl8uY29uZmlnIHx8IGNvbm5lY3Rpb24uXy5jb25maWcud2FpdEZvclBhZ2VMb2FkID09PSB0cnVlKSkge1xyXG4gICAgICAgICAgICAgICAgLy8gQ2FuIG9ubHkgc3RvcCBjb25uZWN0aW9ucyBhZnRlciB0aGUgcGFnZSBoYXMgbG9hZGVkXHJcbiAgICAgICAgICAgICAgICBfcGFnZVdpbmRvdy5sb2FkKGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgICAgICBjb25uZWN0aW9uLnN0b3AoYXN5bmMsIG5vdGlmeVNlcnZlcik7XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGlmIChjb25uZWN0aW9uLnN0YXRlID09PSBzaWduYWxSLmNvbm5lY3Rpb25TdGF0ZS5kaXNjb25uZWN0ZWQpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgICAgIGNvbm5lY3Rpb24ubG9nKFwiU2lnbmFsUjogU3RvcHBpbmcgY29ubmVjdGlvbi5cIik7XHJcblxyXG4gICAgICAgICAgICAgICAgLy8gQ2xlYXIgdGhpcyBubyBtYXR0ZXIgd2hhdFxyXG4gICAgICAgICAgICAgICAgd2luZG93LmNsZWFyVGltZW91dChjb25uZWN0aW9uLl8ub25GYWlsZWRUaW1lb3V0SGFuZGxlKTtcclxuXHJcbiAgICAgICAgICAgICAgICBpZiAoY29ubmVjdGlvbi50cmFuc3BvcnQpIHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAobm90aWZ5U2VydmVyICE9PSBmYWxzZSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25uZWN0aW9uLnRyYW5zcG9ydC5hYm9ydChjb25uZWN0aW9uLCBhc3luYyk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgICAgICBpZiAoY29ubmVjdGlvbi50cmFuc3BvcnQuc3VwcG9ydHNLZWVwQWxpdmUgJiYgY29ubmVjdGlvbi5rZWVwQWxpdmVEYXRhLmFjdGl2YXRlZCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBzaWduYWxSLnRyYW5zcG9ydHMuX2xvZ2ljLnN0b3BNb25pdG9yaW5nS2VlcEFsaXZlKGNvbm5lY3Rpb24pO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAgICAgY29ubmVjdGlvbi50cmFuc3BvcnQuc3RvcChjb25uZWN0aW9uKTtcclxuICAgICAgICAgICAgICAgICAgICBjb25uZWN0aW9uLnRyYW5zcG9ydCA9IG51bGw7XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKGNvbm5lY3Rpb24uXy5uZWdvdGlhdGVSZXF1ZXN0KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgLy8gSWYgdGhlIG5lZ290aWF0aW9uIHJlcXVlc3QgaGFzIGFscmVhZHkgY29tcGxldGVkIHRoaXMgd2lsbCBub29wLlxyXG4gICAgICAgICAgICAgICAgICAgIGNvbm5lY3Rpb24uXy5uZWdvdGlhdGVSZXF1ZXN0LmFib3J0KF9uZWdvdGlhdGVBYm9ydFRleHQpO1xyXG4gICAgICAgICAgICAgICAgICAgIGRlbGV0ZSBjb25uZWN0aW9uLl8ubmVnb3RpYXRlUmVxdWVzdDtcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAvLyBUcmlnZ2VyIHRoZSBkaXNjb25uZWN0IGV2ZW50XHJcbiAgICAgICAgICAgICAgICAkKGNvbm5lY3Rpb24pLnRyaWdnZXJIYW5kbGVyKGV2ZW50cy5vbkRpc2Nvbm5lY3QpO1xyXG5cclxuICAgICAgICAgICAgICAgIGRlbGV0ZSBjb25uZWN0aW9uLm1lc3NhZ2VJZDtcclxuICAgICAgICAgICAgICAgIGRlbGV0ZSBjb25uZWN0aW9uLmdyb3Vwc1Rva2VuO1xyXG5cclxuICAgICAgICAgICAgICAgIC8vIFJlbW92ZSB0aGUgSUQgYW5kIHRoZSBkZWZlcnJhbCBvbiBzdG9wLCB0aGlzIGlzIHRvIGVuc3VyZSB0aGF0IGlmIGEgY29ubmVjdGlvbiBpcyByZXN0YXJ0ZWQgaXQgdGFrZXMgb24gYSBuZXcgaWQvZGVmZXJyYWwuXHJcbiAgICAgICAgICAgICAgICBkZWxldGUgY29ubmVjdGlvbi5pZDtcclxuICAgICAgICAgICAgICAgIGRlbGV0ZSBjb25uZWN0aW9uLl9kZWZlcnJhbDtcclxuICAgICAgICAgICAgICAgIGRlbGV0ZSBjb25uZWN0aW9uLl8uY29uZmlnO1xyXG5cclxuICAgICAgICAgICAgICAgIC8vIENsZWFyIG91dCBvdXIgbWVzc2FnZSBidWZmZXJcclxuICAgICAgICAgICAgICAgIGNvbm5lY3Rpb24uXy5jb25uZWN0aW5nTWVzc2FnZUJ1ZmZlci5jbGVhcigpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGZpbmFsbHkge1xyXG4gICAgICAgICAgICAgICAgY2hhbmdlU3RhdGUoY29ubmVjdGlvbiwgY29ubmVjdGlvbi5zdGF0ZSwgc2lnbmFsUi5jb25uZWN0aW9uU3RhdGUuZGlzY29ubmVjdGVkKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgcmV0dXJuIGNvbm5lY3Rpb247XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgbG9nOiBmdW5jdGlvbiAobXNnKSB7XHJcbiAgICAgICAgICAgIGxvZyhtc2csIHRoaXMubG9nZ2luZyk7XHJcbiAgICAgICAgfVxyXG4gICAgfTtcclxuXHJcbiAgICBzaWduYWxSLmZuLmluaXQucHJvdG90eXBlID0gc2lnbmFsUi5mbjtcclxuXHJcbiAgICBzaWduYWxSLm5vQ29uZmxpY3QgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgLy8vIDxzdW1tYXJ5PlJlaW5zdGF0ZXMgdGhlIG9yaWdpbmFsIHZhbHVlIG9mICQuY29ubmVjdGlvbiBhbmQgcmV0dXJucyB0aGUgc2lnbmFsUiBvYmplY3QgZm9yIG1hbnVhbCBhc3NpZ25tZW50PC9zdW1tYXJ5PlxyXG4gICAgICAgIC8vLyA8cmV0dXJucyB0eXBlPVwic2lnbmFsUlwiIC8+XHJcbiAgICAgICAgaWYgKCQuY29ubmVjdGlvbiA9PT0gc2lnbmFsUikge1xyXG4gICAgICAgICAgICAkLmNvbm5lY3Rpb24gPSBfY29ubmVjdGlvbjtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIHNpZ25hbFI7XHJcbiAgICB9O1xyXG5cclxuICAgIGlmICgkLmNvbm5lY3Rpb24pIHtcclxuICAgICAgICBfY29ubmVjdGlvbiA9ICQuY29ubmVjdGlvbjtcclxuICAgIH1cclxuXHJcbiAgICAkLmNvbm5lY3Rpb24gPSAkLnNpZ25hbFIgPSBzaWduYWxSO1xyXG5cclxufSh3aW5kb3cualF1ZXJ5LCB3aW5kb3cpKTtcclxuLyoganF1ZXJ5LnNpZ25hbFIudHJhbnNwb3J0cy5jb21tb24uanMgKi9cclxuLy8gQ29weXJpZ2h0IChjKSBNaWNyb3NvZnQgT3BlbiBUZWNobm9sb2dpZXMsIEluYy4gQWxsIHJpZ2h0cyByZXNlcnZlZC4gU2VlIExpY2Vuc2UubWQgaW4gdGhlIHByb2plY3Qgcm9vdCBmb3IgbGljZW5zZSBpbmZvcm1hdGlvbi5cclxuXHJcbi8qZ2xvYmFsIHdpbmRvdzpmYWxzZSAqL1xyXG4vLy8gPHJlZmVyZW5jZSBwYXRoPVwianF1ZXJ5LnNpZ25hbFIuY29yZS5qc1wiIC8+XHJcblxyXG4oZnVuY3Rpb24gKCQsIHdpbmRvdykge1xyXG4gICAgXCJ1c2Ugc3RyaWN0XCI7XHJcblxyXG4gICAgdmFyIHNpZ25hbFIgPSAkLnNpZ25hbFIsXHJcbiAgICAgICAgZXZlbnRzID0gJC5zaWduYWxSLmV2ZW50cyxcclxuICAgICAgICBjaGFuZ2VTdGF0ZSA9ICQuc2lnbmFsUi5jaGFuZ2VTdGF0ZSxcclxuICAgICAgICB0cmFuc3BvcnRMb2dpYztcclxuXHJcbiAgICBzaWduYWxSLnRyYW5zcG9ydHMgPSB7fTtcclxuXHJcbiAgICBmdW5jdGlvbiBjaGVja0lmQWxpdmUoY29ubmVjdGlvbikge1xyXG4gICAgICAgIHZhciBrZWVwQWxpdmVEYXRhID0gY29ubmVjdGlvbi5rZWVwQWxpdmVEYXRhLFxyXG4gICAgICAgICAgICBkaWZmLFxyXG4gICAgICAgICAgICB0aW1lRWxhcHNlZDtcclxuXHJcbiAgICAgICAgLy8gT25seSBjaGVjayBpZiB3ZSdyZSBjb25uZWN0ZWRcclxuICAgICAgICBpZiAoY29ubmVjdGlvbi5zdGF0ZSA9PT0gc2lnbmFsUi5jb25uZWN0aW9uU3RhdGUuY29ubmVjdGVkKSB7XHJcbiAgICAgICAgICAgIGRpZmYgPSBuZXcgRGF0ZSgpO1xyXG5cclxuICAgICAgICAgICAgZGlmZi5zZXRUaW1lKGRpZmYgLSBrZWVwQWxpdmVEYXRhLmxhc3RLZWVwQWxpdmUpO1xyXG4gICAgICAgICAgICB0aW1lRWxhcHNlZCA9IGRpZmYuZ2V0VGltZSgpO1xyXG5cclxuICAgICAgICAgICAgLy8gQ2hlY2sgaWYgdGhlIGtlZXAgYWxpdmUgaGFzIGNvbXBsZXRlbHkgdGltZWQgb3V0XHJcbiAgICAgICAgICAgIGlmICh0aW1lRWxhcHNlZCA+PSBrZWVwQWxpdmVEYXRhLnRpbWVvdXQpIHtcclxuICAgICAgICAgICAgICAgIGNvbm5lY3Rpb24ubG9nKFwiS2VlcCBhbGl2ZSB0aW1lZCBvdXQuICBOb3RpZnlpbmcgdHJhbnNwb3J0IHRoYXQgY29ubmVjdGlvbiBoYXMgYmVlbiBsb3N0LlwiKTtcclxuXHJcbiAgICAgICAgICAgICAgICAvLyBOb3RpZnkgdHJhbnNwb3J0IHRoYXQgdGhlIGNvbm5lY3Rpb24gaGFzIGJlZW4gbG9zdFxyXG4gICAgICAgICAgICAgICAgY29ubmVjdGlvbi50cmFuc3BvcnQubG9zdENvbm5lY3Rpb24oY29ubmVjdGlvbik7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgZWxzZSBpZiAodGltZUVsYXBzZWQgPj0ga2VlcEFsaXZlRGF0YS50aW1lb3V0V2FybmluZykge1xyXG4gICAgICAgICAgICAgICAgLy8gVGhpcyBpcyB0byBhc3N1cmUgdGhhdCB0aGUgdXNlciBvbmx5IGdldHMgYSBzaW5nbGUgd2FybmluZ1xyXG4gICAgICAgICAgICAgICAgaWYgKCFrZWVwQWxpdmVEYXRhLnVzZXJOb3RpZmllZCkge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbm5lY3Rpb24ubG9nKFwiS2VlcCBhbGl2ZSBoYXMgYmVlbiBtaXNzZWQsIGNvbm5lY3Rpb24gbWF5IGJlIGRlYWQvc2xvdy5cIik7XHJcbiAgICAgICAgICAgICAgICAgICAgJChjb25uZWN0aW9uKS50cmlnZ2VySGFuZGxlcihldmVudHMub25Db25uZWN0aW9uU2xvdyk7XHJcbiAgICAgICAgICAgICAgICAgICAga2VlcEFsaXZlRGF0YS51c2VyTm90aWZpZWQgPSB0cnVlO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAgICAga2VlcEFsaXZlRGF0YS51c2VyTm90aWZpZWQgPSBmYWxzZTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gVmVyaWZ5IHdlJ3JlIG1vbml0b3JpbmcgdGhlIGtlZXAgYWxpdmVcclxuICAgICAgICAvLyBXZSBkb24ndCB3YW50IHRoaXMgYXMgYSBwYXJ0IG9mIHRoZSBpbm5lciBpZiBzdGF0ZW1lbnQgYWJvdmUgYmVjYXVzZSB3ZSB3YW50IGtlZXAgYWxpdmVzIHRvIGNvbnRpbnVlIHRvIGJlIGNoZWNrZWRcclxuICAgICAgICAvLyBpbiB0aGUgZXZlbnQgdGhhdCB0aGUgc2VydmVyIGNvbWVzIGJhY2sgb25saW5lIChpZiBpdCBnb2VzIG9mZmxpbmUpLlxyXG4gICAgICAgIGlmIChrZWVwQWxpdmVEYXRhLm1vbml0b3JpbmcpIHtcclxuICAgICAgICAgICAgd2luZG93LnNldFRpbWVvdXQoZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgY2hlY2tJZkFsaXZlKGNvbm5lY3Rpb24pO1xyXG4gICAgICAgICAgICB9LCBrZWVwQWxpdmVEYXRhLmNoZWNrSW50ZXJ2YWwpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiBpc0Nvbm5lY3RlZE9yUmVjb25uZWN0aW5nKGNvbm5lY3Rpb24pIHtcclxuICAgICAgICByZXR1cm4gY29ubmVjdGlvbi5zdGF0ZSA9PT0gc2lnbmFsUi5jb25uZWN0aW9uU3RhdGUuY29ubmVjdGVkIHx8XHJcbiAgICAgICAgICAgICAgIGNvbm5lY3Rpb24uc3RhdGUgPT09IHNpZ25hbFIuY29ubmVjdGlvblN0YXRlLnJlY29ubmVjdGluZztcclxuICAgIH1cclxuXHJcbiAgICB0cmFuc3BvcnRMb2dpYyA9IHNpZ25hbFIudHJhbnNwb3J0cy5fbG9naWMgPSB7XHJcbiAgICAgICAgcGluZ1NlcnZlcjogZnVuY3Rpb24gKGNvbm5lY3Rpb24sIHRyYW5zcG9ydCkge1xyXG4gICAgICAgICAgICAvLy8gPHN1bW1hcnk+UGluZ3MgdGhlIHNlcnZlcjwvc3VtbWFyeT5cclxuICAgICAgICAgICAgLy8vIDxwYXJhbSBuYW1lPVwiY29ubmVjdGlvblwiIHR5cGU9XCJzaWduYWxyXCI+Q29ubmVjdGlvbiBhc3NvY2lhdGVkIHdpdGggdGhlIHNlcnZlciBwaW5nPC9wYXJhbT5cclxuICAgICAgICAgICAgLy8vIDxyZXR1cm5zIHR5cGU9XCJzaWduYWxSXCIgLz5cclxuICAgICAgICAgICAgdmFyIGJhc2VVcmwgPSB0cmFuc3BvcnQgPT09IFwid2ViU29ja2V0c1wiID8gXCJcIiA6IGNvbm5lY3Rpb24uYmFzZVVybCxcclxuICAgICAgICAgICAgICAgIHVybCA9IGJhc2VVcmwgKyBjb25uZWN0aW9uLmFwcFJlbGF0aXZlVXJsICsgXCIvcGluZ1wiLFxyXG4gICAgICAgICAgICAgICAgZGVmZXJyYWwgPSAkLkRlZmVycmVkKCk7XHJcblxyXG4gICAgICAgICAgICB1cmwgPSB0aGlzLmFkZFFzKHVybCwgY29ubmVjdGlvbi5xcyk7XHJcblxyXG4gICAgICAgICAgICAkLmFqYXgoe1xyXG4gICAgICAgICAgICAgICAgdXJsOiB1cmwsXHJcbiAgICAgICAgICAgICAgICBnbG9iYWw6IGZhbHNlLFxyXG4gICAgICAgICAgICAgICAgY2FjaGU6IGZhbHNlLFxyXG4gICAgICAgICAgICAgICAgdHlwZTogXCJHRVRcIixcclxuICAgICAgICAgICAgICAgIGNvbnRlbnRUeXBlOiBjb25uZWN0aW9uLmNvbnRlbnRUeXBlLFxyXG4gICAgICAgICAgICAgICAgZGF0YToge30sXHJcbiAgICAgICAgICAgICAgICBkYXRhVHlwZTogY29ubmVjdGlvbi5hamF4RGF0YVR5cGUsXHJcbiAgICAgICAgICAgICAgICBzdWNjZXNzOiBmdW5jdGlvbiAocmVzdWx0KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIGRhdGEgPSBjb25uZWN0aW9uLl9wYXJzZVJlc3BvbnNlKHJlc3VsdCk7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGlmIChkYXRhLlJlc3BvbnNlID09PSBcInBvbmdcIikge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBkZWZlcnJhbC5yZXNvbHZlKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBkZWZlcnJhbC5yZWplY3QoXCJTaWduYWxSOiBJbnZhbGlkIHBpbmcgcmVzcG9uc2Ugd2hlbiBwaW5naW5nIHNlcnZlcjogXCIgKyAoZGF0YS5yZXNwb25zZVRleHQgfHwgZGF0YS5zdGF0dXNUZXh0KSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgIGVycm9yOiBmdW5jdGlvbiAoZGF0YSkge1xyXG4gICAgICAgICAgICAgICAgICAgIGRlZmVycmFsLnJlamVjdChcIlNpZ25hbFI6IEVycm9yIHBpbmdpbmcgc2VydmVyOiBcIiArIChkYXRhLnJlc3BvbnNlVGV4dCB8fCBkYXRhLnN0YXR1c1RleHQpKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gZGVmZXJyYWwucHJvbWlzZSgpO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIGFkZFFzOiBmdW5jdGlvbiAodXJsLCBxcykge1xyXG4gICAgICAgICAgICB2YXIgYXBwZW5kZXIgPSB1cmwuaW5kZXhPZihcIj9cIikgIT09IC0xID8gXCImXCIgOiBcIj9cIixcclxuICAgICAgICAgICAgICAgIGZpcnN0Q2hhcjtcclxuXHJcbiAgICAgICAgICAgIGlmICghcXMpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiB1cmw7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGlmICh0eXBlb2YgKHFzKSA9PT0gXCJvYmplY3RcIikge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHVybCArIGFwcGVuZGVyICsgJC5wYXJhbShxcyk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGlmICh0eXBlb2YgKHFzKSA9PT0gXCJzdHJpbmdcIikge1xyXG4gICAgICAgICAgICAgICAgZmlyc3RDaGFyID0gcXMuY2hhckF0KDApO1xyXG5cclxuICAgICAgICAgICAgICAgIGlmIChmaXJzdENoYXIgPT09IFwiP1wiIHx8IGZpcnN0Q2hhciA9PT0gXCImXCIpIHtcclxuICAgICAgICAgICAgICAgICAgICBhcHBlbmRlciA9IFwiXCI7XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHVybCArIGFwcGVuZGVyICsgcXM7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIlF1ZXJ5IHN0cmluZyBwcm9wZXJ0eSBtdXN0IGJlIGVpdGhlciBhIHN0cmluZyBvciBvYmplY3QuXCIpO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIGdldFVybDogZnVuY3Rpb24gKGNvbm5lY3Rpb24sIHRyYW5zcG9ydCwgcmVjb25uZWN0aW5nLCBwb2xsKSB7XHJcbiAgICAgICAgICAgIC8vLyA8c3VtbWFyeT5HZXRzIHRoZSB1cmwgZm9yIG1ha2luZyBhIEdFVCBiYXNlZCBjb25uZWN0IHJlcXVlc3Q8L3N1bW1hcnk+XHJcbiAgICAgICAgICAgIHZhciBiYXNlVXJsID0gdHJhbnNwb3J0ID09PSBcIndlYlNvY2tldHNcIiA/IFwiXCIgOiBjb25uZWN0aW9uLmJhc2VVcmwsXHJcbiAgICAgICAgICAgICAgICB1cmwgPSBiYXNlVXJsICsgY29ubmVjdGlvbi5hcHBSZWxhdGl2ZVVybCxcclxuICAgICAgICAgICAgICAgIHFzID0gXCJ0cmFuc3BvcnQ9XCIgKyB0cmFuc3BvcnQgKyBcIiZjb25uZWN0aW9uVG9rZW49XCIgKyB3aW5kb3cuZW5jb2RlVVJJQ29tcG9uZW50KGNvbm5lY3Rpb24udG9rZW4pO1xyXG5cclxuICAgICAgICAgICAgaWYgKGNvbm5lY3Rpb24uZGF0YSkge1xyXG4gICAgICAgICAgICAgICAgcXMgKz0gXCImY29ubmVjdGlvbkRhdGE9XCIgKyB3aW5kb3cuZW5jb2RlVVJJQ29tcG9uZW50KGNvbm5lY3Rpb24uZGF0YSk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGlmIChjb25uZWN0aW9uLmdyb3Vwc1Rva2VuKSB7XHJcbiAgICAgICAgICAgICAgICBxcyArPSBcIiZncm91cHNUb2tlbj1cIiArIHdpbmRvdy5lbmNvZGVVUklDb21wb25lbnQoY29ubmVjdGlvbi5ncm91cHNUb2tlbik7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGlmICghcmVjb25uZWN0aW5nKSB7XHJcbiAgICAgICAgICAgICAgICB1cmwgKz0gXCIvY29ubmVjdFwiO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgaWYgKHBvbGwpIHtcclxuICAgICAgICAgICAgICAgICAgICAvLyBsb25nUG9sbGluZyB0cmFuc3BvcnQgc3BlY2lmaWNcclxuICAgICAgICAgICAgICAgICAgICB1cmwgKz0gXCIvcG9sbFwiO1xyXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICB1cmwgKz0gXCIvcmVjb25uZWN0XCI7XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKGNvbm5lY3Rpb24ubWVzc2FnZUlkKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcXMgKz0gXCImbWVzc2FnZUlkPVwiICsgd2luZG93LmVuY29kZVVSSUNvbXBvbmVudChjb25uZWN0aW9uLm1lc3NhZ2VJZCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgdXJsICs9IFwiP1wiICsgcXM7XHJcbiAgICAgICAgICAgIHVybCA9IHRyYW5zcG9ydExvZ2ljLmFkZFFzKHVybCwgY29ubmVjdGlvbi5xcyk7XHJcbiAgICAgICAgICAgIHVybCArPSBcIiZ0aWQ9XCIgKyBNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiAxMSk7XHJcbiAgICAgICAgICAgIHJldHVybiB1cmw7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgbWF4aW1pemVQZXJzaXN0ZW50UmVzcG9uc2U6IGZ1bmN0aW9uIChtaW5QZXJzaXN0ZW50UmVzcG9uc2UpIHtcclxuICAgICAgICAgICAgcmV0dXJuIHtcclxuICAgICAgICAgICAgICAgIE1lc3NhZ2VJZDogbWluUGVyc2lzdGVudFJlc3BvbnNlLkMsXHJcbiAgICAgICAgICAgICAgICBNZXNzYWdlczogbWluUGVyc2lzdGVudFJlc3BvbnNlLk0sXHJcbiAgICAgICAgICAgICAgICBJbml0aWFsaXplZDogdHlwZW9mIChtaW5QZXJzaXN0ZW50UmVzcG9uc2UuUykgIT09IFwidW5kZWZpbmVkXCIgPyB0cnVlIDogZmFsc2UsXHJcbiAgICAgICAgICAgICAgICBEaXNjb25uZWN0OiB0eXBlb2YgKG1pblBlcnNpc3RlbnRSZXNwb25zZS5EKSAhPT0gXCJ1bmRlZmluZWRcIiA/IHRydWUgOiBmYWxzZSxcclxuICAgICAgICAgICAgICAgIFRpbWVkT3V0OiB0eXBlb2YgKG1pblBlcnNpc3RlbnRSZXNwb25zZS5UKSAhPT0gXCJ1bmRlZmluZWRcIiA/IHRydWUgOiBmYWxzZSxcclxuICAgICAgICAgICAgICAgIExvbmdQb2xsRGVsYXk6IG1pblBlcnNpc3RlbnRSZXNwb25zZS5MLFxyXG4gICAgICAgICAgICAgICAgR3JvdXBzVG9rZW46IG1pblBlcnNpc3RlbnRSZXNwb25zZS5HXHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgdXBkYXRlR3JvdXBzOiBmdW5jdGlvbiAoY29ubmVjdGlvbiwgZ3JvdXBzVG9rZW4pIHtcclxuICAgICAgICAgICAgaWYgKGdyb3Vwc1Rva2VuKSB7XHJcbiAgICAgICAgICAgICAgICBjb25uZWN0aW9uLmdyb3Vwc1Rva2VuID0gZ3JvdXBzVG9rZW47XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICBhamF4U2VuZDogZnVuY3Rpb24gKGNvbm5lY3Rpb24sIGRhdGEpIHtcclxuICAgICAgICAgICAgdmFyIHVybCA9IGNvbm5lY3Rpb24udXJsICsgXCIvc2VuZFwiICsgXCI/dHJhbnNwb3J0PVwiICsgY29ubmVjdGlvbi50cmFuc3BvcnQubmFtZSArIFwiJmNvbm5lY3Rpb25Ub2tlbj1cIiArIHdpbmRvdy5lbmNvZGVVUklDb21wb25lbnQoY29ubmVjdGlvbi50b2tlbik7XHJcbiAgICAgICAgICAgIHVybCA9IHRoaXMuYWRkUXModXJsLCBjb25uZWN0aW9uLnFzKTtcclxuICAgICAgICAgICAgcmV0dXJuICQuYWpheCh7XHJcbiAgICAgICAgICAgICAgICB1cmw6IHVybCxcclxuICAgICAgICAgICAgICAgIGdsb2JhbDogZmFsc2UsXHJcbiAgICAgICAgICAgICAgICB0eXBlOiBjb25uZWN0aW9uLmFqYXhEYXRhVHlwZSA9PT0gXCJqc29ucFwiID8gXCJHRVRcIiA6IFwiUE9TVFwiLFxyXG4gICAgICAgICAgICAgICAgY29udGVudFR5cGU6IHNpZ25hbFIuXy5kZWZhdWx0Q29udGVudFR5cGUsXHJcbiAgICAgICAgICAgICAgICBkYXRhVHlwZTogY29ubmVjdGlvbi5hamF4RGF0YVR5cGUsXHJcbiAgICAgICAgICAgICAgICBkYXRhOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgZGF0YTogZGF0YVxyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgIHN1Y2Nlc3M6IGZ1bmN0aW9uIChyZXN1bHQpIHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAocmVzdWx0KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICQoY29ubmVjdGlvbikudHJpZ2dlckhhbmRsZXIoZXZlbnRzLm9uUmVjZWl2ZWQsIFtjb25uZWN0aW9uLl9wYXJzZVJlc3BvbnNlKHJlc3VsdCldKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgZXJyb3I6IGZ1bmN0aW9uIChlcnJEYXRhLCB0ZXh0U3RhdHVzKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKHRleHRTdGF0dXMgPT09IFwiYWJvcnRcIiB8fCB0ZXh0U3RhdHVzID09PSBcInBhcnNlcmVycm9yXCIpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gVGhlIHBhcnNlcmVycm9yIGhhcHBlbnMgZm9yIHNlbmRzIHRoYXQgZG9uJ3QgcmV0dXJuIGFueSBkYXRhLCBhbmQgaGVuY2VcclxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gZG9uJ3Qgd3JpdGUgdGhlIGpzb25wIGNhbGxiYWNrIHRvIHRoZSByZXNwb25zZS4gVGhpcyBpcyBoYXJkZXIgdG8gZml4IG9uIHRoZSBzZXJ2ZXJcclxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gc28ganVzdCBoYWNrIGFyb3VuZCBpdCBvbiB0aGUgY2xpZW50IGZvciBub3cuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgJChjb25uZWN0aW9uKS50cmlnZ2VySGFuZGxlcihldmVudHMub25FcnJvciwgW2VyckRhdGFdKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgYWpheEFib3J0OiBmdW5jdGlvbiAoY29ubmVjdGlvbiwgYXN5bmMpIHtcclxuICAgICAgICAgICAgaWYgKHR5cGVvZiAoY29ubmVjdGlvbi50cmFuc3BvcnQpID09PSBcInVuZGVmaW5lZFwiKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIC8vIEFzeW5jIGJ5IGRlZmF1bHQgdW5sZXNzIGV4cGxpY2l0bHkgb3ZlcmlkZGVuXHJcbiAgICAgICAgICAgIGFzeW5jID0gdHlwZW9mIGFzeW5jID09PSBcInVuZGVmaW5lZFwiID8gdHJ1ZSA6IGFzeW5jO1xyXG5cclxuICAgICAgICAgICAgdmFyIHVybCA9IGNvbm5lY3Rpb24udXJsICsgXCIvYWJvcnRcIiArIFwiP3RyYW5zcG9ydD1cIiArIGNvbm5lY3Rpb24udHJhbnNwb3J0Lm5hbWUgKyBcIiZjb25uZWN0aW9uVG9rZW49XCIgKyB3aW5kb3cuZW5jb2RlVVJJQ29tcG9uZW50KGNvbm5lY3Rpb24udG9rZW4pO1xyXG4gICAgICAgICAgICB1cmwgPSB0aGlzLmFkZFFzKHVybCwgY29ubmVjdGlvbi5xcyk7XHJcbiAgICAgICAgICAgICQuYWpheCh7XHJcbiAgICAgICAgICAgICAgICB1cmw6IHVybCxcclxuICAgICAgICAgICAgICAgIGFzeW5jOiBhc3luYyxcclxuICAgICAgICAgICAgICAgIHRpbWVvdXQ6IDEwMDAsXHJcbiAgICAgICAgICAgICAgICBnbG9iYWw6IGZhbHNlLFxyXG4gICAgICAgICAgICAgICAgdHlwZTogXCJQT1NUXCIsXHJcbiAgICAgICAgICAgICAgICBjb250ZW50VHlwZTogY29ubmVjdGlvbi5jb250ZW50VHlwZSxcclxuICAgICAgICAgICAgICAgIGRhdGFUeXBlOiBjb25uZWN0aW9uLmFqYXhEYXRhVHlwZSxcclxuICAgICAgICAgICAgICAgIGRhdGE6IHt9XHJcbiAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgICAgY29ubmVjdGlvbi5sb2coXCJGaXJlZCBhamF4IGFib3J0IGFzeW5jID0gXCIgKyBhc3luYyk7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgdHJ5SW5pdGlhbGl6ZTogZnVuY3Rpb24gKHBlcnNpc3RlbnRSZXNwb25zZSwgb25Jbml0aWFsaXplZCkge1xyXG4gICAgICAgICAgICBpZiAocGVyc2lzdGVudFJlc3BvbnNlLkluaXRpYWxpemVkKSB7XHJcbiAgICAgICAgICAgICAgICBvbkluaXRpYWxpemVkKCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICBwcm9jZXNzTWVzc2FnZXM6IGZ1bmN0aW9uIChjb25uZWN0aW9uLCBtaW5EYXRhLCBvbkluaXRpYWxpemVkKSB7XHJcbiAgICAgICAgICAgIHZhciBkYXRhLFxyXG4gICAgICAgICAgICAgICAgJGNvbm5lY3Rpb24gPSAkKGNvbm5lY3Rpb24pO1xyXG5cclxuICAgICAgICAgICAgLy8gSWYgb3VyIHRyYW5zcG9ydCBzdXBwb3J0cyBrZWVwIGFsaXZlIHRoZW4gd2UgbmVlZCB0byB1cGRhdGUgdGhlIGxhc3Qga2VlcCBhbGl2ZSB0aW1lIHN0YW1wLlxyXG4gICAgICAgICAgICAvLyBWZXJ5IHJhcmVseSB0aGUgdHJhbnNwb3J0IGNhbiBiZSBudWxsLlxyXG4gICAgICAgICAgICBpZiAoY29ubmVjdGlvbi50cmFuc3BvcnQgJiYgY29ubmVjdGlvbi50cmFuc3BvcnQuc3VwcG9ydHNLZWVwQWxpdmUgJiYgY29ubmVjdGlvbi5rZWVwQWxpdmVEYXRhLmFjdGl2YXRlZCkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy51cGRhdGVLZWVwQWxpdmUoY29ubmVjdGlvbik7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGlmIChtaW5EYXRhKSB7XHJcbiAgICAgICAgICAgICAgICBkYXRhID0gdGhpcy5tYXhpbWl6ZVBlcnNpc3RlbnRSZXNwb25zZShtaW5EYXRhKTtcclxuXHJcbiAgICAgICAgICAgICAgICBpZiAoZGF0YS5EaXNjb25uZWN0KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY29ubmVjdGlvbi5sb2coXCJEaXNjb25uZWN0IGNvbW1hbmQgcmVjZWl2ZWQgZnJvbSBzZXJ2ZXJcIik7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIC8vIERpc2Nvbm5lY3RlZCBieSB0aGUgc2VydmVyXHJcbiAgICAgICAgICAgICAgICAgICAgY29ubmVjdGlvbi5zdG9wKGZhbHNlLCBmYWxzZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIHRoaXMudXBkYXRlR3JvdXBzKGNvbm5lY3Rpb24sIGRhdGEuR3JvdXBzVG9rZW4pO1xyXG5cclxuICAgICAgICAgICAgICAgIGlmIChkYXRhLk1lc3NhZ2VJZCkge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbm5lY3Rpb24ubWVzc2FnZUlkID0gZGF0YS5NZXNzYWdlSWQ7XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKGRhdGEuTWVzc2FnZXMpIHtcclxuICAgICAgICAgICAgICAgICAgICAkLmVhY2goZGF0YS5NZXNzYWdlcywgZnVuY3Rpb24gKGluZGV4LCBtZXNzYWdlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICRjb25uZWN0aW9uLnRyaWdnZXJIYW5kbGVyKGV2ZW50cy5vblJlY2VpdmVkLCBbbWVzc2FnZV0pO1xyXG4gICAgICAgICAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICB0cmFuc3BvcnRMb2dpYy50cnlJbml0aWFsaXplKGRhdGEsIG9uSW5pdGlhbGl6ZWQpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgbW9uaXRvcktlZXBBbGl2ZTogZnVuY3Rpb24gKGNvbm5lY3Rpb24pIHtcclxuICAgICAgICAgICAgdmFyIGtlZXBBbGl2ZURhdGEgPSBjb25uZWN0aW9uLmtlZXBBbGl2ZURhdGEsXHJcbiAgICAgICAgICAgICAgICB0aGF0ID0gdGhpcztcclxuXHJcbiAgICAgICAgICAgIC8vIElmIHdlIGhhdmVuJ3QgaW5pdGlhdGVkIHRoZSBrZWVwIGFsaXZlIHRpbWVvdXRzIHRoZW4gd2UgbmVlZCB0b1xyXG4gICAgICAgICAgICBpZiAoIWtlZXBBbGl2ZURhdGEubW9uaXRvcmluZykge1xyXG4gICAgICAgICAgICAgICAga2VlcEFsaXZlRGF0YS5tb25pdG9yaW5nID0gdHJ1ZTtcclxuXHJcbiAgICAgICAgICAgICAgICAvLyBJbml0aWFsaXplIHRoZSBrZWVwIGFsaXZlIHRpbWUgc3RhbXAgcGluZ1xyXG4gICAgICAgICAgICAgICAgdGhhdC51cGRhdGVLZWVwQWxpdmUoY29ubmVjdGlvbik7XHJcblxyXG4gICAgICAgICAgICAgICAgLy8gU2F2ZSB0aGUgZnVuY3Rpb24gc28gd2UgY2FuIHVuYmluZCBpdCBvbiBzdG9wXHJcbiAgICAgICAgICAgICAgICBjb25uZWN0aW9uLmtlZXBBbGl2ZURhdGEucmVjb25uZWN0S2VlcEFsaXZlVXBkYXRlID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgICAgIHRoYXQudXBkYXRlS2VlcEFsaXZlKGNvbm5lY3Rpb24pO1xyXG4gICAgICAgICAgICAgICAgfTtcclxuXHJcbiAgICAgICAgICAgICAgICAvLyBVcGRhdGUgS2VlcCBhbGl2ZSBvbiByZWNvbm5lY3RcclxuICAgICAgICAgICAgICAgICQoY29ubmVjdGlvbikuYmluZChldmVudHMub25SZWNvbm5lY3QsIGNvbm5lY3Rpb24ua2VlcEFsaXZlRGF0YS5yZWNvbm5lY3RLZWVwQWxpdmVVcGRhdGUpO1xyXG5cclxuICAgICAgICAgICAgICAgIGNvbm5lY3Rpb24ubG9nKFwiTm93IG1vbml0b3Jpbmcga2VlcCBhbGl2ZSB3aXRoIGEgd2FybmluZyB0aW1lb3V0IG9mIFwiICsga2VlcEFsaXZlRGF0YS50aW1lb3V0V2FybmluZyArIFwiIGFuZCBhIGNvbm5lY3Rpb24gbG9zdCB0aW1lb3V0IG9mIFwiICsga2VlcEFsaXZlRGF0YS50aW1lb3V0KTtcclxuICAgICAgICAgICAgICAgIC8vIFN0YXJ0IHRoZSBtb25pdG9yaW5nIG9mIHRoZSBrZWVwIGFsaXZlXHJcbiAgICAgICAgICAgICAgICBjaGVja0lmQWxpdmUoY29ubmVjdGlvbik7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgICAgICBjb25uZWN0aW9uLmxvZyhcIlRyaWVkIHRvIG1vbml0b3Iga2VlcCBhbGl2ZSBidXQgaXQncyBhbHJlYWR5IGJlaW5nIG1vbml0b3JlZFwiKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIHN0b3BNb25pdG9yaW5nS2VlcEFsaXZlOiBmdW5jdGlvbiAoY29ubmVjdGlvbikge1xyXG4gICAgICAgICAgICB2YXIga2VlcEFsaXZlRGF0YSA9IGNvbm5lY3Rpb24ua2VlcEFsaXZlRGF0YTtcclxuXHJcbiAgICAgICAgICAgIC8vIE9ubHkgYXR0ZW1wdCB0byBzdG9wIHRoZSBrZWVwIGFsaXZlIG1vbml0b3JpbmcgaWYgaXRzIGJlaW5nIG1vbml0b3JlZFxyXG4gICAgICAgICAgICBpZiAoa2VlcEFsaXZlRGF0YS5tb25pdG9yaW5nKSB7XHJcbiAgICAgICAgICAgICAgICAvLyBTdG9wIG1vbml0b3JpbmdcclxuICAgICAgICAgICAgICAgIGtlZXBBbGl2ZURhdGEubW9uaXRvcmluZyA9IGZhbHNlO1xyXG5cclxuICAgICAgICAgICAgICAgIC8vIFJlbW92ZSB0aGUgdXBkYXRlS2VlcEFsaXZlIGZ1bmN0aW9uIGZyb20gdGhlIHJlY29ubmVjdCBldmVudFxyXG4gICAgICAgICAgICAgICAgJChjb25uZWN0aW9uKS51bmJpbmQoZXZlbnRzLm9uUmVjb25uZWN0LCBjb25uZWN0aW9uLmtlZXBBbGl2ZURhdGEucmVjb25uZWN0S2VlcEFsaXZlVXBkYXRlKTtcclxuXHJcbiAgICAgICAgICAgICAgICAvLyBDbGVhciBhbGwgdGhlIGtlZXAgYWxpdmUgZGF0YVxyXG4gICAgICAgICAgICAgICAgY29ubmVjdGlvbi5rZWVwQWxpdmVEYXRhID0ge307XHJcbiAgICAgICAgICAgICAgICBjb25uZWN0aW9uLmxvZyhcIlN0b3BwaW5nIHRoZSBtb25pdG9yaW5nIG9mIHRoZSBrZWVwIGFsaXZlXCIpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgdXBkYXRlS2VlcEFsaXZlOiBmdW5jdGlvbiAoY29ubmVjdGlvbikge1xyXG4gICAgICAgICAgICBjb25uZWN0aW9uLmtlZXBBbGl2ZURhdGEubGFzdEtlZXBBbGl2ZSA9IG5ldyBEYXRlKCk7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgZW5zdXJlUmVjb25uZWN0aW5nU3RhdGU6IGZ1bmN0aW9uIChjb25uZWN0aW9uKSB7XHJcbiAgICAgICAgICAgIGlmIChjaGFuZ2VTdGF0ZShjb25uZWN0aW9uLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBzaWduYWxSLmNvbm5lY3Rpb25TdGF0ZS5jb25uZWN0ZWQsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHNpZ25hbFIuY29ubmVjdGlvblN0YXRlLnJlY29ubmVjdGluZykgPT09IHRydWUpIHtcclxuICAgICAgICAgICAgICAgICQoY29ubmVjdGlvbikudHJpZ2dlckhhbmRsZXIoZXZlbnRzLm9uUmVjb25uZWN0aW5nKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZXR1cm4gY29ubmVjdGlvbi5zdGF0ZSA9PT0gc2lnbmFsUi5jb25uZWN0aW9uU3RhdGUucmVjb25uZWN0aW5nO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIGNsZWFyUmVjb25uZWN0VGltZW91dDogZnVuY3Rpb24gKGNvbm5lY3Rpb24pIHtcclxuICAgICAgICAgICAgaWYgKGNvbm5lY3Rpb24gJiYgY29ubmVjdGlvbi5fLnJlY29ubmVjdFRpbWVvdXQpIHtcclxuICAgICAgICAgICAgICAgIHdpbmRvdy5jbGVhclRpbWVvdXQoY29ubmVjdGlvbi5fLnJlY29ubmVjdFRpbWVvdXQpO1xyXG4gICAgICAgICAgICAgICAgZGVsZXRlIGNvbm5lY3Rpb24uXy5yZWNvbm5lY3RUaW1lb3V0O1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgcmVjb25uZWN0OiBmdW5jdGlvbiAoY29ubmVjdGlvbiwgdHJhbnNwb3J0TmFtZSkge1xyXG4gICAgICAgICAgICB2YXIgdHJhbnNwb3J0ID0gc2lnbmFsUi50cmFuc3BvcnRzW3RyYW5zcG9ydE5hbWVdLFxyXG4gICAgICAgICAgICAgICAgdGhhdCA9IHRoaXM7XHJcblxyXG4gICAgICAgICAgICAvLyBXZSBzaG91bGQgb25seSBzZXQgYSByZWNvbm5lY3RUaW1lb3V0IGlmIHdlIGFyZSBjdXJyZW50bHkgY29ubmVjdGVkXHJcbiAgICAgICAgICAgIC8vIGFuZCBhIHJlY29ubmVjdFRpbWVvdXQgaXNuJ3QgYWxyZWFkeSBzZXQuXHJcbiAgICAgICAgICAgIGlmIChpc0Nvbm5lY3RlZE9yUmVjb25uZWN0aW5nKGNvbm5lY3Rpb24pICYmICFjb25uZWN0aW9uLl8ucmVjb25uZWN0VGltZW91dCkge1xyXG5cclxuICAgICAgICAgICAgICAgIGNvbm5lY3Rpb24uXy5yZWNvbm5lY3RUaW1lb3V0ID0gd2luZG93LnNldFRpbWVvdXQoZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgICAgIHRyYW5zcG9ydC5zdG9wKGNvbm5lY3Rpb24pO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICBpZiAodGhhdC5lbnN1cmVSZWNvbm5lY3RpbmdTdGF0ZShjb25uZWN0aW9uKSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25uZWN0aW9uLmxvZyh0cmFuc3BvcnROYW1lICsgXCIgcmVjb25uZWN0aW5nXCIpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0cmFuc3BvcnQuc3RhcnQoY29ubmVjdGlvbik7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfSwgY29ubmVjdGlvbi5yZWNvbm5lY3REZWxheSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICBmb3JldmVyRnJhbWU6IHtcclxuICAgICAgICAgICAgY291bnQ6IDAsXHJcbiAgICAgICAgICAgIGNvbm5lY3Rpb25zOiB7fVxyXG4gICAgICAgIH1cclxuICAgIH07XHJcblxyXG59KHdpbmRvdy5qUXVlcnksIHdpbmRvdykpO1xyXG4vKiBqcXVlcnkuc2lnbmFsUi50cmFuc3BvcnRzLndlYlNvY2tldHMuanMgKi9cclxuLy8gQ29weXJpZ2h0IChjKSBNaWNyb3NvZnQgT3BlbiBUZWNobm9sb2dpZXMsIEluYy4gQWxsIHJpZ2h0cyByZXNlcnZlZC4gU2VlIExpY2Vuc2UubWQgaW4gdGhlIHByb2plY3Qgcm9vdCBmb3IgbGljZW5zZSBpbmZvcm1hdGlvbi5cclxuXHJcbi8qZ2xvYmFsIHdpbmRvdzpmYWxzZSAqL1xyXG4vLy8gPHJlZmVyZW5jZSBwYXRoPVwianF1ZXJ5LnNpZ25hbFIudHJhbnNwb3J0cy5jb21tb24uanNcIiAvPlxyXG5cclxuKGZ1bmN0aW9uICgkLCB3aW5kb3cpIHtcclxuICAgIFwidXNlIHN0cmljdFwiO1xyXG5cclxuICAgIHZhciBzaWduYWxSID0gJC5zaWduYWxSLFxyXG4gICAgICAgIGV2ZW50cyA9ICQuc2lnbmFsUi5ldmVudHMsXHJcbiAgICAgICAgY2hhbmdlU3RhdGUgPSAkLnNpZ25hbFIuY2hhbmdlU3RhdGUsXHJcbiAgICAgICAgdHJhbnNwb3J0TG9naWMgPSBzaWduYWxSLnRyYW5zcG9ydHMuX2xvZ2ljO1xyXG5cclxuICAgIHNpZ25hbFIudHJhbnNwb3J0cy53ZWJTb2NrZXRzID0ge1xyXG4gICAgICAgIG5hbWU6IFwid2ViU29ja2V0c1wiLFxyXG5cclxuICAgICAgICBzdXBwb3J0c0tlZXBBbGl2ZTogdHJ1ZSxcclxuXHJcbiAgICAgICAgc2VuZDogZnVuY3Rpb24gKGNvbm5lY3Rpb24sIGRhdGEpIHtcclxuICAgICAgICAgICAgY29ubmVjdGlvbi5zb2NrZXQuc2VuZChkYXRhKTtcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICBzdGFydDogZnVuY3Rpb24gKGNvbm5lY3Rpb24sIG9uU3VjY2Vzcywgb25GYWlsZWQpIHtcclxuICAgICAgICAgICAgdmFyIHVybCxcclxuICAgICAgICAgICAgICAgIG9wZW5lZCA9IGZhbHNlLFxyXG4gICAgICAgICAgICAgICAgdGhhdCA9IHRoaXMsXHJcbiAgICAgICAgICAgICAgICByZWNvbm5lY3RpbmcgPSAhb25TdWNjZXNzLFxyXG4gICAgICAgICAgICAgICAgJGNvbm5lY3Rpb24gPSAkKGNvbm5lY3Rpb24pO1xyXG5cclxuICAgICAgICAgICAgaWYgKCF3aW5kb3cuV2ViU29ja2V0KSB7XHJcbiAgICAgICAgICAgICAgICBvbkZhaWxlZCgpO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBpZiAoIWNvbm5lY3Rpb24uc29ja2V0KSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoY29ubmVjdGlvbi53ZWJTb2NrZXRTZXJ2ZXJVcmwpIHtcclxuICAgICAgICAgICAgICAgICAgICB1cmwgPSBjb25uZWN0aW9uLndlYlNvY2tldFNlcnZlclVybDtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgIHVybCA9IGNvbm5lY3Rpb24ud3NQcm90b2NvbCArIGNvbm5lY3Rpb24uaG9zdDtcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICB1cmwgKz0gdHJhbnNwb3J0TG9naWMuZ2V0VXJsKGNvbm5lY3Rpb24sIHRoaXMubmFtZSwgcmVjb25uZWN0aW5nKTtcclxuXHJcbiAgICAgICAgICAgICAgICBjb25uZWN0aW9uLmxvZyhcIkNvbm5lY3RpbmcgdG8gd2Vic29ja2V0IGVuZHBvaW50ICdcIiArIHVybCArIFwiJ1wiKTtcclxuICAgICAgICAgICAgICAgIGNvbm5lY3Rpb24uc29ja2V0ID0gbmV3IHdpbmRvdy5XZWJTb2NrZXQodXJsKTtcclxuXHJcbiAgICAgICAgICAgICAgICBjb25uZWN0aW9uLnNvY2tldC5vbm9wZW4gPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgb3BlbmVkID0gdHJ1ZTtcclxuICAgICAgICAgICAgICAgICAgICBjb25uZWN0aW9uLmxvZyhcIldlYnNvY2tldCBvcGVuZWRcIik7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIHRyYW5zcG9ydExvZ2ljLmNsZWFyUmVjb25uZWN0VGltZW91dChjb25uZWN0aW9uKTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKGNoYW5nZVN0YXRlKGNvbm5lY3Rpb24sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNpZ25hbFIuY29ubmVjdGlvblN0YXRlLnJlY29ubmVjdGluZyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc2lnbmFsUi5jb25uZWN0aW9uU3RhdGUuY29ubmVjdGVkKSA9PT0gdHJ1ZSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAkY29ubmVjdGlvbi50cmlnZ2VySGFuZGxlcihldmVudHMub25SZWNvbm5lY3QpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH07XHJcblxyXG4gICAgICAgICAgICAgICAgY29ubmVjdGlvbi5zb2NrZXQub25jbG9zZSA9IGZ1bmN0aW9uIChldmVudCkge1xyXG4gICAgICAgICAgICAgICAgICAgIC8vIE9ubHkgaGFuZGxlIGEgc29ja2V0IGNsb3NlIGlmIHRoZSBjbG9zZSBpcyBmcm9tIHRoZSBjdXJyZW50IHNvY2tldC5cclxuICAgICAgICAgICAgICAgICAgICAvLyBTb21ldGltZXMgb24gZGlzY29ubmVjdCB0aGUgc2VydmVyIHdpbGwgcHVzaCBkb3duIGFuIG9uY2xvc2UgZXZlbnRcclxuICAgICAgICAgICAgICAgICAgICAvLyB0byBhbiBleHBpcmVkIHNvY2tldC5cclxuXHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXMgPT09IGNvbm5lY3Rpb24uc29ja2V0KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICghb3BlbmVkKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAob25GYWlsZWQpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBvbkZhaWxlZCgpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSBpZiAocmVjb25uZWN0aW5nKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhhdC5yZWNvbm5lY3QoY29ubmVjdGlvbik7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSBpZiAodHlwZW9mIGV2ZW50Lndhc0NsZWFuICE9PSBcInVuZGVmaW5lZFwiICYmIGV2ZW50Lndhc0NsZWFuID09PSBmYWxzZSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gSWRlYWxseSB0aGlzIHdvdWxkIHVzZSB0aGUgd2Vic29ja2V0Lm9uZXJyb3IgaGFuZGxlciAocmF0aGVyIHRoYW4gY2hlY2tpbmcgd2FzQ2xlYW4gaW4gb25jbG9zZSkgYnV0XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBJIGZvdW5kIGluIHNvbWUgY2lyY3Vtc3RhbmNlcyBDaHJvbWUgd29uJ3QgY2FsbCBvbmVycm9yLiBUaGlzIGltcGxlbWVudGF0aW9uIHNlZW1zIHRvIHdvcmsgb24gYWxsIGJyb3dzZXJzLlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJChjb25uZWN0aW9uKS50cmlnZ2VySGFuZGxlcihldmVudHMub25FcnJvciwgW2V2ZW50LnJlYXNvbl0pO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29ubmVjdGlvbi5sb2coXCJVbmNsZWFuIGRpc2Nvbm5lY3QgZnJvbSB3ZWJzb2NrZXQuXCIgKyBldmVudC5yZWFzb24pO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29ubmVjdGlvbi5sb2coXCJXZWJzb2NrZXQgY2xvc2VkXCIpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGF0LnJlY29ubmVjdChjb25uZWN0aW9uKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9O1xyXG5cclxuICAgICAgICAgICAgICAgIGNvbm5lY3Rpb24uc29ja2V0Lm9ubWVzc2FnZSA9IGZ1bmN0aW9uIChldmVudCkge1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciBkYXRhID0gY29ubmVjdGlvbi5fcGFyc2VSZXNwb25zZShldmVudC5kYXRhKSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgJGNvbm5lY3Rpb24gPSAkKGNvbm5lY3Rpb24pO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICBpZiAoZGF0YSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBkYXRhLk0gaXMgUGVyc2lzdGVudFJlc3BvbnNlLk1lc3NhZ2VzXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICgkLmlzRW1wdHlPYmplY3QoZGF0YSkgfHwgZGF0YS5NKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0cmFuc3BvcnRMb2dpYy5wcm9jZXNzTWVzc2FnZXMoY29ubmVjdGlvbiwgZGF0YSwgb25TdWNjZXNzKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIEZvciB3ZWJzb2NrZXRzIHdlIG5lZWQgdG8gdHJpZ2dlciBvblJlY2VpdmVkXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBmb3IgY2FsbGJhY2tzIHRvIG91dGdvaW5nIGh1YiBjYWxscy5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICRjb25uZWN0aW9uLnRyaWdnZXJIYW5kbGVyKGV2ZW50cy5vblJlY2VpdmVkLCBbZGF0YV0pO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIHJlY29ubmVjdDogZnVuY3Rpb24gKGNvbm5lY3Rpb24pIHtcclxuICAgICAgICAgICAgdHJhbnNwb3J0TG9naWMucmVjb25uZWN0KGNvbm5lY3Rpb24sIHRoaXMubmFtZSk7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgbG9zdENvbm5lY3Rpb246IGZ1bmN0aW9uIChjb25uZWN0aW9uKSB7XHJcbiAgICAgICAgICAgIHRoaXMucmVjb25uZWN0KGNvbm5lY3Rpb24pO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIHN0b3A6IGZ1bmN0aW9uIChjb25uZWN0aW9uKSB7XHJcbiAgICAgICAgICAgIC8vIERvbid0IHRyaWdnZXIgYSByZWNvbm5lY3QgYWZ0ZXIgc3RvcHBpbmdcclxuICAgICAgICAgICAgdHJhbnNwb3J0TG9naWMuY2xlYXJSZWNvbm5lY3RUaW1lb3V0KGNvbm5lY3Rpb24pO1xyXG5cclxuICAgICAgICAgICAgaWYgKGNvbm5lY3Rpb24uc29ja2V0KSB7XHJcbiAgICAgICAgICAgICAgICBjb25uZWN0aW9uLmxvZyhcIkNsb3NpbmcgdGhlIFdlYnNvY2tldFwiKTtcclxuICAgICAgICAgICAgICAgIGNvbm5lY3Rpb24uc29ja2V0LmNsb3NlKCk7XHJcbiAgICAgICAgICAgICAgICBjb25uZWN0aW9uLnNvY2tldCA9IG51bGw7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICBhYm9ydDogZnVuY3Rpb24gKGNvbm5lY3Rpb24pIHtcclxuICAgICAgICB9XHJcbiAgICB9O1xyXG5cclxufSh3aW5kb3cualF1ZXJ5LCB3aW5kb3cpKTtcclxuLyoganF1ZXJ5LnNpZ25hbFIudHJhbnNwb3J0cy5zZXJ2ZXJTZW50RXZlbnRzLmpzICovXHJcbi8vIENvcHlyaWdodCAoYykgTWljcm9zb2Z0IE9wZW4gVGVjaG5vbG9naWVzLCBJbmMuIEFsbCByaWdodHMgcmVzZXJ2ZWQuIFNlZSBMaWNlbnNlLm1kIGluIHRoZSBwcm9qZWN0IHJvb3QgZm9yIGxpY2Vuc2UgaW5mb3JtYXRpb24uXHJcblxyXG4vKmdsb2JhbCB3aW5kb3c6ZmFsc2UgKi9cclxuLy8vIDxyZWZlcmVuY2UgcGF0aD1cImpxdWVyeS5zaWduYWxSLnRyYW5zcG9ydHMuY29tbW9uLmpzXCIgLz5cclxuXHJcbihmdW5jdGlvbiAoJCwgd2luZG93KSB7XHJcbiAgICBcInVzZSBzdHJpY3RcIjtcclxuXHJcbiAgICB2YXIgc2lnbmFsUiA9ICQuc2lnbmFsUixcclxuICAgICAgICBldmVudHMgPSAkLnNpZ25hbFIuZXZlbnRzLFxyXG4gICAgICAgIGNoYW5nZVN0YXRlID0gJC5zaWduYWxSLmNoYW5nZVN0YXRlLFxyXG4gICAgICAgIHRyYW5zcG9ydExvZ2ljID0gc2lnbmFsUi50cmFuc3BvcnRzLl9sb2dpYztcclxuXHJcbiAgICBzaWduYWxSLnRyYW5zcG9ydHMuc2VydmVyU2VudEV2ZW50cyA9IHtcclxuICAgICAgICBuYW1lOiBcInNlcnZlclNlbnRFdmVudHNcIixcclxuXHJcbiAgICAgICAgc3VwcG9ydHNLZWVwQWxpdmU6IHRydWUsXHJcblxyXG4gICAgICAgIHRpbWVPdXQ6IDMwMDAsXHJcblxyXG4gICAgICAgIHN0YXJ0OiBmdW5jdGlvbiAoY29ubmVjdGlvbiwgb25TdWNjZXNzLCBvbkZhaWxlZCkge1xyXG4gICAgICAgICAgICB2YXIgdGhhdCA9IHRoaXMsXHJcbiAgICAgICAgICAgICAgICBvcGVuZWQgPSBmYWxzZSxcclxuICAgICAgICAgICAgICAgICRjb25uZWN0aW9uID0gJChjb25uZWN0aW9uKSxcclxuICAgICAgICAgICAgICAgIHJlY29ubmVjdGluZyA9ICFvblN1Y2Nlc3MsXHJcbiAgICAgICAgICAgICAgICB1cmwsXHJcbiAgICAgICAgICAgICAgICByZWNvbm5lY3RUaW1lb3V0O1xyXG5cclxuICAgICAgICAgICAgaWYgKGNvbm5lY3Rpb24uZXZlbnRTb3VyY2UpIHtcclxuICAgICAgICAgICAgICAgIGNvbm5lY3Rpb24ubG9nKFwiVGhlIGNvbm5lY3Rpb24gYWxyZWFkeSBoYXMgYW4gZXZlbnQgc291cmNlLiBTdG9wcGluZyBpdC5cIik7XHJcbiAgICAgICAgICAgICAgICBjb25uZWN0aW9uLnN0b3AoKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgaWYgKCF3aW5kb3cuRXZlbnRTb3VyY2UpIHtcclxuICAgICAgICAgICAgICAgIGlmIChvbkZhaWxlZCkge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbm5lY3Rpb24ubG9nKFwiVGhpcyBicm93c2VyIGRvZXNuJ3Qgc3VwcG9ydCBTU0UuXCIpO1xyXG4gICAgICAgICAgICAgICAgICAgIG9uRmFpbGVkKCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHVybCA9IHRyYW5zcG9ydExvZ2ljLmdldFVybChjb25uZWN0aW9uLCB0aGlzLm5hbWUsIHJlY29ubmVjdGluZyk7XHJcblxyXG4gICAgICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICAgICAgY29ubmVjdGlvbi5sb2coXCJBdHRlbXB0aW5nIHRvIGNvbm5lY3QgdG8gU1NFIGVuZHBvaW50ICdcIiArIHVybCArIFwiJ1wiKTtcclxuICAgICAgICAgICAgICAgIGNvbm5lY3Rpb24uZXZlbnRTb3VyY2UgPSBuZXcgd2luZG93LkV2ZW50U291cmNlKHVybCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgY2F0Y2ggKGUpIHtcclxuICAgICAgICAgICAgICAgIGNvbm5lY3Rpb24ubG9nKFwiRXZlbnRTb3VyY2UgZmFpbGVkIHRyeWluZyB0byBjb25uZWN0IHdpdGggZXJyb3IgXCIgKyBlLk1lc3NhZ2UpO1xyXG4gICAgICAgICAgICAgICAgaWYgKG9uRmFpbGVkKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgLy8gVGhlIGNvbm5lY3Rpb24gZmFpbGVkLCBjYWxsIHRoZSBmYWlsZWQgY2FsbGJhY2tcclxuICAgICAgICAgICAgICAgICAgICBvbkZhaWxlZCgpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgJGNvbm5lY3Rpb24udHJpZ2dlckhhbmRsZXIoZXZlbnRzLm9uRXJyb3IsIFtlXSk7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKHJlY29ubmVjdGluZykge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBJZiB3ZSB3ZXJlIHJlY29ubmVjdGluZywgcmF0aGVyIHRoYW4gZG9pbmcgaW5pdGlhbCBjb25uZWN0LCB0aGVuIHRyeSByZWNvbm5lY3QgYWdhaW5cclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhhdC5yZWNvbm5lY3QoY29ubmVjdGlvbik7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBpZiAocmVjb25uZWN0aW5nKSB7XHJcbiAgICAgICAgICAgICAgICByZWNvbm5lY3RUaW1lb3V0ID0gd2luZG93LnNldFRpbWVvdXQoZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChvcGVuZWQgPT09IGZhbHNlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIElmIHdlJ3JlIHJlY29ubmVjdGluZyBhbmQgdGhlIGV2ZW50IHNvdXJjZSBpcyBhdHRlbXB0aW5nIHRvIGNvbm5lY3QsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIGRvbid0IGtlZXAgcmV0cnlpbmcuIFRoaXMgY2F1c2VzIGR1cGxpY2F0ZSBjb25uZWN0aW9ucyB0byBzcGF3bi5cclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGNvbm5lY3Rpb24uZXZlbnRTb3VyY2UucmVhZHlTdGF0ZSAhPT0gd2luZG93LkV2ZW50U291cmNlLkNPTk5FQ1RJTkcgJiZcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbm5lY3Rpb24uZXZlbnRTb3VyY2UucmVhZHlTdGF0ZSAhPT0gd2luZG93LkV2ZW50U291cmNlLk9QRU4pIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIElmIHdlIHdlcmUgcmVjb25uZWN0aW5nLCByYXRoZXIgdGhhbiBkb2luZyBpbml0aWFsIGNvbm5lY3QsIHRoZW4gdHJ5IHJlY29ubmVjdCBhZ2FpblxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhhdC5yZWNvbm5lY3QoY29ubmVjdGlvbik7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgdGhhdC50aW1lT3V0KTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgY29ubmVjdGlvbi5ldmVudFNvdXJjZS5hZGRFdmVudExpc3RlbmVyKFwib3BlblwiLCBmdW5jdGlvbiAoZSkge1xyXG4gICAgICAgICAgICAgICAgY29ubmVjdGlvbi5sb2coXCJFdmVudFNvdXJjZSBjb25uZWN0ZWRcIik7XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKHJlY29ubmVjdFRpbWVvdXQpIHtcclxuICAgICAgICAgICAgICAgICAgICB3aW5kb3cuY2xlYXJUaW1lb3V0KHJlY29ubmVjdFRpbWVvdXQpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIHRyYW5zcG9ydExvZ2ljLmNsZWFyUmVjb25uZWN0VGltZW91dChjb25uZWN0aW9uKTtcclxuXHJcbiAgICAgICAgICAgICAgICBpZiAob3BlbmVkID09PSBmYWxzZSkge1xyXG4gICAgICAgICAgICAgICAgICAgIG9wZW5lZCA9IHRydWU7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGlmIChjaGFuZ2VTdGF0ZShjb25uZWN0aW9uLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNpZ25hbFIuY29ubmVjdGlvblN0YXRlLnJlY29ubmVjdGluZyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzaWduYWxSLmNvbm5lY3Rpb25TdGF0ZS5jb25uZWN0ZWQpID09PSB0cnVlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICRjb25uZWN0aW9uLnRyaWdnZXJIYW5kbGVyKGV2ZW50cy5vblJlY29ubmVjdCk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9LCBmYWxzZSk7XHJcblxyXG4gICAgICAgICAgICBjb25uZWN0aW9uLmV2ZW50U291cmNlLmFkZEV2ZW50TGlzdGVuZXIoXCJtZXNzYWdlXCIsIGZ1bmN0aW9uIChlKSB7XHJcbiAgICAgICAgICAgICAgICAvLyBwcm9jZXNzIG1lc3NhZ2VzXHJcbiAgICAgICAgICAgICAgICBpZiAoZS5kYXRhID09PSBcImluaXRpYWxpemVkXCIpIHtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgdHJhbnNwb3J0TG9naWMucHJvY2Vzc01lc3NhZ2VzKGNvbm5lY3Rpb24sIGNvbm5lY3Rpb24uX3BhcnNlUmVzcG9uc2UoZS5kYXRhKSwgb25TdWNjZXNzKTtcclxuICAgICAgICAgICAgfSwgZmFsc2UpO1xyXG5cclxuICAgICAgICAgICAgY29ubmVjdGlvbi5ldmVudFNvdXJjZS5hZGRFdmVudExpc3RlbmVyKFwiZXJyb3JcIiwgZnVuY3Rpb24gKGUpIHtcclxuICAgICAgICAgICAgICAgIC8vIE9ubHkgaGFuZGxlIGFuIGVycm9yIGlmIHRoZSBlcnJvciBpcyBmcm9tIHRoZSBjdXJyZW50IEV2ZW50IFNvdXJjZS5cclxuICAgICAgICAgICAgICAgIC8vIFNvbWV0aW1lcyBvbiBkaXNjb25uZWN0IHRoZSBzZXJ2ZXIgd2lsbCBwdXNoIGRvd24gYW4gZXJyb3IgZXZlbnRcclxuICAgICAgICAgICAgICAgIC8vIHRvIGFuIGV4cGlyZWQgRXZlbnQgU291cmNlLlxyXG4gICAgICAgICAgICAgICAgaWYgKHRoaXMgPT09IGNvbm5lY3Rpb24uZXZlbnRTb3VyY2UpIHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoIW9wZW5lZCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAob25GYWlsZWQpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9uRmFpbGVkKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGNvbm5lY3Rpb24ubG9nKFwiRXZlbnRTb3VyY2UgcmVhZHlTdGF0ZTogXCIgKyBjb25uZWN0aW9uLmV2ZW50U291cmNlLnJlYWR5U3RhdGUpO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICBpZiAoZS5ldmVudFBoYXNlID09PSB3aW5kb3cuRXZlbnRTb3VyY2UuQ0xPU0VEKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIFdlIGRvbid0IHVzZSB0aGUgRXZlbnRTb3VyY2UncyBuYXRpdmUgcmVjb25uZWN0IGZ1bmN0aW9uIGFzIGl0XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIGRvZXNuJ3QgYWxsb3cgdXMgdG8gY2hhbmdlIHRoZSBVUkwgd2hlbiByZWNvbm5lY3RpbmcuIFdlIG5lZWRcclxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gdG8gY2hhbmdlIHRoZSBVUkwgdG8gbm90IGluY2x1ZGUgdGhlIC9jb25uZWN0IHN1ZmZpeCwgYW5kIHBhc3NcclxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gdGhlIGxhc3QgbWVzc2FnZSBpZCB3ZSByZWNlaXZlZC5cclxuICAgICAgICAgICAgICAgICAgICAgICAgY29ubmVjdGlvbi5sb2coXCJFdmVudFNvdXJjZSByZWNvbm5lY3RpbmcgZHVlIHRvIHRoZSBzZXJ2ZXIgY29ubmVjdGlvbiBlbmRpbmdcIik7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoYXQucmVjb25uZWN0KGNvbm5lY3Rpb24pO1xyXG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIGNvbm5lY3Rpb24gZXJyb3JcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29ubmVjdGlvbi5sb2coXCJFdmVudFNvdXJjZSBlcnJvclwiKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgJGNvbm5lY3Rpb24udHJpZ2dlckhhbmRsZXIoZXZlbnRzLm9uRXJyb3IpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSwgZmFsc2UpO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIHJlY29ubmVjdDogZnVuY3Rpb24gKGNvbm5lY3Rpb24pIHtcclxuICAgICAgICAgICAgdHJhbnNwb3J0TG9naWMucmVjb25uZWN0KGNvbm5lY3Rpb24sIHRoaXMubmFtZSk7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgbG9zdENvbm5lY3Rpb246IGZ1bmN0aW9uIChjb25uZWN0aW9uKSB7XHJcbiAgICAgICAgICAgIHRoaXMucmVjb25uZWN0KGNvbm5lY3Rpb24pO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIHNlbmQ6IGZ1bmN0aW9uIChjb25uZWN0aW9uLCBkYXRhKSB7XHJcbiAgICAgICAgICAgIHRyYW5zcG9ydExvZ2ljLmFqYXhTZW5kKGNvbm5lY3Rpb24sIGRhdGEpO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIHN0b3A6IGZ1bmN0aW9uIChjb25uZWN0aW9uKSB7XHJcbiAgICAgICAgICAgIC8vIERvbid0IHRyaWdnZXIgYSByZWNvbm5lY3QgYWZ0ZXIgc3RvcHBpbmdcclxuICAgICAgICAgICAgdHJhbnNwb3J0TG9naWMuY2xlYXJSZWNvbm5lY3RUaW1lb3V0KGNvbm5lY3Rpb24pO1xyXG5cclxuICAgICAgICAgICAgaWYgKGNvbm5lY3Rpb24gJiYgY29ubmVjdGlvbi5ldmVudFNvdXJjZSkge1xyXG4gICAgICAgICAgICAgICAgY29ubmVjdGlvbi5sb2coXCJFdmVudFNvdXJjZSBjYWxsaW5nIGNsb3NlKClcIik7XHJcbiAgICAgICAgICAgICAgICBjb25uZWN0aW9uLmV2ZW50U291cmNlLmNsb3NlKCk7XHJcbiAgICAgICAgICAgICAgICBjb25uZWN0aW9uLmV2ZW50U291cmNlID0gbnVsbDtcclxuICAgICAgICAgICAgICAgIGRlbGV0ZSBjb25uZWN0aW9uLmV2ZW50U291cmNlO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgYWJvcnQ6IGZ1bmN0aW9uIChjb25uZWN0aW9uLCBhc3luYykge1xyXG4gICAgICAgICAgICB0cmFuc3BvcnRMb2dpYy5hamF4QWJvcnQoY29ubmVjdGlvbiwgYXN5bmMpO1xyXG4gICAgICAgIH1cclxuICAgIH07XHJcblxyXG59KHdpbmRvdy5qUXVlcnksIHdpbmRvdykpO1xyXG4vKiBqcXVlcnkuc2lnbmFsUi50cmFuc3BvcnRzLmZvcmV2ZXJGcmFtZS5qcyAqL1xyXG4vLyBDb3B5cmlnaHQgKGMpIE1pY3Jvc29mdCBPcGVuIFRlY2hub2xvZ2llcywgSW5jLiBBbGwgcmlnaHRzIHJlc2VydmVkLiBTZWUgTGljZW5zZS5tZCBpbiB0aGUgcHJvamVjdCByb290IGZvciBsaWNlbnNlIGluZm9ybWF0aW9uLlxyXG5cclxuLypnbG9iYWwgd2luZG93OmZhbHNlICovXHJcbi8vLyA8cmVmZXJlbmNlIHBhdGg9XCJqcXVlcnkuc2lnbmFsUi50cmFuc3BvcnRzLmNvbW1vbi5qc1wiIC8+XHJcblxyXG4oZnVuY3Rpb24gKCQsIHdpbmRvdykge1xyXG4gICAgXCJ1c2Ugc3RyaWN0XCI7XHJcblxyXG4gICAgdmFyIHNpZ25hbFIgPSAkLnNpZ25hbFIsXHJcbiAgICAgICAgZXZlbnRzID0gJC5zaWduYWxSLmV2ZW50cyxcclxuICAgICAgICBjaGFuZ2VTdGF0ZSA9ICQuc2lnbmFsUi5jaGFuZ2VTdGF0ZSxcclxuICAgICAgICB0cmFuc3BvcnRMb2dpYyA9IHNpZ25hbFIudHJhbnNwb3J0cy5fbG9naWMsXHJcbiAgICAgICAgLy8gVXNlZCB0byBwcmV2ZW50IGluZmluaXRlIGxvYWRpbmcgaWNvbiBzcGlucyBpbiBvbGRlciB2ZXJzaW9ucyBvZiBpZVxyXG4gICAgICAgIC8vIFdlIGJ1aWxkIHRoaXMgb2JqZWN0IGluc2lkZSBhIGNsb3N1cmUgc28gd2UgZG9uJ3QgcG9sbHV0ZSB0aGUgcmVzdCBvZiAgIFxyXG4gICAgICAgIC8vIHRoZSBmb3JldmVyRnJhbWUgdHJhbnNwb3J0IHdpdGggdW5uZWNlc3NhcnkgZnVuY3Rpb25zL3V0aWxpdGllcy5cclxuICAgICAgICBsb2FkUHJldmVudGVyID0gKGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgdmFyIGxvYWRpbmdGaXhJbnRlcnZhbElkID0gbnVsbCxcclxuICAgICAgICAgICAgICAgIGxvYWRpbmdGaXhJbnRlcnZhbCA9IDEwMDAsXHJcbiAgICAgICAgICAgICAgICBhdHRhY2hlZFRvID0gMDtcclxuXHJcbiAgICAgICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICAgICAgICBwcmV2ZW50OiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgLy8gUHJldmVudCBhZGRpdGlvbmFsIGlmcmFtZSByZW1vdmFsIHByb2NlZHVyZXMgZnJvbSBuZXdlciBicm93c2Vyc1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChzaWduYWxSLl8uaWVWZXJzaW9uIDw9IDgpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gV2Ugb25seSBldmVyIHdhbnQgdG8gc2V0IHRoZSBpbnRlcnZhbCBvbmUgdGltZSwgc28gb24gdGhlIGZpcnN0IGF0dGFjaGVkVG9cclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGF0dGFjaGVkVG8gPT09IDApIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIENyZWF0ZSBhbmQgZGVzdHJveSBpZnJhbWUgZXZlcnkgMyBzZWNvbmRzIHRvIHByZXZlbnQgbG9hZGluZyBpY29uLCBzdXBlciBoYWNreVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbG9hZGluZ0ZpeEludGVydmFsSWQgPSB3aW5kb3cuc2V0SW50ZXJ2YWwoZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciB0ZW1wRnJhbWUgPSAkKFwiPGlmcmFtZSBzdHlsZT0ncG9zaXRpb246YWJzb2x1dGU7dG9wOjA7bGVmdDowO3dpZHRoOjA7aGVpZ2h0OjA7dmlzaWJpbGl0eTpoaWRkZW47JyBzcmM9Jyc+PC9pZnJhbWU+XCIpO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAkKFwiYm9keVwiKS5hcHBlbmQodGVtcEZyYW1lKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0ZW1wRnJhbWUucmVtb3ZlKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGVtcEZyYW1lID0gbnVsbDtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0sIGxvYWRpbmdGaXhJbnRlcnZhbCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGF0dGFjaGVkVG8rKztcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgY2FuY2VsOiBmdW5jdGlvbiAoKSB7ICAgICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgICAgICAgIC8vIE9ubHkgY2xlYXIgdGhlIGludGVydmFsIGlmIHRoZXJlJ3Mgb25seSBvbmUgbW9yZSBvYmplY3QgdGhhdCB0aGUgbG9hZFByZXZlbnRlciBpcyBhdHRhY2hlZFRvXHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKGF0dGFjaGVkVG8gPT09IDEpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgd2luZG93LmNsZWFySW50ZXJ2YWwobG9hZGluZ0ZpeEludGVydmFsSWQpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKGF0dGFjaGVkVG8gPiAwKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGF0dGFjaGVkVG8tLTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgfSkoKTtcclxuXHJcbiAgICBzaWduYWxSLnRyYW5zcG9ydHMuZm9yZXZlckZyYW1lID0ge1xyXG4gICAgICAgIG5hbWU6IFwiZm9yZXZlckZyYW1lXCIsXHJcblxyXG4gICAgICAgIHN1cHBvcnRzS2VlcEFsaXZlOiB0cnVlLFxyXG5cclxuICAgICAgICBzdGFydDogZnVuY3Rpb24gKGNvbm5lY3Rpb24sIG9uU3VjY2Vzcywgb25GYWlsZWQpIHtcclxuICAgICAgICAgICAgdmFyIHRoYXQgPSB0aGlzLFxyXG4gICAgICAgICAgICAgICAgZnJhbWVJZCA9ICh0cmFuc3BvcnRMb2dpYy5mb3JldmVyRnJhbWUuY291bnQgKz0gMSksXHJcbiAgICAgICAgICAgICAgICB1cmwsXHJcbiAgICAgICAgICAgICAgICBmcmFtZSA9ICQoXCI8aWZyYW1lIGRhdGEtc2lnbmFsci1jb25uZWN0aW9uLWlkPSdcIiArIGNvbm5lY3Rpb24uaWQgKyBcIicgc3R5bGU9J3Bvc2l0aW9uOmFic29sdXRlO3RvcDowO2xlZnQ6MDt3aWR0aDowO2hlaWdodDowO3Zpc2liaWxpdHk6aGlkZGVuOycgc3JjPScnPjwvaWZyYW1lPlwiKTtcclxuXHJcbiAgICAgICAgICAgIGlmICh3aW5kb3cuRXZlbnRTb3VyY2UpIHtcclxuICAgICAgICAgICAgICAgIC8vIElmIHRoZSBicm93c2VyIHN1cHBvcnRzIFNTRSwgZG9uJ3QgdXNlIEZvcmV2ZXIgRnJhbWVcclxuICAgICAgICAgICAgICAgIGlmIChvbkZhaWxlZCkge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbm5lY3Rpb24ubG9nKFwiVGhpcyBicm93c2VyIHN1cHBvcnRzIFNTRSwgc2tpcHBpbmcgRm9yZXZlciBGcmFtZS5cIik7XHJcbiAgICAgICAgICAgICAgICAgICAgb25GYWlsZWQoKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgLy8gU3RhcnQgcHJldmVudGluZyBsb2FkaW5nIGljb25cclxuICAgICAgICAgICAgLy8gVGhpcyB3aWxsIG9ubHkgcGVyZm9ybSB3b3JrIGlmIHRoZSBsb2FkUHJldmVudGVyIGlzIG5vdCBhdHRhY2hlZCB0byBhbm90aGVyIGNvbm5lY3Rpb24uXHJcbiAgICAgICAgICAgIGxvYWRQcmV2ZW50ZXIucHJldmVudCgpO1xyXG5cclxuICAgICAgICAgICAgLy8gQnVpbGQgdGhlIHVybFxyXG4gICAgICAgICAgICB1cmwgPSB0cmFuc3BvcnRMb2dpYy5nZXRVcmwoY29ubmVjdGlvbiwgdGhpcy5uYW1lKTtcclxuICAgICAgICAgICAgdXJsICs9IFwiJmZyYW1lSWQ9XCIgKyBmcmFtZUlkO1xyXG5cclxuICAgICAgICAgICAgLy8gU2V0IGJvZHkgcHJpb3IgdG8gc2V0dGluZyBVUkwgdG8gYXZvaWQgY2FjaGluZyBpc3N1ZXMuXHJcbiAgICAgICAgICAgICQoXCJib2R5XCIpLmFwcGVuZChmcmFtZSk7XHJcblxyXG4gICAgICAgICAgICBmcmFtZS5wcm9wKFwic3JjXCIsIHVybCk7XHJcbiAgICAgICAgICAgIHRyYW5zcG9ydExvZ2ljLmZvcmV2ZXJGcmFtZS5jb25uZWN0aW9uc1tmcmFtZUlkXSA9IGNvbm5lY3Rpb247XHJcblxyXG4gICAgICAgICAgICBjb25uZWN0aW9uLmxvZyhcIkJpbmRpbmcgdG8gaWZyYW1lJ3MgcmVhZHlzdGF0ZWNoYW5nZSBldmVudC5cIik7XHJcbiAgICAgICAgICAgIGZyYW1lLmJpbmQoXCJyZWFkeXN0YXRlY2hhbmdlXCIsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgIGlmICgkLmluQXJyYXkodGhpcy5yZWFkeVN0YXRlLCBbXCJsb2FkZWRcIiwgXCJjb21wbGV0ZVwiXSkgPj0gMCkge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbm5lY3Rpb24ubG9nKFwiRm9yZXZlciBmcmFtZSBpZnJhbWUgcmVhZHlTdGF0ZSBjaGFuZ2VkIHRvIFwiICsgdGhpcy5yZWFkeVN0YXRlICsgXCIsIHJlY29ubmVjdGluZ1wiKTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgdGhhdC5yZWNvbm5lY3QoY29ubmVjdGlvbik7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgICAgY29ubmVjdGlvbi5mcmFtZSA9IGZyYW1lWzBdO1xyXG4gICAgICAgICAgICBjb25uZWN0aW9uLmZyYW1lSWQgPSBmcmFtZUlkO1xyXG5cclxuICAgICAgICAgICAgaWYgKG9uU3VjY2Vzcykge1xyXG4gICAgICAgICAgICAgICAgY29ubmVjdGlvbi5vblN1Y2Nlc3MgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgb25TdWNjZXNzKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgZGVsZXRlIGNvbm5lY3Rpb24ub25TdWNjZXNzO1xyXG4gICAgICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIHJlY29ubmVjdDogZnVuY3Rpb24gKGNvbm5lY3Rpb24pIHtcclxuICAgICAgICAgICAgdmFyIHRoYXQgPSB0aGlzO1xyXG4gICAgICAgICAgICB3aW5kb3cuc2V0VGltZW91dChmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoY29ubmVjdGlvbi5mcmFtZSAmJiB0cmFuc3BvcnRMb2dpYy5lbnN1cmVSZWNvbm5lY3RpbmdTdGF0ZShjb25uZWN0aW9uKSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciBmcmFtZSA9IGNvbm5lY3Rpb24uZnJhbWUsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHNyYyA9IHRyYW5zcG9ydExvZ2ljLmdldFVybChjb25uZWN0aW9uLCB0aGF0Lm5hbWUsIHRydWUpICsgXCImZnJhbWVJZD1cIiArIGNvbm5lY3Rpb24uZnJhbWVJZDtcclxuICAgICAgICAgICAgICAgICAgICBjb25uZWN0aW9uLmxvZyhcIlVwZGF0aW5nIGlmcmFtZSBzcmMgdG8gJ1wiICsgc3JjICsgXCInLlwiKTtcclxuICAgICAgICAgICAgICAgICAgICBmcmFtZS5zcmMgPSBzcmM7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0sIGNvbm5lY3Rpb24ucmVjb25uZWN0RGVsYXkpO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIGxvc3RDb25uZWN0aW9uOiBmdW5jdGlvbiAoY29ubmVjdGlvbikge1xyXG4gICAgICAgICAgICB0aGlzLnJlY29ubmVjdChjb25uZWN0aW9uKTtcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICBzZW5kOiBmdW5jdGlvbiAoY29ubmVjdGlvbiwgZGF0YSkge1xyXG4gICAgICAgICAgICB0cmFuc3BvcnRMb2dpYy5hamF4U2VuZChjb25uZWN0aW9uLCBkYXRhKTtcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICByZWNlaXZlOiBmdW5jdGlvbiAoY29ubmVjdGlvbiwgZGF0YSkge1xyXG4gICAgICAgICAgICB2YXIgY3c7XHJcblxyXG4gICAgICAgICAgICB0cmFuc3BvcnRMb2dpYy5wcm9jZXNzTWVzc2FnZXMoY29ubmVjdGlvbiwgZGF0YSwgY29ubmVjdGlvbi5vblN1Y2Nlc3MpO1xyXG4gICAgICAgICAgICAvLyBEZWxldGUgdGhlIHNjcmlwdCAmIGRpdiBlbGVtZW50c1xyXG4gICAgICAgICAgICBjb25uZWN0aW9uLmZyYW1lTWVzc2FnZUNvdW50ID0gKGNvbm5lY3Rpb24uZnJhbWVNZXNzYWdlQ291bnQgfHwgMCkgKyAxO1xyXG4gICAgICAgICAgICBpZiAoY29ubmVjdGlvbi5mcmFtZU1lc3NhZ2VDb3VudCA+IDUwKSB7XHJcbiAgICAgICAgICAgICAgICBjb25uZWN0aW9uLmZyYW1lTWVzc2FnZUNvdW50ID0gMDtcclxuICAgICAgICAgICAgICAgIGN3ID0gY29ubmVjdGlvbi5mcmFtZS5jb250ZW50V2luZG93IHx8IGNvbm5lY3Rpb24uZnJhbWUuY29udGVudERvY3VtZW50O1xyXG4gICAgICAgICAgICAgICAgaWYgKGN3ICYmIGN3LmRvY3VtZW50KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgJChcImJvZHlcIiwgY3cuZG9jdW1lbnQpLmVtcHR5KCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICBzdG9wOiBmdW5jdGlvbiAoY29ubmVjdGlvbikge1xyXG4gICAgICAgICAgICB2YXIgY3cgPSBudWxsO1xyXG5cclxuICAgICAgICAgICAgLy8gU3RvcCBhdHRlbXB0aW5nIHRvIHByZXZlbnQgbG9hZGluZyBpY29uXHJcbiAgICAgICAgICAgIGxvYWRQcmV2ZW50ZXIuY2FuY2VsKCk7XHJcblxyXG4gICAgICAgICAgICBpZiAoY29ubmVjdGlvbi5mcmFtZSkge1xyXG4gICAgICAgICAgICAgICAgaWYgKGNvbm5lY3Rpb24uZnJhbWUuc3RvcCkge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbm5lY3Rpb24uZnJhbWUuc3RvcCgpO1xyXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjdyA9IGNvbm5lY3Rpb24uZnJhbWUuY29udGVudFdpbmRvdyB8fCBjb25uZWN0aW9uLmZyYW1lLmNvbnRlbnREb2N1bWVudDtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGN3LmRvY3VtZW50ICYmIGN3LmRvY3VtZW50LmV4ZWNDb21tYW5kKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjdy5kb2N1bWVudC5leGVjQ29tbWFuZChcIlN0b3BcIik7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgY2F0Y2ggKGUpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29ubmVjdGlvbi5sb2coXCJTaWduYWxSOiBFcnJvciBvY2N1cmVkIHdoZW4gc3RvcHBpbmcgZm9yZXZlckZyYW1lIHRyYW5zcG9ydC4gTWVzc2FnZSA9IFwiICsgZS5tZXNzYWdlKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAkKGNvbm5lY3Rpb24uZnJhbWUpLnJlbW92ZSgpO1xyXG4gICAgICAgICAgICAgICAgZGVsZXRlIHRyYW5zcG9ydExvZ2ljLmZvcmV2ZXJGcmFtZS5jb25uZWN0aW9uc1tjb25uZWN0aW9uLmZyYW1lSWRdO1xyXG4gICAgICAgICAgICAgICAgY29ubmVjdGlvbi5mcmFtZSA9IG51bGw7XHJcbiAgICAgICAgICAgICAgICBjb25uZWN0aW9uLmZyYW1lSWQgPSBudWxsO1xyXG4gICAgICAgICAgICAgICAgZGVsZXRlIGNvbm5lY3Rpb24uZnJhbWU7XHJcbiAgICAgICAgICAgICAgICBkZWxldGUgY29ubmVjdGlvbi5mcmFtZUlkO1xyXG4gICAgICAgICAgICAgICAgZGVsZXRlIGNvbm5lY3Rpb24ub25TdWNjZXNzO1xyXG4gICAgICAgICAgICAgICAgY29ubmVjdGlvbi5sb2coXCJTdG9wcGluZyBmb3JldmVyIGZyYW1lXCIpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgYWJvcnQ6IGZ1bmN0aW9uIChjb25uZWN0aW9uLCBhc3luYykge1xyXG4gICAgICAgICAgICB0cmFuc3BvcnRMb2dpYy5hamF4QWJvcnQoY29ubmVjdGlvbiwgYXN5bmMpO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIGdldENvbm5lY3Rpb246IGZ1bmN0aW9uIChpZCkge1xyXG4gICAgICAgICAgICByZXR1cm4gdHJhbnNwb3J0TG9naWMuZm9yZXZlckZyYW1lLmNvbm5lY3Rpb25zW2lkXTtcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICBzdGFydGVkOiBmdW5jdGlvbiAoY29ubmVjdGlvbikge1xyXG4gICAgICAgICAgICBpZiAoY2hhbmdlU3RhdGUoY29ubmVjdGlvbixcclxuICAgICAgICAgICAgICAgIHNpZ25hbFIuY29ubmVjdGlvblN0YXRlLnJlY29ubmVjdGluZyxcclxuICAgICAgICAgICAgICAgIHNpZ25hbFIuY29ubmVjdGlvblN0YXRlLmNvbm5lY3RlZCkgPT09IHRydWUpIHtcclxuICAgICAgICAgICAgICAgIC8vIElmIHRoZXJlJ3Mgbm8gb25TdWNjZXNzIGhhbmRsZXIgd2UgYXNzdW1lIHRoaXMgaXMgYSByZWNvbm5lY3RcclxuICAgICAgICAgICAgICAgICQoY29ubmVjdGlvbikudHJpZ2dlckhhbmRsZXIoZXZlbnRzLm9uUmVjb25uZWN0KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH07XHJcblxyXG59KHdpbmRvdy5qUXVlcnksIHdpbmRvdykpO1xyXG4vKiBqcXVlcnkuc2lnbmFsUi50cmFuc3BvcnRzLmxvbmdQb2xsaW5nLmpzICovXHJcbi8vIENvcHlyaWdodCAoYykgTWljcm9zb2Z0IE9wZW4gVGVjaG5vbG9naWVzLCBJbmMuIEFsbCByaWdodHMgcmVzZXJ2ZWQuIFNlZSBMaWNlbnNlLm1kIGluIHRoZSBwcm9qZWN0IHJvb3QgZm9yIGxpY2Vuc2UgaW5mb3JtYXRpb24uXHJcblxyXG4vKmdsb2JhbCB3aW5kb3c6ZmFsc2UgKi9cclxuLy8vIDxyZWZlcmVuY2UgcGF0aD1cImpxdWVyeS5zaWduYWxSLnRyYW5zcG9ydHMuY29tbW9uLmpzXCIgLz5cclxuXHJcbihmdW5jdGlvbiAoJCwgd2luZG93KSB7XHJcbiAgICBcInVzZSBzdHJpY3RcIjtcclxuXHJcbiAgICB2YXIgc2lnbmFsUiA9ICQuc2lnbmFsUixcclxuICAgICAgICBldmVudHMgPSAkLnNpZ25hbFIuZXZlbnRzLFxyXG4gICAgICAgIGNoYW5nZVN0YXRlID0gJC5zaWduYWxSLmNoYW5nZVN0YXRlLFxyXG4gICAgICAgIGlzRGlzY29ubmVjdGluZyA9ICQuc2lnbmFsUi5pc0Rpc2Nvbm5lY3RpbmcsXHJcbiAgICAgICAgdHJhbnNwb3J0TG9naWMgPSBzaWduYWxSLnRyYW5zcG9ydHMuX2xvZ2ljO1xyXG5cclxuICAgIHNpZ25hbFIudHJhbnNwb3J0cy5sb25nUG9sbGluZyA9IHtcclxuICAgICAgICBuYW1lOiBcImxvbmdQb2xsaW5nXCIsXHJcblxyXG4gICAgICAgIHN1cHBvcnRzS2VlcEFsaXZlOiBmYWxzZSxcclxuXHJcbiAgICAgICAgcmVjb25uZWN0RGVsYXk6IDMwMDAsXHJcblxyXG4gICAgICAgIHN0YXJ0OiBmdW5jdGlvbiAoY29ubmVjdGlvbiwgb25TdWNjZXNzLCBvbkZhaWxlZCkge1xyXG4gICAgICAgICAgICAvLy8gPHN1bW1hcnk+U3RhcnRzIHRoZSBsb25nIHBvbGxpbmcgY29ubmVjdGlvbjwvc3VtbWFyeT5cclxuICAgICAgICAgICAgLy8vIDxwYXJhbSBuYW1lPVwiY29ubmVjdGlvblwiIHR5cGU9XCJzaWduYWxSXCI+VGhlIFNpZ25hbFIgY29ubmVjdGlvbiB0byBzdGFydDwvcGFyYW0+XHJcbiAgICAgICAgICAgIHZhciB0aGF0ID0gdGhpcyxcclxuICAgICAgICAgICAgICAgIGZpcmVDb25uZWN0ID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgICAgIGZpcmVDb25uZWN0ID0gJC5ub29wO1xyXG4gICAgICAgICAgICAgICAgICAgIG9uU3VjY2VzcygpO1xyXG4gICAgICAgICAgICAgICAgICAgIC8vIFJlc2V0IG9uRmFpbGVkIHRvIG51bGwgYmVjYXVzZSBpdCBzaG91bGRuJ3QgYmUgY2FsbGVkIGFnYWluXHJcbiAgICAgICAgICAgICAgICAgICAgb25GYWlsZWQgPSBudWxsO1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbm5lY3Rpb24ubG9nKFwiTG9uZ1BvbGxpbmcgY29ubmVjdGVkXCIpO1xyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgIHRyeUZhaWxDb25uZWN0ID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChvbkZhaWxlZCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBvbkZhaWxlZCgpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBvbkZhaWxlZCA9IG51bGw7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbm5lY3Rpb24ubG9nKFwiTG9uZ1BvbGxpbmcgZmFpbGVkIHRvIGNvbm5lY3QuXCIpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgIHJlY29ubmVjdEVycm9ycyA9IDAsXHJcbiAgICAgICAgICAgICAgICByZWNvbm5lY3RUaW1lb3V0SWQgPSBudWxsLFxyXG4gICAgICAgICAgICAgICAgZmlyZVJlY29ubmVjdGVkID0gZnVuY3Rpb24gKGluc3RhbmNlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgd2luZG93LmNsZWFyVGltZW91dChyZWNvbm5lY3RUaW1lb3V0SWQpO1xyXG4gICAgICAgICAgICAgICAgICAgIHJlY29ubmVjdFRpbWVvdXRJZCA9IG51bGw7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGlmIChjaGFuZ2VTdGF0ZShjb25uZWN0aW9uLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzaWduYWxSLmNvbm5lY3Rpb25TdGF0ZS5yZWNvbm5lY3RpbmcsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNpZ25hbFIuY29ubmVjdGlvblN0YXRlLmNvbm5lY3RlZCkgPT09IHRydWUpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gU3VjY2Vzc2Z1bGx5IHJlY29ubmVjdGVkIVxyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25uZWN0aW9uLmxvZyhcIlJhaXNpbmcgdGhlIHJlY29ubmVjdCBldmVudFwiKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgJChpbnN0YW5jZSkudHJpZ2dlckhhbmRsZXIoZXZlbnRzLm9uUmVjb25uZWN0KTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgLy8gMSBob3VyXHJcbiAgICAgICAgICAgICAgICBtYXhGaXJlUmVjb25uZWN0ZWRUaW1lb3V0ID0gMzYwMDAwMDtcclxuXHJcbiAgICAgICAgICAgIGlmIChjb25uZWN0aW9uLnBvbGxYaHIpIHtcclxuICAgICAgICAgICAgICAgIGNvbm5lY3Rpb24ubG9nKFwiUG9sbGluZyB4aHIgcmVxdWVzdHMgYWxyZWFkeSBleGlzdHMsIGFib3J0aW5nLlwiKTtcclxuICAgICAgICAgICAgICAgIGNvbm5lY3Rpb24uc3RvcCgpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBjb25uZWN0aW9uLm1lc3NhZ2VJZCA9IG51bGw7XHJcblxyXG4gICAgICAgICAgICB3aW5kb3cuc2V0VGltZW91dChmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICAoZnVuY3Rpb24gcG9sbChpbnN0YW5jZSwgcmFpc2VSZWNvbm5lY3QpIHtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgbWVzc2FnZUlkID0gaW5zdGFuY2UubWVzc2FnZUlkLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25uZWN0ID0gKG1lc3NhZ2VJZCA9PT0gbnVsbCksXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlY29ubmVjdGluZyA9ICFjb25uZWN0LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBwb2xsaW5nID0gIXJhaXNlUmVjb25uZWN0LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICB1cmwgPSB0cmFuc3BvcnRMb2dpYy5nZXRVcmwoaW5zdGFuY2UsIHRoYXQubmFtZSwgcmVjb25uZWN0aW5nLCBwb2xsaW5nKTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgLy8gSWYgd2UndmUgZGlzY29ubmVjdGVkIGR1cmluZyB0aGUgdGltZSB3ZSd2ZSB0cmllZCB0byByZS1pbnN0YW50aWF0ZSB0aGUgcG9sbCB0aGVuIHN0b3AuXHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKGlzRGlzY29ubmVjdGluZyhpbnN0YW5jZSkgPT09IHRydWUpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAgICAgY29ubmVjdGlvbi5sb2coXCJBdHRlbXB0aW5nIHRvIGNvbm5lY3QgdG8gJ1wiICsgdXJsICsgXCInIHVzaW5nIGxvbmdQb2xsaW5nLlwiKTtcclxuICAgICAgICAgICAgICAgICAgICBpbnN0YW5jZS5wb2xsWGhyID0gJC5hamF4KHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdXJsOiB1cmwsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGdsb2JhbDogZmFsc2UsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhY2hlOiBmYWxzZSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogXCJHRVRcIixcclxuICAgICAgICAgICAgICAgICAgICAgICAgZGF0YVR5cGU6IGNvbm5lY3Rpb24uYWpheERhdGFUeXBlLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb250ZW50VHlwZTogY29ubmVjdGlvbi5jb250ZW50VHlwZSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN1Y2Nlc3M6IGZ1bmN0aW9uIChyZXN1bHQpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgbWluRGF0YSA9IGNvbm5lY3Rpb24uX3BhcnNlUmVzcG9uc2UocmVzdWx0KSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVsYXkgPSAwLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRhdGE7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gUmVzZXQgb3VyIHJlY29ubmVjdCBlcnJvcnMgc28gaWYgd2UgdHJhbnNpdGlvbiBpbnRvIGEgcmVjb25uZWN0aW5nIHN0YXRlIGFnYWluIHdlIHRyaWdnZXJcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIHJlY29ubmVjdGVkIHF1aWNrbHlcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlY29ubmVjdEVycm9ycyA9IDA7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gSWYgdGhlcmUncyBjdXJyZW50bHkgYSB0aW1lb3V0IHRvIHRyaWdnZXIgcmVjb25uZWN0LCBmaXJlIGl0IG5vdyBiZWZvcmUgcHJvY2Vzc2luZyBtZXNzYWdlc1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHJlY29ubmVjdFRpbWVvdXRJZCAhPT0gbnVsbCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZpcmVSZWNvbm5lY3RlZCgpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChtaW5EYXRhKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZGF0YSA9IHRyYW5zcG9ydExvZ2ljLm1heGltaXplUGVyc2lzdGVudFJlc3BvbnNlKG1pbkRhdGEpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRyYW5zcG9ydExvZ2ljLnByb2Nlc3NNZXNzYWdlcyhpbnN0YW5jZSwgbWluRGF0YSwgZmlyZUNvbm5lY3QpO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChkYXRhICYmXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJC50eXBlKGRhdGEuTG9uZ1BvbGxEZWxheSkgPT09IFwibnVtYmVyXCIpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZWxheSA9IGRhdGEuTG9uZ1BvbGxEZWxheTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoZGF0YSAmJiBkYXRhLkRpc2Nvbm5lY3QpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGlzRGlzY29ubmVjdGluZyhpbnN0YW5jZSkgPT09IHRydWUpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gV2UgbmV2ZXIgd2FudCB0byBwYXNzIGEgcmFpc2VSZWNvbm5lY3QgZmxhZyBhZnRlciBhIHN1Y2Nlc3NmdWwgcG9sbC4gIFRoaXMgaXMgaGFuZGxlZCB2aWEgdGhlIGVycm9yIGZ1bmN0aW9uXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoZGVsYXkgPiAwKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgd2luZG93LnNldFRpbWVvdXQoZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwb2xsKGluc3RhbmNlLCBmYWxzZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSwgZGVsYXkpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwb2xsKGluc3RhbmNlLCBmYWxzZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0sXHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICBlcnJvcjogZnVuY3Rpb24gKGRhdGEsIHRleHRTdGF0dXMpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIFN0b3AgdHJ5aW5nIHRvIHRyaWdnZXIgcmVjb25uZWN0LCBjb25uZWN0aW9uIGlzIGluIGFuIGVycm9yIHN0YXRlXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBJZiB3ZSdyZSBub3QgaW4gdGhlIHJlY29ubmVjdCBzdGF0ZSB0aGlzIHdpbGwgbm9vcFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgd2luZG93LmNsZWFyVGltZW91dChyZWNvbm5lY3RUaW1lb3V0SWQpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVjb25uZWN0VGltZW91dElkID0gbnVsbDtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAodGV4dFN0YXR1cyA9PT0gXCJhYm9ydFwiKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29ubmVjdGlvbi5sb2coXCJBYm9ydGVkIHhociByZXF1c3QuXCIpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoIXRyeUZhaWxDb25uZWN0KCkpIHtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gSW5jcmVtZW50IG91ciByZWNvbm5lY3QgZXJyb3JzLCB3ZSBhc3N1bWUgYWxsIGVycm9ycyB0byBiZSByZWNvbm5lY3QgZXJyb3JzXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gSW4gdGhlIGNhc2UgdGhhdCBpdCdzIG91ciBmaXJzdCBlcnJvciB0aGlzIHdpbGwgY2F1c2UgUmVjb25uZWN0IHRvIGJlIGZpcmVkXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gYWZ0ZXIgMSBzZWNvbmQgZHVlIHRvIHJlY29ubmVjdEVycm9ycyBiZWluZyA9IDEuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVjb25uZWN0RXJyb3JzKys7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChjb25uZWN0aW9uLnN0YXRlICE9PSBzaWduYWxSLmNvbm5lY3Rpb25TdGF0ZS5yZWNvbm5lY3RpbmcpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29ubmVjdGlvbi5sb2coXCJBbiBlcnJvciBvY2N1cnJlZCB1c2luZyBsb25nUG9sbGluZy4gU3RhdHVzID0gXCIgKyB0ZXh0U3RhdHVzICsgXCIuIFwiICsgZGF0YS5yZXNwb25zZVRleHQpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAkKGluc3RhbmNlKS50cmlnZ2VySGFuZGxlcihldmVudHMub25FcnJvciwgW2RhdGEucmVzcG9uc2VUZXh0XSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBUcmFuc2l0aW9uIGludG8gdGhlIHJlY29ubmVjdGluZyBzdGF0ZVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRyYW5zcG9ydExvZ2ljLmVuc3VyZVJlY29ubmVjdGluZ1N0YXRlKGluc3RhbmNlKTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gQ2FsbCBwb2xsIHdpdGggdGhlIHJhaXNlUmVjb25uZWN0IGZsYWcgYXMgdHJ1ZSBhZnRlciB0aGUgcmVjb25uZWN0IGRlbGF5XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgd2luZG93LnNldFRpbWVvdXQoZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwb2xsKGluc3RhbmNlLCB0cnVlKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9LCB0aGF0LnJlY29ubmVjdERlbGF5KTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH0pO1xyXG5cclxuXHJcbiAgICAgICAgICAgICAgICAgICAgLy8gVGhpcyB3aWxsIG9ubHkgZXZlciBwYXNzIGFmdGVyIGFuIGVycm9yIGhhcyBvY2N1cmVkIHZpYSB0aGUgcG9sbCBhamF4IHByb2NlZHVyZS5cclxuICAgICAgICAgICAgICAgICAgICBpZiAocmVjb25uZWN0aW5nICYmIHJhaXNlUmVjb25uZWN0ID09PSB0cnVlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIFdlIHdhaXQgdG8gcmVjb25uZWN0IGRlcGVuZGluZyBvbiBob3cgbWFueSB0aW1lcyB3ZSd2ZSBmYWlsZWQgdG8gcmVjb25uZWN0LlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBUaGlzIGlzIGVzc2VudGlhbGx5IGEgaGV1cmlzdGljIHRoYXQgd2lsbCBleHBvbmVudGlhbGx5IGluY3JlYXNlIGluIHdhaXQgdGltZSBiZWZvcmVcclxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gdHJpZ2dlcmluZyByZWNvbm5lY3RlZC4gIFRoaXMgZGVwZW5kcyBvbiB0aGUgXCJlcnJvclwiIGhhbmRsZXIgb2YgUG9sbCB0byBjYW5jZWwgdGhpcyBcclxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gdGltZW91dCBpZiBpdCB0cmlnZ2VycyBiZWZvcmUgdGhlIFJlY29ubmVjdGVkIGV2ZW50IGZpcmVzLlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBUaGUgTWF0aC5taW4gYXQgdGhlIGVuZCBpcyB0byBlbnN1cmUgdGhhdCB0aGUgcmVjb25uZWN0IHRpbWVvdXQgZG9lcyBub3Qgb3ZlcmZsb3cuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlY29ubmVjdFRpbWVvdXRJZCA9IHdpbmRvdy5zZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHsgZmlyZVJlY29ubmVjdGVkKGluc3RhbmNlKTsgfSwgTWF0aC5taW4oMTAwMCAqIChNYXRoLnBvdygyLCByZWNvbm5lY3RFcnJvcnMpIC0gMSksIG1heEZpcmVSZWNvbm5lY3RlZFRpbWVvdXQpKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9KGNvbm5lY3Rpb24pKTtcclxuICAgICAgICAgICAgfSwgMjUwKTsgLy8gSGF2ZSB0byBkZWxheSBpbml0aWFsIHBvbGwgc28gQ2hyb21lIGRvZXNuJ3Qgc2hvdyBsb2FkZXIgc3Bpbm5lciBpbiB0YWJcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICBsb3N0Q29ubmVjdGlvbjogZnVuY3Rpb24gKGNvbm5lY3Rpb24pIHtcclxuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiTG9zdCBDb25uZWN0aW9uIG5vdCBoYW5kbGVkIGZvciBMb25nUG9sbGluZ1wiKTtcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICBzZW5kOiBmdW5jdGlvbiAoY29ubmVjdGlvbiwgZGF0YSkge1xyXG4gICAgICAgICAgICB0cmFuc3BvcnRMb2dpYy5hamF4U2VuZChjb25uZWN0aW9uLCBkYXRhKTtcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICBzdG9wOiBmdW5jdGlvbiAoY29ubmVjdGlvbikge1xyXG4gICAgICAgICAgICAvLy8gPHN1bW1hcnk+U3RvcHMgdGhlIGxvbmcgcG9sbGluZyBjb25uZWN0aW9uPC9zdW1tYXJ5PlxyXG4gICAgICAgICAgICAvLy8gPHBhcmFtIG5hbWU9XCJjb25uZWN0aW9uXCIgdHlwZT1cInNpZ25hbFJcIj5UaGUgU2lnbmFsUiBjb25uZWN0aW9uIHRvIHN0b3A8L3BhcmFtPlxyXG4gICAgICAgICAgICBpZiAoY29ubmVjdGlvbi5wb2xsWGhyKSB7XHJcbiAgICAgICAgICAgICAgICBjb25uZWN0aW9uLnBvbGxYaHIuYWJvcnQoKTtcclxuICAgICAgICAgICAgICAgIGNvbm5lY3Rpb24ucG9sbFhociA9IG51bGw7XHJcbiAgICAgICAgICAgICAgICBkZWxldGUgY29ubmVjdGlvbi5wb2xsWGhyO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgYWJvcnQ6IGZ1bmN0aW9uIChjb25uZWN0aW9uLCBhc3luYykge1xyXG4gICAgICAgICAgICB0cmFuc3BvcnRMb2dpYy5hamF4QWJvcnQoY29ubmVjdGlvbiwgYXN5bmMpO1xyXG4gICAgICAgIH1cclxuICAgIH07XHJcblxyXG59KHdpbmRvdy5qUXVlcnksIHdpbmRvdykpO1xyXG4vKiBqcXVlcnkuc2lnbmFsUi5odWJzLmpzICovXHJcbi8vIENvcHlyaWdodCAoYykgTWljcm9zb2Z0IE9wZW4gVGVjaG5vbG9naWVzLCBJbmMuIEFsbCByaWdodHMgcmVzZXJ2ZWQuIFNlZSBMaWNlbnNlLm1kIGluIHRoZSBwcm9qZWN0IHJvb3QgZm9yIGxpY2Vuc2UgaW5mb3JtYXRpb24uXHJcblxyXG4vKmdsb2JhbCB3aW5kb3c6ZmFsc2UgKi9cclxuLy8vIDxyZWZlcmVuY2UgcGF0aD1cImpxdWVyeS5zaWduYWxSLmNvcmUuanNcIiAvPlxyXG5cclxuKGZ1bmN0aW9uICgkLCB3aW5kb3cpIHtcclxuICAgIFwidXNlIHN0cmljdFwiO1xyXG5cclxuICAgIC8vIHdlIHVzZSBhIGdsb2JhbCBpZCBmb3IgdHJhY2tpbmcgY2FsbGJhY2tzIHNvIHRoZSBzZXJ2ZXIgZG9lc24ndCBoYXZlIHRvIHNlbmQgZXh0cmEgaW5mbyBsaWtlIGh1YiBuYW1lXHJcbiAgICB2YXIgY2FsbGJhY2tJZCA9IDAsXHJcbiAgICAgICAgY2FsbGJhY2tzID0ge30sXHJcbiAgICAgICAgZXZlbnROYW1lc3BhY2UgPSBcIi5odWJQcm94eVwiO1xyXG5cclxuICAgIGZ1bmN0aW9uIG1ha2VFdmVudE5hbWUoZXZlbnQpIHtcclxuICAgICAgICByZXR1cm4gZXZlbnQgKyBldmVudE5hbWVzcGFjZTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBFcXVpdmFsZW50IHRvIEFycmF5LnByb3RvdHlwZS5tYXBcclxuICAgIGZ1bmN0aW9uIG1hcChhcnIsIGZ1biwgdGhpc3ApIHtcclxuICAgICAgICB2YXIgaSxcclxuICAgICAgICAgICAgbGVuZ3RoID0gYXJyLmxlbmd0aCxcclxuICAgICAgICAgICAgcmVzdWx0ID0gW107XHJcbiAgICAgICAgZm9yIChpID0gMDsgaSA8IGxlbmd0aDsgaSArPSAxKSB7XHJcbiAgICAgICAgICAgIGlmIChhcnIuaGFzT3duUHJvcGVydHkoaSkpIHtcclxuICAgICAgICAgICAgICAgIHJlc3VsdFtpXSA9IGZ1bi5jYWxsKHRoaXNwLCBhcnJbaV0sIGksIGFycik7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiBnZXRBcmdWYWx1ZShhKSB7XHJcbiAgICAgICAgcmV0dXJuICQuaXNGdW5jdGlvbihhKSA/IG51bGwgOiAoJC50eXBlKGEpID09PSBcInVuZGVmaW5lZFwiID8gbnVsbCA6IGEpO1xyXG4gICAgfVxyXG5cclxuICAgIGZ1bmN0aW9uIGhhc01lbWJlcnMob2JqKSB7XHJcbiAgICAgICAgZm9yICh2YXIga2V5IGluIG9iaikge1xyXG4gICAgICAgICAgICAvLyBJZiB3ZSBoYXZlIGFueSBwcm9wZXJ0aWVzIGluIG91ciBjYWxsYmFjayBtYXAgdGhlbiB3ZSBoYXZlIGNhbGxiYWNrcyBhbmQgY2FuIGV4aXQgdGhlIGxvb3AgdmlhIHJldHVyblxyXG4gICAgICAgICAgICBpZiAob2JqLmhhc093blByb3BlcnR5KGtleSkpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gaHViUHJveHlcclxuICAgIGZ1bmN0aW9uIGh1YlByb3h5KGh1YkNvbm5lY3Rpb24sIGh1Yk5hbWUpIHtcclxuICAgICAgICAvLy8gPHN1bW1hcnk+XHJcbiAgICAgICAgLy8vICAgICBDcmVhdGVzIGEgbmV3IHByb3h5IG9iamVjdCBmb3IgdGhlIGdpdmVuIGh1YiBjb25uZWN0aW9uIHRoYXQgY2FuIGJlIHVzZWQgdG8gaW52b2tlXHJcbiAgICAgICAgLy8vICAgICBtZXRob2RzIG9uIHNlcnZlciBodWJzIGFuZCBoYW5kbGUgY2xpZW50IG1ldGhvZCBpbnZvY2F0aW9uIHJlcXVlc3RzIGZyb20gdGhlIHNlcnZlci5cclxuICAgICAgICAvLy8gPC9zdW1tYXJ5PlxyXG4gICAgICAgIHJldHVybiBuZXcgaHViUHJveHkuZm4uaW5pdChodWJDb25uZWN0aW9uLCBodWJOYW1lKTtcclxuICAgIH1cclxuXHJcbiAgICBodWJQcm94eS5mbiA9IGh1YlByb3h5LnByb3RvdHlwZSA9IHtcclxuICAgICAgICBpbml0OiBmdW5jdGlvbiAoY29ubmVjdGlvbiwgaHViTmFtZSkge1xyXG4gICAgICAgICAgICB0aGlzLnN0YXRlID0ge307XHJcbiAgICAgICAgICAgIHRoaXMuY29ubmVjdGlvbiA9IGNvbm5lY3Rpb247XHJcbiAgICAgICAgICAgIHRoaXMuaHViTmFtZSA9IGh1Yk5hbWU7XHJcbiAgICAgICAgICAgIHRoaXMuXyA9IHtcclxuICAgICAgICAgICAgICAgIGNhbGxiYWNrTWFwOiB7fVxyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIGhhc1N1YnNjcmlwdGlvbnM6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgcmV0dXJuIGhhc01lbWJlcnModGhpcy5fLmNhbGxiYWNrTWFwKTtcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICBvbjogZnVuY3Rpb24gKGV2ZW50TmFtZSwgY2FsbGJhY2spIHtcclxuICAgICAgICAgICAgLy8vIDxzdW1tYXJ5PldpcmVzIHVwIGEgY2FsbGJhY2sgdG8gYmUgaW52b2tlZCB3aGVuIGEgaW52b2NhdGlvbiByZXF1ZXN0IGlzIHJlY2VpdmVkIGZyb20gdGhlIHNlcnZlciBodWIuPC9zdW1tYXJ5PlxyXG4gICAgICAgICAgICAvLy8gPHBhcmFtIG5hbWU9XCJldmVudE5hbWVcIiB0eXBlPVwiU3RyaW5nXCI+VGhlIG5hbWUgb2YgdGhlIGh1YiBldmVudCB0byByZWdpc3RlciB0aGUgY2FsbGJhY2sgZm9yLjwvcGFyYW0+XHJcbiAgICAgICAgICAgIC8vLyA8cGFyYW0gbmFtZT1cImNhbGxiYWNrXCIgdHlwZT1cIkZ1bmN0aW9uXCI+VGhlIGNhbGxiYWNrIHRvIGJlIGludm9rZWQuPC9wYXJhbT5cclxuICAgICAgICAgICAgdmFyIHRoYXQgPSB0aGlzLFxyXG4gICAgICAgICAgICAgICAgY2FsbGJhY2tNYXAgPSB0aGF0Ll8uY2FsbGJhY2tNYXA7XHJcblxyXG4gICAgICAgICAgICAvLyBOb3JtYWxpemUgdGhlIGV2ZW50IG5hbWUgdG8gbG93ZXJjYXNlXHJcbiAgICAgICAgICAgIGV2ZW50TmFtZSA9IGV2ZW50TmFtZS50b0xvd2VyQ2FzZSgpO1xyXG5cclxuICAgICAgICAgICAgLy8gSWYgdGhlcmUgaXMgbm90IGFuIGV2ZW50IHJlZ2lzdGVyZWQgZm9yIHRoaXMgY2FsbGJhY2sgeWV0IHdlIHdhbnQgdG8gY3JlYXRlIGl0cyBldmVudCBzcGFjZSBpbiB0aGUgY2FsbGJhY2sgbWFwLlxyXG4gICAgICAgICAgICBpZiAoIWNhbGxiYWNrTWFwW2V2ZW50TmFtZV0pIHtcclxuICAgICAgICAgICAgICAgIGNhbGxiYWNrTWFwW2V2ZW50TmFtZV0gPSB7fTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgLy8gTWFwIHRoZSBjYWxsYmFjayB0byBvdXIgZW5jb21wYXNzZWQgZnVuY3Rpb25cclxuICAgICAgICAgICAgY2FsbGJhY2tNYXBbZXZlbnROYW1lXVtjYWxsYmFja10gPSBmdW5jdGlvbiAoZSwgZGF0YSkge1xyXG4gICAgICAgICAgICAgICAgY2FsbGJhY2suYXBwbHkodGhhdCwgZGF0YSk7XHJcbiAgICAgICAgICAgIH07XHJcblxyXG4gICAgICAgICAgICAkKHRoYXQpLmJpbmQobWFrZUV2ZW50TmFtZShldmVudE5hbWUpLCBjYWxsYmFja01hcFtldmVudE5hbWVdW2NhbGxiYWNrXSk7XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gdGhhdDtcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICBvZmY6IGZ1bmN0aW9uIChldmVudE5hbWUsIGNhbGxiYWNrKSB7XHJcbiAgICAgICAgICAgIC8vLyA8c3VtbWFyeT5SZW1vdmVzIHRoZSBjYWxsYmFjayBpbnZvY2F0aW9uIHJlcXVlc3QgZnJvbSB0aGUgc2VydmVyIGh1YiBmb3IgdGhlIGdpdmVuIGV2ZW50IG5hbWUuPC9zdW1tYXJ5PlxyXG4gICAgICAgICAgICAvLy8gPHBhcmFtIG5hbWU9XCJldmVudE5hbWVcIiB0eXBlPVwiU3RyaW5nXCI+VGhlIG5hbWUgb2YgdGhlIGh1YiBldmVudCB0byB1bnJlZ2lzdGVyIHRoZSBjYWxsYmFjayBmb3IuPC9wYXJhbT5cclxuICAgICAgICAgICAgLy8vIDxwYXJhbSBuYW1lPVwiY2FsbGJhY2tcIiB0eXBlPVwiRnVuY3Rpb25cIj5UaGUgY2FsbGJhY2sgdG8gYmUgaW52b2tlZC48L3BhcmFtPlxyXG4gICAgICAgICAgICB2YXIgdGhhdCA9IHRoaXMsXHJcbiAgICAgICAgICAgICAgICBjYWxsYmFja01hcCA9IHRoYXQuXy5jYWxsYmFja01hcCxcclxuICAgICAgICAgICAgICAgIGNhbGxiYWNrU3BhY2U7XHJcblxyXG4gICAgICAgICAgICAvLyBOb3JtYWxpemUgdGhlIGV2ZW50IG5hbWUgdG8gbG93ZXJjYXNlXHJcbiAgICAgICAgICAgIGV2ZW50TmFtZSA9IGV2ZW50TmFtZS50b0xvd2VyQ2FzZSgpO1xyXG5cclxuICAgICAgICAgICAgY2FsbGJhY2tTcGFjZSA9IGNhbGxiYWNrTWFwW2V2ZW50TmFtZV07XHJcblxyXG4gICAgICAgICAgICAvLyBWZXJpZnkgdGhhdCB0aGVyZSBpcyBhbiBldmVudCBzcGFjZSB0byB1bmJpbmRcclxuICAgICAgICAgICAgaWYgKGNhbGxiYWNrU3BhY2UpIHtcclxuICAgICAgICAgICAgICAgIC8vIE9ubHkgdW5iaW5kIGlmIHRoZXJlJ3MgYW4gZXZlbnQgYm91bmQgd2l0aCBldmVudE5hbWUgYW5kIGEgY2FsbGJhY2sgd2l0aCB0aGUgc3BlY2lmaWVkIGNhbGxiYWNrXHJcbiAgICAgICAgICAgICAgICBpZiAoY2FsbGJhY2tTcGFjZVtjYWxsYmFja10pIHtcclxuICAgICAgICAgICAgICAgICAgICAkKHRoYXQpLnVuYmluZChtYWtlRXZlbnROYW1lKGV2ZW50TmFtZSksIGNhbGxiYWNrU3BhY2VbY2FsbGJhY2tdKTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgLy8gUmVtb3ZlIHRoZSBjYWxsYmFjayBmcm9tIHRoZSBjYWxsYmFjayBtYXBcclxuICAgICAgICAgICAgICAgICAgICBkZWxldGUgY2FsbGJhY2tTcGFjZVtjYWxsYmFja107XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIC8vIENoZWNrIGlmIHRoZXJlIGFyZSBhbnkgbWVtYmVycyBsZWZ0IG9uIHRoZSBldmVudCwgaWYgbm90IHdlIG5lZWQgdG8gZGVzdHJveSBpdC5cclxuICAgICAgICAgICAgICAgICAgICBpZiAoIWhhc01lbWJlcnMoY2FsbGJhY2tTcGFjZSkpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgZGVsZXRlIGNhbGxiYWNrTWFwW2V2ZW50TmFtZV07XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgZWxzZSBpZiAoIWNhbGxiYWNrKSB7IC8vIENoZWNrIGlmIHdlJ3JlIHJlbW92aW5nIHRoZSB3aG9sZSBldmVudCBhbmQgd2UgZGlkbid0IGVycm9yIGJlY2F1c2Ugb2YgYW4gaW52YWxpZCBjYWxsYmFja1xyXG4gICAgICAgICAgICAgICAgICAgICQodGhhdCkudW5iaW5kKG1ha2VFdmVudE5hbWUoZXZlbnROYW1lKSk7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGRlbGV0ZSBjYWxsYmFja01hcFtldmVudE5hbWVdO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gdGhhdDtcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICBpbnZva2U6IGZ1bmN0aW9uIChtZXRob2ROYW1lKSB7XHJcbiAgICAgICAgICAgIC8vLyA8c3VtbWFyeT5JbnZva2VzIGEgc2VydmVyIGh1YiBtZXRob2Qgd2l0aCB0aGUgZ2l2ZW4gYXJndW1lbnRzLjwvc3VtbWFyeT5cclxuICAgICAgICAgICAgLy8vIDxwYXJhbSBuYW1lPVwibWV0aG9kTmFtZVwiIHR5cGU9XCJTdHJpbmdcIj5UaGUgbmFtZSBvZiB0aGUgc2VydmVyIGh1YiBtZXRob2QuPC9wYXJhbT5cclxuXHJcbiAgICAgICAgICAgIHZhciB0aGF0ID0gdGhpcyxcclxuICAgICAgICAgICAgICAgIGFyZ3MgPSAkLm1ha2VBcnJheShhcmd1bWVudHMpLnNsaWNlKDEpLFxyXG4gICAgICAgICAgICAgICAgYXJnVmFsdWVzID0gbWFwKGFyZ3MsIGdldEFyZ1ZhbHVlKSxcclxuICAgICAgICAgICAgICAgIGRhdGEgPSB7IEg6IHRoYXQuaHViTmFtZSwgTTogbWV0aG9kTmFtZSwgQTogYXJnVmFsdWVzLCBJOiBjYWxsYmFja0lkIH0sXHJcbiAgICAgICAgICAgICAgICBkID0gJC5EZWZlcnJlZCgpLFxyXG4gICAgICAgICAgICAgICAgY2FsbGJhY2sgPSBmdW5jdGlvbiAobWluUmVzdWx0KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIHJlc3VsdCA9IHRoYXQuX21heGltaXplSHViUmVzcG9uc2UobWluUmVzdWx0KTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgLy8gVXBkYXRlIHRoZSBodWIgc3RhdGVcclxuICAgICAgICAgICAgICAgICAgICAkLmV4dGVuZCh0aGF0LnN0YXRlLCByZXN1bHQuU3RhdGUpO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICBpZiAocmVzdWx0LkVycm9yKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIFNlcnZlciBodWIgbWV0aG9kIHRocmV3IGFuIGV4Y2VwdGlvbiwgbG9nIGl0ICYgcmVqZWN0IHRoZSBkZWZlcnJlZFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAocmVzdWx0LlN0YWNrVHJhY2UpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoYXQuY29ubmVjdGlvbi5sb2cocmVzdWx0LkVycm9yICsgXCJcXG5cIiArIHJlc3VsdC5TdGFja1RyYWNlKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICBkLnJlamVjdFdpdGgodGhhdCwgW3Jlc3VsdC5FcnJvcl0pO1xyXG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIFNlcnZlciBpbnZvY2F0aW9uIHN1Y2NlZWRlZCwgcmVzb2x2ZSB0aGUgZGVmZXJyZWRcclxuICAgICAgICAgICAgICAgICAgICAgICAgZC5yZXNvbHZlV2l0aCh0aGF0LCBbcmVzdWx0LlJlc3VsdF0pO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH07XHJcblxyXG4gICAgICAgICAgICBjYWxsYmFja3NbY2FsbGJhY2tJZC50b1N0cmluZygpXSA9IHsgc2NvcGU6IHRoYXQsIG1ldGhvZDogY2FsbGJhY2sgfTtcclxuICAgICAgICAgICAgY2FsbGJhY2tJZCArPSAxO1xyXG5cclxuICAgICAgICAgICAgaWYgKCEkLmlzRW1wdHlPYmplY3QodGhhdC5zdGF0ZSkpIHtcclxuICAgICAgICAgICAgICAgIGRhdGEuUyA9IHRoYXQuc3RhdGU7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIHRoYXQuY29ubmVjdGlvbi5zZW5kKHRoYXQuY29ubmVjdGlvbi5qc29uLnN0cmluZ2lmeShkYXRhKSk7XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gZC5wcm9taXNlKCk7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgX21heGltaXplSHViUmVzcG9uc2U6IGZ1bmN0aW9uIChtaW5IdWJSZXNwb25zZSkge1xyXG4gICAgICAgICAgICByZXR1cm4ge1xyXG4gICAgICAgICAgICAgICAgU3RhdGU6IG1pbkh1YlJlc3BvbnNlLlMsXHJcbiAgICAgICAgICAgICAgICBSZXN1bHQ6IG1pbkh1YlJlc3BvbnNlLlIsXHJcbiAgICAgICAgICAgICAgICBJZDogbWluSHViUmVzcG9uc2UuSSxcclxuICAgICAgICAgICAgICAgIEVycm9yOiBtaW5IdWJSZXNwb25zZS5FLFxyXG4gICAgICAgICAgICAgICAgU3RhY2tUcmFjZTogbWluSHViUmVzcG9uc2UuVFxyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgIH1cclxuICAgIH07XHJcblxyXG4gICAgaHViUHJveHkuZm4uaW5pdC5wcm90b3R5cGUgPSBodWJQcm94eS5mbjtcclxuXHJcbiAgICAvLyBodWJDb25uZWN0aW9uXHJcbiAgICBmdW5jdGlvbiBodWJDb25uZWN0aW9uKHVybCwgb3B0aW9ucykge1xyXG4gICAgICAgIC8vLyA8c3VtbWFyeT5DcmVhdGVzIGEgbmV3IGh1YiBjb25uZWN0aW9uLjwvc3VtbWFyeT5cclxuICAgICAgICAvLy8gPHBhcmFtIG5hbWU9XCJ1cmxcIiB0eXBlPVwiU3RyaW5nXCI+W09wdGlvbmFsXSBUaGUgaHViIHJvdXRlIHVybCwgZGVmYXVsdHMgdG8gXCIvc2lnbmFsclwiLjwvcGFyYW0+XHJcbiAgICAgICAgLy8vIDxwYXJhbSBuYW1lPVwib3B0aW9uc1wiIHR5cGU9XCJPYmplY3RcIj5bT3B0aW9uYWxdIFNldHRpbmdzIHRvIHVzZSB3aGVuIGNyZWF0aW5nIHRoZSBodWJDb25uZWN0aW9uLjwvcGFyYW0+XHJcbiAgICAgICAgdmFyIHNldHRpbmdzID0ge1xyXG4gICAgICAgICAgICBxczogbnVsbCxcclxuICAgICAgICAgICAgbG9nZ2luZzogZmFsc2UsXHJcbiAgICAgICAgICAgIHVzZURlZmF1bHRQYXRoOiB0cnVlXHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgJC5leHRlbmQoc2V0dGluZ3MsIG9wdGlvbnMpO1xyXG5cclxuICAgICAgICBpZiAoIXVybCB8fCBzZXR0aW5ncy51c2VEZWZhdWx0UGF0aCkge1xyXG4gICAgICAgICAgICB1cmwgPSAodXJsIHx8IFwiXCIpICsgXCIvc2lnbmFsclwiO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gbmV3IGh1YkNvbm5lY3Rpb24uZm4uaW5pdCh1cmwsIHNldHRpbmdzKTtcclxuICAgIH1cclxuXHJcbiAgICBodWJDb25uZWN0aW9uLmZuID0gaHViQ29ubmVjdGlvbi5wcm90b3R5cGUgPSAkLmNvbm5lY3Rpb24oKTtcclxuXHJcbiAgICBodWJDb25uZWN0aW9uLmZuLmluaXQgPSBmdW5jdGlvbiAodXJsLCBvcHRpb25zKSB7XHJcbiAgICAgICAgdmFyIHNldHRpbmdzID0ge1xyXG4gICAgICAgICAgICBxczogbnVsbCxcclxuICAgICAgICAgICAgbG9nZ2luZzogZmFsc2UsXHJcbiAgICAgICAgICAgIHVzZURlZmF1bHRQYXRoOiB0cnVlXHJcbiAgICAgICAgfSxcclxuICAgICAgICAgICAgY29ubmVjdGlvbiA9IHRoaXM7XHJcblxyXG4gICAgICAgICQuZXh0ZW5kKHNldHRpbmdzLCBvcHRpb25zKTtcclxuXHJcbiAgICAgICAgLy8gQ2FsbCB0aGUgYmFzZSBjb25zdHJ1Y3RvclxyXG4gICAgICAgICQuc2lnbmFsUi5mbi5pbml0LmNhbGwoY29ubmVjdGlvbiwgdXJsLCBzZXR0aW5ncy5xcywgc2V0dGluZ3MubG9nZ2luZyk7XHJcblxyXG4gICAgICAgIC8vIE9iamVjdCB0byBzdG9yZSBodWIgcHJveGllcyBmb3IgdGhpcyBjb25uZWN0aW9uXHJcbiAgICAgICAgY29ubmVjdGlvbi5wcm94aWVzID0ge307XHJcblxyXG4gICAgICAgIC8vIFdpcmUgdXAgdGhlIHJlY2VpdmVkIGhhbmRsZXJcclxuICAgICAgICBjb25uZWN0aW9uLnJlY2VpdmVkKGZ1bmN0aW9uIChtaW5EYXRhKSB7XHJcbiAgICAgICAgICAgIHZhciBkYXRhLCBwcm94eSwgZGF0YUNhbGxiYWNrSWQsIGNhbGxiYWNrLCBodWJOYW1lLCBldmVudE5hbWU7XHJcbiAgICAgICAgICAgIGlmICghbWluRGF0YSkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBpZiAodHlwZW9mIChtaW5EYXRhLkkpICE9PSBcInVuZGVmaW5lZFwiKSB7XHJcbiAgICAgICAgICAgICAgICAvLyBXZSByZWNlaXZlZCB0aGUgcmV0dXJuIHZhbHVlIGZyb20gYSBzZXJ2ZXIgbWV0aG9kIGludm9jYXRpb24sIGxvb2sgdXAgY2FsbGJhY2sgYnkgaWQgYW5kIGNhbGwgaXRcclxuICAgICAgICAgICAgICAgIGRhdGFDYWxsYmFja0lkID0gbWluRGF0YS5JLnRvU3RyaW5nKCk7XHJcbiAgICAgICAgICAgICAgICBjYWxsYmFjayA9IGNhbGxiYWNrc1tkYXRhQ2FsbGJhY2tJZF07XHJcbiAgICAgICAgICAgICAgICBpZiAoY2FsbGJhY2spIHtcclxuICAgICAgICAgICAgICAgICAgICAvLyBEZWxldGUgdGhlIGNhbGxiYWNrIGZyb20gdGhlIHByb3h5XHJcbiAgICAgICAgICAgICAgICAgICAgY2FsbGJhY2tzW2RhdGFDYWxsYmFja0lkXSA9IG51bGw7XHJcbiAgICAgICAgICAgICAgICAgICAgZGVsZXRlIGNhbGxiYWNrc1tkYXRhQ2FsbGJhY2tJZF07XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIC8vIEludm9rZSB0aGUgY2FsbGJhY2tcclxuICAgICAgICAgICAgICAgICAgICBjYWxsYmFjay5tZXRob2QuY2FsbChjYWxsYmFjay5zY29wZSwgbWluRGF0YSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICBkYXRhID0gdGhpcy5fbWF4aW1pemVDbGllbnRIdWJJbnZvY2F0aW9uKG1pbkRhdGEpO1xyXG5cclxuICAgICAgICAgICAgICAgIC8vIFdlIHJlY2VpdmVkIGEgY2xpZW50IGludm9jYXRpb24gcmVxdWVzdCwgaS5lLiBicm9hZGNhc3QgZnJvbSBzZXJ2ZXIgaHViXHJcbiAgICAgICAgICAgICAgICBjb25uZWN0aW9uLmxvZyhcIlRyaWdnZXJpbmcgY2xpZW50IGh1YiBldmVudCAnXCIgKyBkYXRhLk1ldGhvZCArIFwiJyBvbiBodWIgJ1wiICsgZGF0YS5IdWIgKyBcIicuXCIpO1xyXG5cclxuICAgICAgICAgICAgICAgIC8vIE5vcm1hbGl6ZSB0aGUgbmFtZXMgdG8gbG93ZXJjYXNlXHJcbiAgICAgICAgICAgICAgICBodWJOYW1lID0gZGF0YS5IdWIudG9Mb3dlckNhc2UoKTtcclxuICAgICAgICAgICAgICAgIGV2ZW50TmFtZSA9IGRhdGEuTWV0aG9kLnRvTG93ZXJDYXNlKCk7XHJcblxyXG4gICAgICAgICAgICAgICAgLy8gVHJpZ2dlciB0aGUgbG9jYWwgaW52b2NhdGlvbiBldmVudFxyXG4gICAgICAgICAgICAgICAgcHJveHkgPSB0aGlzLnByb3hpZXNbaHViTmFtZV07XHJcblxyXG4gICAgICAgICAgICAgICAgLy8gVXBkYXRlIHRoZSBodWIgc3RhdGVcclxuICAgICAgICAgICAgICAgICQuZXh0ZW5kKHByb3h5LnN0YXRlLCBkYXRhLlN0YXRlKTtcclxuICAgICAgICAgICAgICAgICQocHJveHkpLnRyaWdnZXJIYW5kbGVyKG1ha2VFdmVudE5hbWUoZXZlbnROYW1lKSwgW2RhdGEuQXJnc10pO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcbiAgICB9O1xyXG5cclxuICAgIGh1YkNvbm5lY3Rpb24uZm4uX21heGltaXplQ2xpZW50SHViSW52b2NhdGlvbiA9IGZ1bmN0aW9uIChtaW5DbGllbnRIdWJJbnZvY2F0aW9uKSB7XHJcbiAgICAgICAgcmV0dXJuIHtcclxuICAgICAgICAgICAgSHViOiBtaW5DbGllbnRIdWJJbnZvY2F0aW9uLkgsXHJcbiAgICAgICAgICAgIE1ldGhvZDogbWluQ2xpZW50SHViSW52b2NhdGlvbi5NLFxyXG4gICAgICAgICAgICBBcmdzOiBtaW5DbGllbnRIdWJJbnZvY2F0aW9uLkEsXHJcbiAgICAgICAgICAgIFN0YXRlOiBtaW5DbGllbnRIdWJJbnZvY2F0aW9uLlNcclxuICAgICAgICB9O1xyXG4gICAgfTtcclxuXHJcbiAgICBodWJDb25uZWN0aW9uLmZuLl9yZWdpc3RlclN1YnNjcmliZWRIdWJzID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIC8vLyA8c3VtbWFyeT5cclxuICAgICAgICAvLy8gICAgIFNldHMgdGhlIHN0YXJ0aW5nIGV2ZW50IHRvIGxvb3AgdGhyb3VnaCB0aGUga25vd24gaHVicyBhbmQgcmVnaXN0ZXIgYW55IG5ldyBodWJzIFxyXG4gICAgICAgIC8vLyAgICAgdGhhdCBoYXZlIGJlZW4gYWRkZWQgdG8gdGhlIHByb3h5LlxyXG4gICAgICAgIC8vLyA8L3N1bW1hcnk+XHJcbiAgICAgICAgdmFyIGNvbm5lY3Rpb24gPSB0aGlzO1xyXG5cclxuICAgICAgICBpZiAoIWNvbm5lY3Rpb24uX3N1YnNjcmliZWRUb0h1YnMpIHtcclxuICAgICAgICAgICAgY29ubmVjdGlvbi5fc3Vic2NyaWJlZFRvSHVicyA9IHRydWU7XHJcbiAgICAgICAgICAgIGNvbm5lY3Rpb24uc3RhcnRpbmcoZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgLy8gU2V0IHRoZSBjb25uZWN0aW9uJ3MgZGF0YSBvYmplY3Qgd2l0aCBhbGwgdGhlIGh1YiBwcm94aWVzIHdpdGggYWN0aXZlIHN1YnNjcmlwdGlvbnMuXHJcbiAgICAgICAgICAgICAgICAvLyBUaGVzZSBwcm94aWVzIHdpbGwgcmVjZWl2ZSBub3RpZmljYXRpb25zIGZyb20gdGhlIHNlcnZlci5cclxuICAgICAgICAgICAgICAgIHZhciBzdWJzY3JpYmVkSHVicyA9IFtdO1xyXG5cclxuICAgICAgICAgICAgICAgICQuZWFjaChjb25uZWN0aW9uLnByb3hpZXMsIGZ1bmN0aW9uIChrZXkpIHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy5oYXNTdWJzY3JpcHRpb25zKCkpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgc3Vic2NyaWJlZEh1YnMucHVzaCh7IG5hbWU6IGtleSB9KTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICAgICAgICBjb25uZWN0aW9uLmRhdGEgPSBjb25uZWN0aW9uLmpzb24uc3RyaW5naWZ5KHN1YnNjcmliZWRIdWJzKTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfVxyXG4gICAgfTtcclxuXHJcbiAgICBodWJDb25uZWN0aW9uLmZuLmNyZWF0ZUh1YlByb3h5ID0gZnVuY3Rpb24gKGh1Yk5hbWUpIHtcclxuICAgICAgICAvLy8gPHN1bW1hcnk+XHJcbiAgICAgICAgLy8vICAgICBDcmVhdGVzIGEgbmV3IHByb3h5IG9iamVjdCBmb3IgdGhlIGdpdmVuIGh1YiBjb25uZWN0aW9uIHRoYXQgY2FuIGJlIHVzZWQgdG8gaW52b2tlXHJcbiAgICAgICAgLy8vICAgICBtZXRob2RzIG9uIHNlcnZlciBodWJzIGFuZCBoYW5kbGUgY2xpZW50IG1ldGhvZCBpbnZvY2F0aW9uIHJlcXVlc3RzIGZyb20gdGhlIHNlcnZlci5cclxuICAgICAgICAvLy8gPC9zdW1tYXJ5PlxyXG4gICAgICAgIC8vLyA8cGFyYW0gbmFtZT1cImh1Yk5hbWVcIiB0eXBlPVwiU3RyaW5nXCI+XHJcbiAgICAgICAgLy8vICAgICBUaGUgbmFtZSBvZiB0aGUgaHViIG9uIHRoZSBzZXJ2ZXIgdG8gY3JlYXRlIHRoZSBwcm94eSBmb3IuXHJcbiAgICAgICAgLy8vIDwvcGFyYW0+XHJcblxyXG4gICAgICAgIC8vIE5vcm1hbGl6ZSB0aGUgbmFtZSB0byBsb3dlcmNhc2VcclxuICAgICAgICBodWJOYW1lID0gaHViTmFtZS50b0xvd2VyQ2FzZSgpO1xyXG5cclxuICAgICAgICB2YXIgcHJveHkgPSB0aGlzLnByb3hpZXNbaHViTmFtZV07XHJcbiAgICAgICAgaWYgKCFwcm94eSkge1xyXG4gICAgICAgICAgICBwcm94eSA9IGh1YlByb3h5KHRoaXMsIGh1Yk5hbWUpO1xyXG4gICAgICAgICAgICB0aGlzLnByb3hpZXNbaHViTmFtZV0gPSBwcm94eTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHRoaXMuX3JlZ2lzdGVyU3Vic2NyaWJlZEh1YnMoKTtcclxuXHJcbiAgICAgICAgcmV0dXJuIHByb3h5O1xyXG4gICAgfTtcclxuXHJcbiAgICBodWJDb25uZWN0aW9uLmZuLmluaXQucHJvdG90eXBlID0gaHViQ29ubmVjdGlvbi5mbjtcclxuXHJcbiAgICAkLmh1YkNvbm5lY3Rpb24gPSBodWJDb25uZWN0aW9uO1xyXG5cclxufSh3aW5kb3cualF1ZXJ5LCB3aW5kb3cpKTtcclxuLyoganF1ZXJ5LnNpZ25hbFIudmVyc2lvbi5qcyAqL1xyXG4vLyBDb3B5cmlnaHQgKGMpIE1pY3Jvc29mdCBPcGVuIFRlY2hub2xvZ2llcywgSW5jLiBBbGwgcmlnaHRzIHJlc2VydmVkLiBTZWUgTGljZW5zZS5tZCBpbiB0aGUgcHJvamVjdCByb290IGZvciBsaWNlbnNlIGluZm9ybWF0aW9uLlxyXG5cclxuLypnbG9iYWwgd2luZG93OmZhbHNlICovXHJcbi8vLyA8cmVmZXJlbmNlIHBhdGg9XCJqcXVlcnkuc2lnbmFsUi5jb3JlLmpzXCIgLz5cclxuKGZ1bmN0aW9uICgkKSB7XHJcbiAgICAkLnNpZ25hbFIudmVyc2lvbiA9IFwiMi4wLjAtYmV0YTJcIjtcclxufSh3aW5kb3cualF1ZXJ5KSk7XHJcbiIsIi8vIEdlbmVyYXRlZCBieSBDb2ZmZWVTY3JpcHQgMS42LjJcbihmdW5jdGlvbigpIHtcbiAgdmFyIF9faW5kZXhPZiA9IFtdLmluZGV4T2YgfHwgZnVuY3Rpb24oaXRlbSkgeyBmb3IgKHZhciBpID0gMCwgbCA9IHRoaXMubGVuZ3RoOyBpIDwgbDsgaSsrKSB7IGlmIChpIGluIHRoaXMgJiYgdGhpc1tpXSA9PT0gaXRlbSkgcmV0dXJuIGk7IH0gcmV0dXJuIC0xOyB9LFxuICAgIF9faGFzUHJvcCA9IHt9Lmhhc093blByb3BlcnR5LFxuICAgIF9fZXh0ZW5kcyA9IGZ1bmN0aW9uKGNoaWxkLCBwYXJlbnQpIHsgZm9yICh2YXIga2V5IGluIHBhcmVudCkgeyBpZiAoX19oYXNQcm9wLmNhbGwocGFyZW50LCBrZXkpKSBjaGlsZFtrZXldID0gcGFyZW50W2tleV07IH0gZnVuY3Rpb24gY3RvcigpIHsgdGhpcy5jb25zdHJ1Y3RvciA9IGNoaWxkOyB9IGN0b3IucHJvdG90eXBlID0gcGFyZW50LnByb3RvdHlwZTsgY2hpbGQucHJvdG90eXBlID0gbmV3IGN0b3IoKTsgY2hpbGQuX19zdXBlcl9fID0gcGFyZW50LnByb3RvdHlwZTsgcmV0dXJuIGNoaWxkOyB9O1xuXG4gIChmdW5jdGlvbihyb290LCBmYWN0b3J5KSB7XG4gICAgaWYgKHR5cGVvZiBleHBvcnRzICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgcmV0dXJuIGZhY3Rvcnkocm9vdCwgZXhwb3J0cyk7XG4gICAgfSBlbHNlIGlmICh0eXBlb2YgZGVmaW5lID09PSAnZnVuY3Rpb24nICYmIGRlZmluZS5hbWQpIHtcbiAgICAgIHJldHVybiBkZWZpbmUoWydleHBvcnRzJ10sIGZ1bmN0aW9uKGV4cG9ydHMpIHtcbiAgICAgICAgcmV0dXJuIHJvb3QuanNvbnBhdGNoID0gZmFjdG9yeShyb290LCBleHBvcnRzKTtcbiAgICAgIH0pO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gcm9vdC5qc29ucGF0Y2ggPSBmYWN0b3J5KHJvb3QsIHt9KTtcbiAgICB9XG4gIH0pKHRoaXMsIGZ1bmN0aW9uKHJvb3QpIHtcbiAgICB2YXIgQWRkUGF0Y2gsIENvcHlQYXRjaCwgSW52YWxpZFBhdGNoRXJyb3IsIEludmFsaWRQb2ludGVyRXJyb3IsIEpTT05QYXRjaCwgSlNPTlBhdGNoRXJyb3IsIEpTT05Qb2ludGVyLCBNb3ZlUGF0Y2gsIFBhdGNoQ29uZmxpY3RFcnJvciwgUmVtb3ZlUGF0Y2gsIFJlcGxhY2VQYXRjaCwgVGVzdFBhdGNoLCBhcHBseSwgY29tcGlsZSwgaGFzT3duUHJvcGVydHksIGlzQXJyYXksIGlzRXF1YWwsIGlzT2JqZWN0LCBpc1N0cmluZywgb3BlcmF0aW9uTWFwLCB0b1N0cmluZywgX2lzRXF1YWwsIF9yZWYsIF9yZWYxLCBfcmVmMiwgX3JlZjMsIF9yZWY0LCBfcmVmNTtcblxuICAgIHRvU3RyaW5nID0gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZztcbiAgICBoYXNPd25Qcm9wZXJ0eSA9IE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHk7XG4gICAgaXNBcnJheSA9IGZ1bmN0aW9uKG9iaikge1xuICAgICAgcmV0dXJuIHRvU3RyaW5nLmNhbGwob2JqKSA9PT0gJ1tvYmplY3QgQXJyYXldJztcbiAgICB9O1xuICAgIGlzT2JqZWN0ID0gZnVuY3Rpb24ob2JqKSB7XG4gICAgICByZXR1cm4gdG9TdHJpbmcuY2FsbChvYmopID09PSAnW29iamVjdCBPYmplY3RdJztcbiAgICB9O1xuICAgIGlzU3RyaW5nID0gZnVuY3Rpb24ob2JqKSB7XG4gICAgICByZXR1cm4gdG9TdHJpbmcuY2FsbChvYmopID09PSAnW29iamVjdCBTdHJpbmddJztcbiAgICB9O1xuICAgIF9pc0VxdWFsID0gZnVuY3Rpb24oYSwgYiwgc3RhY2spIHtcbiAgICAgIHZhciBjbGFzc05hbWUsIGtleSwgbGVuZ3RoLCByZXN1bHQsIHNpemU7XG5cbiAgICAgIGlmIChhID09PSBiKSB7XG4gICAgICAgIHJldHVybiBhICE9PSAwIHx8IDEgLyBhID09PSAxIC8gYjtcbiAgICAgIH1cbiAgICAgIGlmIChhID09PSBudWxsIHx8IGIgPT09IG51bGwpIHtcbiAgICAgICAgcmV0dXJuIGEgPT09IGI7XG4gICAgICB9XG4gICAgICBjbGFzc05hbWUgPSB0b1N0cmluZy5jYWxsKGEpO1xuICAgICAgaWYgKGNsYXNzTmFtZSAhPT0gdG9TdHJpbmcuY2FsbChiKSkge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9XG4gICAgICBzd2l0Y2ggKGNsYXNzTmFtZSkge1xuICAgICAgICBjYXNlICdbb2JqZWN0IFN0cmluZ10nOlxuICAgICAgICAgIFN0cmluZyhhKSA9PT0gU3RyaW5nKGIpO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlICdbb2JqZWN0IE51bWJlcl0nOlxuICAgICAgICAgIGEgPSArYTtcbiAgICAgICAgICBiID0gK2I7XG4gICAgICAgICAgaWYgKGEgIT09IGEpIHtcbiAgICAgICAgICAgIGIgIT09IGI7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGlmIChhID09PSAwKSB7XG4gICAgICAgICAgICAgIDEgLyBhID09PSAxIC8gYjtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIGEgPT09IGI7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlICdbb2JqZWN0IEJvb2xlYW5dJzpcbiAgICAgICAgICArYSA9PT0gK2I7XG4gICAgICB9XG4gICAgICBpZiAodHlwZW9mIGEgIT09ICdvYmplY3QnIHx8IHR5cGVvZiBiICE9PSAnb2JqZWN0Jykge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9XG4gICAgICBsZW5ndGggPSBzdGFjay5sZW5ndGg7XG4gICAgICB3aGlsZSAobGVuZ3RoLS0pIHtcbiAgICAgICAgaWYgKHN0YWNrW2xlbmd0aF0gPT09IGEpIHtcbiAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgc3RhY2sucHVzaChhKTtcbiAgICAgIHNpemUgPSAwO1xuICAgICAgcmVzdWx0ID0gdHJ1ZTtcbiAgICAgIGlmIChjbGFzc05hbWUgPT09ICdbb2JqZWN0IEFycmF5XScpIHtcbiAgICAgICAgc2l6ZSA9IGEubGVuZ3RoO1xuICAgICAgICByZXN1bHQgPSBzaXplID09PSBiLmxlbmd0aDtcbiAgICAgICAgaWYgKHJlc3VsdCkge1xuICAgICAgICAgIHdoaWxlIChzaXplLS0pIHtcbiAgICAgICAgICAgIGlmICghKHJlc3VsdCA9IF9faW5kZXhPZi5jYWxsKGEsIHNpemUpID49IDAgPT09IF9faW5kZXhPZi5jYWxsKGIsIHNpemUpID49IDAgJiYgX2lzRXF1YWwoYVtzaXplXSwgYltzaXplXSwgc3RhY2spKSkge1xuICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGlmIChfX2luZGV4T2YuY2FsbChhLCBcImNvbnN0cnVjdG9yXCIpID49IDAgIT09IF9faW5kZXhPZi5jYWxsKGIsIFwiY29uc3RydWN0b3JcIikgPj0gMCB8fCBhLmNvbnN0cnVjdG9yICE9PSBiLmNvbnN0cnVjdG9yKSB7XG4gICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG4gICAgICAgIGZvciAoa2V5IGluIGEpIHtcbiAgICAgICAgICBpZiAoaGFzT3duUHJvcGVydHkuY2FsbChhLCBrZXkpKSB7XG4gICAgICAgICAgICBzaXplKys7XG4gICAgICAgICAgICBpZiAoIShyZXN1bHQgPSBoYXNPd25Qcm9wZXJ0eS5jYWxsKGIsIGtleSkgJiYgX2lzRXF1YWwoYVtrZXldLCBiW2tleV0sIHN0YWNrKSkpIHtcbiAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGlmIChyZXN1bHQpIHtcbiAgICAgICAgICBmb3IgKGtleSBpbiBiKSB7XG4gICAgICAgICAgICBpZiAoaGFzT3duUHJvcGVydHkuY2FsbChiLCBrZXkpICYmICFzaXplLS0pIHtcbiAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICAgIHJlc3VsdCA9ICFzaXplO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBzdGFjay5wb3AoKTtcbiAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfTtcbiAgICBpc0VxdWFsID0gZnVuY3Rpb24oYSwgYikge1xuICAgICAgcmV0dXJuIF9pc0VxdWFsKGEsIGIsIFtdKTtcbiAgICB9O1xuICAgIEpTT05QYXRjaEVycm9yID0gKGZ1bmN0aW9uKF9zdXBlcikge1xuICAgICAgX19leHRlbmRzKEpTT05QYXRjaEVycm9yLCBfc3VwZXIpO1xuXG4gICAgICBmdW5jdGlvbiBKU09OUGF0Y2hFcnJvcihtZXNzYWdlKSB7XG4gICAgICAgIHRoaXMubWVzc2FnZSA9IG1lc3NhZ2UgIT0gbnVsbCA/IG1lc3NhZ2UgOiAnSlNPTiBwYXRjaCBlcnJvcic7XG4gICAgICAgIHRoaXMubmFtZSA9ICdKU09OUGF0Y2hFcnJvcic7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBKU09OUGF0Y2hFcnJvcjtcblxuICAgIH0pKEVycm9yKTtcbiAgICBJbnZhbGlkUG9pbnRlckVycm9yID0gKGZ1bmN0aW9uKF9zdXBlcikge1xuICAgICAgX19leHRlbmRzKEludmFsaWRQb2ludGVyRXJyb3IsIF9zdXBlcik7XG5cbiAgICAgIGZ1bmN0aW9uIEludmFsaWRQb2ludGVyRXJyb3IobWVzc2FnZSkge1xuICAgICAgICB0aGlzLm1lc3NhZ2UgPSBtZXNzYWdlICE9IG51bGwgPyBtZXNzYWdlIDogJ0ludmFsaWQgcG9pbnRlcic7XG4gICAgICAgIHRoaXMubmFtZSA9ICdJbnZhbGlkUG9pbnRlcic7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBJbnZhbGlkUG9pbnRlckVycm9yO1xuXG4gICAgfSkoRXJyb3IpO1xuICAgIEludmFsaWRQYXRjaEVycm9yID0gKGZ1bmN0aW9uKF9zdXBlcikge1xuICAgICAgX19leHRlbmRzKEludmFsaWRQYXRjaEVycm9yLCBfc3VwZXIpO1xuXG4gICAgICBmdW5jdGlvbiBJbnZhbGlkUGF0Y2hFcnJvcihtZXNzYWdlKSB7XG4gICAgICAgIHRoaXMubWVzc2FnZSA9IG1lc3NhZ2UgIT0gbnVsbCA/IG1lc3NhZ2UgOiAnSW52YWxpZCBwYXRjaCc7XG4gICAgICAgIHRoaXMubmFtZSA9ICdJbnZhbGlkUGF0Y2gnO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gSW52YWxpZFBhdGNoRXJyb3I7XG5cbiAgICB9KShKU09OUGF0Y2hFcnJvcik7XG4gICAgUGF0Y2hDb25mbGljdEVycm9yID0gKGZ1bmN0aW9uKF9zdXBlcikge1xuICAgICAgX19leHRlbmRzKFBhdGNoQ29uZmxpY3RFcnJvciwgX3N1cGVyKTtcblxuICAgICAgZnVuY3Rpb24gUGF0Y2hDb25mbGljdEVycm9yKG1lc3NhZ2UpIHtcbiAgICAgICAgdGhpcy5tZXNzYWdlID0gbWVzc2FnZSAhPSBudWxsID8gbWVzc2FnZSA6ICdQYXRjaCBjb25mbGljdCc7XG4gICAgICAgIHRoaXMubmFtZSA9ICdQYXRjaENvbmZsaWN0RXJyb3InO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gUGF0Y2hDb25mbGljdEVycm9yO1xuXG4gICAgfSkoSlNPTlBhdGNoRXJyb3IpO1xuICAgIEpTT05Qb2ludGVyID0gKGZ1bmN0aW9uKCkge1xuICAgICAgZnVuY3Rpb24gSlNPTlBvaW50ZXIocGF0aCkge1xuICAgICAgICB2YXIgaSwgc3RlcCwgc3RlcHMsIF9pLCBfbGVuO1xuXG4gICAgICAgIHN0ZXBzID0gW107XG4gICAgICAgIGlmIChwYXRoICYmIChzdGVwcyA9IHBhdGguc3BsaXQoJy8nKSkuc2hpZnQoKSAhPT0gJycpIHtcbiAgICAgICAgICB0aHJvdyBuZXcgSW52YWxpZFBvaW50ZXJFcnJvcigpO1xuICAgICAgICB9XG4gICAgICAgIGZvciAoaSA9IF9pID0gMCwgX2xlbiA9IHN0ZXBzLmxlbmd0aDsgX2kgPCBfbGVuOyBpID0gKytfaSkge1xuICAgICAgICAgIHN0ZXAgPSBzdGVwc1tpXTtcbiAgICAgICAgICBzdGVwc1tpXSA9IHN0ZXAucmVwbGFjZSgnfjEnLCAnLycpLnJlcGxhY2UoJ34wJywgJ34nKTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLmFjY2Vzc29yID0gc3RlcHMucG9wKCk7XG4gICAgICAgIHRoaXMuc3RlcHMgPSBzdGVwcztcbiAgICAgICAgdGhpcy5wYXRoID0gcGF0aDtcbiAgICAgIH1cblxuICAgICAgSlNPTlBvaW50ZXIucHJvdG90eXBlLmdldFJlZmVyZW5jZSA9IGZ1bmN0aW9uKHBhcmVudCkge1xuICAgICAgICB2YXIgc3RlcCwgX2ksIF9sZW4sIF9yZWY7XG5cbiAgICAgICAgX3JlZiA9IHRoaXMuc3RlcHM7XG4gICAgICAgIGZvciAoX2kgPSAwLCBfbGVuID0gX3JlZi5sZW5ndGg7IF9pIDwgX2xlbjsgX2krKykge1xuICAgICAgICAgIHN0ZXAgPSBfcmVmW19pXTtcbiAgICAgICAgICBpZiAoaXNBcnJheShwYXJlbnQpKSB7XG4gICAgICAgICAgICBzdGVwID0gcGFyc2VJbnQoc3RlcCwgMTApO1xuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAoIShzdGVwIGluIHBhcmVudCkpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBQYXRjaENvbmZsaWN0RXJyb3IoJ0FycmF5IGxvY2F0aW9uIG91dCBvZiAnLCAnYm91bmRzIG9yIG5vdCBhbiBpbnN0YW5jZSBwcm9wZXJ0eScpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBwYXJlbnQgPSBwYXJlbnRbc3RlcF07XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHBhcmVudDtcbiAgICAgIH07XG5cbiAgICAgIEpTT05Qb2ludGVyLnByb3RvdHlwZS5jb2VyY2UgPSBmdW5jdGlvbihyZWZlcmVuY2UsIGFjY2Vzc29yKSB7XG4gICAgICAgIGlmIChpc0FycmF5KHJlZmVyZW5jZSkpIHtcbiAgICAgICAgICBpZiAoaXNTdHJpbmcoYWNjZXNzb3IpKSB7XG4gICAgICAgICAgICBpZiAoYWNjZXNzb3IgPT09ICctJykge1xuICAgICAgICAgICAgICBhY2Nlc3NvciA9IHJlZmVyZW5jZS5sZW5ndGg7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKC9eWy0rXT9cXGQrJC8udGVzdChhY2Nlc3NvcikpIHtcbiAgICAgICAgICAgICAgYWNjZXNzb3IgPSBwYXJzZUludChhY2Nlc3NvciwgMTApO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgdGhyb3cgbmV3IEludmFsaWRQb2ludGVyRXJyb3IoJ0ludmFsaWQgYXJyYXkgaW5kZXggbnVtYmVyJyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBhY2Nlc3NvcjtcbiAgICAgIH07XG5cbiAgICAgIHJldHVybiBKU09OUG9pbnRlcjtcblxuICAgIH0pKCk7XG4gICAgSlNPTlBhdGNoID0gKGZ1bmN0aW9uKCkge1xuICAgICAgZnVuY3Rpb24gSlNPTlBhdGNoKHBhdGNoKSB7XG4gICAgICAgIGlmICghKCdwYXRoJyBpbiBwYXRjaCkpIHtcbiAgICAgICAgICB0aHJvdyBuZXcgSW52YWxpZFBhdGNoRXJyb3IoKTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLnZhbGlkYXRlKHBhdGNoKTtcbiAgICAgICAgdGhpcy5wYXRjaCA9IHBhdGNoO1xuICAgICAgICB0aGlzLnBhdGggPSBuZXcgSlNPTlBvaW50ZXIocGF0Y2gucGF0aCk7XG4gICAgICAgIHRoaXMuaW5pdGlhbGl6ZShwYXRjaCk7XG4gICAgICB9XG5cbiAgICAgIEpTT05QYXRjaC5wcm90b3R5cGUuaW5pdGlhbGl6ZSA9IGZ1bmN0aW9uKCkge307XG5cbiAgICAgIEpTT05QYXRjaC5wcm90b3R5cGUudmFsaWRhdGUgPSBmdW5jdGlvbihwYXRjaCkge307XG5cbiAgICAgIEpTT05QYXRjaC5wcm90b3R5cGUuYXBwbHkgPSBmdW5jdGlvbihkb2N1bWVudCkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ01ldGhvZCBub3QgaW1wbGVtZW50ZWQnKTtcbiAgICAgIH07XG5cbiAgICAgIHJldHVybiBKU09OUGF0Y2g7XG5cbiAgICB9KSgpO1xuICAgIEFkZFBhdGNoID0gKGZ1bmN0aW9uKF9zdXBlcikge1xuICAgICAgX19leHRlbmRzKEFkZFBhdGNoLCBfc3VwZXIpO1xuXG4gICAgICBmdW5jdGlvbiBBZGRQYXRjaCgpIHtcbiAgICAgICAgX3JlZiA9IEFkZFBhdGNoLl9fc3VwZXJfXy5jb25zdHJ1Y3Rvci5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgICAgICByZXR1cm4gX3JlZjtcbiAgICAgIH1cblxuICAgICAgQWRkUGF0Y2gucHJvdG90eXBlLnZhbGlkYXRlID0gZnVuY3Rpb24ocGF0Y2gpIHtcbiAgICAgICAgaWYgKCEoJ3ZhbHVlJyBpbiBwYXRjaCkpIHtcbiAgICAgICAgICB0aHJvdyBuZXcgSW52YWxpZFBhdGNoRXJyb3IoKTtcbiAgICAgICAgfVxuICAgICAgfTtcblxuICAgICAgQWRkUGF0Y2gucHJvdG90eXBlLmFwcGx5ID0gZnVuY3Rpb24oZG9jdW1lbnQpIHtcbiAgICAgICAgdmFyIGFjY2Vzc29yLCByZWZlcmVuY2UsIHZhbHVlO1xuXG4gICAgICAgIHJlZmVyZW5jZSA9IHRoaXMucGF0aC5nZXRSZWZlcmVuY2UoZG9jdW1lbnQpO1xuICAgICAgICBhY2Nlc3NvciA9IHRoaXMucGF0aC5hY2Nlc3NvcjtcbiAgICAgICAgdmFsdWUgPSB0aGlzLnBhdGNoLnZhbHVlO1xuICAgICAgICBpZiAoaXNBcnJheShyZWZlcmVuY2UpKSB7XG4gICAgICAgICAgYWNjZXNzb3IgPSB0aGlzLnBhdGguY29lcmNlKHJlZmVyZW5jZSwgYWNjZXNzb3IpO1xuICAgICAgICAgIGlmIChhY2Nlc3NvciA8IDAgfHwgYWNjZXNzb3IgPiByZWZlcmVuY2UubGVuZ3RoKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgUGF0Y2hDb25mbGljdEVycm9yKFwiSW5kZXggXCIgKyBhY2Nlc3NvciArIFwiIG91dCBvZiBib3VuZHNcIik7XG4gICAgICAgICAgfVxuICAgICAgICAgIHJlZmVyZW5jZS5zcGxpY2UoYWNjZXNzb3IsIDAsIHZhbHVlKTtcbiAgICAgICAgfSBlbHNlIGlmIChhY2Nlc3NvciA9PSBudWxsKSB7XG4gICAgICAgICAgZG9jdW1lbnQgPSB2YWx1ZTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICByZWZlcmVuY2VbYWNjZXNzb3JdID0gdmFsdWU7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGRvY3VtZW50O1xuICAgICAgfTtcblxuICAgICAgcmV0dXJuIEFkZFBhdGNoO1xuXG4gICAgfSkoSlNPTlBhdGNoKTtcbiAgICBSZW1vdmVQYXRjaCA9IChmdW5jdGlvbihfc3VwZXIpIHtcbiAgICAgIF9fZXh0ZW5kcyhSZW1vdmVQYXRjaCwgX3N1cGVyKTtcblxuICAgICAgZnVuY3Rpb24gUmVtb3ZlUGF0Y2goKSB7XG4gICAgICAgIF9yZWYxID0gUmVtb3ZlUGF0Y2guX19zdXBlcl9fLmNvbnN0cnVjdG9yLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgICAgIHJldHVybiBfcmVmMTtcbiAgICAgIH1cblxuICAgICAgUmVtb3ZlUGF0Y2gucHJvdG90eXBlLmFwcGx5ID0gZnVuY3Rpb24oZG9jdW1lbnQpIHtcbiAgICAgICAgdmFyIGFjY2Vzc29yLCByZWZlcmVuY2U7XG5cbiAgICAgICAgcmVmZXJlbmNlID0gdGhpcy5wYXRoLmdldFJlZmVyZW5jZShkb2N1bWVudCk7XG4gICAgICAgIGFjY2Vzc29yID0gdGhpcy5wYXRoLmFjY2Vzc29yO1xuICAgICAgICBpZiAoaXNBcnJheShyZWZlcmVuY2UpKSB7XG4gICAgICAgICAgYWNjZXNzb3IgPSB0aGlzLnBhdGguY29lcmNlKHJlZmVyZW5jZSwgYWNjZXNzb3IpO1xuICAgICAgICAgIGlmICghKGFjY2Vzc29yIGluIHJlZmVyZW5jZSkpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBQYXRjaENvbmZsaWN0RXJyb3IoXCJWYWx1ZSBhdCBcIiArIGFjY2Vzc29yICsgXCIgZG9lcyBub3QgZXhpc3RcIik7XG4gICAgICAgICAgfVxuICAgICAgICAgIHJlZmVyZW5jZS5zcGxpY2UoYWNjZXNzb3IsIDEpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGlmICghKGFjY2Vzc29yIGluIHJlZmVyZW5jZSkpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBQYXRjaENvbmZsaWN0RXJyb3IoXCJWYWx1ZSBhdCBcIiArIGFjY2Vzc29yICsgXCIgZG9lcyBub3QgZXhpc3RcIik7XG4gICAgICAgICAgfVxuICAgICAgICAgIGRlbGV0ZSByZWZlcmVuY2VbYWNjZXNzb3JdO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBkb2N1bWVudDtcbiAgICAgIH07XG5cbiAgICAgIHJldHVybiBSZW1vdmVQYXRjaDtcblxuICAgIH0pKEpTT05QYXRjaCk7XG4gICAgUmVwbGFjZVBhdGNoID0gKGZ1bmN0aW9uKF9zdXBlcikge1xuICAgICAgX19leHRlbmRzKFJlcGxhY2VQYXRjaCwgX3N1cGVyKTtcblxuICAgICAgZnVuY3Rpb24gUmVwbGFjZVBhdGNoKCkge1xuICAgICAgICBfcmVmMiA9IFJlcGxhY2VQYXRjaC5fX3N1cGVyX18uY29uc3RydWN0b3IuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICAgICAgcmV0dXJuIF9yZWYyO1xuICAgICAgfVxuXG4gICAgICBSZXBsYWNlUGF0Y2gucHJvdG90eXBlLnZhbGlkYXRlID0gZnVuY3Rpb24ocGF0Y2gpIHtcbiAgICAgICAgaWYgKCEoJ3ZhbHVlJyBpbiBwYXRjaCkpIHtcbiAgICAgICAgICB0aHJvdyBuZXcgSW52YWxpZFBhdGNoRXJyb3IoKTtcbiAgICAgICAgfVxuICAgICAgfTtcblxuICAgICAgUmVwbGFjZVBhdGNoLnByb3RvdHlwZS5hcHBseSA9IGZ1bmN0aW9uKGRvY3VtZW50KSB7XG4gICAgICAgIHZhciBhY2Nlc3NvciwgcmVmZXJlbmNlLCB2YWx1ZTtcblxuICAgICAgICByZWZlcmVuY2UgPSB0aGlzLnBhdGguZ2V0UmVmZXJlbmNlKGRvY3VtZW50KTtcbiAgICAgICAgYWNjZXNzb3IgPSB0aGlzLnBhdGguYWNjZXNzb3I7XG4gICAgICAgIHZhbHVlID0gdGhpcy5wYXRjaC52YWx1ZTtcbiAgICAgICAgaWYgKGlzQXJyYXkocmVmZXJlbmNlKSkge1xuICAgICAgICAgIGFjY2Vzc29yID0gdGhpcy5wYXRoLmNvZXJjZShyZWZlcmVuY2UsIGFjY2Vzc29yKTtcbiAgICAgICAgICBpZiAoIShhY2Nlc3NvciBpbiByZWZlcmVuY2UpKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgUGF0Y2hDb25mbGljdEVycm9yKFwiVmFsdWUgYXQgXCIgKyBhY2Nlc3NvciArIFwiIGRvZXMgbm90IGV4aXN0XCIpO1xuICAgICAgICAgIH1cbiAgICAgICAgICByZWZlcmVuY2Uuc3BsaWNlKGFjY2Vzc29yLCAxLCB2YWx1ZSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgaWYgKCEoYWNjZXNzb3IgaW4gcmVmZXJlbmNlKSkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IFBhdGNoQ29uZmxpY3RFcnJvcihcIlZhbHVlIGF0IFwiICsgYWNjZXNzb3IgKyBcIiBkb2VzIG5vdCBleGlzdFwiKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgcmVmZXJlbmNlW2FjY2Vzc29yXSA9IHZhbHVlO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBkb2N1bWVudDtcbiAgICAgIH07XG5cbiAgICAgIHJldHVybiBSZXBsYWNlUGF0Y2g7XG5cbiAgICB9KShKU09OUGF0Y2gpO1xuICAgIFRlc3RQYXRjaCA9IChmdW5jdGlvbihfc3VwZXIpIHtcbiAgICAgIF9fZXh0ZW5kcyhUZXN0UGF0Y2gsIF9zdXBlcik7XG5cbiAgICAgIGZ1bmN0aW9uIFRlc3RQYXRjaCgpIHtcbiAgICAgICAgX3JlZjMgPSBUZXN0UGF0Y2guX19zdXBlcl9fLmNvbnN0cnVjdG9yLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgICAgIHJldHVybiBfcmVmMztcbiAgICAgIH1cblxuICAgICAgVGVzdFBhdGNoLnByb3RvdHlwZS52YWxpZGF0ZSA9IGZ1bmN0aW9uKHBhdGNoKSB7XG4gICAgICAgIGlmICghKCd2YWx1ZScgaW4gcGF0Y2gpKSB7XG4gICAgICAgICAgdGhyb3cgbmV3IEludmFsaWRQYXRjaEVycm9yKCk7XG4gICAgICAgIH1cbiAgICAgIH07XG5cbiAgICAgIFRlc3RQYXRjaC5wcm90b3R5cGUuYXBwbHkgPSBmdW5jdGlvbihkb2N1bWVudCkge1xuICAgICAgICB2YXIgYWNjZXNzb3IsIHJlZmVyZW5jZSwgdmFsdWU7XG5cbiAgICAgICAgcmVmZXJlbmNlID0gdGhpcy5wYXRoLmdldFJlZmVyZW5jZShkb2N1bWVudCk7XG4gICAgICAgIGFjY2Vzc29yID0gdGhpcy5wYXRoLmFjY2Vzc29yO1xuICAgICAgICB2YWx1ZSA9IHRoaXMucGF0Y2gudmFsdWU7XG4gICAgICAgIGlmIChpc0FycmF5KHJlZmVyZW5jZSkpIHtcbiAgICAgICAgICBhY2Nlc3NvciA9IHRoaXMucGF0aC5jb2VyY2UocmVmZXJlbmNlLCBhY2Nlc3Nvcik7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGlzRXF1YWwocmVmZXJlbmNlW2FjY2Vzc29yXSwgdmFsdWUpO1xuICAgICAgfTtcblxuICAgICAgcmV0dXJuIFRlc3RQYXRjaDtcblxuICAgIH0pKEpTT05QYXRjaCk7XG4gICAgTW92ZVBhdGNoID0gKGZ1bmN0aW9uKF9zdXBlcikge1xuICAgICAgX19leHRlbmRzKE1vdmVQYXRjaCwgX3N1cGVyKTtcblxuICAgICAgZnVuY3Rpb24gTW92ZVBhdGNoKCkge1xuICAgICAgICBfcmVmNCA9IE1vdmVQYXRjaC5fX3N1cGVyX18uY29uc3RydWN0b3IuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICAgICAgcmV0dXJuIF9yZWY0O1xuICAgICAgfVxuXG4gICAgICBNb3ZlUGF0Y2gucHJvdG90eXBlLmluaXRpYWxpemUgPSBmdW5jdGlvbihwYXRjaCkge1xuICAgICAgICB2YXIgaSwgbGVuLCB3aXRoaW4sIF9pO1xuXG4gICAgICAgIHRoaXMuZnJvbSA9IG5ldyBKU09OUG9pbnRlcihwYXRjaC5mcm9tKTtcbiAgICAgICAgbGVuID0gdGhpcy5mcm9tLnN0ZXBzLmxlbmd0aDtcbiAgICAgICAgd2l0aGluID0gdHJ1ZTtcbiAgICAgICAgZm9yIChpID0gX2kgPSAwOyAwIDw9IGxlbiA/IF9pIDw9IGxlbiA6IF9pID49IGxlbjsgaSA9IDAgPD0gbGVuID8gKytfaSA6IC0tX2kpIHtcbiAgICAgICAgICBpZiAodGhpcy5mcm9tLnN0ZXBzW2ldICE9PSB0aGlzLnBhdGguc3RlcHNbaV0pIHtcbiAgICAgICAgICAgIHdpdGhpbiA9IGZhbHNlO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGlmICh3aXRoaW4pIHtcbiAgICAgICAgICBpZiAodGhpcy5wYXRoLnN0ZXBzLmxlbmd0aCAhPT0gbGVuKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgSW52YWxpZFBhdGNoRXJyb3IoXCIndG8nIG1lbWJlciBjYW5ub3QgYmUgYSBkZXNjZW5kZW50IG9mICdwYXRoJ1wiKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKHRoaXMuZnJvbS5hY2Nlc3NvciA9PT0gdGhpcy5wYXRoLmFjY2Vzc29yKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5hcHBseSA9IGZ1bmN0aW9uKGRvY3VtZW50KSB7XG4gICAgICAgICAgICAgIHJldHVybiBkb2N1bWVudDtcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9O1xuXG4gICAgICBNb3ZlUGF0Y2gucHJvdG90eXBlLnZhbGlkYXRlID0gZnVuY3Rpb24ocGF0Y2gpIHtcbiAgICAgICAgaWYgKCEoJ2Zyb20nIGluIHBhdGNoKSkge1xuICAgICAgICAgIHRocm93IG5ldyBJbnZhbGlkUGF0Y2hFcnJvcigpO1xuICAgICAgICB9XG4gICAgICB9O1xuXG4gICAgICBNb3ZlUGF0Y2gucHJvdG90eXBlLmFwcGx5ID0gZnVuY3Rpb24oZG9jdW1lbnQpIHtcbiAgICAgICAgdmFyIGFjY2Vzc29yLCByZWZlcmVuY2UsIHZhbHVlO1xuXG4gICAgICAgIHJlZmVyZW5jZSA9IHRoaXMuZnJvbS5nZXRSZWZlcmVuY2UoZG9jdW1lbnQpO1xuICAgICAgICBhY2Nlc3NvciA9IHRoaXMuZnJvbS5hY2Nlc3NvcjtcbiAgICAgICAgaWYgKGlzQXJyYXkocmVmZXJlbmNlKSkge1xuICAgICAgICAgIGFjY2Vzc29yID0gdGhpcy5mcm9tLmNvZXJjZShyZWZlcmVuY2UsIGFjY2Vzc29yKTtcbiAgICAgICAgICBpZiAoIShhY2Nlc3NvciBpbiByZWZlcmVuY2UpKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgUGF0Y2hDb25mbGljdEVycm9yKFwiVmFsdWUgYXQgXCIgKyBhY2Nlc3NvciArIFwiIGRvZXMgbm90IGV4aXN0XCIpO1xuICAgICAgICAgIH1cbiAgICAgICAgICB2YWx1ZSA9IHJlZmVyZW5jZS5zcGxpY2UoYWNjZXNzb3IsIDEpWzBdO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGlmICghKGFjY2Vzc29yIGluIHJlZmVyZW5jZSkpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBQYXRjaENvbmZsaWN0RXJyb3IoXCJWYWx1ZSBhdCBcIiArIGFjY2Vzc29yICsgXCIgZG9lcyBub3QgZXhpc3RcIik7XG4gICAgICAgICAgfVxuICAgICAgICAgIHZhbHVlID0gcmVmZXJlbmNlW2FjY2Vzc29yXTtcbiAgICAgICAgICBkZWxldGUgcmVmZXJlbmNlW2FjY2Vzc29yXTtcbiAgICAgICAgfVxuICAgICAgICByZWZlcmVuY2UgPSB0aGlzLnBhdGguZ2V0UmVmZXJlbmNlKGRvY3VtZW50KTtcbiAgICAgICAgYWNjZXNzb3IgPSB0aGlzLnBhdGguYWNjZXNzb3I7XG4gICAgICAgIGlmIChpc0FycmF5KHJlZmVyZW5jZSkpIHtcbiAgICAgICAgICBhY2Nlc3NvciA9IHRoaXMucGF0aC5jb2VyY2UocmVmZXJlbmNlLCBhY2Nlc3Nvcik7XG4gICAgICAgICAgaWYgKGFjY2Vzc29yIDwgMCB8fCBhY2Nlc3NvciA+IHJlZmVyZW5jZS5sZW5ndGgpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBQYXRjaENvbmZsaWN0RXJyb3IoXCJJbmRleCBcIiArIGFjY2Vzc29yICsgXCIgb3V0IG9mIGJvdW5kc1wiKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgcmVmZXJlbmNlLnNwbGljZShhY2Nlc3NvciwgMCwgdmFsdWUpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGlmIChhY2Nlc3NvciBpbiByZWZlcmVuY2UpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBQYXRjaENvbmZsaWN0RXJyb3IoXCJWYWx1ZSBhdCBcIiArIGFjY2Vzc29yICsgXCIgZXhpc3RzXCIpO1xuICAgICAgICAgIH1cbiAgICAgICAgICByZWZlcmVuY2VbYWNjZXNzb3JdID0gdmFsdWU7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGRvY3VtZW50O1xuICAgICAgfTtcblxuICAgICAgcmV0dXJuIE1vdmVQYXRjaDtcblxuICAgIH0pKEpTT05QYXRjaCk7XG4gICAgQ29weVBhdGNoID0gKGZ1bmN0aW9uKF9zdXBlcikge1xuICAgICAgX19leHRlbmRzKENvcHlQYXRjaCwgX3N1cGVyKTtcblxuICAgICAgZnVuY3Rpb24gQ29weVBhdGNoKCkge1xuICAgICAgICBfcmVmNSA9IENvcHlQYXRjaC5fX3N1cGVyX18uY29uc3RydWN0b3IuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICAgICAgcmV0dXJuIF9yZWY1O1xuICAgICAgfVxuXG4gICAgICBDb3B5UGF0Y2gucHJvdG90eXBlLmFwcGx5ID0gZnVuY3Rpb24oZG9jdW1lbnQpIHtcbiAgICAgICAgdmFyIGFjY2Vzc29yLCByZWZlcmVuY2UsIHZhbHVlO1xuXG4gICAgICAgIHJlZmVyZW5jZSA9IHRoaXMuZnJvbS5nZXRSZWZlcmVuY2UoZG9jdW1lbnQpO1xuICAgICAgICBhY2Nlc3NvciA9IHRoaXMuZnJvbS5hY2Nlc3NvcjtcbiAgICAgICAgaWYgKGlzQXJyYXkocmVmZXJlbmNlKSkge1xuICAgICAgICAgIGFjY2Vzc29yID0gdGhpcy5mcm9tLmNvZXJjZShyZWZlcmVuY2UsIGFjY2Vzc29yKTtcbiAgICAgICAgICBpZiAoIShhY2Nlc3NvciBpbiByZWZlcmVuY2UpKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgUGF0Y2hDb25mbGljdEVycm9yKFwiVmFsdWUgYXQgXCIgKyBhY2Nlc3NvciArIFwiIGRvZXMgbm90IGV4aXN0XCIpO1xuICAgICAgICAgIH1cbiAgICAgICAgICB2YWx1ZSA9IHJlZmVyZW5jZS5zbGljZShhY2Nlc3NvciwgYWNjZXNzb3IgKyAxKVswXTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBpZiAoIShhY2Nlc3NvciBpbiByZWZlcmVuY2UpKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgUGF0Y2hDb25mbGljdEVycm9yKFwiVmFsdWUgYXQgXCIgKyBhY2Nlc3NvciArIFwiIGRvZXMgbm90IGV4aXN0XCIpO1xuICAgICAgICAgIH1cbiAgICAgICAgICB2YWx1ZSA9IHJlZmVyZW5jZVthY2Nlc3Nvcl07XG4gICAgICAgIH1cbiAgICAgICAgcmVmZXJlbmNlID0gdGhpcy5wYXRoLmdldFJlZmVyZW5jZShkb2N1bWVudCk7XG4gICAgICAgIGFjY2Vzc29yID0gdGhpcy5wYXRoLmFjY2Vzc29yO1xuICAgICAgICBpZiAoaXNBcnJheShyZWZlcmVuY2UpKSB7XG4gICAgICAgICAgYWNjZXNzb3IgPSB0aGlzLnBhdGguY29lcmNlKHJlZmVyZW5jZSwgYWNjZXNzb3IpO1xuICAgICAgICAgIGlmIChhY2Nlc3NvciA8IDAgfHwgYWNjZXNzb3IgPiByZWZlcmVuY2UubGVuZ3RoKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgUGF0Y2hDb25mbGljdEVycm9yKFwiSW5kZXggXCIgKyBhY2Nlc3NvciArIFwiIG91dCBvZiBib3VuZHNcIik7XG4gICAgICAgICAgfVxuICAgICAgICAgIHJlZmVyZW5jZS5zcGxpY2UoYWNjZXNzb3IsIDAsIHZhbHVlKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBpZiAoYWNjZXNzb3IgaW4gcmVmZXJlbmNlKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgUGF0Y2hDb25mbGljdEVycm9yKFwiVmFsdWUgYXQgXCIgKyBhY2Nlc3NvciArIFwiIGV4aXN0c1wiKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgcmVmZXJlbmNlW2FjY2Vzc29yXSA9IHZhbHVlO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBkb2N1bWVudDtcbiAgICAgIH07XG5cbiAgICAgIHJldHVybiBDb3B5UGF0Y2g7XG5cbiAgICB9KShNb3ZlUGF0Y2gpO1xuICAgIG9wZXJhdGlvbk1hcCA9IHtcbiAgICAgIGFkZDogQWRkUGF0Y2gsXG4gICAgICByZW1vdmU6IFJlbW92ZVBhdGNoLFxuICAgICAgcmVwbGFjZTogUmVwbGFjZVBhdGNoLFxuICAgICAgbW92ZTogTW92ZVBhdGNoLFxuICAgICAgY29weTogQ29weVBhdGNoLFxuICAgICAgdGVzdDogVGVzdFBhdGNoXG4gICAgfTtcbiAgICBjb21waWxlID0gZnVuY3Rpb24ocGF0Y2gpIHtcbiAgICAgIHZhciBrbGFzcywgb3BzLCBwLCBfaSwgX2xlbjtcblxuICAgICAgb3BzID0gW107XG4gICAgICBmb3IgKF9pID0gMCwgX2xlbiA9IHBhdGNoLmxlbmd0aDsgX2kgPCBfbGVuOyBfaSsrKSB7XG4gICAgICAgIHAgPSBwYXRjaFtfaV07XG4gICAgICAgIGlmICghKGtsYXNzID0gb3BlcmF0aW9uTWFwW3Aub3BdKSkge1xuICAgICAgICAgIHRocm93IG5ldyBJbnZhbGlkUGF0Y2hFcnJvcigpO1xuICAgICAgICB9XG4gICAgICAgIG9wcy5wdXNoKG5ldyBrbGFzcyhwKSk7XG4gICAgICB9XG4gICAgICByZXR1cm4gZnVuY3Rpb24oZG9jdW1lbnQpIHtcbiAgICAgICAgdmFyIG9wLCByZXN1bHQsIF9qLCBfbGVuMTtcblxuICAgICAgICByZXN1bHQgPSBkb2N1bWVudDtcbiAgICAgICAgZm9yIChfaiA9IDAsIF9sZW4xID0gb3BzLmxlbmd0aDsgX2ogPCBfbGVuMTsgX2orKykge1xuICAgICAgICAgIG9wID0gb3BzW19qXTtcbiAgICAgICAgICByZXN1bHQgPSBvcC5hcHBseShkb2N1bWVudCk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICAgIH07XG4gICAgfTtcbiAgICBhcHBseSA9IGZ1bmN0aW9uKGRvY3VtZW50LCBwYXRjaCkge1xuICAgICAgcmV0dXJuIGNvbXBpbGUocGF0Y2gpKGRvY3VtZW50KTtcbiAgICB9O1xuICAgIHJvb3QuYXBwbHkgPSBhcHBseTtcbiAgICByb290LmNvbXBpbGUgPSBjb21waWxlO1xuICAgIHJvb3QuSlNPTlBvaW50ZXIgPSBKU09OUG9pbnRlcjtcbiAgICByb290LkpTT05QYXRjaCA9IEpTT05QYXRjaDtcbiAgICByb290LkpTT05QYXRjaEVycm9yID0gSlNPTlBhdGNoRXJyb3I7XG4gICAgcm9vdC5JbnZhbGlkUG9pbnRlckVycm9yID0gSW52YWxpZFBvaW50ZXJFcnJvcjtcbiAgICByb290LkludmFsaWRQYXRjaEVycm9yID0gSW52YWxpZFBhdGNoRXJyb3I7XG4gICAgcm9vdC5QYXRjaENvbmZsaWN0RXJyb3IgPSBQYXRjaENvbmZsaWN0RXJyb3I7XG4gICAgcmV0dXJuIHJvb3Q7XG4gIH0pO1xuXG59KS5jYWxsKHRoaXMpO1xuIiwiLy8gICAgIFVuZGVyc2NvcmUuanMgMS41LjJcbi8vICAgICBodHRwOi8vdW5kZXJzY29yZWpzLm9yZ1xuLy8gICAgIChjKSAyMDA5LTIwMTMgSmVyZW15IEFzaGtlbmFzLCBEb2N1bWVudENsb3VkIGFuZCBJbnZlc3RpZ2F0aXZlIFJlcG9ydGVycyAmIEVkaXRvcnNcbi8vICAgICBVbmRlcnNjb3JlIG1heSBiZSBmcmVlbHkgZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIE1JVCBsaWNlbnNlLlxuXG4oZnVuY3Rpb24oKSB7XG5cbiAgLy8gQmFzZWxpbmUgc2V0dXBcbiAgLy8gLS0tLS0tLS0tLS0tLS1cblxuICAvLyBFc3RhYmxpc2ggdGhlIHJvb3Qgb2JqZWN0LCBgd2luZG93YCBpbiB0aGUgYnJvd3Nlciwgb3IgYGV4cG9ydHNgIG9uIHRoZSBzZXJ2ZXIuXG4gIHZhciByb290ID0gdGhpcztcblxuICAvLyBTYXZlIHRoZSBwcmV2aW91cyB2YWx1ZSBvZiB0aGUgYF9gIHZhcmlhYmxlLlxuICB2YXIgcHJldmlvdXNVbmRlcnNjb3JlID0gcm9vdC5fO1xuXG4gIC8vIEVzdGFibGlzaCB0aGUgb2JqZWN0IHRoYXQgZ2V0cyByZXR1cm5lZCB0byBicmVhayBvdXQgb2YgYSBsb29wIGl0ZXJhdGlvbi5cbiAgdmFyIGJyZWFrZXIgPSB7fTtcblxuICAvLyBTYXZlIGJ5dGVzIGluIHRoZSBtaW5pZmllZCAoYnV0IG5vdCBnemlwcGVkKSB2ZXJzaW9uOlxuICB2YXIgQXJyYXlQcm90byA9IEFycmF5LnByb3RvdHlwZSwgT2JqUHJvdG8gPSBPYmplY3QucHJvdG90eXBlLCBGdW5jUHJvdG8gPSBGdW5jdGlvbi5wcm90b3R5cGU7XG5cbiAgLy8gQ3JlYXRlIHF1aWNrIHJlZmVyZW5jZSB2YXJpYWJsZXMgZm9yIHNwZWVkIGFjY2VzcyB0byBjb3JlIHByb3RvdHlwZXMuXG4gIHZhclxuICAgIHB1c2ggICAgICAgICAgICAgPSBBcnJheVByb3RvLnB1c2gsXG4gICAgc2xpY2UgICAgICAgICAgICA9IEFycmF5UHJvdG8uc2xpY2UsXG4gICAgY29uY2F0ICAgICAgICAgICA9IEFycmF5UHJvdG8uY29uY2F0LFxuICAgIHRvU3RyaW5nICAgICAgICAgPSBPYmpQcm90by50b1N0cmluZyxcbiAgICBoYXNPd25Qcm9wZXJ0eSAgID0gT2JqUHJvdG8uaGFzT3duUHJvcGVydHk7XG5cbiAgLy8gQWxsICoqRUNNQVNjcmlwdCA1KiogbmF0aXZlIGZ1bmN0aW9uIGltcGxlbWVudGF0aW9ucyB0aGF0IHdlIGhvcGUgdG8gdXNlXG4gIC8vIGFyZSBkZWNsYXJlZCBoZXJlLlxuICB2YXJcbiAgICBuYXRpdmVGb3JFYWNoICAgICAgPSBBcnJheVByb3RvLmZvckVhY2gsXG4gICAgbmF0aXZlTWFwICAgICAgICAgID0gQXJyYXlQcm90by5tYXAsXG4gICAgbmF0aXZlUmVkdWNlICAgICAgID0gQXJyYXlQcm90by5yZWR1Y2UsXG4gICAgbmF0aXZlUmVkdWNlUmlnaHQgID0gQXJyYXlQcm90by5yZWR1Y2VSaWdodCxcbiAgICBuYXRpdmVGaWx0ZXIgICAgICAgPSBBcnJheVByb3RvLmZpbHRlcixcbiAgICBuYXRpdmVFdmVyeSAgICAgICAgPSBBcnJheVByb3RvLmV2ZXJ5LFxuICAgIG5hdGl2ZVNvbWUgICAgICAgICA9IEFycmF5UHJvdG8uc29tZSxcbiAgICBuYXRpdmVJbmRleE9mICAgICAgPSBBcnJheVByb3RvLmluZGV4T2YsXG4gICAgbmF0aXZlTGFzdEluZGV4T2YgID0gQXJyYXlQcm90by5sYXN0SW5kZXhPZixcbiAgICBuYXRpdmVJc0FycmF5ICAgICAgPSBBcnJheS5pc0FycmF5LFxuICAgIG5hdGl2ZUtleXMgICAgICAgICA9IE9iamVjdC5rZXlzLFxuICAgIG5hdGl2ZUJpbmQgICAgICAgICA9IEZ1bmNQcm90by5iaW5kO1xuXG4gIC8vIENyZWF0ZSBhIHNhZmUgcmVmZXJlbmNlIHRvIHRoZSBVbmRlcnNjb3JlIG9iamVjdCBmb3IgdXNlIGJlbG93LlxuICB2YXIgXyA9IGZ1bmN0aW9uKG9iaikge1xuICAgIGlmIChvYmogaW5zdGFuY2VvZiBfKSByZXR1cm4gb2JqO1xuICAgIGlmICghKHRoaXMgaW5zdGFuY2VvZiBfKSkgcmV0dXJuIG5ldyBfKG9iaik7XG4gICAgdGhpcy5fd3JhcHBlZCA9IG9iajtcbiAgfTtcblxuICAvLyBFeHBvcnQgdGhlIFVuZGVyc2NvcmUgb2JqZWN0IGZvciAqKk5vZGUuanMqKiwgd2l0aFxuICAvLyBiYWNrd2FyZHMtY29tcGF0aWJpbGl0eSBmb3IgdGhlIG9sZCBgcmVxdWlyZSgpYCBBUEkuIElmIHdlJ3JlIGluXG4gIC8vIHRoZSBicm93c2VyLCBhZGQgYF9gIGFzIGEgZ2xvYmFsIG9iamVjdCB2aWEgYSBzdHJpbmcgaWRlbnRpZmllcixcbiAgLy8gZm9yIENsb3N1cmUgQ29tcGlsZXIgXCJhZHZhbmNlZFwiIG1vZGUuXG4gIGlmICh0eXBlb2YgZXhwb3J0cyAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICBpZiAodHlwZW9mIG1vZHVsZSAhPT0gJ3VuZGVmaW5lZCcgJiYgbW9kdWxlLmV4cG9ydHMpIHtcbiAgICAgIGV4cG9ydHMgPSBtb2R1bGUuZXhwb3J0cyA9IF87XG4gICAgfVxuICAgIGV4cG9ydHMuXyA9IF87XG4gIH0gZWxzZSB7XG4gICAgcm9vdC5fID0gXztcbiAgfVxuXG4gIC8vIEN1cnJlbnQgdmVyc2lvbi5cbiAgXy5WRVJTSU9OID0gJzEuNS4yJztcblxuICAvLyBDb2xsZWN0aW9uIEZ1bmN0aW9uc1xuICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG4gIC8vIFRoZSBjb3JuZXJzdG9uZSwgYW4gYGVhY2hgIGltcGxlbWVudGF0aW9uLCBha2EgYGZvckVhY2hgLlxuICAvLyBIYW5kbGVzIG9iamVjdHMgd2l0aCB0aGUgYnVpbHQtaW4gYGZvckVhY2hgLCBhcnJheXMsIGFuZCByYXcgb2JqZWN0cy5cbiAgLy8gRGVsZWdhdGVzIHRvICoqRUNNQVNjcmlwdCA1KioncyBuYXRpdmUgYGZvckVhY2hgIGlmIGF2YWlsYWJsZS5cbiAgdmFyIGVhY2ggPSBfLmVhY2ggPSBfLmZvckVhY2ggPSBmdW5jdGlvbihvYmosIGl0ZXJhdG9yLCBjb250ZXh0KSB7XG4gICAgaWYgKG9iaiA9PSBudWxsKSByZXR1cm47XG4gICAgaWYgKG5hdGl2ZUZvckVhY2ggJiYgb2JqLmZvckVhY2ggPT09IG5hdGl2ZUZvckVhY2gpIHtcbiAgICAgIG9iai5mb3JFYWNoKGl0ZXJhdG9yLCBjb250ZXh0KTtcbiAgICB9IGVsc2UgaWYgKG9iai5sZW5ndGggPT09ICtvYmoubGVuZ3RoKSB7XG4gICAgICBmb3IgKHZhciBpID0gMCwgbGVuZ3RoID0gb2JqLmxlbmd0aDsgaSA8IGxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGlmIChpdGVyYXRvci5jYWxsKGNvbnRleHQsIG9ialtpXSwgaSwgb2JqKSA9PT0gYnJlYWtlcikgcmV0dXJuO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICB2YXIga2V5cyA9IF8ua2V5cyhvYmopO1xuICAgICAgZm9yICh2YXIgaSA9IDAsIGxlbmd0aCA9IGtleXMubGVuZ3RoOyBpIDwgbGVuZ3RoOyBpKyspIHtcbiAgICAgICAgaWYgKGl0ZXJhdG9yLmNhbGwoY29udGV4dCwgb2JqW2tleXNbaV1dLCBrZXlzW2ldLCBvYmopID09PSBicmVha2VyKSByZXR1cm47XG4gICAgICB9XG4gICAgfVxuICB9O1xuXG4gIC8vIFJldHVybiB0aGUgcmVzdWx0cyBvZiBhcHBseWluZyB0aGUgaXRlcmF0b3IgdG8gZWFjaCBlbGVtZW50LlxuICAvLyBEZWxlZ2F0ZXMgdG8gKipFQ01BU2NyaXB0IDUqKidzIG5hdGl2ZSBgbWFwYCBpZiBhdmFpbGFibGUuXG4gIF8ubWFwID0gXy5jb2xsZWN0ID0gZnVuY3Rpb24ob2JqLCBpdGVyYXRvciwgY29udGV4dCkge1xuICAgIHZhciByZXN1bHRzID0gW107XG4gICAgaWYgKG9iaiA9PSBudWxsKSByZXR1cm4gcmVzdWx0cztcbiAgICBpZiAobmF0aXZlTWFwICYmIG9iai5tYXAgPT09IG5hdGl2ZU1hcCkgcmV0dXJuIG9iai5tYXAoaXRlcmF0b3IsIGNvbnRleHQpO1xuICAgIGVhY2gob2JqLCBmdW5jdGlvbih2YWx1ZSwgaW5kZXgsIGxpc3QpIHtcbiAgICAgIHJlc3VsdHMucHVzaChpdGVyYXRvci5jYWxsKGNvbnRleHQsIHZhbHVlLCBpbmRleCwgbGlzdCkpO1xuICAgIH0pO1xuICAgIHJldHVybiByZXN1bHRzO1xuICB9O1xuXG4gIHZhciByZWR1Y2VFcnJvciA9ICdSZWR1Y2Ugb2YgZW1wdHkgYXJyYXkgd2l0aCBubyBpbml0aWFsIHZhbHVlJztcblxuICAvLyAqKlJlZHVjZSoqIGJ1aWxkcyB1cCBhIHNpbmdsZSByZXN1bHQgZnJvbSBhIGxpc3Qgb2YgdmFsdWVzLCBha2EgYGluamVjdGAsXG4gIC8vIG9yIGBmb2xkbGAuIERlbGVnYXRlcyB0byAqKkVDTUFTY3JpcHQgNSoqJ3MgbmF0aXZlIGByZWR1Y2VgIGlmIGF2YWlsYWJsZS5cbiAgXy5yZWR1Y2UgPSBfLmZvbGRsID0gXy5pbmplY3QgPSBmdW5jdGlvbihvYmosIGl0ZXJhdG9yLCBtZW1vLCBjb250ZXh0KSB7XG4gICAgdmFyIGluaXRpYWwgPSBhcmd1bWVudHMubGVuZ3RoID4gMjtcbiAgICBpZiAob2JqID09IG51bGwpIG9iaiA9IFtdO1xuICAgIGlmIChuYXRpdmVSZWR1Y2UgJiYgb2JqLnJlZHVjZSA9PT0gbmF0aXZlUmVkdWNlKSB7XG4gICAgICBpZiAoY29udGV4dCkgaXRlcmF0b3IgPSBfLmJpbmQoaXRlcmF0b3IsIGNvbnRleHQpO1xuICAgICAgcmV0dXJuIGluaXRpYWwgPyBvYmoucmVkdWNlKGl0ZXJhdG9yLCBtZW1vKSA6IG9iai5yZWR1Y2UoaXRlcmF0b3IpO1xuICAgIH1cbiAgICBlYWNoKG9iaiwgZnVuY3Rpb24odmFsdWUsIGluZGV4LCBsaXN0KSB7XG4gICAgICBpZiAoIWluaXRpYWwpIHtcbiAgICAgICAgbWVtbyA9IHZhbHVlO1xuICAgICAgICBpbml0aWFsID0gdHJ1ZTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIG1lbW8gPSBpdGVyYXRvci5jYWxsKGNvbnRleHQsIG1lbW8sIHZhbHVlLCBpbmRleCwgbGlzdCk7XG4gICAgICB9XG4gICAgfSk7XG4gICAgaWYgKCFpbml0aWFsKSB0aHJvdyBuZXcgVHlwZUVycm9yKHJlZHVjZUVycm9yKTtcbiAgICByZXR1cm4gbWVtbztcbiAgfTtcblxuICAvLyBUaGUgcmlnaHQtYXNzb2NpYXRpdmUgdmVyc2lvbiBvZiByZWR1Y2UsIGFsc28ga25vd24gYXMgYGZvbGRyYC5cbiAgLy8gRGVsZWdhdGVzIHRvICoqRUNNQVNjcmlwdCA1KioncyBuYXRpdmUgYHJlZHVjZVJpZ2h0YCBpZiBhdmFpbGFibGUuXG4gIF8ucmVkdWNlUmlnaHQgPSBfLmZvbGRyID0gZnVuY3Rpb24ob2JqLCBpdGVyYXRvciwgbWVtbywgY29udGV4dCkge1xuICAgIHZhciBpbml0aWFsID0gYXJndW1lbnRzLmxlbmd0aCA+IDI7XG4gICAgaWYgKG9iaiA9PSBudWxsKSBvYmogPSBbXTtcbiAgICBpZiAobmF0aXZlUmVkdWNlUmlnaHQgJiYgb2JqLnJlZHVjZVJpZ2h0ID09PSBuYXRpdmVSZWR1Y2VSaWdodCkge1xuICAgICAgaWYgKGNvbnRleHQpIGl0ZXJhdG9yID0gXy5iaW5kKGl0ZXJhdG9yLCBjb250ZXh0KTtcbiAgICAgIHJldHVybiBpbml0aWFsID8gb2JqLnJlZHVjZVJpZ2h0KGl0ZXJhdG9yLCBtZW1vKSA6IG9iai5yZWR1Y2VSaWdodChpdGVyYXRvcik7XG4gICAgfVxuICAgIHZhciBsZW5ndGggPSBvYmoubGVuZ3RoO1xuICAgIGlmIChsZW5ndGggIT09ICtsZW5ndGgpIHtcbiAgICAgIHZhciBrZXlzID0gXy5rZXlzKG9iaik7XG4gICAgICBsZW5ndGggPSBrZXlzLmxlbmd0aDtcbiAgICB9XG4gICAgZWFjaChvYmosIGZ1bmN0aW9uKHZhbHVlLCBpbmRleCwgbGlzdCkge1xuICAgICAgaW5kZXggPSBrZXlzID8ga2V5c1stLWxlbmd0aF0gOiAtLWxlbmd0aDtcbiAgICAgIGlmICghaW5pdGlhbCkge1xuICAgICAgICBtZW1vID0gb2JqW2luZGV4XTtcbiAgICAgICAgaW5pdGlhbCA9IHRydWU7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBtZW1vID0gaXRlcmF0b3IuY2FsbChjb250ZXh0LCBtZW1vLCBvYmpbaW5kZXhdLCBpbmRleCwgbGlzdCk7XG4gICAgICB9XG4gICAgfSk7XG4gICAgaWYgKCFpbml0aWFsKSB0aHJvdyBuZXcgVHlwZUVycm9yKHJlZHVjZUVycm9yKTtcbiAgICByZXR1cm4gbWVtbztcbiAgfTtcblxuICAvLyBSZXR1cm4gdGhlIGZpcnN0IHZhbHVlIHdoaWNoIHBhc3NlcyBhIHRydXRoIHRlc3QuIEFsaWFzZWQgYXMgYGRldGVjdGAuXG4gIF8uZmluZCA9IF8uZGV0ZWN0ID0gZnVuY3Rpb24ob2JqLCBpdGVyYXRvciwgY29udGV4dCkge1xuICAgIHZhciByZXN1bHQ7XG4gICAgYW55KG9iaiwgZnVuY3Rpb24odmFsdWUsIGluZGV4LCBsaXN0KSB7XG4gICAgICBpZiAoaXRlcmF0b3IuY2FsbChjb250ZXh0LCB2YWx1ZSwgaW5kZXgsIGxpc3QpKSB7XG4gICAgICAgIHJlc3VsdCA9IHZhbHVlO1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgIH1cbiAgICB9KTtcbiAgICByZXR1cm4gcmVzdWx0O1xuICB9O1xuXG4gIC8vIFJldHVybiBhbGwgdGhlIGVsZW1lbnRzIHRoYXQgcGFzcyBhIHRydXRoIHRlc3QuXG4gIC8vIERlbGVnYXRlcyB0byAqKkVDTUFTY3JpcHQgNSoqJ3MgbmF0aXZlIGBmaWx0ZXJgIGlmIGF2YWlsYWJsZS5cbiAgLy8gQWxpYXNlZCBhcyBgc2VsZWN0YC5cbiAgXy5maWx0ZXIgPSBfLnNlbGVjdCA9IGZ1bmN0aW9uKG9iaiwgaXRlcmF0b3IsIGNvbnRleHQpIHtcbiAgICB2YXIgcmVzdWx0cyA9IFtdO1xuICAgIGlmIChvYmogPT0gbnVsbCkgcmV0dXJuIHJlc3VsdHM7XG4gICAgaWYgKG5hdGl2ZUZpbHRlciAmJiBvYmouZmlsdGVyID09PSBuYXRpdmVGaWx0ZXIpIHJldHVybiBvYmouZmlsdGVyKGl0ZXJhdG9yLCBjb250ZXh0KTtcbiAgICBlYWNoKG9iaiwgZnVuY3Rpb24odmFsdWUsIGluZGV4LCBsaXN0KSB7XG4gICAgICBpZiAoaXRlcmF0b3IuY2FsbChjb250ZXh0LCB2YWx1ZSwgaW5kZXgsIGxpc3QpKSByZXN1bHRzLnB1c2godmFsdWUpO1xuICAgIH0pO1xuICAgIHJldHVybiByZXN1bHRzO1xuICB9O1xuXG4gIC8vIFJldHVybiBhbGwgdGhlIGVsZW1lbnRzIGZvciB3aGljaCBhIHRydXRoIHRlc3QgZmFpbHMuXG4gIF8ucmVqZWN0ID0gZnVuY3Rpb24ob2JqLCBpdGVyYXRvciwgY29udGV4dCkge1xuICAgIHJldHVybiBfLmZpbHRlcihvYmosIGZ1bmN0aW9uKHZhbHVlLCBpbmRleCwgbGlzdCkge1xuICAgICAgcmV0dXJuICFpdGVyYXRvci5jYWxsKGNvbnRleHQsIHZhbHVlLCBpbmRleCwgbGlzdCk7XG4gICAgfSwgY29udGV4dCk7XG4gIH07XG5cbiAgLy8gRGV0ZXJtaW5lIHdoZXRoZXIgYWxsIG9mIHRoZSBlbGVtZW50cyBtYXRjaCBhIHRydXRoIHRlc3QuXG4gIC8vIERlbGVnYXRlcyB0byAqKkVDTUFTY3JpcHQgNSoqJ3MgbmF0aXZlIGBldmVyeWAgaWYgYXZhaWxhYmxlLlxuICAvLyBBbGlhc2VkIGFzIGBhbGxgLlxuICBfLmV2ZXJ5ID0gXy5hbGwgPSBmdW5jdGlvbihvYmosIGl0ZXJhdG9yLCBjb250ZXh0KSB7XG4gICAgaXRlcmF0b3IgfHwgKGl0ZXJhdG9yID0gXy5pZGVudGl0eSk7XG4gICAgdmFyIHJlc3VsdCA9IHRydWU7XG4gICAgaWYgKG9iaiA9PSBudWxsKSByZXR1cm4gcmVzdWx0O1xuICAgIGlmIChuYXRpdmVFdmVyeSAmJiBvYmouZXZlcnkgPT09IG5hdGl2ZUV2ZXJ5KSByZXR1cm4gb2JqLmV2ZXJ5KGl0ZXJhdG9yLCBjb250ZXh0KTtcbiAgICBlYWNoKG9iaiwgZnVuY3Rpb24odmFsdWUsIGluZGV4LCBsaXN0KSB7XG4gICAgICBpZiAoIShyZXN1bHQgPSByZXN1bHQgJiYgaXRlcmF0b3IuY2FsbChjb250ZXh0LCB2YWx1ZSwgaW5kZXgsIGxpc3QpKSkgcmV0dXJuIGJyZWFrZXI7XG4gICAgfSk7XG4gICAgcmV0dXJuICEhcmVzdWx0O1xuICB9O1xuXG4gIC8vIERldGVybWluZSBpZiBhdCBsZWFzdCBvbmUgZWxlbWVudCBpbiB0aGUgb2JqZWN0IG1hdGNoZXMgYSB0cnV0aCB0ZXN0LlxuICAvLyBEZWxlZ2F0ZXMgdG8gKipFQ01BU2NyaXB0IDUqKidzIG5hdGl2ZSBgc29tZWAgaWYgYXZhaWxhYmxlLlxuICAvLyBBbGlhc2VkIGFzIGBhbnlgLlxuICB2YXIgYW55ID0gXy5zb21lID0gXy5hbnkgPSBmdW5jdGlvbihvYmosIGl0ZXJhdG9yLCBjb250ZXh0KSB7XG4gICAgaXRlcmF0b3IgfHwgKGl0ZXJhdG9yID0gXy5pZGVudGl0eSk7XG4gICAgdmFyIHJlc3VsdCA9IGZhbHNlO1xuICAgIGlmIChvYmogPT0gbnVsbCkgcmV0dXJuIHJlc3VsdDtcbiAgICBpZiAobmF0aXZlU29tZSAmJiBvYmouc29tZSA9PT0gbmF0aXZlU29tZSkgcmV0dXJuIG9iai5zb21lKGl0ZXJhdG9yLCBjb250ZXh0KTtcbiAgICBlYWNoKG9iaiwgZnVuY3Rpb24odmFsdWUsIGluZGV4LCBsaXN0KSB7XG4gICAgICBpZiAocmVzdWx0IHx8IChyZXN1bHQgPSBpdGVyYXRvci5jYWxsKGNvbnRleHQsIHZhbHVlLCBpbmRleCwgbGlzdCkpKSByZXR1cm4gYnJlYWtlcjtcbiAgICB9KTtcbiAgICByZXR1cm4gISFyZXN1bHQ7XG4gIH07XG5cbiAgLy8gRGV0ZXJtaW5lIGlmIHRoZSBhcnJheSBvciBvYmplY3QgY29udGFpbnMgYSBnaXZlbiB2YWx1ZSAodXNpbmcgYD09PWApLlxuICAvLyBBbGlhc2VkIGFzIGBpbmNsdWRlYC5cbiAgXy5jb250YWlucyA9IF8uaW5jbHVkZSA9IGZ1bmN0aW9uKG9iaiwgdGFyZ2V0KSB7XG4gICAgaWYgKG9iaiA9PSBudWxsKSByZXR1cm4gZmFsc2U7XG4gICAgaWYgKG5hdGl2ZUluZGV4T2YgJiYgb2JqLmluZGV4T2YgPT09IG5hdGl2ZUluZGV4T2YpIHJldHVybiBvYmouaW5kZXhPZih0YXJnZXQpICE9IC0xO1xuICAgIHJldHVybiBhbnkob2JqLCBmdW5jdGlvbih2YWx1ZSkge1xuICAgICAgcmV0dXJuIHZhbHVlID09PSB0YXJnZXQ7XG4gICAgfSk7XG4gIH07XG5cbiAgLy8gSW52b2tlIGEgbWV0aG9kICh3aXRoIGFyZ3VtZW50cykgb24gZXZlcnkgaXRlbSBpbiBhIGNvbGxlY3Rpb24uXG4gIF8uaW52b2tlID0gZnVuY3Rpb24ob2JqLCBtZXRob2QpIHtcbiAgICB2YXIgYXJncyA9IHNsaWNlLmNhbGwoYXJndW1lbnRzLCAyKTtcbiAgICB2YXIgaXNGdW5jID0gXy5pc0Z1bmN0aW9uKG1ldGhvZCk7XG4gICAgcmV0dXJuIF8ubWFwKG9iaiwgZnVuY3Rpb24odmFsdWUpIHtcbiAgICAgIHJldHVybiAoaXNGdW5jID8gbWV0aG9kIDogdmFsdWVbbWV0aG9kXSkuYXBwbHkodmFsdWUsIGFyZ3MpO1xuICAgIH0pO1xuICB9O1xuXG4gIC8vIENvbnZlbmllbmNlIHZlcnNpb24gb2YgYSBjb21tb24gdXNlIGNhc2Ugb2YgYG1hcGA6IGZldGNoaW5nIGEgcHJvcGVydHkuXG4gIF8ucGx1Y2sgPSBmdW5jdGlvbihvYmosIGtleSkge1xuICAgIHJldHVybiBfLm1hcChvYmosIGZ1bmN0aW9uKHZhbHVlKXsgcmV0dXJuIHZhbHVlW2tleV07IH0pO1xuICB9O1xuXG4gIC8vIENvbnZlbmllbmNlIHZlcnNpb24gb2YgYSBjb21tb24gdXNlIGNhc2Ugb2YgYGZpbHRlcmA6IHNlbGVjdGluZyBvbmx5IG9iamVjdHNcbiAgLy8gY29udGFpbmluZyBzcGVjaWZpYyBga2V5OnZhbHVlYCBwYWlycy5cbiAgXy53aGVyZSA9IGZ1bmN0aW9uKG9iaiwgYXR0cnMsIGZpcnN0KSB7XG4gICAgaWYgKF8uaXNFbXB0eShhdHRycykpIHJldHVybiBmaXJzdCA/IHZvaWQgMCA6IFtdO1xuICAgIHJldHVybiBfW2ZpcnN0ID8gJ2ZpbmQnIDogJ2ZpbHRlciddKG9iaiwgZnVuY3Rpb24odmFsdWUpIHtcbiAgICAgIGZvciAodmFyIGtleSBpbiBhdHRycykge1xuICAgICAgICBpZiAoYXR0cnNba2V5XSAhPT0gdmFsdWVba2V5XSkgcmV0dXJuIGZhbHNlO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfSk7XG4gIH07XG5cbiAgLy8gQ29udmVuaWVuY2UgdmVyc2lvbiBvZiBhIGNvbW1vbiB1c2UgY2FzZSBvZiBgZmluZGA6IGdldHRpbmcgdGhlIGZpcnN0IG9iamVjdFxuICAvLyBjb250YWluaW5nIHNwZWNpZmljIGBrZXk6dmFsdWVgIHBhaXJzLlxuICBfLmZpbmRXaGVyZSA9IGZ1bmN0aW9uKG9iaiwgYXR0cnMpIHtcbiAgICByZXR1cm4gXy53aGVyZShvYmosIGF0dHJzLCB0cnVlKTtcbiAgfTtcblxuICAvLyBSZXR1cm4gdGhlIG1heGltdW0gZWxlbWVudCBvciAoZWxlbWVudC1iYXNlZCBjb21wdXRhdGlvbikuXG4gIC8vIENhbid0IG9wdGltaXplIGFycmF5cyBvZiBpbnRlZ2VycyBsb25nZXIgdGhhbiA2NSw1MzUgZWxlbWVudHMuXG4gIC8vIFNlZSBbV2ViS2l0IEJ1ZyA4MDc5N10oaHR0cHM6Ly9idWdzLndlYmtpdC5vcmcvc2hvd19idWcuY2dpP2lkPTgwNzk3KVxuICBfLm1heCA9IGZ1bmN0aW9uKG9iaiwgaXRlcmF0b3IsIGNvbnRleHQpIHtcbiAgICBpZiAoIWl0ZXJhdG9yICYmIF8uaXNBcnJheShvYmopICYmIG9ialswXSA9PT0gK29ialswXSAmJiBvYmoubGVuZ3RoIDwgNjU1MzUpIHtcbiAgICAgIHJldHVybiBNYXRoLm1heC5hcHBseShNYXRoLCBvYmopO1xuICAgIH1cbiAgICBpZiAoIWl0ZXJhdG9yICYmIF8uaXNFbXB0eShvYmopKSByZXR1cm4gLUluZmluaXR5O1xuICAgIHZhciByZXN1bHQgPSB7Y29tcHV0ZWQgOiAtSW5maW5pdHksIHZhbHVlOiAtSW5maW5pdHl9O1xuICAgIGVhY2gob2JqLCBmdW5jdGlvbih2YWx1ZSwgaW5kZXgsIGxpc3QpIHtcbiAgICAgIHZhciBjb21wdXRlZCA9IGl0ZXJhdG9yID8gaXRlcmF0b3IuY2FsbChjb250ZXh0LCB2YWx1ZSwgaW5kZXgsIGxpc3QpIDogdmFsdWU7XG4gICAgICBjb21wdXRlZCA+IHJlc3VsdC5jb21wdXRlZCAmJiAocmVzdWx0ID0ge3ZhbHVlIDogdmFsdWUsIGNvbXB1dGVkIDogY29tcHV0ZWR9KTtcbiAgICB9KTtcbiAgICByZXR1cm4gcmVzdWx0LnZhbHVlO1xuICB9O1xuXG4gIC8vIFJldHVybiB0aGUgbWluaW11bSBlbGVtZW50IChvciBlbGVtZW50LWJhc2VkIGNvbXB1dGF0aW9uKS5cbiAgXy5taW4gPSBmdW5jdGlvbihvYmosIGl0ZXJhdG9yLCBjb250ZXh0KSB7XG4gICAgaWYgKCFpdGVyYXRvciAmJiBfLmlzQXJyYXkob2JqKSAmJiBvYmpbMF0gPT09ICtvYmpbMF0gJiYgb2JqLmxlbmd0aCA8IDY1NTM1KSB7XG4gICAgICByZXR1cm4gTWF0aC5taW4uYXBwbHkoTWF0aCwgb2JqKTtcbiAgICB9XG4gICAgaWYgKCFpdGVyYXRvciAmJiBfLmlzRW1wdHkob2JqKSkgcmV0dXJuIEluZmluaXR5O1xuICAgIHZhciByZXN1bHQgPSB7Y29tcHV0ZWQgOiBJbmZpbml0eSwgdmFsdWU6IEluZmluaXR5fTtcbiAgICBlYWNoKG9iaiwgZnVuY3Rpb24odmFsdWUsIGluZGV4LCBsaXN0KSB7XG4gICAgICB2YXIgY29tcHV0ZWQgPSBpdGVyYXRvciA/IGl0ZXJhdG9yLmNhbGwoY29udGV4dCwgdmFsdWUsIGluZGV4LCBsaXN0KSA6IHZhbHVlO1xuICAgICAgY29tcHV0ZWQgPCByZXN1bHQuY29tcHV0ZWQgJiYgKHJlc3VsdCA9IHt2YWx1ZSA6IHZhbHVlLCBjb21wdXRlZCA6IGNvbXB1dGVkfSk7XG4gICAgfSk7XG4gICAgcmV0dXJuIHJlc3VsdC52YWx1ZTtcbiAgfTtcblxuICAvLyBTaHVmZmxlIGFuIGFycmF5LCB1c2luZyB0aGUgbW9kZXJuIHZlcnNpb24gb2YgdGhlIFxuICAvLyBbRmlzaGVyLVlhdGVzIHNodWZmbGVdKGh0dHA6Ly9lbi53aWtpcGVkaWEub3JnL3dpa2kvRmlzaGVy4oCTWWF0ZXNfc2h1ZmZsZSkuXG4gIF8uc2h1ZmZsZSA9IGZ1bmN0aW9uKG9iaikge1xuICAgIHZhciByYW5kO1xuICAgIHZhciBpbmRleCA9IDA7XG4gICAgdmFyIHNodWZmbGVkID0gW107XG4gICAgZWFjaChvYmosIGZ1bmN0aW9uKHZhbHVlKSB7XG4gICAgICByYW5kID0gXy5yYW5kb20oaW5kZXgrKyk7XG4gICAgICBzaHVmZmxlZFtpbmRleCAtIDFdID0gc2h1ZmZsZWRbcmFuZF07XG4gICAgICBzaHVmZmxlZFtyYW5kXSA9IHZhbHVlO1xuICAgIH0pO1xuICAgIHJldHVybiBzaHVmZmxlZDtcbiAgfTtcblxuICAvLyBTYW1wbGUgKipuKiogcmFuZG9tIHZhbHVlcyBmcm9tIGFuIGFycmF5LlxuICAvLyBJZiAqKm4qKiBpcyBub3Qgc3BlY2lmaWVkLCByZXR1cm5zIGEgc2luZ2xlIHJhbmRvbSBlbGVtZW50IGZyb20gdGhlIGFycmF5LlxuICAvLyBUaGUgaW50ZXJuYWwgYGd1YXJkYCBhcmd1bWVudCBhbGxvd3MgaXQgdG8gd29yayB3aXRoIGBtYXBgLlxuICBfLnNhbXBsZSA9IGZ1bmN0aW9uKG9iaiwgbiwgZ3VhcmQpIHtcbiAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA8IDIgfHwgZ3VhcmQpIHtcbiAgICAgIHJldHVybiBvYmpbXy5yYW5kb20ob2JqLmxlbmd0aCAtIDEpXTtcbiAgICB9XG4gICAgcmV0dXJuIF8uc2h1ZmZsZShvYmopLnNsaWNlKDAsIE1hdGgubWF4KDAsIG4pKTtcbiAgfTtcblxuICAvLyBBbiBpbnRlcm5hbCBmdW5jdGlvbiB0byBnZW5lcmF0ZSBsb29rdXAgaXRlcmF0b3JzLlxuICB2YXIgbG9va3VwSXRlcmF0b3IgPSBmdW5jdGlvbih2YWx1ZSkge1xuICAgIHJldHVybiBfLmlzRnVuY3Rpb24odmFsdWUpID8gdmFsdWUgOiBmdW5jdGlvbihvYmopeyByZXR1cm4gb2JqW3ZhbHVlXTsgfTtcbiAgfTtcblxuICAvLyBTb3J0IHRoZSBvYmplY3QncyB2YWx1ZXMgYnkgYSBjcml0ZXJpb24gcHJvZHVjZWQgYnkgYW4gaXRlcmF0b3IuXG4gIF8uc29ydEJ5ID0gZnVuY3Rpb24ob2JqLCB2YWx1ZSwgY29udGV4dCkge1xuICAgIHZhciBpdGVyYXRvciA9IGxvb2t1cEl0ZXJhdG9yKHZhbHVlKTtcbiAgICByZXR1cm4gXy5wbHVjayhfLm1hcChvYmosIGZ1bmN0aW9uKHZhbHVlLCBpbmRleCwgbGlzdCkge1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgdmFsdWU6IHZhbHVlLFxuICAgICAgICBpbmRleDogaW5kZXgsXG4gICAgICAgIGNyaXRlcmlhOiBpdGVyYXRvci5jYWxsKGNvbnRleHQsIHZhbHVlLCBpbmRleCwgbGlzdClcbiAgICAgIH07XG4gICAgfSkuc29ydChmdW5jdGlvbihsZWZ0LCByaWdodCkge1xuICAgICAgdmFyIGEgPSBsZWZ0LmNyaXRlcmlhO1xuICAgICAgdmFyIGIgPSByaWdodC5jcml0ZXJpYTtcbiAgICAgIGlmIChhICE9PSBiKSB7XG4gICAgICAgIGlmIChhID4gYiB8fCBhID09PSB2b2lkIDApIHJldHVybiAxO1xuICAgICAgICBpZiAoYSA8IGIgfHwgYiA9PT0gdm9pZCAwKSByZXR1cm4gLTE7XG4gICAgICB9XG4gICAgICByZXR1cm4gbGVmdC5pbmRleCAtIHJpZ2h0LmluZGV4O1xuICAgIH0pLCAndmFsdWUnKTtcbiAgfTtcblxuICAvLyBBbiBpbnRlcm5hbCBmdW5jdGlvbiB1c2VkIGZvciBhZ2dyZWdhdGUgXCJncm91cCBieVwiIG9wZXJhdGlvbnMuXG4gIHZhciBncm91cCA9IGZ1bmN0aW9uKGJlaGF2aW9yKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uKG9iaiwgdmFsdWUsIGNvbnRleHQpIHtcbiAgICAgIHZhciByZXN1bHQgPSB7fTtcbiAgICAgIHZhciBpdGVyYXRvciA9IHZhbHVlID09IG51bGwgPyBfLmlkZW50aXR5IDogbG9va3VwSXRlcmF0b3IodmFsdWUpO1xuICAgICAgZWFjaChvYmosIGZ1bmN0aW9uKHZhbHVlLCBpbmRleCkge1xuICAgICAgICB2YXIga2V5ID0gaXRlcmF0b3IuY2FsbChjb250ZXh0LCB2YWx1ZSwgaW5kZXgsIG9iaik7XG4gICAgICAgIGJlaGF2aW9yKHJlc3VsdCwga2V5LCB2YWx1ZSk7XG4gICAgICB9KTtcbiAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfTtcbiAgfTtcblxuICAvLyBHcm91cHMgdGhlIG9iamVjdCdzIHZhbHVlcyBieSBhIGNyaXRlcmlvbi4gUGFzcyBlaXRoZXIgYSBzdHJpbmcgYXR0cmlidXRlXG4gIC8vIHRvIGdyb3VwIGJ5LCBvciBhIGZ1bmN0aW9uIHRoYXQgcmV0dXJucyB0aGUgY3JpdGVyaW9uLlxuICBfLmdyb3VwQnkgPSBncm91cChmdW5jdGlvbihyZXN1bHQsIGtleSwgdmFsdWUpIHtcbiAgICAoXy5oYXMocmVzdWx0LCBrZXkpID8gcmVzdWx0W2tleV0gOiAocmVzdWx0W2tleV0gPSBbXSkpLnB1c2godmFsdWUpO1xuICB9KTtcblxuICAvLyBJbmRleGVzIHRoZSBvYmplY3QncyB2YWx1ZXMgYnkgYSBjcml0ZXJpb24sIHNpbWlsYXIgdG8gYGdyb3VwQnlgLCBidXQgZm9yXG4gIC8vIHdoZW4geW91IGtub3cgdGhhdCB5b3VyIGluZGV4IHZhbHVlcyB3aWxsIGJlIHVuaXF1ZS5cbiAgXy5pbmRleEJ5ID0gZ3JvdXAoZnVuY3Rpb24ocmVzdWx0LCBrZXksIHZhbHVlKSB7XG4gICAgcmVzdWx0W2tleV0gPSB2YWx1ZTtcbiAgfSk7XG5cbiAgLy8gQ291bnRzIGluc3RhbmNlcyBvZiBhbiBvYmplY3QgdGhhdCBncm91cCBieSBhIGNlcnRhaW4gY3JpdGVyaW9uLiBQYXNzXG4gIC8vIGVpdGhlciBhIHN0cmluZyBhdHRyaWJ1dGUgdG8gY291bnQgYnksIG9yIGEgZnVuY3Rpb24gdGhhdCByZXR1cm5zIHRoZVxuICAvLyBjcml0ZXJpb24uXG4gIF8uY291bnRCeSA9IGdyb3VwKGZ1bmN0aW9uKHJlc3VsdCwga2V5KSB7XG4gICAgXy5oYXMocmVzdWx0LCBrZXkpID8gcmVzdWx0W2tleV0rKyA6IHJlc3VsdFtrZXldID0gMTtcbiAgfSk7XG5cbiAgLy8gVXNlIGEgY29tcGFyYXRvciBmdW5jdGlvbiB0byBmaWd1cmUgb3V0IHRoZSBzbWFsbGVzdCBpbmRleCBhdCB3aGljaFxuICAvLyBhbiBvYmplY3Qgc2hvdWxkIGJlIGluc2VydGVkIHNvIGFzIHRvIG1haW50YWluIG9yZGVyLiBVc2VzIGJpbmFyeSBzZWFyY2guXG4gIF8uc29ydGVkSW5kZXggPSBmdW5jdGlvbihhcnJheSwgb2JqLCBpdGVyYXRvciwgY29udGV4dCkge1xuICAgIGl0ZXJhdG9yID0gaXRlcmF0b3IgPT0gbnVsbCA/IF8uaWRlbnRpdHkgOiBsb29rdXBJdGVyYXRvcihpdGVyYXRvcik7XG4gICAgdmFyIHZhbHVlID0gaXRlcmF0b3IuY2FsbChjb250ZXh0LCBvYmopO1xuICAgIHZhciBsb3cgPSAwLCBoaWdoID0gYXJyYXkubGVuZ3RoO1xuICAgIHdoaWxlIChsb3cgPCBoaWdoKSB7XG4gICAgICB2YXIgbWlkID0gKGxvdyArIGhpZ2gpID4+PiAxO1xuICAgICAgaXRlcmF0b3IuY2FsbChjb250ZXh0LCBhcnJheVttaWRdKSA8IHZhbHVlID8gbG93ID0gbWlkICsgMSA6IGhpZ2ggPSBtaWQ7XG4gICAgfVxuICAgIHJldHVybiBsb3c7XG4gIH07XG5cbiAgLy8gU2FmZWx5IGNyZWF0ZSBhIHJlYWwsIGxpdmUgYXJyYXkgZnJvbSBhbnl0aGluZyBpdGVyYWJsZS5cbiAgXy50b0FycmF5ID0gZnVuY3Rpb24ob2JqKSB7XG4gICAgaWYgKCFvYmopIHJldHVybiBbXTtcbiAgICBpZiAoXy5pc0FycmF5KG9iaikpIHJldHVybiBzbGljZS5jYWxsKG9iaik7XG4gICAgaWYgKG9iai5sZW5ndGggPT09ICtvYmoubGVuZ3RoKSByZXR1cm4gXy5tYXAob2JqLCBfLmlkZW50aXR5KTtcbiAgICByZXR1cm4gXy52YWx1ZXMob2JqKTtcbiAgfTtcblxuICAvLyBSZXR1cm4gdGhlIG51bWJlciBvZiBlbGVtZW50cyBpbiBhbiBvYmplY3QuXG4gIF8uc2l6ZSA9IGZ1bmN0aW9uKG9iaikge1xuICAgIGlmIChvYmogPT0gbnVsbCkgcmV0dXJuIDA7XG4gICAgcmV0dXJuIChvYmoubGVuZ3RoID09PSArb2JqLmxlbmd0aCkgPyBvYmoubGVuZ3RoIDogXy5rZXlzKG9iaikubGVuZ3RoO1xuICB9O1xuXG4gIC8vIEFycmF5IEZ1bmN0aW9uc1xuICAvLyAtLS0tLS0tLS0tLS0tLS1cblxuICAvLyBHZXQgdGhlIGZpcnN0IGVsZW1lbnQgb2YgYW4gYXJyYXkuIFBhc3NpbmcgKipuKiogd2lsbCByZXR1cm4gdGhlIGZpcnN0IE5cbiAgLy8gdmFsdWVzIGluIHRoZSBhcnJheS4gQWxpYXNlZCBhcyBgaGVhZGAgYW5kIGB0YWtlYC4gVGhlICoqZ3VhcmQqKiBjaGVja1xuICAvLyBhbGxvd3MgaXQgdG8gd29yayB3aXRoIGBfLm1hcGAuXG4gIF8uZmlyc3QgPSBfLmhlYWQgPSBfLnRha2UgPSBmdW5jdGlvbihhcnJheSwgbiwgZ3VhcmQpIHtcbiAgICBpZiAoYXJyYXkgPT0gbnVsbCkgcmV0dXJuIHZvaWQgMDtcbiAgICByZXR1cm4gKG4gPT0gbnVsbCkgfHwgZ3VhcmQgPyBhcnJheVswXSA6IHNsaWNlLmNhbGwoYXJyYXksIDAsIG4pO1xuICB9O1xuXG4gIC8vIFJldHVybnMgZXZlcnl0aGluZyBidXQgdGhlIGxhc3QgZW50cnkgb2YgdGhlIGFycmF5LiBFc3BlY2lhbGx5IHVzZWZ1bCBvblxuICAvLyB0aGUgYXJndW1lbnRzIG9iamVjdC4gUGFzc2luZyAqKm4qKiB3aWxsIHJldHVybiBhbGwgdGhlIHZhbHVlcyBpblxuICAvLyB0aGUgYXJyYXksIGV4Y2x1ZGluZyB0aGUgbGFzdCBOLiBUaGUgKipndWFyZCoqIGNoZWNrIGFsbG93cyBpdCB0byB3b3JrIHdpdGhcbiAgLy8gYF8ubWFwYC5cbiAgXy5pbml0aWFsID0gZnVuY3Rpb24oYXJyYXksIG4sIGd1YXJkKSB7XG4gICAgcmV0dXJuIHNsaWNlLmNhbGwoYXJyYXksIDAsIGFycmF5Lmxlbmd0aCAtICgobiA9PSBudWxsKSB8fCBndWFyZCA/IDEgOiBuKSk7XG4gIH07XG5cbiAgLy8gR2V0IHRoZSBsYXN0IGVsZW1lbnQgb2YgYW4gYXJyYXkuIFBhc3NpbmcgKipuKiogd2lsbCByZXR1cm4gdGhlIGxhc3QgTlxuICAvLyB2YWx1ZXMgaW4gdGhlIGFycmF5LiBUaGUgKipndWFyZCoqIGNoZWNrIGFsbG93cyBpdCB0byB3b3JrIHdpdGggYF8ubWFwYC5cbiAgXy5sYXN0ID0gZnVuY3Rpb24oYXJyYXksIG4sIGd1YXJkKSB7XG4gICAgaWYgKGFycmF5ID09IG51bGwpIHJldHVybiB2b2lkIDA7XG4gICAgaWYgKChuID09IG51bGwpIHx8IGd1YXJkKSB7XG4gICAgICByZXR1cm4gYXJyYXlbYXJyYXkubGVuZ3RoIC0gMV07XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBzbGljZS5jYWxsKGFycmF5LCBNYXRoLm1heChhcnJheS5sZW5ndGggLSBuLCAwKSk7XG4gICAgfVxuICB9O1xuXG4gIC8vIFJldHVybnMgZXZlcnl0aGluZyBidXQgdGhlIGZpcnN0IGVudHJ5IG9mIHRoZSBhcnJheS4gQWxpYXNlZCBhcyBgdGFpbGAgYW5kIGBkcm9wYC5cbiAgLy8gRXNwZWNpYWxseSB1c2VmdWwgb24gdGhlIGFyZ3VtZW50cyBvYmplY3QuIFBhc3NpbmcgYW4gKipuKiogd2lsbCByZXR1cm5cbiAgLy8gdGhlIHJlc3QgTiB2YWx1ZXMgaW4gdGhlIGFycmF5LiBUaGUgKipndWFyZCoqXG4gIC8vIGNoZWNrIGFsbG93cyBpdCB0byB3b3JrIHdpdGggYF8ubWFwYC5cbiAgXy5yZXN0ID0gXy50YWlsID0gXy5kcm9wID0gZnVuY3Rpb24oYXJyYXksIG4sIGd1YXJkKSB7XG4gICAgcmV0dXJuIHNsaWNlLmNhbGwoYXJyYXksIChuID09IG51bGwpIHx8IGd1YXJkID8gMSA6IG4pO1xuICB9O1xuXG4gIC8vIFRyaW0gb3V0IGFsbCBmYWxzeSB2YWx1ZXMgZnJvbSBhbiBhcnJheS5cbiAgXy5jb21wYWN0ID0gZnVuY3Rpb24oYXJyYXkpIHtcbiAgICByZXR1cm4gXy5maWx0ZXIoYXJyYXksIF8uaWRlbnRpdHkpO1xuICB9O1xuXG4gIC8vIEludGVybmFsIGltcGxlbWVudGF0aW9uIG9mIGEgcmVjdXJzaXZlIGBmbGF0dGVuYCBmdW5jdGlvbi5cbiAgdmFyIGZsYXR0ZW4gPSBmdW5jdGlvbihpbnB1dCwgc2hhbGxvdywgb3V0cHV0KSB7XG4gICAgaWYgKHNoYWxsb3cgJiYgXy5ldmVyeShpbnB1dCwgXy5pc0FycmF5KSkge1xuICAgICAgcmV0dXJuIGNvbmNhdC5hcHBseShvdXRwdXQsIGlucHV0KTtcbiAgICB9XG4gICAgZWFjaChpbnB1dCwgZnVuY3Rpb24odmFsdWUpIHtcbiAgICAgIGlmIChfLmlzQXJyYXkodmFsdWUpIHx8IF8uaXNBcmd1bWVudHModmFsdWUpKSB7XG4gICAgICAgIHNoYWxsb3cgPyBwdXNoLmFwcGx5KG91dHB1dCwgdmFsdWUpIDogZmxhdHRlbih2YWx1ZSwgc2hhbGxvdywgb3V0cHV0KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIG91dHB1dC5wdXNoKHZhbHVlKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgICByZXR1cm4gb3V0cHV0O1xuICB9O1xuXG4gIC8vIEZsYXR0ZW4gb3V0IGFuIGFycmF5LCBlaXRoZXIgcmVjdXJzaXZlbHkgKGJ5IGRlZmF1bHQpLCBvciBqdXN0IG9uZSBsZXZlbC5cbiAgXy5mbGF0dGVuID0gZnVuY3Rpb24oYXJyYXksIHNoYWxsb3cpIHtcbiAgICByZXR1cm4gZmxhdHRlbihhcnJheSwgc2hhbGxvdywgW10pO1xuICB9O1xuXG4gIC8vIFJldHVybiBhIHZlcnNpb24gb2YgdGhlIGFycmF5IHRoYXQgZG9lcyBub3QgY29udGFpbiB0aGUgc3BlY2lmaWVkIHZhbHVlKHMpLlxuICBfLndpdGhvdXQgPSBmdW5jdGlvbihhcnJheSkge1xuICAgIHJldHVybiBfLmRpZmZlcmVuY2UoYXJyYXksIHNsaWNlLmNhbGwoYXJndW1lbnRzLCAxKSk7XG4gIH07XG5cbiAgLy8gUHJvZHVjZSBhIGR1cGxpY2F0ZS1mcmVlIHZlcnNpb24gb2YgdGhlIGFycmF5LiBJZiB0aGUgYXJyYXkgaGFzIGFscmVhZHlcbiAgLy8gYmVlbiBzb3J0ZWQsIHlvdSBoYXZlIHRoZSBvcHRpb24gb2YgdXNpbmcgYSBmYXN0ZXIgYWxnb3JpdGhtLlxuICAvLyBBbGlhc2VkIGFzIGB1bmlxdWVgLlxuICBfLnVuaXEgPSBfLnVuaXF1ZSA9IGZ1bmN0aW9uKGFycmF5LCBpc1NvcnRlZCwgaXRlcmF0b3IsIGNvbnRleHQpIHtcbiAgICBpZiAoXy5pc0Z1bmN0aW9uKGlzU29ydGVkKSkge1xuICAgICAgY29udGV4dCA9IGl0ZXJhdG9yO1xuICAgICAgaXRlcmF0b3IgPSBpc1NvcnRlZDtcbiAgICAgIGlzU29ydGVkID0gZmFsc2U7XG4gICAgfVxuICAgIHZhciBpbml0aWFsID0gaXRlcmF0b3IgPyBfLm1hcChhcnJheSwgaXRlcmF0b3IsIGNvbnRleHQpIDogYXJyYXk7XG4gICAgdmFyIHJlc3VsdHMgPSBbXTtcbiAgICB2YXIgc2VlbiA9IFtdO1xuICAgIGVhY2goaW5pdGlhbCwgZnVuY3Rpb24odmFsdWUsIGluZGV4KSB7XG4gICAgICBpZiAoaXNTb3J0ZWQgPyAoIWluZGV4IHx8IHNlZW5bc2Vlbi5sZW5ndGggLSAxXSAhPT0gdmFsdWUpIDogIV8uY29udGFpbnMoc2VlbiwgdmFsdWUpKSB7XG4gICAgICAgIHNlZW4ucHVzaCh2YWx1ZSk7XG4gICAgICAgIHJlc3VsdHMucHVzaChhcnJheVtpbmRleF0pO1xuICAgICAgfVxuICAgIH0pO1xuICAgIHJldHVybiByZXN1bHRzO1xuICB9O1xuXG4gIC8vIFByb2R1Y2UgYW4gYXJyYXkgdGhhdCBjb250YWlucyB0aGUgdW5pb246IGVhY2ggZGlzdGluY3QgZWxlbWVudCBmcm9tIGFsbCBvZlxuICAvLyB0aGUgcGFzc2VkLWluIGFycmF5cy5cbiAgXy51bmlvbiA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiBfLnVuaXEoXy5mbGF0dGVuKGFyZ3VtZW50cywgdHJ1ZSkpO1xuICB9O1xuXG4gIC8vIFByb2R1Y2UgYW4gYXJyYXkgdGhhdCBjb250YWlucyBldmVyeSBpdGVtIHNoYXJlZCBiZXR3ZWVuIGFsbCB0aGVcbiAgLy8gcGFzc2VkLWluIGFycmF5cy5cbiAgXy5pbnRlcnNlY3Rpb24gPSBmdW5jdGlvbihhcnJheSkge1xuICAgIHZhciByZXN0ID0gc2xpY2UuY2FsbChhcmd1bWVudHMsIDEpO1xuICAgIHJldHVybiBfLmZpbHRlcihfLnVuaXEoYXJyYXkpLCBmdW5jdGlvbihpdGVtKSB7XG4gICAgICByZXR1cm4gXy5ldmVyeShyZXN0LCBmdW5jdGlvbihvdGhlcikge1xuICAgICAgICByZXR1cm4gXy5pbmRleE9mKG90aGVyLCBpdGVtKSA+PSAwO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH07XG5cbiAgLy8gVGFrZSB0aGUgZGlmZmVyZW5jZSBiZXR3ZWVuIG9uZSBhcnJheSBhbmQgYSBudW1iZXIgb2Ygb3RoZXIgYXJyYXlzLlxuICAvLyBPbmx5IHRoZSBlbGVtZW50cyBwcmVzZW50IGluIGp1c3QgdGhlIGZpcnN0IGFycmF5IHdpbGwgcmVtYWluLlxuICBfLmRpZmZlcmVuY2UgPSBmdW5jdGlvbihhcnJheSkge1xuICAgIHZhciByZXN0ID0gY29uY2F0LmFwcGx5KEFycmF5UHJvdG8sIHNsaWNlLmNhbGwoYXJndW1lbnRzLCAxKSk7XG4gICAgcmV0dXJuIF8uZmlsdGVyKGFycmF5LCBmdW5jdGlvbih2YWx1ZSl7IHJldHVybiAhXy5jb250YWlucyhyZXN0LCB2YWx1ZSk7IH0pO1xuICB9O1xuXG4gIC8vIFppcCB0b2dldGhlciBtdWx0aXBsZSBsaXN0cyBpbnRvIGEgc2luZ2xlIGFycmF5IC0tIGVsZW1lbnRzIHRoYXQgc2hhcmVcbiAgLy8gYW4gaW5kZXggZ28gdG9nZXRoZXIuXG4gIF8uemlwID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIGxlbmd0aCA9IF8ubWF4KF8ucGx1Y2soYXJndW1lbnRzLCBcImxlbmd0aFwiKS5jb25jYXQoMCkpO1xuICAgIHZhciByZXN1bHRzID0gbmV3IEFycmF5KGxlbmd0aCk7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW5ndGg7IGkrKykge1xuICAgICAgcmVzdWx0c1tpXSA9IF8ucGx1Y2soYXJndW1lbnRzLCAnJyArIGkpO1xuICAgIH1cbiAgICByZXR1cm4gcmVzdWx0cztcbiAgfTtcblxuICAvLyBDb252ZXJ0cyBsaXN0cyBpbnRvIG9iamVjdHMuIFBhc3MgZWl0aGVyIGEgc2luZ2xlIGFycmF5IG9mIGBba2V5LCB2YWx1ZV1gXG4gIC8vIHBhaXJzLCBvciB0d28gcGFyYWxsZWwgYXJyYXlzIG9mIHRoZSBzYW1lIGxlbmd0aCAtLSBvbmUgb2Yga2V5cywgYW5kIG9uZSBvZlxuICAvLyB0aGUgY29ycmVzcG9uZGluZyB2YWx1ZXMuXG4gIF8ub2JqZWN0ID0gZnVuY3Rpb24obGlzdCwgdmFsdWVzKSB7XG4gICAgaWYgKGxpc3QgPT0gbnVsbCkgcmV0dXJuIHt9O1xuICAgIHZhciByZXN1bHQgPSB7fTtcbiAgICBmb3IgKHZhciBpID0gMCwgbGVuZ3RoID0gbGlzdC5sZW5ndGg7IGkgPCBsZW5ndGg7IGkrKykge1xuICAgICAgaWYgKHZhbHVlcykge1xuICAgICAgICByZXN1bHRbbGlzdFtpXV0gPSB2YWx1ZXNbaV07XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXN1bHRbbGlzdFtpXVswXV0gPSBsaXN0W2ldWzFdO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gcmVzdWx0O1xuICB9O1xuXG4gIC8vIElmIHRoZSBicm93c2VyIGRvZXNuJ3Qgc3VwcGx5IHVzIHdpdGggaW5kZXhPZiAoSSdtIGxvb2tpbmcgYXQgeW91LCAqKk1TSUUqKiksXG4gIC8vIHdlIG5lZWQgdGhpcyBmdW5jdGlvbi4gUmV0dXJuIHRoZSBwb3NpdGlvbiBvZiB0aGUgZmlyc3Qgb2NjdXJyZW5jZSBvZiBhblxuICAvLyBpdGVtIGluIGFuIGFycmF5LCBvciAtMSBpZiB0aGUgaXRlbSBpcyBub3QgaW5jbHVkZWQgaW4gdGhlIGFycmF5LlxuICAvLyBEZWxlZ2F0ZXMgdG8gKipFQ01BU2NyaXB0IDUqKidzIG5hdGl2ZSBgaW5kZXhPZmAgaWYgYXZhaWxhYmxlLlxuICAvLyBJZiB0aGUgYXJyYXkgaXMgbGFyZ2UgYW5kIGFscmVhZHkgaW4gc29ydCBvcmRlciwgcGFzcyBgdHJ1ZWBcbiAgLy8gZm9yICoqaXNTb3J0ZWQqKiB0byB1c2UgYmluYXJ5IHNlYXJjaC5cbiAgXy5pbmRleE9mID0gZnVuY3Rpb24oYXJyYXksIGl0ZW0sIGlzU29ydGVkKSB7XG4gICAgaWYgKGFycmF5ID09IG51bGwpIHJldHVybiAtMTtcbiAgICB2YXIgaSA9IDAsIGxlbmd0aCA9IGFycmF5Lmxlbmd0aDtcbiAgICBpZiAoaXNTb3J0ZWQpIHtcbiAgICAgIGlmICh0eXBlb2YgaXNTb3J0ZWQgPT0gJ251bWJlcicpIHtcbiAgICAgICAgaSA9IChpc1NvcnRlZCA8IDAgPyBNYXRoLm1heCgwLCBsZW5ndGggKyBpc1NvcnRlZCkgOiBpc1NvcnRlZCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBpID0gXy5zb3J0ZWRJbmRleChhcnJheSwgaXRlbSk7XG4gICAgICAgIHJldHVybiBhcnJheVtpXSA9PT0gaXRlbSA/IGkgOiAtMTtcbiAgICAgIH1cbiAgICB9XG4gICAgaWYgKG5hdGl2ZUluZGV4T2YgJiYgYXJyYXkuaW5kZXhPZiA9PT0gbmF0aXZlSW5kZXhPZikgcmV0dXJuIGFycmF5LmluZGV4T2YoaXRlbSwgaXNTb3J0ZWQpO1xuICAgIGZvciAoOyBpIDwgbGVuZ3RoOyBpKyspIGlmIChhcnJheVtpXSA9PT0gaXRlbSkgcmV0dXJuIGk7XG4gICAgcmV0dXJuIC0xO1xuICB9O1xuXG4gIC8vIERlbGVnYXRlcyB0byAqKkVDTUFTY3JpcHQgNSoqJ3MgbmF0aXZlIGBsYXN0SW5kZXhPZmAgaWYgYXZhaWxhYmxlLlxuICBfLmxhc3RJbmRleE9mID0gZnVuY3Rpb24oYXJyYXksIGl0ZW0sIGZyb20pIHtcbiAgICBpZiAoYXJyYXkgPT0gbnVsbCkgcmV0dXJuIC0xO1xuICAgIHZhciBoYXNJbmRleCA9IGZyb20gIT0gbnVsbDtcbiAgICBpZiAobmF0aXZlTGFzdEluZGV4T2YgJiYgYXJyYXkubGFzdEluZGV4T2YgPT09IG5hdGl2ZUxhc3RJbmRleE9mKSB7XG4gICAgICByZXR1cm4gaGFzSW5kZXggPyBhcnJheS5sYXN0SW5kZXhPZihpdGVtLCBmcm9tKSA6IGFycmF5Lmxhc3RJbmRleE9mKGl0ZW0pO1xuICAgIH1cbiAgICB2YXIgaSA9IChoYXNJbmRleCA/IGZyb20gOiBhcnJheS5sZW5ndGgpO1xuICAgIHdoaWxlIChpLS0pIGlmIChhcnJheVtpXSA9PT0gaXRlbSkgcmV0dXJuIGk7XG4gICAgcmV0dXJuIC0xO1xuICB9O1xuXG4gIC8vIEdlbmVyYXRlIGFuIGludGVnZXIgQXJyYXkgY29udGFpbmluZyBhbiBhcml0aG1ldGljIHByb2dyZXNzaW9uLiBBIHBvcnQgb2ZcbiAgLy8gdGhlIG5hdGl2ZSBQeXRob24gYHJhbmdlKClgIGZ1bmN0aW9uLiBTZWVcbiAgLy8gW3RoZSBQeXRob24gZG9jdW1lbnRhdGlvbl0oaHR0cDovL2RvY3MucHl0aG9uLm9yZy9saWJyYXJ5L2Z1bmN0aW9ucy5odG1sI3JhbmdlKS5cbiAgXy5yYW5nZSA9IGZ1bmN0aW9uKHN0YXJ0LCBzdG9wLCBzdGVwKSB7XG4gICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPD0gMSkge1xuICAgICAgc3RvcCA9IHN0YXJ0IHx8IDA7XG4gICAgICBzdGFydCA9IDA7XG4gICAgfVxuICAgIHN0ZXAgPSBhcmd1bWVudHNbMl0gfHwgMTtcblxuICAgIHZhciBsZW5ndGggPSBNYXRoLm1heChNYXRoLmNlaWwoKHN0b3AgLSBzdGFydCkgLyBzdGVwKSwgMCk7XG4gICAgdmFyIGlkeCA9IDA7XG4gICAgdmFyIHJhbmdlID0gbmV3IEFycmF5KGxlbmd0aCk7XG5cbiAgICB3aGlsZShpZHggPCBsZW5ndGgpIHtcbiAgICAgIHJhbmdlW2lkeCsrXSA9IHN0YXJ0O1xuICAgICAgc3RhcnQgKz0gc3RlcDtcbiAgICB9XG5cbiAgICByZXR1cm4gcmFuZ2U7XG4gIH07XG5cbiAgLy8gRnVuY3Rpb24gKGFoZW0pIEZ1bmN0aW9uc1xuICAvLyAtLS0tLS0tLS0tLS0tLS0tLS1cblxuICAvLyBSZXVzYWJsZSBjb25zdHJ1Y3RvciBmdW5jdGlvbiBmb3IgcHJvdG90eXBlIHNldHRpbmcuXG4gIHZhciBjdG9yID0gZnVuY3Rpb24oKXt9O1xuXG4gIC8vIENyZWF0ZSBhIGZ1bmN0aW9uIGJvdW5kIHRvIGEgZ2l2ZW4gb2JqZWN0IChhc3NpZ25pbmcgYHRoaXNgLCBhbmQgYXJndW1lbnRzLFxuICAvLyBvcHRpb25hbGx5KS4gRGVsZWdhdGVzIHRvICoqRUNNQVNjcmlwdCA1KioncyBuYXRpdmUgYEZ1bmN0aW9uLmJpbmRgIGlmXG4gIC8vIGF2YWlsYWJsZS5cbiAgXy5iaW5kID0gZnVuY3Rpb24oZnVuYywgY29udGV4dCkge1xuICAgIHZhciBhcmdzLCBib3VuZDtcbiAgICBpZiAobmF0aXZlQmluZCAmJiBmdW5jLmJpbmQgPT09IG5hdGl2ZUJpbmQpIHJldHVybiBuYXRpdmVCaW5kLmFwcGx5KGZ1bmMsIHNsaWNlLmNhbGwoYXJndW1lbnRzLCAxKSk7XG4gICAgaWYgKCFfLmlzRnVuY3Rpb24oZnVuYykpIHRocm93IG5ldyBUeXBlRXJyb3I7XG4gICAgYXJncyA9IHNsaWNlLmNhbGwoYXJndW1lbnRzLCAyKTtcbiAgICByZXR1cm4gYm91bmQgPSBmdW5jdGlvbigpIHtcbiAgICAgIGlmICghKHRoaXMgaW5zdGFuY2VvZiBib3VuZCkpIHJldHVybiBmdW5jLmFwcGx5KGNvbnRleHQsIGFyZ3MuY29uY2F0KHNsaWNlLmNhbGwoYXJndW1lbnRzKSkpO1xuICAgICAgY3Rvci5wcm90b3R5cGUgPSBmdW5jLnByb3RvdHlwZTtcbiAgICAgIHZhciBzZWxmID0gbmV3IGN0b3I7XG4gICAgICBjdG9yLnByb3RvdHlwZSA9IG51bGw7XG4gICAgICB2YXIgcmVzdWx0ID0gZnVuYy5hcHBseShzZWxmLCBhcmdzLmNvbmNhdChzbGljZS5jYWxsKGFyZ3VtZW50cykpKTtcbiAgICAgIGlmIChPYmplY3QocmVzdWx0KSA9PT0gcmVzdWx0KSByZXR1cm4gcmVzdWx0O1xuICAgICAgcmV0dXJuIHNlbGY7XG4gICAgfTtcbiAgfTtcblxuICAvLyBQYXJ0aWFsbHkgYXBwbHkgYSBmdW5jdGlvbiBieSBjcmVhdGluZyBhIHZlcnNpb24gdGhhdCBoYXMgaGFkIHNvbWUgb2YgaXRzXG4gIC8vIGFyZ3VtZW50cyBwcmUtZmlsbGVkLCB3aXRob3V0IGNoYW5naW5nIGl0cyBkeW5hbWljIGB0aGlzYCBjb250ZXh0LlxuICBfLnBhcnRpYWwgPSBmdW5jdGlvbihmdW5jKSB7XG4gICAgdmFyIGFyZ3MgPSBzbGljZS5jYWxsKGFyZ3VtZW50cywgMSk7XG4gICAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIGZ1bmMuYXBwbHkodGhpcywgYXJncy5jb25jYXQoc2xpY2UuY2FsbChhcmd1bWVudHMpKSk7XG4gICAgfTtcbiAgfTtcblxuICAvLyBCaW5kIGFsbCBvZiBhbiBvYmplY3QncyBtZXRob2RzIHRvIHRoYXQgb2JqZWN0LiBVc2VmdWwgZm9yIGVuc3VyaW5nIHRoYXRcbiAgLy8gYWxsIGNhbGxiYWNrcyBkZWZpbmVkIG9uIGFuIG9iamVjdCBiZWxvbmcgdG8gaXQuXG4gIF8uYmluZEFsbCA9IGZ1bmN0aW9uKG9iaikge1xuICAgIHZhciBmdW5jcyA9IHNsaWNlLmNhbGwoYXJndW1lbnRzLCAxKTtcbiAgICBpZiAoZnVuY3MubGVuZ3RoID09PSAwKSB0aHJvdyBuZXcgRXJyb3IoXCJiaW5kQWxsIG11c3QgYmUgcGFzc2VkIGZ1bmN0aW9uIG5hbWVzXCIpO1xuICAgIGVhY2goZnVuY3MsIGZ1bmN0aW9uKGYpIHsgb2JqW2ZdID0gXy5iaW5kKG9ialtmXSwgb2JqKTsgfSk7XG4gICAgcmV0dXJuIG9iajtcbiAgfTtcblxuICAvLyBNZW1vaXplIGFuIGV4cGVuc2l2ZSBmdW5jdGlvbiBieSBzdG9yaW5nIGl0cyByZXN1bHRzLlxuICBfLm1lbW9pemUgPSBmdW5jdGlvbihmdW5jLCBoYXNoZXIpIHtcbiAgICB2YXIgbWVtbyA9IHt9O1xuICAgIGhhc2hlciB8fCAoaGFzaGVyID0gXy5pZGVudGl0eSk7XG4gICAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgICAgdmFyIGtleSA9IGhhc2hlci5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgICAgcmV0dXJuIF8uaGFzKG1lbW8sIGtleSkgPyBtZW1vW2tleV0gOiAobWVtb1trZXldID0gZnVuYy5hcHBseSh0aGlzLCBhcmd1bWVudHMpKTtcbiAgICB9O1xuICB9O1xuXG4gIC8vIERlbGF5cyBhIGZ1bmN0aW9uIGZvciB0aGUgZ2l2ZW4gbnVtYmVyIG9mIG1pbGxpc2Vjb25kcywgYW5kIHRoZW4gY2FsbHNcbiAgLy8gaXQgd2l0aCB0aGUgYXJndW1lbnRzIHN1cHBsaWVkLlxuICBfLmRlbGF5ID0gZnVuY3Rpb24oZnVuYywgd2FpdCkge1xuICAgIHZhciBhcmdzID0gc2xpY2UuY2FsbChhcmd1bWVudHMsIDIpO1xuICAgIHJldHVybiBzZXRUaW1lb3V0KGZ1bmN0aW9uKCl7IHJldHVybiBmdW5jLmFwcGx5KG51bGwsIGFyZ3MpOyB9LCB3YWl0KTtcbiAgfTtcblxuICAvLyBEZWZlcnMgYSBmdW5jdGlvbiwgc2NoZWR1bGluZyBpdCB0byBydW4gYWZ0ZXIgdGhlIGN1cnJlbnQgY2FsbCBzdGFjayBoYXNcbiAgLy8gY2xlYXJlZC5cbiAgXy5kZWZlciA9IGZ1bmN0aW9uKGZ1bmMpIHtcbiAgICByZXR1cm4gXy5kZWxheS5hcHBseShfLCBbZnVuYywgMV0uY29uY2F0KHNsaWNlLmNhbGwoYXJndW1lbnRzLCAxKSkpO1xuICB9O1xuXG4gIC8vIFJldHVybnMgYSBmdW5jdGlvbiwgdGhhdCwgd2hlbiBpbnZva2VkLCB3aWxsIG9ubHkgYmUgdHJpZ2dlcmVkIGF0IG1vc3Qgb25jZVxuICAvLyBkdXJpbmcgYSBnaXZlbiB3aW5kb3cgb2YgdGltZS4gTm9ybWFsbHksIHRoZSB0aHJvdHRsZWQgZnVuY3Rpb24gd2lsbCBydW5cbiAgLy8gYXMgbXVjaCBhcyBpdCBjYW4sIHdpdGhvdXQgZXZlciBnb2luZyBtb3JlIHRoYW4gb25jZSBwZXIgYHdhaXRgIGR1cmF0aW9uO1xuICAvLyBidXQgaWYgeW91J2QgbGlrZSB0byBkaXNhYmxlIHRoZSBleGVjdXRpb24gb24gdGhlIGxlYWRpbmcgZWRnZSwgcGFzc1xuICAvLyBge2xlYWRpbmc6IGZhbHNlfWAuIFRvIGRpc2FibGUgZXhlY3V0aW9uIG9uIHRoZSB0cmFpbGluZyBlZGdlLCBkaXR0by5cbiAgXy50aHJvdHRsZSA9IGZ1bmN0aW9uKGZ1bmMsIHdhaXQsIG9wdGlvbnMpIHtcbiAgICB2YXIgY29udGV4dCwgYXJncywgcmVzdWx0O1xuICAgIHZhciB0aW1lb3V0ID0gbnVsbDtcbiAgICB2YXIgcHJldmlvdXMgPSAwO1xuICAgIG9wdGlvbnMgfHwgKG9wdGlvbnMgPSB7fSk7XG4gICAgdmFyIGxhdGVyID0gZnVuY3Rpb24oKSB7XG4gICAgICBwcmV2aW91cyA9IG9wdGlvbnMubGVhZGluZyA9PT0gZmFsc2UgPyAwIDogbmV3IERhdGU7XG4gICAgICB0aW1lb3V0ID0gbnVsbDtcbiAgICAgIHJlc3VsdCA9IGZ1bmMuYXBwbHkoY29udGV4dCwgYXJncyk7XG4gICAgfTtcbiAgICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgICB2YXIgbm93ID0gbmV3IERhdGU7XG4gICAgICBpZiAoIXByZXZpb3VzICYmIG9wdGlvbnMubGVhZGluZyA9PT0gZmFsc2UpIHByZXZpb3VzID0gbm93O1xuICAgICAgdmFyIHJlbWFpbmluZyA9IHdhaXQgLSAobm93IC0gcHJldmlvdXMpO1xuICAgICAgY29udGV4dCA9IHRoaXM7XG4gICAgICBhcmdzID0gYXJndW1lbnRzO1xuICAgICAgaWYgKHJlbWFpbmluZyA8PSAwKSB7XG4gICAgICAgIGNsZWFyVGltZW91dCh0aW1lb3V0KTtcbiAgICAgICAgdGltZW91dCA9IG51bGw7XG4gICAgICAgIHByZXZpb3VzID0gbm93O1xuICAgICAgICByZXN1bHQgPSBmdW5jLmFwcGx5KGNvbnRleHQsIGFyZ3MpO1xuICAgICAgfSBlbHNlIGlmICghdGltZW91dCAmJiBvcHRpb25zLnRyYWlsaW5nICE9PSBmYWxzZSkge1xuICAgICAgICB0aW1lb3V0ID0gc2V0VGltZW91dChsYXRlciwgcmVtYWluaW5nKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfTtcbiAgfTtcblxuICAvLyBSZXR1cm5zIGEgZnVuY3Rpb24sIHRoYXQsIGFzIGxvbmcgYXMgaXQgY29udGludWVzIHRvIGJlIGludm9rZWQsIHdpbGwgbm90XG4gIC8vIGJlIHRyaWdnZXJlZC4gVGhlIGZ1bmN0aW9uIHdpbGwgYmUgY2FsbGVkIGFmdGVyIGl0IHN0b3BzIGJlaW5nIGNhbGxlZCBmb3JcbiAgLy8gTiBtaWxsaXNlY29uZHMuIElmIGBpbW1lZGlhdGVgIGlzIHBhc3NlZCwgdHJpZ2dlciB0aGUgZnVuY3Rpb24gb24gdGhlXG4gIC8vIGxlYWRpbmcgZWRnZSwgaW5zdGVhZCBvZiB0aGUgdHJhaWxpbmcuXG4gIF8uZGVib3VuY2UgPSBmdW5jdGlvbihmdW5jLCB3YWl0LCBpbW1lZGlhdGUpIHtcbiAgICB2YXIgdGltZW91dCwgYXJncywgY29udGV4dCwgdGltZXN0YW1wLCByZXN1bHQ7XG4gICAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgICAgY29udGV4dCA9IHRoaXM7XG4gICAgICBhcmdzID0gYXJndW1lbnRzO1xuICAgICAgdGltZXN0YW1wID0gbmV3IERhdGUoKTtcbiAgICAgIHZhciBsYXRlciA9IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgbGFzdCA9IChuZXcgRGF0ZSgpKSAtIHRpbWVzdGFtcDtcbiAgICAgICAgaWYgKGxhc3QgPCB3YWl0KSB7XG4gICAgICAgICAgdGltZW91dCA9IHNldFRpbWVvdXQobGF0ZXIsIHdhaXQgLSBsYXN0KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB0aW1lb3V0ID0gbnVsbDtcbiAgICAgICAgICBpZiAoIWltbWVkaWF0ZSkgcmVzdWx0ID0gZnVuYy5hcHBseShjb250ZXh0LCBhcmdzKTtcbiAgICAgICAgfVxuICAgICAgfTtcbiAgICAgIHZhciBjYWxsTm93ID0gaW1tZWRpYXRlICYmICF0aW1lb3V0O1xuICAgICAgaWYgKCF0aW1lb3V0KSB7XG4gICAgICAgIHRpbWVvdXQgPSBzZXRUaW1lb3V0KGxhdGVyLCB3YWl0KTtcbiAgICAgIH1cbiAgICAgIGlmIChjYWxsTm93KSByZXN1bHQgPSBmdW5jLmFwcGx5KGNvbnRleHQsIGFyZ3MpO1xuICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9O1xuICB9O1xuXG4gIC8vIFJldHVybnMgYSBmdW5jdGlvbiB0aGF0IHdpbGwgYmUgZXhlY3V0ZWQgYXQgbW9zdCBvbmUgdGltZSwgbm8gbWF0dGVyIGhvd1xuICAvLyBvZnRlbiB5b3UgY2FsbCBpdC4gVXNlZnVsIGZvciBsYXp5IGluaXRpYWxpemF0aW9uLlxuICBfLm9uY2UgPSBmdW5jdGlvbihmdW5jKSB7XG4gICAgdmFyIHJhbiA9IGZhbHNlLCBtZW1vO1xuICAgIHJldHVybiBmdW5jdGlvbigpIHtcbiAgICAgIGlmIChyYW4pIHJldHVybiBtZW1vO1xuICAgICAgcmFuID0gdHJ1ZTtcbiAgICAgIG1lbW8gPSBmdW5jLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgICBmdW5jID0gbnVsbDtcbiAgICAgIHJldHVybiBtZW1vO1xuICAgIH07XG4gIH07XG5cbiAgLy8gUmV0dXJucyB0aGUgZmlyc3QgZnVuY3Rpb24gcGFzc2VkIGFzIGFuIGFyZ3VtZW50IHRvIHRoZSBzZWNvbmQsXG4gIC8vIGFsbG93aW5nIHlvdSB0byBhZGp1c3QgYXJndW1lbnRzLCBydW4gY29kZSBiZWZvcmUgYW5kIGFmdGVyLCBhbmRcbiAgLy8gY29uZGl0aW9uYWxseSBleGVjdXRlIHRoZSBvcmlnaW5hbCBmdW5jdGlvbi5cbiAgXy53cmFwID0gZnVuY3Rpb24oZnVuYywgd3JhcHBlcikge1xuICAgIHJldHVybiBmdW5jdGlvbigpIHtcbiAgICAgIHZhciBhcmdzID0gW2Z1bmNdO1xuICAgICAgcHVzaC5hcHBseShhcmdzLCBhcmd1bWVudHMpO1xuICAgICAgcmV0dXJuIHdyYXBwZXIuYXBwbHkodGhpcywgYXJncyk7XG4gICAgfTtcbiAgfTtcblxuICAvLyBSZXR1cm5zIGEgZnVuY3Rpb24gdGhhdCBpcyB0aGUgY29tcG9zaXRpb24gb2YgYSBsaXN0IG9mIGZ1bmN0aW9ucywgZWFjaFxuICAvLyBjb25zdW1pbmcgdGhlIHJldHVybiB2YWx1ZSBvZiB0aGUgZnVuY3Rpb24gdGhhdCBmb2xsb3dzLlxuICBfLmNvbXBvc2UgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgZnVuY3MgPSBhcmd1bWVudHM7XG4gICAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgICAgdmFyIGFyZ3MgPSBhcmd1bWVudHM7XG4gICAgICBmb3IgKHZhciBpID0gZnVuY3MubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pIHtcbiAgICAgICAgYXJncyA9IFtmdW5jc1tpXS5hcHBseSh0aGlzLCBhcmdzKV07XG4gICAgICB9XG4gICAgICByZXR1cm4gYXJnc1swXTtcbiAgICB9O1xuICB9O1xuXG4gIC8vIFJldHVybnMgYSBmdW5jdGlvbiB0aGF0IHdpbGwgb25seSBiZSBleGVjdXRlZCBhZnRlciBiZWluZyBjYWxsZWQgTiB0aW1lcy5cbiAgXy5hZnRlciA9IGZ1bmN0aW9uKHRpbWVzLCBmdW5jKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgICAgaWYgKC0tdGltZXMgPCAxKSB7XG4gICAgICAgIHJldHVybiBmdW5jLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgICB9XG4gICAgfTtcbiAgfTtcblxuICAvLyBPYmplY3QgRnVuY3Rpb25zXG4gIC8vIC0tLS0tLS0tLS0tLS0tLS1cblxuICAvLyBSZXRyaWV2ZSB0aGUgbmFtZXMgb2YgYW4gb2JqZWN0J3MgcHJvcGVydGllcy5cbiAgLy8gRGVsZWdhdGVzIHRvICoqRUNNQVNjcmlwdCA1KioncyBuYXRpdmUgYE9iamVjdC5rZXlzYFxuICBfLmtleXMgPSBuYXRpdmVLZXlzIHx8IGZ1bmN0aW9uKG9iaikge1xuICAgIGlmIChvYmogIT09IE9iamVjdChvYmopKSB0aHJvdyBuZXcgVHlwZUVycm9yKCdJbnZhbGlkIG9iamVjdCcpO1xuICAgIHZhciBrZXlzID0gW107XG4gICAgZm9yICh2YXIga2V5IGluIG9iaikgaWYgKF8uaGFzKG9iaiwga2V5KSkga2V5cy5wdXNoKGtleSk7XG4gICAgcmV0dXJuIGtleXM7XG4gIH07XG5cbiAgLy8gUmV0cmlldmUgdGhlIHZhbHVlcyBvZiBhbiBvYmplY3QncyBwcm9wZXJ0aWVzLlxuICBfLnZhbHVlcyA9IGZ1bmN0aW9uKG9iaikge1xuICAgIHZhciBrZXlzID0gXy5rZXlzKG9iaik7XG4gICAgdmFyIGxlbmd0aCA9IGtleXMubGVuZ3RoO1xuICAgIHZhciB2YWx1ZXMgPSBuZXcgQXJyYXkobGVuZ3RoKTtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGxlbmd0aDsgaSsrKSB7XG4gICAgICB2YWx1ZXNbaV0gPSBvYmpba2V5c1tpXV07XG4gICAgfVxuICAgIHJldHVybiB2YWx1ZXM7XG4gIH07XG5cbiAgLy8gQ29udmVydCBhbiBvYmplY3QgaW50byBhIGxpc3Qgb2YgYFtrZXksIHZhbHVlXWAgcGFpcnMuXG4gIF8ucGFpcnMgPSBmdW5jdGlvbihvYmopIHtcbiAgICB2YXIga2V5cyA9IF8ua2V5cyhvYmopO1xuICAgIHZhciBsZW5ndGggPSBrZXlzLmxlbmd0aDtcbiAgICB2YXIgcGFpcnMgPSBuZXcgQXJyYXkobGVuZ3RoKTtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGxlbmd0aDsgaSsrKSB7XG4gICAgICBwYWlyc1tpXSA9IFtrZXlzW2ldLCBvYmpba2V5c1tpXV1dO1xuICAgIH1cbiAgICByZXR1cm4gcGFpcnM7XG4gIH07XG5cbiAgLy8gSW52ZXJ0IHRoZSBrZXlzIGFuZCB2YWx1ZXMgb2YgYW4gb2JqZWN0LiBUaGUgdmFsdWVzIG11c3QgYmUgc2VyaWFsaXphYmxlLlxuICBfLmludmVydCA9IGZ1bmN0aW9uKG9iaikge1xuICAgIHZhciByZXN1bHQgPSB7fTtcbiAgICB2YXIga2V5cyA9IF8ua2V5cyhvYmopO1xuICAgIGZvciAodmFyIGkgPSAwLCBsZW5ndGggPSBrZXlzLmxlbmd0aDsgaSA8IGxlbmd0aDsgaSsrKSB7XG4gICAgICByZXN1bHRbb2JqW2tleXNbaV1dXSA9IGtleXNbaV07XG4gICAgfVxuICAgIHJldHVybiByZXN1bHQ7XG4gIH07XG5cbiAgLy8gUmV0dXJuIGEgc29ydGVkIGxpc3Qgb2YgdGhlIGZ1bmN0aW9uIG5hbWVzIGF2YWlsYWJsZSBvbiB0aGUgb2JqZWN0LlxuICAvLyBBbGlhc2VkIGFzIGBtZXRob2RzYFxuICBfLmZ1bmN0aW9ucyA9IF8ubWV0aG9kcyA9IGZ1bmN0aW9uKG9iaikge1xuICAgIHZhciBuYW1lcyA9IFtdO1xuICAgIGZvciAodmFyIGtleSBpbiBvYmopIHtcbiAgICAgIGlmIChfLmlzRnVuY3Rpb24ob2JqW2tleV0pKSBuYW1lcy5wdXNoKGtleSk7XG4gICAgfVxuICAgIHJldHVybiBuYW1lcy5zb3J0KCk7XG4gIH07XG5cbiAgLy8gRXh0ZW5kIGEgZ2l2ZW4gb2JqZWN0IHdpdGggYWxsIHRoZSBwcm9wZXJ0aWVzIGluIHBhc3NlZC1pbiBvYmplY3QocykuXG4gIF8uZXh0ZW5kID0gZnVuY3Rpb24ob2JqKSB7XG4gICAgZWFjaChzbGljZS5jYWxsKGFyZ3VtZW50cywgMSksIGZ1bmN0aW9uKHNvdXJjZSkge1xuICAgICAgaWYgKHNvdXJjZSkge1xuICAgICAgICBmb3IgKHZhciBwcm9wIGluIHNvdXJjZSkge1xuICAgICAgICAgIG9ialtwcm9wXSA9IHNvdXJjZVtwcm9wXTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0pO1xuICAgIHJldHVybiBvYmo7XG4gIH07XG5cbiAgLy8gUmV0dXJuIGEgY29weSBvZiB0aGUgb2JqZWN0IG9ubHkgY29udGFpbmluZyB0aGUgd2hpdGVsaXN0ZWQgcHJvcGVydGllcy5cbiAgXy5waWNrID0gZnVuY3Rpb24ob2JqKSB7XG4gICAgdmFyIGNvcHkgPSB7fTtcbiAgICB2YXIga2V5cyA9IGNvbmNhdC5hcHBseShBcnJheVByb3RvLCBzbGljZS5jYWxsKGFyZ3VtZW50cywgMSkpO1xuICAgIGVhY2goa2V5cywgZnVuY3Rpb24oa2V5KSB7XG4gICAgICBpZiAoa2V5IGluIG9iaikgY29weVtrZXldID0gb2JqW2tleV07XG4gICAgfSk7XG4gICAgcmV0dXJuIGNvcHk7XG4gIH07XG5cbiAgIC8vIFJldHVybiBhIGNvcHkgb2YgdGhlIG9iamVjdCB3aXRob3V0IHRoZSBibGFja2xpc3RlZCBwcm9wZXJ0aWVzLlxuICBfLm9taXQgPSBmdW5jdGlvbihvYmopIHtcbiAgICB2YXIgY29weSA9IHt9O1xuICAgIHZhciBrZXlzID0gY29uY2F0LmFwcGx5KEFycmF5UHJvdG8sIHNsaWNlLmNhbGwoYXJndW1lbnRzLCAxKSk7XG4gICAgZm9yICh2YXIga2V5IGluIG9iaikge1xuICAgICAgaWYgKCFfLmNvbnRhaW5zKGtleXMsIGtleSkpIGNvcHlba2V5XSA9IG9ialtrZXldO1xuICAgIH1cbiAgICByZXR1cm4gY29weTtcbiAgfTtcblxuICAvLyBGaWxsIGluIGEgZ2l2ZW4gb2JqZWN0IHdpdGggZGVmYXVsdCBwcm9wZXJ0aWVzLlxuICBfLmRlZmF1bHRzID0gZnVuY3Rpb24ob2JqKSB7XG4gICAgZWFjaChzbGljZS5jYWxsKGFyZ3VtZW50cywgMSksIGZ1bmN0aW9uKHNvdXJjZSkge1xuICAgICAgaWYgKHNvdXJjZSkge1xuICAgICAgICBmb3IgKHZhciBwcm9wIGluIHNvdXJjZSkge1xuICAgICAgICAgIGlmIChvYmpbcHJvcF0gPT09IHZvaWQgMCkgb2JqW3Byb3BdID0gc291cmNlW3Byb3BdO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSk7XG4gICAgcmV0dXJuIG9iajtcbiAgfTtcblxuICAvLyBDcmVhdGUgYSAoc2hhbGxvdy1jbG9uZWQpIGR1cGxpY2F0ZSBvZiBhbiBvYmplY3QuXG4gIF8uY2xvbmUgPSBmdW5jdGlvbihvYmopIHtcbiAgICBpZiAoIV8uaXNPYmplY3Qob2JqKSkgcmV0dXJuIG9iajtcbiAgICByZXR1cm4gXy5pc0FycmF5KG9iaikgPyBvYmouc2xpY2UoKSA6IF8uZXh0ZW5kKHt9LCBvYmopO1xuICB9O1xuXG4gIC8vIEludm9rZXMgaW50ZXJjZXB0b3Igd2l0aCB0aGUgb2JqLCBhbmQgdGhlbiByZXR1cm5zIG9iai5cbiAgLy8gVGhlIHByaW1hcnkgcHVycG9zZSBvZiB0aGlzIG1ldGhvZCBpcyB0byBcInRhcCBpbnRvXCIgYSBtZXRob2QgY2hhaW4sIGluXG4gIC8vIG9yZGVyIHRvIHBlcmZvcm0gb3BlcmF0aW9ucyBvbiBpbnRlcm1lZGlhdGUgcmVzdWx0cyB3aXRoaW4gdGhlIGNoYWluLlxuICBfLnRhcCA9IGZ1bmN0aW9uKG9iaiwgaW50ZXJjZXB0b3IpIHtcbiAgICBpbnRlcmNlcHRvcihvYmopO1xuICAgIHJldHVybiBvYmo7XG4gIH07XG5cbiAgLy8gSW50ZXJuYWwgcmVjdXJzaXZlIGNvbXBhcmlzb24gZnVuY3Rpb24gZm9yIGBpc0VxdWFsYC5cbiAgdmFyIGVxID0gZnVuY3Rpb24oYSwgYiwgYVN0YWNrLCBiU3RhY2spIHtcbiAgICAvLyBJZGVudGljYWwgb2JqZWN0cyBhcmUgZXF1YWwuIGAwID09PSAtMGAsIGJ1dCB0aGV5IGFyZW4ndCBpZGVudGljYWwuXG4gICAgLy8gU2VlIHRoZSBbSGFybW9ueSBgZWdhbGAgcHJvcG9zYWxdKGh0dHA6Ly93aWtpLmVjbWFzY3JpcHQub3JnL2Rva3UucGhwP2lkPWhhcm1vbnk6ZWdhbCkuXG4gICAgaWYgKGEgPT09IGIpIHJldHVybiBhICE9PSAwIHx8IDEgLyBhID09IDEgLyBiO1xuICAgIC8vIEEgc3RyaWN0IGNvbXBhcmlzb24gaXMgbmVjZXNzYXJ5IGJlY2F1c2UgYG51bGwgPT0gdW5kZWZpbmVkYC5cbiAgICBpZiAoYSA9PSBudWxsIHx8IGIgPT0gbnVsbCkgcmV0dXJuIGEgPT09IGI7XG4gICAgLy8gVW53cmFwIGFueSB3cmFwcGVkIG9iamVjdHMuXG4gICAgaWYgKGEgaW5zdGFuY2VvZiBfKSBhID0gYS5fd3JhcHBlZDtcbiAgICBpZiAoYiBpbnN0YW5jZW9mIF8pIGIgPSBiLl93cmFwcGVkO1xuICAgIC8vIENvbXBhcmUgYFtbQ2xhc3NdXWAgbmFtZXMuXG4gICAgdmFyIGNsYXNzTmFtZSA9IHRvU3RyaW5nLmNhbGwoYSk7XG4gICAgaWYgKGNsYXNzTmFtZSAhPSB0b1N0cmluZy5jYWxsKGIpKSByZXR1cm4gZmFsc2U7XG4gICAgc3dpdGNoIChjbGFzc05hbWUpIHtcbiAgICAgIC8vIFN0cmluZ3MsIG51bWJlcnMsIGRhdGVzLCBhbmQgYm9vbGVhbnMgYXJlIGNvbXBhcmVkIGJ5IHZhbHVlLlxuICAgICAgY2FzZSAnW29iamVjdCBTdHJpbmddJzpcbiAgICAgICAgLy8gUHJpbWl0aXZlcyBhbmQgdGhlaXIgY29ycmVzcG9uZGluZyBvYmplY3Qgd3JhcHBlcnMgYXJlIGVxdWl2YWxlbnQ7IHRodXMsIGBcIjVcImAgaXNcbiAgICAgICAgLy8gZXF1aXZhbGVudCB0byBgbmV3IFN0cmluZyhcIjVcIilgLlxuICAgICAgICByZXR1cm4gYSA9PSBTdHJpbmcoYik7XG4gICAgICBjYXNlICdbb2JqZWN0IE51bWJlcl0nOlxuICAgICAgICAvLyBgTmFOYHMgYXJlIGVxdWl2YWxlbnQsIGJ1dCBub24tcmVmbGV4aXZlLiBBbiBgZWdhbGAgY29tcGFyaXNvbiBpcyBwZXJmb3JtZWQgZm9yXG4gICAgICAgIC8vIG90aGVyIG51bWVyaWMgdmFsdWVzLlxuICAgICAgICByZXR1cm4gYSAhPSArYSA/IGIgIT0gK2IgOiAoYSA9PSAwID8gMSAvIGEgPT0gMSAvIGIgOiBhID09ICtiKTtcbiAgICAgIGNhc2UgJ1tvYmplY3QgRGF0ZV0nOlxuICAgICAgY2FzZSAnW29iamVjdCBCb29sZWFuXSc6XG4gICAgICAgIC8vIENvZXJjZSBkYXRlcyBhbmQgYm9vbGVhbnMgdG8gbnVtZXJpYyBwcmltaXRpdmUgdmFsdWVzLiBEYXRlcyBhcmUgY29tcGFyZWQgYnkgdGhlaXJcbiAgICAgICAgLy8gbWlsbGlzZWNvbmQgcmVwcmVzZW50YXRpb25zLiBOb3RlIHRoYXQgaW52YWxpZCBkYXRlcyB3aXRoIG1pbGxpc2Vjb25kIHJlcHJlc2VudGF0aW9uc1xuICAgICAgICAvLyBvZiBgTmFOYCBhcmUgbm90IGVxdWl2YWxlbnQuXG4gICAgICAgIHJldHVybiArYSA9PSArYjtcbiAgICAgIC8vIFJlZ0V4cHMgYXJlIGNvbXBhcmVkIGJ5IHRoZWlyIHNvdXJjZSBwYXR0ZXJucyBhbmQgZmxhZ3MuXG4gICAgICBjYXNlICdbb2JqZWN0IFJlZ0V4cF0nOlxuICAgICAgICByZXR1cm4gYS5zb3VyY2UgPT0gYi5zb3VyY2UgJiZcbiAgICAgICAgICAgICAgIGEuZ2xvYmFsID09IGIuZ2xvYmFsICYmXG4gICAgICAgICAgICAgICBhLm11bHRpbGluZSA9PSBiLm11bHRpbGluZSAmJlxuICAgICAgICAgICAgICAgYS5pZ25vcmVDYXNlID09IGIuaWdub3JlQ2FzZTtcbiAgICB9XG4gICAgaWYgKHR5cGVvZiBhICE9ICdvYmplY3QnIHx8IHR5cGVvZiBiICE9ICdvYmplY3QnKSByZXR1cm4gZmFsc2U7XG4gICAgLy8gQXNzdW1lIGVxdWFsaXR5IGZvciBjeWNsaWMgc3RydWN0dXJlcy4gVGhlIGFsZ29yaXRobSBmb3IgZGV0ZWN0aW5nIGN5Y2xpY1xuICAgIC8vIHN0cnVjdHVyZXMgaXMgYWRhcHRlZCBmcm9tIEVTIDUuMSBzZWN0aW9uIDE1LjEyLjMsIGFic3RyYWN0IG9wZXJhdGlvbiBgSk9gLlxuICAgIHZhciBsZW5ndGggPSBhU3RhY2subGVuZ3RoO1xuICAgIHdoaWxlIChsZW5ndGgtLSkge1xuICAgICAgLy8gTGluZWFyIHNlYXJjaC4gUGVyZm9ybWFuY2UgaXMgaW52ZXJzZWx5IHByb3BvcnRpb25hbCB0byB0aGUgbnVtYmVyIG9mXG4gICAgICAvLyB1bmlxdWUgbmVzdGVkIHN0cnVjdHVyZXMuXG4gICAgICBpZiAoYVN0YWNrW2xlbmd0aF0gPT0gYSkgcmV0dXJuIGJTdGFja1tsZW5ndGhdID09IGI7XG4gICAgfVxuICAgIC8vIE9iamVjdHMgd2l0aCBkaWZmZXJlbnQgY29uc3RydWN0b3JzIGFyZSBub3QgZXF1aXZhbGVudCwgYnV0IGBPYmplY3Rgc1xuICAgIC8vIGZyb20gZGlmZmVyZW50IGZyYW1lcyBhcmUuXG4gICAgdmFyIGFDdG9yID0gYS5jb25zdHJ1Y3RvciwgYkN0b3IgPSBiLmNvbnN0cnVjdG9yO1xuICAgIGlmIChhQ3RvciAhPT0gYkN0b3IgJiYgIShfLmlzRnVuY3Rpb24oYUN0b3IpICYmIChhQ3RvciBpbnN0YW5jZW9mIGFDdG9yKSAmJlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICBfLmlzRnVuY3Rpb24oYkN0b3IpICYmIChiQ3RvciBpbnN0YW5jZW9mIGJDdG9yKSkpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgLy8gQWRkIHRoZSBmaXJzdCBvYmplY3QgdG8gdGhlIHN0YWNrIG9mIHRyYXZlcnNlZCBvYmplY3RzLlxuICAgIGFTdGFjay5wdXNoKGEpO1xuICAgIGJTdGFjay5wdXNoKGIpO1xuICAgIHZhciBzaXplID0gMCwgcmVzdWx0ID0gdHJ1ZTtcbiAgICAvLyBSZWN1cnNpdmVseSBjb21wYXJlIG9iamVjdHMgYW5kIGFycmF5cy5cbiAgICBpZiAoY2xhc3NOYW1lID09ICdbb2JqZWN0IEFycmF5XScpIHtcbiAgICAgIC8vIENvbXBhcmUgYXJyYXkgbGVuZ3RocyB0byBkZXRlcm1pbmUgaWYgYSBkZWVwIGNvbXBhcmlzb24gaXMgbmVjZXNzYXJ5LlxuICAgICAgc2l6ZSA9IGEubGVuZ3RoO1xuICAgICAgcmVzdWx0ID0gc2l6ZSA9PSBiLmxlbmd0aDtcbiAgICAgIGlmIChyZXN1bHQpIHtcbiAgICAgICAgLy8gRGVlcCBjb21wYXJlIHRoZSBjb250ZW50cywgaWdub3Jpbmcgbm9uLW51bWVyaWMgcHJvcGVydGllcy5cbiAgICAgICAgd2hpbGUgKHNpemUtLSkge1xuICAgICAgICAgIGlmICghKHJlc3VsdCA9IGVxKGFbc2l6ZV0sIGJbc2l6ZV0sIGFTdGFjaywgYlN0YWNrKSkpIGJyZWFrO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIERlZXAgY29tcGFyZSBvYmplY3RzLlxuICAgICAgZm9yICh2YXIga2V5IGluIGEpIHtcbiAgICAgICAgaWYgKF8uaGFzKGEsIGtleSkpIHtcbiAgICAgICAgICAvLyBDb3VudCB0aGUgZXhwZWN0ZWQgbnVtYmVyIG9mIHByb3BlcnRpZXMuXG4gICAgICAgICAgc2l6ZSsrO1xuICAgICAgICAgIC8vIERlZXAgY29tcGFyZSBlYWNoIG1lbWJlci5cbiAgICAgICAgICBpZiAoIShyZXN1bHQgPSBfLmhhcyhiLCBrZXkpICYmIGVxKGFba2V5XSwgYltrZXldLCBhU3RhY2ssIGJTdGFjaykpKSBicmVhaztcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgLy8gRW5zdXJlIHRoYXQgYm90aCBvYmplY3RzIGNvbnRhaW4gdGhlIHNhbWUgbnVtYmVyIG9mIHByb3BlcnRpZXMuXG4gICAgICBpZiAocmVzdWx0KSB7XG4gICAgICAgIGZvciAoa2V5IGluIGIpIHtcbiAgICAgICAgICBpZiAoXy5oYXMoYiwga2V5KSAmJiAhKHNpemUtLSkpIGJyZWFrO1xuICAgICAgICB9XG4gICAgICAgIHJlc3VsdCA9ICFzaXplO1xuICAgICAgfVxuICAgIH1cbiAgICAvLyBSZW1vdmUgdGhlIGZpcnN0IG9iamVjdCBmcm9tIHRoZSBzdGFjayBvZiB0cmF2ZXJzZWQgb2JqZWN0cy5cbiAgICBhU3RhY2sucG9wKCk7XG4gICAgYlN0YWNrLnBvcCgpO1xuICAgIHJldHVybiByZXN1bHQ7XG4gIH07XG5cbiAgLy8gUGVyZm9ybSBhIGRlZXAgY29tcGFyaXNvbiB0byBjaGVjayBpZiB0d28gb2JqZWN0cyBhcmUgZXF1YWwuXG4gIF8uaXNFcXVhbCA9IGZ1bmN0aW9uKGEsIGIpIHtcbiAgICByZXR1cm4gZXEoYSwgYiwgW10sIFtdKTtcbiAgfTtcblxuICAvLyBJcyBhIGdpdmVuIGFycmF5LCBzdHJpbmcsIG9yIG9iamVjdCBlbXB0eT9cbiAgLy8gQW4gXCJlbXB0eVwiIG9iamVjdCBoYXMgbm8gZW51bWVyYWJsZSBvd24tcHJvcGVydGllcy5cbiAgXy5pc0VtcHR5ID0gZnVuY3Rpb24ob2JqKSB7XG4gICAgaWYgKG9iaiA9PSBudWxsKSByZXR1cm4gdHJ1ZTtcbiAgICBpZiAoXy5pc0FycmF5KG9iaikgfHwgXy5pc1N0cmluZyhvYmopKSByZXR1cm4gb2JqLmxlbmd0aCA9PT0gMDtcbiAgICBmb3IgKHZhciBrZXkgaW4gb2JqKSBpZiAoXy5oYXMob2JqLCBrZXkpKSByZXR1cm4gZmFsc2U7XG4gICAgcmV0dXJuIHRydWU7XG4gIH07XG5cbiAgLy8gSXMgYSBnaXZlbiB2YWx1ZSBhIERPTSBlbGVtZW50P1xuICBfLmlzRWxlbWVudCA9IGZ1bmN0aW9uKG9iaikge1xuICAgIHJldHVybiAhIShvYmogJiYgb2JqLm5vZGVUeXBlID09PSAxKTtcbiAgfTtcblxuICAvLyBJcyBhIGdpdmVuIHZhbHVlIGFuIGFycmF5P1xuICAvLyBEZWxlZ2F0ZXMgdG8gRUNNQTUncyBuYXRpdmUgQXJyYXkuaXNBcnJheVxuICBfLmlzQXJyYXkgPSBuYXRpdmVJc0FycmF5IHx8IGZ1bmN0aW9uKG9iaikge1xuICAgIHJldHVybiB0b1N0cmluZy5jYWxsKG9iaikgPT0gJ1tvYmplY3QgQXJyYXldJztcbiAgfTtcblxuICAvLyBJcyBhIGdpdmVuIHZhcmlhYmxlIGFuIG9iamVjdD9cbiAgXy5pc09iamVjdCA9IGZ1bmN0aW9uKG9iaikge1xuICAgIHJldHVybiBvYmogPT09IE9iamVjdChvYmopO1xuICB9O1xuXG4gIC8vIEFkZCBzb21lIGlzVHlwZSBtZXRob2RzOiBpc0FyZ3VtZW50cywgaXNGdW5jdGlvbiwgaXNTdHJpbmcsIGlzTnVtYmVyLCBpc0RhdGUsIGlzUmVnRXhwLlxuICBlYWNoKFsnQXJndW1lbnRzJywgJ0Z1bmN0aW9uJywgJ1N0cmluZycsICdOdW1iZXInLCAnRGF0ZScsICdSZWdFeHAnXSwgZnVuY3Rpb24obmFtZSkge1xuICAgIF9bJ2lzJyArIG5hbWVdID0gZnVuY3Rpb24ob2JqKSB7XG4gICAgICByZXR1cm4gdG9TdHJpbmcuY2FsbChvYmopID09ICdbb2JqZWN0ICcgKyBuYW1lICsgJ10nO1xuICAgIH07XG4gIH0pO1xuXG4gIC8vIERlZmluZSBhIGZhbGxiYWNrIHZlcnNpb24gb2YgdGhlIG1ldGhvZCBpbiBicm93c2VycyAoYWhlbSwgSUUpLCB3aGVyZVxuICAvLyB0aGVyZSBpc24ndCBhbnkgaW5zcGVjdGFibGUgXCJBcmd1bWVudHNcIiB0eXBlLlxuICBpZiAoIV8uaXNBcmd1bWVudHMoYXJndW1lbnRzKSkge1xuICAgIF8uaXNBcmd1bWVudHMgPSBmdW5jdGlvbihvYmopIHtcbiAgICAgIHJldHVybiAhIShvYmogJiYgXy5oYXMob2JqLCAnY2FsbGVlJykpO1xuICAgIH07XG4gIH1cblxuICAvLyBPcHRpbWl6ZSBgaXNGdW5jdGlvbmAgaWYgYXBwcm9wcmlhdGUuXG4gIGlmICh0eXBlb2YgKC8uLykgIT09ICdmdW5jdGlvbicpIHtcbiAgICBfLmlzRnVuY3Rpb24gPSBmdW5jdGlvbihvYmopIHtcbiAgICAgIHJldHVybiB0eXBlb2Ygb2JqID09PSAnZnVuY3Rpb24nO1xuICAgIH07XG4gIH1cblxuICAvLyBJcyBhIGdpdmVuIG9iamVjdCBhIGZpbml0ZSBudW1iZXI/XG4gIF8uaXNGaW5pdGUgPSBmdW5jdGlvbihvYmopIHtcbiAgICByZXR1cm4gaXNGaW5pdGUob2JqKSAmJiAhaXNOYU4ocGFyc2VGbG9hdChvYmopKTtcbiAgfTtcblxuICAvLyBJcyB0aGUgZ2l2ZW4gdmFsdWUgYE5hTmA/IChOYU4gaXMgdGhlIG9ubHkgbnVtYmVyIHdoaWNoIGRvZXMgbm90IGVxdWFsIGl0c2VsZikuXG4gIF8uaXNOYU4gPSBmdW5jdGlvbihvYmopIHtcbiAgICByZXR1cm4gXy5pc051bWJlcihvYmopICYmIG9iaiAhPSArb2JqO1xuICB9O1xuXG4gIC8vIElzIGEgZ2l2ZW4gdmFsdWUgYSBib29sZWFuP1xuICBfLmlzQm9vbGVhbiA9IGZ1bmN0aW9uKG9iaikge1xuICAgIHJldHVybiBvYmogPT09IHRydWUgfHwgb2JqID09PSBmYWxzZSB8fCB0b1N0cmluZy5jYWxsKG9iaikgPT0gJ1tvYmplY3QgQm9vbGVhbl0nO1xuICB9O1xuXG4gIC8vIElzIGEgZ2l2ZW4gdmFsdWUgZXF1YWwgdG8gbnVsbD9cbiAgXy5pc051bGwgPSBmdW5jdGlvbihvYmopIHtcbiAgICByZXR1cm4gb2JqID09PSBudWxsO1xuICB9O1xuXG4gIC8vIElzIGEgZ2l2ZW4gdmFyaWFibGUgdW5kZWZpbmVkP1xuICBfLmlzVW5kZWZpbmVkID0gZnVuY3Rpb24ob2JqKSB7XG4gICAgcmV0dXJuIG9iaiA9PT0gdm9pZCAwO1xuICB9O1xuXG4gIC8vIFNob3J0Y3V0IGZ1bmN0aW9uIGZvciBjaGVja2luZyBpZiBhbiBvYmplY3QgaGFzIGEgZ2l2ZW4gcHJvcGVydHkgZGlyZWN0bHlcbiAgLy8gb24gaXRzZWxmIChpbiBvdGhlciB3b3Jkcywgbm90IG9uIGEgcHJvdG90eXBlKS5cbiAgXy5oYXMgPSBmdW5jdGlvbihvYmosIGtleSkge1xuICAgIHJldHVybiBoYXNPd25Qcm9wZXJ0eS5jYWxsKG9iaiwga2V5KTtcbiAgfTtcblxuICAvLyBVdGlsaXR5IEZ1bmN0aW9uc1xuICAvLyAtLS0tLS0tLS0tLS0tLS0tLVxuXG4gIC8vIFJ1biBVbmRlcnNjb3JlLmpzIGluICpub0NvbmZsaWN0KiBtb2RlLCByZXR1cm5pbmcgdGhlIGBfYCB2YXJpYWJsZSB0byBpdHNcbiAgLy8gcHJldmlvdXMgb3duZXIuIFJldHVybnMgYSByZWZlcmVuY2UgdG8gdGhlIFVuZGVyc2NvcmUgb2JqZWN0LlxuICBfLm5vQ29uZmxpY3QgPSBmdW5jdGlvbigpIHtcbiAgICByb290Ll8gPSBwcmV2aW91c1VuZGVyc2NvcmU7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH07XG5cbiAgLy8gS2VlcCB0aGUgaWRlbnRpdHkgZnVuY3Rpb24gYXJvdW5kIGZvciBkZWZhdWx0IGl0ZXJhdG9ycy5cbiAgXy5pZGVudGl0eSA9IGZ1bmN0aW9uKHZhbHVlKSB7XG4gICAgcmV0dXJuIHZhbHVlO1xuICB9O1xuXG4gIC8vIFJ1biBhIGZ1bmN0aW9uICoqbioqIHRpbWVzLlxuICBfLnRpbWVzID0gZnVuY3Rpb24obiwgaXRlcmF0b3IsIGNvbnRleHQpIHtcbiAgICB2YXIgYWNjdW0gPSBBcnJheShNYXRoLm1heCgwLCBuKSk7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBuOyBpKyspIGFjY3VtW2ldID0gaXRlcmF0b3IuY2FsbChjb250ZXh0LCBpKTtcbiAgICByZXR1cm4gYWNjdW07XG4gIH07XG5cbiAgLy8gUmV0dXJuIGEgcmFuZG9tIGludGVnZXIgYmV0d2VlbiBtaW4gYW5kIG1heCAoaW5jbHVzaXZlKS5cbiAgXy5yYW5kb20gPSBmdW5jdGlvbihtaW4sIG1heCkge1xuICAgIGlmIChtYXggPT0gbnVsbCkge1xuICAgICAgbWF4ID0gbWluO1xuICAgICAgbWluID0gMDtcbiAgICB9XG4gICAgcmV0dXJuIG1pbiArIE1hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIChtYXggLSBtaW4gKyAxKSk7XG4gIH07XG5cbiAgLy8gTGlzdCBvZiBIVE1MIGVudGl0aWVzIGZvciBlc2NhcGluZy5cbiAgdmFyIGVudGl0eU1hcCA9IHtcbiAgICBlc2NhcGU6IHtcbiAgICAgICcmJzogJyZhbXA7JyxcbiAgICAgICc8JzogJyZsdDsnLFxuICAgICAgJz4nOiAnJmd0OycsXG4gICAgICAnXCInOiAnJnF1b3Q7JyxcbiAgICAgIFwiJ1wiOiAnJiN4Mjc7J1xuICAgIH1cbiAgfTtcbiAgZW50aXR5TWFwLnVuZXNjYXBlID0gXy5pbnZlcnQoZW50aXR5TWFwLmVzY2FwZSk7XG5cbiAgLy8gUmVnZXhlcyBjb250YWluaW5nIHRoZSBrZXlzIGFuZCB2YWx1ZXMgbGlzdGVkIGltbWVkaWF0ZWx5IGFib3ZlLlxuICB2YXIgZW50aXR5UmVnZXhlcyA9IHtcbiAgICBlc2NhcGU6ICAgbmV3IFJlZ0V4cCgnWycgKyBfLmtleXMoZW50aXR5TWFwLmVzY2FwZSkuam9pbignJykgKyAnXScsICdnJyksXG4gICAgdW5lc2NhcGU6IG5ldyBSZWdFeHAoJygnICsgXy5rZXlzKGVudGl0eU1hcC51bmVzY2FwZSkuam9pbignfCcpICsgJyknLCAnZycpXG4gIH07XG5cbiAgLy8gRnVuY3Rpb25zIGZvciBlc2NhcGluZyBhbmQgdW5lc2NhcGluZyBzdHJpbmdzIHRvL2Zyb20gSFRNTCBpbnRlcnBvbGF0aW9uLlxuICBfLmVhY2goWydlc2NhcGUnLCAndW5lc2NhcGUnXSwgZnVuY3Rpb24obWV0aG9kKSB7XG4gICAgX1ttZXRob2RdID0gZnVuY3Rpb24oc3RyaW5nKSB7XG4gICAgICBpZiAoc3RyaW5nID09IG51bGwpIHJldHVybiAnJztcbiAgICAgIHJldHVybiAoJycgKyBzdHJpbmcpLnJlcGxhY2UoZW50aXR5UmVnZXhlc1ttZXRob2RdLCBmdW5jdGlvbihtYXRjaCkge1xuICAgICAgICByZXR1cm4gZW50aXR5TWFwW21ldGhvZF1bbWF0Y2hdO1xuICAgICAgfSk7XG4gICAgfTtcbiAgfSk7XG5cbiAgLy8gSWYgdGhlIHZhbHVlIG9mIHRoZSBuYW1lZCBgcHJvcGVydHlgIGlzIGEgZnVuY3Rpb24gdGhlbiBpbnZva2UgaXQgd2l0aCB0aGVcbiAgLy8gYG9iamVjdGAgYXMgY29udGV4dDsgb3RoZXJ3aXNlLCByZXR1cm4gaXQuXG4gIF8ucmVzdWx0ID0gZnVuY3Rpb24ob2JqZWN0LCBwcm9wZXJ0eSkge1xuICAgIGlmIChvYmplY3QgPT0gbnVsbCkgcmV0dXJuIHZvaWQgMDtcbiAgICB2YXIgdmFsdWUgPSBvYmplY3RbcHJvcGVydHldO1xuICAgIHJldHVybiBfLmlzRnVuY3Rpb24odmFsdWUpID8gdmFsdWUuY2FsbChvYmplY3QpIDogdmFsdWU7XG4gIH07XG5cbiAgLy8gQWRkIHlvdXIgb3duIGN1c3RvbSBmdW5jdGlvbnMgdG8gdGhlIFVuZGVyc2NvcmUgb2JqZWN0LlxuICBfLm1peGluID0gZnVuY3Rpb24ob2JqKSB7XG4gICAgZWFjaChfLmZ1bmN0aW9ucyhvYmopLCBmdW5jdGlvbihuYW1lKSB7XG4gICAgICB2YXIgZnVuYyA9IF9bbmFtZV0gPSBvYmpbbmFtZV07XG4gICAgICBfLnByb3RvdHlwZVtuYW1lXSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgYXJncyA9IFt0aGlzLl93cmFwcGVkXTtcbiAgICAgICAgcHVzaC5hcHBseShhcmdzLCBhcmd1bWVudHMpO1xuICAgICAgICByZXR1cm4gcmVzdWx0LmNhbGwodGhpcywgZnVuYy5hcHBseShfLCBhcmdzKSk7XG4gICAgICB9O1xuICAgIH0pO1xuICB9O1xuXG4gIC8vIEdlbmVyYXRlIGEgdW5pcXVlIGludGVnZXIgaWQgKHVuaXF1ZSB3aXRoaW4gdGhlIGVudGlyZSBjbGllbnQgc2Vzc2lvbikuXG4gIC8vIFVzZWZ1bCBmb3IgdGVtcG9yYXJ5IERPTSBpZHMuXG4gIHZhciBpZENvdW50ZXIgPSAwO1xuICBfLnVuaXF1ZUlkID0gZnVuY3Rpb24ocHJlZml4KSB7XG4gICAgdmFyIGlkID0gKytpZENvdW50ZXIgKyAnJztcbiAgICByZXR1cm4gcHJlZml4ID8gcHJlZml4ICsgaWQgOiBpZDtcbiAgfTtcblxuICAvLyBCeSBkZWZhdWx0LCBVbmRlcnNjb3JlIHVzZXMgRVJCLXN0eWxlIHRlbXBsYXRlIGRlbGltaXRlcnMsIGNoYW5nZSB0aGVcbiAgLy8gZm9sbG93aW5nIHRlbXBsYXRlIHNldHRpbmdzIHRvIHVzZSBhbHRlcm5hdGl2ZSBkZWxpbWl0ZXJzLlxuICBfLnRlbXBsYXRlU2V0dGluZ3MgPSB7XG4gICAgZXZhbHVhdGUgICAgOiAvPCUoW1xcc1xcU10rPyklPi9nLFxuICAgIGludGVycG9sYXRlIDogLzwlPShbXFxzXFxTXSs/KSU+L2csXG4gICAgZXNjYXBlICAgICAgOiAvPCUtKFtcXHNcXFNdKz8pJT4vZ1xuICB9O1xuXG4gIC8vIFdoZW4gY3VzdG9taXppbmcgYHRlbXBsYXRlU2V0dGluZ3NgLCBpZiB5b3UgZG9uJ3Qgd2FudCB0byBkZWZpbmUgYW5cbiAgLy8gaW50ZXJwb2xhdGlvbiwgZXZhbHVhdGlvbiBvciBlc2NhcGluZyByZWdleCwgd2UgbmVlZCBvbmUgdGhhdCBpc1xuICAvLyBndWFyYW50ZWVkIG5vdCB0byBtYXRjaC5cbiAgdmFyIG5vTWF0Y2ggPSAvKC4pXi87XG5cbiAgLy8gQ2VydGFpbiBjaGFyYWN0ZXJzIG5lZWQgdG8gYmUgZXNjYXBlZCBzbyB0aGF0IHRoZXkgY2FuIGJlIHB1dCBpbnRvIGFcbiAgLy8gc3RyaW5nIGxpdGVyYWwuXG4gIHZhciBlc2NhcGVzID0ge1xuICAgIFwiJ1wiOiAgICAgIFwiJ1wiLFxuICAgICdcXFxcJzogICAgICdcXFxcJyxcbiAgICAnXFxyJzogICAgICdyJyxcbiAgICAnXFxuJzogICAgICduJyxcbiAgICAnXFx0JzogICAgICd0JyxcbiAgICAnXFx1MjAyOCc6ICd1MjAyOCcsXG4gICAgJ1xcdTIwMjknOiAndTIwMjknXG4gIH07XG5cbiAgdmFyIGVzY2FwZXIgPSAvXFxcXHwnfFxccnxcXG58XFx0fFxcdTIwMjh8XFx1MjAyOS9nO1xuXG4gIC8vIEphdmFTY3JpcHQgbWljcm8tdGVtcGxhdGluZywgc2ltaWxhciB0byBKb2huIFJlc2lnJ3MgaW1wbGVtZW50YXRpb24uXG4gIC8vIFVuZGVyc2NvcmUgdGVtcGxhdGluZyBoYW5kbGVzIGFyYml0cmFyeSBkZWxpbWl0ZXJzLCBwcmVzZXJ2ZXMgd2hpdGVzcGFjZSxcbiAgLy8gYW5kIGNvcnJlY3RseSBlc2NhcGVzIHF1b3RlcyB3aXRoaW4gaW50ZXJwb2xhdGVkIGNvZGUuXG4gIF8udGVtcGxhdGUgPSBmdW5jdGlvbih0ZXh0LCBkYXRhLCBzZXR0aW5ncykge1xuICAgIHZhciByZW5kZXI7XG4gICAgc2V0dGluZ3MgPSBfLmRlZmF1bHRzKHt9LCBzZXR0aW5ncywgXy50ZW1wbGF0ZVNldHRpbmdzKTtcblxuICAgIC8vIENvbWJpbmUgZGVsaW1pdGVycyBpbnRvIG9uZSByZWd1bGFyIGV4cHJlc3Npb24gdmlhIGFsdGVybmF0aW9uLlxuICAgIHZhciBtYXRjaGVyID0gbmV3IFJlZ0V4cChbXG4gICAgICAoc2V0dGluZ3MuZXNjYXBlIHx8IG5vTWF0Y2gpLnNvdXJjZSxcbiAgICAgIChzZXR0aW5ncy5pbnRlcnBvbGF0ZSB8fCBub01hdGNoKS5zb3VyY2UsXG4gICAgICAoc2V0dGluZ3MuZXZhbHVhdGUgfHwgbm9NYXRjaCkuc291cmNlXG4gICAgXS5qb2luKCd8JykgKyAnfCQnLCAnZycpO1xuXG4gICAgLy8gQ29tcGlsZSB0aGUgdGVtcGxhdGUgc291cmNlLCBlc2NhcGluZyBzdHJpbmcgbGl0ZXJhbHMgYXBwcm9wcmlhdGVseS5cbiAgICB2YXIgaW5kZXggPSAwO1xuICAgIHZhciBzb3VyY2UgPSBcIl9fcCs9J1wiO1xuICAgIHRleHQucmVwbGFjZShtYXRjaGVyLCBmdW5jdGlvbihtYXRjaCwgZXNjYXBlLCBpbnRlcnBvbGF0ZSwgZXZhbHVhdGUsIG9mZnNldCkge1xuICAgICAgc291cmNlICs9IHRleHQuc2xpY2UoaW5kZXgsIG9mZnNldClcbiAgICAgICAgLnJlcGxhY2UoZXNjYXBlciwgZnVuY3Rpb24obWF0Y2gpIHsgcmV0dXJuICdcXFxcJyArIGVzY2FwZXNbbWF0Y2hdOyB9KTtcblxuICAgICAgaWYgKGVzY2FwZSkge1xuICAgICAgICBzb3VyY2UgKz0gXCInK1xcbigoX190PShcIiArIGVzY2FwZSArIFwiKSk9PW51bGw/Jyc6Xy5lc2NhcGUoX190KSkrXFxuJ1wiO1xuICAgICAgfVxuICAgICAgaWYgKGludGVycG9sYXRlKSB7XG4gICAgICAgIHNvdXJjZSArPSBcIicrXFxuKChfX3Q9KFwiICsgaW50ZXJwb2xhdGUgKyBcIikpPT1udWxsPycnOl9fdCkrXFxuJ1wiO1xuICAgICAgfVxuICAgICAgaWYgKGV2YWx1YXRlKSB7XG4gICAgICAgIHNvdXJjZSArPSBcIic7XFxuXCIgKyBldmFsdWF0ZSArIFwiXFxuX19wKz0nXCI7XG4gICAgICB9XG4gICAgICBpbmRleCA9IG9mZnNldCArIG1hdGNoLmxlbmd0aDtcbiAgICAgIHJldHVybiBtYXRjaDtcbiAgICB9KTtcbiAgICBzb3VyY2UgKz0gXCInO1xcblwiO1xuXG4gICAgLy8gSWYgYSB2YXJpYWJsZSBpcyBub3Qgc3BlY2lmaWVkLCBwbGFjZSBkYXRhIHZhbHVlcyBpbiBsb2NhbCBzY29wZS5cbiAgICBpZiAoIXNldHRpbmdzLnZhcmlhYmxlKSBzb3VyY2UgPSAnd2l0aChvYmp8fHt9KXtcXG4nICsgc291cmNlICsgJ31cXG4nO1xuXG4gICAgc291cmNlID0gXCJ2YXIgX190LF9fcD0nJyxfX2o9QXJyYXkucHJvdG90eXBlLmpvaW4sXCIgK1xuICAgICAgXCJwcmludD1mdW5jdGlvbigpe19fcCs9X19qLmNhbGwoYXJndW1lbnRzLCcnKTt9O1xcblwiICtcbiAgICAgIHNvdXJjZSArIFwicmV0dXJuIF9fcDtcXG5cIjtcblxuICAgIHRyeSB7XG4gICAgICByZW5kZXIgPSBuZXcgRnVuY3Rpb24oc2V0dGluZ3MudmFyaWFibGUgfHwgJ29iaicsICdfJywgc291cmNlKTtcbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICBlLnNvdXJjZSA9IHNvdXJjZTtcbiAgICAgIHRocm93IGU7XG4gICAgfVxuXG4gICAgaWYgKGRhdGEpIHJldHVybiByZW5kZXIoZGF0YSwgXyk7XG4gICAgdmFyIHRlbXBsYXRlID0gZnVuY3Rpb24oZGF0YSkge1xuICAgICAgcmV0dXJuIHJlbmRlci5jYWxsKHRoaXMsIGRhdGEsIF8pO1xuICAgIH07XG5cbiAgICAvLyBQcm92aWRlIHRoZSBjb21waWxlZCBmdW5jdGlvbiBzb3VyY2UgYXMgYSBjb252ZW5pZW5jZSBmb3IgcHJlY29tcGlsYXRpb24uXG4gICAgdGVtcGxhdGUuc291cmNlID0gJ2Z1bmN0aW9uKCcgKyAoc2V0dGluZ3MudmFyaWFibGUgfHwgJ29iaicpICsgJyl7XFxuJyArIHNvdXJjZSArICd9JztcblxuICAgIHJldHVybiB0ZW1wbGF0ZTtcbiAgfTtcblxuICAvLyBBZGQgYSBcImNoYWluXCIgZnVuY3Rpb24sIHdoaWNoIHdpbGwgZGVsZWdhdGUgdG8gdGhlIHdyYXBwZXIuXG4gIF8uY2hhaW4gPSBmdW5jdGlvbihvYmopIHtcbiAgICByZXR1cm4gXyhvYmopLmNoYWluKCk7XG4gIH07XG5cbiAgLy8gT09QXG4gIC8vIC0tLS0tLS0tLS0tLS0tLVxuICAvLyBJZiBVbmRlcnNjb3JlIGlzIGNhbGxlZCBhcyBhIGZ1bmN0aW9uLCBpdCByZXR1cm5zIGEgd3JhcHBlZCBvYmplY3QgdGhhdFxuICAvLyBjYW4gYmUgdXNlZCBPTy1zdHlsZS4gVGhpcyB3cmFwcGVyIGhvbGRzIGFsdGVyZWQgdmVyc2lvbnMgb2YgYWxsIHRoZVxuICAvLyB1bmRlcnNjb3JlIGZ1bmN0aW9ucy4gV3JhcHBlZCBvYmplY3RzIG1heSBiZSBjaGFpbmVkLlxuXG4gIC8vIEhlbHBlciBmdW5jdGlvbiB0byBjb250aW51ZSBjaGFpbmluZyBpbnRlcm1lZGlhdGUgcmVzdWx0cy5cbiAgdmFyIHJlc3VsdCA9IGZ1bmN0aW9uKG9iaikge1xuICAgIHJldHVybiB0aGlzLl9jaGFpbiA/IF8ob2JqKS5jaGFpbigpIDogb2JqO1xuICB9O1xuXG4gIC8vIEFkZCBhbGwgb2YgdGhlIFVuZGVyc2NvcmUgZnVuY3Rpb25zIHRvIHRoZSB3cmFwcGVyIG9iamVjdC5cbiAgXy5taXhpbihfKTtcblxuICAvLyBBZGQgYWxsIG11dGF0b3IgQXJyYXkgZnVuY3Rpb25zIHRvIHRoZSB3cmFwcGVyLlxuICBlYWNoKFsncG9wJywgJ3B1c2gnLCAncmV2ZXJzZScsICdzaGlmdCcsICdzb3J0JywgJ3NwbGljZScsICd1bnNoaWZ0J10sIGZ1bmN0aW9uKG5hbWUpIHtcbiAgICB2YXIgbWV0aG9kID0gQXJyYXlQcm90b1tuYW1lXTtcbiAgICBfLnByb3RvdHlwZVtuYW1lXSA9IGZ1bmN0aW9uKCkge1xuICAgICAgdmFyIG9iaiA9IHRoaXMuX3dyYXBwZWQ7XG4gICAgICBtZXRob2QuYXBwbHkob2JqLCBhcmd1bWVudHMpO1xuICAgICAgaWYgKChuYW1lID09ICdzaGlmdCcgfHwgbmFtZSA9PSAnc3BsaWNlJykgJiYgb2JqLmxlbmd0aCA9PT0gMCkgZGVsZXRlIG9ialswXTtcbiAgICAgIHJldHVybiByZXN1bHQuY2FsbCh0aGlzLCBvYmopO1xuICAgIH07XG4gIH0pO1xuXG4gIC8vIEFkZCBhbGwgYWNjZXNzb3IgQXJyYXkgZnVuY3Rpb25zIHRvIHRoZSB3cmFwcGVyLlxuICBlYWNoKFsnY29uY2F0JywgJ2pvaW4nLCAnc2xpY2UnXSwgZnVuY3Rpb24obmFtZSkge1xuICAgIHZhciBtZXRob2QgPSBBcnJheVByb3RvW25hbWVdO1xuICAgIF8ucHJvdG90eXBlW25hbWVdID0gZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gcmVzdWx0LmNhbGwodGhpcywgbWV0aG9kLmFwcGx5KHRoaXMuX3dyYXBwZWQsIGFyZ3VtZW50cykpO1xuICAgIH07XG4gIH0pO1xuXG4gIF8uZXh0ZW5kKF8ucHJvdG90eXBlLCB7XG5cbiAgICAvLyBTdGFydCBjaGFpbmluZyBhIHdyYXBwZWQgVW5kZXJzY29yZSBvYmplY3QuXG4gICAgY2hhaW46IGZ1bmN0aW9uKCkge1xuICAgICAgdGhpcy5fY2hhaW4gPSB0cnVlO1xuICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfSxcblxuICAgIC8vIEV4dHJhY3RzIHRoZSByZXN1bHQgZnJvbSBhIHdyYXBwZWQgYW5kIGNoYWluZWQgb2JqZWN0LlxuICAgIHZhbHVlOiBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiB0aGlzLl93cmFwcGVkO1xuICAgIH1cblxuICB9KTtcblxufSkuY2FsbCh0aGlzKTtcbiJdfQ==
;