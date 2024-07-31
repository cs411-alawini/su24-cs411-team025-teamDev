const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql2');
const path = require('path');

const app = express();

// MySQL connection
const db = mysql.createConnection({
    host: '35.238.83.157',
    user: 'root',
    password: 'test1234', // Replace with your MySQL password
    database: 'cs411_database' // Replace with your database name
});

db.connect ;

// Set up ejs view engine
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));

/* GET home page */
app.get('/', function(req, res) {
    res.render('index', { title: 'Home' });
});

/* GET fan board page */
app.get('/fanboard', function(req, res) {
    res.render('fanboard', { title: 'Fan Board' });
});

/* GET player search page */
app.get('/playersearch', function(req, res) {
    res.render('playersearch', { title: 'Player Search' });
});


/************************ FAN BOARD PAGE FUNCTIONS ***********************************/
app.post('/fanboard/submit', (req, res) => {
    const { username, player, team } = req.body;

    // Insert into UserData
    const playerSql = 'INSERT INTO UserData (UserId, PlayerId, TeamName) VALUES (?, ?, ?)';
    db.query(playerSql, [username, player, team], (err, result) => {
        if (err) {
            console.error('Error inserting data into UserData:', err);
            res.status(500).send({ 'message': 'Error inserting data into UserData' });
            return;
        }
        console.log('Data inserted into UserData:', result);
	res.sendStatus(200);
    });
});

app.get('/view-board', (req, res) => { 
    const sql = `SELECT p2.UserId, p1.PlayerName, p2.TeamName
		 FROM Players p1 RIGHT JOIN UserData p2 ON p2.PlayerId = p1.PlayerId
    `;
    db.query(sql, (err, results) => {
        if (err) {
            console.error('Error fetching data:', err);
            res.status(500).send({ 'message': 'Error fetching data' });
            return;
        }
        res.json(results);
	console.log(JSON.stringify(results));
    });
});

app.delete('/fanboard/delete/:id', (req, res) => {
    const id = req.params.id;

    // Delete from UserLikedPlayers
    const playerSql = 'DELETE FROM UserData WHERE UserId = ?';
    db.query(playerSql, [id], (err, result) => {
        if (err) {
            console.error('Error deleting data from UserData:', err);
            res.status(500).send({ 'message': 'Error deleting data from UserData' });
            return;
        }
        console.log('Data deleted from UserData:', result);
	res.sendStatus(200);
    });
});

app.post('/fanboard/update/:id', (req, res) => {
    const { username, player, team } = req.body;

    // Update from UserLikedPlayers
    const playerSql = 'UPDATE UserData SET PlayerId = ?, TeamName = ?  WHERE UserId = ?';
    db.query(playerSql, [player, team, username], (err, result) => {
        if (err) {
            console.error('Error updating data from UserData:', err);
            res.status(500).send({ 'message': 'Error updating data from UserData' });
            return;
        }
        console.log('Data updated from UserData:', result);
	res.sendStatus(200);
    });
});

/*************************END OF FAN BOARD PAGE FUNCTIONS***************************/
/***Search **/

app.get('/api/search', function(req, res) {
    const {
        type,
        stadium,
        attendance,
        team,
        goalsScored,
        assists,
        position,
        appearances,
        cleanSheets,
        team_name,
        goal_difference
    } = req.query;

    let sql = '';
    let filters = [];

    switch(type) {
        case 'matches':
            sql = 'SELECT * FROM MatchGameHistory WHERE 1=1';
            if (stadium) filters.push(`Stadium LIKE '%${stadium}%'`);
            if (attendance) filters.push(`Attendance >= ${attendance}`);
            break;

        case 'players':
            sql = 'SELECT * FROM Players WHERE 1=1';
            if (team) filters.push(`Team LIKE '%${team}%'`);
            if (goalsScored) filters.push(`GoalsScored >= ${goalsScored}`);
            if (assists) filters.push(`Assists >= ${assists}`);
            if (position) filters.push(`Position LIKE '%${position}%'`);
            if (appearances) filters.push(`Appearances >= ${appearances}`);
           
            if (cleanSheets) filters.push(`CleanSheets >= ${cleanSheets}`);
            break;

        case 'teams':
            sql = 'SELECT * FROM Teams WHERE 1=1';
            if (team_name) filters.push(`TeamName LIKE '%${team_name}%'`);
            if (goal_difference) filters.push(`Wins >= ${goal_difference}`);
            break;

        default:
            res.status(400).send({ message: 'Invalid search type' });
            return;
    }

    if (filters.length > 0) {
        sql += ' AND ' + filters.join(' AND ');
    }
sql+=';' ;
    db.query(sql, function(err, results) {
        if (err) {
            console.error('Error fetching data:', err);
            res.status(500).send({ message: 'Error fetching data', error: err });
            return;
        }
        res.json(results);
});
});

/** search ends **/
/**trivia starts **/
                                                                                                         
                                                                              
/* GET trivia page */
app.get('/trivia', function(req, res) {
    const triviaList = [
        { id: 1, question: 'Selecting teams that are above average in attacking and defending capability' },
        { id: 2, question: 'Union of above average offensive and defensive players' },
        { id: 3, question: 'Comparison of teams at home vs away' },
        { id: 4, question: 'Characterizing teams as either offensive or defense' },
    ];
    res.render('trivia', { title: 'Trivia', triviaList });
});

