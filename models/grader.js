'use strict';

const Ranking = require('../models/ranking');

module.exports = {

    async grade(points, errors, maxPoints, id, userName) {

        //Count the grade
        const total = points + errors;
        let finalScore = 0;

        if(total === 0) {
            finalScore = 0;
        } else {
            finalScore = Math.round( points / total * maxPoints);
        }

        //Save rankingdata to the database
        const rankings = await Ranking.find().exec();
        const gameScoreObject = {
            player: userName,
            rights: points,
            wrongs: errors,
            grade: finalScore
        };

        const data = {
            game: id,
            gameScore: [{
                player: userName,
                rights: points,
                wrongs: errors,
                grade: finalScore
            }]
        };
        let found = false;
        for (let i = 0; i< rankings.length; ++i) {
            if (rankings[i].game === id) {
                const unsortedLeaderboards = rankings[i].gameScore;
                const sortedLB = sortTopTen(unsortedLeaderboards, gameScoreObject);
                await Ranking.updateOne(
                    {_id: rankings[i].id},
                    {$set: {'gameScore': sortedLB } });
                found = true;
                break;
            }
        }
        if (!found) {
            await Ranking.create(data);
        }
        return finalScore;
    }

};

//Function to sort the games leaderboards with the new entry
function sortTopTen(scoreBoard, newEntry) {
    for (let i = 0; i < scoreBoard.length; ++i) {
        if(newEntry.grade >= scoreBoard[i].grade) {
            if(i === 0) {
                scoreBoard.unshift(newEntry);
            } else {
                scoreBoard.splice(i, 0, newEntry);
            }
            if(scoreBoard.length > 10) {
                scoreBoard.pop();
            }

            return scoreBoard;
        }
    }
    return scoreBoard;
}
