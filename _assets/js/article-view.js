var articleMap = {};

function loadArticle(url, callback) {
    console.log('need to load '+url);
    $.get(url, function(data) {
        console.log('loaded '+url+': '+data);
        var dataSections = data.split("--- content-begin");
        var json = JSON.parse(dataSections[0]);
        var contentSections = dataSections[1].split("--- footer-begin");
        json.content = contentSections[0].trim();
        json.footer = contentSections[1].trim();
        callback(json);
    }, "text");
}

function populateTemplate(template, data) {
    if (data.source == 'internal') {
        template = template.replace('${link}', "javascript:viewArticle('"+data.article_id.trim()+"');");
    }
    for (var property in data) {
        if (data.hasOwnProperty(property)) {
            template = template.replace('${'+property+'}', data[property]);
        }
    };
    console.log(template);
    return template;
}

function viewArticle(article_id) {
    var article = articleMap[article_id];
    console.log("viewing article: "+article.article_id);
    $('#article-view .pmd-card-title-text').html(article.title);
    $('#article-view .pmd-card-body').children().remove();
    $('#article-view .pmd-card-body').html(article.content);
    $('#article-view .footer').children().remove();
    $('#article-view .footer').html(article.footer);
    showArticle(true);
}

function viewMain() {
    showArticle(false);
}

function showArticle(show) {
    if (show) {
        $('#main').css('display', 'none');
        $('#article-view').css('display', 'block');
    } else {
        $('#article-view').css('display', 'none');
        $('#main').css('display', 'block');
    }
}