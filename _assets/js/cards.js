  'use strict;'

  var gutterWidth = 14;  // gutter width should match CSS setting for cards

  // card animation -- raised shadow
  $(".pmd-card").hover(
    function(event) {
      removeShadow($(this)).addClass("pmd-z-depth-1");
  }, function(event) {
      removeShadow($(this)).addClass("pmd-z-depth");
  });

  // card animation -- lower shadow on click
  $(".pmd-card").mousedown(function(event) {
    var element = $(this);
    removeShadow(element);
    setTimeout(function() {
      removeShadow(element).addClass("pmd-z-depth-1");
    }, 100);
  });

  function removeShadow(jqElement) {
      return jqElement.removeClass(function(index, classNames){
        var classes = classNames.split(" ");
        var removeClasses = [];
        classes.forEach(function(element) {
          if (element.startsWith("pmd-z-depth")) {
            removeClasses.push(element);
          }
        });
        return removeClasses.join(" ");
      })  
  };

  // card resize, maintain aspect ratio
  var baseFontSize1Px;
  var baseFontSize1Px;
  $().ready(function() {
    baseFontSize1Px = parseFloat($(".cf-ar-1x1").css("font-size"));
    baseFontSize2Px = parseFloat($(".cf-ar-2x2").css("font-size"));
    adjustRowHeight();
    var timer;
    $(window).resize(function() {
      clearTimeout(timer);
      timer = setTimeout(adjustRowHeight, 250);
    });
  });

  /**
   * Adjust heights to be relative to widths to preserve image aspect ratios
   */
  function adjustRowHeight() {
    var rows = $("#article-cards > .row, #aboutus-cards > .row");
    var maxWidth = rows.css("max-width");
    var height;
    var heightPercent = 1;
    if ("none" != maxWidth) {
      // height: divide the width into thirds and subtract out the margins
      var maxHeight = parseInt(maxWidth) / 3 - /*2**/gutterWidth;
      var height = Math.ceil(rows.width() / 3 - /*2**/gutterWidth);
      heightPercent = height / maxHeight;
    }
    rows.each(function(index) {
        $(this).find(".cf-ar-1x1, .cf-ar-2x1")
          .each(function() {
            var card = $(this);
            $(this).find(".card-copy-panel, .card-media-panel")
              .each(function() {
                if ($(this).parents(".bg-img").length === 0) {
                  $(this).outerHeight(height ? height : 'auto');
                  card.css("font-size", baseFontSize1Px * heightPercent);
                } else {
                  // if there is a bg-img, force the card to be square
                  $(this).outerHeight($(this).outerWidth());
                }
              }); 
          });
        $(this).find(".cf-ar-2x2")
          .each(function() {
            var card = $(this);
            $(this).find(".card-copy-panel, .card-media-panel")
              .each(function() {
                if ($(this).parents(".bg-img").length === 0) {
                  card.css("font-size", baseFontSize2Px * heightPercent);
                  $(this).outerHeight(height ? (height * 2 + gutterWidth) : 'auto');
                } else {
                  // if there is a bg-img, force the card to be square
                  $(this).outerHeight($(this).outerWidth());
                }
              }); 
          });
    });
  };

