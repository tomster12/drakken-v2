
// #region - Modules

let sock = require("socket.io");
let http = require("http");
let path = require("path");
let fs = require("fs");

// #endregion


// #region - HTTP Handle Request

function handleRequest(req, res) {
  let pathname = req.url;
  if (pathname == "/") {pathname = "/index.html";}


  let ext = path.extname(pathname);
  let typeExt = {
    ".html": "text/html",
    ".js":   "text/javascript",
    ".css":  "text/css"
  };
  let contentType = typeExt[ext] || "text/plain";


  fs.readFile(__dirname + pathname,
    function (err, data) {
      if (err) {
        res.writeHead(500, {"Content-Type": "text/Plain"});
        return res.end("Error loading " + pathname);
      }
      res.writeHead(200, {"Content-Type": contentType});
      res.end(data);
    }
  );
}

// #endregion


// #region - HTTP Setup Server

var server = http.createServer(handleRequest);
server.listen(3000);
console.log("Server started on port 3000");

// #endregion



// #region - Socket IO

let io = sock.listen(server);
io.sockets.on("connection", function (socket) {
    console.log("Client connected: " + socket.id);

    socket.on("debug", function(data) {
      console.log("Debug: " + data);
    });


    // #region - history

    socket.on("historySend", (data) => {historySendRequest(socket, data);});

    // #endregion


    // #region - Game

    socket.on("gameConnectRequest", (data) => {gameConnectRequest(socket, data);});


    // socket.on("gameLockin", function() {
      //   console.log("Received lock");
      //   lockCount++;
      //   let player = socket==players[0]?"Player 1":"Player 2";
      //   historySend({"text": (player + " locked in"), "formatting": {}});
      //   if (lockCount == 2) setTimeout(gameTurn, 1000);
      // });
      //
      //
      // socket.on("gameTokenUsed", function(data) {
        //   console.log("Token used: " + data.name);
        //   if (socket == players[0]) players[1].emit("gameTokenUsed", data);
        //   if (socket == players[1]) players[0].emit("gameTokenUsed", data);
        // });
        //
        //
        // socket.on("gameScoreUpdateSend", function(data) {
          //   if (socket == players[0]) players[1].emit("gameScoreUpdateReceive", data);
          //   if (socket == players[1]) players[0].emit("gameScoreUpdateReceive", data);
          // });
          //
          //
          // socket.on("gameTurnRoll", function(data) {
            //   if (socket == players[0]) playersRoll[0] = data;
            //   if (socket == players[1]) playersRoll[1] = data;
            //   if (playersRoll[0] != null && playersRoll[1] != null) {
              //     gameTurnScores();
              //   }
              // });

              // #endregion


    // #region - Chat

    socket.on("chatRequestNickname", function(data) {
      chatInfo[socket.id] = {
        "nickname":data,
        "chatColor": [Math.random()*255, Math.random()*255, Math.random()*255]
      };
      console.log("Nickname assigned: " + socket.id + " -> " + chatInfo[socket.id].nickname);
      console.log("Color assigned: " + socket.id + " -> " + chatInfo[socket.id].chatColor);
      socket.emit("chatUpdateData", chatInfo[socket.id]);
      socket.join("chatRoom");

      socket.emit("chatReceiveMessage", {
        "message": "Set nickname to '" + data + "'",
        "chatColor": null
      });
    });


    socket.on("chatRequestColorChange", function(data) {
      chatInfo[socket.id].chatColor = [Math.random()*255, Math.random()*255, Math.random()*255];
      console.log("Color changed: " + socket.id + " -> " + chatInfo[socket.id].chatColor);
      socket.emit("chatUpdateData", chatInfo[socket.id]);

      socket.emit("chatReceiveMessage", {
        "message": "Changed color",
        "chatColor": null
      });
    });


    socket.on("chatSendMessage", function(data) {
      io.to("chatRoom").emit("chatReceiveMessage", {
        "message":(chatInfo[socket.id].nickname+": " + data),
        "chatColor":(chatInfo[socket.id].chatColor)
      });
    });

    // #endregion


    socket.on("disconnect", function() {
      console.log("Client disconnected: " + socket.id);

      let removed = false;
      for (let i = 0 ; i < players.length; i++) {
        if (players[i] == socket) {
          console.log("Player disconnected: " + socket.id);
          gameEnd("Player disconnect");
          break;
        }
      }
    });
  }
);

// #endregion



// #region - History

function historySendRequest(data) {
  if (socket == players[0]) data.formatting.serverColor = [34, 117, 246];
  if (socket == players[1]) data.formatting.serverColor = [152, 40, 40];
  players[0].emit("historyReceive", data);
  players[1].emit("historyReceive", data);
}

// #endregion


// #region - Chat

// #endregion


// #region - Game

let players = [];
// let playersRoll = [];
// let lockCount = 0;
// let turnCount = 1;
// let chatInfo = {};


function gameConnectRequest(socket, data) {
  let accepted = players.length < 2;

  if (accepted) {
    socket.emit("gameConnectResponse", {"accepted": true, "playerNum": players.length});
    players.push(socket);
    if (players.length == 2) gameStart();
    console.log("Player connection accepted: " + socket.id);

  } else {
    socket.emit("gameConnectResponse", {"accepted": false, "playerNum": -1});
    console.log("Player connection denied: " + socket.id);
  }
}

// function gameStart() {
//   lockCount = 0;
//   turnCount = 1;
//   players[0].emit("gameStart");
//   players[1].emit("gameStart");
//   historySend({"text": ("        - Turn "+turnCount+"-"), "formatting": {"size": 35}});
//   console.log("Game started");
// }
//
//
// function gameTurn() {
//   turnCount++;
//   console.log("End of turn");
//   players[0].emit("gameTurn", {"turn": turnCount});
//   players[1].emit("gameTurn", {"turn": turnCount});
//   lockCount = 0;
// }
// function gameTurnScores() {
//   let col;
//   if (playersRoll[0] > playersRoll[1]) {
//     historySend({"text": ("Player 1 won the round!"), "formatting": {}});
//     col = [34, 117, 246];
//     players[0].emit("gameTurnWin");
//   } else {
//     historySend({"text": ("Player 2 won the round!"), "formatting": {}});
//     col = [152, 40, 40];
//     players[1].emit("gameTurnWin");
//   }
//   historySend({"text": ("Bonus 10 score"), "formatting": {"serverColor": col}});
//   historySend({"text": ("("+playersRoll[0]+" - "+playersRoll[1]+")"), "formatting": {"serverColor": col}});
//   historySend({"text": ("        - Turn "+turnCount+"-\n"), "formatting": {"size": 35}});
//   playersRoll = [];
// }


function gameEnd(reason) {
  // if (players[0] != null) players[0].emit("gameEnd", reason);
  // if (players[1] != null) players[1].emit("gameEnd", reason);
  players = [];
  console.log("Game Ended");
}

// #endregion
