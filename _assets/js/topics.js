var articleMap;
var articleTemplate;

function initTopics() {
    articleMap = {};
    $.get("feeds/topics.json", function (data) {
        data.forEach(function(article) {
            var topic = article.heading;
            if (!articleMap[topic]) {
                articleMap[topic] = [];
            }
            articleMap[topic].push(article.url);
        });
    });
    $.get("tmpl/article-search-result.html", function(data) {
        articleTemplate = data;
    }, "html");
}

function changeTopic(topicName, topic) {
    $('#current-topic').text(topicName);

    if (topic === 'current') {
        $('#article-cards').css('display', 'block');
        $('#search-result').css('display', 'none');
    } else {
        $('#article-cards').css('display', 'none');
        $('#search-result').children().remove();
        $('#search-result').css('display', 'block');
        articleMap[topicName].forEach(function(url) {
            console.log('need to load '+url);
            $.get(url, function(data) {
                console.log('loaded '+url+': '+JSON.stringify(data, null, 2));
                var html = articleTemplate;
                for (var property in data) {
                    if (data.hasOwnProperty(property)) {
                        html = html.replace('{{'+property+'}}', data[property]);
                    }
                };
                console.log(html);
                $('#search-result').append(html);
            }, "json");
        });
    }


}