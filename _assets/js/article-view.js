'use strict';

var articleMap = {};
var viewingArticle = null;

/**
 * Load the metadata for current articles.
 */
function initArticles(callback) {
    $.get("feeds/current-articles.json", function (data) {
        data.forEach(function(article) {
            loadArticle(article.url, function(json) {
                articleMap[json.article_id] = json;
                if (callback) {
                    callback(json.article_id);
                }
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
        var dataSections = data.split("--- field:");
        var json = JSON.parse(dataSections[0]);
        for (var i = 1; i < dataSections.length; i++) {
            var delimIdx = dataSections[i].indexOf(':');
            var field = dataSections[i].substr(0, delimIdx);
            var value = dataSections[i].substr(delimIdx+1).trim();
            if (value.length > 0) {
                json[field] = value;
            }
        }
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
    if (!data.link && data.source == 'internal') {
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
    if (article.author && article.author.trim().length > 0) {
        $('#article-view .author').html(article.author);
        $('#article-view .author').show();
        $('#article-view a.author-link').click(function() {filterByAuthor(article.author); return false;});
    } else {
        $('#article-view .author').hide();
    }
    if (article.banner_img.trim().length > 0) {
        $('#article-view .pmd-card-media img').attr('src', article.banner_img.trim());
        $('#article-view .pmd-card-media').show();
        $('#article-view .pmd-card-no-media').hide();
    } else {
        $('#article-view .pmd-card-media').hide();
        $('#article-view .pmd-card-no-media').show();
    }
    $('#card-body').children().remove();
    $('#card-body').html(article.content);
    $('#article-view .footer').children().remove();
    $('#article-view .footer').html(article.footer);
    $('#card-body').attr('class', article.format_class);
    location.hash = 'article-view--'+article_id;
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
        returnScrollPos = $('body').scrollTop() || $(window).scrollTop();
        window.scrollTo(0, 0);
        var closeBtn = $('#article-view .pmd-card-media button');
        closeBtn.css('margin-left', -(closeBtn.outerWidth()+1));
    } else {
        $('#article-view').css('display', 'none');
        $('#main').css('display', 'block');
        adjustRowHeight();
        window.scrollTo(0, returnScrollPos - $('#header').height());
    }
}

function articleFromHash() {
    if (location.hash.startsWith('#article-view--')) {
        return location.hash.substring('#article-view--'.length);
    }
    return null;
}

function hashChange() {
    var articleId = articleFromHash();
    if (articleId) {
        if (viewingArticle !== articleId) {
            viewArticle(articleId);
        }
        showArticle(true);
    }
    else {
        viewingArticle = null;
        showArticle(false);
    }
}
/**
 * Use a simple hash operation to handle the back button on the article-view
 */
window.onhashchange = hashChange;

$().ready(function() { 
    viewingArticle = articleFromHash();
    initArticles(function(loadedArticleId) {
        if (viewingArticle && viewingArticle === loadedArticleId) {
            viewArticle(viewingArticle);
            showArticle(true);
        }
    }); 
    hashChange();
});

