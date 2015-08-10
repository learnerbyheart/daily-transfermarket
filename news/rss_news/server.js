var rss = require('./rss.js'),
	FeedParser = require('feedparser'),
	kickerRssUrl = 'http://rss.kicker.de/news/bundesliga';

function fetchKickerFeeds() {
	var feedparser = new FeedParser(),
		result = [];

	feedparser.on('error', done);
	feedparser.on('end', function() {
		// TODO save in db
		console.log(result);
		process.exit();
	});

	feedparser.on('readable', function() {
		var post;
		while (post = this.read()) {
			var title = post.title,
				description = post.summary,
				link = post.link,
				categories = post.categories,
				pubDate = post.pubDate,
				date = post.date;
			result.push({
				title: title,
				description: description,
				link: link,
				categories: categories,
				pubDate: pubDate,
				date: date
			});
		}
	});

	rss.fetchRss(kickerRssUrl, feedparser);
}

function done(err) {
  if (err) {
    console.log(err, err.stack);
    return process.exit(1);
  }
  process.exit();
}

fetchKickerFeeds();