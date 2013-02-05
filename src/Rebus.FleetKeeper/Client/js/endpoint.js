App.views.Home = Backbone.View.extend({
  template: 
    '<div class="span3">\
        <h2>Heading</h2>\
        <p>Donec id elit non mi porta gravida at eget metus. Fusce dapibus, tellus ac cursus commodo, tortor mauris condimentum nibh, ut fermentum massa justo sit amet risus. Etiam porta sem malesuada magna mollis euismod. Donec sed odio dui. </p>\
        <p><a class="btn" href="#">View details &raquo;</a></p>\
      </div>',

  initialize: function () {
    this.render();
  },

  render: function () {
    $(this.el).html(_.template(this.template));
    return this;
  }
});