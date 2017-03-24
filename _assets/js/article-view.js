'use strict';

var articleMap = {};

/**
 * Load the metadata for current articles.
 */
function initArticles() {
    $.get("feeds/current-articles.json", function (data) {
        data.forEach(function(article) {
            loadArticle(article.url, function(json) {
                articleMap[json.article_id] = json;
            });
        });
    });
}
 /**
  * Read and parse a specially formatted article document containing
  * JSON metadata and (optionally) HTML content for article and footer.
  * @param {String} url location of the article document
  * @param {function(Object)} callback function to call on completion
  */
function loadArticle(url, callback) {
    $.get(url, function(data) {
        var dataSections = data.split("--- content-begin");
        var json = JSON.parse(dataSections[0]);
        var contentSections = dataSections[1].split("--- footer-begin");
        json.content = contentSections[0].trim();
        json.footer = contentSections[1].trim();
        if (callback) {
            callback(json);
        }
    }, "text");
}

/**
 * For each property in the data object, replace tokens of $(property_name)
 * in the template with the value of the property.
 * Returns a new string, template is not changed.
 * @param {String} template HTML (or other string)
 * @param {Object} data any object with fields related to the tokens in the template
 */
function populateTemplate(template, data) {
    if (data.source == 'internal') {
        template = template.replace('${link}', "javascript:viewArticle('"+data.article_id.trim()+"');");
    }
    for (var property in data) {
        if (data.hasOwnProperty(property)) {
            template = template.replace('${'+property+'}', data[property]);
        }
    };
    return template;
}

/**
 * Populate the #article-view DOM with content from a previously
 * loaded article then switch the page to #article-view
 * @param {String} article_id 
 */
function viewArticle(article_id) {
    var article = articleMap[article_id];
    $('#article-view .pmd-card-title-text').html(article.title);
    $('#article-view .pmd-card-body').children().remove();
    $('#article-view .pmd-card-body').html(article.content);
    $('#article-view .footer').children().remove();
    $('#article-view .footer').html(article.footer);
    location.hash = 'article-view';
}

/** switch the view to #main */
function viewMain() {
    location.hash = 'main';
}

/** store the scroll position for returning from the article view */
var returnScrollPos = 0;
/**
 * Toggle the article view and main view.  The article view should be
 * populated first: see viewArticle().
 * @param {boolean} show True shows the article, false shows main.
 */
function showArticle(show) {
    if (show) {
        $('#main').css('display', 'none');
        $('#article-view').css('display', 'block');
        returnScrollPos = $('body').scrollTop();
        console.log('current scroll: '+returnScrollPos);
        window.scrollTo(0, 0);
    } else {
        $('#article-view').css('display', 'none');
        $('#main').css('display', 'block');
        adjustRowHeight();
        console.log('returning to: '+returnScrollPos);
        window.scrollTo(0, returnScrollPos - $('#header').height());
    }
}

$().ready(function() { 
    location.hash = 'main';
    initArticles(); 
    var closeBtn = $('#article-view .pmd-card-media button');
    closeBtn.css('margin-left', -(closeBtn.outerWidth()+1));
});

/**
 * Use a simple hash operation to handle the back button on the article-view
 */
window.onhashchange = function() {
    switch (location.hash) {
        case '#main':
            showArticle(false);
            break;
        case '#article-view':
            showArticle(true);
            break;
    }
}