Application.views.Header = Application.View.extend({
  template: 'header_template',

  initialize: function () {
    this.render();
  },

  selectMenuItem: function (url) {
    $('.nav li').removeClass('active');
    if (url) {
       $('.nav a[href="' + url + '"]').addClass('active');
    }
  }
});