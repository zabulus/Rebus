App = {
  views: {},
  init: function() {
    var router = new App.Router()
    Backbone.history.start();
  }
}

App.Router = Backbone.Router.extend({
  routes: {
    "": "home",
    "about": "about"
  },

  initialize: function () {
    this.headerView = new App.views.Header({el: '.header'});
  },

  home: function () {
    this.homeView = new HomeView();
  },

  about: function () {
    this.aboutView = new AboutView();
  }
});

$(function() {
  App.init();
})