/* POST trivia detail */
app.post('/trivia/detail', function(req, res) {
    const triviaId = req.body.triviaId;
    console.log('Received request for triviaId:', triviaId); // Debugging log
    let sql = '';

    switch (triviaId) {
        case '1':
            sql = `SELECT * 
                   FROM
                       (SELECT TeamName, SUM(CleanSheets) as TotalCleanSheets
                       FROM Players p RIGHT JOIN Teams t ON p.Team = t.TeamName
                       GROUP BY TeamName
                       HAVING TotalCleanSheets > (SELECT AVG(total) 
                                                 FROM (SELECT SUM(CleanSheets) AS total 
                                                       FROM Players p RIGHT JOIN Teams t ON p.Team = t.TeamName 
                                                       GROUP BY TeamName) sub0)) sub1
                   NATURAL JOIN
                       (SELECT TeamName, SUM(GoalsScored) AS TotalGoals, SUM(Assists) AS TotalAssists
                       FROM Players p RIGHT JOIN Teams t ON p.Team = t.TeamName
                       GROUP BY TeamName
                       HAVING TotalGoals > (SELECT AVG(total) 
                                            FROM (SELECT SUM(GoalsScored) AS total 
                                                  FROM Players p RIGHT JOIN Teams t ON p.Team = t.TeamName 
                                                  GROUP BY TeamName) sub0)
                       AND TotalAssists > (SELECT AVG(total) 
                                           FROM (SELECT SUM(Assists) AS total 
                                                 FROM Players p RIGHT JOIN Teams t ON p.Team = t.TeamName 
                                                 GROUP BY TeamName) sub0)) sub2;`;
            break;
        case '2':
            sql = `(SELECT PlayerName, GoalsScored, Assists, CleanSheets, Cards, Position
                    FROM Players
                    WHERE GoalsScored > (SELECT AVG(GoalsScored) FROM Players)
                      AND Assists > (SELECT AVG(Assists) FROM Players)
                      AND Appearances > (SELECT AVG(Appearances) FROM Players)
                      AND Cards < (SELECT AVG(Cards) FROM Players)
                      AND Position IN ('Forward'))
                   UNION
                   (SELECT PlayerName, GoalsScored, Assists, CleanSheets, Cards, Position
                    FROM Players
                    WHERE CleanSheets > (SELECT AVG(CleanSheets) FROM Players)
                      AND Appearances > (SELECT AVG(Appearances) FROM Players)
                      AND Cards < (SELECT AVG(Cards) FROM Players)
                      AND Position IN ('Defender', 'Goalkeeper'));`;
            break;
        case '3':
            sql = `SELECT TeamName, AvgGoalDifferentialHome, AvgGoalDifferentialAway
                   FROM (SELECT TeamName, ((SUM(HomeTeamGoals) - SUM(AwayTeamGoals)) / COUNT(GameId)) AS AvgGoalDifferentialHome
                         FROM Teams t RIGHT JOIN MatchGameHistory m ON t.TeamName = m.HomeTeam
                         GROUP BY TeamName) sub1 
                         NATURAL JOIN 
                         (SELECT TeamName, ((SUM(AwayTeamGoals) - SUM(HomeTeamGoals)) / COUNT(GameId)) AS AvgGoalDifferentialAway

   FROM Teams t RIGHT JOIN MatchGameHistory m ON t.TeamName = m.AwayTeam
                         GROUP BY TeamName) sub2;`;
            break;
        case '4':
            sql = `SELECT TeamName, (NumOffensePlayers - NumDefensePlayers) AS OffenseDefenseRating
                   FROM (SELECT TeamName, COUNT(PlayerId) AS NumOffensePlayers
                         FROM Players p RIGHT JOIN Teams t ON p.Team = t.TeamName
                         WHERE p.PlayerId IN (SELECT PlayerId FROM Players p1 WHERE GoalsScored > (SELECT AVG(GoalsScored) FROM Players) 
                         OR Assists > (SELECT AVG(Assists) FROM Players))
                         GROUP BY TeamName) sub1
                         NATURAL JOIN
                         (SELECT TeamName, COUNT(PlayerId) AS NumDefensePlayers
                         FROM Players p RIGHT JOIN Teams t ON p.Team = t.TeamName
                         WHERE p.PlayerId IN (SELECT PlayerId FROM Players p1 WHERE CleanSheets > (SELECT AVG(GoalsScored) FROM Players))
                         GROUP BY TeamName) sub2;`;
            break;
        default:
            res.status(400).send({ message: 'Invalid trivia ID' });
            return;
    }

    connection.query(sql, function(err, results) {
        if (err) {
            console.error('Error fetching trivia detail:', err);
            res.status(500).send({ message: 'Error fetching trivia detail', error: err });
            return;
        }
        res.json({ results });
    });
});


/** trivia ends **/
app.listen(80, function () {
    console.log(`Node app is running on port 80`);
});
