'use strict;'

var searchMode = 'none';

function initMenu() {
    $( "#explore>*" ).clone(true).appendTo( "#explore-xs" );
}

function toggleSearchMode(mode) {
    if (mode === searchMode) {
        searchMode = 'none';
    } else {
        searchMode = mode;
    }
    switch (searchMode) {
        case 'search':
            $('.row.header-ext').show();
            $('#explore-xs').hide();
            $('#search-div').show();
            break;
        case 'topics':
            $('.row.header-ext').show();
            $('#explore-xs').show();
            $('#search-div').hide();
            break;
        default:
            $('.row.header-ext').hide();
            $('#search-div').hide();
            $('#explore-xs').hide();
            break;
    }
    $('#burger-menu .nav-item').each(function() {
        if ($(this).hasClass(searchMode)) {
            $(this).addClass('selected');
        } else {
            $(this).removeClass('selected');
        }
    });
    padBodyTop();
}

function adjustHeaderWidth() {
    var bodyWidth = $('body').width();
    var headerWidth = $('#header').width();
    var cssRight =  parseInt($('#header').css('right'));
    if (headerWidth != bodyWidth) {
        $('#header').css('right', (cssRight + headerWidth - bodyWidth)+'px');
    }
}

function padBodyTop() {
    $('body').css('padding-top', $('#header').height() + 5);
}

var timer;
$().ready(function() { 
    initMenu(); 
    adjustHeaderWidth();
    padBodyTop();
    $(window).resize(function() {
      clearTimeout(timer);
      timer = setTimeout(function() {
          adjustHeaderWidth();
          padBodyTop();
      }, 250);
    });
});