var transparent = true;
var navbar_initialized = false;

// activate collapse right menu when the windows is resized
$(window).on('resize', function () {
  if ($(window).width() <= 991)
    lbd.initRightMenu();
});

$(function () {
  // Init navigation toggle for small screens
  $(window).trigger('resize');
  
  //  Activate the tooltips
  $('[rel="tooltip"]').tooltip();
  
  //      Activate the switches with icons
  if ($('.switch').length)
    $('.switch')['bootstrapSwitch']();
  
  //      Activate regular switches
  if ($('[data-toggle="switch"]').length)
    $('[data-toggle="switch"]').wrap('<div class="switch" />').parent()['bootstrapSwitch']();
  
  /*$('.form-control').on({
    focus: function () {
      $(this).parent('.input-group').addClass('input-group-focus');
    },
    blur: function () {
      $(this).parent('.input-group').removeClass('input-group-focus');
    }
  });*/
  
  // Fixes sub-nav not working as expected on IOS
  $('body').on('touchstart.dropdown', '.dropdown-menu', function (e) {
    e.stopPropagation();
  });
});

$(document).on('click', '.navbar-toggle', function () {
  var $html = $('html');
  $html.toggleClass('nav-open', !$html.hasClass('nav-open'));
});

$(document).on('click', '#bodyClick', function () {
  $('.navbar-toggle').trigger('click');
});

var lbd = {
  misc: {
    navbar_menu_visible: 0
  },
  
  initRightMenu: function () {
    if (!navbar_initialized) {
      var $navbar = $('nav').find('.navbar-collapse').first().clone(true);
      
      var $sidebar = $('.sidebar');
      var sidebar_color = $sidebar.data('color');
      
      var $logo = $sidebar.find('.logo').first();
      var logo_content = $logo[0].outerHTML;
      
      var ul_content = '';
      
      $navbar.attr('data-color', sidebar_color);
      
      //add the content from the regular header to the right menu
      $navbar.children('ul').each(function () {
        ul_content += $(this).html();
      });
      
      // add the content from the sidebar to the right menu
      ul_content += $sidebar.find('.nav').html();
      
      ul_content = '<div class="sidebar-wrapper">' +
          '<ul class="nav navbar-nav">' +
          ul_content +
          '</ul>' +
          '</div>';
      
      $navbar.html(logo_content + ul_content);
      
      $('body').append($navbar);
      
      var background_image = $sidebar.data('image');
      if (background_image != undefined) {
        $navbar.css('background', "url('" + background_image + "')")
        .removeAttr('data-nav-image')
        .addClass('has-image');
      }
      
      var $toggle = $('.navbar-toggle');
      
      $navbar.find('a').removeClass('btn btn-round btn-default');
      $navbar.find('button').removeClass('btn-round btn-fill btn-info btn-primary btn-success btn-danger btn-warning btn-neutral').addClass('btn-simple btn-block');
      
      navbar_initialized = true;
    }
  }
};

function debounce(func, wait, immediate) {
  var timeout;
  return function () {
    var context = this, args = arguments;
    clearTimeout(timeout);
    timeout = setTimeout(function () {
      timeout = null;
      if (!immediate) func.apply(context, args);
    }, wait);
    if (immediate && !timeout) func.apply(context, args);
  };
}

var USER_PROFILE = {};