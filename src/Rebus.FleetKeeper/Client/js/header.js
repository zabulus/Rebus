App.views.Header = Backbone.View.extend({
  template: 
   '<div class="navbar navbar-inverse navbar-static-top">\
      <div class="navbar-inner">\
        <div class="container pull-left">\
          <a class="brand" href="#">Rebus FleetKeeper</a>\
          <div class="nav-collapse collapse">\
            <ul class="nav">\
              <li><a href="/">Endpoints</a></li>\
              <li><a href="/routing">Routing</a></li>\
              <li><a href="/about">About</a></li>\
            </ul>\
          </div><!--/.nav-collapse -->\
        </div>\
      </div>\
    </div>',

  initialize: function () {
    this.render();
  },

  render: function () {
    $(this.el).html(_.template(this.template));
    return this;
  },

  selectMenuItem: function (url) {
    $('.nav li').removeClass('active');
    if (url) {
       $('.nav a[href="' + url + '"]').addClass('active');
    }
  }
});