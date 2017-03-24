var topicMap;
var articleTemplate;

function initTopics() {
    topicMap = {};
    $.get("feeds/article-search.json", function (data) {
        data.forEach(function(article) {
            var topic = article.heading;
            if (!topicMap[topic]) {
                topicMap[topic] = {};
            }
            topicMap[topic][article.article_id] = article;
        });
    });
    $.get("tmpl/article-search-result.html", function(data) {
        articleTemplate = data;
    }, "html");
}

function changeTopic(topicName, topic) {
    $('#current-topic').text(topicName);

    if (topic === 'current') {
        showCurrent();
    } else {
        $('#search-result').children().remove();
        showResult();
        for (var articleId in topicMap[topicName]) {
            var article = topicMap[topicName][articleId];
            loadArticle(article.url, function(data){
                articleMap[data.article_id] = data;
                var html = populateTemplate(articleTemplate, data)
                $('#search-result').append(html);
            })
        };
    }
}

function showCurrent() {
    showArticle(false);
    $('#search-result').css('display', 'none');
    $('#article-cards').css('display', 'block');
}
function showResult() {
    showArticle(false);
    $('#article-cards').css('display', 'none')
    $('#search-result').css('display', 'block');
}

$().ready(function() { initTopics(); });