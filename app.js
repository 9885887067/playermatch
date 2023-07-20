const express = require("express");
const path = require("path");

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const app = express();

const dbPath=path.join(__dirname,"cricketMatchDetails.db")
let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

const dbObjTodbRes=(dbObj)=>{
    return {
            playerId:dbObj.player_id,
            playerName:dbObj.player_name   
    }
}
app.get("/players/", async (request, response) => {
  const getQuery = `
    SELECT
      *
    FROM
      player_details
    ORDER BY
      player_id;`;
  const array = await db.all(getQuery);
  response.send(array.map((eachArr)=>
    dbObjTodbRes(eachArr) 
    )
  );
});

const convertTOdbObj=(dbObj)=>{
    return {
            playerId:dbObj.player_id,
            playerName:dbObj.player_name
    }
}

app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const getQuery = `
    SELECT
      *
    FROM
      player_details
    WHERE
      player_id = ${playerId};`;
  const player = await db.get(getQuery);
  response.send(convertTOdbObj(player))
});


app.put("/players/:playerId/",async(request,response)=>{
    const {playerId}=request.params;
    const {
        playerName
    }=request.body
    const updateQuery=`
    UPDATE player_details SET
    
    player_name='${playerName}'
    
    WHERE player_id=${playerId};
    `;

    await db.run(updateQuery)
    response.send("Player Details Updated")
})

const updateMatch=(dbObj)=>{
    return {
        matchId:dbObj.match_id,
        match:dbObj.match,
        year:dbObj.year
    }
}

app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;
  const getQuery = `
    SELECT
      *
    FROM
      match_details
    WHERE
      match_id = ${matchId};`;
  const match = await db.get(getQuery);
  response.send(updateMatch(match));
});


const convertToMatch=(dbObj)=>{
    return {
        matchId:dbObj.match_id,
        match:dbObj.match,
        year:dbObj.year
    }
}
app.get("/players/:playerId/matches", async (request, response) => {
  const { playerId } = request.params;
  const getQuery = `
    SELECT
      *
    FROM
      player_match_score NATURAL JOIN match_details
    WHERE
      player_id = ${playerId};`;
  const match = await db.all(getQuery);
  response.send(match.map((eachMatch)=>
  convertToMatch(eachMatch)
  )
  );
});

app.get("/matches/:matchId/matches", async (request, response) => {
  const { matchId } = request.params;
  const getQuery = `
    SELECT
      *
    FROM
      player_match_score NATURAL JOIN player_details
    WHERE
      match_id = ${matchId};`;
  const match = await db.all(getQuery);
  response.send(match.map((eachMatch)=>
  convertToMatch(eachMatch)
  )
  );
});


app.get("/players/:playerId/playerScores",async(request,response)=>{
  const {playerId}=request.params

  const getQuery=`
  SELECT 
  player_details.player_id as playerId,
  player_details.player_name as playerName,
  SUM(player_match_score.score) AS totalScore,
  SUM(fours) AS totalFours,
  SUM(sixes) AS totalSixes
   FROM 
  player_details INNER JOIN player_match_score ON
    player_details.player_id = player_match_score.player_id
    WHERE player_details.player_id=${playerId};
  `;
  const dbRes=await db.get(getQuery)
  response.send(dbRes)
})

module.exports=app;
