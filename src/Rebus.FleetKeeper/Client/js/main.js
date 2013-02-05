App = {
  views: {},
  init: function() {
    var router = new App.Router();
    Backbone.history.start({pushState:true});
  }
}

App.Router = Backbone.Router.extend({
  routes: {
    "": "endpoints",
    "routing": "routing",
    "about": "about"
  },

  initialize: function () {
    this.headerView = new App.views.Header({el: '.header'});

    this.on("all", function(event) {
      var routes = this.routes;
      var route = event.split(':')[1];
      path = _.find(routes, function(x) { return routes[x] == route; });
      this.headerView.selectMenuItem('/' + path);
    }, this);
  },

  endpoints: function () {
    this.endpointsView = new App.views.Endpoints({el: '.main'});
  },

  routing: function () {
    alert('not impl.')
  },

  about: function () {
    alert('not impl.')
  }
});

$(function() {
  App.init();

  // All navigation that is relative should be passed through the navigate
  // method, to be processed by the router.  If the link has a data-bypass
  // attribute, bypass the delegation completely.
  $(document).on("click", "a:not([data-bypass])", function(evt) {
    // Get the anchor href and protcol
    var href = $(this).attr("href");
    var protocol = this.protocol + "//";

    // Ensure the protocol is not part of URL, meaning its relative.
    if (href && href.slice(0, protocol.length) !== protocol &&
        href.indexOf("javascript:") !== 0) {
      // Stop the default event to ensure the link will not cause a page
      // refresh.
      evt.preventDefault();

      // `Backbone.history.navigate` is sufficient for all Routers and will
      // trigger the correct events.  The Router's internal `navigate` method
      // calls this anyways.
      Backbone.history.navigate(href, true);
    }
  });
})
