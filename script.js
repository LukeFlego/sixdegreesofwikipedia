const pageURL = 'https://en.wikipedia.org/w/api.php?action=parse&format=json&origin=*&redirects=1&prop=text&disabletoc=1&mainpage=1&page=';

Array.prototype.extend = function (other_array) {
  /* you should include a test to check whether other_array really is an array */
  other_array.forEach(function (v) {
    this.push(v)
  }, this);
}
String.prototype.toProperCase = function () {
  return this.replace(/\w\S*/g, function (txt) {
    return txt.charAt(0).toUpperCase() + txt.substr(1);
  });
};

$(window).on('load', function () {
  var $card = $('.mdl-card-template')[0].innerHTML,
    firstRun = true,
    visitedWikis = [],
    randomAnchor,
    featuredArticles = [],
    random = true,
    settings = {
      degrees: 6,
      WPM: 500
    },
    loadSettings = function () {

      var settingsMenu = $('ul#settings');
      for (var i = Object.keys(settings).length - 1; i > -1; i--) {
        if (localStorage.getItem(Object.keys(settings)[i])) {
          settings[Object.keys(settings)[i]] = localStorage.getItem(Object.keys(settings)[i]);
        };
        settingsMenu.prepend('<li class="mdl-menu__item">' + mdlInput(Object.keys(settings)[i].toProperCase(), settings[Object.keys(settings)[i]]) + '</li>');
      }

      window.componentHandler.upgradeDom();
      settingsMenu.parent('.mdl-menu__container').prev('button').prop('hidden', false);
      $('*', settingsMenu).on('click focus', function (e) {
        e.stopPropagation();
      });
      $('input', settingsMenu).on('change', function (e) {
        saveSettings();
      });
    },
    saveSettings = function () {
      var settingsMenu = $('ul#settings');
      for (var i = 0; i < Object.keys(settings).length; i++) {
        localStorage.setItem(Object.keys(settings)[i], $('input', settingsMenu).eq(i).val());
        settings[Object.keys(settings)[i]] = $('input', settingsMenu).eq(i).val();
      }
      //loadSettings();
    };

  mdlInput = function (text, input) {
    if (text == 'Random') {
      return '<label class="mdl-switch mdl-js-switch mdl-js-ripple-effect"><input type="checkbox" class="mdl-switch__input" ' + (input === 'true' ? 'checked' : '') + '><span class="mdl-switch__label">' + text + '</span></label>';
    } else {
      return '<div class="mdl-textfield mdl-js-textfield"><input class="mdl-textfield__input" type="number" pattern="-?[0-9]*(\.[0-9]+)?" min="0" value="' + input + '"></div>' + text;
    }
  };

  loadSettings();


  function getWiki(origin, degrees) {

    if (!origin.match(/^https:\/\/(\w\w\.)+wikipedia\.org\//)) {
      origin = pageURL + origin;
    }

    function formatLinks(string) {
      // Format relative anchors to be absolute
      return string.replace(/(href=\"\/wiki)/g, 'target="_blank" href="https://wikipedia.org/wiki').replace(/(=\S\/\/)/g, '="https://').replace(/(href=\"#)/g, 'target="_blank" href="https://wikipedia.org/wiki/' + origin.split('&page=')[1] + '#');
    }

    // create card and append
    $('.mdl-papa').append($card);
    var $currentCard = $('.mdl-papa .mdl-card:last');
    if (degrees === 0) {
      $('.mdl-button.skip').remove();
    }

    // get origin wiki (starting wiki)
    $.ajax({
      url: origin,
      dataType: 'jsonp',
      success: function (allData) {
        if (random == true) {
          firstRun = false;
        }
        var supportingText = $('.mdl-card__supporting-text', $currentCard);

        if (firstRun) {
          var data = $(allData.parse.text["*"]).find('.mw-headline').parents('tbody').eq(2).find('tr p'),
            data = $(data).remove('.ambox'),
            title = data.find('a:first').attr('title');

          data.find('b:first').html(data.find('a:first').text());

          var summary = formatLinks(data[0].innerHTML),
            summaryBrackets = summary.match(/\s\([^\)]*\)/g),
            finalBracket = summaryBrackets[summaryBrackets.length - 1];

          supportingText.html(summary.replace(finalBracket, ''));
        } else {
          var data = allData.parse,
            title = data.title,
            summary = $(formatLinks(data.text["*"])).filter('.mw-parser-output').find('> p:first');
          // Skip the pesky coordinates paragraph tag on location pages
          if (summary.html().indexOf('id="coordinates"') > -1) {
            summary = $(formatLinks(data.text["*"])).filter('.mw-parser-output').find('> p:eq(2)');
          }

          supportingText.html(summary);
        }

        var images = $(formatLinks(data.text["*"])).find('.image img');

        function chooseImage() {
          // If image width and height are both smaller than 120, re-choose image
          if ($(images[0])[0].width < 120 && $(images[0])[0].height < 120) {
            images.splice(0, 1);
            if (images.length > 0) {
              chooseImage();
            }
          } else {
            // Prepend it to text content
            supportingText.prepend(images[0]);
          }
        }
        if (images.length > 0) {
          chooseImage();
        }

        visitedWikis.push(origin.split('&page=')[1]);

        $('h2', $currentCard).text(title);
        $('.mdl-card__title img, .mdl-card__title h2', $currentCard).wrapAll('<a target="_blank" href="https://wikipedia.org/wiki/' + origin.split('&page=')[1] + '"></a>');
        $('a.external', $currentCard).attr('href', 'https://wikipedia.org/wiki/' + origin.split('&page=')[1]);

        $currentCard.show().css({
          'opacity': 0,
          'pointer-events': 'none'
        });
        var neoDelay = 0;
        if ($('.mdl-papa .mdl-card').length > 1) {
          neoDelay = 500;
          setTimeout(function () {
            $('.neo-animate:first').css({
              'position': 'absolute',
              'font-style': 'normal',
              'font-size': '24px',
              'opacity': 1,
              'transform': 'translateY(-6px)'
            });
            var matchX = ($('h2', $currentCard).offset().left - $('.neo-animate:first').offset().left - $('.neo-animate:first').css('padding-left').split('px')[0]);
            var matchY = ($('h2', $currentCard).offset().top - $('.neo-animate:first').offset().top - $('.neo-animate:first').css('padding-top').split('px')[0]) + 2;

            $('.neo-animate:first').css({
              'transform': 'translate(' + matchX + 'px, ' + matchY + 'px)'
            });
          }, neoDelay);
          setTimeout(function () {
            $('.neo-animate:first').css('opacity', 0);
          }, 1100 + neoDelay);
        }
        var firstDelay = 1600;
        if ($('.mdl-papa .mdl-card').length == 1) {
          firstDelay = 0;
        }
        $currentCard.delay(firstDelay).animate({
          'opacity': 1
        }, 1000, function () {

          $('.neo-animate:first').remove();

          $(this).css('pointer-events', 'auto');

          firstRun = false;

          // get random link
          function selectAnchor() {
            var ignoreAnchors = ['#', 'upload.wikimedia', 'Help:', 'Wikipedia:', 'File:'];
            ignoreAnchors.extend(visitedWikis);

            var iAContain = ('[href*="' + ignoreAnchors.join('"],[href*="')).split(/(?=:\]\[)/) + '"]';

            var anchors = $('.mdl-card__supporting-text a[href*="wikipedia.org"]:not(' + iAContain + ')', $currentCard);

            if ($(anchors).length > 0) {
              randomAnchor = anchors[Math.floor(Math.random() * anchors.length)];
            } else {
              randomAnchor = featuredArticles[Math.floor(Math.random() * featuredArticles.length)];
            }
          }
          selectAnchor();

          // loop through degrees (steps)
          if (degrees > 1) {
            $('.progressbar', this).animate({
              'width': '100%'
            }, ($currentCard.text().split(/\s/g).length / settings.WPM) * 60 * 1000, 'linear', function () {

              var currentAnchor = randomAnchor;
              $('.mdl-button.skip').remove();

              $(currentAnchor).append('<span class="mdl-badge mdl-badge--overlap"><span class="mdl-badge--custom mdl-color--accent mdl-color-text--accent-contrast">' + ($('.mdl-card').length - 1) + '</span></span>');
              setTimeout(function () {
                $(currentAnchor).addClass($(randomAnchor).attr('href').split('/wiki/')[1] + ' neo is-active mdl-shadow--4dp');
              }, 1);

              setTimeout(function () {
                $(currentAnchor).removeClass('is-active');
              }, 3000);

              // clone currentanchor and animate to new card title pos
              $(currentAnchor).clone().appendTo('.mdl-papa').replaceWith('<span class="neo-animate">' + $(currentAnchor).attr('title') + '</span>');
              $('span.neo-animate:first').css($(currentAnchor).getStyleObject()).css({
                'left': $(currentAnchor).offset().left,
                'top': $(currentAnchor).offset().top + $('.mdl-layout__content').scrollTop() - $('.mdl-layout__header').height() - 10
              });
              setTimeout(function () {
                $('.neo-animate:last').css('opacity', 1);
              }, neoDelay);

              getWiki(currentAnchor.pathname.split('/wiki/')[1], degrees - 1);
            });
          }

        });
      }
    });
  }

  if (random == true) {
    $.ajax({
      url: pageURL + 'Wikipedia:Featured_articles',
      success: function (data) {
        var featuredPage = $(data.parse.text["*"]);
        featuredArticles = $(featuredPage).find('.featured_article_metadata a[href*="\/wiki\/"]');
        getWiki(featuredArticles[Math.floor(Math.random() * featuredArticles.length)].pathname.split('/wiki/')[1], settings.degrees);
        random = true;
      }
    });
  } else {
    getWiki('Wikipedia:Today%27s_featured_article', settings.degrees);
    random = false;
  }


  /*
   * getStyleObject Plugin for jQuery JavaScript Library
   * From: http://upshots.org/?p=112
   */

  (function ($) {
    $.fn.getStyleObject = function () {
      var dom = this.get(0);
      var style;
      var returns = {};
      if (window.getComputedStyle) {
        var camelize = function (a, b) {
          return b.toUpperCase();
        };
        style = window.getComputedStyle(dom, null);
        for (var i = 0, l = style.length; i < l; i++) {
          var prop = style[i];
          var camel = prop.replace(/\-([a-z])/g, camelize);
          var val = style.getPropertyValue(prop);
          returns[camel] = val;
        };
        return returns;
      };
      if (style = dom.currentStyle) {
        for (var prop in style) {
          returns[prop] = style[prop];
        };
        return returns;
      };
      return this.css();
    }
  })(jQuery);

  $('body').off().on('mouseenter mouseleave', '.mdl-card', function (ev) {
    if (ev.type === 'mouseenter') {
      //      $('.reference-line').css('opacity', 0);
      $(ev.currentTarget).css('z-index', 2);
      $('.mdl-card').find('.neo').removeClass('is-active');

      if ($(ev.currentTarget).prev('.mdl-card').length > 0) {
        $(ev.currentTarget).prev().find('.neo').addClass('is-active');
        $(ev.currentTarget).css('z-index', 10);

        //        Reference-line

        //        $('.reference-line').css('opacity', 1);
        //
        //        $(this).mousemove(function (e) {
        //          var lineStart = $(ev.currentTarget).prev('.mdl-card').find('.neo .mdl-badge--custom'),
        //            lineEnd = {
        //              left: $('.mdl-card__title', ev.currentTarget).offset().left,
        //              top: $('.mdl-card__title', ev.currentTarget).offset().top + ($('.mdl-card__title', ev.currentTarget).outerHeight() / 2)
        //            },
        //            x1 = lineStart.offset().left + lineStart.width() - 1,
        //            y1 = lineStart.offset().top + (lineStart.height() / 2) + $('.mdl-layout__content').scrollTop(),
        //            x2 = lineEnd.left,
        //            y2 = lineEnd.top + Number($('.mdl-layout__content').scrollTop());
        //
        //
        //
        //          if (x2 < x1) {
        //            x1 = x1 - lineStart.width() + 1;
        //            x2 = x2 + $('.mdl-card__title', ev.currentTarget).outerWidth();
        //          }
        //
        //          var length = Math.sqrt((x1 - x2) * (x1 - x2) + (y1 - y2) * (y1 - y2));
        //          var angle = Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI;
        //          var transform = 'rotateZ(' + angle + 'deg)';
        //
        //          $('.reference-line').css('transform', transform)
        //            .width(length).css({
        //              'top': y1 - $('.mdl-layout__header').height(),
        //              'left': x1,
        //              'right': 'auto',
        //              'bottom': 'auto'
        //            });
        //
        //          if (y2 < y1) {
        //            $('.reference-line').css({
        //              'bottom': $('.mdl-layout__content').height() - y1 + $('.mdl-layout__header').height(),
        //              'top': 'auto'
        //            })
        //          }
        //
        //        })
      }
    }
    if (ev.type === 'mouseleave') {
      //      $('.reference-line').css('opacity', 0);
      $(ev.currentTarget).css('z-index', 2);
      $('.mdl-card').find('.neo').removeClass('is-active');
    }
  });

  $('body').on('click', '.mdl-button.skip', function () {
    $('.progressbar').finish();
    $(this).remove();
  })


  //$('.mdl-menu li[id]').off().on('click', function () {
  //  eval(this.id + '()');
  //});

});