;(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
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
},{"./lib/jquery.mousewheel.js":2,"./lib/jquery.signalR-2.0.0-beta2.js":3,"json-patch":4}],2:[function(require,module,exports){
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

},{}]},{},[1])
//@ sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlcyI6WyJjOlxcd29ya3NwYWNlXFxSZWJ1c1xcc3JjXFxSZWJ1cy5GbGVldEtlZXBlclxcV2ViXFxhcHAuanMiLCJjOlxcd29ya3NwYWNlXFxSZWJ1c1xcc3JjXFxSZWJ1cy5GbGVldEtlZXBlclxcV2ViXFxsaWJcXGpxdWVyeS5tb3VzZXdoZWVsLmpzIiwiYzpcXHdvcmtzcGFjZVxcUmVidXNcXHNyY1xcUmVidXMuRmxlZXRLZWVwZXJcXFdlYlxcbGliXFxqcXVlcnkuc2lnbmFsUi0yLjAuMC1iZXRhMi5qcyIsImM6XFx3b3Jrc3BhY2VcXFJlYnVzXFxzcmNcXFJlYnVzLkZsZWV0S2VlcGVyXFxXZWJcXG5vZGVfbW9kdWxlc1xcanNvbi1wYXRjaFxcanNvbnBhdGNoLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDckhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcHFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsInNvdXJjZXNDb250ZW50IjpbInJlcXVpcmUoJ2pxdWVyeScpO1xyXG5yZXF1aXJlKCcuL2xpYi9qcXVlcnkuc2lnbmFsUi0yLjAuMC1iZXRhMi5qcycpO1xyXG5yZXF1aXJlKCcuL2xpYi9qcXVlcnkubW91c2V3aGVlbC5qcycpKCQpO1xyXG5yZXF1aXJlKFwiYW5ndWxhclwiKTtcclxuICAgICAgICAgICAgICBcclxuJChcImJvZHlcIikubW91c2V3aGVlbChmdW5jdGlvbiAoZXZlbnQsIGRlbHRhKSB7XHJcbiAgICB0aGlzLnNjcm9sbExlZnQgLT0gKGRlbHRhICogMzApO1xyXG4gICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcclxufSk7XHJcblxyXG52YXIgcGF0Y2hlciA9IHJlcXVpcmUoXCJqc29uLXBhdGNoXCIpO1xyXG5cclxudmFyIGFwcCA9IGFuZ3VsYXIubW9kdWxlKCdmbGVldGtlZXBlcicsIFtdKTtcclxuXHJcbmFwcC5jb250cm9sbGVyKCdJbmRleENvbnRyb2xsZXInLCBmdW5jdGlvbigkc2NvcGUpIHtcclxuICAgIHZhciBodWIgPSAkLmNvbm5lY3Rpb24uZmxlZXRLZWVwZXJIdWI7XHJcbiAgICAkc2NvcGUuc2VydmljZXMgPSBbXTtcclxuXHJcbiAgICBodWIuY2xpZW50LmV4ZWN1dGUgPSBmdW5jdGlvbiAodmlldywgcGF0Y2gpIHtcclxuICAgICAgICAkc2NvcGUuJGFwcGx5KGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgcGF0Y2hlci5hcHBseSgkc2NvcGUsIFt7XHJcbiAgICAgICAgICAgICAgICBvcDogcGF0Y2gub3AsXHJcbiAgICAgICAgICAgICAgICBwYXRoOiAnLycgKyB2aWV3ICsgcGF0Y2gucGF0aCxcclxuICAgICAgICAgICAgICAgIHZhbHVlOiBwYXRjaC52YWx1ZVxyXG4gICAgICAgICAgICB9XSk7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9O1xyXG59KTsiLCIvKiEgQ29weXJpZ2h0IChjKSAyMDEzIEJyYW5kb24gQWFyb24gKGh0dHA6Ly9icmFuZG9uYWFyb24ubmV0KVxuICogTGljZW5zZWQgdW5kZXIgdGhlIE1JVCBMaWNlbnNlIChMSUNFTlNFLnR4dCkuXG4gKlxuICogVGhhbmtzIHRvOiBodHRwOi8vYWRvbWFzLm9yZy9qYXZhc2NyaXB0LW1vdXNlLXdoZWVsLyBmb3Igc29tZSBwb2ludGVycy5cbiAqIFRoYW5rcyB0bzogTWF0aGlhcyBCYW5rKGh0dHA6Ly93d3cubWF0aGlhcy1iYW5rLmRlKSBmb3IgYSBzY29wZSBidWcgZml4LlxuICogVGhhbmtzIHRvOiBTZWFtdXMgTGVhaHkgZm9yIGFkZGluZyBkZWx0YVggYW5kIGRlbHRhWVxuICpcbiAqIFZlcnNpb246IDMuMS4zXG4gKlxuICogUmVxdWlyZXM6IDEuMi4yK1xuICovXG5cbihmdW5jdGlvbiAoZmFjdG9yeSkge1xuICAgIGlmICggdHlwZW9mIGRlZmluZSA9PT0gJ2Z1bmN0aW9uJyAmJiBkZWZpbmUuYW1kICkge1xuICAgICAgICAvLyBBTUQuIFJlZ2lzdGVyIGFzIGFuIGFub255bW91cyBtb2R1bGUuXG4gICAgICAgIGRlZmluZShbJ2pxdWVyeSddLCBmYWN0b3J5KTtcbiAgICB9IGVsc2UgaWYgKHR5cGVvZiBleHBvcnRzID09PSAnb2JqZWN0Jykge1xuICAgICAgICAvLyBOb2RlL0NvbW1vbkpTIHN0eWxlIGZvciBCcm93c2VyaWZ5XG4gICAgICAgIG1vZHVsZS5leHBvcnRzID0gZmFjdG9yeTtcbiAgICB9IGVsc2Uge1xuICAgICAgICAvLyBCcm93c2VyIGdsb2JhbHNcbiAgICAgICAgZmFjdG9yeShqUXVlcnkpO1xuICAgIH1cbn0oZnVuY3Rpb24gKCQpIHtcblxuICAgIHZhciB0b0ZpeCA9IFsnd2hlZWwnLCAnbW91c2V3aGVlbCcsICdET01Nb3VzZVNjcm9sbCcsICdNb3pNb3VzZVBpeGVsU2Nyb2xsJ107XG4gICAgdmFyIHRvQmluZCA9ICdvbndoZWVsJyBpbiBkb2N1bWVudCB8fCBkb2N1bWVudC5kb2N1bWVudE1vZGUgPj0gOSA/IFsnd2hlZWwnXSA6IFsnbW91c2V3aGVlbCcsICdEb21Nb3VzZVNjcm9sbCcsICdNb3pNb3VzZVBpeGVsU2Nyb2xsJ107XG4gICAgdmFyIGxvd2VzdERlbHRhLCBsb3dlc3REZWx0YVhZO1xuXG4gICAgaWYgKCAkLmV2ZW50LmZpeEhvb2tzICkge1xuICAgICAgICBmb3IgKCB2YXIgaSA9IHRvRml4Lmxlbmd0aDsgaTsgKSB7XG4gICAgICAgICAgICAkLmV2ZW50LmZpeEhvb2tzWyB0b0ZpeFstLWldIF0gPSAkLmV2ZW50Lm1vdXNlSG9va3M7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAkLmV2ZW50LnNwZWNpYWwubW91c2V3aGVlbCA9IHtcbiAgICAgICAgc2V0dXA6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgaWYgKCB0aGlzLmFkZEV2ZW50TGlzdGVuZXIgKSB7XG4gICAgICAgICAgICAgICAgZm9yICggdmFyIGkgPSB0b0JpbmQubGVuZ3RoOyBpOyApIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5hZGRFdmVudExpc3RlbmVyKCB0b0JpbmRbLS1pXSwgaGFuZGxlciwgZmFsc2UgKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHRoaXMub25tb3VzZXdoZWVsID0gaGFuZGxlcjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcblxuICAgICAgICB0ZWFyZG93bjogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICBpZiAoIHRoaXMucmVtb3ZlRXZlbnRMaXN0ZW5lciApIHtcbiAgICAgICAgICAgICAgICBmb3IgKCB2YXIgaSA9IHRvQmluZC5sZW5ndGg7IGk7ICkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnJlbW92ZUV2ZW50TGlzdGVuZXIoIHRvQmluZFstLWldLCBoYW5kbGVyLCBmYWxzZSApO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgdGhpcy5vbm1vdXNld2hlZWwgPSBudWxsO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfTtcblxuICAgICQuZm4uZXh0ZW5kKHtcbiAgICAgICAgbW91c2V3aGVlbDogZnVuY3Rpb24oZm4pIHtcbiAgICAgICAgICAgIHJldHVybiBmbiA/IHRoaXMuYmluZChcIm1vdXNld2hlZWxcIiwgZm4pIDogdGhpcy50cmlnZ2VyKFwibW91c2V3aGVlbFwiKTtcbiAgICAgICAgfSxcblxuICAgICAgICB1bm1vdXNld2hlZWw6IGZ1bmN0aW9uKGZuKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy51bmJpbmQoXCJtb3VzZXdoZWVsXCIsIGZuKTtcbiAgICAgICAgfVxuICAgIH0pO1xuXG5cbiAgICBmdW5jdGlvbiBoYW5kbGVyKGV2ZW50KSB7XG4gICAgICAgIHZhciBvcmdFdmVudCA9IGV2ZW50IHx8IHdpbmRvdy5ldmVudCxcbiAgICAgICAgICAgIGFyZ3MgPSBbXS5zbGljZS5jYWxsKGFyZ3VtZW50cywgMSksXG4gICAgICAgICAgICBkZWx0YSA9IDAsXG4gICAgICAgICAgICBkZWx0YVggPSAwLFxuICAgICAgICAgICAgZGVsdGFZID0gMCxcbiAgICAgICAgICAgIGFic0RlbHRhID0gMCxcbiAgICAgICAgICAgIGFic0RlbHRhWFkgPSAwLFxuICAgICAgICAgICAgZm47XG4gICAgICAgIGV2ZW50ID0gJC5ldmVudC5maXgob3JnRXZlbnQpO1xuICAgICAgICBldmVudC50eXBlID0gXCJtb3VzZXdoZWVsXCI7XG5cbiAgICAgICAgLy8gT2xkIHNjaG9vbCBzY3JvbGx3aGVlbCBkZWx0YVxuICAgICAgICBpZiAoIG9yZ0V2ZW50LndoZWVsRGVsdGEgKSB7IGRlbHRhID0gb3JnRXZlbnQud2hlZWxEZWx0YTsgfVxuICAgICAgICBpZiAoIG9yZ0V2ZW50LmRldGFpbCApICAgICB7IGRlbHRhID0gb3JnRXZlbnQuZGV0YWlsICogLTE7IH1cblxuICAgICAgICAvLyBOZXcgc2Nob29sIHdoZWVsIGRlbHRhICh3aGVlbCBldmVudClcbiAgICAgICAgaWYgKCBvcmdFdmVudC5kZWx0YVkgKSB7XG4gICAgICAgICAgICBkZWx0YVkgPSBvcmdFdmVudC5kZWx0YVkgKiAtMTtcbiAgICAgICAgICAgIGRlbHRhICA9IGRlbHRhWTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoIG9yZ0V2ZW50LmRlbHRhWCApIHtcbiAgICAgICAgICAgIGRlbHRhWCA9IG9yZ0V2ZW50LmRlbHRhWDtcbiAgICAgICAgICAgIGRlbHRhICA9IGRlbHRhWCAqIC0xO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gV2Via2l0XG4gICAgICAgIGlmICggb3JnRXZlbnQud2hlZWxEZWx0YVkgIT09IHVuZGVmaW5lZCApIHsgZGVsdGFZID0gb3JnRXZlbnQud2hlZWxEZWx0YVk7IH1cbiAgICAgICAgaWYgKCBvcmdFdmVudC53aGVlbERlbHRhWCAhPT0gdW5kZWZpbmVkICkgeyBkZWx0YVggPSBvcmdFdmVudC53aGVlbERlbHRhWCAqIC0xOyB9XG5cbiAgICAgICAgLy8gTG9vayBmb3IgbG93ZXN0IGRlbHRhIHRvIG5vcm1hbGl6ZSB0aGUgZGVsdGEgdmFsdWVzXG4gICAgICAgIGFic0RlbHRhID0gTWF0aC5hYnMoZGVsdGEpO1xuICAgICAgICBpZiAoICFsb3dlc3REZWx0YSB8fCBhYnNEZWx0YSA8IGxvd2VzdERlbHRhICkgeyBsb3dlc3REZWx0YSA9IGFic0RlbHRhOyB9XG4gICAgICAgIGFic0RlbHRhWFkgPSBNYXRoLm1heChNYXRoLmFicyhkZWx0YVkpLCBNYXRoLmFicyhkZWx0YVgpKTtcbiAgICAgICAgaWYgKCAhbG93ZXN0RGVsdGFYWSB8fCBhYnNEZWx0YVhZIDwgbG93ZXN0RGVsdGFYWSApIHsgbG93ZXN0RGVsdGFYWSA9IGFic0RlbHRhWFk7IH1cblxuICAgICAgICAvLyBHZXQgYSB3aG9sZSB2YWx1ZSBmb3IgdGhlIGRlbHRhc1xuICAgICAgICBmbiA9IGRlbHRhID4gMCA/ICdmbG9vcicgOiAnY2VpbCc7XG4gICAgICAgIGRlbHRhICA9IE1hdGhbZm5dKGRlbHRhIC8gbG93ZXN0RGVsdGEpO1xuICAgICAgICBkZWx0YVggPSBNYXRoW2ZuXShkZWx0YVggLyBsb3dlc3REZWx0YVhZKTtcbiAgICAgICAgZGVsdGFZID0gTWF0aFtmbl0oZGVsdGFZIC8gbG93ZXN0RGVsdGFYWSk7XG5cbiAgICAgICAgLy8gQWRkIGV2ZW50IGFuZCBkZWx0YSB0byB0aGUgZnJvbnQgb2YgdGhlIGFyZ3VtZW50c1xuICAgICAgICBhcmdzLnVuc2hpZnQoZXZlbnQsIGRlbHRhLCBkZWx0YVgsIGRlbHRhWSk7XG5cbiAgICAgICAgcmV0dXJuICgkLmV2ZW50LmRpc3BhdGNoIHx8ICQuZXZlbnQuaGFuZGxlKS5hcHBseSh0aGlzLCBhcmdzKTtcbiAgICB9XG5cbn0pKTtcbiIsIi8qIGpxdWVyeS5zaWduYWxSLmNvcmUuanMgKi9cclxuLypnbG9iYWwgd2luZG93OmZhbHNlICovXHJcbi8qIVxyXG4gKiBBU1AuTkVUIFNpZ25hbFIgSmF2YVNjcmlwdCBMaWJyYXJ5IHYyLjAuMC1iZXRhMlxyXG4gKiBodHRwOi8vc2lnbmFsci5uZXQvXHJcbiAqXHJcbiAqIENvcHlyaWdodCAoQykgTWljcm9zb2Z0IENvcnBvcmF0aW9uLiBBbGwgcmlnaHRzIHJlc2VydmVkLlxyXG4gKlxyXG4gKi9cclxuXHJcbi8vLyA8cmVmZXJlbmNlIHBhdGg9XCJTY3JpcHRzL2pxdWVyeS0xLjYuNC5qc1wiIC8+XHJcbi8vLyA8cmVmZXJlbmNlIHBhdGg9XCJqcXVlcnkuc2lnbmFsUi52ZXJzaW9uLmpzXCIgLz5cclxuKGZ1bmN0aW9uICgkLCB3aW5kb3cpIHtcclxuICAgIFwidXNlIHN0cmljdFwiO1xyXG5cclxuICAgIGlmICh0eXBlb2YgKCQpICE9PSBcImZ1bmN0aW9uXCIpIHtcclxuICAgICAgICAvLyBubyBqUXVlcnkhXHJcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiU2lnbmFsUjogalF1ZXJ5IG5vdCBmb3VuZC4gUGxlYXNlIGVuc3VyZSBqUXVlcnkgaXMgcmVmZXJlbmNlZCBiZWZvcmUgdGhlIFNpZ25hbFIuanMgZmlsZS5cIik7XHJcbiAgICB9XHJcblxyXG4gICAgdmFyIHNpZ25hbFIsXHJcbiAgICAgICAgX2Nvbm5lY3Rpb24sXHJcbiAgICAgICAgX3BhZ2VMb2FkZWQgPSAod2luZG93LmRvY3VtZW50LnJlYWR5U3RhdGUgPT09IFwiY29tcGxldGVcIiksXHJcbiAgICAgICAgX3BhZ2VXaW5kb3cgPSAkKHdpbmRvdyksXHJcbiAgICAgICAgX25lZ290aWF0ZUFib3J0VGV4dCA9IFwiX19OZWdvdGlhdGUgQWJvcnRlZF9fXCIsXHJcbiAgICAgICAgZXZlbnRzID0ge1xyXG4gICAgICAgICAgICBvblN0YXJ0OiBcIm9uU3RhcnRcIixcclxuICAgICAgICAgICAgb25TdGFydGluZzogXCJvblN0YXJ0aW5nXCIsXHJcbiAgICAgICAgICAgIG9uUmVjZWl2ZWQ6IFwib25SZWNlaXZlZFwiLFxyXG4gICAgICAgICAgICBvbkVycm9yOiBcIm9uRXJyb3JcIixcclxuICAgICAgICAgICAgb25Db25uZWN0aW9uU2xvdzogXCJvbkNvbm5lY3Rpb25TbG93XCIsXHJcbiAgICAgICAgICAgIG9uUmVjb25uZWN0aW5nOiBcIm9uUmVjb25uZWN0aW5nXCIsXHJcbiAgICAgICAgICAgIG9uUmVjb25uZWN0OiBcIm9uUmVjb25uZWN0XCIsXHJcbiAgICAgICAgICAgIG9uU3RhdGVDaGFuZ2VkOiBcIm9uU3RhdGVDaGFuZ2VkXCIsXHJcbiAgICAgICAgICAgIG9uRGlzY29ubmVjdDogXCJvbkRpc2Nvbm5lY3RcIlxyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIGxvZyA9IGZ1bmN0aW9uIChtc2csIGxvZ2dpbmcpIHtcclxuICAgICAgICAgICAgaWYgKGxvZ2dpbmcgPT09IGZhbHNlKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgdmFyIG07XHJcbiAgICAgICAgICAgIGlmICh0eXBlb2YgKHdpbmRvdy5jb25zb2xlKSA9PT0gXCJ1bmRlZmluZWRcIikge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIG0gPSBcIltcIiArIG5ldyBEYXRlKCkudG9UaW1lU3RyaW5nKCkgKyBcIl0gU2lnbmFsUjogXCIgKyBtc2c7XHJcbiAgICAgICAgICAgIGlmICh3aW5kb3cuY29uc29sZS5kZWJ1Zykge1xyXG4gICAgICAgICAgICAgICAgd2luZG93LmNvbnNvbGUuZGVidWcobSk7XHJcbiAgICAgICAgICAgIH0gZWxzZSBpZiAod2luZG93LmNvbnNvbGUubG9nKSB7XHJcbiAgICAgICAgICAgICAgICB3aW5kb3cuY29uc29sZS5sb2cobSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICBjaGFuZ2VTdGF0ZSA9IGZ1bmN0aW9uIChjb25uZWN0aW9uLCBleHBlY3RlZFN0YXRlLCBuZXdTdGF0ZSkge1xyXG4gICAgICAgICAgICBpZiAoZXhwZWN0ZWRTdGF0ZSA9PT0gY29ubmVjdGlvbi5zdGF0ZSkge1xyXG4gICAgICAgICAgICAgICAgY29ubmVjdGlvbi5zdGF0ZSA9IG5ld1N0YXRlO1xyXG5cclxuICAgICAgICAgICAgICAgICQoY29ubmVjdGlvbikudHJpZ2dlckhhbmRsZXIoZXZlbnRzLm9uU3RhdGVDaGFuZ2VkLCBbeyBvbGRTdGF0ZTogZXhwZWN0ZWRTdGF0ZSwgbmV3U3RhdGU6IG5ld1N0YXRlIH1dKTtcclxuICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgaXNEaXNjb25uZWN0aW5nID0gZnVuY3Rpb24gKGNvbm5lY3Rpb24pIHtcclxuICAgICAgICAgICAgcmV0dXJuIGNvbm5lY3Rpb24uc3RhdGUgPT09IHNpZ25hbFIuY29ubmVjdGlvblN0YXRlLmRpc2Nvbm5lY3RlZDtcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICBjb25maWd1cmVTdG9wUmVjb25uZWN0aW5nVGltZW91dCA9IGZ1bmN0aW9uIChjb25uZWN0aW9uKSB7XHJcbiAgICAgICAgICAgIHZhciBzdG9wUmVjb25uZWN0aW5nVGltZW91dCxcclxuICAgICAgICAgICAgICAgIG9uUmVjb25uZWN0VGltZW91dDtcclxuXHJcbiAgICAgICAgICAgIC8vIENoZWNrIGlmIHRoaXMgY29ubmVjdGlvbiBoYXMgYWxyZWFkeSBiZWVuIGNvbmZpZ3VyZWQgdG8gc3RvcCByZWNvbm5lY3RpbmcgYWZ0ZXIgYSBzcGVjaWZpZWQgdGltZW91dC5cclxuICAgICAgICAgICAgLy8gV2l0aG91dCB0aGlzIGNoZWNrIGlmIGEgY29ubmVjdGlvbiBpcyBzdG9wcGVkIHRoZW4gc3RhcnRlZCBldmVudHMgd2lsbCBiZSBib3VuZCBtdWx0aXBsZSB0aW1lcy5cclxuICAgICAgICAgICAgaWYgKCFjb25uZWN0aW9uLl8uY29uZmlndXJlZFN0b3BSZWNvbm5lY3RpbmdUaW1lb3V0KSB7XHJcbiAgICAgICAgICAgICAgICBvblJlY29ubmVjdFRpbWVvdXQgPSBmdW5jdGlvbiAoY29ubmVjdGlvbikge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbm5lY3Rpb24ubG9nKFwiQ291bGRuJ3QgcmVjb25uZWN0IHdpdGhpbiB0aGUgY29uZmlndXJlZCB0aW1lb3V0IChcIiArIGNvbm5lY3Rpb24uZGlzY29ubmVjdFRpbWVvdXQgKyBcIm1zKSwgZGlzY29ubmVjdGluZy5cIik7XHJcbiAgICAgICAgICAgICAgICAgICAgY29ubmVjdGlvbi5zdG9wKC8qIGFzeW5jICovIGZhbHNlLCAvKiBub3RpZnlTZXJ2ZXIgKi8gZmFsc2UpO1xyXG4gICAgICAgICAgICAgICAgfTtcclxuXHJcbiAgICAgICAgICAgICAgICBjb25uZWN0aW9uLnJlY29ubmVjdGluZyhmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIGNvbm5lY3Rpb24gPSB0aGlzO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAvLyBHdWFyZCBhZ2FpbnN0IHN0YXRlIGNoYW5naW5nIGluIGEgcHJldmlvdXMgdXNlciBkZWZpbmVkIGV2ZW4gaGFuZGxlclxyXG4gICAgICAgICAgICAgICAgICAgIGlmIChjb25uZWN0aW9uLnN0YXRlID09PSBzaWduYWxSLmNvbm5lY3Rpb25TdGF0ZS5yZWNvbm5lY3RpbmcpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgc3RvcFJlY29ubmVjdGluZ1RpbWVvdXQgPSB3aW5kb3cuc2V0VGltZW91dChmdW5jdGlvbiAoKSB7IG9uUmVjb25uZWN0VGltZW91dChjb25uZWN0aW9uKTsgfSwgY29ubmVjdGlvbi5kaXNjb25uZWN0VGltZW91dCk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgICAgICAgY29ubmVjdGlvbi5zdGF0ZUNoYW5nZWQoZnVuY3Rpb24gKGRhdGEpIHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoZGF0YS5vbGRTdGF0ZSA9PT0gc2lnbmFsUi5jb25uZWN0aW9uU3RhdGUucmVjb25uZWN0aW5nKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIENsZWFyIHRoZSBwZW5kaW5nIHJlY29ubmVjdCB0aW1lb3V0IGNoZWNrXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHdpbmRvdy5jbGVhclRpbWVvdXQoc3RvcFJlY29ubmVjdGluZ1RpbWVvdXQpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgICAgICAgIGNvbm5lY3Rpb24uXy5jb25maWd1cmVkU3RvcFJlY29ubmVjdGluZ1RpbWVvdXQgPSB0cnVlO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfTtcclxuXHJcbiAgICBzaWduYWxSID0gZnVuY3Rpb24gKHVybCwgcXMsIGxvZ2dpbmcpIHtcclxuICAgICAgICAvLy8gPHN1bW1hcnk+Q3JlYXRlcyBhIG5ldyBTaWduYWxSIGNvbm5lY3Rpb24gZm9yIHRoZSBnaXZlbiB1cmw8L3N1bW1hcnk+XHJcbiAgICAgICAgLy8vIDxwYXJhbSBuYW1lPVwidXJsXCIgdHlwZT1cIlN0cmluZ1wiPlRoZSBVUkwgb2YgdGhlIGxvbmcgcG9sbGluZyBlbmRwb2ludDwvcGFyYW0+XHJcbiAgICAgICAgLy8vIDxwYXJhbSBuYW1lPVwicXNcIiB0eXBlPVwiT2JqZWN0XCI+XHJcbiAgICAgICAgLy8vICAgICBbT3B0aW9uYWxdIEN1c3RvbSBxdWVyeXN0cmluZyBwYXJhbWV0ZXJzIHRvIGFkZCB0byB0aGUgY29ubmVjdGlvbiBVUkwuXHJcbiAgICAgICAgLy8vICAgICBJZiBhbiBvYmplY3QsIGV2ZXJ5IG5vbi1mdW5jdGlvbiBtZW1iZXIgd2lsbCBiZSBhZGRlZCB0byB0aGUgcXVlcnlzdHJpbmcuXHJcbiAgICAgICAgLy8vICAgICBJZiBhIHN0cmluZywgaXQncyBhZGRlZCB0byB0aGUgUVMgYXMgc3BlY2lmaWVkLlxyXG4gICAgICAgIC8vLyA8L3BhcmFtPlxyXG4gICAgICAgIC8vLyA8cGFyYW0gbmFtZT1cImxvZ2dpbmdcIiB0eXBlPVwiQm9vbGVhblwiPlxyXG4gICAgICAgIC8vLyAgICAgW09wdGlvbmFsXSBBIGZsYWcgaW5kaWNhdGluZyB3aGV0aGVyIGNvbm5lY3Rpb24gbG9nZ2luZyBpcyBlbmFibGVkIHRvIHRoZSBicm93c2VyXHJcbiAgICAgICAgLy8vICAgICBjb25zb2xlL2xvZy4gRGVmYXVsdHMgdG8gZmFsc2UuXHJcbiAgICAgICAgLy8vIDwvcGFyYW0+XHJcblxyXG4gICAgICAgIHJldHVybiBuZXcgc2lnbmFsUi5mbi5pbml0KHVybCwgcXMsIGxvZ2dpbmcpO1xyXG4gICAgfTtcclxuXHJcbiAgICBzaWduYWxSLl8gPSB7XHJcbiAgICAgICAgZGVmYXVsdENvbnRlbnRUeXBlOiBcImFwcGxpY2F0aW9uL3gtd3d3LWZvcm0tdXJsZW5jb2RlZDsgY2hhcnNldD1VVEYtOFwiLFxyXG4gICAgICAgIGllVmVyc2lvbjogKGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgdmFyIHZlcnNpb24sXHJcbiAgICAgICAgICAgICAgICBtYXRjaGVzO1xyXG5cclxuICAgICAgICAgICAgaWYgKHdpbmRvdy5uYXZpZ2F0b3IuYXBwTmFtZSA9PT0gJ01pY3Jvc29mdCBJbnRlcm5ldCBFeHBsb3JlcicpIHtcclxuICAgICAgICAgICAgICAgIC8vIENoZWNrIGlmIHRoZSB1c2VyIGFnZW50IGhhcyB0aGUgcGF0dGVybiBcIk1TSUUgKG9uZSBvciBtb3JlIG51bWJlcnMpLihvbmUgb3IgbW9yZSBudW1iZXJzKVwiO1xyXG4gICAgICAgICAgICAgICAgbWF0Y2hlcyA9IC9NU0lFIChbMC05XStcXC5bMC05XSspLy5leGVjKHdpbmRvdy5uYXZpZ2F0b3IudXNlckFnZW50KTtcclxuXHJcbiAgICAgICAgICAgICAgICBpZiAobWF0Y2hlcykge1xyXG4gICAgICAgICAgICAgICAgICAgIHZlcnNpb24gPSB3aW5kb3cucGFyc2VGbG9hdChtYXRjaGVzWzFdKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgLy8gdW5kZWZpbmVkIHZhbHVlIG1lYW5zIG5vdCBJRVxyXG4gICAgICAgICAgICByZXR1cm4gdmVyc2lvbjtcclxuICAgICAgICB9KSgpXHJcbiAgICB9O1xyXG5cclxuICAgIHNpZ25hbFIuZXZlbnRzID0gZXZlbnRzO1xyXG5cclxuICAgIHNpZ25hbFIuY2hhbmdlU3RhdGUgPSBjaGFuZ2VTdGF0ZTtcclxuXHJcbiAgICBzaWduYWxSLmlzRGlzY29ubmVjdGluZyA9IGlzRGlzY29ubmVjdGluZztcclxuXHJcbiAgICBzaWduYWxSLmNvbm5lY3Rpb25TdGF0ZSA9IHtcclxuICAgICAgICBjb25uZWN0aW5nOiAwLFxyXG4gICAgICAgIGNvbm5lY3RlZDogMSxcclxuICAgICAgICByZWNvbm5lY3Rpbmc6IDIsXHJcbiAgICAgICAgZGlzY29ubmVjdGVkOiA0XHJcbiAgICB9O1xyXG5cclxuICAgIHNpZ25hbFIuaHViID0ge1xyXG4gICAgICAgIHN0YXJ0OiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIC8vIFRoaXMgd2lsbCBnZXQgcmVwbGFjZWQgd2l0aCB0aGUgcmVhbCBodWIgY29ubmVjdGlvbiBzdGFydCBtZXRob2Qgd2hlbiBodWJzIGlzIHJlZmVyZW5jZWQgY29ycmVjdGx5XHJcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIlNpZ25hbFI6IEVycm9yIGxvYWRpbmcgaHVicy4gRW5zdXJlIHlvdXIgaHVicyByZWZlcmVuY2UgaXMgY29ycmVjdCwgZS5nLiA8c2NyaXB0IHNyYz0nL3NpZ25hbHIvanMnPjwvc2NyaXB0Pi5cIik7XHJcbiAgICAgICAgfVxyXG4gICAgfTtcclxuXHJcbiAgICBfcGFnZVdpbmRvdy5sb2FkKGZ1bmN0aW9uICgpIHsgX3BhZ2VMb2FkZWQgPSB0cnVlOyB9KTtcclxuXHJcbiAgICBmdW5jdGlvbiB2YWxpZGF0ZVRyYW5zcG9ydChyZXF1ZXN0ZWRUcmFuc3BvcnQsIGNvbm5lY3Rpb24pIHtcclxuICAgICAgICAvLy8gPHN1bW1hcnk+VmFsaWRhdGVzIHRoZSByZXF1ZXN0ZWQgdHJhbnNwb3J0IGJ5IGNyb3NzIGNoZWNraW5nIGl0IHdpdGggdGhlIHByZS1kZWZpbmVkIHNpZ25hbFIudHJhbnNwb3J0czwvc3VtbWFyeT5cclxuICAgICAgICAvLy8gPHBhcmFtIG5hbWU9XCJyZXF1ZXN0ZWRUcmFuc3BvcnRcIiB0eXBlPVwiT2JqZWN0XCI+VGhlIGRlc2lnbmF0ZWQgdHJhbnNwb3J0cyB0aGF0IHRoZSB1c2VyIGhhcyBzcGVjaWZpZWQuPC9wYXJhbT5cclxuICAgICAgICAvLy8gPHBhcmFtIG5hbWU9XCJjb25uZWN0aW9uXCIgdHlwZT1cInNpZ25hbFJcIj5UaGUgY29ubmVjdGlvbiB0aGF0IHdpbGwgYmUgdXNpbmcgdGhlIHJlcXVlc3RlZCB0cmFuc3BvcnRzLiAgVXNlZCBmb3IgbG9nZ2luZyBwdXJwb3Nlcy48L3BhcmFtPlxyXG4gICAgICAgIC8vLyA8cmV0dXJucyB0eXBlPVwiT2JqZWN0XCIgLz5cclxuXHJcbiAgICAgICAgaWYgKCQuaXNBcnJheShyZXF1ZXN0ZWRUcmFuc3BvcnQpKSB7XHJcbiAgICAgICAgICAgIC8vIEdvIHRocm91Z2ggdHJhbnNwb3J0IGFycmF5IGFuZCByZW1vdmUgYW4gXCJpbnZhbGlkXCIgdHJhbnBvcnRzXHJcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSByZXF1ZXN0ZWRUcmFuc3BvcnQubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pIHtcclxuICAgICAgICAgICAgICAgIHZhciB0cmFuc3BvcnQgPSByZXF1ZXN0ZWRUcmFuc3BvcnRbaV07XHJcbiAgICAgICAgICAgICAgICBpZiAoJC50eXBlKHJlcXVlc3RlZFRyYW5zcG9ydCkgIT09IFwib2JqZWN0XCIgJiYgKCQudHlwZSh0cmFuc3BvcnQpICE9PSBcInN0cmluZ1wiIHx8ICFzaWduYWxSLnRyYW5zcG9ydHNbdHJhbnNwb3J0XSkpIHtcclxuICAgICAgICAgICAgICAgICAgICBjb25uZWN0aW9uLmxvZyhcIkludmFsaWQgdHJhbnNwb3J0OiBcIiArIHRyYW5zcG9ydCArIFwiLCByZW1vdmluZyBpdCBmcm9tIHRoZSB0cmFuc3BvcnRzIGxpc3QuXCIpO1xyXG4gICAgICAgICAgICAgICAgICAgIHJlcXVlc3RlZFRyYW5zcG9ydC5zcGxpY2UoaSwgMSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIC8vIFZlcmlmeSB3ZSBzdGlsbCBoYXZlIHRyYW5zcG9ydHMgbGVmdCwgaWYgd2UgZG9udCB0aGVuIHdlIGhhdmUgaW52YWxpZCB0cmFuc3BvcnRzXHJcbiAgICAgICAgICAgIGlmIChyZXF1ZXN0ZWRUcmFuc3BvcnQubGVuZ3RoID09PSAwKSB7XHJcbiAgICAgICAgICAgICAgICBjb25uZWN0aW9uLmxvZyhcIk5vIHRyYW5zcG9ydHMgcmVtYWluIHdpdGhpbiB0aGUgc3BlY2lmaWVkIHRyYW5zcG9ydCBhcnJheS5cIik7XHJcbiAgICAgICAgICAgICAgICByZXF1ZXN0ZWRUcmFuc3BvcnQgPSBudWxsO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSBlbHNlIGlmICgkLnR5cGUocmVxdWVzdGVkVHJhbnNwb3J0KSAhPT0gXCJvYmplY3RcIiAmJiAhc2lnbmFsUi50cmFuc3BvcnRzW3JlcXVlc3RlZFRyYW5zcG9ydF0gJiYgcmVxdWVzdGVkVHJhbnNwb3J0ICE9PSBcImF1dG9cIikge1xyXG4gICAgICAgICAgICBjb25uZWN0aW9uLmxvZyhcIkludmFsaWQgdHJhbnNwb3J0OiBcIiArIHJlcXVlc3RlZFRyYW5zcG9ydC50b1N0cmluZygpKTtcclxuICAgICAgICAgICAgcmVxdWVzdGVkVHJhbnNwb3J0ID0gbnVsbDtcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSBpZiAocmVxdWVzdGVkVHJhbnNwb3J0ID09PSBcImF1dG9cIiAmJiBzaWduYWxSLl8uaWVWZXJzaW9uIDw9IDgpIHtcclxuICAgICAgICAgICAgLy8gSWYgd2UncmUgZG9pbmcgYW4gYXV0byB0cmFuc3BvcnQgYW5kIHdlJ3JlIElFOCB0aGVuIGZvcmNlIGxvbmdQb2xsaW5nLCAjMTc2NFxyXG4gICAgICAgICAgICByZXR1cm4gW1wibG9uZ1BvbGxpbmdcIl07XHJcblxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIHJlcXVlc3RlZFRyYW5zcG9ydDtcclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiBnZXREZWZhdWx0UG9ydChwcm90b2NvbCkge1xyXG4gICAgICAgIGlmIChwcm90b2NvbCA9PT0gXCJodHRwOlwiKSB7XHJcbiAgICAgICAgICAgIHJldHVybiA4MDtcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSBpZiAocHJvdG9jb2wgPT09IFwiaHR0cHM6XCIpIHtcclxuICAgICAgICAgICAgcmV0dXJuIDQ0MztcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gYWRkRGVmYXVsdFBvcnQocHJvdG9jb2wsIHVybCkge1xyXG4gICAgICAgIC8vIFJlbW92ZSBwb3J0cyAgZnJvbSB1cmwuICBXZSBoYXZlIHRvIGNoZWNrIGlmIHRoZXJlJ3MgYSAvIG9yIGVuZCBvZiBsaW5lXHJcbiAgICAgICAgLy8gZm9sbG93aW5nIHRoZSBwb3J0IGluIG9yZGVyIHRvIGF2b2lkIHJlbW92aW5nIHBvcnRzIHN1Y2ggYXMgODA4MC5cclxuICAgICAgICBpZiAodXJsLm1hdGNoKC86XFxkKyQvKSkge1xyXG4gICAgICAgICAgICByZXR1cm4gdXJsO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIHJldHVybiB1cmwgKyBcIjpcIiArIGdldERlZmF1bHRQb3J0KHByb3RvY29sKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gQ29ubmVjdGluZ01lc3NhZ2VCdWZmZXIoY29ubmVjdGlvbiwgZHJhaW5DYWxsYmFjaykge1xyXG4gICAgICAgIHZhciB0aGF0ID0gdGhpcyxcclxuICAgICAgICAgICAgYnVmZmVyID0gW107XHJcblxyXG4gICAgICAgIHRoYXQudHJ5QnVmZmVyID0gZnVuY3Rpb24gKG1lc3NhZ2UpIHtcclxuICAgICAgICAgICAgaWYgKGNvbm5lY3Rpb24uc3RhdGUgPT09ICQuc2lnbmFsUi5jb25uZWN0aW9uU3RhdGUuY29ubmVjdGluZykge1xyXG4gICAgICAgICAgICAgICAgYnVmZmVyLnB1c2gobWVzc2FnZSk7XHJcblxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICB0aGF0LmRyYWluID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAvLyBFbnN1cmUgdGhhdCB0aGUgY29ubmVjdGlvbiBpcyBjb25uZWN0ZWQgd2hlbiB3ZSBkcmFpbiAoZG8gbm90IHdhbnQgdG8gZHJhaW4gd2hpbGUgYSBjb25uZWN0aW9uIGlzIG5vdCBhY3RpdmUpXHJcbiAgICAgICAgICAgIGlmIChjb25uZWN0aW9uLnN0YXRlID09PSAkLnNpZ25hbFIuY29ubmVjdGlvblN0YXRlLmNvbm5lY3RlZCkge1xyXG4gICAgICAgICAgICAgICAgd2hpbGUgKGJ1ZmZlci5sZW5ndGggPiAwKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgZHJhaW5DYWxsYmFjayhidWZmZXIuc2hpZnQoKSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICB0aGF0LmNsZWFyID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICBidWZmZXIgPSBbXTtcclxuICAgICAgICB9O1xyXG4gICAgfVxyXG5cclxuICAgIHNpZ25hbFIuZm4gPSBzaWduYWxSLnByb3RvdHlwZSA9IHtcclxuICAgICAgICBpbml0OiBmdW5jdGlvbiAodXJsLCBxcywgbG9nZ2luZykge1xyXG4gICAgICAgICAgICB2YXIgJGNvbm5lY3Rpb24gPSAkKHRoaXMpO1xyXG5cclxuICAgICAgICAgICAgdGhpcy51cmwgPSB1cmw7XHJcbiAgICAgICAgICAgIHRoaXMucXMgPSBxcztcclxuICAgICAgICAgICAgdGhpcy5fID0ge1xyXG4gICAgICAgICAgICAgICAgY29ubmVjdGluZ01lc3NhZ2VCdWZmZXI6IG5ldyBDb25uZWN0aW5nTWVzc2FnZUJ1ZmZlcih0aGlzLCBmdW5jdGlvbiAobWVzc2FnZSkge1xyXG4gICAgICAgICAgICAgICAgICAgICRjb25uZWN0aW9uLnRyaWdnZXJIYW5kbGVyKGV2ZW50cy5vblJlY2VpdmVkLCBbbWVzc2FnZV0pO1xyXG4gICAgICAgICAgICAgICAgfSksXHJcbiAgICAgICAgICAgICAgICBvbkZhaWxlZFRpbWVvdXRIYW5kbGU6IG51bGxcclxuICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgaWYgKHR5cGVvZiAobG9nZ2luZykgPT09IFwiYm9vbGVhblwiKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmxvZ2dpbmcgPSBsb2dnaW5nO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgX3BhcnNlUmVzcG9uc2U6IGZ1bmN0aW9uIChyZXNwb25zZSkge1xyXG4gICAgICAgICAgICB2YXIgdGhhdCA9IHRoaXM7XHJcblxyXG4gICAgICAgICAgICBpZiAoIXJlc3BvbnNlKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzcG9uc2U7XHJcbiAgICAgICAgICAgIH0gZWxzZSBpZiAodGhhdC5hamF4RGF0YVR5cGUgPT09IFwidGV4dFwiKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhhdC5qc29uLnBhcnNlKHJlc3BvbnNlKTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiByZXNwb25zZTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIGpzb246IHdpbmRvdy5KU09OLFxyXG5cclxuICAgICAgICBpc0Nyb3NzRG9tYWluOiBmdW5jdGlvbiAodXJsLCBhZ2FpbnN0KSB7XHJcbiAgICAgICAgICAgIC8vLyA8c3VtbWFyeT5DaGVja3MgaWYgdXJsIGlzIGNyb3NzIGRvbWFpbjwvc3VtbWFyeT5cclxuICAgICAgICAgICAgLy8vIDxwYXJhbSBuYW1lPVwidXJsXCIgdHlwZT1cIlN0cmluZ1wiPlRoZSBiYXNlIFVSTDwvcGFyYW0+XHJcbiAgICAgICAgICAgIC8vLyA8cGFyYW0gbmFtZT1cImFnYWluc3RcIiB0eXBlPVwiT2JqZWN0XCI+XHJcbiAgICAgICAgICAgIC8vLyAgICAgQW4gb3B0aW9uYWwgYXJndW1lbnQgdG8gY29tcGFyZSB0aGUgVVJMIGFnYWluc3QsIGlmIG5vdCBzcGVjaWZpZWQgaXQgd2lsbCBiZSBzZXQgdG8gd2luZG93LmxvY2F0aW9uLlxyXG4gICAgICAgICAgICAvLy8gICAgIElmIHNwZWNpZmllZCBpdCBtdXN0IGNvbnRhaW4gYSBwcm90b2NvbCBhbmQgYSBob3N0IHByb3BlcnR5LlxyXG4gICAgICAgICAgICAvLy8gPC9wYXJhbT5cclxuICAgICAgICAgICAgdmFyIGxpbms7XHJcblxyXG4gICAgICAgICAgICB1cmwgPSAkLnRyaW0odXJsKTtcclxuICAgICAgICAgICAgaWYgKHVybC5pbmRleE9mKFwiaHR0cFwiKSAhPT0gMCkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBhZ2FpbnN0ID0gYWdhaW5zdCB8fCB3aW5kb3cubG9jYXRpb247XHJcblxyXG4gICAgICAgICAgICAvLyBDcmVhdGUgYW4gYW5jaG9yIHRhZy5cclxuICAgICAgICAgICAgbGluayA9IHdpbmRvdy5kb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiYVwiKTtcclxuICAgICAgICAgICAgbGluay5ocmVmID0gdXJsO1xyXG5cclxuICAgICAgICAgICAgLy8gV2hlbiBjaGVja2luZyBmb3IgY3Jvc3MgZG9tYWluIHdlIGhhdmUgdG8gc3BlY2lhbCBjYXNlIHBvcnQgODAgYmVjYXVzZSB0aGUgd2luZG93LmxvY2F0aW9uIHdpbGwgcmVtb3ZlIHRoZSBcclxuICAgICAgICAgICAgcmV0dXJuIGxpbmsucHJvdG9jb2wgKyBhZGREZWZhdWx0UG9ydChsaW5rLnByb3RvY29sLCBsaW5rLmhvc3QpICE9PSBhZ2FpbnN0LnByb3RvY29sICsgYWRkRGVmYXVsdFBvcnQoYWdhaW5zdC5wcm90b2NvbCwgYWdhaW5zdC5ob3N0KTtcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICBhamF4RGF0YVR5cGU6IFwidGV4dFwiLFxyXG5cclxuICAgICAgICBjb250ZW50VHlwZTogXCJhcHBsaWNhdGlvbi9qc29uOyBjaGFyc2V0PVVURi04XCIsXHJcblxyXG4gICAgICAgIGxvZ2dpbmc6IGZhbHNlLFxyXG5cclxuICAgICAgICBzdGF0ZTogc2lnbmFsUi5jb25uZWN0aW9uU3RhdGUuZGlzY29ubmVjdGVkLFxyXG5cclxuICAgICAgICBrZWVwQWxpdmVEYXRhOiB7fSxcclxuXHJcbiAgICAgICAgY2xpZW50UHJvdG9jb2w6IFwiMS4zXCIsXHJcblxyXG4gICAgICAgIHJlY29ubmVjdERlbGF5OiAyMDAwLFxyXG5cclxuICAgICAgICB0cmFuc3BvcnRDb25uZWN0VGltZW91dDogMCwgLy8gVGhpcyB3aWxsIGJlIG1vZGlmaWVkIGJ5IHRoZSBzZXJ2ZXIgaW4gcmVzcG9uZSB0byB0aGUgbmVnb3RpYXRlIHJlcXVlc3QuICBJdCB3aWxsIGFkZCBhbnkgdmFsdWUgc2VudCBkb3duIGZyb20gdGhlIHNlcnZlciB0byB0aGUgY2xpZW50IHZhbHVlLlxyXG5cclxuICAgICAgICBkaXNjb25uZWN0VGltZW91dDogMzAwMDAsIC8vIFRoaXMgc2hvdWxkIGJlIHNldCBieSB0aGUgc2VydmVyIGluIHJlc3BvbnNlIHRvIHRoZSBuZWdvdGlhdGUgcmVxdWVzdCAoMzBzIGRlZmF1bHQpXHJcblxyXG4gICAgICAgIGtlZXBBbGl2ZVdhcm5BdDogMiAvIDMsIC8vIFdhcm4gdXNlciBvZiBzbG93IGNvbm5lY3Rpb24gaWYgd2UgYnJlYWNoIHRoZSBYJSBtYXJrIG9mIHRoZSBrZWVwIGFsaXZlIHRpbWVvdXRcclxuXHJcbiAgICAgICAgc3RhcnQ6IGZ1bmN0aW9uIChvcHRpb25zLCBjYWxsYmFjaykge1xyXG4gICAgICAgICAgICAvLy8gPHN1bW1hcnk+U3RhcnRzIHRoZSBjb25uZWN0aW9uPC9zdW1tYXJ5PlxyXG4gICAgICAgICAgICAvLy8gPHBhcmFtIG5hbWU9XCJvcHRpb25zXCIgdHlwZT1cIk9iamVjdFwiPk9wdGlvbnMgbWFwPC9wYXJhbT5cclxuICAgICAgICAgICAgLy8vIDxwYXJhbSBuYW1lPVwiY2FsbGJhY2tcIiB0eXBlPVwiRnVuY3Rpb25cIj5BIGNhbGxiYWNrIGZ1bmN0aW9uIHRvIGV4ZWN1dGUgd2hlbiB0aGUgY29ubmVjdGlvbiBoYXMgc3RhcnRlZDwvcGFyYW0+XHJcbiAgICAgICAgICAgIHZhciBjb25uZWN0aW9uID0gdGhpcyxcclxuICAgICAgICAgICAgICAgIGNvbmZpZyA9IHtcclxuICAgICAgICAgICAgICAgICAgICB3YWl0Rm9yUGFnZUxvYWQ6IHRydWUsXHJcbiAgICAgICAgICAgICAgICAgICAgdHJhbnNwb3J0OiBcImF1dG9cIixcclxuICAgICAgICAgICAgICAgICAgICBqc29ucDogZmFsc2VcclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICBpbml0aWFsaXplLFxyXG4gICAgICAgICAgICAgICAgZGVmZXJyZWQgPSBjb25uZWN0aW9uLl9kZWZlcnJhbCB8fCAkLkRlZmVycmVkKCksIC8vIENoZWNrIHRvIHNlZSBpZiB0aGVyZSBpcyBhIHByZS1leGlzdGluZyBkZWZlcnJhbCB0aGF0J3MgYmVpbmcgYnVpbHQgb24sIGlmIHNvIHdlIHdhbnQgdG8ga2VlcCB1c2luZyBpdFxyXG4gICAgICAgICAgICAgICAgcGFyc2VyID0gd2luZG93LmRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJhXCIpO1xyXG5cclxuICAgICAgICAgICAgLy8gUGVyc2lzdCB0aGUgZGVmZXJyYWwgc28gdGhhdCBpZiBzdGFydCBpcyBjYWxsZWQgbXVsdGlwbGUgdGltZXMgdGhlIHNhbWUgZGVmZXJyYWwgaXMgdXNlZC5cclxuICAgICAgICAgICAgY29ubmVjdGlvbi5fZGVmZXJyYWwgPSBkZWZlcnJlZDtcclxuXHJcbiAgICAgICAgICAgIGlmICghY29ubmVjdGlvbi5qc29uKSB7XHJcbiAgICAgICAgICAgICAgICAvLyBubyBKU09OIVxyXG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiU2lnbmFsUjogTm8gSlNPTiBwYXJzZXIgZm91bmQuIFBsZWFzZSBlbnN1cmUganNvbjIuanMgaXMgcmVmZXJlbmNlZCBiZWZvcmUgdGhlIFNpZ25hbFIuanMgZmlsZSBpZiB5b3UgbmVlZCB0byBzdXBwb3J0IGNsaWVudHMgd2l0aG91dCBuYXRpdmUgSlNPTiBwYXJzaW5nIHN1cHBvcnQsIGUuZy4gSUU8OC5cIik7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGlmICgkLnR5cGUob3B0aW9ucykgPT09IFwiZnVuY3Rpb25cIikge1xyXG4gICAgICAgICAgICAgICAgLy8gU3VwcG9ydCBjYWxsaW5nIHdpdGggc2luZ2xlIGNhbGxiYWNrIHBhcmFtZXRlclxyXG4gICAgICAgICAgICAgICAgY2FsbGJhY2sgPSBvcHRpb25zO1xyXG4gICAgICAgICAgICB9IGVsc2UgaWYgKCQudHlwZShvcHRpb25zKSA9PT0gXCJvYmplY3RcIikge1xyXG4gICAgICAgICAgICAgICAgJC5leHRlbmQoY29uZmlnLCBvcHRpb25zKTtcclxuICAgICAgICAgICAgICAgIGlmICgkLnR5cGUoY29uZmlnLmNhbGxiYWNrKSA9PT0gXCJmdW5jdGlvblwiKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY2FsbGJhY2sgPSBjb25maWcuY2FsbGJhY2s7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGNvbmZpZy50cmFuc3BvcnQgPSB2YWxpZGF0ZVRyYW5zcG9ydChjb25maWcudHJhbnNwb3J0LCBjb25uZWN0aW9uKTtcclxuXHJcbiAgICAgICAgICAgIC8vIElmIHRoZSB0cmFuc3BvcnQgaXMgaW52YWxpZCB0aHJvdyBhbiBlcnJvciBhbmQgYWJvcnQgc3RhcnRcclxuICAgICAgICAgICAgaWYgKCFjb25maWcudHJhbnNwb3J0KSB7XHJcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJTaWduYWxSOiBJbnZhbGlkIHRyYW5zcG9ydChzKSBzcGVjaWZpZWQsIGFib3J0aW5nIHN0YXJ0LlwiKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgY29ubmVjdGlvbi5fLmNvbmZpZyA9IGNvbmZpZztcclxuXHJcbiAgICAgICAgICAgIC8vIENoZWNrIHRvIHNlZSBpZiBzdGFydCBpcyBiZWluZyBjYWxsZWQgcHJpb3IgdG8gcGFnZSBsb2FkXHJcbiAgICAgICAgICAgIC8vIElmIHdhaXRGb3JQYWdlTG9hZCBpcyB0cnVlIHdlIHRoZW4gd2FudCB0byByZS1kaXJlY3QgZnVuY3Rpb24gY2FsbCB0byB0aGUgd2luZG93IGxvYWQgZXZlbnRcclxuICAgICAgICAgICAgaWYgKCFfcGFnZUxvYWRlZCAmJiBjb25maWcud2FpdEZvclBhZ2VMb2FkID09PSB0cnVlKSB7XHJcbiAgICAgICAgICAgICAgICBfcGFnZVdpbmRvdy5sb2FkKGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgICAgICBjb25uZWN0aW9uLnN0YXJ0KG9wdGlvbnMsIGNhbGxiYWNrKTtcclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGRlZmVycmVkLnByb21pc2UoKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgY29uZmlndXJlU3RvcFJlY29ubmVjdGluZ1RpbWVvdXQoY29ubmVjdGlvbik7XHJcblxyXG4gICAgICAgICAgICAvLyBJZiB3ZSdyZSBhbHJlYWR5IGNvbm5lY3RpbmcganVzdCByZXR1cm4gdGhlIHNhbWUgZGVmZXJyYWwgYXMgdGhlIG9yaWdpbmFsIGNvbm5lY3Rpb24gc3RhcnRcclxuICAgICAgICAgICAgaWYgKGNvbm5lY3Rpb24uc3RhdGUgPT09IHNpZ25hbFIuY29ubmVjdGlvblN0YXRlLmNvbm5lY3RpbmcpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBkZWZlcnJlZC5wcm9taXNlKCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgZWxzZSBpZiAoY2hhbmdlU3RhdGUoY29ubmVjdGlvbixcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNpZ25hbFIuY29ubmVjdGlvblN0YXRlLmRpc2Nvbm5lY3RlZCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNpZ25hbFIuY29ubmVjdGlvblN0YXRlLmNvbm5lY3RpbmcpID09PSBmYWxzZSkge1xyXG4gICAgICAgICAgICAgICAgLy8gV2UncmUgbm90IGNvbm5lY3Rpbmcgc28gdHJ5IGFuZCB0cmFuc2l0aW9uIGludG8gY29ubmVjdGluZy5cclxuICAgICAgICAgICAgICAgIC8vIElmIHdlIGZhaWwgdG8gdHJhbnNpdGlvbiB0aGVuIHdlJ3JlIGVpdGhlciBpbiBjb25uZWN0ZWQgb3IgcmVjb25uZWN0aW5nLlxyXG5cclxuICAgICAgICAgICAgICAgIGRlZmVycmVkLnJlc29sdmUoY29ubmVjdGlvbik7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gZGVmZXJyZWQucHJvbWlzZSgpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAvLyBSZXNvbHZlIHRoZSBmdWxsIHVybFxyXG4gICAgICAgICAgICBwYXJzZXIuaHJlZiA9IGNvbm5lY3Rpb24udXJsO1xyXG4gICAgICAgICAgICBpZiAoIXBhcnNlci5wcm90b2NvbCB8fCBwYXJzZXIucHJvdG9jb2wgPT09IFwiOlwiKSB7XHJcbiAgICAgICAgICAgICAgICBjb25uZWN0aW9uLnByb3RvY29sID0gd2luZG93LmRvY3VtZW50LmxvY2F0aW9uLnByb3RvY29sO1xyXG4gICAgICAgICAgICAgICAgY29ubmVjdGlvbi5ob3N0ID0gd2luZG93LmRvY3VtZW50LmxvY2F0aW9uLmhvc3Q7XHJcbiAgICAgICAgICAgICAgICBjb25uZWN0aW9uLmJhc2VVcmwgPSBjb25uZWN0aW9uLnByb3RvY29sICsgXCIvL1wiICsgY29ubmVjdGlvbi5ob3N0O1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgY29ubmVjdGlvbi5wcm90b2NvbCA9IHBhcnNlci5wcm90b2NvbDtcclxuICAgICAgICAgICAgICAgIGNvbm5lY3Rpb24uaG9zdCA9IHBhcnNlci5ob3N0O1xyXG4gICAgICAgICAgICAgICAgY29ubmVjdGlvbi5iYXNlVXJsID0gcGFyc2VyLnByb3RvY29sICsgXCIvL1wiICsgcGFyc2VyLmhvc3Q7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIC8vIFNldCB0aGUgd2Vic29ja2V0IHByb3RvY29sXHJcbiAgICAgICAgICAgIGNvbm5lY3Rpb24ud3NQcm90b2NvbCA9IGNvbm5lY3Rpb24ucHJvdG9jb2wgPT09IFwiaHR0cHM6XCIgPyBcIndzczovL1wiIDogXCJ3czovL1wiO1xyXG5cclxuICAgICAgICAgICAgLy8gSWYganNvbnAgd2l0aCBuby9hdXRvIHRyYW5zcG9ydCBpcyBzcGVjaWZpZWQsIHRoZW4gc2V0IHRoZSB0cmFuc3BvcnQgdG8gbG9uZyBwb2xsaW5nXHJcbiAgICAgICAgICAgIC8vIHNpbmNlIHRoYXQgaXMgdGhlIG9ubHkgdHJhbnNwb3J0IGZvciB3aGljaCBqc29ucCByZWFsbHkgbWFrZXMgc2Vuc2UuXHJcbiAgICAgICAgICAgIC8vIFNvbWUgZGV2ZWxvcGVycyBtaWdodCBhY3R1YWxseSBjaG9vc2UgdG8gc3BlY2lmeSBqc29ucCBmb3Igc2FtZSBvcmlnaW4gcmVxdWVzdHNcclxuICAgICAgICAgICAgLy8gYXMgZGVtb25zdHJhdGVkIGJ5IElzc3VlICM2MjMuXHJcbiAgICAgICAgICAgIGlmIChjb25maWcudHJhbnNwb3J0ID09PSBcImF1dG9cIiAmJiBjb25maWcuanNvbnAgPT09IHRydWUpIHtcclxuICAgICAgICAgICAgICAgIGNvbmZpZy50cmFuc3BvcnQgPSBcImxvbmdQb2xsaW5nXCI7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGlmICh0aGlzLmlzQ3Jvc3NEb21haW4oY29ubmVjdGlvbi51cmwpKSB7XHJcbiAgICAgICAgICAgICAgICBjb25uZWN0aW9uLmxvZyhcIkF1dG8gZGV0ZWN0ZWQgY3Jvc3MgZG9tYWluIHVybC5cIik7XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKGNvbmZpZy50cmFuc3BvcnQgPT09IFwiYXV0b1wiKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgLy8gVHJ5IHdlYlNvY2tldHMgYW5kIGxvbmdQb2xsaW5nIHNpbmNlIFNTRSBkb2Vzbid0IHN1cHBvcnQgQ09SU1xyXG4gICAgICAgICAgICAgICAgICAgIC8vIFRPRE86IFN1cHBvcnQgWERNIHdpdGggZm9yZXZlckZyYW1lXHJcbiAgICAgICAgICAgICAgICAgICAgY29uZmlnLnRyYW5zcG9ydCA9IFtcIndlYlNvY2tldHNcIiwgXCJsb25nUG9sbGluZ1wiXTtcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAvLyBEZXRlcm1pbmUgaWYganNvbnAgaXMgdGhlIG9ubHkgY2hvaWNlIGZvciBuZWdvdGlhdGlvbiwgYWpheFNlbmQgYW5kIGFqYXhBYm9ydC5cclxuICAgICAgICAgICAgICAgIC8vIGkuZS4gaWYgdGhlIGJyb3dzZXIgZG9lc24ndCBzdXBwb3J0cyBDT1JTXHJcbiAgICAgICAgICAgICAgICAvLyBJZiBpdCBpcywgaWdub3JlIGFueSBwcmVmZXJlbmNlIHRvIHRoZSBjb250cmFyeSwgYW5kIHN3aXRjaCB0byBqc29ucC5cclxuICAgICAgICAgICAgICAgIGlmICghY29uZmlnLmpzb25wKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uZmlnLmpzb25wID0gISQuc3VwcG9ydC5jb3JzO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICBpZiAoY29uZmlnLmpzb25wKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbm5lY3Rpb24ubG9nKFwiVXNpbmcganNvbnAgYmVjYXVzZSB0aGlzIGJyb3dzZXIgZG9lc24ndCBzdXBwb3J0IENPUlNcIik7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIGNvbm5lY3Rpb24uY29udGVudFR5cGUgPSBzaWduYWxSLl8uZGVmYXVsdENvbnRlbnRUeXBlO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBjb25uZWN0aW9uLmFqYXhEYXRhVHlwZSA9IGNvbmZpZy5qc29ucCA/IFwianNvbnBcIiA6IFwidGV4dFwiO1xyXG5cclxuICAgICAgICAgICAgJChjb25uZWN0aW9uKS5iaW5kKGV2ZW50cy5vblN0YXJ0LCBmdW5jdGlvbiAoZSwgZGF0YSkge1xyXG4gICAgICAgICAgICAgICAgaWYgKCQudHlwZShjYWxsYmFjaykgPT09IFwiZnVuY3Rpb25cIikge1xyXG4gICAgICAgICAgICAgICAgICAgIGNhbGxiYWNrLmNhbGwoY29ubmVjdGlvbik7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBkZWZlcnJlZC5yZXNvbHZlKGNvbm5lY3Rpb24pO1xyXG4gICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICAgIGluaXRpYWxpemUgPSBmdW5jdGlvbiAodHJhbnNwb3J0cywgaW5kZXgpIHtcclxuICAgICAgICAgICAgICAgIGluZGV4ID0gaW5kZXggfHwgMDtcclxuICAgICAgICAgICAgICAgIGlmIChpbmRleCA+PSB0cmFuc3BvcnRzLmxlbmd0aCkge1xyXG4gICAgICAgICAgICAgICAgICAgIC8vIE5vIHRyYW5zcG9ydCBpbml0aWFsaXplZCBzdWNjZXNzZnVsbHlcclxuICAgICAgICAgICAgICAgICAgICAkKGNvbm5lY3Rpb24pLnRyaWdnZXJIYW5kbGVyKGV2ZW50cy5vbkVycm9yLCBbXCJTaWduYWxSOiBObyB0cmFuc3BvcnQgY291bGQgYmUgaW5pdGlhbGl6ZWQgc3VjY2Vzc2Z1bGx5LiBUcnkgc3BlY2lmeWluZyBhIGRpZmZlcmVudCB0cmFuc3BvcnQgb3Igbm9uZSBhdCBhbGwgZm9yIGF1dG8gaW5pdGlhbGl6YXRpb24uXCJdKTtcclxuICAgICAgICAgICAgICAgICAgICBkZWZlcnJlZC5yZWplY3QoXCJTaWduYWxSOiBObyB0cmFuc3BvcnQgY291bGQgYmUgaW5pdGlhbGl6ZWQgc3VjY2Vzc2Z1bGx5LiBUcnkgc3BlY2lmeWluZyBhIGRpZmZlcmVudCB0cmFuc3BvcnQgb3Igbm9uZSBhdCBhbGwgZm9yIGF1dG8gaW5pdGlhbGl6YXRpb24uXCIpO1xyXG4gICAgICAgICAgICAgICAgICAgIC8vIFN0b3AgdGhlIGNvbm5lY3Rpb24gaWYgaXQgaGFzIGNvbm5lY3RlZCBhbmQgbW92ZSBpdCBpbnRvIHRoZSBkaXNjb25uZWN0ZWQgc3RhdGVcclxuICAgICAgICAgICAgICAgICAgICBjb25uZWN0aW9uLnN0b3AoKTtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgLy8gVGhlIGNvbm5lY3Rpb24gd2FzIGFib3J0ZWRcclxuICAgICAgICAgICAgICAgIGlmIChjb25uZWN0aW9uLnN0YXRlID09PSBzaWduYWxSLmNvbm5lY3Rpb25TdGF0ZS5kaXNjb25uZWN0ZWQpIHtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgdmFyIHRyYW5zcG9ydE5hbWUgPSB0cmFuc3BvcnRzW2luZGV4XSxcclxuICAgICAgICAgICAgICAgICAgICB0cmFuc3BvcnQgPSAkLnR5cGUodHJhbnNwb3J0TmFtZSkgPT09IFwib2JqZWN0XCIgPyB0cmFuc3BvcnROYW1lIDogc2lnbmFsUi50cmFuc3BvcnRzW3RyYW5zcG9ydE5hbWVdLFxyXG4gICAgICAgICAgICAgICAgICAgIGluaXRpYWxpemF0aW9uQ29tcGxldGUgPSBmYWxzZSxcclxuICAgICAgICAgICAgICAgICAgICBvbkZhaWxlZCA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gQ2hlY2sgaWYgd2UndmUgYWxyZWFkeSB0cmlnZ2VyZWQgb25GYWlsZWQsIG9uU3RhcnRcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFpbml0aWFsaXphdGlvbkNvbXBsZXRlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpbml0aWFsaXphdGlvbkNvbXBsZXRlID0gdHJ1ZTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHdpbmRvdy5jbGVhclRpbWVvdXQoY29ubmVjdGlvbi5fLm9uRmFpbGVkVGltZW91dEhhbmRsZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0cmFuc3BvcnQuc3RvcChjb25uZWN0aW9uKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGluaXRpYWxpemUodHJhbnNwb3J0cywgaW5kZXggKyAxKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH07XHJcblxyXG4gICAgICAgICAgICAgICAgY29ubmVjdGlvbi50cmFuc3BvcnQgPSB0cmFuc3BvcnQ7XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKHRyYW5zcG9ydE5hbWUuaW5kZXhPZihcIl9cIikgPT09IDApIHtcclxuICAgICAgICAgICAgICAgICAgICAvLyBQcml2YXRlIG1lbWJlclxyXG4gICAgICAgICAgICAgICAgICAgIGluaXRpYWxpemUodHJhbnNwb3J0cywgaW5kZXggKyAxKTtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgICAgICAgICBjb25uZWN0aW9uLl8ub25GYWlsZWRUaW1lb3V0SGFuZGxlID0gd2luZG93LnNldFRpbWVvdXQoZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25uZWN0aW9uLmxvZyh0cmFuc3BvcnQubmFtZSArIFwiIHRpbWVkIG91dCB3aGVuIHRyeWluZyB0byBjb25uZWN0LlwiKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgb25GYWlsZWQoKTtcclxuICAgICAgICAgICAgICAgICAgICB9LCBjb25uZWN0aW9uLnRyYW5zcG9ydENvbm5lY3RUaW1lb3V0KTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgdHJhbnNwb3J0LnN0YXJ0KGNvbm5lY3Rpb24sIGZ1bmN0aW9uICgpIHsgLy8gc3VjY2Vzc1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBUaGUgY29ubmVjdGlvbiB3YXMgYWJvcnRlZCB3aGlsZSBpbml0aWFsaXppbmcgdHJhbnNwb3J0c1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoY29ubmVjdGlvbi5zdGF0ZSA9PT0gc2lnbmFsUi5jb25uZWN0aW9uU3RhdGUuZGlzY29ubmVjdGVkKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICghaW5pdGlhbGl6YXRpb25Db21wbGV0ZSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaW5pdGlhbGl6YXRpb25Db21wbGV0ZSA9IHRydWU7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgd2luZG93LmNsZWFyVGltZW91dChjb25uZWN0aW9uLl8ub25GYWlsZWRUaW1lb3V0SGFuZGxlKTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAodHJhbnNwb3J0LnN1cHBvcnRzS2VlcEFsaXZlICYmIGNvbm5lY3Rpb24ua2VlcEFsaXZlRGF0YS5hY3RpdmF0ZWQpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzaWduYWxSLnRyYW5zcG9ydHMuX2xvZ2ljLm1vbml0b3JLZWVwQWxpdmUoY29ubmVjdGlvbik7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY2hhbmdlU3RhdGUoY29ubmVjdGlvbixcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNpZ25hbFIuY29ubmVjdGlvblN0YXRlLmNvbm5lY3RpbmcsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzaWduYWxSLmNvbm5lY3Rpb25TdGF0ZS5jb25uZWN0ZWQpO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIERyYWluIGFueSBpbmNvbWluZyBidWZmZXJlZCBtZXNzYWdlcyAobWVzc2FnZXMgdGhhdCBjYW1lIGluIHByaW9yIHRvIGNvbm5lY3QpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25uZWN0aW9uLl8uY29ubmVjdGluZ01lc3NhZ2VCdWZmZXIuZHJhaW4oKTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAkKGNvbm5lY3Rpb24pLnRyaWdnZXJIYW5kbGVyKGV2ZW50cy5vblN0YXJ0KTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyB3aXJlIHRoZSBzdG9wIGhhbmRsZXIgZm9yIHdoZW4gdGhlIHVzZXIgbGVhdmVzIHRoZSBwYWdlXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBfcGFnZVdpbmRvdy51bmxvYWQoZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbm5lY3Rpb24uc3RvcChmYWxzZSAvKiBhc3luYyAqLyk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH0sIG9uRmFpbGVkKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGNhdGNoIChlcnJvcikge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbm5lY3Rpb24ubG9nKFwiU2lnbmFsUjogXCIgKyB0cmFuc3BvcnQubmFtZSArIFwiIHRyYW5zcG9ydCB0aHJldyAnXCIgKyBlcnJvci5tZXNzYWdlICsgXCInIHdoZW4gYXR0ZW1wdGluZyB0byBzdGFydC5cIik7XHJcbiAgICAgICAgICAgICAgICAgICAgb25GYWlsZWQoKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfTtcclxuXHJcbiAgICAgICAgICAgIHZhciB1cmwgPSBjb25uZWN0aW9uLnVybCArIFwiL25lZ290aWF0ZVwiO1xyXG5cclxuICAgICAgICAgICAgdXJsID0gc2lnbmFsUi50cmFuc3BvcnRzLl9sb2dpYy5hZGRRcyh1cmwsIGNvbm5lY3Rpb24ucXMpO1xyXG5cclxuICAgICAgICAgICAgLy8gQWRkIHRoZSBjbGllbnQgdmVyc2lvbiB0byB0aGUgbmVnb3RpYXRlIHJlcXVlc3QuICBXZSB1dGlsaXplIHRoZSBzYW1lIGFkZFFzIG1ldGhvZCBoZXJlXHJcbiAgICAgICAgICAgIC8vIHNvIHRoYXQgaXQgY2FuIGFwcGVuZCB0aGUgY2xpZW50VmVyc2lvbiBhcHByb3ByaWF0ZWx5IHRvIHRoZSBVUkxcclxuICAgICAgICAgICAgdXJsID0gc2lnbmFsUi50cmFuc3BvcnRzLl9sb2dpYy5hZGRRcyh1cmwsIHtcclxuICAgICAgICAgICAgICAgIGNsaWVudFByb3RvY29sOiBjb25uZWN0aW9uLmNsaWVudFByb3RvY29sXHJcbiAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgICAgY29ubmVjdGlvbi5sb2coXCJOZWdvdGlhdGluZyB3aXRoICdcIiArIHVybCArIFwiJy5cIik7XHJcblxyXG4gICAgICAgICAgICAvLyBTYXZlIHRoZSBhamF4IG5lZ290aWF0ZSByZXF1ZXN0IG9iamVjdCBzbyB3ZSBjYW4gYWJvcnQgaXQgaWYgc3RvcCBpcyBjYWxsZWQgd2hpbGUgdGhlIHJlcXVlc3QgaXMgaW4gZmxpZ2h0LlxyXG4gICAgICAgICAgICBjb25uZWN0aW9uLl8ubmVnb3RpYXRlUmVxdWVzdCA9ICQuYWpheCh7XHJcbiAgICAgICAgICAgICAgICB1cmw6IHVybCxcclxuICAgICAgICAgICAgICAgIGdsb2JhbDogZmFsc2UsXHJcbiAgICAgICAgICAgICAgICBjYWNoZTogZmFsc2UsXHJcbiAgICAgICAgICAgICAgICB0eXBlOiBcIkdFVFwiLFxyXG4gICAgICAgICAgICAgICAgY29udGVudFR5cGU6IGNvbm5lY3Rpb24uY29udGVudFR5cGUsXHJcbiAgICAgICAgICAgICAgICBkYXRhOiB7fSxcclxuICAgICAgICAgICAgICAgIGRhdGFUeXBlOiBjb25uZWN0aW9uLmFqYXhEYXRhVHlwZSxcclxuICAgICAgICAgICAgICAgIGVycm9yOiBmdW5jdGlvbiAoZXJyb3IsIHN0YXR1c1RleHQpIHtcclxuICAgICAgICAgICAgICAgICAgICAvLyBXZSBkb24ndCB3YW50IHRvIGNhdXNlIGFueSBlcnJvcnMgaWYgd2UncmUgYWJvcnRpbmcgb3VyIG93biBuZWdvdGlhdGUgcmVxdWVzdC5cclxuICAgICAgICAgICAgICAgICAgICBpZiAoc3RhdHVzVGV4dCAhPT0gX25lZ290aWF0ZUFib3J0VGV4dCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAkKGNvbm5lY3Rpb24pLnRyaWdnZXJIYW5kbGVyKGV2ZW50cy5vbkVycm9yLCBbZXJyb3IucmVzcG9uc2VUZXh0XSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGRlZmVycmVkLnJlamVjdChcIlNpZ25hbFI6IEVycm9yIGR1cmluZyBuZWdvdGlhdGlvbiByZXF1ZXN0OiBcIiArIGVycm9yLnJlc3BvbnNlVGV4dCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIFN0b3AgdGhlIGNvbm5lY3Rpb24gaWYgbmVnb3RpYXRlIGZhaWxlZFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25uZWN0aW9uLnN0b3AoKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgc3VjY2VzczogZnVuY3Rpb24gKHJlc3VsdCkge1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciByZXMgPSBjb25uZWN0aW9uLl9wYXJzZVJlc3BvbnNlKHJlc3VsdCksXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGtlZXBBbGl2ZURhdGEgPSBjb25uZWN0aW9uLmtlZXBBbGl2ZURhdGE7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGNvbm5lY3Rpb24uYXBwUmVsYXRpdmVVcmwgPSByZXMuVXJsO1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbm5lY3Rpb24uaWQgPSByZXMuQ29ubmVjdGlvbklkO1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbm5lY3Rpb24udG9rZW4gPSByZXMuQ29ubmVjdGlvblRva2VuO1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbm5lY3Rpb24ud2ViU29ja2V0U2VydmVyVXJsID0gcmVzLldlYlNvY2tldFNlcnZlclVybDtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgLy8gT25jZSB0aGUgc2VydmVyIGhhcyBsYWJlbGVkIHRoZSBQZXJzaXN0ZW50Q29ubmVjdGlvbiBhcyBEaXNjb25uZWN0ZWQsIHdlIHNob3VsZCBzdG9wIGF0dGVtcHRpbmcgdG8gcmVjb25uZWN0XHJcbiAgICAgICAgICAgICAgICAgICAgLy8gYWZ0ZXIgcmVzLkRpc2Nvbm5lY3RUaW1lb3V0IHNlY29uZHMuXHJcbiAgICAgICAgICAgICAgICAgICAgY29ubmVjdGlvbi5kaXNjb25uZWN0VGltZW91dCA9IHJlcy5EaXNjb25uZWN0VGltZW91dCAqIDEwMDA7IC8vIGluIG1zXHJcblxyXG4gICAgICAgICAgICAgICAgICAgIC8vIElmIHRoZSBjb25uZWN0aW9uIGFscmVhZHkgaGFzIGEgdHJhbnNwb3J0Q29ubmVjdFRpbWVvdXQgc2V0IHRoZW4ga2VlcCBpdCwgb3RoZXJ3aXNlIHVzZSB0aGUgc2VydmVycyB2YWx1ZS5cclxuICAgICAgICAgICAgICAgICAgICBjb25uZWN0aW9uLnRyYW5zcG9ydENvbm5lY3RUaW1lb3V0ID0gY29ubmVjdGlvbi50cmFuc3BvcnRDb25uZWN0VGltZW91dCArIHJlcy5UcmFuc3BvcnRDb25uZWN0VGltZW91dCAqIDEwMDA7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIC8vIElmIHdlIGhhdmUgYSBrZWVwIGFsaXZlXHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKHJlcy5LZWVwQWxpdmVUaW1lb3V0KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIFJlZ2lzdGVyIHRoZSBrZWVwIGFsaXZlIGRhdGEgYXMgYWN0aXZhdGVkXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGtlZXBBbGl2ZURhdGEuYWN0aXZhdGVkID0gdHJ1ZTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIFRpbWVvdXQgdG8gZGVzaWduYXRlIHdoZW4gdG8gZm9yY2UgdGhlIGNvbm5lY3Rpb24gaW50byByZWNvbm5lY3RpbmcgY29udmVydGVkIHRvIG1pbGxpc2Vjb25kc1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBrZWVwQWxpdmVEYXRhLnRpbWVvdXQgPSByZXMuS2VlcEFsaXZlVGltZW91dCAqIDEwMDA7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBUaW1lb3V0IHRvIGRlc2lnbmF0ZSB3aGVuIHRvIHdhcm4gdGhlIGRldmVsb3BlciB0aGF0IHRoZSBjb25uZWN0aW9uIG1heSBiZSBkZWFkIG9yIGlzIGhhbmdpbmcuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGtlZXBBbGl2ZURhdGEudGltZW91dFdhcm5pbmcgPSBrZWVwQWxpdmVEYXRhLnRpbWVvdXQgKiBjb25uZWN0aW9uLmtlZXBBbGl2ZVdhcm5BdDtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIEluc3RhbnRpYXRlIHRoZSBmcmVxdWVuY3kgaW4gd2hpY2ggd2UgY2hlY2sgdGhlIGtlZXAgYWxpdmUuICBJdCBtdXN0IGJlIHNob3J0IGluIG9yZGVyIHRvIG5vdCBtaXNzL3BpY2sgdXAgYW55IGNoYW5nZXNcclxuICAgICAgICAgICAgICAgICAgICAgICAga2VlcEFsaXZlRGF0YS5jaGVja0ludGVydmFsID0gKGtlZXBBbGl2ZURhdGEudGltZW91dCAtIGtlZXBBbGl2ZURhdGEudGltZW91dFdhcm5pbmcpIC8gMztcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGtlZXBBbGl2ZURhdGEuYWN0aXZhdGVkID0gZmFsc2U7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgICAgICBpZiAoIXJlcy5Qcm90b2NvbFZlcnNpb24gfHwgcmVzLlByb3RvY29sVmVyc2lvbiAhPT0gY29ubmVjdGlvbi5jbGllbnRQcm90b2NvbCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAkKGNvbm5lY3Rpb24pLnRyaWdnZXJIYW5kbGVyKGV2ZW50cy5vbkVycm9yLCBbXCJZb3UgYXJlIHVzaW5nIGEgdmVyc2lvbiBvZiB0aGUgY2xpZW50IHRoYXQgaXNuJ3QgY29tcGF0aWJsZSB3aXRoIHRoZSBzZXJ2ZXIuIENsaWVudCB2ZXJzaW9uIFwiICsgY29ubmVjdGlvbi5jbGllbnRQcm90b2NvbCArIFwiLCBzZXJ2ZXIgdmVyc2lvbiBcIiArIHJlcy5Qcm90b2NvbFZlcnNpb24gKyBcIi5cIl0pO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBkZWZlcnJlZC5yZWplY3QoXCJZb3UgYXJlIHVzaW5nIGEgdmVyc2lvbiBvZiB0aGUgY2xpZW50IHRoYXQgaXNuJ3QgY29tcGF0aWJsZSB3aXRoIHRoZSBzZXJ2ZXIuIENsaWVudCB2ZXJzaW9uIFwiICsgY29ubmVjdGlvbi5jbGllbnRQcm90b2NvbCArIFwiLCBzZXJ2ZXIgdmVyc2lvbiBcIiArIHJlcy5Qcm90b2NvbFZlcnNpb24gKyBcIi5cIik7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICQoY29ubmVjdGlvbikudHJpZ2dlckhhbmRsZXIoZXZlbnRzLm9uU3RhcnRpbmcpO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICB2YXIgdHJhbnNwb3J0cyA9IFtdLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBzdXBwb3J0ZWRUcmFuc3BvcnRzID0gW107XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICQuZWFjaChzaWduYWxSLnRyYW5zcG9ydHMsIGZ1bmN0aW9uIChrZXkpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGtleSA9PT0gXCJ3ZWJTb2NrZXRzXCIgJiYgIXJlcy5UcnlXZWJTb2NrZXRzKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBTZXJ2ZXIgc2FpZCBkb24ndCBldmVuIHRyeSBXZWJTb2NrZXRzLCBidXQga2VlcCBwcm9jZXNzaW5nIHRoZSBsb29wXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICBzdXBwb3J0ZWRUcmFuc3BvcnRzLnB1c2goa2V5KTtcclxuICAgICAgICAgICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKCQuaXNBcnJheShjb25maWcudHJhbnNwb3J0KSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBvcmRlcmVkIGxpc3QgcHJvdmlkZWRcclxuICAgICAgICAgICAgICAgICAgICAgICAgJC5lYWNoKGNvbmZpZy50cmFuc3BvcnQsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciB0cmFuc3BvcnQgPSB0aGlzO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCQudHlwZSh0cmFuc3BvcnQpID09PSBcIm9iamVjdFwiIHx8ICgkLnR5cGUodHJhbnNwb3J0KSA9PT0gXCJzdHJpbmdcIiAmJiAkLmluQXJyYXkoXCJcIiArIHRyYW5zcG9ydCwgc3VwcG9ydGVkVHJhbnNwb3J0cykgPj0gMCkpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0cmFuc3BvcnRzLnB1c2goJC50eXBlKHRyYW5zcG9ydCkgPT09IFwic3RyaW5nXCIgPyBcIlwiICsgdHJhbnNwb3J0IDogdHJhbnNwb3J0KTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmICgkLnR5cGUoY29uZmlnLnRyYW5zcG9ydCkgPT09IFwib2JqZWN0XCIgfHxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJC5pbkFycmF5KGNvbmZpZy50cmFuc3BvcnQsIHN1cHBvcnRlZFRyYW5zcG9ydHMpID49IDApIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gc3BlY2lmaWMgdHJhbnNwb3J0IHByb3ZpZGVkLCBhcyBvYmplY3Qgb3IgYSBuYW1lZCB0cmFuc3BvcnQsIGUuZy4gXCJsb25nUG9sbGluZ1wiXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRyYW5zcG9ydHMucHVzaChjb25maWcudHJhbnNwb3J0KTtcclxuICAgICAgICAgICAgICAgICAgICB9IGVsc2UgeyAvLyBkZWZhdWx0IFwiYXV0b1wiXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRyYW5zcG9ydHMgPSBzdXBwb3J0ZWRUcmFuc3BvcnRzO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICBpbml0aWFsaXplKHRyYW5zcG9ydHMpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICAgIHJldHVybiBkZWZlcnJlZC5wcm9taXNlKCk7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgc3RhcnRpbmc6IGZ1bmN0aW9uIChjYWxsYmFjaykge1xyXG4gICAgICAgICAgICAvLy8gPHN1bW1hcnk+QWRkcyBhIGNhbGxiYWNrIHRoYXQgd2lsbCBiZSBpbnZva2VkIGJlZm9yZSBhbnl0aGluZyBpcyBzZW50IG92ZXIgdGhlIGNvbm5lY3Rpb248L3N1bW1hcnk+XHJcbiAgICAgICAgICAgIC8vLyA8cGFyYW0gbmFtZT1cImNhbGxiYWNrXCIgdHlwZT1cIkZ1bmN0aW9uXCI+QSBjYWxsYmFjayBmdW5jdGlvbiB0byBleGVjdXRlIGJlZm9yZSBlYWNoIHRpbWUgZGF0YSBpcyBzZW50IG9uIHRoZSBjb25uZWN0aW9uPC9wYXJhbT5cclxuICAgICAgICAgICAgLy8vIDxyZXR1cm5zIHR5cGU9XCJzaWduYWxSXCIgLz5cclxuICAgICAgICAgICAgdmFyIGNvbm5lY3Rpb24gPSB0aGlzO1xyXG4gICAgICAgICAgICAkKGNvbm5lY3Rpb24pLmJpbmQoZXZlbnRzLm9uU3RhcnRpbmcsIGZ1bmN0aW9uIChlLCBkYXRhKSB7XHJcbiAgICAgICAgICAgICAgICBjYWxsYmFjay5jYWxsKGNvbm5lY3Rpb24pO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgcmV0dXJuIGNvbm5lY3Rpb247XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgc2VuZDogZnVuY3Rpb24gKGRhdGEpIHtcclxuICAgICAgICAgICAgLy8vIDxzdW1tYXJ5PlNlbmRzIGRhdGEgb3ZlciB0aGUgY29ubmVjdGlvbjwvc3VtbWFyeT5cclxuICAgICAgICAgICAgLy8vIDxwYXJhbSBuYW1lPVwiZGF0YVwiIHR5cGU9XCJTdHJpbmdcIj5UaGUgZGF0YSB0byBzZW5kIG92ZXIgdGhlIGNvbm5lY3Rpb248L3BhcmFtPlxyXG4gICAgICAgICAgICAvLy8gPHJldHVybnMgdHlwZT1cInNpZ25hbFJcIiAvPlxyXG4gICAgICAgICAgICB2YXIgY29ubmVjdGlvbiA9IHRoaXM7XHJcblxyXG4gICAgICAgICAgICBpZiAoY29ubmVjdGlvbi5zdGF0ZSA9PT0gc2lnbmFsUi5jb25uZWN0aW9uU3RhdGUuZGlzY29ubmVjdGVkKSB7XHJcbiAgICAgICAgICAgICAgICAvLyBDb25uZWN0aW9uIGhhc24ndCBiZWVuIHN0YXJ0ZWQgeWV0XHJcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJTaWduYWxSOiBDb25uZWN0aW9uIG11c3QgYmUgc3RhcnRlZCBiZWZvcmUgZGF0YSBjYW4gYmUgc2VudC4gQ2FsbCAuc3RhcnQoKSBiZWZvcmUgLnNlbmQoKVwiKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgaWYgKGNvbm5lY3Rpb24uc3RhdGUgPT09IHNpZ25hbFIuY29ubmVjdGlvblN0YXRlLmNvbm5lY3RpbmcpIHtcclxuICAgICAgICAgICAgICAgIC8vIENvbm5lY3Rpb24gaGFzbid0IGJlZW4gc3RhcnRlZCB5ZXRcclxuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIlNpZ25hbFI6IENvbm5lY3Rpb24gaGFzIG5vdCBiZWVuIGZ1bGx5IGluaXRpYWxpemVkLiBVc2UgLnN0YXJ0KCkuZG9uZSgpIG9yIC5zdGFydCgpLmZhaWwoKSB0byBydW4gbG9naWMgYWZ0ZXIgdGhlIGNvbm5lY3Rpb24gaGFzIHN0YXJ0ZWQuXCIpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBjb25uZWN0aW9uLnRyYW5zcG9ydC5zZW5kKGNvbm5lY3Rpb24sIGRhdGEpO1xyXG4gICAgICAgICAgICAvLyBSRVZJRVc6IFNob3VsZCB3ZSByZXR1cm4gZGVmZXJyZWQgaGVyZT9cclxuICAgICAgICAgICAgcmV0dXJuIGNvbm5lY3Rpb247XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgcmVjZWl2ZWQ6IGZ1bmN0aW9uIChjYWxsYmFjaykge1xyXG4gICAgICAgICAgICAvLy8gPHN1bW1hcnk+QWRkcyBhIGNhbGxiYWNrIHRoYXQgd2lsbCBiZSBpbnZva2VkIGFmdGVyIGFueXRoaW5nIGlzIHJlY2VpdmVkIG92ZXIgdGhlIGNvbm5lY3Rpb248L3N1bW1hcnk+XHJcbiAgICAgICAgICAgIC8vLyA8cGFyYW0gbmFtZT1cImNhbGxiYWNrXCIgdHlwZT1cIkZ1bmN0aW9uXCI+QSBjYWxsYmFjayBmdW5jdGlvbiB0byBleGVjdXRlIHdoZW4gYW55IGRhdGEgaXMgcmVjZWl2ZWQgb24gdGhlIGNvbm5lY3Rpb248L3BhcmFtPlxyXG4gICAgICAgICAgICAvLy8gPHJldHVybnMgdHlwZT1cInNpZ25hbFJcIiAvPlxyXG4gICAgICAgICAgICB2YXIgY29ubmVjdGlvbiA9IHRoaXM7XHJcbiAgICAgICAgICAgICQoY29ubmVjdGlvbikuYmluZChldmVudHMub25SZWNlaXZlZCwgZnVuY3Rpb24gKGUsIGRhdGEpIHtcclxuICAgICAgICAgICAgICAgIGlmICghY29ubmVjdGlvbi5fLmNvbm5lY3RpbmdNZXNzYWdlQnVmZmVyLnRyeUJ1ZmZlcihkYXRhKSkge1xyXG4gICAgICAgICAgICAgICAgICAgIGNhbGxiYWNrLmNhbGwoY29ubmVjdGlvbiwgZGF0YSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICByZXR1cm4gY29ubmVjdGlvbjtcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICBzdGF0ZUNoYW5nZWQ6IGZ1bmN0aW9uIChjYWxsYmFjaykge1xyXG4gICAgICAgICAgICAvLy8gPHN1bW1hcnk+QWRkcyBhIGNhbGxiYWNrIHRoYXQgd2lsbCBiZSBpbnZva2VkIHdoZW4gdGhlIGNvbm5lY3Rpb24gc3RhdGUgY2hhbmdlczwvc3VtbWFyeT5cclxuICAgICAgICAgICAgLy8vIDxwYXJhbSBuYW1lPVwiY2FsbGJhY2tcIiB0eXBlPVwiRnVuY3Rpb25cIj5BIGNhbGxiYWNrIGZ1bmN0aW9uIHRvIGV4ZWN1dGUgd2hlbiB0aGUgY29ubmVjdGlvbiBzdGF0ZSBjaGFuZ2VzPC9wYXJhbT5cclxuICAgICAgICAgICAgLy8vIDxyZXR1cm5zIHR5cGU9XCJzaWduYWxSXCIgLz5cclxuICAgICAgICAgICAgdmFyIGNvbm5lY3Rpb24gPSB0aGlzO1xyXG4gICAgICAgICAgICAkKGNvbm5lY3Rpb24pLmJpbmQoZXZlbnRzLm9uU3RhdGVDaGFuZ2VkLCBmdW5jdGlvbiAoZSwgZGF0YSkge1xyXG4gICAgICAgICAgICAgICAgY2FsbGJhY2suY2FsbChjb25uZWN0aW9uLCBkYXRhKTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIHJldHVybiBjb25uZWN0aW9uO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIGVycm9yOiBmdW5jdGlvbiAoY2FsbGJhY2spIHtcclxuICAgICAgICAgICAgLy8vIDxzdW1tYXJ5PkFkZHMgYSBjYWxsYmFjayB0aGF0IHdpbGwgYmUgaW52b2tlZCBhZnRlciBhbiBlcnJvciBvY2N1cnMgd2l0aCB0aGUgY29ubmVjdGlvbjwvc3VtbWFyeT5cclxuICAgICAgICAgICAgLy8vIDxwYXJhbSBuYW1lPVwiY2FsbGJhY2tcIiB0eXBlPVwiRnVuY3Rpb25cIj5BIGNhbGxiYWNrIGZ1bmN0aW9uIHRvIGV4ZWN1dGUgd2hlbiBhbiBlcnJvciBvY2N1cnMgb24gdGhlIGNvbm5lY3Rpb248L3BhcmFtPlxyXG4gICAgICAgICAgICAvLy8gPHJldHVybnMgdHlwZT1cInNpZ25hbFJcIiAvPlxyXG4gICAgICAgICAgICB2YXIgY29ubmVjdGlvbiA9IHRoaXM7XHJcbiAgICAgICAgICAgICQoY29ubmVjdGlvbikuYmluZChldmVudHMub25FcnJvciwgZnVuY3Rpb24gKGUsIGRhdGEpIHtcclxuICAgICAgICAgICAgICAgIGNhbGxiYWNrLmNhbGwoY29ubmVjdGlvbiwgZGF0YSk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICByZXR1cm4gY29ubmVjdGlvbjtcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICBkaXNjb25uZWN0ZWQ6IGZ1bmN0aW9uIChjYWxsYmFjaykge1xyXG4gICAgICAgICAgICAvLy8gPHN1bW1hcnk+QWRkcyBhIGNhbGxiYWNrIHRoYXQgd2lsbCBiZSBpbnZva2VkIHdoZW4gdGhlIGNsaWVudCBkaXNjb25uZWN0czwvc3VtbWFyeT5cclxuICAgICAgICAgICAgLy8vIDxwYXJhbSBuYW1lPVwiY2FsbGJhY2tcIiB0eXBlPVwiRnVuY3Rpb25cIj5BIGNhbGxiYWNrIGZ1bmN0aW9uIHRvIGV4ZWN1dGUgd2hlbiB0aGUgY29ubmVjdGlvbiBpcyBicm9rZW48L3BhcmFtPlxyXG4gICAgICAgICAgICAvLy8gPHJldHVybnMgdHlwZT1cInNpZ25hbFJcIiAvPlxyXG4gICAgICAgICAgICB2YXIgY29ubmVjdGlvbiA9IHRoaXM7XHJcbiAgICAgICAgICAgICQoY29ubmVjdGlvbikuYmluZChldmVudHMub25EaXNjb25uZWN0LCBmdW5jdGlvbiAoZSwgZGF0YSkge1xyXG4gICAgICAgICAgICAgICAgY2FsbGJhY2suY2FsbChjb25uZWN0aW9uKTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIHJldHVybiBjb25uZWN0aW9uO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIGNvbm5lY3Rpb25TbG93OiBmdW5jdGlvbiAoY2FsbGJhY2spIHtcclxuICAgICAgICAgICAgLy8vIDxzdW1tYXJ5PkFkZHMgYSBjYWxsYmFjayB0aGF0IHdpbGwgYmUgaW52b2tlZCB3aGVuIHRoZSBjbGllbnQgZGV0ZWN0cyBhIHNsb3cgY29ubmVjdGlvbjwvc3VtbWFyeT5cclxuICAgICAgICAgICAgLy8vIDxwYXJhbSBuYW1lPVwiY2FsbGJhY2tcIiB0eXBlPVwiRnVuY3Rpb25cIj5BIGNhbGxiYWNrIGZ1bmN0aW9uIHRvIGV4ZWN1dGUgd2hlbiB0aGUgY29ubmVjdGlvbiBpcyBzbG93PC9wYXJhbT5cclxuICAgICAgICAgICAgLy8vIDxyZXR1cm5zIHR5cGU9XCJzaWduYWxSXCIgLz5cclxuICAgICAgICAgICAgdmFyIGNvbm5lY3Rpb24gPSB0aGlzO1xyXG4gICAgICAgICAgICAkKGNvbm5lY3Rpb24pLmJpbmQoZXZlbnRzLm9uQ29ubmVjdGlvblNsb3csIGZ1bmN0aW9uIChlLCBkYXRhKSB7XHJcbiAgICAgICAgICAgICAgICBjYWxsYmFjay5jYWxsKGNvbm5lY3Rpb24pO1xyXG4gICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICAgIHJldHVybiBjb25uZWN0aW9uO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIHJlY29ubmVjdGluZzogZnVuY3Rpb24gKGNhbGxiYWNrKSB7XHJcbiAgICAgICAgICAgIC8vLyA8c3VtbWFyeT5BZGRzIGEgY2FsbGJhY2sgdGhhdCB3aWxsIGJlIGludm9rZWQgd2hlbiB0aGUgdW5kZXJseWluZyB0cmFuc3BvcnQgYmVnaW5zIHJlY29ubmVjdGluZzwvc3VtbWFyeT5cclxuICAgICAgICAgICAgLy8vIDxwYXJhbSBuYW1lPVwiY2FsbGJhY2tcIiB0eXBlPVwiRnVuY3Rpb25cIj5BIGNhbGxiYWNrIGZ1bmN0aW9uIHRvIGV4ZWN1dGUgd2hlbiB0aGUgY29ubmVjdGlvbiBlbnRlcnMgYSByZWNvbm5lY3Rpbmcgc3RhdGU8L3BhcmFtPlxyXG4gICAgICAgICAgICAvLy8gPHJldHVybnMgdHlwZT1cInNpZ25hbFJcIiAvPlxyXG4gICAgICAgICAgICB2YXIgY29ubmVjdGlvbiA9IHRoaXM7XHJcbiAgICAgICAgICAgICQoY29ubmVjdGlvbikuYmluZChldmVudHMub25SZWNvbm5lY3RpbmcsIGZ1bmN0aW9uIChlLCBkYXRhKSB7XHJcbiAgICAgICAgICAgICAgICBjYWxsYmFjay5jYWxsKGNvbm5lY3Rpb24pO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgcmV0dXJuIGNvbm5lY3Rpb247XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgcmVjb25uZWN0ZWQ6IGZ1bmN0aW9uIChjYWxsYmFjaykge1xyXG4gICAgICAgICAgICAvLy8gPHN1bW1hcnk+QWRkcyBhIGNhbGxiYWNrIHRoYXQgd2lsbCBiZSBpbnZva2VkIHdoZW4gdGhlIHVuZGVybHlpbmcgdHJhbnNwb3J0IHJlY29ubmVjdHM8L3N1bW1hcnk+XHJcbiAgICAgICAgICAgIC8vLyA8cGFyYW0gbmFtZT1cImNhbGxiYWNrXCIgdHlwZT1cIkZ1bmN0aW9uXCI+QSBjYWxsYmFjayBmdW5jdGlvbiB0byBleGVjdXRlIHdoZW4gdGhlIGNvbm5lY3Rpb24gaXMgcmVzdG9yZWQ8L3BhcmFtPlxyXG4gICAgICAgICAgICAvLy8gPHJldHVybnMgdHlwZT1cInNpZ25hbFJcIiAvPlxyXG4gICAgICAgICAgICB2YXIgY29ubmVjdGlvbiA9IHRoaXM7XHJcbiAgICAgICAgICAgICQoY29ubmVjdGlvbikuYmluZChldmVudHMub25SZWNvbm5lY3QsIGZ1bmN0aW9uIChlLCBkYXRhKSB7XHJcbiAgICAgICAgICAgICAgICBjYWxsYmFjay5jYWxsKGNvbm5lY3Rpb24pO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgcmV0dXJuIGNvbm5lY3Rpb247XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgc3RvcDogZnVuY3Rpb24gKGFzeW5jLCBub3RpZnlTZXJ2ZXIpIHtcclxuICAgICAgICAgICAgLy8vIDxzdW1tYXJ5PlN0b3BzIGxpc3RlbmluZzwvc3VtbWFyeT5cclxuICAgICAgICAgICAgLy8vIDxwYXJhbSBuYW1lPVwiYXN5bmNcIiB0eXBlPVwiQm9vbGVhblwiPldoZXRoZXIgb3Igbm90IHRvIGFzeW5jaHJvbm91c2x5IGFib3J0IHRoZSBjb25uZWN0aW9uPC9wYXJhbT5cclxuICAgICAgICAgICAgLy8vIDxwYXJhbSBuYW1lPVwibm90aWZ5U2VydmVyXCIgdHlwZT1cIkJvb2xlYW5cIj5XaGV0aGVyIHdlIHdhbnQgdG8gbm90aWZ5IHRoZSBzZXJ2ZXIgdGhhdCB3ZSBhcmUgYWJvcnRpbmcgdGhlIGNvbm5lY3Rpb248L3BhcmFtPlxyXG4gICAgICAgICAgICAvLy8gPHJldHVybnMgdHlwZT1cInNpZ25hbFJcIiAvPlxyXG4gICAgICAgICAgICB2YXIgY29ubmVjdGlvbiA9IHRoaXM7XHJcblxyXG4gICAgICAgICAgICAvLyBWZXJpZnkgdGhhdCB3ZSBzaG91bGQgd2FpdCBmb3IgcGFnZSBsb2FkIHRvIGNhbGwgc3RvcC5cclxuICAgICAgICAgICAgaWYgKCFfcGFnZUxvYWRlZCAmJiAoIWNvbm5lY3Rpb24uXy5jb25maWcgfHwgY29ubmVjdGlvbi5fLmNvbmZpZy53YWl0Rm9yUGFnZUxvYWQgPT09IHRydWUpKSB7XHJcbiAgICAgICAgICAgICAgICAvLyBDYW4gb25seSBzdG9wIGNvbm5lY3Rpb25zIGFmdGVyIHRoZSBwYWdlIGhhcyBsb2FkZWRcclxuICAgICAgICAgICAgICAgIF9wYWdlV2luZG93LmxvYWQoZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbm5lY3Rpb24uc3RvcChhc3luYywgbm90aWZ5U2VydmVyKTtcclxuICAgICAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgaWYgKGNvbm5lY3Rpb24uc3RhdGUgPT09IHNpZ25hbFIuY29ubmVjdGlvblN0YXRlLmRpc2Nvbm5lY3RlZCkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICAgICAgY29ubmVjdGlvbi5sb2coXCJTaWduYWxSOiBTdG9wcGluZyBjb25uZWN0aW9uLlwiKTtcclxuXHJcbiAgICAgICAgICAgICAgICAvLyBDbGVhciB0aGlzIG5vIG1hdHRlciB3aGF0XHJcbiAgICAgICAgICAgICAgICB3aW5kb3cuY2xlYXJUaW1lb3V0KGNvbm5lY3Rpb24uXy5vbkZhaWxlZFRpbWVvdXRIYW5kbGUpO1xyXG5cclxuICAgICAgICAgICAgICAgIGlmIChjb25uZWN0aW9uLnRyYW5zcG9ydCkge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChub3RpZnlTZXJ2ZXIgIT09IGZhbHNlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbm5lY3Rpb24udHJhbnNwb3J0LmFib3J0KGNvbm5lY3Rpb24sIGFzeW5jKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGlmIChjb25uZWN0aW9uLnRyYW5zcG9ydC5zdXBwb3J0c0tlZXBBbGl2ZSAmJiBjb25uZWN0aW9uLmtlZXBBbGl2ZURhdGEuYWN0aXZhdGVkKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHNpZ25hbFIudHJhbnNwb3J0cy5fbG9naWMuc3RvcE1vbml0b3JpbmdLZWVwQWxpdmUoY29ubmVjdGlvbik7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgICAgICBjb25uZWN0aW9uLnRyYW5zcG9ydC5zdG9wKGNvbm5lY3Rpb24pO1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbm5lY3Rpb24udHJhbnNwb3J0ID0gbnVsbDtcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICBpZiAoY29ubmVjdGlvbi5fLm5lZ290aWF0ZVJlcXVlc3QpIHtcclxuICAgICAgICAgICAgICAgICAgICAvLyBJZiB0aGUgbmVnb3RpYXRpb24gcmVxdWVzdCBoYXMgYWxyZWFkeSBjb21wbGV0ZWQgdGhpcyB3aWxsIG5vb3AuXHJcbiAgICAgICAgICAgICAgICAgICAgY29ubmVjdGlvbi5fLm5lZ290aWF0ZVJlcXVlc3QuYWJvcnQoX25lZ290aWF0ZUFib3J0VGV4dCk7XHJcbiAgICAgICAgICAgICAgICAgICAgZGVsZXRlIGNvbm5lY3Rpb24uXy5uZWdvdGlhdGVSZXF1ZXN0O1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIC8vIFRyaWdnZXIgdGhlIGRpc2Nvbm5lY3QgZXZlbnRcclxuICAgICAgICAgICAgICAgICQoY29ubmVjdGlvbikudHJpZ2dlckhhbmRsZXIoZXZlbnRzLm9uRGlzY29ubmVjdCk7XHJcblxyXG4gICAgICAgICAgICAgICAgZGVsZXRlIGNvbm5lY3Rpb24ubWVzc2FnZUlkO1xyXG4gICAgICAgICAgICAgICAgZGVsZXRlIGNvbm5lY3Rpb24uZ3JvdXBzVG9rZW47XHJcblxyXG4gICAgICAgICAgICAgICAgLy8gUmVtb3ZlIHRoZSBJRCBhbmQgdGhlIGRlZmVycmFsIG9uIHN0b3AsIHRoaXMgaXMgdG8gZW5zdXJlIHRoYXQgaWYgYSBjb25uZWN0aW9uIGlzIHJlc3RhcnRlZCBpdCB0YWtlcyBvbiBhIG5ldyBpZC9kZWZlcnJhbC5cclxuICAgICAgICAgICAgICAgIGRlbGV0ZSBjb25uZWN0aW9uLmlkO1xyXG4gICAgICAgICAgICAgICAgZGVsZXRlIGNvbm5lY3Rpb24uX2RlZmVycmFsO1xyXG4gICAgICAgICAgICAgICAgZGVsZXRlIGNvbm5lY3Rpb24uXy5jb25maWc7XHJcblxyXG4gICAgICAgICAgICAgICAgLy8gQ2xlYXIgb3V0IG91ciBtZXNzYWdlIGJ1ZmZlclxyXG4gICAgICAgICAgICAgICAgY29ubmVjdGlvbi5fLmNvbm5lY3RpbmdNZXNzYWdlQnVmZmVyLmNsZWFyKCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgZmluYWxseSB7XHJcbiAgICAgICAgICAgICAgICBjaGFuZ2VTdGF0ZShjb25uZWN0aW9uLCBjb25uZWN0aW9uLnN0YXRlLCBzaWduYWxSLmNvbm5lY3Rpb25TdGF0ZS5kaXNjb25uZWN0ZWQpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gY29ubmVjdGlvbjtcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICBsb2c6IGZ1bmN0aW9uIChtc2cpIHtcclxuICAgICAgICAgICAgbG9nKG1zZywgdGhpcy5sb2dnaW5nKTtcclxuICAgICAgICB9XHJcbiAgICB9O1xyXG5cclxuICAgIHNpZ25hbFIuZm4uaW5pdC5wcm90b3R5cGUgPSBzaWduYWxSLmZuO1xyXG5cclxuICAgIHNpZ25hbFIubm9Db25mbGljdCA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAvLy8gPHN1bW1hcnk+UmVpbnN0YXRlcyB0aGUgb3JpZ2luYWwgdmFsdWUgb2YgJC5jb25uZWN0aW9uIGFuZCByZXR1cm5zIHRoZSBzaWduYWxSIG9iamVjdCBmb3IgbWFudWFsIGFzc2lnbm1lbnQ8L3N1bW1hcnk+XHJcbiAgICAgICAgLy8vIDxyZXR1cm5zIHR5cGU9XCJzaWduYWxSXCIgLz5cclxuICAgICAgICBpZiAoJC5jb25uZWN0aW9uID09PSBzaWduYWxSKSB7XHJcbiAgICAgICAgICAgICQuY29ubmVjdGlvbiA9IF9jb25uZWN0aW9uO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gc2lnbmFsUjtcclxuICAgIH07XHJcblxyXG4gICAgaWYgKCQuY29ubmVjdGlvbikge1xyXG4gICAgICAgIF9jb25uZWN0aW9uID0gJC5jb25uZWN0aW9uO1xyXG4gICAgfVxyXG5cclxuICAgICQuY29ubmVjdGlvbiA9ICQuc2lnbmFsUiA9IHNpZ25hbFI7XHJcblxyXG59KHdpbmRvdy5qUXVlcnksIHdpbmRvdykpO1xyXG4vKiBqcXVlcnkuc2lnbmFsUi50cmFuc3BvcnRzLmNvbW1vbi5qcyAqL1xyXG4vLyBDb3B5cmlnaHQgKGMpIE1pY3Jvc29mdCBPcGVuIFRlY2hub2xvZ2llcywgSW5jLiBBbGwgcmlnaHRzIHJlc2VydmVkLiBTZWUgTGljZW5zZS5tZCBpbiB0aGUgcHJvamVjdCByb290IGZvciBsaWNlbnNlIGluZm9ybWF0aW9uLlxyXG5cclxuLypnbG9iYWwgd2luZG93OmZhbHNlICovXHJcbi8vLyA8cmVmZXJlbmNlIHBhdGg9XCJqcXVlcnkuc2lnbmFsUi5jb3JlLmpzXCIgLz5cclxuXHJcbihmdW5jdGlvbiAoJCwgd2luZG93KSB7XHJcbiAgICBcInVzZSBzdHJpY3RcIjtcclxuXHJcbiAgICB2YXIgc2lnbmFsUiA9ICQuc2lnbmFsUixcclxuICAgICAgICBldmVudHMgPSAkLnNpZ25hbFIuZXZlbnRzLFxyXG4gICAgICAgIGNoYW5nZVN0YXRlID0gJC5zaWduYWxSLmNoYW5nZVN0YXRlLFxyXG4gICAgICAgIHRyYW5zcG9ydExvZ2ljO1xyXG5cclxuICAgIHNpZ25hbFIudHJhbnNwb3J0cyA9IHt9O1xyXG5cclxuICAgIGZ1bmN0aW9uIGNoZWNrSWZBbGl2ZShjb25uZWN0aW9uKSB7XHJcbiAgICAgICAgdmFyIGtlZXBBbGl2ZURhdGEgPSBjb25uZWN0aW9uLmtlZXBBbGl2ZURhdGEsXHJcbiAgICAgICAgICAgIGRpZmYsXHJcbiAgICAgICAgICAgIHRpbWVFbGFwc2VkO1xyXG5cclxuICAgICAgICAvLyBPbmx5IGNoZWNrIGlmIHdlJ3JlIGNvbm5lY3RlZFxyXG4gICAgICAgIGlmIChjb25uZWN0aW9uLnN0YXRlID09PSBzaWduYWxSLmNvbm5lY3Rpb25TdGF0ZS5jb25uZWN0ZWQpIHtcclxuICAgICAgICAgICAgZGlmZiA9IG5ldyBEYXRlKCk7XHJcblxyXG4gICAgICAgICAgICBkaWZmLnNldFRpbWUoZGlmZiAtIGtlZXBBbGl2ZURhdGEubGFzdEtlZXBBbGl2ZSk7XHJcbiAgICAgICAgICAgIHRpbWVFbGFwc2VkID0gZGlmZi5nZXRUaW1lKCk7XHJcblxyXG4gICAgICAgICAgICAvLyBDaGVjayBpZiB0aGUga2VlcCBhbGl2ZSBoYXMgY29tcGxldGVseSB0aW1lZCBvdXRcclxuICAgICAgICAgICAgaWYgKHRpbWVFbGFwc2VkID49IGtlZXBBbGl2ZURhdGEudGltZW91dCkge1xyXG4gICAgICAgICAgICAgICAgY29ubmVjdGlvbi5sb2coXCJLZWVwIGFsaXZlIHRpbWVkIG91dC4gIE5vdGlmeWluZyB0cmFuc3BvcnQgdGhhdCBjb25uZWN0aW9uIGhhcyBiZWVuIGxvc3QuXCIpO1xyXG5cclxuICAgICAgICAgICAgICAgIC8vIE5vdGlmeSB0cmFuc3BvcnQgdGhhdCB0aGUgY29ubmVjdGlvbiBoYXMgYmVlbiBsb3N0XHJcbiAgICAgICAgICAgICAgICBjb25uZWN0aW9uLnRyYW5zcG9ydC5sb3N0Q29ubmVjdGlvbihjb25uZWN0aW9uKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBlbHNlIGlmICh0aW1lRWxhcHNlZCA+PSBrZWVwQWxpdmVEYXRhLnRpbWVvdXRXYXJuaW5nKSB7XHJcbiAgICAgICAgICAgICAgICAvLyBUaGlzIGlzIHRvIGFzc3VyZSB0aGF0IHRoZSB1c2VyIG9ubHkgZ2V0cyBhIHNpbmdsZSB3YXJuaW5nXHJcbiAgICAgICAgICAgICAgICBpZiAoIWtlZXBBbGl2ZURhdGEudXNlck5vdGlmaWVkKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY29ubmVjdGlvbi5sb2coXCJLZWVwIGFsaXZlIGhhcyBiZWVuIG1pc3NlZCwgY29ubmVjdGlvbiBtYXkgYmUgZGVhZC9zbG93LlwiKTtcclxuICAgICAgICAgICAgICAgICAgICAkKGNvbm5lY3Rpb24pLnRyaWdnZXJIYW5kbGVyKGV2ZW50cy5vbkNvbm5lY3Rpb25TbG93KTtcclxuICAgICAgICAgICAgICAgICAgICBrZWVwQWxpdmVEYXRhLnVzZXJOb3RpZmllZCA9IHRydWU7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgICAgICBrZWVwQWxpdmVEYXRhLnVzZXJOb3RpZmllZCA9IGZhbHNlO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyBWZXJpZnkgd2UncmUgbW9uaXRvcmluZyB0aGUga2VlcCBhbGl2ZVxyXG4gICAgICAgIC8vIFdlIGRvbid0IHdhbnQgdGhpcyBhcyBhIHBhcnQgb2YgdGhlIGlubmVyIGlmIHN0YXRlbWVudCBhYm92ZSBiZWNhdXNlIHdlIHdhbnQga2VlcCBhbGl2ZXMgdG8gY29udGludWUgdG8gYmUgY2hlY2tlZFxyXG4gICAgICAgIC8vIGluIHRoZSBldmVudCB0aGF0IHRoZSBzZXJ2ZXIgY29tZXMgYmFjayBvbmxpbmUgKGlmIGl0IGdvZXMgb2ZmbGluZSkuXHJcbiAgICAgICAgaWYgKGtlZXBBbGl2ZURhdGEubW9uaXRvcmluZykge1xyXG4gICAgICAgICAgICB3aW5kb3cuc2V0VGltZW91dChmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICBjaGVja0lmQWxpdmUoY29ubmVjdGlvbik7XHJcbiAgICAgICAgICAgIH0sIGtlZXBBbGl2ZURhdGEuY2hlY2tJbnRlcnZhbCk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGZ1bmN0aW9uIGlzQ29ubmVjdGVkT3JSZWNvbm5lY3RpbmcoY29ubmVjdGlvbikge1xyXG4gICAgICAgIHJldHVybiBjb25uZWN0aW9uLnN0YXRlID09PSBzaWduYWxSLmNvbm5lY3Rpb25TdGF0ZS5jb25uZWN0ZWQgfHxcclxuICAgICAgICAgICAgICAgY29ubmVjdGlvbi5zdGF0ZSA9PT0gc2lnbmFsUi5jb25uZWN0aW9uU3RhdGUucmVjb25uZWN0aW5nO1xyXG4gICAgfVxyXG5cclxuICAgIHRyYW5zcG9ydExvZ2ljID0gc2lnbmFsUi50cmFuc3BvcnRzLl9sb2dpYyA9IHtcclxuICAgICAgICBwaW5nU2VydmVyOiBmdW5jdGlvbiAoY29ubmVjdGlvbiwgdHJhbnNwb3J0KSB7XHJcbiAgICAgICAgICAgIC8vLyA8c3VtbWFyeT5QaW5ncyB0aGUgc2VydmVyPC9zdW1tYXJ5PlxyXG4gICAgICAgICAgICAvLy8gPHBhcmFtIG5hbWU9XCJjb25uZWN0aW9uXCIgdHlwZT1cInNpZ25hbHJcIj5Db25uZWN0aW9uIGFzc29jaWF0ZWQgd2l0aCB0aGUgc2VydmVyIHBpbmc8L3BhcmFtPlxyXG4gICAgICAgICAgICAvLy8gPHJldHVybnMgdHlwZT1cInNpZ25hbFJcIiAvPlxyXG4gICAgICAgICAgICB2YXIgYmFzZVVybCA9IHRyYW5zcG9ydCA9PT0gXCJ3ZWJTb2NrZXRzXCIgPyBcIlwiIDogY29ubmVjdGlvbi5iYXNlVXJsLFxyXG4gICAgICAgICAgICAgICAgdXJsID0gYmFzZVVybCArIGNvbm5lY3Rpb24uYXBwUmVsYXRpdmVVcmwgKyBcIi9waW5nXCIsXHJcbiAgICAgICAgICAgICAgICBkZWZlcnJhbCA9ICQuRGVmZXJyZWQoKTtcclxuXHJcbiAgICAgICAgICAgIHVybCA9IHRoaXMuYWRkUXModXJsLCBjb25uZWN0aW9uLnFzKTtcclxuXHJcbiAgICAgICAgICAgICQuYWpheCh7XHJcbiAgICAgICAgICAgICAgICB1cmw6IHVybCxcclxuICAgICAgICAgICAgICAgIGdsb2JhbDogZmFsc2UsXHJcbiAgICAgICAgICAgICAgICBjYWNoZTogZmFsc2UsXHJcbiAgICAgICAgICAgICAgICB0eXBlOiBcIkdFVFwiLFxyXG4gICAgICAgICAgICAgICAgY29udGVudFR5cGU6IGNvbm5lY3Rpb24uY29udGVudFR5cGUsXHJcbiAgICAgICAgICAgICAgICBkYXRhOiB7fSxcclxuICAgICAgICAgICAgICAgIGRhdGFUeXBlOiBjb25uZWN0aW9uLmFqYXhEYXRhVHlwZSxcclxuICAgICAgICAgICAgICAgIHN1Y2Nlc3M6IGZ1bmN0aW9uIChyZXN1bHQpIHtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgZGF0YSA9IGNvbm5lY3Rpb24uX3BhcnNlUmVzcG9uc2UocmVzdWx0KTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKGRhdGEuUmVzcG9uc2UgPT09IFwicG9uZ1wiKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGRlZmVycmFsLnJlc29sdmUoKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGRlZmVycmFsLnJlamVjdChcIlNpZ25hbFI6IEludmFsaWQgcGluZyByZXNwb25zZSB3aGVuIHBpbmdpbmcgc2VydmVyOiBcIiArIChkYXRhLnJlc3BvbnNlVGV4dCB8fCBkYXRhLnN0YXR1c1RleHQpKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgZXJyb3I6IGZ1bmN0aW9uIChkYXRhKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgZGVmZXJyYWwucmVqZWN0KFwiU2lnbmFsUjogRXJyb3IgcGluZ2luZyBzZXJ2ZXI6IFwiICsgKGRhdGEucmVzcG9uc2VUZXh0IHx8IGRhdGEuc3RhdHVzVGV4dCkpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICAgIHJldHVybiBkZWZlcnJhbC5wcm9taXNlKCk7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgYWRkUXM6IGZ1bmN0aW9uICh1cmwsIHFzKSB7XHJcbiAgICAgICAgICAgIHZhciBhcHBlbmRlciA9IHVybC5pbmRleE9mKFwiP1wiKSAhPT0gLTEgPyBcIiZcIiA6IFwiP1wiLFxyXG4gICAgICAgICAgICAgICAgZmlyc3RDaGFyO1xyXG5cclxuICAgICAgICAgICAgaWYgKCFxcykge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHVybDtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgaWYgKHR5cGVvZiAocXMpID09PSBcIm9iamVjdFwiKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdXJsICsgYXBwZW5kZXIgKyAkLnBhcmFtKHFzKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgaWYgKHR5cGVvZiAocXMpID09PSBcInN0cmluZ1wiKSB7XHJcbiAgICAgICAgICAgICAgICBmaXJzdENoYXIgPSBxcy5jaGFyQXQoMCk7XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKGZpcnN0Q2hhciA9PT0gXCI/XCIgfHwgZmlyc3RDaGFyID09PSBcIiZcIikge1xyXG4gICAgICAgICAgICAgICAgICAgIGFwcGVuZGVyID0gXCJcIjtcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdXJsICsgYXBwZW5kZXIgKyBxcztcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiUXVlcnkgc3RyaW5nIHByb3BlcnR5IG11c3QgYmUgZWl0aGVyIGEgc3RyaW5nIG9yIG9iamVjdC5cIik7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgZ2V0VXJsOiBmdW5jdGlvbiAoY29ubmVjdGlvbiwgdHJhbnNwb3J0LCByZWNvbm5lY3RpbmcsIHBvbGwpIHtcclxuICAgICAgICAgICAgLy8vIDxzdW1tYXJ5PkdldHMgdGhlIHVybCBmb3IgbWFraW5nIGEgR0VUIGJhc2VkIGNvbm5lY3QgcmVxdWVzdDwvc3VtbWFyeT5cclxuICAgICAgICAgICAgdmFyIGJhc2VVcmwgPSB0cmFuc3BvcnQgPT09IFwid2ViU29ja2V0c1wiID8gXCJcIiA6IGNvbm5lY3Rpb24uYmFzZVVybCxcclxuICAgICAgICAgICAgICAgIHVybCA9IGJhc2VVcmwgKyBjb25uZWN0aW9uLmFwcFJlbGF0aXZlVXJsLFxyXG4gICAgICAgICAgICAgICAgcXMgPSBcInRyYW5zcG9ydD1cIiArIHRyYW5zcG9ydCArIFwiJmNvbm5lY3Rpb25Ub2tlbj1cIiArIHdpbmRvdy5lbmNvZGVVUklDb21wb25lbnQoY29ubmVjdGlvbi50b2tlbik7XHJcblxyXG4gICAgICAgICAgICBpZiAoY29ubmVjdGlvbi5kYXRhKSB7XHJcbiAgICAgICAgICAgICAgICBxcyArPSBcIiZjb25uZWN0aW9uRGF0YT1cIiArIHdpbmRvdy5lbmNvZGVVUklDb21wb25lbnQoY29ubmVjdGlvbi5kYXRhKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgaWYgKGNvbm5lY3Rpb24uZ3JvdXBzVG9rZW4pIHtcclxuICAgICAgICAgICAgICAgIHFzICs9IFwiJmdyb3Vwc1Rva2VuPVwiICsgd2luZG93LmVuY29kZVVSSUNvbXBvbmVudChjb25uZWN0aW9uLmdyb3Vwc1Rva2VuKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgaWYgKCFyZWNvbm5lY3RpbmcpIHtcclxuICAgICAgICAgICAgICAgIHVybCArPSBcIi9jb25uZWN0XCI7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICBpZiAocG9sbCkge1xyXG4gICAgICAgICAgICAgICAgICAgIC8vIGxvbmdQb2xsaW5nIHRyYW5zcG9ydCBzcGVjaWZpY1xyXG4gICAgICAgICAgICAgICAgICAgIHVybCArPSBcIi9wb2xsXCI7XHJcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgIHVybCArPSBcIi9yZWNvbm5lY3RcIjtcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICBpZiAoY29ubmVjdGlvbi5tZXNzYWdlSWQpIHtcclxuICAgICAgICAgICAgICAgICAgICBxcyArPSBcIiZtZXNzYWdlSWQ9XCIgKyB3aW5kb3cuZW5jb2RlVVJJQ29tcG9uZW50KGNvbm5lY3Rpb24ubWVzc2FnZUlkKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB1cmwgKz0gXCI/XCIgKyBxcztcclxuICAgICAgICAgICAgdXJsID0gdHJhbnNwb3J0TG9naWMuYWRkUXModXJsLCBjb25uZWN0aW9uLnFzKTtcclxuICAgICAgICAgICAgdXJsICs9IFwiJnRpZD1cIiArIE1hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIDExKTtcclxuICAgICAgICAgICAgcmV0dXJuIHVybDtcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICBtYXhpbWl6ZVBlcnNpc3RlbnRSZXNwb25zZTogZnVuY3Rpb24gKG1pblBlcnNpc3RlbnRSZXNwb25zZSkge1xyXG4gICAgICAgICAgICByZXR1cm4ge1xyXG4gICAgICAgICAgICAgICAgTWVzc2FnZUlkOiBtaW5QZXJzaXN0ZW50UmVzcG9uc2UuQyxcclxuICAgICAgICAgICAgICAgIE1lc3NhZ2VzOiBtaW5QZXJzaXN0ZW50UmVzcG9uc2UuTSxcclxuICAgICAgICAgICAgICAgIEluaXRpYWxpemVkOiB0eXBlb2YgKG1pblBlcnNpc3RlbnRSZXNwb25zZS5TKSAhPT0gXCJ1bmRlZmluZWRcIiA/IHRydWUgOiBmYWxzZSxcclxuICAgICAgICAgICAgICAgIERpc2Nvbm5lY3Q6IHR5cGVvZiAobWluUGVyc2lzdGVudFJlc3BvbnNlLkQpICE9PSBcInVuZGVmaW5lZFwiID8gdHJ1ZSA6IGZhbHNlLFxyXG4gICAgICAgICAgICAgICAgVGltZWRPdXQ6IHR5cGVvZiAobWluUGVyc2lzdGVudFJlc3BvbnNlLlQpICE9PSBcInVuZGVmaW5lZFwiID8gdHJ1ZSA6IGZhbHNlLFxyXG4gICAgICAgICAgICAgICAgTG9uZ1BvbGxEZWxheTogbWluUGVyc2lzdGVudFJlc3BvbnNlLkwsXHJcbiAgICAgICAgICAgICAgICBHcm91cHNUb2tlbjogbWluUGVyc2lzdGVudFJlc3BvbnNlLkdcclxuICAgICAgICAgICAgfTtcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICB1cGRhdGVHcm91cHM6IGZ1bmN0aW9uIChjb25uZWN0aW9uLCBncm91cHNUb2tlbikge1xyXG4gICAgICAgICAgICBpZiAoZ3JvdXBzVG9rZW4pIHtcclxuICAgICAgICAgICAgICAgIGNvbm5lY3Rpb24uZ3JvdXBzVG9rZW4gPSBncm91cHNUb2tlbjtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIGFqYXhTZW5kOiBmdW5jdGlvbiAoY29ubmVjdGlvbiwgZGF0YSkge1xyXG4gICAgICAgICAgICB2YXIgdXJsID0gY29ubmVjdGlvbi51cmwgKyBcIi9zZW5kXCIgKyBcIj90cmFuc3BvcnQ9XCIgKyBjb25uZWN0aW9uLnRyYW5zcG9ydC5uYW1lICsgXCImY29ubmVjdGlvblRva2VuPVwiICsgd2luZG93LmVuY29kZVVSSUNvbXBvbmVudChjb25uZWN0aW9uLnRva2VuKTtcclxuICAgICAgICAgICAgdXJsID0gdGhpcy5hZGRRcyh1cmwsIGNvbm5lY3Rpb24ucXMpO1xyXG4gICAgICAgICAgICByZXR1cm4gJC5hamF4KHtcclxuICAgICAgICAgICAgICAgIHVybDogdXJsLFxyXG4gICAgICAgICAgICAgICAgZ2xvYmFsOiBmYWxzZSxcclxuICAgICAgICAgICAgICAgIHR5cGU6IGNvbm5lY3Rpb24uYWpheERhdGFUeXBlID09PSBcImpzb25wXCIgPyBcIkdFVFwiIDogXCJQT1NUXCIsXHJcbiAgICAgICAgICAgICAgICBjb250ZW50VHlwZTogc2lnbmFsUi5fLmRlZmF1bHRDb250ZW50VHlwZSxcclxuICAgICAgICAgICAgICAgIGRhdGFUeXBlOiBjb25uZWN0aW9uLmFqYXhEYXRhVHlwZSxcclxuICAgICAgICAgICAgICAgIGRhdGE6IHtcclxuICAgICAgICAgICAgICAgICAgICBkYXRhOiBkYXRhXHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgc3VjY2VzczogZnVuY3Rpb24gKHJlc3VsdCkge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChyZXN1bHQpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgJChjb25uZWN0aW9uKS50cmlnZ2VySGFuZGxlcihldmVudHMub25SZWNlaXZlZCwgW2Nvbm5lY3Rpb24uX3BhcnNlUmVzcG9uc2UocmVzdWx0KV0pO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICBlcnJvcjogZnVuY3Rpb24gKGVyckRhdGEsIHRleHRTdGF0dXMpIHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAodGV4dFN0YXR1cyA9PT0gXCJhYm9ydFwiIHx8IHRleHRTdGF0dXMgPT09IFwicGFyc2VyZXJyb3JcIikge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBUaGUgcGFyc2VyZXJyb3IgaGFwcGVucyBmb3Igc2VuZHMgdGhhdCBkb24ndCByZXR1cm4gYW55IGRhdGEsIGFuZCBoZW5jZVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBkb24ndCB3cml0ZSB0aGUganNvbnAgY2FsbGJhY2sgdG8gdGhlIHJlc3BvbnNlLiBUaGlzIGlzIGhhcmRlciB0byBmaXggb24gdGhlIHNlcnZlclxyXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBzbyBqdXN0IGhhY2sgYXJvdW5kIGl0IG9uIHRoZSBjbGllbnQgZm9yIG5vdy5cclxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAkKGNvbm5lY3Rpb24pLnRyaWdnZXJIYW5kbGVyKGV2ZW50cy5vbkVycm9yLCBbZXJyRGF0YV0pO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICBhamF4QWJvcnQ6IGZ1bmN0aW9uIChjb25uZWN0aW9uLCBhc3luYykge1xyXG4gICAgICAgICAgICBpZiAodHlwZW9mIChjb25uZWN0aW9uLnRyYW5zcG9ydCkgPT09IFwidW5kZWZpbmVkXCIpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgLy8gQXN5bmMgYnkgZGVmYXVsdCB1bmxlc3MgZXhwbGljaXRseSBvdmVyaWRkZW5cclxuICAgICAgICAgICAgYXN5bmMgPSB0eXBlb2YgYXN5bmMgPT09IFwidW5kZWZpbmVkXCIgPyB0cnVlIDogYXN5bmM7XHJcblxyXG4gICAgICAgICAgICB2YXIgdXJsID0gY29ubmVjdGlvbi51cmwgKyBcIi9hYm9ydFwiICsgXCI/dHJhbnNwb3J0PVwiICsgY29ubmVjdGlvbi50cmFuc3BvcnQubmFtZSArIFwiJmNvbm5lY3Rpb25Ub2tlbj1cIiArIHdpbmRvdy5lbmNvZGVVUklDb21wb25lbnQoY29ubmVjdGlvbi50b2tlbik7XHJcbiAgICAgICAgICAgIHVybCA9IHRoaXMuYWRkUXModXJsLCBjb25uZWN0aW9uLnFzKTtcclxuICAgICAgICAgICAgJC5hamF4KHtcclxuICAgICAgICAgICAgICAgIHVybDogdXJsLFxyXG4gICAgICAgICAgICAgICAgYXN5bmM6IGFzeW5jLFxyXG4gICAgICAgICAgICAgICAgdGltZW91dDogMTAwMCxcclxuICAgICAgICAgICAgICAgIGdsb2JhbDogZmFsc2UsXHJcbiAgICAgICAgICAgICAgICB0eXBlOiBcIlBPU1RcIixcclxuICAgICAgICAgICAgICAgIGNvbnRlbnRUeXBlOiBjb25uZWN0aW9uLmNvbnRlbnRUeXBlLFxyXG4gICAgICAgICAgICAgICAgZGF0YVR5cGU6IGNvbm5lY3Rpb24uYWpheERhdGFUeXBlLFxyXG4gICAgICAgICAgICAgICAgZGF0YToge31cclxuICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgICBjb25uZWN0aW9uLmxvZyhcIkZpcmVkIGFqYXggYWJvcnQgYXN5bmMgPSBcIiArIGFzeW5jKTtcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICB0cnlJbml0aWFsaXplOiBmdW5jdGlvbiAocGVyc2lzdGVudFJlc3BvbnNlLCBvbkluaXRpYWxpemVkKSB7XHJcbiAgICAgICAgICAgIGlmIChwZXJzaXN0ZW50UmVzcG9uc2UuSW5pdGlhbGl6ZWQpIHtcclxuICAgICAgICAgICAgICAgIG9uSW5pdGlhbGl6ZWQoKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIHByb2Nlc3NNZXNzYWdlczogZnVuY3Rpb24gKGNvbm5lY3Rpb24sIG1pbkRhdGEsIG9uSW5pdGlhbGl6ZWQpIHtcclxuICAgICAgICAgICAgdmFyIGRhdGEsXHJcbiAgICAgICAgICAgICAgICAkY29ubmVjdGlvbiA9ICQoY29ubmVjdGlvbik7XHJcblxyXG4gICAgICAgICAgICAvLyBJZiBvdXIgdHJhbnNwb3J0IHN1cHBvcnRzIGtlZXAgYWxpdmUgdGhlbiB3ZSBuZWVkIHRvIHVwZGF0ZSB0aGUgbGFzdCBrZWVwIGFsaXZlIHRpbWUgc3RhbXAuXHJcbiAgICAgICAgICAgIC8vIFZlcnkgcmFyZWx5IHRoZSB0cmFuc3BvcnQgY2FuIGJlIG51bGwuXHJcbiAgICAgICAgICAgIGlmIChjb25uZWN0aW9uLnRyYW5zcG9ydCAmJiBjb25uZWN0aW9uLnRyYW5zcG9ydC5zdXBwb3J0c0tlZXBBbGl2ZSAmJiBjb25uZWN0aW9uLmtlZXBBbGl2ZURhdGEuYWN0aXZhdGVkKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnVwZGF0ZUtlZXBBbGl2ZShjb25uZWN0aW9uKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgaWYgKG1pbkRhdGEpIHtcclxuICAgICAgICAgICAgICAgIGRhdGEgPSB0aGlzLm1heGltaXplUGVyc2lzdGVudFJlc3BvbnNlKG1pbkRhdGEpO1xyXG5cclxuICAgICAgICAgICAgICAgIGlmIChkYXRhLkRpc2Nvbm5lY3QpIHtcclxuICAgICAgICAgICAgICAgICAgICBjb25uZWN0aW9uLmxvZyhcIkRpc2Nvbm5lY3QgY29tbWFuZCByZWNlaXZlZCBmcm9tIHNlcnZlclwiKTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgLy8gRGlzY29ubmVjdGVkIGJ5IHRoZSBzZXJ2ZXJcclxuICAgICAgICAgICAgICAgICAgICBjb25uZWN0aW9uLnN0b3AoZmFsc2UsIGZhbHNlKTtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgdGhpcy51cGRhdGVHcm91cHMoY29ubmVjdGlvbiwgZGF0YS5Hcm91cHNUb2tlbik7XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKGRhdGEuTWVzc2FnZUlkKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY29ubmVjdGlvbi5tZXNzYWdlSWQgPSBkYXRhLk1lc3NhZ2VJZDtcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICBpZiAoZGF0YS5NZXNzYWdlcykge1xyXG4gICAgICAgICAgICAgICAgICAgICQuZWFjaChkYXRhLk1lc3NhZ2VzLCBmdW5jdGlvbiAoaW5kZXgsIG1lc3NhZ2UpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgJGNvbm5lY3Rpb24udHJpZ2dlckhhbmRsZXIoZXZlbnRzLm9uUmVjZWl2ZWQsIFttZXNzYWdlXSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIHRyYW5zcG9ydExvZ2ljLnRyeUluaXRpYWxpemUoZGF0YSwgb25Jbml0aWFsaXplZCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICBtb25pdG9yS2VlcEFsaXZlOiBmdW5jdGlvbiAoY29ubmVjdGlvbikge1xyXG4gICAgICAgICAgICB2YXIga2VlcEFsaXZlRGF0YSA9IGNvbm5lY3Rpb24ua2VlcEFsaXZlRGF0YSxcclxuICAgICAgICAgICAgICAgIHRoYXQgPSB0aGlzO1xyXG5cclxuICAgICAgICAgICAgLy8gSWYgd2UgaGF2ZW4ndCBpbml0aWF0ZWQgdGhlIGtlZXAgYWxpdmUgdGltZW91dHMgdGhlbiB3ZSBuZWVkIHRvXHJcbiAgICAgICAgICAgIGlmICgha2VlcEFsaXZlRGF0YS5tb25pdG9yaW5nKSB7XHJcbiAgICAgICAgICAgICAgICBrZWVwQWxpdmVEYXRhLm1vbml0b3JpbmcgPSB0cnVlO1xyXG5cclxuICAgICAgICAgICAgICAgIC8vIEluaXRpYWxpemUgdGhlIGtlZXAgYWxpdmUgdGltZSBzdGFtcCBwaW5nXHJcbiAgICAgICAgICAgICAgICB0aGF0LnVwZGF0ZUtlZXBBbGl2ZShjb25uZWN0aW9uKTtcclxuXHJcbiAgICAgICAgICAgICAgICAvLyBTYXZlIHRoZSBmdW5jdGlvbiBzbyB3ZSBjYW4gdW5iaW5kIGl0IG9uIHN0b3BcclxuICAgICAgICAgICAgICAgIGNvbm5lY3Rpb24ua2VlcEFsaXZlRGF0YS5yZWNvbm5lY3RLZWVwQWxpdmVVcGRhdGUgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhhdC51cGRhdGVLZWVwQWxpdmUoY29ubmVjdGlvbik7XHJcbiAgICAgICAgICAgICAgICB9O1xyXG5cclxuICAgICAgICAgICAgICAgIC8vIFVwZGF0ZSBLZWVwIGFsaXZlIG9uIHJlY29ubmVjdFxyXG4gICAgICAgICAgICAgICAgJChjb25uZWN0aW9uKS5iaW5kKGV2ZW50cy5vblJlY29ubmVjdCwgY29ubmVjdGlvbi5rZWVwQWxpdmVEYXRhLnJlY29ubmVjdEtlZXBBbGl2ZVVwZGF0ZSk7XHJcblxyXG4gICAgICAgICAgICAgICAgY29ubmVjdGlvbi5sb2coXCJOb3cgbW9uaXRvcmluZyBrZWVwIGFsaXZlIHdpdGggYSB3YXJuaW5nIHRpbWVvdXQgb2YgXCIgKyBrZWVwQWxpdmVEYXRhLnRpbWVvdXRXYXJuaW5nICsgXCIgYW5kIGEgY29ubmVjdGlvbiBsb3N0IHRpbWVvdXQgb2YgXCIgKyBrZWVwQWxpdmVEYXRhLnRpbWVvdXQpO1xyXG4gICAgICAgICAgICAgICAgLy8gU3RhcnQgdGhlIG1vbml0b3Jpbmcgb2YgdGhlIGtlZXAgYWxpdmVcclxuICAgICAgICAgICAgICAgIGNoZWNrSWZBbGl2ZShjb25uZWN0aW9uKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgICAgIGNvbm5lY3Rpb24ubG9nKFwiVHJpZWQgdG8gbW9uaXRvciBrZWVwIGFsaXZlIGJ1dCBpdCdzIGFscmVhZHkgYmVpbmcgbW9uaXRvcmVkXCIpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgc3RvcE1vbml0b3JpbmdLZWVwQWxpdmU6IGZ1bmN0aW9uIChjb25uZWN0aW9uKSB7XHJcbiAgICAgICAgICAgIHZhciBrZWVwQWxpdmVEYXRhID0gY29ubmVjdGlvbi5rZWVwQWxpdmVEYXRhO1xyXG5cclxuICAgICAgICAgICAgLy8gT25seSBhdHRlbXB0IHRvIHN0b3AgdGhlIGtlZXAgYWxpdmUgbW9uaXRvcmluZyBpZiBpdHMgYmVpbmcgbW9uaXRvcmVkXHJcbiAgICAgICAgICAgIGlmIChrZWVwQWxpdmVEYXRhLm1vbml0b3JpbmcpIHtcclxuICAgICAgICAgICAgICAgIC8vIFN0b3AgbW9uaXRvcmluZ1xyXG4gICAgICAgICAgICAgICAga2VlcEFsaXZlRGF0YS5tb25pdG9yaW5nID0gZmFsc2U7XHJcblxyXG4gICAgICAgICAgICAgICAgLy8gUmVtb3ZlIHRoZSB1cGRhdGVLZWVwQWxpdmUgZnVuY3Rpb24gZnJvbSB0aGUgcmVjb25uZWN0IGV2ZW50XHJcbiAgICAgICAgICAgICAgICAkKGNvbm5lY3Rpb24pLnVuYmluZChldmVudHMub25SZWNvbm5lY3QsIGNvbm5lY3Rpb24ua2VlcEFsaXZlRGF0YS5yZWNvbm5lY3RLZWVwQWxpdmVVcGRhdGUpO1xyXG5cclxuICAgICAgICAgICAgICAgIC8vIENsZWFyIGFsbCB0aGUga2VlcCBhbGl2ZSBkYXRhXHJcbiAgICAgICAgICAgICAgICBjb25uZWN0aW9uLmtlZXBBbGl2ZURhdGEgPSB7fTtcclxuICAgICAgICAgICAgICAgIGNvbm5lY3Rpb24ubG9nKFwiU3RvcHBpbmcgdGhlIG1vbml0b3Jpbmcgb2YgdGhlIGtlZXAgYWxpdmVcIik7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICB1cGRhdGVLZWVwQWxpdmU6IGZ1bmN0aW9uIChjb25uZWN0aW9uKSB7XHJcbiAgICAgICAgICAgIGNvbm5lY3Rpb24ua2VlcEFsaXZlRGF0YS5sYXN0S2VlcEFsaXZlID0gbmV3IERhdGUoKTtcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICBlbnN1cmVSZWNvbm5lY3RpbmdTdGF0ZTogZnVuY3Rpb24gKGNvbm5lY3Rpb24pIHtcclxuICAgICAgICAgICAgaWYgKGNoYW5nZVN0YXRlKGNvbm5lY3Rpb24sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHNpZ25hbFIuY29ubmVjdGlvblN0YXRlLmNvbm5lY3RlZCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgc2lnbmFsUi5jb25uZWN0aW9uU3RhdGUucmVjb25uZWN0aW5nKSA9PT0gdHJ1ZSkge1xyXG4gICAgICAgICAgICAgICAgJChjb25uZWN0aW9uKS50cmlnZ2VySGFuZGxlcihldmVudHMub25SZWNvbm5lY3RpbmcpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHJldHVybiBjb25uZWN0aW9uLnN0YXRlID09PSBzaWduYWxSLmNvbm5lY3Rpb25TdGF0ZS5yZWNvbm5lY3Rpbmc7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgY2xlYXJSZWNvbm5lY3RUaW1lb3V0OiBmdW5jdGlvbiAoY29ubmVjdGlvbikge1xyXG4gICAgICAgICAgICBpZiAoY29ubmVjdGlvbiAmJiBjb25uZWN0aW9uLl8ucmVjb25uZWN0VGltZW91dCkge1xyXG4gICAgICAgICAgICAgICAgd2luZG93LmNsZWFyVGltZW91dChjb25uZWN0aW9uLl8ucmVjb25uZWN0VGltZW91dCk7XHJcbiAgICAgICAgICAgICAgICBkZWxldGUgY29ubmVjdGlvbi5fLnJlY29ubmVjdFRpbWVvdXQ7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICByZWNvbm5lY3Q6IGZ1bmN0aW9uIChjb25uZWN0aW9uLCB0cmFuc3BvcnROYW1lKSB7XHJcbiAgICAgICAgICAgIHZhciB0cmFuc3BvcnQgPSBzaWduYWxSLnRyYW5zcG9ydHNbdHJhbnNwb3J0TmFtZV0sXHJcbiAgICAgICAgICAgICAgICB0aGF0ID0gdGhpcztcclxuXHJcbiAgICAgICAgICAgIC8vIFdlIHNob3VsZCBvbmx5IHNldCBhIHJlY29ubmVjdFRpbWVvdXQgaWYgd2UgYXJlIGN1cnJlbnRseSBjb25uZWN0ZWRcclxuICAgICAgICAgICAgLy8gYW5kIGEgcmVjb25uZWN0VGltZW91dCBpc24ndCBhbHJlYWR5IHNldC5cclxuICAgICAgICAgICAgaWYgKGlzQ29ubmVjdGVkT3JSZWNvbm5lY3RpbmcoY29ubmVjdGlvbikgJiYgIWNvbm5lY3Rpb24uXy5yZWNvbm5lY3RUaW1lb3V0KSB7XHJcblxyXG4gICAgICAgICAgICAgICAgY29ubmVjdGlvbi5fLnJlY29ubmVjdFRpbWVvdXQgPSB3aW5kb3cuc2V0VGltZW91dChmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdHJhbnNwb3J0LnN0b3AoY29ubmVjdGlvbik7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGlmICh0aGF0LmVuc3VyZVJlY29ubmVjdGluZ1N0YXRlKGNvbm5lY3Rpb24pKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbm5lY3Rpb24ubG9nKHRyYW5zcG9ydE5hbWUgKyBcIiByZWNvbm5lY3RpbmdcIik7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRyYW5zcG9ydC5zdGFydChjb25uZWN0aW9uKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9LCBjb25uZWN0aW9uLnJlY29ubmVjdERlbGF5KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIGZvcmV2ZXJGcmFtZToge1xyXG4gICAgICAgICAgICBjb3VudDogMCxcclxuICAgICAgICAgICAgY29ubmVjdGlvbnM6IHt9XHJcbiAgICAgICAgfVxyXG4gICAgfTtcclxuXHJcbn0od2luZG93LmpRdWVyeSwgd2luZG93KSk7XHJcbi8qIGpxdWVyeS5zaWduYWxSLnRyYW5zcG9ydHMud2ViU29ja2V0cy5qcyAqL1xyXG4vLyBDb3B5cmlnaHQgKGMpIE1pY3Jvc29mdCBPcGVuIFRlY2hub2xvZ2llcywgSW5jLiBBbGwgcmlnaHRzIHJlc2VydmVkLiBTZWUgTGljZW5zZS5tZCBpbiB0aGUgcHJvamVjdCByb290IGZvciBsaWNlbnNlIGluZm9ybWF0aW9uLlxyXG5cclxuLypnbG9iYWwgd2luZG93OmZhbHNlICovXHJcbi8vLyA8cmVmZXJlbmNlIHBhdGg9XCJqcXVlcnkuc2lnbmFsUi50cmFuc3BvcnRzLmNvbW1vbi5qc1wiIC8+XHJcblxyXG4oZnVuY3Rpb24gKCQsIHdpbmRvdykge1xyXG4gICAgXCJ1c2Ugc3RyaWN0XCI7XHJcblxyXG4gICAgdmFyIHNpZ25hbFIgPSAkLnNpZ25hbFIsXHJcbiAgICAgICAgZXZlbnRzID0gJC5zaWduYWxSLmV2ZW50cyxcclxuICAgICAgICBjaGFuZ2VTdGF0ZSA9ICQuc2lnbmFsUi5jaGFuZ2VTdGF0ZSxcclxuICAgICAgICB0cmFuc3BvcnRMb2dpYyA9IHNpZ25hbFIudHJhbnNwb3J0cy5fbG9naWM7XHJcblxyXG4gICAgc2lnbmFsUi50cmFuc3BvcnRzLndlYlNvY2tldHMgPSB7XHJcbiAgICAgICAgbmFtZTogXCJ3ZWJTb2NrZXRzXCIsXHJcblxyXG4gICAgICAgIHN1cHBvcnRzS2VlcEFsaXZlOiB0cnVlLFxyXG5cclxuICAgICAgICBzZW5kOiBmdW5jdGlvbiAoY29ubmVjdGlvbiwgZGF0YSkge1xyXG4gICAgICAgICAgICBjb25uZWN0aW9uLnNvY2tldC5zZW5kKGRhdGEpO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIHN0YXJ0OiBmdW5jdGlvbiAoY29ubmVjdGlvbiwgb25TdWNjZXNzLCBvbkZhaWxlZCkge1xyXG4gICAgICAgICAgICB2YXIgdXJsLFxyXG4gICAgICAgICAgICAgICAgb3BlbmVkID0gZmFsc2UsXHJcbiAgICAgICAgICAgICAgICB0aGF0ID0gdGhpcyxcclxuICAgICAgICAgICAgICAgIHJlY29ubmVjdGluZyA9ICFvblN1Y2Nlc3MsXHJcbiAgICAgICAgICAgICAgICAkY29ubmVjdGlvbiA9ICQoY29ubmVjdGlvbik7XHJcblxyXG4gICAgICAgICAgICBpZiAoIXdpbmRvdy5XZWJTb2NrZXQpIHtcclxuICAgICAgICAgICAgICAgIG9uRmFpbGVkKCk7XHJcbiAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGlmICghY29ubmVjdGlvbi5zb2NrZXQpIHtcclxuICAgICAgICAgICAgICAgIGlmIChjb25uZWN0aW9uLndlYlNvY2tldFNlcnZlclVybCkge1xyXG4gICAgICAgICAgICAgICAgICAgIHVybCA9IGNvbm5lY3Rpb24ud2ViU29ja2V0U2VydmVyVXJsO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdXJsID0gY29ubmVjdGlvbi53c1Byb3RvY29sICsgY29ubmVjdGlvbi5ob3N0O1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIHVybCArPSB0cmFuc3BvcnRMb2dpYy5nZXRVcmwoY29ubmVjdGlvbiwgdGhpcy5uYW1lLCByZWNvbm5lY3RpbmcpO1xyXG5cclxuICAgICAgICAgICAgICAgIGNvbm5lY3Rpb24ubG9nKFwiQ29ubmVjdGluZyB0byB3ZWJzb2NrZXQgZW5kcG9pbnQgJ1wiICsgdXJsICsgXCInXCIpO1xyXG4gICAgICAgICAgICAgICAgY29ubmVjdGlvbi5zb2NrZXQgPSBuZXcgd2luZG93LldlYlNvY2tldCh1cmwpO1xyXG5cclxuICAgICAgICAgICAgICAgIGNvbm5lY3Rpb24uc29ja2V0Lm9ub3BlbiA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgICAgICBvcGVuZWQgPSB0cnVlO1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbm5lY3Rpb24ubG9nKFwiV2Vic29ja2V0IG9wZW5lZFwiKTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgdHJhbnNwb3J0TG9naWMuY2xlYXJSZWNvbm5lY3RUaW1lb3V0KGNvbm5lY3Rpb24pO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICBpZiAoY2hhbmdlU3RhdGUoY29ubmVjdGlvbixcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc2lnbmFsUi5jb25uZWN0aW9uU3RhdGUucmVjb25uZWN0aW5nLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzaWduYWxSLmNvbm5lY3Rpb25TdGF0ZS5jb25uZWN0ZWQpID09PSB0cnVlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICRjb25uZWN0aW9uLnRyaWdnZXJIYW5kbGVyKGV2ZW50cy5vblJlY29ubmVjdCk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfTtcclxuXHJcbiAgICAgICAgICAgICAgICBjb25uZWN0aW9uLnNvY2tldC5vbmNsb3NlID0gZnVuY3Rpb24gKGV2ZW50KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgLy8gT25seSBoYW5kbGUgYSBzb2NrZXQgY2xvc2UgaWYgdGhlIGNsb3NlIGlzIGZyb20gdGhlIGN1cnJlbnQgc29ja2V0LlxyXG4gICAgICAgICAgICAgICAgICAgIC8vIFNvbWV0aW1lcyBvbiBkaXNjb25uZWN0IHRoZSBzZXJ2ZXIgd2lsbCBwdXNoIGRvd24gYW4gb25jbG9zZSBldmVudFxyXG4gICAgICAgICAgICAgICAgICAgIC8vIHRvIGFuIGV4cGlyZWQgc29ja2V0LlxyXG5cclxuICAgICAgICAgICAgICAgICAgICBpZiAodGhpcyA9PT0gY29ubmVjdGlvbi5zb2NrZXQpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFvcGVuZWQpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChvbkZhaWxlZCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9uRmFpbGVkKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbHNlIGlmIChyZWNvbm5lY3RpbmcpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGF0LnJlY29ubmVjdChjb25uZWN0aW9uKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICBlbHNlIGlmICh0eXBlb2YgZXZlbnQud2FzQ2xlYW4gIT09IFwidW5kZWZpbmVkXCIgJiYgZXZlbnQud2FzQ2xlYW4gPT09IGZhbHNlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBJZGVhbGx5IHRoaXMgd291bGQgdXNlIHRoZSB3ZWJzb2NrZXQub25lcnJvciBoYW5kbGVyIChyYXRoZXIgdGhhbiBjaGVja2luZyB3YXNDbGVhbiBpbiBvbmNsb3NlKSBidXRcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIEkgZm91bmQgaW4gc29tZSBjaXJjdW1zdGFuY2VzIENocm9tZSB3b24ndCBjYWxsIG9uZXJyb3IuIFRoaXMgaW1wbGVtZW50YXRpb24gc2VlbXMgdG8gd29yayBvbiBhbGwgYnJvd3NlcnMuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAkKGNvbm5lY3Rpb24pLnRyaWdnZXJIYW5kbGVyKGV2ZW50cy5vbkVycm9yLCBbZXZlbnQucmVhc29uXSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25uZWN0aW9uLmxvZyhcIlVuY2xlYW4gZGlzY29ubmVjdCBmcm9tIHdlYnNvY2tldC5cIiArIGV2ZW50LnJlYXNvbik7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25uZWN0aW9uLmxvZyhcIldlYnNvY2tldCBjbG9zZWRcIik7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoYXQucmVjb25uZWN0KGNvbm5lY3Rpb24pO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH07XHJcblxyXG4gICAgICAgICAgICAgICAgY29ubmVjdGlvbi5zb2NrZXQub25tZXNzYWdlID0gZnVuY3Rpb24gKGV2ZW50KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIGRhdGEgPSBjb25uZWN0aW9uLl9wYXJzZVJlc3BvbnNlKGV2ZW50LmRhdGEpLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAkY29ubmVjdGlvbiA9ICQoY29ubmVjdGlvbik7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGlmIChkYXRhKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIGRhdGEuTSBpcyBQZXJzaXN0ZW50UmVzcG9uc2UuTWVzc2FnZXNcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCQuaXNFbXB0eU9iamVjdChkYXRhKSB8fCBkYXRhLk0pIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRyYW5zcG9ydExvZ2ljLnByb2Nlc3NNZXNzYWdlcyhjb25uZWN0aW9uLCBkYXRhLCBvblN1Y2Nlc3MpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gRm9yIHdlYnNvY2tldHMgd2UgbmVlZCB0byB0cmlnZ2VyIG9uUmVjZWl2ZWRcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIGZvciBjYWxsYmFja3MgdG8gb3V0Z29pbmcgaHViIGNhbGxzLlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJGNvbm5lY3Rpb24udHJpZ2dlckhhbmRsZXIoZXZlbnRzLm9uUmVjZWl2ZWQsIFtkYXRhXSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgcmVjb25uZWN0OiBmdW5jdGlvbiAoY29ubmVjdGlvbikge1xyXG4gICAgICAgICAgICB0cmFuc3BvcnRMb2dpYy5yZWNvbm5lY3QoY29ubmVjdGlvbiwgdGhpcy5uYW1lKTtcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICBsb3N0Q29ubmVjdGlvbjogZnVuY3Rpb24gKGNvbm5lY3Rpb24pIHtcclxuICAgICAgICAgICAgdGhpcy5yZWNvbm5lY3QoY29ubmVjdGlvbik7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgc3RvcDogZnVuY3Rpb24gKGNvbm5lY3Rpb24pIHtcclxuICAgICAgICAgICAgLy8gRG9uJ3QgdHJpZ2dlciBhIHJlY29ubmVjdCBhZnRlciBzdG9wcGluZ1xyXG4gICAgICAgICAgICB0cmFuc3BvcnRMb2dpYy5jbGVhclJlY29ubmVjdFRpbWVvdXQoY29ubmVjdGlvbik7XHJcblxyXG4gICAgICAgICAgICBpZiAoY29ubmVjdGlvbi5zb2NrZXQpIHtcclxuICAgICAgICAgICAgICAgIGNvbm5lY3Rpb24ubG9nKFwiQ2xvc2luZyB0aGUgV2Vic29ja2V0XCIpO1xyXG4gICAgICAgICAgICAgICAgY29ubmVjdGlvbi5zb2NrZXQuY2xvc2UoKTtcclxuICAgICAgICAgICAgICAgIGNvbm5lY3Rpb24uc29ja2V0ID0gbnVsbDtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIGFib3J0OiBmdW5jdGlvbiAoY29ubmVjdGlvbikge1xyXG4gICAgICAgIH1cclxuICAgIH07XHJcblxyXG59KHdpbmRvdy5qUXVlcnksIHdpbmRvdykpO1xyXG4vKiBqcXVlcnkuc2lnbmFsUi50cmFuc3BvcnRzLnNlcnZlclNlbnRFdmVudHMuanMgKi9cclxuLy8gQ29weXJpZ2h0IChjKSBNaWNyb3NvZnQgT3BlbiBUZWNobm9sb2dpZXMsIEluYy4gQWxsIHJpZ2h0cyByZXNlcnZlZC4gU2VlIExpY2Vuc2UubWQgaW4gdGhlIHByb2plY3Qgcm9vdCBmb3IgbGljZW5zZSBpbmZvcm1hdGlvbi5cclxuXHJcbi8qZ2xvYmFsIHdpbmRvdzpmYWxzZSAqL1xyXG4vLy8gPHJlZmVyZW5jZSBwYXRoPVwianF1ZXJ5LnNpZ25hbFIudHJhbnNwb3J0cy5jb21tb24uanNcIiAvPlxyXG5cclxuKGZ1bmN0aW9uICgkLCB3aW5kb3cpIHtcclxuICAgIFwidXNlIHN0cmljdFwiO1xyXG5cclxuICAgIHZhciBzaWduYWxSID0gJC5zaWduYWxSLFxyXG4gICAgICAgIGV2ZW50cyA9ICQuc2lnbmFsUi5ldmVudHMsXHJcbiAgICAgICAgY2hhbmdlU3RhdGUgPSAkLnNpZ25hbFIuY2hhbmdlU3RhdGUsXHJcbiAgICAgICAgdHJhbnNwb3J0TG9naWMgPSBzaWduYWxSLnRyYW5zcG9ydHMuX2xvZ2ljO1xyXG5cclxuICAgIHNpZ25hbFIudHJhbnNwb3J0cy5zZXJ2ZXJTZW50RXZlbnRzID0ge1xyXG4gICAgICAgIG5hbWU6IFwic2VydmVyU2VudEV2ZW50c1wiLFxyXG5cclxuICAgICAgICBzdXBwb3J0c0tlZXBBbGl2ZTogdHJ1ZSxcclxuXHJcbiAgICAgICAgdGltZU91dDogMzAwMCxcclxuXHJcbiAgICAgICAgc3RhcnQ6IGZ1bmN0aW9uIChjb25uZWN0aW9uLCBvblN1Y2Nlc3MsIG9uRmFpbGVkKSB7XHJcbiAgICAgICAgICAgIHZhciB0aGF0ID0gdGhpcyxcclxuICAgICAgICAgICAgICAgIG9wZW5lZCA9IGZhbHNlLFxyXG4gICAgICAgICAgICAgICAgJGNvbm5lY3Rpb24gPSAkKGNvbm5lY3Rpb24pLFxyXG4gICAgICAgICAgICAgICAgcmVjb25uZWN0aW5nID0gIW9uU3VjY2VzcyxcclxuICAgICAgICAgICAgICAgIHVybCxcclxuICAgICAgICAgICAgICAgIHJlY29ubmVjdFRpbWVvdXQ7XHJcblxyXG4gICAgICAgICAgICBpZiAoY29ubmVjdGlvbi5ldmVudFNvdXJjZSkge1xyXG4gICAgICAgICAgICAgICAgY29ubmVjdGlvbi5sb2coXCJUaGUgY29ubmVjdGlvbiBhbHJlYWR5IGhhcyBhbiBldmVudCBzb3VyY2UuIFN0b3BwaW5nIGl0LlwiKTtcclxuICAgICAgICAgICAgICAgIGNvbm5lY3Rpb24uc3RvcCgpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBpZiAoIXdpbmRvdy5FdmVudFNvdXJjZSkge1xyXG4gICAgICAgICAgICAgICAgaWYgKG9uRmFpbGVkKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY29ubmVjdGlvbi5sb2coXCJUaGlzIGJyb3dzZXIgZG9lc24ndCBzdXBwb3J0IFNTRS5cIik7XHJcbiAgICAgICAgICAgICAgICAgICAgb25GYWlsZWQoKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgdXJsID0gdHJhbnNwb3J0TG9naWMuZ2V0VXJsKGNvbm5lY3Rpb24sIHRoaXMubmFtZSwgcmVjb25uZWN0aW5nKTtcclxuXHJcbiAgICAgICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgICAgICBjb25uZWN0aW9uLmxvZyhcIkF0dGVtcHRpbmcgdG8gY29ubmVjdCB0byBTU0UgZW5kcG9pbnQgJ1wiICsgdXJsICsgXCInXCIpO1xyXG4gICAgICAgICAgICAgICAgY29ubmVjdGlvbi5ldmVudFNvdXJjZSA9IG5ldyB3aW5kb3cuRXZlbnRTb3VyY2UodXJsKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBjYXRjaCAoZSkge1xyXG4gICAgICAgICAgICAgICAgY29ubmVjdGlvbi5sb2coXCJFdmVudFNvdXJjZSBmYWlsZWQgdHJ5aW5nIHRvIGNvbm5lY3Qgd2l0aCBlcnJvciBcIiArIGUuTWVzc2FnZSk7XHJcbiAgICAgICAgICAgICAgICBpZiAob25GYWlsZWQpIHtcclxuICAgICAgICAgICAgICAgICAgICAvLyBUaGUgY29ubmVjdGlvbiBmYWlsZWQsIGNhbGwgdGhlIGZhaWxlZCBjYWxsYmFja1xyXG4gICAgICAgICAgICAgICAgICAgIG9uRmFpbGVkKCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICAkY29ubmVjdGlvbi50cmlnZ2VySGFuZGxlcihldmVudHMub25FcnJvciwgW2VdKTtcclxuICAgICAgICAgICAgICAgICAgICBpZiAocmVjb25uZWN0aW5nKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIElmIHdlIHdlcmUgcmVjb25uZWN0aW5nLCByYXRoZXIgdGhhbiBkb2luZyBpbml0aWFsIGNvbm5lY3QsIHRoZW4gdHJ5IHJlY29ubmVjdCBhZ2FpblxyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGF0LnJlY29ubmVjdChjb25uZWN0aW9uKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGlmIChyZWNvbm5lY3RpbmcpIHtcclxuICAgICAgICAgICAgICAgIHJlY29ubmVjdFRpbWVvdXQgPSB3aW5kb3cuc2V0VGltZW91dChmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKG9wZW5lZCA9PT0gZmFsc2UpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gSWYgd2UncmUgcmVjb25uZWN0aW5nIGFuZCB0aGUgZXZlbnQgc291cmNlIGlzIGF0dGVtcHRpbmcgdG8gY29ubmVjdCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gZG9uJ3Qga2VlcCByZXRyeWluZy4gVGhpcyBjYXVzZXMgZHVwbGljYXRlIGNvbm5lY3Rpb25zIHRvIHNwYXduLlxyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoY29ubmVjdGlvbi5ldmVudFNvdXJjZS5yZWFkeVN0YXRlICE9PSB3aW5kb3cuRXZlbnRTb3VyY2UuQ09OTkVDVElORyAmJlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29ubmVjdGlvbi5ldmVudFNvdXJjZS5yZWFkeVN0YXRlICE9PSB3aW5kb3cuRXZlbnRTb3VyY2UuT1BFTikge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gSWYgd2Ugd2VyZSByZWNvbm5lY3RpbmcsIHJhdGhlciB0aGFuIGRvaW5nIGluaXRpYWwgY29ubmVjdCwgdGhlbiB0cnkgcmVjb25uZWN0IGFnYWluXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGF0LnJlY29ubmVjdChjb25uZWN0aW9uKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICB0aGF0LnRpbWVPdXQpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBjb25uZWN0aW9uLmV2ZW50U291cmNlLmFkZEV2ZW50TGlzdGVuZXIoXCJvcGVuXCIsIGZ1bmN0aW9uIChlKSB7XHJcbiAgICAgICAgICAgICAgICBjb25uZWN0aW9uLmxvZyhcIkV2ZW50U291cmNlIGNvbm5lY3RlZFwiKTtcclxuXHJcbiAgICAgICAgICAgICAgICBpZiAocmVjb25uZWN0VGltZW91dCkge1xyXG4gICAgICAgICAgICAgICAgICAgIHdpbmRvdy5jbGVhclRpbWVvdXQocmVjb25uZWN0VGltZW91dCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgdHJhbnNwb3J0TG9naWMuY2xlYXJSZWNvbm5lY3RUaW1lb3V0KGNvbm5lY3Rpb24pO1xyXG5cclxuICAgICAgICAgICAgICAgIGlmIChvcGVuZWQgPT09IGZhbHNlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgb3BlbmVkID0gdHJ1ZTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKGNoYW5nZVN0YXRlKGNvbm5lY3Rpb24sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc2lnbmFsUi5jb25uZWN0aW9uU3RhdGUucmVjb25uZWN0aW5nLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNpZ25hbFIuY29ubmVjdGlvblN0YXRlLmNvbm5lY3RlZCkgPT09IHRydWUpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgJGNvbm5lY3Rpb24udHJpZ2dlckhhbmRsZXIoZXZlbnRzLm9uUmVjb25uZWN0KTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0sIGZhbHNlKTtcclxuXHJcbiAgICAgICAgICAgIGNvbm5lY3Rpb24uZXZlbnRTb3VyY2UuYWRkRXZlbnRMaXN0ZW5lcihcIm1lc3NhZ2VcIiwgZnVuY3Rpb24gKGUpIHtcclxuICAgICAgICAgICAgICAgIC8vIHByb2Nlc3MgbWVzc2FnZXNcclxuICAgICAgICAgICAgICAgIGlmIChlLmRhdGEgPT09IFwiaW5pdGlhbGl6ZWRcIikge1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICB0cmFuc3BvcnRMb2dpYy5wcm9jZXNzTWVzc2FnZXMoY29ubmVjdGlvbiwgY29ubmVjdGlvbi5fcGFyc2VSZXNwb25zZShlLmRhdGEpLCBvblN1Y2Nlc3MpO1xyXG4gICAgICAgICAgICB9LCBmYWxzZSk7XHJcblxyXG4gICAgICAgICAgICBjb25uZWN0aW9uLmV2ZW50U291cmNlLmFkZEV2ZW50TGlzdGVuZXIoXCJlcnJvclwiLCBmdW5jdGlvbiAoZSkge1xyXG4gICAgICAgICAgICAgICAgLy8gT25seSBoYW5kbGUgYW4gZXJyb3IgaWYgdGhlIGVycm9yIGlzIGZyb20gdGhlIGN1cnJlbnQgRXZlbnQgU291cmNlLlxyXG4gICAgICAgICAgICAgICAgLy8gU29tZXRpbWVzIG9uIGRpc2Nvbm5lY3QgdGhlIHNlcnZlciB3aWxsIHB1c2ggZG93biBhbiBlcnJvciBldmVudFxyXG4gICAgICAgICAgICAgICAgLy8gdG8gYW4gZXhwaXJlZCBFdmVudCBTb3VyY2UuXHJcbiAgICAgICAgICAgICAgICBpZiAodGhpcyA9PT0gY29ubmVjdGlvbi5ldmVudFNvdXJjZSkge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmICghb3BlbmVkKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChvbkZhaWxlZCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgb25GYWlsZWQoKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAgICAgY29ubmVjdGlvbi5sb2coXCJFdmVudFNvdXJjZSByZWFkeVN0YXRlOiBcIiArIGNvbm5lY3Rpb24uZXZlbnRTb3VyY2UucmVhZHlTdGF0ZSk7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGlmIChlLmV2ZW50UGhhc2UgPT09IHdpbmRvdy5FdmVudFNvdXJjZS5DTE9TRUQpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gV2UgZG9uJ3QgdXNlIHRoZSBFdmVudFNvdXJjZSdzIG5hdGl2ZSByZWNvbm5lY3QgZnVuY3Rpb24gYXMgaXRcclxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gZG9lc24ndCBhbGxvdyB1cyB0byBjaGFuZ2UgdGhlIFVSTCB3aGVuIHJlY29ubmVjdGluZy4gV2UgbmVlZFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyB0byBjaGFuZ2UgdGhlIFVSTCB0byBub3QgaW5jbHVkZSB0aGUgL2Nvbm5lY3Qgc3VmZml4LCBhbmQgcGFzc1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyB0aGUgbGFzdCBtZXNzYWdlIGlkIHdlIHJlY2VpdmVkLlxyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25uZWN0aW9uLmxvZyhcIkV2ZW50U291cmNlIHJlY29ubmVjdGluZyBkdWUgdG8gdGhlIHNlcnZlciBjb25uZWN0aW9uIGVuZGluZ1wiKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhhdC5yZWNvbm5lY3QoY29ubmVjdGlvbik7XHJcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gY29ubmVjdGlvbiBlcnJvclxyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25uZWN0aW9uLmxvZyhcIkV2ZW50U291cmNlIGVycm9yXCIpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAkY29ubmVjdGlvbi50cmlnZ2VySGFuZGxlcihldmVudHMub25FcnJvcik7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9LCBmYWxzZSk7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgcmVjb25uZWN0OiBmdW5jdGlvbiAoY29ubmVjdGlvbikge1xyXG4gICAgICAgICAgICB0cmFuc3BvcnRMb2dpYy5yZWNvbm5lY3QoY29ubmVjdGlvbiwgdGhpcy5uYW1lKTtcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICBsb3N0Q29ubmVjdGlvbjogZnVuY3Rpb24gKGNvbm5lY3Rpb24pIHtcclxuICAgICAgICAgICAgdGhpcy5yZWNvbm5lY3QoY29ubmVjdGlvbik7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgc2VuZDogZnVuY3Rpb24gKGNvbm5lY3Rpb24sIGRhdGEpIHtcclxuICAgICAgICAgICAgdHJhbnNwb3J0TG9naWMuYWpheFNlbmQoY29ubmVjdGlvbiwgZGF0YSk7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgc3RvcDogZnVuY3Rpb24gKGNvbm5lY3Rpb24pIHtcclxuICAgICAgICAgICAgLy8gRG9uJ3QgdHJpZ2dlciBhIHJlY29ubmVjdCBhZnRlciBzdG9wcGluZ1xyXG4gICAgICAgICAgICB0cmFuc3BvcnRMb2dpYy5jbGVhclJlY29ubmVjdFRpbWVvdXQoY29ubmVjdGlvbik7XHJcblxyXG4gICAgICAgICAgICBpZiAoY29ubmVjdGlvbiAmJiBjb25uZWN0aW9uLmV2ZW50U291cmNlKSB7XHJcbiAgICAgICAgICAgICAgICBjb25uZWN0aW9uLmxvZyhcIkV2ZW50U291cmNlIGNhbGxpbmcgY2xvc2UoKVwiKTtcclxuICAgICAgICAgICAgICAgIGNvbm5lY3Rpb24uZXZlbnRTb3VyY2UuY2xvc2UoKTtcclxuICAgICAgICAgICAgICAgIGNvbm5lY3Rpb24uZXZlbnRTb3VyY2UgPSBudWxsO1xyXG4gICAgICAgICAgICAgICAgZGVsZXRlIGNvbm5lY3Rpb24uZXZlbnRTb3VyY2U7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICBhYm9ydDogZnVuY3Rpb24gKGNvbm5lY3Rpb24sIGFzeW5jKSB7XHJcbiAgICAgICAgICAgIHRyYW5zcG9ydExvZ2ljLmFqYXhBYm9ydChjb25uZWN0aW9uLCBhc3luYyk7XHJcbiAgICAgICAgfVxyXG4gICAgfTtcclxuXHJcbn0od2luZG93LmpRdWVyeSwgd2luZG93KSk7XHJcbi8qIGpxdWVyeS5zaWduYWxSLnRyYW5zcG9ydHMuZm9yZXZlckZyYW1lLmpzICovXHJcbi8vIENvcHlyaWdodCAoYykgTWljcm9zb2Z0IE9wZW4gVGVjaG5vbG9naWVzLCBJbmMuIEFsbCByaWdodHMgcmVzZXJ2ZWQuIFNlZSBMaWNlbnNlLm1kIGluIHRoZSBwcm9qZWN0IHJvb3QgZm9yIGxpY2Vuc2UgaW5mb3JtYXRpb24uXHJcblxyXG4vKmdsb2JhbCB3aW5kb3c6ZmFsc2UgKi9cclxuLy8vIDxyZWZlcmVuY2UgcGF0aD1cImpxdWVyeS5zaWduYWxSLnRyYW5zcG9ydHMuY29tbW9uLmpzXCIgLz5cclxuXHJcbihmdW5jdGlvbiAoJCwgd2luZG93KSB7XHJcbiAgICBcInVzZSBzdHJpY3RcIjtcclxuXHJcbiAgICB2YXIgc2lnbmFsUiA9ICQuc2lnbmFsUixcclxuICAgICAgICBldmVudHMgPSAkLnNpZ25hbFIuZXZlbnRzLFxyXG4gICAgICAgIGNoYW5nZVN0YXRlID0gJC5zaWduYWxSLmNoYW5nZVN0YXRlLFxyXG4gICAgICAgIHRyYW5zcG9ydExvZ2ljID0gc2lnbmFsUi50cmFuc3BvcnRzLl9sb2dpYyxcclxuICAgICAgICAvLyBVc2VkIHRvIHByZXZlbnQgaW5maW5pdGUgbG9hZGluZyBpY29uIHNwaW5zIGluIG9sZGVyIHZlcnNpb25zIG9mIGllXHJcbiAgICAgICAgLy8gV2UgYnVpbGQgdGhpcyBvYmplY3QgaW5zaWRlIGEgY2xvc3VyZSBzbyB3ZSBkb24ndCBwb2xsdXRlIHRoZSByZXN0IG9mICAgXHJcbiAgICAgICAgLy8gdGhlIGZvcmV2ZXJGcmFtZSB0cmFuc3BvcnQgd2l0aCB1bm5lY2Vzc2FyeSBmdW5jdGlvbnMvdXRpbGl0aWVzLlxyXG4gICAgICAgIGxvYWRQcmV2ZW50ZXIgPSAoZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICB2YXIgbG9hZGluZ0ZpeEludGVydmFsSWQgPSBudWxsLFxyXG4gICAgICAgICAgICAgICAgbG9hZGluZ0ZpeEludGVydmFsID0gMTAwMCxcclxuICAgICAgICAgICAgICAgIGF0dGFjaGVkVG8gPSAwO1xyXG5cclxuICAgICAgICAgICAgcmV0dXJuIHtcclxuICAgICAgICAgICAgICAgIHByZXZlbnQ6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgICAgICAvLyBQcmV2ZW50IGFkZGl0aW9uYWwgaWZyYW1lIHJlbW92YWwgcHJvY2VkdXJlcyBmcm9tIG5ld2VyIGJyb3dzZXJzXHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKHNpZ25hbFIuXy5pZVZlcnNpb24gPD0gOCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBXZSBvbmx5IGV2ZXIgd2FudCB0byBzZXQgdGhlIGludGVydmFsIG9uZSB0aW1lLCBzbyBvbiB0aGUgZmlyc3QgYXR0YWNoZWRUb1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoYXR0YWNoZWRUbyA9PT0gMCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gQ3JlYXRlIGFuZCBkZXN0cm95IGlmcmFtZSBldmVyeSAzIHNlY29uZHMgdG8gcHJldmVudCBsb2FkaW5nIGljb24sIHN1cGVyIGhhY2t5XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBsb2FkaW5nRml4SW50ZXJ2YWxJZCA9IHdpbmRvdy5zZXRJbnRlcnZhbChmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHRlbXBGcmFtZSA9ICQoXCI8aWZyYW1lIHN0eWxlPSdwb3NpdGlvbjphYnNvbHV0ZTt0b3A6MDtsZWZ0OjA7d2lkdGg6MDtoZWlnaHQ6MDt2aXNpYmlsaXR5OmhpZGRlbjsnIHNyYz0nJz48L2lmcmFtZT5cIik7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICQoXCJib2R5XCIpLmFwcGVuZCh0ZW1wRnJhbWUpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRlbXBGcmFtZS5yZW1vdmUoKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0ZW1wRnJhbWUgPSBudWxsO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSwgbG9hZGluZ0ZpeEludGVydmFsKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgYXR0YWNoZWRUbysrO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICBjYW5jZWw6IGZ1bmN0aW9uICgpIHsgICAgICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICAgICAgLy8gT25seSBjbGVhciB0aGUgaW50ZXJ2YWwgaWYgdGhlcmUncyBvbmx5IG9uZSBtb3JlIG9iamVjdCB0aGF0IHRoZSBsb2FkUHJldmVudGVyIGlzIGF0dGFjaGVkVG9cclxuICAgICAgICAgICAgICAgICAgICBpZiAoYXR0YWNoZWRUbyA9PT0gMSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB3aW5kb3cuY2xlYXJJbnRlcnZhbChsb2FkaW5nRml4SW50ZXJ2YWxJZCk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgICAgICBpZiAoYXR0YWNoZWRUbyA+IDApIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgYXR0YWNoZWRUby0tO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfTtcclxuICAgICAgICB9KSgpO1xyXG5cclxuICAgIHNpZ25hbFIudHJhbnNwb3J0cy5mb3JldmVyRnJhbWUgPSB7XHJcbiAgICAgICAgbmFtZTogXCJmb3JldmVyRnJhbWVcIixcclxuXHJcbiAgICAgICAgc3VwcG9ydHNLZWVwQWxpdmU6IHRydWUsXHJcblxyXG4gICAgICAgIHN0YXJ0OiBmdW5jdGlvbiAoY29ubmVjdGlvbiwgb25TdWNjZXNzLCBvbkZhaWxlZCkge1xyXG4gICAgICAgICAgICB2YXIgdGhhdCA9IHRoaXMsXHJcbiAgICAgICAgICAgICAgICBmcmFtZUlkID0gKHRyYW5zcG9ydExvZ2ljLmZvcmV2ZXJGcmFtZS5jb3VudCArPSAxKSxcclxuICAgICAgICAgICAgICAgIHVybCxcclxuICAgICAgICAgICAgICAgIGZyYW1lID0gJChcIjxpZnJhbWUgZGF0YS1zaWduYWxyLWNvbm5lY3Rpb24taWQ9J1wiICsgY29ubmVjdGlvbi5pZCArIFwiJyBzdHlsZT0ncG9zaXRpb246YWJzb2x1dGU7dG9wOjA7bGVmdDowO3dpZHRoOjA7aGVpZ2h0OjA7dmlzaWJpbGl0eTpoaWRkZW47JyBzcmM9Jyc+PC9pZnJhbWU+XCIpO1xyXG5cclxuICAgICAgICAgICAgaWYgKHdpbmRvdy5FdmVudFNvdXJjZSkge1xyXG4gICAgICAgICAgICAgICAgLy8gSWYgdGhlIGJyb3dzZXIgc3VwcG9ydHMgU1NFLCBkb24ndCB1c2UgRm9yZXZlciBGcmFtZVxyXG4gICAgICAgICAgICAgICAgaWYgKG9uRmFpbGVkKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY29ubmVjdGlvbi5sb2coXCJUaGlzIGJyb3dzZXIgc3VwcG9ydHMgU1NFLCBza2lwcGluZyBGb3JldmVyIEZyYW1lLlwiKTtcclxuICAgICAgICAgICAgICAgICAgICBvbkZhaWxlZCgpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAvLyBTdGFydCBwcmV2ZW50aW5nIGxvYWRpbmcgaWNvblxyXG4gICAgICAgICAgICAvLyBUaGlzIHdpbGwgb25seSBwZXJmb3JtIHdvcmsgaWYgdGhlIGxvYWRQcmV2ZW50ZXIgaXMgbm90IGF0dGFjaGVkIHRvIGFub3RoZXIgY29ubmVjdGlvbi5cclxuICAgICAgICAgICAgbG9hZFByZXZlbnRlci5wcmV2ZW50KCk7XHJcblxyXG4gICAgICAgICAgICAvLyBCdWlsZCB0aGUgdXJsXHJcbiAgICAgICAgICAgIHVybCA9IHRyYW5zcG9ydExvZ2ljLmdldFVybChjb25uZWN0aW9uLCB0aGlzLm5hbWUpO1xyXG4gICAgICAgICAgICB1cmwgKz0gXCImZnJhbWVJZD1cIiArIGZyYW1lSWQ7XHJcblxyXG4gICAgICAgICAgICAvLyBTZXQgYm9keSBwcmlvciB0byBzZXR0aW5nIFVSTCB0byBhdm9pZCBjYWNoaW5nIGlzc3Vlcy5cclxuICAgICAgICAgICAgJChcImJvZHlcIikuYXBwZW5kKGZyYW1lKTtcclxuXHJcbiAgICAgICAgICAgIGZyYW1lLnByb3AoXCJzcmNcIiwgdXJsKTtcclxuICAgICAgICAgICAgdHJhbnNwb3J0TG9naWMuZm9yZXZlckZyYW1lLmNvbm5lY3Rpb25zW2ZyYW1lSWRdID0gY29ubmVjdGlvbjtcclxuXHJcbiAgICAgICAgICAgIGNvbm5lY3Rpb24ubG9nKFwiQmluZGluZyB0byBpZnJhbWUncyByZWFkeXN0YXRlY2hhbmdlIGV2ZW50LlwiKTtcclxuICAgICAgICAgICAgZnJhbWUuYmluZChcInJlYWR5c3RhdGVjaGFuZ2VcIiwgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgaWYgKCQuaW5BcnJheSh0aGlzLnJlYWR5U3RhdGUsIFtcImxvYWRlZFwiLCBcImNvbXBsZXRlXCJdKSA+PSAwKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY29ubmVjdGlvbi5sb2coXCJGb3JldmVyIGZyYW1lIGlmcmFtZSByZWFkeVN0YXRlIGNoYW5nZWQgdG8gXCIgKyB0aGlzLnJlYWR5U3RhdGUgKyBcIiwgcmVjb25uZWN0aW5nXCIpO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICB0aGF0LnJlY29ubmVjdChjb25uZWN0aW9uKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgICBjb25uZWN0aW9uLmZyYW1lID0gZnJhbWVbMF07XHJcbiAgICAgICAgICAgIGNvbm5lY3Rpb24uZnJhbWVJZCA9IGZyYW1lSWQ7XHJcblxyXG4gICAgICAgICAgICBpZiAob25TdWNjZXNzKSB7XHJcbiAgICAgICAgICAgICAgICBjb25uZWN0aW9uLm9uU3VjY2VzcyA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgICAgICBvblN1Y2Nlc3MoKTtcclxuICAgICAgICAgICAgICAgICAgICBkZWxldGUgY29ubmVjdGlvbi5vblN1Y2Nlc3M7XHJcbiAgICAgICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgcmVjb25uZWN0OiBmdW5jdGlvbiAoY29ubmVjdGlvbikge1xyXG4gICAgICAgICAgICB2YXIgdGhhdCA9IHRoaXM7XHJcbiAgICAgICAgICAgIHdpbmRvdy5zZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgIGlmIChjb25uZWN0aW9uLmZyYW1lICYmIHRyYW5zcG9ydExvZ2ljLmVuc3VyZVJlY29ubmVjdGluZ1N0YXRlKGNvbm5lY3Rpb24pKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIGZyYW1lID0gY29ubmVjdGlvbi5mcmFtZSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgc3JjID0gdHJhbnNwb3J0TG9naWMuZ2V0VXJsKGNvbm5lY3Rpb24sIHRoYXQubmFtZSwgdHJ1ZSkgKyBcIiZmcmFtZUlkPVwiICsgY29ubmVjdGlvbi5mcmFtZUlkO1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbm5lY3Rpb24ubG9nKFwiVXBkYXRpbmcgaWZyYW1lIHNyYyB0byAnXCIgKyBzcmMgKyBcIicuXCIpO1xyXG4gICAgICAgICAgICAgICAgICAgIGZyYW1lLnNyYyA9IHNyYztcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSwgY29ubmVjdGlvbi5yZWNvbm5lY3REZWxheSk7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgbG9zdENvbm5lY3Rpb246IGZ1bmN0aW9uIChjb25uZWN0aW9uKSB7XHJcbiAgICAgICAgICAgIHRoaXMucmVjb25uZWN0KGNvbm5lY3Rpb24pO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIHNlbmQ6IGZ1bmN0aW9uIChjb25uZWN0aW9uLCBkYXRhKSB7XHJcbiAgICAgICAgICAgIHRyYW5zcG9ydExvZ2ljLmFqYXhTZW5kKGNvbm5lY3Rpb24sIGRhdGEpO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIHJlY2VpdmU6IGZ1bmN0aW9uIChjb25uZWN0aW9uLCBkYXRhKSB7XHJcbiAgICAgICAgICAgIHZhciBjdztcclxuXHJcbiAgICAgICAgICAgIHRyYW5zcG9ydExvZ2ljLnByb2Nlc3NNZXNzYWdlcyhjb25uZWN0aW9uLCBkYXRhLCBjb25uZWN0aW9uLm9uU3VjY2Vzcyk7XHJcbiAgICAgICAgICAgIC8vIERlbGV0ZSB0aGUgc2NyaXB0ICYgZGl2IGVsZW1lbnRzXHJcbiAgICAgICAgICAgIGNvbm5lY3Rpb24uZnJhbWVNZXNzYWdlQ291bnQgPSAoY29ubmVjdGlvbi5mcmFtZU1lc3NhZ2VDb3VudCB8fCAwKSArIDE7XHJcbiAgICAgICAgICAgIGlmIChjb25uZWN0aW9uLmZyYW1lTWVzc2FnZUNvdW50ID4gNTApIHtcclxuICAgICAgICAgICAgICAgIGNvbm5lY3Rpb24uZnJhbWVNZXNzYWdlQ291bnQgPSAwO1xyXG4gICAgICAgICAgICAgICAgY3cgPSBjb25uZWN0aW9uLmZyYW1lLmNvbnRlbnRXaW5kb3cgfHwgY29ubmVjdGlvbi5mcmFtZS5jb250ZW50RG9jdW1lbnQ7XHJcbiAgICAgICAgICAgICAgICBpZiAoY3cgJiYgY3cuZG9jdW1lbnQpIHtcclxuICAgICAgICAgICAgICAgICAgICAkKFwiYm9keVwiLCBjdy5kb2N1bWVudCkuZW1wdHkoKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIHN0b3A6IGZ1bmN0aW9uIChjb25uZWN0aW9uKSB7XHJcbiAgICAgICAgICAgIHZhciBjdyA9IG51bGw7XHJcblxyXG4gICAgICAgICAgICAvLyBTdG9wIGF0dGVtcHRpbmcgdG8gcHJldmVudCBsb2FkaW5nIGljb25cclxuICAgICAgICAgICAgbG9hZFByZXZlbnRlci5jYW5jZWwoKTtcclxuXHJcbiAgICAgICAgICAgIGlmIChjb25uZWN0aW9uLmZyYW1lKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoY29ubmVjdGlvbi5mcmFtZS5zdG9wKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY29ubmVjdGlvbi5mcmFtZS5zdG9wKCk7XHJcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGN3ID0gY29ubmVjdGlvbi5mcmFtZS5jb250ZW50V2luZG93IHx8IGNvbm5lY3Rpb24uZnJhbWUuY29udGVudERvY3VtZW50O1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoY3cuZG9jdW1lbnQgJiYgY3cuZG9jdW1lbnQuZXhlY0NvbW1hbmQpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGN3LmRvY3VtZW50LmV4ZWNDb21tYW5kKFwiU3RvcFwiKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICBjYXRjaCAoZSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25uZWN0aW9uLmxvZyhcIlNpZ25hbFI6IEVycm9yIG9jY3VyZWQgd2hlbiBzdG9wcGluZyBmb3JldmVyRnJhbWUgdHJhbnNwb3J0LiBNZXNzYWdlID0gXCIgKyBlLm1lc3NhZ2UpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICQoY29ubmVjdGlvbi5mcmFtZSkucmVtb3ZlKCk7XHJcbiAgICAgICAgICAgICAgICBkZWxldGUgdHJhbnNwb3J0TG9naWMuZm9yZXZlckZyYW1lLmNvbm5lY3Rpb25zW2Nvbm5lY3Rpb24uZnJhbWVJZF07XHJcbiAgICAgICAgICAgICAgICBjb25uZWN0aW9uLmZyYW1lID0gbnVsbDtcclxuICAgICAgICAgICAgICAgIGNvbm5lY3Rpb24uZnJhbWVJZCA9IG51bGw7XHJcbiAgICAgICAgICAgICAgICBkZWxldGUgY29ubmVjdGlvbi5mcmFtZTtcclxuICAgICAgICAgICAgICAgIGRlbGV0ZSBjb25uZWN0aW9uLmZyYW1lSWQ7XHJcbiAgICAgICAgICAgICAgICBkZWxldGUgY29ubmVjdGlvbi5vblN1Y2Nlc3M7XHJcbiAgICAgICAgICAgICAgICBjb25uZWN0aW9uLmxvZyhcIlN0b3BwaW5nIGZvcmV2ZXIgZnJhbWVcIik7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICBhYm9ydDogZnVuY3Rpb24gKGNvbm5lY3Rpb24sIGFzeW5jKSB7XHJcbiAgICAgICAgICAgIHRyYW5zcG9ydExvZ2ljLmFqYXhBYm9ydChjb25uZWN0aW9uLCBhc3luYyk7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgZ2V0Q29ubmVjdGlvbjogZnVuY3Rpb24gKGlkKSB7XHJcbiAgICAgICAgICAgIHJldHVybiB0cmFuc3BvcnRMb2dpYy5mb3JldmVyRnJhbWUuY29ubmVjdGlvbnNbaWRdO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIHN0YXJ0ZWQ6IGZ1bmN0aW9uIChjb25uZWN0aW9uKSB7XHJcbiAgICAgICAgICAgIGlmIChjaGFuZ2VTdGF0ZShjb25uZWN0aW9uLFxyXG4gICAgICAgICAgICAgICAgc2lnbmFsUi5jb25uZWN0aW9uU3RhdGUucmVjb25uZWN0aW5nLFxyXG4gICAgICAgICAgICAgICAgc2lnbmFsUi5jb25uZWN0aW9uU3RhdGUuY29ubmVjdGVkKSA9PT0gdHJ1ZSkge1xyXG4gICAgICAgICAgICAgICAgLy8gSWYgdGhlcmUncyBubyBvblN1Y2Nlc3MgaGFuZGxlciB3ZSBhc3N1bWUgdGhpcyBpcyBhIHJlY29ubmVjdFxyXG4gICAgICAgICAgICAgICAgJChjb25uZWN0aW9uKS50cmlnZ2VySGFuZGxlcihldmVudHMub25SZWNvbm5lY3QpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfTtcclxuXHJcbn0od2luZG93LmpRdWVyeSwgd2luZG93KSk7XHJcbi8qIGpxdWVyeS5zaWduYWxSLnRyYW5zcG9ydHMubG9uZ1BvbGxpbmcuanMgKi9cclxuLy8gQ29weXJpZ2h0IChjKSBNaWNyb3NvZnQgT3BlbiBUZWNobm9sb2dpZXMsIEluYy4gQWxsIHJpZ2h0cyByZXNlcnZlZC4gU2VlIExpY2Vuc2UubWQgaW4gdGhlIHByb2plY3Qgcm9vdCBmb3IgbGljZW5zZSBpbmZvcm1hdGlvbi5cclxuXHJcbi8qZ2xvYmFsIHdpbmRvdzpmYWxzZSAqL1xyXG4vLy8gPHJlZmVyZW5jZSBwYXRoPVwianF1ZXJ5LnNpZ25hbFIudHJhbnNwb3J0cy5jb21tb24uanNcIiAvPlxyXG5cclxuKGZ1bmN0aW9uICgkLCB3aW5kb3cpIHtcclxuICAgIFwidXNlIHN0cmljdFwiO1xyXG5cclxuICAgIHZhciBzaWduYWxSID0gJC5zaWduYWxSLFxyXG4gICAgICAgIGV2ZW50cyA9ICQuc2lnbmFsUi5ldmVudHMsXHJcbiAgICAgICAgY2hhbmdlU3RhdGUgPSAkLnNpZ25hbFIuY2hhbmdlU3RhdGUsXHJcbiAgICAgICAgaXNEaXNjb25uZWN0aW5nID0gJC5zaWduYWxSLmlzRGlzY29ubmVjdGluZyxcclxuICAgICAgICB0cmFuc3BvcnRMb2dpYyA9IHNpZ25hbFIudHJhbnNwb3J0cy5fbG9naWM7XHJcblxyXG4gICAgc2lnbmFsUi50cmFuc3BvcnRzLmxvbmdQb2xsaW5nID0ge1xyXG4gICAgICAgIG5hbWU6IFwibG9uZ1BvbGxpbmdcIixcclxuXHJcbiAgICAgICAgc3VwcG9ydHNLZWVwQWxpdmU6IGZhbHNlLFxyXG5cclxuICAgICAgICByZWNvbm5lY3REZWxheTogMzAwMCxcclxuXHJcbiAgICAgICAgc3RhcnQ6IGZ1bmN0aW9uIChjb25uZWN0aW9uLCBvblN1Y2Nlc3MsIG9uRmFpbGVkKSB7XHJcbiAgICAgICAgICAgIC8vLyA8c3VtbWFyeT5TdGFydHMgdGhlIGxvbmcgcG9sbGluZyBjb25uZWN0aW9uPC9zdW1tYXJ5PlxyXG4gICAgICAgICAgICAvLy8gPHBhcmFtIG5hbWU9XCJjb25uZWN0aW9uXCIgdHlwZT1cInNpZ25hbFJcIj5UaGUgU2lnbmFsUiBjb25uZWN0aW9uIHRvIHN0YXJ0PC9wYXJhbT5cclxuICAgICAgICAgICAgdmFyIHRoYXQgPSB0aGlzLFxyXG4gICAgICAgICAgICAgICAgZmlyZUNvbm5lY3QgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgZmlyZUNvbm5lY3QgPSAkLm5vb3A7XHJcbiAgICAgICAgICAgICAgICAgICAgb25TdWNjZXNzKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgLy8gUmVzZXQgb25GYWlsZWQgdG8gbnVsbCBiZWNhdXNlIGl0IHNob3VsZG4ndCBiZSBjYWxsZWQgYWdhaW5cclxuICAgICAgICAgICAgICAgICAgICBvbkZhaWxlZCA9IG51bGw7XHJcbiAgICAgICAgICAgICAgICAgICAgY29ubmVjdGlvbi5sb2coXCJMb25nUG9sbGluZyBjb25uZWN0ZWRcIik7XHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgdHJ5RmFpbENvbm5lY3QgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKG9uRmFpbGVkKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG9uRmFpbGVkKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG9uRmFpbGVkID0gbnVsbDtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29ubmVjdGlvbi5sb2coXCJMb25nUG9sbGluZyBmYWlsZWQgdG8gY29ubmVjdC5cIik7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgcmVjb25uZWN0RXJyb3JzID0gMCxcclxuICAgICAgICAgICAgICAgIHJlY29ubmVjdFRpbWVvdXRJZCA9IG51bGwsXHJcbiAgICAgICAgICAgICAgICBmaXJlUmVjb25uZWN0ZWQgPSBmdW5jdGlvbiAoaW5zdGFuY2UpIHtcclxuICAgICAgICAgICAgICAgICAgICB3aW5kb3cuY2xlYXJUaW1lb3V0KHJlY29ubmVjdFRpbWVvdXRJZCk7XHJcbiAgICAgICAgICAgICAgICAgICAgcmVjb25uZWN0VGltZW91dElkID0gbnVsbDtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKGNoYW5nZVN0YXRlKGNvbm5lY3Rpb24sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNpZ25hbFIuY29ubmVjdGlvblN0YXRlLnJlY29ubmVjdGluZyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc2lnbmFsUi5jb25uZWN0aW9uU3RhdGUuY29ubmVjdGVkKSA9PT0gdHJ1ZSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBTdWNjZXNzZnVsbHkgcmVjb25uZWN0ZWQhXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbm5lY3Rpb24ubG9nKFwiUmFpc2luZyB0aGUgcmVjb25uZWN0IGV2ZW50XCIpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAkKGluc3RhbmNlKS50cmlnZ2VySGFuZGxlcihldmVudHMub25SZWNvbm5lY3QpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICAvLyAxIGhvdXJcclxuICAgICAgICAgICAgICAgIG1heEZpcmVSZWNvbm5lY3RlZFRpbWVvdXQgPSAzNjAwMDAwO1xyXG5cclxuICAgICAgICAgICAgaWYgKGNvbm5lY3Rpb24ucG9sbFhocikge1xyXG4gICAgICAgICAgICAgICAgY29ubmVjdGlvbi5sb2coXCJQb2xsaW5nIHhociByZXF1ZXN0cyBhbHJlYWR5IGV4aXN0cywgYWJvcnRpbmcuXCIpO1xyXG4gICAgICAgICAgICAgICAgY29ubmVjdGlvbi5zdG9wKCk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGNvbm5lY3Rpb24ubWVzc2FnZUlkID0gbnVsbDtcclxuXHJcbiAgICAgICAgICAgIHdpbmRvdy5zZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgIChmdW5jdGlvbiBwb2xsKGluc3RhbmNlLCByYWlzZVJlY29ubmVjdCkge1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciBtZXNzYWdlSWQgPSBpbnN0YW5jZS5tZXNzYWdlSWQsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbm5lY3QgPSAobWVzc2FnZUlkID09PSBudWxsKSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgcmVjb25uZWN0aW5nID0gIWNvbm5lY3QsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHBvbGxpbmcgPSAhcmFpc2VSZWNvbm5lY3QsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHVybCA9IHRyYW5zcG9ydExvZ2ljLmdldFVybChpbnN0YW5jZSwgdGhhdC5uYW1lLCByZWNvbm5lY3RpbmcsIHBvbGxpbmcpO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAvLyBJZiB3ZSd2ZSBkaXNjb25uZWN0ZWQgZHVyaW5nIHRoZSB0aW1lIHdlJ3ZlIHRyaWVkIHRvIHJlLWluc3RhbnRpYXRlIHRoZSBwb2xsIHRoZW4gc3RvcC5cclxuICAgICAgICAgICAgICAgICAgICBpZiAoaXNEaXNjb25uZWN0aW5nKGluc3RhbmNlKSA9PT0gdHJ1ZSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgICAgICBjb25uZWN0aW9uLmxvZyhcIkF0dGVtcHRpbmcgdG8gY29ubmVjdCB0byAnXCIgKyB1cmwgKyBcIicgdXNpbmcgbG9uZ1BvbGxpbmcuXCIpO1xyXG4gICAgICAgICAgICAgICAgICAgIGluc3RhbmNlLnBvbGxYaHIgPSAkLmFqYXgoe1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB1cmw6IHVybCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgZ2xvYmFsOiBmYWxzZSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgY2FjaGU6IGZhbHNlLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiBcIkdFVFwiLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBkYXRhVHlwZTogY29ubmVjdGlvbi5hamF4RGF0YVR5cGUsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRlbnRUeXBlOiBjb25uZWN0aW9uLmNvbnRlbnRUeXBlLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc3VjY2VzczogZnVuY3Rpb24gKHJlc3VsdCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBtaW5EYXRhID0gY29ubmVjdGlvbi5fcGFyc2VSZXNwb25zZShyZXN1bHQpLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZWxheSA9IDAsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZGF0YTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBSZXNldCBvdXIgcmVjb25uZWN0IGVycm9ycyBzbyBpZiB3ZSB0cmFuc2l0aW9uIGludG8gYSByZWNvbm5lY3Rpbmcgc3RhdGUgYWdhaW4gd2UgdHJpZ2dlclxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gcmVjb25uZWN0ZWQgcXVpY2tseVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVjb25uZWN0RXJyb3JzID0gMDtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBJZiB0aGVyZSdzIGN1cnJlbnRseSBhIHRpbWVvdXQgdG8gdHJpZ2dlciByZWNvbm5lY3QsIGZpcmUgaXQgbm93IGJlZm9yZSBwcm9jZXNzaW5nIG1lc3NhZ2VzXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAocmVjb25uZWN0VGltZW91dElkICE9PSBudWxsKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZmlyZVJlY29ubmVjdGVkKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKG1pbkRhdGEpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkYXRhID0gdHJhbnNwb3J0TG9naWMubWF4aW1pemVQZXJzaXN0ZW50UmVzcG9uc2UobWluRGF0YSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHJhbnNwb3J0TG9naWMucHJvY2Vzc01lc3NhZ2VzKGluc3RhbmNlLCBtaW5EYXRhLCBmaXJlQ29ubmVjdCk7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGRhdGEgJiZcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAkLnR5cGUoZGF0YS5Mb25nUG9sbERlbGF5KSA9PT0gXCJudW1iZXJcIikge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlbGF5ID0gZGF0YS5Mb25nUG9sbERlbGF5O1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChkYXRhICYmIGRhdGEuRGlzY29ubmVjdCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoaXNEaXNjb25uZWN0aW5nKGluc3RhbmNlKSA9PT0gdHJ1ZSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBXZSBuZXZlciB3YW50IHRvIHBhc3MgYSByYWlzZVJlY29ubmVjdCBmbGFnIGFmdGVyIGEgc3VjY2Vzc2Z1bCBwb2xsLiAgVGhpcyBpcyBoYW5kbGVkIHZpYSB0aGUgZXJyb3IgZnVuY3Rpb25cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChkZWxheSA+IDApIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB3aW5kb3cuc2V0VGltZW91dChmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBvbGwoaW5zdGFuY2UsIGZhbHNlKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9LCBkZWxheSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBvbGwoaW5zdGFuY2UsIGZhbHNlKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgfSxcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGVycm9yOiBmdW5jdGlvbiAoZGF0YSwgdGV4dFN0YXR1cykge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gU3RvcCB0cnlpbmcgdG8gdHJpZ2dlciByZWNvbm5lY3QsIGNvbm5lY3Rpb24gaXMgaW4gYW4gZXJyb3Igc3RhdGVcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIElmIHdlJ3JlIG5vdCBpbiB0aGUgcmVjb25uZWN0IHN0YXRlIHRoaXMgd2lsbCBub29wXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB3aW5kb3cuY2xlYXJUaW1lb3V0KHJlY29ubmVjdFRpbWVvdXRJZCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZWNvbm5lY3RUaW1lb3V0SWQgPSBudWxsO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICh0ZXh0U3RhdHVzID09PSBcImFib3J0XCIpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25uZWN0aW9uLmxvZyhcIkFib3J0ZWQgeGhyIHJlcXVzdC5cIik7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICghdHJ5RmFpbENvbm5lY3QoKSkge1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBJbmNyZW1lbnQgb3VyIHJlY29ubmVjdCBlcnJvcnMsIHdlIGFzc3VtZSBhbGwgZXJyb3JzIHRvIGJlIHJlY29ubmVjdCBlcnJvcnNcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBJbiB0aGUgY2FzZSB0aGF0IGl0J3Mgb3VyIGZpcnN0IGVycm9yIHRoaXMgd2lsbCBjYXVzZSBSZWNvbm5lY3QgdG8gYmUgZmlyZWRcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBhZnRlciAxIHNlY29uZCBkdWUgdG8gcmVjb25uZWN0RXJyb3JzIGJlaW5nID0gMS5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZWNvbm5lY3RFcnJvcnMrKztcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGNvbm5lY3Rpb24uc3RhdGUgIT09IHNpZ25hbFIuY29ubmVjdGlvblN0YXRlLnJlY29ubmVjdGluZykge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25uZWN0aW9uLmxvZyhcIkFuIGVycm9yIG9jY3VycmVkIHVzaW5nIGxvbmdQb2xsaW5nLiBTdGF0dXMgPSBcIiArIHRleHRTdGF0dXMgKyBcIi4gXCIgKyBkYXRhLnJlc3BvbnNlVGV4dCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICQoaW5zdGFuY2UpLnRyaWdnZXJIYW5kbGVyKGV2ZW50cy5vbkVycm9yLCBbZGF0YS5yZXNwb25zZVRleHRdKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIFRyYW5zaXRpb24gaW50byB0aGUgcmVjb25uZWN0aW5nIHN0YXRlXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdHJhbnNwb3J0TG9naWMuZW5zdXJlUmVjb25uZWN0aW5nU3RhdGUoaW5zdGFuY2UpO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBDYWxsIHBvbGwgd2l0aCB0aGUgcmFpc2VSZWNvbm5lY3QgZmxhZyBhcyB0cnVlIGFmdGVyIHRoZSByZWNvbm5lY3QgZGVsYXlcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB3aW5kb3cuc2V0VGltZW91dChmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBvbGwoaW5zdGFuY2UsIHRydWUpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0sIHRoYXQucmVjb25uZWN0RGVsYXkpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgfSk7XHJcblxyXG5cclxuICAgICAgICAgICAgICAgICAgICAvLyBUaGlzIHdpbGwgb25seSBldmVyIHBhc3MgYWZ0ZXIgYW4gZXJyb3IgaGFzIG9jY3VyZWQgdmlhIHRoZSBwb2xsIGFqYXggcHJvY2VkdXJlLlxyXG4gICAgICAgICAgICAgICAgICAgIGlmIChyZWNvbm5lY3RpbmcgJiYgcmFpc2VSZWNvbm5lY3QgPT09IHRydWUpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gV2Ugd2FpdCB0byByZWNvbm5lY3QgZGVwZW5kaW5nIG9uIGhvdyBtYW55IHRpbWVzIHdlJ3ZlIGZhaWxlZCB0byByZWNvbm5lY3QuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIFRoaXMgaXMgZXNzZW50aWFsbHkgYSBoZXVyaXN0aWMgdGhhdCB3aWxsIGV4cG9uZW50aWFsbHkgaW5jcmVhc2UgaW4gd2FpdCB0aW1lIGJlZm9yZVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyB0cmlnZ2VyaW5nIHJlY29ubmVjdGVkLiAgVGhpcyBkZXBlbmRzIG9uIHRoZSBcImVycm9yXCIgaGFuZGxlciBvZiBQb2xsIHRvIGNhbmNlbCB0aGlzIFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyB0aW1lb3V0IGlmIGl0IHRyaWdnZXJzIGJlZm9yZSB0aGUgUmVjb25uZWN0ZWQgZXZlbnQgZmlyZXMuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIFRoZSBNYXRoLm1pbiBhdCB0aGUgZW5kIGlzIHRvIGVuc3VyZSB0aGF0IHRoZSByZWNvbm5lY3QgdGltZW91dCBkb2VzIG5vdCBvdmVyZmxvdy5cclxuICAgICAgICAgICAgICAgICAgICAgICAgcmVjb25uZWN0VGltZW91dElkID0gd2luZG93LnNldFRpbWVvdXQoZnVuY3Rpb24gKCkgeyBmaXJlUmVjb25uZWN0ZWQoaW5zdGFuY2UpOyB9LCBNYXRoLm1pbigxMDAwICogKE1hdGgucG93KDIsIHJlY29ubmVjdEVycm9ycykgLSAxKSwgbWF4RmlyZVJlY29ubmVjdGVkVGltZW91dCkpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH0oY29ubmVjdGlvbikpO1xyXG4gICAgICAgICAgICB9LCAyNTApOyAvLyBIYXZlIHRvIGRlbGF5IGluaXRpYWwgcG9sbCBzbyBDaHJvbWUgZG9lc24ndCBzaG93IGxvYWRlciBzcGlubmVyIGluIHRhYlxyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIGxvc3RDb25uZWN0aW9uOiBmdW5jdGlvbiAoY29ubmVjdGlvbikge1xyXG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJMb3N0IENvbm5lY3Rpb24gbm90IGhhbmRsZWQgZm9yIExvbmdQb2xsaW5nXCIpO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIHNlbmQ6IGZ1bmN0aW9uIChjb25uZWN0aW9uLCBkYXRhKSB7XHJcbiAgICAgICAgICAgIHRyYW5zcG9ydExvZ2ljLmFqYXhTZW5kKGNvbm5lY3Rpb24sIGRhdGEpO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIHN0b3A6IGZ1bmN0aW9uIChjb25uZWN0aW9uKSB7XHJcbiAgICAgICAgICAgIC8vLyA8c3VtbWFyeT5TdG9wcyB0aGUgbG9uZyBwb2xsaW5nIGNvbm5lY3Rpb248L3N1bW1hcnk+XHJcbiAgICAgICAgICAgIC8vLyA8cGFyYW0gbmFtZT1cImNvbm5lY3Rpb25cIiB0eXBlPVwic2lnbmFsUlwiPlRoZSBTaWduYWxSIGNvbm5lY3Rpb24gdG8gc3RvcDwvcGFyYW0+XHJcbiAgICAgICAgICAgIGlmIChjb25uZWN0aW9uLnBvbGxYaHIpIHtcclxuICAgICAgICAgICAgICAgIGNvbm5lY3Rpb24ucG9sbFhoci5hYm9ydCgpO1xyXG4gICAgICAgICAgICAgICAgY29ubmVjdGlvbi5wb2xsWGhyID0gbnVsbDtcclxuICAgICAgICAgICAgICAgIGRlbGV0ZSBjb25uZWN0aW9uLnBvbGxYaHI7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICBhYm9ydDogZnVuY3Rpb24gKGNvbm5lY3Rpb24sIGFzeW5jKSB7XHJcbiAgICAgICAgICAgIHRyYW5zcG9ydExvZ2ljLmFqYXhBYm9ydChjb25uZWN0aW9uLCBhc3luYyk7XHJcbiAgICAgICAgfVxyXG4gICAgfTtcclxuXHJcbn0od2luZG93LmpRdWVyeSwgd2luZG93KSk7XHJcbi8qIGpxdWVyeS5zaWduYWxSLmh1YnMuanMgKi9cclxuLy8gQ29weXJpZ2h0IChjKSBNaWNyb3NvZnQgT3BlbiBUZWNobm9sb2dpZXMsIEluYy4gQWxsIHJpZ2h0cyByZXNlcnZlZC4gU2VlIExpY2Vuc2UubWQgaW4gdGhlIHByb2plY3Qgcm9vdCBmb3IgbGljZW5zZSBpbmZvcm1hdGlvbi5cclxuXHJcbi8qZ2xvYmFsIHdpbmRvdzpmYWxzZSAqL1xyXG4vLy8gPHJlZmVyZW5jZSBwYXRoPVwianF1ZXJ5LnNpZ25hbFIuY29yZS5qc1wiIC8+XHJcblxyXG4oZnVuY3Rpb24gKCQsIHdpbmRvdykge1xyXG4gICAgXCJ1c2Ugc3RyaWN0XCI7XHJcblxyXG4gICAgLy8gd2UgdXNlIGEgZ2xvYmFsIGlkIGZvciB0cmFja2luZyBjYWxsYmFja3Mgc28gdGhlIHNlcnZlciBkb2Vzbid0IGhhdmUgdG8gc2VuZCBleHRyYSBpbmZvIGxpa2UgaHViIG5hbWVcclxuICAgIHZhciBjYWxsYmFja0lkID0gMCxcclxuICAgICAgICBjYWxsYmFja3MgPSB7fSxcclxuICAgICAgICBldmVudE5hbWVzcGFjZSA9IFwiLmh1YlByb3h5XCI7XHJcblxyXG4gICAgZnVuY3Rpb24gbWFrZUV2ZW50TmFtZShldmVudCkge1xyXG4gICAgICAgIHJldHVybiBldmVudCArIGV2ZW50TmFtZXNwYWNlO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIEVxdWl2YWxlbnQgdG8gQXJyYXkucHJvdG90eXBlLm1hcFxyXG4gICAgZnVuY3Rpb24gbWFwKGFyciwgZnVuLCB0aGlzcCkge1xyXG4gICAgICAgIHZhciBpLFxyXG4gICAgICAgICAgICBsZW5ndGggPSBhcnIubGVuZ3RoLFxyXG4gICAgICAgICAgICByZXN1bHQgPSBbXTtcclxuICAgICAgICBmb3IgKGkgPSAwOyBpIDwgbGVuZ3RoOyBpICs9IDEpIHtcclxuICAgICAgICAgICAgaWYgKGFyci5oYXNPd25Qcm9wZXJ0eShpKSkge1xyXG4gICAgICAgICAgICAgICAgcmVzdWx0W2ldID0gZnVuLmNhbGwodGhpc3AsIGFycltpXSwgaSwgYXJyKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gcmVzdWx0O1xyXG4gICAgfVxyXG5cclxuICAgIGZ1bmN0aW9uIGdldEFyZ1ZhbHVlKGEpIHtcclxuICAgICAgICByZXR1cm4gJC5pc0Z1bmN0aW9uKGEpID8gbnVsbCA6ICgkLnR5cGUoYSkgPT09IFwidW5kZWZpbmVkXCIgPyBudWxsIDogYSk7XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gaGFzTWVtYmVycyhvYmopIHtcclxuICAgICAgICBmb3IgKHZhciBrZXkgaW4gb2JqKSB7XHJcbiAgICAgICAgICAgIC8vIElmIHdlIGhhdmUgYW55IHByb3BlcnRpZXMgaW4gb3VyIGNhbGxiYWNrIG1hcCB0aGVuIHdlIGhhdmUgY2FsbGJhY2tzIGFuZCBjYW4gZXhpdCB0aGUgbG9vcCB2aWEgcmV0dXJuXHJcbiAgICAgICAgICAgIGlmIChvYmouaGFzT3duUHJvcGVydHkoa2V5KSkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBodWJQcm94eVxyXG4gICAgZnVuY3Rpb24gaHViUHJveHkoaHViQ29ubmVjdGlvbiwgaHViTmFtZSkge1xyXG4gICAgICAgIC8vLyA8c3VtbWFyeT5cclxuICAgICAgICAvLy8gICAgIENyZWF0ZXMgYSBuZXcgcHJveHkgb2JqZWN0IGZvciB0aGUgZ2l2ZW4gaHViIGNvbm5lY3Rpb24gdGhhdCBjYW4gYmUgdXNlZCB0byBpbnZva2VcclxuICAgICAgICAvLy8gICAgIG1ldGhvZHMgb24gc2VydmVyIGh1YnMgYW5kIGhhbmRsZSBjbGllbnQgbWV0aG9kIGludm9jYXRpb24gcmVxdWVzdHMgZnJvbSB0aGUgc2VydmVyLlxyXG4gICAgICAgIC8vLyA8L3N1bW1hcnk+XHJcbiAgICAgICAgcmV0dXJuIG5ldyBodWJQcm94eS5mbi5pbml0KGh1YkNvbm5lY3Rpb24sIGh1Yk5hbWUpO1xyXG4gICAgfVxyXG5cclxuICAgIGh1YlByb3h5LmZuID0gaHViUHJveHkucHJvdG90eXBlID0ge1xyXG4gICAgICAgIGluaXQ6IGZ1bmN0aW9uIChjb25uZWN0aW9uLCBodWJOYW1lKSB7XHJcbiAgICAgICAgICAgIHRoaXMuc3RhdGUgPSB7fTtcclxuICAgICAgICAgICAgdGhpcy5jb25uZWN0aW9uID0gY29ubmVjdGlvbjtcclxuICAgICAgICAgICAgdGhpcy5odWJOYW1lID0gaHViTmFtZTtcclxuICAgICAgICAgICAgdGhpcy5fID0ge1xyXG4gICAgICAgICAgICAgICAgY2FsbGJhY2tNYXA6IHt9XHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgaGFzU3Vic2NyaXB0aW9uczogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICByZXR1cm4gaGFzTWVtYmVycyh0aGlzLl8uY2FsbGJhY2tNYXApO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIG9uOiBmdW5jdGlvbiAoZXZlbnROYW1lLCBjYWxsYmFjaykge1xyXG4gICAgICAgICAgICAvLy8gPHN1bW1hcnk+V2lyZXMgdXAgYSBjYWxsYmFjayB0byBiZSBpbnZva2VkIHdoZW4gYSBpbnZvY2F0aW9uIHJlcXVlc3QgaXMgcmVjZWl2ZWQgZnJvbSB0aGUgc2VydmVyIGh1Yi48L3N1bW1hcnk+XHJcbiAgICAgICAgICAgIC8vLyA8cGFyYW0gbmFtZT1cImV2ZW50TmFtZVwiIHR5cGU9XCJTdHJpbmdcIj5UaGUgbmFtZSBvZiB0aGUgaHViIGV2ZW50IHRvIHJlZ2lzdGVyIHRoZSBjYWxsYmFjayBmb3IuPC9wYXJhbT5cclxuICAgICAgICAgICAgLy8vIDxwYXJhbSBuYW1lPVwiY2FsbGJhY2tcIiB0eXBlPVwiRnVuY3Rpb25cIj5UaGUgY2FsbGJhY2sgdG8gYmUgaW52b2tlZC48L3BhcmFtPlxyXG4gICAgICAgICAgICB2YXIgdGhhdCA9IHRoaXMsXHJcbiAgICAgICAgICAgICAgICBjYWxsYmFja01hcCA9IHRoYXQuXy5jYWxsYmFja01hcDtcclxuXHJcbiAgICAgICAgICAgIC8vIE5vcm1hbGl6ZSB0aGUgZXZlbnQgbmFtZSB0byBsb3dlcmNhc2VcclxuICAgICAgICAgICAgZXZlbnROYW1lID0gZXZlbnROYW1lLnRvTG93ZXJDYXNlKCk7XHJcblxyXG4gICAgICAgICAgICAvLyBJZiB0aGVyZSBpcyBub3QgYW4gZXZlbnQgcmVnaXN0ZXJlZCBmb3IgdGhpcyBjYWxsYmFjayB5ZXQgd2Ugd2FudCB0byBjcmVhdGUgaXRzIGV2ZW50IHNwYWNlIGluIHRoZSBjYWxsYmFjayBtYXAuXHJcbiAgICAgICAgICAgIGlmICghY2FsbGJhY2tNYXBbZXZlbnROYW1lXSkge1xyXG4gICAgICAgICAgICAgICAgY2FsbGJhY2tNYXBbZXZlbnROYW1lXSA9IHt9O1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAvLyBNYXAgdGhlIGNhbGxiYWNrIHRvIG91ciBlbmNvbXBhc3NlZCBmdW5jdGlvblxyXG4gICAgICAgICAgICBjYWxsYmFja01hcFtldmVudE5hbWVdW2NhbGxiYWNrXSA9IGZ1bmN0aW9uIChlLCBkYXRhKSB7XHJcbiAgICAgICAgICAgICAgICBjYWxsYmFjay5hcHBseSh0aGF0LCBkYXRhKTtcclxuICAgICAgICAgICAgfTtcclxuXHJcbiAgICAgICAgICAgICQodGhhdCkuYmluZChtYWtlRXZlbnROYW1lKGV2ZW50TmFtZSksIGNhbGxiYWNrTWFwW2V2ZW50TmFtZV1bY2FsbGJhY2tdKTtcclxuXHJcbiAgICAgICAgICAgIHJldHVybiB0aGF0O1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIG9mZjogZnVuY3Rpb24gKGV2ZW50TmFtZSwgY2FsbGJhY2spIHtcclxuICAgICAgICAgICAgLy8vIDxzdW1tYXJ5PlJlbW92ZXMgdGhlIGNhbGxiYWNrIGludm9jYXRpb24gcmVxdWVzdCBmcm9tIHRoZSBzZXJ2ZXIgaHViIGZvciB0aGUgZ2l2ZW4gZXZlbnQgbmFtZS48L3N1bW1hcnk+XHJcbiAgICAgICAgICAgIC8vLyA8cGFyYW0gbmFtZT1cImV2ZW50TmFtZVwiIHR5cGU9XCJTdHJpbmdcIj5UaGUgbmFtZSBvZiB0aGUgaHViIGV2ZW50IHRvIHVucmVnaXN0ZXIgdGhlIGNhbGxiYWNrIGZvci48L3BhcmFtPlxyXG4gICAgICAgICAgICAvLy8gPHBhcmFtIG5hbWU9XCJjYWxsYmFja1wiIHR5cGU9XCJGdW5jdGlvblwiPlRoZSBjYWxsYmFjayB0byBiZSBpbnZva2VkLjwvcGFyYW0+XHJcbiAgICAgICAgICAgIHZhciB0aGF0ID0gdGhpcyxcclxuICAgICAgICAgICAgICAgIGNhbGxiYWNrTWFwID0gdGhhdC5fLmNhbGxiYWNrTWFwLFxyXG4gICAgICAgICAgICAgICAgY2FsbGJhY2tTcGFjZTtcclxuXHJcbiAgICAgICAgICAgIC8vIE5vcm1hbGl6ZSB0aGUgZXZlbnQgbmFtZSB0byBsb3dlcmNhc2VcclxuICAgICAgICAgICAgZXZlbnROYW1lID0gZXZlbnROYW1lLnRvTG93ZXJDYXNlKCk7XHJcblxyXG4gICAgICAgICAgICBjYWxsYmFja1NwYWNlID0gY2FsbGJhY2tNYXBbZXZlbnROYW1lXTtcclxuXHJcbiAgICAgICAgICAgIC8vIFZlcmlmeSB0aGF0IHRoZXJlIGlzIGFuIGV2ZW50IHNwYWNlIHRvIHVuYmluZFxyXG4gICAgICAgICAgICBpZiAoY2FsbGJhY2tTcGFjZSkge1xyXG4gICAgICAgICAgICAgICAgLy8gT25seSB1bmJpbmQgaWYgdGhlcmUncyBhbiBldmVudCBib3VuZCB3aXRoIGV2ZW50TmFtZSBhbmQgYSBjYWxsYmFjayB3aXRoIHRoZSBzcGVjaWZpZWQgY2FsbGJhY2tcclxuICAgICAgICAgICAgICAgIGlmIChjYWxsYmFja1NwYWNlW2NhbGxiYWNrXSkge1xyXG4gICAgICAgICAgICAgICAgICAgICQodGhhdCkudW5iaW5kKG1ha2VFdmVudE5hbWUoZXZlbnROYW1lKSwgY2FsbGJhY2tTcGFjZVtjYWxsYmFja10pO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAvLyBSZW1vdmUgdGhlIGNhbGxiYWNrIGZyb20gdGhlIGNhbGxiYWNrIG1hcFxyXG4gICAgICAgICAgICAgICAgICAgIGRlbGV0ZSBjYWxsYmFja1NwYWNlW2NhbGxiYWNrXTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgLy8gQ2hlY2sgaWYgdGhlcmUgYXJlIGFueSBtZW1iZXJzIGxlZnQgb24gdGhlIGV2ZW50LCBpZiBub3Qgd2UgbmVlZCB0byBkZXN0cm95IGl0LlxyXG4gICAgICAgICAgICAgICAgICAgIGlmICghaGFzTWVtYmVycyhjYWxsYmFja1NwYWNlKSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBkZWxldGUgY2FsbGJhY2tNYXBbZXZlbnROYW1lXTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBlbHNlIGlmICghY2FsbGJhY2spIHsgLy8gQ2hlY2sgaWYgd2UncmUgcmVtb3ZpbmcgdGhlIHdob2xlIGV2ZW50IGFuZCB3ZSBkaWRuJ3QgZXJyb3IgYmVjYXVzZSBvZiBhbiBpbnZhbGlkIGNhbGxiYWNrXHJcbiAgICAgICAgICAgICAgICAgICAgJCh0aGF0KS51bmJpbmQobWFrZUV2ZW50TmFtZShldmVudE5hbWUpKTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgZGVsZXRlIGNhbGxiYWNrTWFwW2V2ZW50TmFtZV07XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHJldHVybiB0aGF0O1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIGludm9rZTogZnVuY3Rpb24gKG1ldGhvZE5hbWUpIHtcclxuICAgICAgICAgICAgLy8vIDxzdW1tYXJ5Pkludm9rZXMgYSBzZXJ2ZXIgaHViIG1ldGhvZCB3aXRoIHRoZSBnaXZlbiBhcmd1bWVudHMuPC9zdW1tYXJ5PlxyXG4gICAgICAgICAgICAvLy8gPHBhcmFtIG5hbWU9XCJtZXRob2ROYW1lXCIgdHlwZT1cIlN0cmluZ1wiPlRoZSBuYW1lIG9mIHRoZSBzZXJ2ZXIgaHViIG1ldGhvZC48L3BhcmFtPlxyXG5cclxuICAgICAgICAgICAgdmFyIHRoYXQgPSB0aGlzLFxyXG4gICAgICAgICAgICAgICAgYXJncyA9ICQubWFrZUFycmF5KGFyZ3VtZW50cykuc2xpY2UoMSksXHJcbiAgICAgICAgICAgICAgICBhcmdWYWx1ZXMgPSBtYXAoYXJncywgZ2V0QXJnVmFsdWUpLFxyXG4gICAgICAgICAgICAgICAgZGF0YSA9IHsgSDogdGhhdC5odWJOYW1lLCBNOiBtZXRob2ROYW1lLCBBOiBhcmdWYWx1ZXMsIEk6IGNhbGxiYWNrSWQgfSxcclxuICAgICAgICAgICAgICAgIGQgPSAkLkRlZmVycmVkKCksXHJcbiAgICAgICAgICAgICAgICBjYWxsYmFjayA9IGZ1bmN0aW9uIChtaW5SZXN1bHQpIHtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgcmVzdWx0ID0gdGhhdC5fbWF4aW1pemVIdWJSZXNwb25zZShtaW5SZXN1bHQpO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAvLyBVcGRhdGUgdGhlIGh1YiBzdGF0ZVxyXG4gICAgICAgICAgICAgICAgICAgICQuZXh0ZW5kKHRoYXQuc3RhdGUsIHJlc3VsdC5TdGF0ZSk7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGlmIChyZXN1bHQuRXJyb3IpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gU2VydmVyIGh1YiBtZXRob2QgdGhyZXcgYW4gZXhjZXB0aW9uLCBsb2cgaXQgJiByZWplY3QgdGhlIGRlZmVycmVkXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChyZXN1bHQuU3RhY2tUcmFjZSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhhdC5jb25uZWN0aW9uLmxvZyhyZXN1bHQuRXJyb3IgKyBcIlxcblwiICsgcmVzdWx0LlN0YWNrVHJhY2UpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGQucmVqZWN0V2l0aCh0aGF0LCBbcmVzdWx0LkVycm9yXSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gU2VydmVyIGludm9jYXRpb24gc3VjY2VlZGVkLCByZXNvbHZlIHRoZSBkZWZlcnJlZFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBkLnJlc29sdmVXaXRoKHRoYXQsIFtyZXN1bHQuUmVzdWx0XSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfTtcclxuXHJcbiAgICAgICAgICAgIGNhbGxiYWNrc1tjYWxsYmFja0lkLnRvU3RyaW5nKCldID0geyBzY29wZTogdGhhdCwgbWV0aG9kOiBjYWxsYmFjayB9O1xyXG4gICAgICAgICAgICBjYWxsYmFja0lkICs9IDE7XHJcblxyXG4gICAgICAgICAgICBpZiAoISQuaXNFbXB0eU9iamVjdCh0aGF0LnN0YXRlKSkge1xyXG4gICAgICAgICAgICAgICAgZGF0YS5TID0gdGhhdC5zdGF0ZTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgdGhhdC5jb25uZWN0aW9uLnNlbmQodGhhdC5jb25uZWN0aW9uLmpzb24uc3RyaW5naWZ5KGRhdGEpKTtcclxuXHJcbiAgICAgICAgICAgIHJldHVybiBkLnByb21pc2UoKTtcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICBfbWF4aW1pemVIdWJSZXNwb25zZTogZnVuY3Rpb24gKG1pbkh1YlJlc3BvbnNlKSB7XHJcbiAgICAgICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICAgICAgICBTdGF0ZTogbWluSHViUmVzcG9uc2UuUyxcclxuICAgICAgICAgICAgICAgIFJlc3VsdDogbWluSHViUmVzcG9uc2UuUixcclxuICAgICAgICAgICAgICAgIElkOiBtaW5IdWJSZXNwb25zZS5JLFxyXG4gICAgICAgICAgICAgICAgRXJyb3I6IG1pbkh1YlJlc3BvbnNlLkUsXHJcbiAgICAgICAgICAgICAgICBTdGFja1RyYWNlOiBtaW5IdWJSZXNwb25zZS5UXHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgfVxyXG4gICAgfTtcclxuXHJcbiAgICBodWJQcm94eS5mbi5pbml0LnByb3RvdHlwZSA9IGh1YlByb3h5LmZuO1xyXG5cclxuICAgIC8vIGh1YkNvbm5lY3Rpb25cclxuICAgIGZ1bmN0aW9uIGh1YkNvbm5lY3Rpb24odXJsLCBvcHRpb25zKSB7XHJcbiAgICAgICAgLy8vIDxzdW1tYXJ5PkNyZWF0ZXMgYSBuZXcgaHViIGNvbm5lY3Rpb24uPC9zdW1tYXJ5PlxyXG4gICAgICAgIC8vLyA8cGFyYW0gbmFtZT1cInVybFwiIHR5cGU9XCJTdHJpbmdcIj5bT3B0aW9uYWxdIFRoZSBodWIgcm91dGUgdXJsLCBkZWZhdWx0cyB0byBcIi9zaWduYWxyXCIuPC9wYXJhbT5cclxuICAgICAgICAvLy8gPHBhcmFtIG5hbWU9XCJvcHRpb25zXCIgdHlwZT1cIk9iamVjdFwiPltPcHRpb25hbF0gU2V0dGluZ3MgdG8gdXNlIHdoZW4gY3JlYXRpbmcgdGhlIGh1YkNvbm5lY3Rpb24uPC9wYXJhbT5cclxuICAgICAgICB2YXIgc2V0dGluZ3MgPSB7XHJcbiAgICAgICAgICAgIHFzOiBudWxsLFxyXG4gICAgICAgICAgICBsb2dnaW5nOiBmYWxzZSxcclxuICAgICAgICAgICAgdXNlRGVmYXVsdFBhdGg6IHRydWVcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICAkLmV4dGVuZChzZXR0aW5ncywgb3B0aW9ucyk7XHJcblxyXG4gICAgICAgIGlmICghdXJsIHx8IHNldHRpbmdzLnVzZURlZmF1bHRQYXRoKSB7XHJcbiAgICAgICAgICAgIHVybCA9ICh1cmwgfHwgXCJcIikgKyBcIi9zaWduYWxyXCI7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBuZXcgaHViQ29ubmVjdGlvbi5mbi5pbml0KHVybCwgc2V0dGluZ3MpO1xyXG4gICAgfVxyXG5cclxuICAgIGh1YkNvbm5lY3Rpb24uZm4gPSBodWJDb25uZWN0aW9uLnByb3RvdHlwZSA9ICQuY29ubmVjdGlvbigpO1xyXG5cclxuICAgIGh1YkNvbm5lY3Rpb24uZm4uaW5pdCA9IGZ1bmN0aW9uICh1cmwsIG9wdGlvbnMpIHtcclxuICAgICAgICB2YXIgc2V0dGluZ3MgPSB7XHJcbiAgICAgICAgICAgIHFzOiBudWxsLFxyXG4gICAgICAgICAgICBsb2dnaW5nOiBmYWxzZSxcclxuICAgICAgICAgICAgdXNlRGVmYXVsdFBhdGg6IHRydWVcclxuICAgICAgICB9LFxyXG4gICAgICAgICAgICBjb25uZWN0aW9uID0gdGhpcztcclxuXHJcbiAgICAgICAgJC5leHRlbmQoc2V0dGluZ3MsIG9wdGlvbnMpO1xyXG5cclxuICAgICAgICAvLyBDYWxsIHRoZSBiYXNlIGNvbnN0cnVjdG9yXHJcbiAgICAgICAgJC5zaWduYWxSLmZuLmluaXQuY2FsbChjb25uZWN0aW9uLCB1cmwsIHNldHRpbmdzLnFzLCBzZXR0aW5ncy5sb2dnaW5nKTtcclxuXHJcbiAgICAgICAgLy8gT2JqZWN0IHRvIHN0b3JlIGh1YiBwcm94aWVzIGZvciB0aGlzIGNvbm5lY3Rpb25cclxuICAgICAgICBjb25uZWN0aW9uLnByb3hpZXMgPSB7fTtcclxuXHJcbiAgICAgICAgLy8gV2lyZSB1cCB0aGUgcmVjZWl2ZWQgaGFuZGxlclxyXG4gICAgICAgIGNvbm5lY3Rpb24ucmVjZWl2ZWQoZnVuY3Rpb24gKG1pbkRhdGEpIHtcclxuICAgICAgICAgICAgdmFyIGRhdGEsIHByb3h5LCBkYXRhQ2FsbGJhY2tJZCwgY2FsbGJhY2ssIGh1Yk5hbWUsIGV2ZW50TmFtZTtcclxuICAgICAgICAgICAgaWYgKCFtaW5EYXRhKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGlmICh0eXBlb2YgKG1pbkRhdGEuSSkgIT09IFwidW5kZWZpbmVkXCIpIHtcclxuICAgICAgICAgICAgICAgIC8vIFdlIHJlY2VpdmVkIHRoZSByZXR1cm4gdmFsdWUgZnJvbSBhIHNlcnZlciBtZXRob2QgaW52b2NhdGlvbiwgbG9vayB1cCBjYWxsYmFjayBieSBpZCBhbmQgY2FsbCBpdFxyXG4gICAgICAgICAgICAgICAgZGF0YUNhbGxiYWNrSWQgPSBtaW5EYXRhLkkudG9TdHJpbmcoKTtcclxuICAgICAgICAgICAgICAgIGNhbGxiYWNrID0gY2FsbGJhY2tzW2RhdGFDYWxsYmFja0lkXTtcclxuICAgICAgICAgICAgICAgIGlmIChjYWxsYmFjaykge1xyXG4gICAgICAgICAgICAgICAgICAgIC8vIERlbGV0ZSB0aGUgY2FsbGJhY2sgZnJvbSB0aGUgcHJveHlcclxuICAgICAgICAgICAgICAgICAgICBjYWxsYmFja3NbZGF0YUNhbGxiYWNrSWRdID0gbnVsbDtcclxuICAgICAgICAgICAgICAgICAgICBkZWxldGUgY2FsbGJhY2tzW2RhdGFDYWxsYmFja0lkXTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgLy8gSW52b2tlIHRoZSBjYWxsYmFja1xyXG4gICAgICAgICAgICAgICAgICAgIGNhbGxiYWNrLm1ldGhvZC5jYWxsKGNhbGxiYWNrLnNjb3BlLCBtaW5EYXRhKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIGRhdGEgPSB0aGlzLl9tYXhpbWl6ZUNsaWVudEh1Ykludm9jYXRpb24obWluRGF0YSk7XHJcblxyXG4gICAgICAgICAgICAgICAgLy8gV2UgcmVjZWl2ZWQgYSBjbGllbnQgaW52b2NhdGlvbiByZXF1ZXN0LCBpLmUuIGJyb2FkY2FzdCBmcm9tIHNlcnZlciBodWJcclxuICAgICAgICAgICAgICAgIGNvbm5lY3Rpb24ubG9nKFwiVHJpZ2dlcmluZyBjbGllbnQgaHViIGV2ZW50ICdcIiArIGRhdGEuTWV0aG9kICsgXCInIG9uIGh1YiAnXCIgKyBkYXRhLkh1YiArIFwiJy5cIik7XHJcblxyXG4gICAgICAgICAgICAgICAgLy8gTm9ybWFsaXplIHRoZSBuYW1lcyB0byBsb3dlcmNhc2VcclxuICAgICAgICAgICAgICAgIGh1Yk5hbWUgPSBkYXRhLkh1Yi50b0xvd2VyQ2FzZSgpO1xyXG4gICAgICAgICAgICAgICAgZXZlbnROYW1lID0gZGF0YS5NZXRob2QudG9Mb3dlckNhc2UoKTtcclxuXHJcbiAgICAgICAgICAgICAgICAvLyBUcmlnZ2VyIHRoZSBsb2NhbCBpbnZvY2F0aW9uIGV2ZW50XHJcbiAgICAgICAgICAgICAgICBwcm94eSA9IHRoaXMucHJveGllc1todWJOYW1lXTtcclxuXHJcbiAgICAgICAgICAgICAgICAvLyBVcGRhdGUgdGhlIGh1YiBzdGF0ZVxyXG4gICAgICAgICAgICAgICAgJC5leHRlbmQocHJveHkuc3RhdGUsIGRhdGEuU3RhdGUpO1xyXG4gICAgICAgICAgICAgICAgJChwcm94eSkudHJpZ2dlckhhbmRsZXIobWFrZUV2ZW50TmFtZShldmVudE5hbWUpLCBbZGF0YS5BcmdzXSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuICAgIH07XHJcblxyXG4gICAgaHViQ29ubmVjdGlvbi5mbi5fbWF4aW1pemVDbGllbnRIdWJJbnZvY2F0aW9uID0gZnVuY3Rpb24gKG1pbkNsaWVudEh1Ykludm9jYXRpb24pIHtcclxuICAgICAgICByZXR1cm4ge1xyXG4gICAgICAgICAgICBIdWI6IG1pbkNsaWVudEh1Ykludm9jYXRpb24uSCxcclxuICAgICAgICAgICAgTWV0aG9kOiBtaW5DbGllbnRIdWJJbnZvY2F0aW9uLk0sXHJcbiAgICAgICAgICAgIEFyZ3M6IG1pbkNsaWVudEh1Ykludm9jYXRpb24uQSxcclxuICAgICAgICAgICAgU3RhdGU6IG1pbkNsaWVudEh1Ykludm9jYXRpb24uU1xyXG4gICAgICAgIH07XHJcbiAgICB9O1xyXG5cclxuICAgIGh1YkNvbm5lY3Rpb24uZm4uX3JlZ2lzdGVyU3Vic2NyaWJlZEh1YnMgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgLy8vIDxzdW1tYXJ5PlxyXG4gICAgICAgIC8vLyAgICAgU2V0cyB0aGUgc3RhcnRpbmcgZXZlbnQgdG8gbG9vcCB0aHJvdWdoIHRoZSBrbm93biBodWJzIGFuZCByZWdpc3RlciBhbnkgbmV3IGh1YnMgXHJcbiAgICAgICAgLy8vICAgICB0aGF0IGhhdmUgYmVlbiBhZGRlZCB0byB0aGUgcHJveHkuXHJcbiAgICAgICAgLy8vIDwvc3VtbWFyeT5cclxuICAgICAgICB2YXIgY29ubmVjdGlvbiA9IHRoaXM7XHJcblxyXG4gICAgICAgIGlmICghY29ubmVjdGlvbi5fc3Vic2NyaWJlZFRvSHVicykge1xyXG4gICAgICAgICAgICBjb25uZWN0aW9uLl9zdWJzY3JpYmVkVG9IdWJzID0gdHJ1ZTtcclxuICAgICAgICAgICAgY29ubmVjdGlvbi5zdGFydGluZyhmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICAvLyBTZXQgdGhlIGNvbm5lY3Rpb24ncyBkYXRhIG9iamVjdCB3aXRoIGFsbCB0aGUgaHViIHByb3hpZXMgd2l0aCBhY3RpdmUgc3Vic2NyaXB0aW9ucy5cclxuICAgICAgICAgICAgICAgIC8vIFRoZXNlIHByb3hpZXMgd2lsbCByZWNlaXZlIG5vdGlmaWNhdGlvbnMgZnJvbSB0aGUgc2VydmVyLlxyXG4gICAgICAgICAgICAgICAgdmFyIHN1YnNjcmliZWRIdWJzID0gW107XHJcblxyXG4gICAgICAgICAgICAgICAgJC5lYWNoKGNvbm5lY3Rpb24ucHJveGllcywgZnVuY3Rpb24gKGtleSkge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLmhhc1N1YnNjcmlwdGlvbnMoKSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBzdWJzY3JpYmVkSHVicy5wdXNoKHsgbmFtZToga2V5IH0pO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgICAgICAgIGNvbm5lY3Rpb24uZGF0YSA9IGNvbm5lY3Rpb24uanNvbi5zdHJpbmdpZnkoc3Vic2NyaWJlZEh1YnMpO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9XHJcbiAgICB9O1xyXG5cclxuICAgIGh1YkNvbm5lY3Rpb24uZm4uY3JlYXRlSHViUHJveHkgPSBmdW5jdGlvbiAoaHViTmFtZSkge1xyXG4gICAgICAgIC8vLyA8c3VtbWFyeT5cclxuICAgICAgICAvLy8gICAgIENyZWF0ZXMgYSBuZXcgcHJveHkgb2JqZWN0IGZvciB0aGUgZ2l2ZW4gaHViIGNvbm5lY3Rpb24gdGhhdCBjYW4gYmUgdXNlZCB0byBpbnZva2VcclxuICAgICAgICAvLy8gICAgIG1ldGhvZHMgb24gc2VydmVyIGh1YnMgYW5kIGhhbmRsZSBjbGllbnQgbWV0aG9kIGludm9jYXRpb24gcmVxdWVzdHMgZnJvbSB0aGUgc2VydmVyLlxyXG4gICAgICAgIC8vLyA8L3N1bW1hcnk+XHJcbiAgICAgICAgLy8vIDxwYXJhbSBuYW1lPVwiaHViTmFtZVwiIHR5cGU9XCJTdHJpbmdcIj5cclxuICAgICAgICAvLy8gICAgIFRoZSBuYW1lIG9mIHRoZSBodWIgb24gdGhlIHNlcnZlciB0byBjcmVhdGUgdGhlIHByb3h5IGZvci5cclxuICAgICAgICAvLy8gPC9wYXJhbT5cclxuXHJcbiAgICAgICAgLy8gTm9ybWFsaXplIHRoZSBuYW1lIHRvIGxvd2VyY2FzZVxyXG4gICAgICAgIGh1Yk5hbWUgPSBodWJOYW1lLnRvTG93ZXJDYXNlKCk7XHJcblxyXG4gICAgICAgIHZhciBwcm94eSA9IHRoaXMucHJveGllc1todWJOYW1lXTtcclxuICAgICAgICBpZiAoIXByb3h5KSB7XHJcbiAgICAgICAgICAgIHByb3h5ID0gaHViUHJveHkodGhpcywgaHViTmFtZSk7XHJcbiAgICAgICAgICAgIHRoaXMucHJveGllc1todWJOYW1lXSA9IHByb3h5O1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdGhpcy5fcmVnaXN0ZXJTdWJzY3JpYmVkSHVicygpO1xyXG5cclxuICAgICAgICByZXR1cm4gcHJveHk7XHJcbiAgICB9O1xyXG5cclxuICAgIGh1YkNvbm5lY3Rpb24uZm4uaW5pdC5wcm90b3R5cGUgPSBodWJDb25uZWN0aW9uLmZuO1xyXG5cclxuICAgICQuaHViQ29ubmVjdGlvbiA9IGh1YkNvbm5lY3Rpb247XHJcblxyXG59KHdpbmRvdy5qUXVlcnksIHdpbmRvdykpO1xyXG4vKiBqcXVlcnkuc2lnbmFsUi52ZXJzaW9uLmpzICovXHJcbi8vIENvcHlyaWdodCAoYykgTWljcm9zb2Z0IE9wZW4gVGVjaG5vbG9naWVzLCBJbmMuIEFsbCByaWdodHMgcmVzZXJ2ZWQuIFNlZSBMaWNlbnNlLm1kIGluIHRoZSBwcm9qZWN0IHJvb3QgZm9yIGxpY2Vuc2UgaW5mb3JtYXRpb24uXHJcblxyXG4vKmdsb2JhbCB3aW5kb3c6ZmFsc2UgKi9cclxuLy8vIDxyZWZlcmVuY2UgcGF0aD1cImpxdWVyeS5zaWduYWxSLmNvcmUuanNcIiAvPlxyXG4oZnVuY3Rpb24gKCQpIHtcclxuICAgICQuc2lnbmFsUi52ZXJzaW9uID0gXCIyLjAuMC1iZXRhMlwiO1xyXG59KHdpbmRvdy5qUXVlcnkpKTtcclxuIiwiLy8gR2VuZXJhdGVkIGJ5IENvZmZlZVNjcmlwdCAxLjYuMlxuKGZ1bmN0aW9uKCkge1xuICB2YXIgX19pbmRleE9mID0gW10uaW5kZXhPZiB8fCBmdW5jdGlvbihpdGVtKSB7IGZvciAodmFyIGkgPSAwLCBsID0gdGhpcy5sZW5ndGg7IGkgPCBsOyBpKyspIHsgaWYgKGkgaW4gdGhpcyAmJiB0aGlzW2ldID09PSBpdGVtKSByZXR1cm4gaTsgfSByZXR1cm4gLTE7IH0sXG4gICAgX19oYXNQcm9wID0ge30uaGFzT3duUHJvcGVydHksXG4gICAgX19leHRlbmRzID0gZnVuY3Rpb24oY2hpbGQsIHBhcmVudCkgeyBmb3IgKHZhciBrZXkgaW4gcGFyZW50KSB7IGlmIChfX2hhc1Byb3AuY2FsbChwYXJlbnQsIGtleSkpIGNoaWxkW2tleV0gPSBwYXJlbnRba2V5XTsgfSBmdW5jdGlvbiBjdG9yKCkgeyB0aGlzLmNvbnN0cnVjdG9yID0gY2hpbGQ7IH0gY3Rvci5wcm90b3R5cGUgPSBwYXJlbnQucHJvdG90eXBlOyBjaGlsZC5wcm90b3R5cGUgPSBuZXcgY3RvcigpOyBjaGlsZC5fX3N1cGVyX18gPSBwYXJlbnQucHJvdG90eXBlOyByZXR1cm4gY2hpbGQ7IH07XG5cbiAgKGZ1bmN0aW9uKHJvb3QsIGZhY3RvcnkpIHtcbiAgICBpZiAodHlwZW9mIGV4cG9ydHMgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICByZXR1cm4gZmFjdG9yeShyb290LCBleHBvcnRzKTtcbiAgICB9IGVsc2UgaWYgKHR5cGVvZiBkZWZpbmUgPT09ICdmdW5jdGlvbicgJiYgZGVmaW5lLmFtZCkge1xuICAgICAgcmV0dXJuIGRlZmluZShbJ2V4cG9ydHMnXSwgZnVuY3Rpb24oZXhwb3J0cykge1xuICAgICAgICByZXR1cm4gcm9vdC5qc29ucGF0Y2ggPSBmYWN0b3J5KHJvb3QsIGV4cG9ydHMpO1xuICAgICAgfSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiByb290Lmpzb25wYXRjaCA9IGZhY3Rvcnkocm9vdCwge30pO1xuICAgIH1cbiAgfSkodGhpcywgZnVuY3Rpb24ocm9vdCkge1xuICAgIHZhciBBZGRQYXRjaCwgQ29weVBhdGNoLCBJbnZhbGlkUGF0Y2hFcnJvciwgSW52YWxpZFBvaW50ZXJFcnJvciwgSlNPTlBhdGNoLCBKU09OUGF0Y2hFcnJvciwgSlNPTlBvaW50ZXIsIE1vdmVQYXRjaCwgUGF0Y2hDb25mbGljdEVycm9yLCBSZW1vdmVQYXRjaCwgUmVwbGFjZVBhdGNoLCBUZXN0UGF0Y2gsIGFwcGx5LCBjb21waWxlLCBoYXNPd25Qcm9wZXJ0eSwgaXNBcnJheSwgaXNFcXVhbCwgaXNPYmplY3QsIGlzU3RyaW5nLCBvcGVyYXRpb25NYXAsIHRvU3RyaW5nLCBfaXNFcXVhbCwgX3JlZiwgX3JlZjEsIF9yZWYyLCBfcmVmMywgX3JlZjQsIF9yZWY1O1xuXG4gICAgdG9TdHJpbmcgPSBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nO1xuICAgIGhhc093blByb3BlcnR5ID0gT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eTtcbiAgICBpc0FycmF5ID0gZnVuY3Rpb24ob2JqKSB7XG4gICAgICByZXR1cm4gdG9TdHJpbmcuY2FsbChvYmopID09PSAnW29iamVjdCBBcnJheV0nO1xuICAgIH07XG4gICAgaXNPYmplY3QgPSBmdW5jdGlvbihvYmopIHtcbiAgICAgIHJldHVybiB0b1N0cmluZy5jYWxsKG9iaikgPT09ICdbb2JqZWN0IE9iamVjdF0nO1xuICAgIH07XG4gICAgaXNTdHJpbmcgPSBmdW5jdGlvbihvYmopIHtcbiAgICAgIHJldHVybiB0b1N0cmluZy5jYWxsKG9iaikgPT09ICdbb2JqZWN0IFN0cmluZ10nO1xuICAgIH07XG4gICAgX2lzRXF1YWwgPSBmdW5jdGlvbihhLCBiLCBzdGFjaykge1xuICAgICAgdmFyIGNsYXNzTmFtZSwga2V5LCBsZW5ndGgsIHJlc3VsdCwgc2l6ZTtcblxuICAgICAgaWYgKGEgPT09IGIpIHtcbiAgICAgICAgcmV0dXJuIGEgIT09IDAgfHwgMSAvIGEgPT09IDEgLyBiO1xuICAgICAgfVxuICAgICAgaWYgKGEgPT09IG51bGwgfHwgYiA9PT0gbnVsbCkge1xuICAgICAgICByZXR1cm4gYSA9PT0gYjtcbiAgICAgIH1cbiAgICAgIGNsYXNzTmFtZSA9IHRvU3RyaW5nLmNhbGwoYSk7XG4gICAgICBpZiAoY2xhc3NOYW1lICE9PSB0b1N0cmluZy5jYWxsKGIpKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIH1cbiAgICAgIHN3aXRjaCAoY2xhc3NOYW1lKSB7XG4gICAgICAgIGNhc2UgJ1tvYmplY3QgU3RyaW5nXSc6XG4gICAgICAgICAgU3RyaW5nKGEpID09PSBTdHJpbmcoYik7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgJ1tvYmplY3QgTnVtYmVyXSc6XG4gICAgICAgICAgYSA9ICthO1xuICAgICAgICAgIGIgPSArYjtcbiAgICAgICAgICBpZiAoYSAhPT0gYSkge1xuICAgICAgICAgICAgYiAhPT0gYjtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgaWYgKGEgPT09IDApIHtcbiAgICAgICAgICAgICAgMSAvIGEgPT09IDEgLyBiO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgYSA9PT0gYjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgJ1tvYmplY3QgQm9vbGVhbl0nOlxuICAgICAgICAgICthID09PSArYjtcbiAgICAgIH1cbiAgICAgIGlmICh0eXBlb2YgYSAhPT0gJ29iamVjdCcgfHwgdHlwZW9mIGIgIT09ICdvYmplY3QnKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIH1cbiAgICAgIGxlbmd0aCA9IHN0YWNrLmxlbmd0aDtcbiAgICAgIHdoaWxlIChsZW5ndGgtLSkge1xuICAgICAgICBpZiAoc3RhY2tbbGVuZ3RoXSA9PT0gYSkge1xuICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBzdGFjay5wdXNoKGEpO1xuICAgICAgc2l6ZSA9IDA7XG4gICAgICByZXN1bHQgPSB0cnVlO1xuICAgICAgaWYgKGNsYXNzTmFtZSA9PT0gJ1tvYmplY3QgQXJyYXldJykge1xuICAgICAgICBzaXplID0gYS5sZW5ndGg7XG4gICAgICAgIHJlc3VsdCA9IHNpemUgPT09IGIubGVuZ3RoO1xuICAgICAgICBpZiAocmVzdWx0KSB7XG4gICAgICAgICAgd2hpbGUgKHNpemUtLSkge1xuICAgICAgICAgICAgaWYgKCEocmVzdWx0ID0gX19pbmRleE9mLmNhbGwoYSwgc2l6ZSkgPj0gMCA9PT0gX19pbmRleE9mLmNhbGwoYiwgc2l6ZSkgPj0gMCAmJiBfaXNFcXVhbChhW3NpemVdLCBiW3NpemVdLCBzdGFjaykpKSB7XG4gICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgaWYgKF9faW5kZXhPZi5jYWxsKGEsIFwiY29uc3RydWN0b3JcIikgPj0gMCAhPT0gX19pbmRleE9mLmNhbGwoYiwgXCJjb25zdHJ1Y3RvclwiKSA+PSAwIHx8IGEuY29uc3RydWN0b3IgIT09IGIuY29uc3RydWN0b3IpIHtcbiAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgICAgZm9yIChrZXkgaW4gYSkge1xuICAgICAgICAgIGlmIChoYXNPd25Qcm9wZXJ0eS5jYWxsKGEsIGtleSkpIHtcbiAgICAgICAgICAgIHNpemUrKztcbiAgICAgICAgICAgIGlmICghKHJlc3VsdCA9IGhhc093blByb3BlcnR5LmNhbGwoYiwga2V5KSAmJiBfaXNFcXVhbChhW2tleV0sIGJba2V5XSwgc3RhY2spKSkge1xuICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHJlc3VsdCkge1xuICAgICAgICAgIGZvciAoa2V5IGluIGIpIHtcbiAgICAgICAgICAgIGlmIChoYXNPd25Qcm9wZXJ0eS5jYWxsKGIsIGtleSkgJiYgIXNpemUtLSkge1xuICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgICAgcmVzdWx0ID0gIXNpemU7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHN0YWNrLnBvcCgpO1xuICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9O1xuICAgIGlzRXF1YWwgPSBmdW5jdGlvbihhLCBiKSB7XG4gICAgICByZXR1cm4gX2lzRXF1YWwoYSwgYiwgW10pO1xuICAgIH07XG4gICAgSlNPTlBhdGNoRXJyb3IgPSAoZnVuY3Rpb24oX3N1cGVyKSB7XG4gICAgICBfX2V4dGVuZHMoSlNPTlBhdGNoRXJyb3IsIF9zdXBlcik7XG5cbiAgICAgIGZ1bmN0aW9uIEpTT05QYXRjaEVycm9yKG1lc3NhZ2UpIHtcbiAgICAgICAgdGhpcy5tZXNzYWdlID0gbWVzc2FnZSAhPSBudWxsID8gbWVzc2FnZSA6ICdKU09OIHBhdGNoIGVycm9yJztcbiAgICAgICAgdGhpcy5uYW1lID0gJ0pTT05QYXRjaEVycm9yJztcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIEpTT05QYXRjaEVycm9yO1xuXG4gICAgfSkoRXJyb3IpO1xuICAgIEludmFsaWRQb2ludGVyRXJyb3IgPSAoZnVuY3Rpb24oX3N1cGVyKSB7XG4gICAgICBfX2V4dGVuZHMoSW52YWxpZFBvaW50ZXJFcnJvciwgX3N1cGVyKTtcblxuICAgICAgZnVuY3Rpb24gSW52YWxpZFBvaW50ZXJFcnJvcihtZXNzYWdlKSB7XG4gICAgICAgIHRoaXMubWVzc2FnZSA9IG1lc3NhZ2UgIT0gbnVsbCA/IG1lc3NhZ2UgOiAnSW52YWxpZCBwb2ludGVyJztcbiAgICAgICAgdGhpcy5uYW1lID0gJ0ludmFsaWRQb2ludGVyJztcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIEludmFsaWRQb2ludGVyRXJyb3I7XG5cbiAgICB9KShFcnJvcik7XG4gICAgSW52YWxpZFBhdGNoRXJyb3IgPSAoZnVuY3Rpb24oX3N1cGVyKSB7XG4gICAgICBfX2V4dGVuZHMoSW52YWxpZFBhdGNoRXJyb3IsIF9zdXBlcik7XG5cbiAgICAgIGZ1bmN0aW9uIEludmFsaWRQYXRjaEVycm9yKG1lc3NhZ2UpIHtcbiAgICAgICAgdGhpcy5tZXNzYWdlID0gbWVzc2FnZSAhPSBudWxsID8gbWVzc2FnZSA6ICdJbnZhbGlkIHBhdGNoJztcbiAgICAgICAgdGhpcy5uYW1lID0gJ0ludmFsaWRQYXRjaCc7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBJbnZhbGlkUGF0Y2hFcnJvcjtcblxuICAgIH0pKEpTT05QYXRjaEVycm9yKTtcbiAgICBQYXRjaENvbmZsaWN0RXJyb3IgPSAoZnVuY3Rpb24oX3N1cGVyKSB7XG4gICAgICBfX2V4dGVuZHMoUGF0Y2hDb25mbGljdEVycm9yLCBfc3VwZXIpO1xuXG4gICAgICBmdW5jdGlvbiBQYXRjaENvbmZsaWN0RXJyb3IobWVzc2FnZSkge1xuICAgICAgICB0aGlzLm1lc3NhZ2UgPSBtZXNzYWdlICE9IG51bGwgPyBtZXNzYWdlIDogJ1BhdGNoIGNvbmZsaWN0JztcbiAgICAgICAgdGhpcy5uYW1lID0gJ1BhdGNoQ29uZmxpY3RFcnJvcic7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBQYXRjaENvbmZsaWN0RXJyb3I7XG5cbiAgICB9KShKU09OUGF0Y2hFcnJvcik7XG4gICAgSlNPTlBvaW50ZXIgPSAoZnVuY3Rpb24oKSB7XG4gICAgICBmdW5jdGlvbiBKU09OUG9pbnRlcihwYXRoKSB7XG4gICAgICAgIHZhciBpLCBzdGVwLCBzdGVwcywgX2ksIF9sZW47XG5cbiAgICAgICAgc3RlcHMgPSBbXTtcbiAgICAgICAgaWYgKHBhdGggJiYgKHN0ZXBzID0gcGF0aC5zcGxpdCgnLycpKS5zaGlmdCgpICE9PSAnJykge1xuICAgICAgICAgIHRocm93IG5ldyBJbnZhbGlkUG9pbnRlckVycm9yKCk7XG4gICAgICAgIH1cbiAgICAgICAgZm9yIChpID0gX2kgPSAwLCBfbGVuID0gc3RlcHMubGVuZ3RoOyBfaSA8IF9sZW47IGkgPSArK19pKSB7XG4gICAgICAgICAgc3RlcCA9IHN0ZXBzW2ldO1xuICAgICAgICAgIHN0ZXBzW2ldID0gc3RlcC5yZXBsYWNlKCd+MScsICcvJykucmVwbGFjZSgnfjAnLCAnficpO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuYWNjZXNzb3IgPSBzdGVwcy5wb3AoKTtcbiAgICAgICAgdGhpcy5zdGVwcyA9IHN0ZXBzO1xuICAgICAgICB0aGlzLnBhdGggPSBwYXRoO1xuICAgICAgfVxuXG4gICAgICBKU09OUG9pbnRlci5wcm90b3R5cGUuZ2V0UmVmZXJlbmNlID0gZnVuY3Rpb24ocGFyZW50KSB7XG4gICAgICAgIHZhciBzdGVwLCBfaSwgX2xlbiwgX3JlZjtcblxuICAgICAgICBfcmVmID0gdGhpcy5zdGVwcztcbiAgICAgICAgZm9yIChfaSA9IDAsIF9sZW4gPSBfcmVmLmxlbmd0aDsgX2kgPCBfbGVuOyBfaSsrKSB7XG4gICAgICAgICAgc3RlcCA9IF9yZWZbX2ldO1xuICAgICAgICAgIGlmIChpc0FycmF5KHBhcmVudCkpIHtcbiAgICAgICAgICAgIHN0ZXAgPSBwYXJzZUludChzdGVwLCAxMCk7XG4gICAgICAgICAgfVxuICAgICAgICAgIGlmICghKHN0ZXAgaW4gcGFyZW50KSkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IFBhdGNoQ29uZmxpY3RFcnJvcignQXJyYXkgbG9jYXRpb24gb3V0IG9mICcsICdib3VuZHMgb3Igbm90IGFuIGluc3RhbmNlIHByb3BlcnR5Jyk7XG4gICAgICAgICAgfVxuICAgICAgICAgIHBhcmVudCA9IHBhcmVudFtzdGVwXTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcGFyZW50O1xuICAgICAgfTtcblxuICAgICAgSlNPTlBvaW50ZXIucHJvdG90eXBlLmNvZXJjZSA9IGZ1bmN0aW9uKHJlZmVyZW5jZSwgYWNjZXNzb3IpIHtcbiAgICAgICAgaWYgKGlzQXJyYXkocmVmZXJlbmNlKSkge1xuICAgICAgICAgIGlmIChpc1N0cmluZyhhY2Nlc3NvcikpIHtcbiAgICAgICAgICAgIGlmIChhY2Nlc3NvciA9PT0gJy0nKSB7XG4gICAgICAgICAgICAgIGFjY2Vzc29yID0gcmVmZXJlbmNlLmxlbmd0aDtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoL15bLStdP1xcZCskLy50ZXN0KGFjY2Vzc29yKSkge1xuICAgICAgICAgICAgICBhY2Nlc3NvciA9IHBhcnNlSW50KGFjY2Vzc29yLCAxMCk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICB0aHJvdyBuZXcgSW52YWxpZFBvaW50ZXJFcnJvcignSW52YWxpZCBhcnJheSBpbmRleCBudW1iZXInKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGFjY2Vzc29yO1xuICAgICAgfTtcblxuICAgICAgcmV0dXJuIEpTT05Qb2ludGVyO1xuXG4gICAgfSkoKTtcbiAgICBKU09OUGF0Y2ggPSAoZnVuY3Rpb24oKSB7XG4gICAgICBmdW5jdGlvbiBKU09OUGF0Y2gocGF0Y2gpIHtcbiAgICAgICAgaWYgKCEoJ3BhdGgnIGluIHBhdGNoKSkge1xuICAgICAgICAgIHRocm93IG5ldyBJbnZhbGlkUGF0Y2hFcnJvcigpO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMudmFsaWRhdGUocGF0Y2gpO1xuICAgICAgICB0aGlzLnBhdGNoID0gcGF0Y2g7XG4gICAgICAgIHRoaXMucGF0aCA9IG5ldyBKU09OUG9pbnRlcihwYXRjaC5wYXRoKTtcbiAgICAgICAgdGhpcy5pbml0aWFsaXplKHBhdGNoKTtcbiAgICAgIH1cblxuICAgICAgSlNPTlBhdGNoLnByb3RvdHlwZS5pbml0aWFsaXplID0gZnVuY3Rpb24oKSB7fTtcblxuICAgICAgSlNPTlBhdGNoLnByb3RvdHlwZS52YWxpZGF0ZSA9IGZ1bmN0aW9uKHBhdGNoKSB7fTtcblxuICAgICAgSlNPTlBhdGNoLnByb3RvdHlwZS5hcHBseSA9IGZ1bmN0aW9uKGRvY3VtZW50KSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcignTWV0aG9kIG5vdCBpbXBsZW1lbnRlZCcpO1xuICAgICAgfTtcblxuICAgICAgcmV0dXJuIEpTT05QYXRjaDtcblxuICAgIH0pKCk7XG4gICAgQWRkUGF0Y2ggPSAoZnVuY3Rpb24oX3N1cGVyKSB7XG4gICAgICBfX2V4dGVuZHMoQWRkUGF0Y2gsIF9zdXBlcik7XG5cbiAgICAgIGZ1bmN0aW9uIEFkZFBhdGNoKCkge1xuICAgICAgICBfcmVmID0gQWRkUGF0Y2guX19zdXBlcl9fLmNvbnN0cnVjdG9yLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgICAgIHJldHVybiBfcmVmO1xuICAgICAgfVxuXG4gICAgICBBZGRQYXRjaC5wcm90b3R5cGUudmFsaWRhdGUgPSBmdW5jdGlvbihwYXRjaCkge1xuICAgICAgICBpZiAoISgndmFsdWUnIGluIHBhdGNoKSkge1xuICAgICAgICAgIHRocm93IG5ldyBJbnZhbGlkUGF0Y2hFcnJvcigpO1xuICAgICAgICB9XG4gICAgICB9O1xuXG4gICAgICBBZGRQYXRjaC5wcm90b3R5cGUuYXBwbHkgPSBmdW5jdGlvbihkb2N1bWVudCkge1xuICAgICAgICB2YXIgYWNjZXNzb3IsIHJlZmVyZW5jZSwgdmFsdWU7XG5cbiAgICAgICAgcmVmZXJlbmNlID0gdGhpcy5wYXRoLmdldFJlZmVyZW5jZShkb2N1bWVudCk7XG4gICAgICAgIGFjY2Vzc29yID0gdGhpcy5wYXRoLmFjY2Vzc29yO1xuICAgICAgICB2YWx1ZSA9IHRoaXMucGF0Y2gudmFsdWU7XG4gICAgICAgIGlmIChpc0FycmF5KHJlZmVyZW5jZSkpIHtcbiAgICAgICAgICBhY2Nlc3NvciA9IHRoaXMucGF0aC5jb2VyY2UocmVmZXJlbmNlLCBhY2Nlc3Nvcik7XG4gICAgICAgICAgaWYgKGFjY2Vzc29yIDwgMCB8fCBhY2Nlc3NvciA+IHJlZmVyZW5jZS5sZW5ndGgpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBQYXRjaENvbmZsaWN0RXJyb3IoXCJJbmRleCBcIiArIGFjY2Vzc29yICsgXCIgb3V0IG9mIGJvdW5kc1wiKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgcmVmZXJlbmNlLnNwbGljZShhY2Nlc3NvciwgMCwgdmFsdWUpO1xuICAgICAgICB9IGVsc2UgaWYgKGFjY2Vzc29yID09IG51bGwpIHtcbiAgICAgICAgICBkb2N1bWVudCA9IHZhbHVlO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHJlZmVyZW5jZVthY2Nlc3Nvcl0gPSB2YWx1ZTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gZG9jdW1lbnQ7XG4gICAgICB9O1xuXG4gICAgICByZXR1cm4gQWRkUGF0Y2g7XG5cbiAgICB9KShKU09OUGF0Y2gpO1xuICAgIFJlbW92ZVBhdGNoID0gKGZ1bmN0aW9uKF9zdXBlcikge1xuICAgICAgX19leHRlbmRzKFJlbW92ZVBhdGNoLCBfc3VwZXIpO1xuXG4gICAgICBmdW5jdGlvbiBSZW1vdmVQYXRjaCgpIHtcbiAgICAgICAgX3JlZjEgPSBSZW1vdmVQYXRjaC5fX3N1cGVyX18uY29uc3RydWN0b3IuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICAgICAgcmV0dXJuIF9yZWYxO1xuICAgICAgfVxuXG4gICAgICBSZW1vdmVQYXRjaC5wcm90b3R5cGUuYXBwbHkgPSBmdW5jdGlvbihkb2N1bWVudCkge1xuICAgICAgICB2YXIgYWNjZXNzb3IsIHJlZmVyZW5jZTtcblxuICAgICAgICByZWZlcmVuY2UgPSB0aGlzLnBhdGguZ2V0UmVmZXJlbmNlKGRvY3VtZW50KTtcbiAgICAgICAgYWNjZXNzb3IgPSB0aGlzLnBhdGguYWNjZXNzb3I7XG4gICAgICAgIGlmIChpc0FycmF5KHJlZmVyZW5jZSkpIHtcbiAgICAgICAgICBhY2Nlc3NvciA9IHRoaXMucGF0aC5jb2VyY2UocmVmZXJlbmNlLCBhY2Nlc3Nvcik7XG4gICAgICAgICAgaWYgKCEoYWNjZXNzb3IgaW4gcmVmZXJlbmNlKSkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IFBhdGNoQ29uZmxpY3RFcnJvcihcIlZhbHVlIGF0IFwiICsgYWNjZXNzb3IgKyBcIiBkb2VzIG5vdCBleGlzdFwiKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgcmVmZXJlbmNlLnNwbGljZShhY2Nlc3NvciwgMSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgaWYgKCEoYWNjZXNzb3IgaW4gcmVmZXJlbmNlKSkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IFBhdGNoQ29uZmxpY3RFcnJvcihcIlZhbHVlIGF0IFwiICsgYWNjZXNzb3IgKyBcIiBkb2VzIG5vdCBleGlzdFwiKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgZGVsZXRlIHJlZmVyZW5jZVthY2Nlc3Nvcl07XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGRvY3VtZW50O1xuICAgICAgfTtcblxuICAgICAgcmV0dXJuIFJlbW92ZVBhdGNoO1xuXG4gICAgfSkoSlNPTlBhdGNoKTtcbiAgICBSZXBsYWNlUGF0Y2ggPSAoZnVuY3Rpb24oX3N1cGVyKSB7XG4gICAgICBfX2V4dGVuZHMoUmVwbGFjZVBhdGNoLCBfc3VwZXIpO1xuXG4gICAgICBmdW5jdGlvbiBSZXBsYWNlUGF0Y2goKSB7XG4gICAgICAgIF9yZWYyID0gUmVwbGFjZVBhdGNoLl9fc3VwZXJfXy5jb25zdHJ1Y3Rvci5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgICAgICByZXR1cm4gX3JlZjI7XG4gICAgICB9XG5cbiAgICAgIFJlcGxhY2VQYXRjaC5wcm90b3R5cGUudmFsaWRhdGUgPSBmdW5jdGlvbihwYXRjaCkge1xuICAgICAgICBpZiAoISgndmFsdWUnIGluIHBhdGNoKSkge1xuICAgICAgICAgIHRocm93IG5ldyBJbnZhbGlkUGF0Y2hFcnJvcigpO1xuICAgICAgICB9XG4gICAgICB9O1xuXG4gICAgICBSZXBsYWNlUGF0Y2gucHJvdG90eXBlLmFwcGx5ID0gZnVuY3Rpb24oZG9jdW1lbnQpIHtcbiAgICAgICAgdmFyIGFjY2Vzc29yLCByZWZlcmVuY2UsIHZhbHVlO1xuXG4gICAgICAgIHJlZmVyZW5jZSA9IHRoaXMucGF0aC5nZXRSZWZlcmVuY2UoZG9jdW1lbnQpO1xuICAgICAgICBhY2Nlc3NvciA9IHRoaXMucGF0aC5hY2Nlc3NvcjtcbiAgICAgICAgdmFsdWUgPSB0aGlzLnBhdGNoLnZhbHVlO1xuICAgICAgICBpZiAoaXNBcnJheShyZWZlcmVuY2UpKSB7XG4gICAgICAgICAgYWNjZXNzb3IgPSB0aGlzLnBhdGguY29lcmNlKHJlZmVyZW5jZSwgYWNjZXNzb3IpO1xuICAgICAgICAgIGlmICghKGFjY2Vzc29yIGluIHJlZmVyZW5jZSkpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBQYXRjaENvbmZsaWN0RXJyb3IoXCJWYWx1ZSBhdCBcIiArIGFjY2Vzc29yICsgXCIgZG9lcyBub3QgZXhpc3RcIik7XG4gICAgICAgICAgfVxuICAgICAgICAgIHJlZmVyZW5jZS5zcGxpY2UoYWNjZXNzb3IsIDEsIHZhbHVlKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBpZiAoIShhY2Nlc3NvciBpbiByZWZlcmVuY2UpKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgUGF0Y2hDb25mbGljdEVycm9yKFwiVmFsdWUgYXQgXCIgKyBhY2Nlc3NvciArIFwiIGRvZXMgbm90IGV4aXN0XCIpO1xuICAgICAgICAgIH1cbiAgICAgICAgICByZWZlcmVuY2VbYWNjZXNzb3JdID0gdmFsdWU7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGRvY3VtZW50O1xuICAgICAgfTtcblxuICAgICAgcmV0dXJuIFJlcGxhY2VQYXRjaDtcblxuICAgIH0pKEpTT05QYXRjaCk7XG4gICAgVGVzdFBhdGNoID0gKGZ1bmN0aW9uKF9zdXBlcikge1xuICAgICAgX19leHRlbmRzKFRlc3RQYXRjaCwgX3N1cGVyKTtcblxuICAgICAgZnVuY3Rpb24gVGVzdFBhdGNoKCkge1xuICAgICAgICBfcmVmMyA9IFRlc3RQYXRjaC5fX3N1cGVyX18uY29uc3RydWN0b3IuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICAgICAgcmV0dXJuIF9yZWYzO1xuICAgICAgfVxuXG4gICAgICBUZXN0UGF0Y2gucHJvdG90eXBlLnZhbGlkYXRlID0gZnVuY3Rpb24ocGF0Y2gpIHtcbiAgICAgICAgaWYgKCEoJ3ZhbHVlJyBpbiBwYXRjaCkpIHtcbiAgICAgICAgICB0aHJvdyBuZXcgSW52YWxpZFBhdGNoRXJyb3IoKTtcbiAgICAgICAgfVxuICAgICAgfTtcblxuICAgICAgVGVzdFBhdGNoLnByb3RvdHlwZS5hcHBseSA9IGZ1bmN0aW9uKGRvY3VtZW50KSB7XG4gICAgICAgIHZhciBhY2Nlc3NvciwgcmVmZXJlbmNlLCB2YWx1ZTtcblxuICAgICAgICByZWZlcmVuY2UgPSB0aGlzLnBhdGguZ2V0UmVmZXJlbmNlKGRvY3VtZW50KTtcbiAgICAgICAgYWNjZXNzb3IgPSB0aGlzLnBhdGguYWNjZXNzb3I7XG4gICAgICAgIHZhbHVlID0gdGhpcy5wYXRjaC52YWx1ZTtcbiAgICAgICAgaWYgKGlzQXJyYXkocmVmZXJlbmNlKSkge1xuICAgICAgICAgIGFjY2Vzc29yID0gdGhpcy5wYXRoLmNvZXJjZShyZWZlcmVuY2UsIGFjY2Vzc29yKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gaXNFcXVhbChyZWZlcmVuY2VbYWNjZXNzb3JdLCB2YWx1ZSk7XG4gICAgICB9O1xuXG4gICAgICByZXR1cm4gVGVzdFBhdGNoO1xuXG4gICAgfSkoSlNPTlBhdGNoKTtcbiAgICBNb3ZlUGF0Y2ggPSAoZnVuY3Rpb24oX3N1cGVyKSB7XG4gICAgICBfX2V4dGVuZHMoTW92ZVBhdGNoLCBfc3VwZXIpO1xuXG4gICAgICBmdW5jdGlvbiBNb3ZlUGF0Y2goKSB7XG4gICAgICAgIF9yZWY0ID0gTW92ZVBhdGNoLl9fc3VwZXJfXy5jb25zdHJ1Y3Rvci5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgICAgICByZXR1cm4gX3JlZjQ7XG4gICAgICB9XG5cbiAgICAgIE1vdmVQYXRjaC5wcm90b3R5cGUuaW5pdGlhbGl6ZSA9IGZ1bmN0aW9uKHBhdGNoKSB7XG4gICAgICAgIHZhciBpLCBsZW4sIHdpdGhpbiwgX2k7XG5cbiAgICAgICAgdGhpcy5mcm9tID0gbmV3IEpTT05Qb2ludGVyKHBhdGNoLmZyb20pO1xuICAgICAgICBsZW4gPSB0aGlzLmZyb20uc3RlcHMubGVuZ3RoO1xuICAgICAgICB3aXRoaW4gPSB0cnVlO1xuICAgICAgICBmb3IgKGkgPSBfaSA9IDA7IDAgPD0gbGVuID8gX2kgPD0gbGVuIDogX2kgPj0gbGVuOyBpID0gMCA8PSBsZW4gPyArK19pIDogLS1faSkge1xuICAgICAgICAgIGlmICh0aGlzLmZyb20uc3RlcHNbaV0gIT09IHRoaXMucGF0aC5zdGVwc1tpXSkge1xuICAgICAgICAgICAgd2l0aGluID0gZmFsc2U7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHdpdGhpbikge1xuICAgICAgICAgIGlmICh0aGlzLnBhdGguc3RlcHMubGVuZ3RoICE9PSBsZW4pIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBJbnZhbGlkUGF0Y2hFcnJvcihcIid0bycgbWVtYmVyIGNhbm5vdCBiZSBhIGRlc2NlbmRlbnQgb2YgJ3BhdGgnXCIpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAodGhpcy5mcm9tLmFjY2Vzc29yID09PSB0aGlzLnBhdGguYWNjZXNzb3IpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmFwcGx5ID0gZnVuY3Rpb24oZG9jdW1lbnQpIHtcbiAgICAgICAgICAgICAgcmV0dXJuIGRvY3VtZW50O1xuICAgICAgICAgICAgfTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH07XG5cbiAgICAgIE1vdmVQYXRjaC5wcm90b3R5cGUudmFsaWRhdGUgPSBmdW5jdGlvbihwYXRjaCkge1xuICAgICAgICBpZiAoISgnZnJvbScgaW4gcGF0Y2gpKSB7XG4gICAgICAgICAgdGhyb3cgbmV3IEludmFsaWRQYXRjaEVycm9yKCk7XG4gICAgICAgIH1cbiAgICAgIH07XG5cbiAgICAgIE1vdmVQYXRjaC5wcm90b3R5cGUuYXBwbHkgPSBmdW5jdGlvbihkb2N1bWVudCkge1xuICAgICAgICB2YXIgYWNjZXNzb3IsIHJlZmVyZW5jZSwgdmFsdWU7XG5cbiAgICAgICAgcmVmZXJlbmNlID0gdGhpcy5mcm9tLmdldFJlZmVyZW5jZShkb2N1bWVudCk7XG4gICAgICAgIGFjY2Vzc29yID0gdGhpcy5mcm9tLmFjY2Vzc29yO1xuICAgICAgICBpZiAoaXNBcnJheShyZWZlcmVuY2UpKSB7XG4gICAgICAgICAgYWNjZXNzb3IgPSB0aGlzLmZyb20uY29lcmNlKHJlZmVyZW5jZSwgYWNjZXNzb3IpO1xuICAgICAgICAgIGlmICghKGFjY2Vzc29yIGluIHJlZmVyZW5jZSkpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBQYXRjaENvbmZsaWN0RXJyb3IoXCJWYWx1ZSBhdCBcIiArIGFjY2Vzc29yICsgXCIgZG9lcyBub3QgZXhpc3RcIik7XG4gICAgICAgICAgfVxuICAgICAgICAgIHZhbHVlID0gcmVmZXJlbmNlLnNwbGljZShhY2Nlc3NvciwgMSlbMF07XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgaWYgKCEoYWNjZXNzb3IgaW4gcmVmZXJlbmNlKSkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IFBhdGNoQ29uZmxpY3RFcnJvcihcIlZhbHVlIGF0IFwiICsgYWNjZXNzb3IgKyBcIiBkb2VzIG5vdCBleGlzdFwiKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgdmFsdWUgPSByZWZlcmVuY2VbYWNjZXNzb3JdO1xuICAgICAgICAgIGRlbGV0ZSByZWZlcmVuY2VbYWNjZXNzb3JdO1xuICAgICAgICB9XG4gICAgICAgIHJlZmVyZW5jZSA9IHRoaXMucGF0aC5nZXRSZWZlcmVuY2UoZG9jdW1lbnQpO1xuICAgICAgICBhY2Nlc3NvciA9IHRoaXMucGF0aC5hY2Nlc3NvcjtcbiAgICAgICAgaWYgKGlzQXJyYXkocmVmZXJlbmNlKSkge1xuICAgICAgICAgIGFjY2Vzc29yID0gdGhpcy5wYXRoLmNvZXJjZShyZWZlcmVuY2UsIGFjY2Vzc29yKTtcbiAgICAgICAgICBpZiAoYWNjZXNzb3IgPCAwIHx8IGFjY2Vzc29yID4gcmVmZXJlbmNlLmxlbmd0aCkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IFBhdGNoQ29uZmxpY3RFcnJvcihcIkluZGV4IFwiICsgYWNjZXNzb3IgKyBcIiBvdXQgb2YgYm91bmRzXCIpO1xuICAgICAgICAgIH1cbiAgICAgICAgICByZWZlcmVuY2Uuc3BsaWNlKGFjY2Vzc29yLCAwLCB2YWx1ZSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgaWYgKGFjY2Vzc29yIGluIHJlZmVyZW5jZSkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IFBhdGNoQ29uZmxpY3RFcnJvcihcIlZhbHVlIGF0IFwiICsgYWNjZXNzb3IgKyBcIiBleGlzdHNcIik7XG4gICAgICAgICAgfVxuICAgICAgICAgIHJlZmVyZW5jZVthY2Nlc3Nvcl0gPSB2YWx1ZTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gZG9jdW1lbnQ7XG4gICAgICB9O1xuXG4gICAgICByZXR1cm4gTW92ZVBhdGNoO1xuXG4gICAgfSkoSlNPTlBhdGNoKTtcbiAgICBDb3B5UGF0Y2ggPSAoZnVuY3Rpb24oX3N1cGVyKSB7XG4gICAgICBfX2V4dGVuZHMoQ29weVBhdGNoLCBfc3VwZXIpO1xuXG4gICAgICBmdW5jdGlvbiBDb3B5UGF0Y2goKSB7XG4gICAgICAgIF9yZWY1ID0gQ29weVBhdGNoLl9fc3VwZXJfXy5jb25zdHJ1Y3Rvci5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgICAgICByZXR1cm4gX3JlZjU7XG4gICAgICB9XG5cbiAgICAgIENvcHlQYXRjaC5wcm90b3R5cGUuYXBwbHkgPSBmdW5jdGlvbihkb2N1bWVudCkge1xuICAgICAgICB2YXIgYWNjZXNzb3IsIHJlZmVyZW5jZSwgdmFsdWU7XG5cbiAgICAgICAgcmVmZXJlbmNlID0gdGhpcy5mcm9tLmdldFJlZmVyZW5jZShkb2N1bWVudCk7XG4gICAgICAgIGFjY2Vzc29yID0gdGhpcy5mcm9tLmFjY2Vzc29yO1xuICAgICAgICBpZiAoaXNBcnJheShyZWZlcmVuY2UpKSB7XG4gICAgICAgICAgYWNjZXNzb3IgPSB0aGlzLmZyb20uY29lcmNlKHJlZmVyZW5jZSwgYWNjZXNzb3IpO1xuICAgICAgICAgIGlmICghKGFjY2Vzc29yIGluIHJlZmVyZW5jZSkpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBQYXRjaENvbmZsaWN0RXJyb3IoXCJWYWx1ZSBhdCBcIiArIGFjY2Vzc29yICsgXCIgZG9lcyBub3QgZXhpc3RcIik7XG4gICAgICAgICAgfVxuICAgICAgICAgIHZhbHVlID0gcmVmZXJlbmNlLnNsaWNlKGFjY2Vzc29yLCBhY2Nlc3NvciArIDEpWzBdO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGlmICghKGFjY2Vzc29yIGluIHJlZmVyZW5jZSkpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBQYXRjaENvbmZsaWN0RXJyb3IoXCJWYWx1ZSBhdCBcIiArIGFjY2Vzc29yICsgXCIgZG9lcyBub3QgZXhpc3RcIik7XG4gICAgICAgICAgfVxuICAgICAgICAgIHZhbHVlID0gcmVmZXJlbmNlW2FjY2Vzc29yXTtcbiAgICAgICAgfVxuICAgICAgICByZWZlcmVuY2UgPSB0aGlzLnBhdGguZ2V0UmVmZXJlbmNlKGRvY3VtZW50KTtcbiAgICAgICAgYWNjZXNzb3IgPSB0aGlzLnBhdGguYWNjZXNzb3I7XG4gICAgICAgIGlmIChpc0FycmF5KHJlZmVyZW5jZSkpIHtcbiAgICAgICAgICBhY2Nlc3NvciA9IHRoaXMucGF0aC5jb2VyY2UocmVmZXJlbmNlLCBhY2Nlc3Nvcik7XG4gICAgICAgICAgaWYgKGFjY2Vzc29yIDwgMCB8fCBhY2Nlc3NvciA+IHJlZmVyZW5jZS5sZW5ndGgpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBQYXRjaENvbmZsaWN0RXJyb3IoXCJJbmRleCBcIiArIGFjY2Vzc29yICsgXCIgb3V0IG9mIGJvdW5kc1wiKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgcmVmZXJlbmNlLnNwbGljZShhY2Nlc3NvciwgMCwgdmFsdWUpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGlmIChhY2Nlc3NvciBpbiByZWZlcmVuY2UpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBQYXRjaENvbmZsaWN0RXJyb3IoXCJWYWx1ZSBhdCBcIiArIGFjY2Vzc29yICsgXCIgZXhpc3RzXCIpO1xuICAgICAgICAgIH1cbiAgICAgICAgICByZWZlcmVuY2VbYWNjZXNzb3JdID0gdmFsdWU7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGRvY3VtZW50O1xuICAgICAgfTtcblxuICAgICAgcmV0dXJuIENvcHlQYXRjaDtcblxuICAgIH0pKE1vdmVQYXRjaCk7XG4gICAgb3BlcmF0aW9uTWFwID0ge1xuICAgICAgYWRkOiBBZGRQYXRjaCxcbiAgICAgIHJlbW92ZTogUmVtb3ZlUGF0Y2gsXG4gICAgICByZXBsYWNlOiBSZXBsYWNlUGF0Y2gsXG4gICAgICBtb3ZlOiBNb3ZlUGF0Y2gsXG4gICAgICBjb3B5OiBDb3B5UGF0Y2gsXG4gICAgICB0ZXN0OiBUZXN0UGF0Y2hcbiAgICB9O1xuICAgIGNvbXBpbGUgPSBmdW5jdGlvbihwYXRjaCkge1xuICAgICAgdmFyIGtsYXNzLCBvcHMsIHAsIF9pLCBfbGVuO1xuXG4gICAgICBvcHMgPSBbXTtcbiAgICAgIGZvciAoX2kgPSAwLCBfbGVuID0gcGF0Y2gubGVuZ3RoOyBfaSA8IF9sZW47IF9pKyspIHtcbiAgICAgICAgcCA9IHBhdGNoW19pXTtcbiAgICAgICAgaWYgKCEoa2xhc3MgPSBvcGVyYXRpb25NYXBbcC5vcF0pKSB7XG4gICAgICAgICAgdGhyb3cgbmV3IEludmFsaWRQYXRjaEVycm9yKCk7XG4gICAgICAgIH1cbiAgICAgICAgb3BzLnB1c2gobmV3IGtsYXNzKHApKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBmdW5jdGlvbihkb2N1bWVudCkge1xuICAgICAgICB2YXIgb3AsIHJlc3VsdCwgX2osIF9sZW4xO1xuXG4gICAgICAgIHJlc3VsdCA9IGRvY3VtZW50O1xuICAgICAgICBmb3IgKF9qID0gMCwgX2xlbjEgPSBvcHMubGVuZ3RoOyBfaiA8IF9sZW4xOyBfaisrKSB7XG4gICAgICAgICAgb3AgPSBvcHNbX2pdO1xuICAgICAgICAgIHJlc3VsdCA9IG9wLmFwcGx5KGRvY3VtZW50KTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgfTtcbiAgICB9O1xuICAgIGFwcGx5ID0gZnVuY3Rpb24oZG9jdW1lbnQsIHBhdGNoKSB7XG4gICAgICByZXR1cm4gY29tcGlsZShwYXRjaCkoZG9jdW1lbnQpO1xuICAgIH07XG4gICAgcm9vdC5hcHBseSA9IGFwcGx5O1xuICAgIHJvb3QuY29tcGlsZSA9IGNvbXBpbGU7XG4gICAgcm9vdC5KU09OUG9pbnRlciA9IEpTT05Qb2ludGVyO1xuICAgIHJvb3QuSlNPTlBhdGNoID0gSlNPTlBhdGNoO1xuICAgIHJvb3QuSlNPTlBhdGNoRXJyb3IgPSBKU09OUGF0Y2hFcnJvcjtcbiAgICByb290LkludmFsaWRQb2ludGVyRXJyb3IgPSBJbnZhbGlkUG9pbnRlckVycm9yO1xuICAgIHJvb3QuSW52YWxpZFBhdGNoRXJyb3IgPSBJbnZhbGlkUGF0Y2hFcnJvcjtcbiAgICByb290LlBhdGNoQ29uZmxpY3RFcnJvciA9IFBhdGNoQ29uZmxpY3RFcnJvcjtcbiAgICByZXR1cm4gcm9vdDtcbiAgfSk7XG5cbn0pLmNhbGwodGhpcyk7XG4iXX0=
;