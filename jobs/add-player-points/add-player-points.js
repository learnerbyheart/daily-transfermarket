'use strict';

const comunio = require('comunio');
const seneca = require('seneca')();
const dbApi = seneca.client(10102);
const statsUrl = 'http://stats.comunio.de/profil.php?id=';
const cheerio = require('cheerio');
const rp = require('request-promise');

//1. get all comunio player ids and also save db id
dbApi.act('role:database,players:get', (err, res) => {
    if(err) return console.error(err);

    //reduce each player information to only complayerid and id
    Q.all(res
        .map(player => ({id: player.id, complayerid: player.complayerid}))
        //2. get html via request
        .map(player => {
            return rp(statsUrl + player.complayerid)
                .then(html => {
                    return getPlayerStatsFromHtml(html).map(gameStat => Object.assign({}, gameStat, {id: player.id}));
                });
        }))
    .then(gameStats => {
        gameStats
            .reduce((previous, next) => previous.concat(next))
            .forEach(gameStat => {
                //4. save it in db
            })
    }).catch(err => console.error(err));
});

//3. get points, goals, cards, substitution-in, substitution-out, opponent, home, score-home, score-away for each game day
function getPlayerStatsFromHtml(html) {
    const playerStats = [];
    const $ = cheerio.load(html);
    $('div.tablebox').last().find('table tr').slice(1).each(function(idx, element) {
        const gameStats = $(this).children();
        const gameDay = Number(gameStats.eq(0).text());
        //if gameStats.eq(1).text() == "" then it will be evaluated to 0
        const goals = Number(gameStats.eq(1).text());
        const cards = gameStats.eq(2).find('img').length == 0 ? undefined : gameStats.eq(2).find('img').attr('alt');
        const subIn = Number(gameStats.eq(3).text()) == 0 ? undefined : Number(gameStats.eq(3).text());
        const subOut = Number(gameStats.eq(4).text()) == 0 ? undefined : Number(gameStats.eq(4).text());
        const points = gameStats.eq(5).text() == "-" ? undefined : Number(gameStats.eq(5).text());
        const opponent = Number(gameStats.eq(6).children().attr('href').replace('/squad/','').replace(/-.+/g, ''));
        const home = gameStats.eq(7).text() == "h" ? true : gameStats.eq(7).text() == "a" ? false : undefined;
        const result = gameStats.eq(8).text().split(':');
        const homeScore = Number(result[0]);
        const awayScore = Number(result[1]);
        playerStats.push({gameDay, goals, cards, subIn, subOut, points, opponent, home, homeScore, awayScore});
    });
    return playerStats;
}