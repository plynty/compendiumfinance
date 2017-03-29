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
    baseFontSize1Px = parseFloat($(".card-height-1").css("font-size"));
    baseFontSize2Px = parseFloat($(".card-height-2").css("font-size"));
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
        $(this).find(".card-height-1")
          .each(function() {
            $(this).css("font-size", baseFontSize1Px * heightPercent);
          });
        $(this).find(".card-height-2")
          .each(function() {
            $(this).css("font-size", baseFontSize2Px * heightPercent);
          });
        $(this).find(".card-height-1 .card-copy-panel, .card-height-1 .card-media-panel")
          .each(function() {
            $(this).outerHeight(height ? height : "auto");
          }); 
        $(this).find(".card-height-2 .card-copy-panel, .card-height-2 .card-media-panel")
          .each(function() {
            $(this).outerHeight(height ? (height * 2 + 14) : "auto");
          }); 
    });
  };

