var Application = {
  views: {}
}

Application.View = Backbone.View.extend({
  
  templateName: null,

  render: function () {
    $(this.el).html(_.template($("#" + this.template).html()));
    return this;
  }
})

Application.Router = Backbone.Router.extend({
  routes: {
    "": "endpoints",
    "routing": "routing",
    "about": "about"
  },

  initialize: function () {
    this.headerView = new Application.views.Header({el: '.header'});

    this.on("all", function(event) {
      var routes = this.routes;
      var route = event.split(':')[1];
      path = _.find(routes, function(x) { return routes[x] == route; });
      this.headerView.selectMenuItem('/' + path);
    }, this);
  },

  endpoints: function () {
    this.endpointsView = new Application.views.Endpoints({el: '.main'});
  },

  routing: function () {
    alert('not impl.')
  },

  about: function () {
    alert('not impl.')
  }
});
