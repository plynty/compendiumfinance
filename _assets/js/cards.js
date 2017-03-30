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

  function adjustRowHeight() {
    var rows = $("#article-cards > .row");
    var maxWidth = rows.css("max-width");
    var height;
    var heightPercent = 1;
    if ("none" != maxWidth) {
      // height: divide the width into thirds and subtract out the margins
      var maxHeight = parseInt(maxWidth) / 3 - 28;
      var height = Math.ceil(rows.width() / 3 - 28);
      heightPercent = height / maxHeight;
    }
    rows.each(function(index) {
        $(this).find(".cf-ar-1x1, .cf-ar-2x1")
          .each(function() {
            $(this).css("font-size", baseFontSize1Px * heightPercent);
            $(this).find(".card-copy-panel, .card-media-panel")
              .each(function() {
                $(this).outerHeight(height ? height : "auto");
              }); 
          });
        $(this).find(".cf-ar-2x2")
          .each(function() {
            $(this).css("font-size", baseFontSize2Px * heightPercent);
            $(this).find(".card-copy-panel, .card-media-panel")
              .each(function() {
                $(this).outerHeight(height ? (height * 2 + 14) : "auto");
              }); 
          });
    });
  };

