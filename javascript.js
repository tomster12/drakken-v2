

//         TODO
//  Sort out entire token socket system
//  Additional formatting to chat messages
//  Better system to split text based on width
//    that instead splits at the start of words and
//    uses the width of each character to calculate
//  Finish cleaning up and implementing the game screen
//  Fully redo how the tokens send actions over to tell
//    the other client to perform a certain action
// Create more targeted random for random color for chat
// Update history to use a round based system


//        Current problem
//  Alot of positioning of different static  texts and boxes
//  which each require positions / sizes
//  2 options:

//    hard code position into where it is drawn
//    benefits:
//      - dynamic sizing for different size canvases
//        for mobile etc or for easily changing canvas size
//      - easy to add new element to the screen without having
//        large amounts of overhead code for formatting objects
//    drawbacks:
//      - have to find each element to change positioning / formatting

//    put formatting and positioning into the setup of the canvas
//    benefits:
//      - easily change formatting and positioning of all
//        objects on screens from a central location
//    drawbacks:
//      - alot of clutter code that fills up the setup function
//      - takes longer to create a simple text as you need to create
//        the formatting / position object alongside it

//  potential fix would be to have variables before the code block that
//  deals with drawing a specific element that would be easily in the code
//  and also act as semi-centralized locations to change values


// #region - Socket Functions

let socket;
function connectToServer() {
  socket = io.connect();


  // History
  socket.on("historyReceive", (data) => {historyCanvas.receive(data);});

  // Game
  socket.on("gameConnectResponse", (data) => {mainCanvas.screens[CONNECTING].gameConnectResponse(data);});
  socket.on("gameStart", (data) => {mainCanvas.screens[GAME].gameStart(data);});
  socket.on("gameTurn", (data) => {mainCanvas.screens[GAME].gameTurn(data);});
  socket.on("gameTurnWin", (data) => {
    mainCanvas.screens[GAME].scoreInfo.score += 10;
    mainCanvas.screens[GAME].gameScoreUpdateSend("update");
  });
  socket.on("gameTokenUsed", (data) => {mainCanvas.screens[GAME].gameTokenUsed(data);});
  socket.on("gameScoreUpdateReceive", (data) => {mainCanvas.screens[GAME].gameScoreUpdateReceive(data);});
  socket.on("gameEnd", (data) => {mainCanvas.screens[GAME].gameEnd(data);});


  // Chat
  socket.on("chatReceiveMessage", (data) => {chatCanvas.receiveMessage(data)});
  socket.on("chatUpdateData", (data) => {chatCanvas.updateData(data)});
}

// #endregion



// #region - History Canvas

function historyCanvasFunc(canvas) {

  // #region - Setup

  canvas.setup = function() {
    // Setup p5 functions
    canvas.createCanvas(300, 600);
    canvas.textFont(fontBold);

    // Setup variables
    canvas.setupVariables();
  }


  canvas.setupVariables = function() {
    // Setup variables
    canvas.history = [];

    canvas.titleFormatting = {
      "textSize": 45,
      "pos": {"x": canvas.width * 0.5, "y": 50},
      "border": {
        "height": 70,
        "width": 2
      }
    }

    canvas.historyFormatting = {
      "defaultTextSize": 25,
      "formatWidth": 300,
      "pos": {"x": 20, "y": 100},
      "lineDifference": 30,
      "lineLimit": 15
    }
  }


  // #endregion


  // #region - Main

  canvas.draw = function() {
    // Setup main formatting
    canvas.background(colors["tertiary"]);
    canvas.noStroke();

    // Show title
    canvas.fill(colors["secondary"]);
    canvas.textSize(canvas.titleFormatting.textSize);
    canvas.textAlign(CENTER);
    canvas.text("History", canvas.titleFormatting.pos.x, canvas.titleFormatting.pos.y);
    canvas.rect(0, canvas.titleFormatting.border.height, canvas.width, canvas.titleFormatting.border.width);

    // Show history
    let lineCounter = 0;
    for (let i = canvas.history.length - 1; i >= 0; i--) {
      canvas.textSize(canvas.history[i].formatting.size);
      let textToShow = formatTextWidth(canvas.history[i].text, canvas.historyFormatting.formatWidth, canvas);
      canvas.fill(canvas.history[i].formatting.color);
      canvas.text(textToShow, canvas.historyFormatting.pos.x, canvas.historyFormatting.pos.y + lineCounter * canvas.historyFormatting.lineDifference);
      lineCounter += 2 + (textToShow.split("\n").length - 1);
      if (lineCounter > canvas.historyFormatting.lineLimit) break;
    }
  }


  canvas.receive = function(data) {
    // Receive a message from the server an place into list
    canvas.history.push({
      "text": data.text,
      "formatting": {
        "size": data.formatting.size != null ? data.formatting.size : this.historyFormatting.defaultTextSize,
        "color": data.formatting.color != null ? data.formatting.color
          : data.formatting.serverColor != null ? data.formatting.serverColor
          : colors["secondary"]
        }
      });
    }

    // #endregion


  // #region - Input

    canvas.keyPressed = function() {}


    canvas.mousePressed = function() {
      if (insideCanvas(canvas)) {
        focusCanvas(canvas);
        console.log("Focused history");
      }
    }


    canvas.mouseReleased = function() {}

    // #endregion
}

// #endregion


// #region - Main Canvas

function mainCanvasFunc(canvas) {

  // #region - Setup

  canvas.setup = function() {
    // Setup p5 functions
    canvas.createCanvas(800, 800);
    canvas.textAlign(CENTER);
    canvas.textFont(fontBold);
    canvas.textSize(30);
    canvas.imageMode(CENTER);

    // Setup variables
    canvas.setupVariables();
  }

  canvas.setupVariables = function() {
    // Setup screens
    canvas.screens = [
      // #region - Intro
      {

        // #region - Setup

        initialize: function(canvas) {
          this.canvas = canvas;
          this.setupVariables();
        },


        setupVariables: function() {
          console.log("Resetting variables for intro screen");
        },

        // #endregion


        // #region - main

        update: function() {
          // Main formatting
          this.canvas.textFont(fontRegular);
          this.canvas.background(colors["background"]);
          this.canvas.noStroke();

          // Show title and text
          this.canvas.fill(colors["secondary"]);
          this.canvas.textSize(70);
          this.canvas.text("Drakken", this.canvas.width / 2, this.canvas.height / 2 + 10);
          this.canvas.textSize(40);
          this.canvas.text("Press any key to continue...", this.canvas.width / 2, this.canvas.height / 2 + 70);
        },

        // #endregion


        // #region - Input

        keyPressed: function() {},


        mousePressed: function() {
          this.canvas.changeToMenu(null);
        },


        mouseReleased: function() {}

        // #endregion

      },
      // #endregion


      // #region - Menu
      {

        // #region - Setup

        initialize: function(canvas) {
          this.canvas = canvas;
          this.setupVariables();
        },


        setupVariables: function() {
          // Output text for game ending / winning / losing
          this.outputTextInfo = {
            "text": "",
            "time": 0,
            "progress": 0
          };

          // Variables for all classes
          this.classInfo = {
            "classSelected": null,
            "interval": 120,
            "size": 90,
            "alphaLimit": 2.5,
            "posY": this.canvas.height - 100,
            "classList": [],
            "tokenInterval": 100,
            "tokenSize": 70,
          };

          // Variables for the scroll background and bar
          this.scrollInfo = {
            "scrollProgress": 1.5,
            "barPosXStart": 100,
            "barPosXEnd": this.canvas.width - 100,
            "barPosY": this.canvas.height - 15,
            "barSizeY": 10,
            "indicatorWidth": 50,
            "indicatorPos": 100,
            "indicatorSelected": false
          };

          // Additional setup
          for (let i = 0; i < classesData.length; i++)
          this.classInfo.classList.push(new MenuShowClass(this, classesData[i], i));
          this.selectClass(0);
        },

        // #endregion


        // #region - Main

        update: function() {
          this.canvas.background(colors["background"]);

          // Variables for scrollbar
          let bPosXStart = this.scrollInfo.barPosXStart;
          let bPosXEnd = this.scrollInfo.barPosXEnd;
          let bPosY = this.scrollInfo.barPosY;
          let bSizeY = this.scrollInfo.barSizeY;
          let iSelected = this.scrollInfo.indicatorSelected;
          let iWidth = this.scrollInfo.indicatorWidth;

          // If bar selected change indicatorPos and scroll progress based on mouse
          if (iSelected) {
            this.scrollInfo.indicatorPos = constrain(this.canvas.mouseX - iWidth / 2, bPosXStart, bPosXEnd - iWidth);

          } else {
            // Update scrollProgress based on mouse position
            if (this.canvas.mouseY > this.classInfo.posY - this.classInfo.size * 1.5) {
              let amount = map(this.canvas.mouseX - this.canvas.width * 0.5, -125, 125, -1, 1);
              amount = Math.pow(amount, 3) * 1.8;
              this.scrollInfo.indicatorPos += amount;
            }
          }

          // Constrain scrollbar indicator and set progress based on indicator pos
          this.scrollInfo.indicatorPos = constrain(
            this.scrollInfo.indicatorPos,
            bPosXStart, bPosXEnd - iWidth
          );
          this.scrollInfo.scrollProgress = map(
            this.scrollInfo.indicatorPos,
            bPosXStart, bPosXEnd - iWidth, 0,
            this.classInfo.classList.length - 1);
            let pos = this.scrollInfo.indicatorPos;

            // Draw scroll bar
            this.canvas.noStroke();
            this.canvas.fill(colors["tertiary"]);
            this.canvas.ellipse(bPosXStart, bPosY, bSizeY, bSizeY);
            this.canvas.ellipse(bPosXEnd, bPosY, bSizeY, bSizeY);
            this.canvas.rect(bPosXStart, bPosY - bSizeY / 2, bPosXEnd - bPosXStart, bSizeY);

            // Draw scroll indicator
            this.canvas.fill(255);
            this.canvas.ellipse(pos, bPosY, bSizeY, bSizeY);
            this.canvas.rect(pos, bPosY - bSizeY / 2, iWidth, bSizeY);
            this.canvas.ellipse(pos + iWidth, bPosY, bSizeY, bSizeY);

            // Update showClasses
            for (let showClass of this.classInfo.classList)
            showClass.update();

            // Show output text
            if (this.outputTextInfo.text != null) {
              let alpha = this.outputTextInfo.progress / this.outputTextInfo.time;
              alpha = 255 * (1-Math.pow(alpha, 5));
              this.canvas.noStroke();
              alphaFill(this.canvas, colors["secondary"], alpha);
              this.canvas.textFont(fontBold);
              this.canvas.textSize(30);
              this.canvas.text(this.outputTextInfo.text, this.canvas.width / 2, this.canvas.height - 200);

              // Update output text
              this.outputTextInfo.progress++;
              if (this.outputTextInfo.progress > this.outputTextInfo.time) {
                this.outputTextInfo = {
                  "text": "",
                  "time": 0,
                  "progress": 0
                };
              }
            }

            // Show debug information
            if (showDebug) {
              this.canvas.noStroke();
              this.canvas.fill(colors["secondary"]);
              this.canvas.text("focused: " + (focusedCanvas == this.canvas), this.canvas.width * 0.15, 50);
            }
          },


          // Select a showClass
          selectClass: function(classIndex) {
            for (let o = 0; o < this.classInfo.classList.length; o++)
            this.classInfo.classList[o].selected = (o == classIndex);
            this.classInfo.classSelected = this.classInfo.classList[classIndex];
          },

          // #endregion


        // #region - Input

        keyPressed: function(keyCode) {},


        mousePressed: function() {
          // Pressed show class
          for (let i = 0; i < this.classInfo.classList.length; i++) {
            if (this.classInfo.classList[i].ontop()) {
              if (this.classInfo.classList[i].selected) {
                // this.canvas.screens[GAME].currentClass = ----;
                this.canvas.connectToGame();
              } else this.selectClass(i);
            }
          }

          // Check if over scrollbar
          let start = this.scrollInfo.indicatorPos;
          let end = start + this.scrollInfo.indicatorWidth;
          let hgt = this.scrollInfo.barPosY;
          let size = this.scrollInfo.barSizeY;
          if (this.canvas.mouseX - 10 > start
            && this.canvas.mouseX - 10 < end
            && this.canvas.mouseY - 10 > hgt - size / 2
            && this.canvas.mouseY - 10 < hgt + size / 2
          ) {
            console.log("mouse over scrollbar");
            this.scrollInfo.indicatorSelected = true;
          }
        },


        mouseReleased: function() {
          this.scrollInfo.indicatorSelected = false;
        }

        // #endregion

      },
      // #endregion


      // #region - Connect
      {

        // #region - Setup

        initialize: function(canvas) {
          this.canvas = canvas;
          this.setupVariables();
        },


        setupVariables: function() {},

        // #endregion


        // #region - Main

        update: function() {
          this.canvas.background(colors["background"]);
          this.canvas.noStroke();
          this.canvas.fill(colors["secondary"]);
          this.canvas.textSize(40);
          this.canvas.text("Connecting...", this.canvas.width / 2, this.canvas.height / 2 + 40 / 3);
        },


        gameConnectRequest: function() {
          socket.emit("gameConnectRequest");
        },


        gameConnectResponse: function(data) {
          if (data.accepted) this.canvas.startGame(data.playerNum);
          else this.canvas.changeToMenu({"text": "could not connect", "time": 60, "progress": 0});
        },

        // #endregion


        // #region - Input

        keyPressed: function() {},
        mousePressed: function() {},
        mouseReleased: function() {}

        // #endregion

      },
      // #endregion


      // #region - Game
      {

        // #region - Setup

        initialize: function(canvas) {
          this.canvas = canvas;
          this.resetVariables();
        },


        resetVariables: function() {
          this.objectsInfo = {
            "tokenStart": {"x": 80, "y": 80},
            "tokenInterval": 120,
            "tokenSize": 100,

            "diceStart": {"x": 325, "y": this.canvas.height - 80},
            "diceInterval": 100,
            "diceSize": 80,
            "diceRowSize": 5,

            "lockPos": {"x": 20, "y": this.canvas.height - 120},
            "lockSize": {"x": 150, "y": 80},
            "locked": false,

            "extraTokenPos": {"x": 200, "y": this.canvas.height-110},
            "extraTokenSize": {"x": 60, "y": 60},
            "extraTokenHave": false,
            "extraTokenUsed": false
          }

          this.scoreInfo = {
            "score": 0,
            "scoreGained": 0,
            "scoreLost": 0,
            "scoreDealt": 0,

            "enemyScore": 0,
            "enemyScoreGained": 0,
            "enemyScoreLost": 0,
            "enemyScoreDealt": 0
          }

          this.extraInfo = {
            "exponentialUsed": 0,
            "sniperStoredDamage": 0,
            "blockDamage": false
          }

          this.playerName = "player0";
          this.turnCount = 1;
          this.started = false;
          this.class = null;
          this.tokens = [];
          this.dice = [];
          this.score = 0;
          this.enemyScore = 0;
        },

        // #endregion


        // #region - Main

        update: function() {
          this.canvas.background(colors["background"]);

          // Token board
          this.canvas.noStroke();
          this.canvas.fill(colors["primary"]);
          this.canvas.rect(0, 0, 100, this.canvas.height);
          this.canvas.fill(colors["tertiary"]);
          this.canvas.rect(100, 0, 10, this.canvas.height);

          // Update tokens and dice
          for (let i = 0; i < this.tokens.length; i++)
            this.tokens[i].update();
          for (let i = 0; i < this.dice.length; i++)
            this.dice[i].update();

          // Show name and turn count
          this.canvas.noStroke();
          this.canvas.textSize(42);
          this.canvas.textAlign(RIGHT);
          if (this.playerName == "Player 1") this.canvas.fill(34, 117, 246);
          else this.canvas.fill(152, 40, 40);
          this.canvas.text(this.playerName, this.canvas.width - 30, 50);
          this.canvas.fill(colors["secondary"]);
          this.canvas.image(this.class.showImage, this.canvas.width - 205, 37.5, 50, 50);
          this.canvas.text("Turn " + this.turnCount, this.canvas.width - 30, 90);


          let sc1 = this.scoreInfo.enemyScoreGained - this.scoreInfo.enemyScoreLost; // Show enemy score
          if (sc1 > 0) {sc1 = "+"+fancyFormat(sc1, 2);
          } else if (sc1 < 0) {sc1 = fancyFormat(sc1, 2);
          } else {sc1 = "";}
          text("Enemy Score: " + fancyFormat(this.scoreInfo.enemyScore, 2) + sc1, this.canvas.width - 30, 140);

          let sc2 = this.scoreInfo.scoreGained - this.getScoreLost(); // Show friendly score
          if (sc2 > 0) {sc2 = "+" + fancyFormat(sc2, 2);
          } else if (sc2 < 0) {sc2 = fancyFormat(sc2, 2);
          } else {sc2 = "";}
          this.canvas.text("Score: " + fancyFormat(this.scoreInfo.score, 2) + sc2, this.canvas.width - 30, 180);
          this.canvas.text("Roll: " + (this.dice.length>0?this.getRoll():0), this.canvas.width - 30, 220);
          this.canvas.textAlign(CENTER);


          if (this.started && dist(this.canvas.mouseX, this.canvas.mouseY, this.canvas.width-205+8, 37.5+8) < 25) { // Show class info
            this.canvas.textSize(60);
            this.canvas.text(this.class.name, this.canvas.width / 2 + 110/2, 300);
            this.canvas.textSize(35);
            this.canvas.text(formatTextCharacters(this.class.description, 35) + "\n\n" + this.class.extraDescription(), this.canvas.width/2 + 110/2, 350);
          }

          this.canvas.strokeWeight(4); // Show lock button
          this.canvas.stroke(colors["secondary"]);
          if (this.objectsInfo.locked) this.canvas.fill(210);
          else if (this.ontopLock()) this.canvas.fill(180);
          else this.canvas.fill(colors["primary"]);
          this.canvas.rect(
            this.objectsInfo.lockPos.x,
            this.objectsInfo.lockPos.y,
            this.objectsInfo.lockSize.x,
            this.objectsInfo.lockSize.y
          );
          this.canvas.textSize(40);
          this.canvas.noStroke();
          this.canvas.fill(colors["secondary"]);
          this.canvas.text(
            this.objectsInfo.locked?"Locked":"Lock-In",
            this.objectsInfo.lockPos.x + this.objectsInfo.lockSize.x/2,
            this.objectsInfo.lockPos.y + this.objectsInfo.lockSize.y/2+10
          );

          this.canvas.strokeWeight(4); // Show extra token button
          this.canvas.stroke(colors["secondary"]);
          if (this.objectsInfo.extraTokenUsed) { fill(210);
          } else if (this.ontopExtraToken() && !this.objectsInfo.locked) { fill(180);
          } else {this.canvas.fill(colors["primary"]);}
          this.canvas.rect(
            this.objectsInfo.extraTokenPos.x,
            this.objectsInfo.extraTokenPos.y,
            this.objectsInfo.extraTokenSize.x,
            this.objectsInfo.extraTokenSize.y
          );
          if (this.ontopExtraToken()) {
            this.canvas.noStroke();
            this.canvas.fill(colors["secondary"]);
            this.canvas.textSize(30);
            this.canvas.textAlign(CENTER);
            this.canvas.text(
              "Extra token use (-20 score)",
              this.objectsInfo.extraTokenPos.x
              + this.objectsInfo.extraTokenSize.x/2,
              this.objectsInfo.extraTokenPos.y-35
            );
          }

          if (!this.started) { // Waiting for other player
            this.canvas.noStroke();
            this.canvas.fill(colors["secondary"]);
            this.canvas.textSize(50);
            this.canvas.text("Waiting for other player...", this.canvas.width / 2 + 110 / 2, this.canvas.height / 2);
          }
        },

        // #endregion


        // #region - Game

        gameStart: function() { // Game started
          this.started = true;
          this.generateTokens(5);
          let dAmount = 5;
          let dSize = 6;
          if (this.class.name == "Ogre") {dAmount=4; dSize=8;}
          this.generateDice(dAmount, dSize);
        },


        gameTurn: function(data) { // Sent instantly as soon as both people are ready
          this.scoreInfo.scoreGained += this.getRoll(); // Update score
          this.gameScoreUpdateSend("end");
          socket.emit("gameTurnRoll", this.getRoll());
          this.scoreInfo.score += this.scoreInfo.scoreGained - this.getScoreLost();
          this.scoreInfo.score = max(this.scoreInfo.score, 0);
          this.scoreInfo.scoreGained = 0;
          this.scoreInfo.scoreLost = 0;
          this.extraInfo.blockDamage = false;
          this.gameScoreUpdateSend("update");


          this.turnCount = data.turn; // Reset variables
          for (let i = 0; i < this.tokens.length; i++) this.tokens[i].turn();
          this.dice = [];
          let dAmount = 5;
          let dSize = 6;
          if (this.class.name=="Ogre") {dAmount=4; dSize=8;}
          this.generateDice(dAmount, dSize);
          this.generateTokens(max(0, 5-this.tokens.length));
          this.objectsInfo.locked = false;
          this.objectsInfo.extraTokenUsed = false;
        },


        gameEnd: function(data) { // Game ended - change screen back
          mainCanvas.screens[MENU].changeToMenu({
            "text": "Game ended: " + data,
            "time": 60,
            "progress": 0
          });
          historyCanvas.history = [];
        },


        gameScoreUpdateSend: function(type) { // After: token use, enemy token use, extra token
          let sendScoreInfo = {
            "score": this.scoreInfo.score,
            "scoreGained": this.scoreInfo.scoreGained,
            "scoreLost": this.getScoreLost(),
            "scoreDealt": this.scoreInfo.scoreDealt,
          }
          socket.emit("gameScoreUpdateSend", {"scoreInfo": sendScoreInfo, "type": type});
        },


        gameScoreUpdateReceive: function(data) {
          if (data.type == "update") {
            this.scoreInfo.enemyScore = data.scoreInfo.score;
            this.scoreInfo.enemyScoreGained = data.scoreInfo.scoreGained;
            this.scoreInfo.enemyScoreLost = data.scoreInfo.scoreLost;
            this.scoreInfo.enemyScoreDealt = data.scoreInfo.scoreDealt;
          } else {
            if (this.class.name == "Sniper") this.extraInfo.sniperStoredDamage += 0.35*data.scoreInfo.scoreGained;
          }
        },


        gameTokenUsed: function(data) { // Enemy used a token
          let currentToken = data.params[0].token;
          if (currentToken.category == "class") {
            tokensData.class[currentToken.class][currentToken.rarity][currentToken.index].otherAction(data.params);
          } else {
            tokensData.neutral[currentToken.rarity][currentToken.index].otherAction(data.params);
          }
          screens[GAME].gameScoreUpdateSend("update");
        },


        lockTurn: function() { // Officially lock turn in after everything done
          this.objectsInfo.locked = true;
          socket.emit("gameLockin");
        },


        getScoreLost: function() {
          let scoreLost = this.scoreInfo.scoreLost;
          if (this.class.name == "Ogre") scoreLost *= 0.65;
          if (this.extraInfo.blockDamage) scoreLost = 0;
          return scoreLost;
        },

        // #endregion


        // #region - Dice and Tokens

        generateTokens: function(amount) {
          for (let i = 0; i < amount; i++) {
            this.tokens.push(
              new GameShowToken(this.canvas, null, this.tokens.length)
            );
          }
        },


        generateDice: function(amount, size) {
          console.log("generating " + amount + " d" + size + "'s");
          for (let i = 0; i < amount; i++) {
            this.dice.push(
              new GameShowDice(this.canvas, size, this.dice.length)
            );
          }
        },


        updateTokenPositions: function() {
          for (let i = 0; i < this.tokens.length; i++) {
            this.tokens[i].index = i;
            this.tokens[i].updateBasePos();
          }
        },


        updateDicePositions: function() {
          for (let i = 0; i < this.dice.length; i++) {
            this.dice[i].index = i;
            this.dice[i].updateBasePos();
          }
        },


        selectToken: function(ind) {
          this.selectedTokens.push(this.tokens[ind]);
          this.tokens[ind].selected = true;
        },


        deselectTokens: function() {
          for (let i = 0; i < this.tokens.length; i++) {
            this.tokens[i].selected = false;
          }
        },


        removeToken: function(ind) {
          this.tokens.splice(ind, 1);
        },

        // #endregion


        // #region - Other

        ontopLock: function() {
          return (this.canvas.mouseX > this.objectsInfo.lockPos.x
          && this.canvas.mouseX < this.objectsInfo.lockPos.x+this.objectsInfo.lockSize.x
          && this.canvas.mouseY > this.objectsInfo.lockPos.y
          && this.canvas.mouseY < this.objectsInfo.lockPos.y+this.objectsInfo.lockSize.y);
        },


        ontopExtraToken: function() {
          return (this.canvas.mouseX > this.objectsInfo.extraTokenPos.x
          && this.canvas.mouseX < this.objectsInfo.extraTokenPos.x+this.objectsInfo.extraTokenSize.x
          && this.canvas.mouseY > this.objectsInfo.extraTokenPos.y
          && this.canvas.mouseY < this.objectsInfo.extraTokenPos.y+this.objectsInfo.extraTokenSize.y);
        },


        getRoll: function() {
          let total = 0;
          for (let i = 0; i < this.dice.length; i++) {
            total += this.dice[i].value;
          }
          return total;
        },

        // #endregion


        // #region - Input

        mousePressed: function() {
          for (let i = 0; i < this.tokens.length; i++) {
            if (this.tokens[i].ontop() && !this.objectsInfo.locked) {
              this.tokens[i].click();
            }
          }

          if (this.started) {
            if (this.ontopLock() && !this.objectsInfo.locked) {
              this.lockTurn();
            }

            if (this.ontopExtraToken() && !this.objectsInfo.extraTokenUsed && !this.objectsInfo.locked && this.scoreInfo.score >= 20) {
              this.objectsInfo.extraTokenUsed = true; // Purchase new token
              this.objectsInfo.extraTokenHave = true;
              this.scoreInfo.scoreLost += 20;
              this.gameScoreUpdateSend("update");
            }
          }
        },


        keyPressed: function() {},
        mouseReleased: function() {}

        // #endregion

      }
      // #endregion
    ]

    // Setup variables
    for (let screen of canvas.screens)
      screen.initialize(canvas);
    canvas.currentScreen = INTRO;
    canvas.connected = false;
    focusedCanvas = canvas;
  }

  // #endregion


  // #region - Main

  canvas.draw = function() {
    // Update the current screen
    canvas.screens[canvas.currentScreen].update();
  }


  canvas.connectToGame = function() {
    // Change to connection screen and connect
    canvas.screens[CONNECTING].gameConnectRequest();
    canvas.currentScreen = CONNECTING;
  }


  canvas.startGame = function(playerNum) {
    // Start the game as player playerNum
    console.log("starting game, player " + playerNum);
    canvas.screens[GAME].class = canvas.screens[MENU].classInfo.classSelected.class;
    canvas.currentScreen = GAME;
  }


  canvas.changeToMenu = function(information) {
    // Log errors to console
    if (information != null) {
      console.log("changing to menu " + information.text + ", " + information.time);
      canvas.screens[MENU].outputTextInfo = information;
    } else console.log("changing to menu");

    // Change to menu
    canvas.currentScreen = MENU;
  }

  // #endregion


  // #region - Input

  canvas.keyPressed = function() {
    // If canvas is focused call keypressed on current screen
    if (focusedCanvas == canvas)
      canvas.screens[canvas.currentScreen].keyPressed();
  }


  canvas.mousePressed = function() {
    // If clicked inside of canvas then focus and call mousepressed on current screen
    if (insideCanvas(canvas)) {
      focusCanvas(canvas);
      console.log("Focused main");
      canvas.screens[canvas.currentScreen].mousePressed();
    }
  }


  canvas.mouseReleased = function() {
    // If canvas is focused call mousereleased on current screen
    if (focusedCanvas == canvas)
      canvas.screens[canvas.currentScreen].mouseReleased();
  }

  // #endregion
}

// #endregion


// #region - Chat Canvas

function chatCanvasFunc(canvas) {

  // #region - Setup

  canvas.setup = function() {
    // Setup p5 function
    canvas.createCanvas(300, 600);
    canvas.textAlign(RIGHT);
    canvas.textFont(fontBold);

    // Setup variables
    canvas.setupVariables();
    canvas.receiveMessage({
      "message": "Enter a nickname to join chat!.",
      "formatting": {
        "size": 30,
        "bold": true,
        "color": null
      }
    });
  }


  canvas.setupVariables = function() {
    // Setup variables
    canvas.chatInfo = {
      "connected": true,
      "nickname": "",
      "color": null,
      "messages": [],
      "formatWidth": 250,

      "deleteTimer": 0,
      "deleteTimerMax": 5
    };

    canvas.cursorAnmInfo  = {
      "time": 0,
      "timeMax": 20,
      "toggle": false
    };


    canvas.chatFormatting = {
      "pos": {"x": canvas.width - 35 , "y": canvas.height - 65},
      "formatWidth": 215,
      "lineDifference": 30,
      "messageDifference": 20
    }

    canvas.inputBoxFormatting = {
      "pos": {"x": 50, "y": canvas.height - 32},
      "size": {"x": 240, "y": 20},
      "focused": false,
      "current": "",
      "textSize": 20,
      "textOffset": {"x": -15, "y": -12},

      "border": {
        "height": canvas.height - 62,
        "width": 2
      },

      "background": {
        "height": canvas.height - 60,
        "width": 60
      },
    };

    canvas.changeColorFormatting = {
      "pos": {"x": 20, "y": canvas.height - 32},
      "size": {"x": 20, "y": 20}
    };

    canvas.titleFormatting = {
      "textSize": 45,
      "pos": {"x": canvas.width - 20, "y": 50},
      "border": {
        "height": 70,
        "width": 2
      }
    };

    canvas.nicknameFormatting = {
      "textSize": 20,
      "pos": {"x": 25, "y": 45}
    };
  }

  // #endregion


  // #region - Main

  canvas.draw = function() {
    // Update chat deletion
    if (canvas.chatInfo.deleteTimer > 0) canvas.chatInfo.deleteTimer--;
    if (keyIsDown(8) && canvas.inputBoxFormatting.focused && canvas.chatInfo.deleteTimer == 0) {
      canvas.inputBoxFormatting.current = canvas.inputBoxFormatting.current.slice(0, canvas.inputBoxFormatting.current.length - 1);
      canvas.chatInfo.deleteTimer = canvas.chatInfo.deleteTimerMax;
    }

    // Background
    canvas.background(colors["tertiary"]);

    // Show chat messages
    let lineCounter = 0, messageCounter = 0;
    for (let i = canvas.chatInfo.messages.length - 1; i >= 0; i--) {
      canvas.textSize(canvas.chatInfo.messages[i].formatting.size);
      canvas.textFont(canvas.chatInfo.messages[i].formatting["bold"] ? fontBold : fontRegular);
      let textToShow = formatTextWidth(canvas.chatInfo.messages[i].message, canvas.chatFormatting.formatWidth, canvas);
      lineCounter += 1 + (textToShow.split("\n").length - 1);

      canvas.fill(canvas.chatInfo.messages[i].formatting.color);
      canvas.text(textToShow, canvas.chatFormatting.pos.x, canvas.chatFormatting.pos.y
        - lineCounter * canvas.chatFormatting.lineDifference
        - messageCounter * canvas.chatFormatting.messageDifference);
      messageCounter++;
    }

    // Show title
    canvas.noStroke();
    canvas.fill(colors["tertiary"]);
    canvas.rect(0, 0, canvas.width, canvas.titleFormatting.border.height);

    canvas.textSize(canvas.titleFormatting.textSize);
    canvas.fill(colors["secondary"]);
    canvas.text("Chat", canvas.titleFormatting.pos.x, canvas.titleFormatting.pos.y);
    canvas.rect(0, 70, canvas.width, canvas.titleFormatting.border.width);

    // Show nickname
    if (canvas.chatInfo.nickname != "") {
      canvas.fill(canvas.chatInfo.color);
      canvas.textAlign(LEFT);
      canvas.textSize(canvas.nicknameFormatting.textSize);
      canvas.text(canvas.chatInfo.nickname, canvas.nicknameFormatting.pos.x, canvas.nicknameFormatting.pos.y);
      canvas.textAlign(RIGHT);
    }

    // Show input box
    canvas.fill(colors["secondary"]);
    canvas.rect(0, canvas.height - 62, canvas.width, 2);
    canvas.fill(colors["primary"]);
    canvas.rect(0, canvas.height - 60, canvas.width, 60);
    canvas.fill(colors["tertiary"]);
    canvas.rect(
      canvas.inputBoxFormatting.pos.x - 8,
      canvas.inputBoxFormatting.pos.y - 8,
      canvas.inputBoxFormatting.size.x,
      canvas.inputBoxFormatting.size.y
    );

    // Show box text
    canvas.textSize(canvas.inputBoxFormatting.textSize);
    canvas.fill(colors["secondary"]);
    canvas.text(
      canvas.inputBoxFormatting.current,
      canvas.inputBoxFormatting.pos.x + canvas.inputBoxFormatting.size.x + canvas.inputBoxFormatting.textOffset.x,
      canvas.inputBoxFormatting.pos.y + canvas.inputBoxFormatting.size.y + canvas.inputBoxFormatting.textOffset.y
    );

    // Cover unneeded box text
    canvas.fill(colors["primary"]);
    canvas.rect(
      canvas.inputBoxFormatting.pos.x - 40 - 8,
      canvas.inputBoxFormatting.pos.y - 8,
      40, canvas.inputBoxFormatting.size.y
    );

    // Show color change request
    canvas.fill(255);
    canvas.rect(
      canvas.changeColorFormatting.pos.x - 8,
      canvas.changeColorFormatting.pos.y - 8,
      canvas.changeColorFormatting.size.x,
      canvas.changeColorFormatting.size.y
    );

    // Show chat selected
    if (canvas.inputBoxFormatting.focused) {
      if (canvas.cursorAnmInfo.toggle) {
        canvas.fill(colors["secondary"]);
        canvas.rect(
          canvas.inputBoxFormatting.pos.x + canvas.inputBoxFormatting.size.x - 8 - 4,
             canvas.inputBoxFormatting.pos.y - 8 + 2,
          2, canvas.inputBoxFormatting.size.y - 4
        );
      }

      // Show cursor animation
      canvas.cursorAnmInfo.time--;
      if (canvas.cursorAnmInfo.time < 0) {
        canvas.cursorAnmInfo.time = canvas.cursorAnmInfo.timeMax;
        canvas.cursorAnmInfo.toggle = !canvas.cursorAnmInfo.toggle;
      }
    }

    // Debug
    if (showDebug) {
      canvas.fill(colors["secondary"]);
      canvas.text("Focused: " + (focusedCanvas == canvas), canvas.width * 0.65, 35);
      canvas.text("Chat Focused: " + canvas.inputBoxFormatting.focused, canvas.width * 0.65, 60);
    }
  }


  canvas.receiveMessage = function(data) {
    // Receive chat message
    if (data.formatting.size == null) data.formatting.size = 25;
    if (data.formatting.bold == null) data.formatting.bold = false;
    if (data.formatting.color == null) data.formatting.color = colors["secondary"];
    else data.formatting.color = color(data.formatting.color[0], data.formatting.color[1], data.formatting.color[2]);
    canvas.chatInfo.messages.push(data);
  }


  canvas.sendMessage = function() {
    if (canvas.inputBoxFormatting.current.length > 0) {

      // Request nickname
      if (canvas.chatInfo.nickname == "") {
        if (canvas.inputBoxFormatting.current.length > 10) {
          canvas.receiveMessage({
            "message": "Enter a nickname 10 characters or less!",
            "formatting": {
              "size": null,
              "bold": true,
              "color": null
            }
          });
        } else socket.emit("chatRequestNickname", canvas.inputBoxFormatting.current);

        // Send message
      } else socket.emit("chatSendMessage", canvas.inputBoxFormatting.current);
      canvas.inputBoxFormatting.current = "";
    }
  }


  canvas.updateData = function(data) { // Update chat data
    canvas.chatInfo.color = color(data.chatColor[0], data.chatColor[1], data.chatColor[2]);
    canvas.chatInfo.nickname = data.nickname;
  }


  canvas.insideCanvas = function() { // Check if inside canvas
    return (
      canvas.mouseX > 0
      && canvas.mouseX < canvas.width
      && canvas.mouseY > 0
      && canvas.mouseY < canvas.height
      && mouseX > width
    );
  }

  // #endregion


  // #region - Input

  canvas.keyPressed = function() {
    if (focusedCanvas == canvas) {
      if (canvas.inputBoxFormatting.focused) {

        // Send message on enter
        if (keyCode == 13) {
          canvas.sendMessage();

          // Type character upper / lower case using shift
        } else if (keyCode >= 65 && keyCode <= 90 || keyCode == 32) {
          if (keyIsDown(16)) canvas.inputBoxFormatting.current += key;
          else canvas.inputBoxFormatting.current += key.toLowerCase();
        }
      }
    }
  }


  canvas.mousePressed = function() {
    if (insideCanvas(canvas)) {
      focusCanvas(canvas);
      console.log("Focused chat");

      // Focus chat box
      canvas.inputBoxFormatting.focused = (
        canvas.mouseX > canvas.inputBoxFormatting.pos.x
        && canvas.mouseX < (canvas.inputBoxFormatting.pos.x + canvas.inputBoxFormatting.size.x)
        && canvas.mouseY > canvas.inputBoxFormatting.pos.y
        && canvas.mouseY < (canvas.inputBoxFormatting.pos.y + canvas.inputBoxFormatting.size.y)
      );

      // Request color change
      if (canvas.mouseX > canvas.changeColorFormatting.pos.x
        && canvas.mouseX < (canvas.changeColorFormatting.pos.x + canvas.changeColorFormatting.size.x)
        && canvas.mouseY > canvas.changeColorFormatting.pos.y
        && canvas.mouseY < (canvas.changeColorFormatting.pos.y + canvas.changeColorFormatting.size.y)
        && canvas.chatInfo.nickname != ""
      ) socket.emit("chatRequestColorChange");
    }
  }


  canvas.mouseReleased = function() {}

  // #endregion
}

// #endregion



// #region - Setup

// Constants
let INTRO = 0;
let MENU = 1;
let CONNECTING = 2;
let GAME = 3;

// Canvases
let historyCanvas;
let mainCanvas;
let chatCanvas;
let canvases;
let focusedCanvas;

// Global variables
let showDebug;
let colors;
let fontRegular;
let fontBold;
let images;
let tokensData;
let sectionedTokenData;
let classesData;
let screens;


function preload() {
  // Prevent spacebar
  // document.onkeydown = function(e) {
  //   e.preventDefault();
  // };

  // Setup global variables
  showDebug = false;
  colors = {
    "background": color(219, 199, 152),
    "primary": color(167, 148, 129),
    "secondary": color(62, 58, 49),
    "tertiary": color(230, 220, 194)
  };
  fontRegular = loadFont("Assets/Font/gasalt.ttf");
  fontBold = loadFont("Assets/Font/gasaltbold.ttf");
  setupData();
}


function setup() {
  // Setup canvases
  historyCanvas = new p5(historyCanvasFunc, "canvasContainer");
  mainCanvas = new p5(mainCanvasFunc, "canvasContainer");
  chatCanvas = new p5(chatCanvasFunc, "canvasContainer");
  canvases = [
    historyCanvas,
    mainCanvas,
    chatCanvas
  ];
  focusedCanvas = null;

  // Remove default canvas
  let defaultCanv = document.getElementById("defaultCanvas0");
  defaultCanv.parentNode.removeChild(defaultCanv);

  // Connect to game server
  connectToServer();
}

// #endregion


// #region - Main

function getRandomToken() {
  // Return a random token from any rarity, class or no class
  let chances = [
    0.675,  // Common
    0.25,   // Rare
    0.075,  // Legendary
    0.35    // Class
  ];
  let r1 = random(1);

  // Common
  if (r1 < chances[0]) {
    let r2 = random(1);
    return (r2 <= chances[3] && mainCanvas.screens[GAME].class.tokens[0].length > 0)
    ? mainCanvas.screens[GAME].class.tokens[0][floor(random(mainCanvas.screens[GAME].class.tokens[0].length))]
    : tokensData.neutral.common[floor(random(tokensData.neutral.common.length))];

  // Rare
} else if (r1 < chances[0] + chances[1]) {
    let r2 = random(1);
    return (r2 <= chances[3] && mainCanvas.screens[GAME].class.tokens[1].length > 0)
    ? mainCanvas.screens[GAME].class.tokens[1][floor(random(mainCanvas.screens[GAME].class.tokens[1].length))]
    : tokensData.neutral.rare[floor(random(tokensData.neutral.rare.length))];

  // Legendary
} else if (r1 < chances[0] + chances[1] + chances[2]) {
    let r2 = random(1);
    return (r2 <= chances[3] && mainCanvas.screens[GAME].class.tokens[1].length > 0)
    ? mainCanvas.screens[GAME].class.tokens[2][floor(random(mainCanvas.screens[GAME].class.tokens[2].length))]
    : tokensData.neutral.legendary[floor(random(tokensData.neutral.legendary.length))];
  }
}


function countDecimals(value) {
  // Count the ammount of decimals in a number
  if (Math.floor(value) === value) return 0;
  return value.toString().split(".")[1].length || 0;
}


function fancyFormat(value, decimals) {
  // Format a value to show a specific amount of decimals
  let before = floor(Math.log10(value)) + 1;
  let after = min(countDecimals(value), 2);
  return nf(value, before, after);
}


function insideCanvas(canvas) {
  // Returns whether the mouse is inside a specific canvas
  return (
    canvas.mouseX > 0
    && canvas.mouseX < canvas.width
    && canvas.mouseY > 0
    && canvas.mouseY < canvas.height
  );
}


function alphaStroke(col, alpha) {
  // Stroke with a color and an alpha
  stroke(
    red(col),
    green(col),
    blue(col),
    alpha
  );
}


function alphaFill(canvas, col, alpha) {
  // Fill with a color and an alpha
  canvas.fill(
    red(col),
    green(col),
    blue(col),
    alpha
  );
}


function formatTextCharacters(text_, count) {
  // Format text to end line after every x characters
  let text = text_;
  for (let i = 0; i < text.length; i++) {
    if (i > 0 && i % count == 0)
      text = text.slice(0, i) + "\n" +  text.slice(i, text.length);
  }
  return text;
}


function formatTextWidth(text_, width, canvas) {
  // Format text to end line after a certain width
  let text = text_;
  let currentWidth = 0;
  for (let i = 0; i < text.length; i++) {
    currentWidth += canvas.textWidth(text[i]);
    if (currentWidth > width) {
      text = text.slice(0, i) + "\n" +  text.slice(i, text.length);
      currentWidth = 0;
    }
  }
  return text;
}


function focusCanvas(canvas) {
  // Focus a specified canvas
  focusedCanvas = canvas;
}


function keyPressed() {
  for (let canvas of canvases)
    canvas.keyPressed();
}

// #endregion


// #region - Classes

// #region - MenuShowClass

class MenuShowClass {
  constructor(menu_, class_, index_) {
    // Setup variables
    this.menu = menu_;
    this.class = class_;
    this.index = index_;
    this.selected = false;
    this.px = this.menu.canvas.width * 0.5;
    this.py = this.menu.classInfo.posY;
    this.baseSize = this.menu.classInfo.size;
    this.size = this.baseSize;
    this.hoverProgress = 0;
  }


  update() {
    // Change size
    if (this.selected) this.size = this.baseSize * 1.2;
    else if (this.ontop()) this.size = this.baseSize * 1.1;
    else this.size = this.baseSize;

    // Alpha based on distance from center
    let alphaRaw = map(
      abs(this.index - this.menu.scrollInfo.scrollProgress),
      0, this.menu.classInfo.alphaLimit, 0, 1);
    let alpha = (1 - (alphaRaw * alphaRaw * alphaRaw)) * 255;
    this.px = this.menu.canvas.width * 0.5
      + (this.index - this.menu.scrollInfo.scrollProgress)
      * this.menu.classInfo.interval;

    // Draw select outline
    if (this.selected) {
      this.menu.canvas.noStroke();
      alphaFill(this.menu.canvas, colors["secondary"], alpha);
      this.menu.canvas.ellipse(
        this.px, this.py,
        this.size+10, this.size+10
      );
    }

    // Draw image
    if (alpha > 2) {
      this.menu.canvas.tint(255, alpha);
      this.menu.canvas.image(this.class.showImage, this.px, this.py, this.size, this.size);
      this.menu.canvas.noTint();
    }

    // If ontop or selected show name
    if (this.ontop() || this.selected) {
      this.menu.canvas.noStroke();
      alphaFill(this.menu.canvas, colors["secondary"], alpha);
      this.menu.canvas.textSize(40);
      this.menu.canvas.text(this.class["name"], this.px, this.py - this.size*0.5 -10 -(this.selected?5:0));
    }

    if (this.selected) {
      if (this.ontop()) {
        // If ontop and selected show white fade ontop
        this.menu.canvas.noStroke();
        this.menu.canvas.fill(255, 60);
        this.menu.canvas.ellipse(this.px, this.py, this.size, this.size);

        // If ontop and selected show "Play!"
        this.menu.canvas.strokeWeight(2);
        this.menu.canvas.stroke(colors["secondary"]);
        this.menu.canvas.fill(colors["tertiary"]);
        this.menu.canvas.textSize(35);
        this.menu.canvas.text("Play!", this.px, this.py + 10);
      }

      // Show class name
      this.menu.canvas.noStroke();
      this.menu.canvas.fill(colors["secondary"]);
      this.menu.canvas.textSize(50);
      this.menu.canvas.text(this.class.name, 350, 75);
      this.menu.canvas.rect(350- 22 * this.class.name.length / 2, 80, 22 * this.class.name.length, 2);

      // Show Tokens title
      this.menu.canvas.textSize(50);
      this.menu.canvas.text("Tokens", this.menu.canvas.width - 100, 50);
      this.menu.canvas.rect(this.menu.canvas.width - 100 - 22 * 3, 55, 22 * 6, 2);

      // Show description
      this.menu.canvas.textSize(30);
      this.menu.canvas.text(formatTextWidth(this.class.description, 500, this.menu.canvas), 350, 125);

      // Show each class token
      for (let i = 0, counter = 0; i < this.class.tokens.length; i++) {
          for (let o = 0; o < this.class.tokens[i].length; o++) {
          let interval = this.menu.classInfo.tokenInterval;
          let size = this.menu.classInfo.tokenSize;
          let px = this.menu.canvas.width - 100;
          let py = 80 + (counter + 0.35) *  interval;
          this.menu.canvas.image(this.class.tokens[i][o].image, px, py, size, size);
          counter++;
        }
      }
    }

    // Show alpha when debugging
    if (showDebug) {
      this.menu.canvas.noStroke();
      this.menu.canvas.fill(0);
      this.menu.canvas.textSize(15);
      this.menu.canvas.text(nf(abs(this.index - this.menu.scrollInfo.scrollProgress), 1, 1), this.px, this.py+5);
    }
  }


  ontop() {
    return (
      dist(this.menu.canvas.mouseX, this.menu.canvas.mouseY, this.px, this.py) < this.size / 2
      && abs(this.index - this.menu.scrollInfo.scrollProgress) <= this.menu.classInfo.alphaLimit - 0.125
    );
  }
}

// #endregion


// #region - GameShowToken

class GameShowToken {

  constructor(canvas_, token_, index_) {
    this.canvas = canvas_;
    if (token_ == null) this.token = getRandomToken();
    else this.token = token_;
    this.index = index_;

    this.used = false;
    this.size = mainCanvas.screens[GAME].objectsInfo.tokenSize;
    this.updateBasePos();
    this.px = this.basePx - 100;
    this.py = this.basePy;
    this.gotoPx = this.basePx;
    this.gotoPy = this.basePy;
    this.turns = 0;
  }


  updateBasePos() {
    this.basePx = mainCanvas.screens[GAME].objectsInfo.tokenStart.x;
    this.basePy = mainCanvas.screens[GAME].objectsInfo.tokenStart.y
      + mainCanvas.screens[GAME].objectsInfo.tokenInterval * this.index;
  }


  update() {
    // Update base position
    if (!this.used) {
      this.gotoPx = this.basePx;
      this.gotoPy = this.basePy;
      if (this.ontop()) {
        this.gotoPx = this.basePx+20;
      }
    }

    // Update actual position
    if (this.px != this.gotoPx) {
      let dir = (this.gotoPx-this.px) / 5;
      if (abs(dir) < 0.02) {this.px = this.gotoPx;
      } else {this.px += dir}
    }
    if (this.py != this.gotoPy) {
      let dir = (this.gotoPy-this.py) / 5;
      if (abs(dir) < 0.02) {this.py = this.gotoPy;
      } else {this.py += dir}
    }

    // Draw token
    if (this.used) {
      this.canvas.noStroke();
      this.canvas.fill(colors["secondary"]);
      this.canvas.ellipse(
        this.px, this.py,
        this.size+10, this.size+10
      );
    }
    if (this.token.image != null)
      this.canvas.image(this.token.image, this.px, this.py, this.size, this.size);

    // Show name and description
    if (this.ontop()) {
      this.canvas.noStroke();
      this.canvas.fill(colors["secondary"]);
      this.canvas.textSize(60);
      this.canvas.text(this.token.name, this.canvas.width / 2 + 110 / 2, 300);
      this.canvas.textSize(35);
      this.canvas.text(formatTextWidth(this.token.description, 300, this.canvas), this.canvas.width / 2 + 110 / 2, 350);
    }
  }


  animateOffscreen(params, callback) {
    this.used = true;
    this.gotoPx = -100;
    let ind = this.index;
    setTimeout(function(token) {
      mainCanvas.screens[GAME].updateDicePositions();
      mainCanvas.screens[GAME].removeToken(token.index);
      mainCanvas.screens[GAME].updateTokenPositions();
    }, 600, this);
    setTimeout(function() {callback(params);}, 600);
  }


  click() {
    let complete = (!this.token.partial && !mainCanvas.screens[GAME].objectsInfo.extraTokenHave);
    if (mainCanvas.screens[GAME].objectsInfo.extraTokenHave) mainCanvas.screens[GAME].objectsInfo.extraTokenHave = false;
    if (complete) mainCanvas.screens[GAME].objectsInfo.locked = true;

    this.used = true;
    socket.emit("historySend", {"text": (mainCanvas.screens[GAME].playerName + " used " + this.token.name), "formatting": {}});


    console.log("using token " + this.token.name);
    this.token.action([
      complete,
      showToken
    ], function(params) { // After instant action, animate and affect enemy
      console.log("token action completed " + this.token.name);

      if (params[1].token.affectsEnemy) {
        console.log("affecting enemy " + this.token.name);
        socket.emit("gameTokenUsed", {
          "name": showToken.token.name,
          "params": params.slice(1, params.length)
        });
      }

      params[1].animateOffscreen(params, function(params) { // After animation, lock turn
        console.log("token finished" + this.token.name);
        if (params[0]) mainCanvas.screens[GAME].lockTurn();
        mainCanvas.screens[GAME].gameScoreUpdateSend("update");
      });
    });
  }


  ontop() {
    return(
      dist(this.canvas.mouseX, this.canvas.mouseY, this.px, this.py) < this.size / 2
      || (
        this.canvas.mouseX > 0
        && this.canvas.mouseX < this.px
        && this.canvas.mouseY > this.py - this.size/2
        && this.canvas.mouseY < this.py + this.size/2
      )
    );
  }


  turn() {
    this.turns++;
    if (this.token.name == "Pacify" && this.turns == 2) {
      this.animateOffscreen([], function() {
        mainCanvas.screens[GAME].tokens.push(new GameShowToken(tokensData.unobtainable[0], mainCanvas.screens[GAME].tokens.length));
      });
    }
  }
}

// #endregion


// #region - GameShowDice

class GameShowDice {

  constructor(canvas_, diceSize_, index_) {
    this.canvas = canvas_;
    this.diceSize = diceSize_;
    this.index = index_;
    this.updateBasePos();
    this.reroll();
  }


  updateBasePos() {
    this.size = mainCanvas.screens[GAME].objectsInfo.diceSize;
    this.px = mainCanvas.screens[GAME].objectsInfo.diceStart.x
    + mainCanvas.screens[GAME].objectsInfo.diceInterval*(this.index % mainCanvas.screens[GAME].objectsInfo.diceRowSize);
    this.py = mainCanvas.screens[GAME].objectsInfo.diceStart.y
    - floor(this.index / mainCanvas.screens[GAME].objectsInfo.diceRowSize)
    * mainCanvas.screens[GAME].objectsInfo.diceSize * 1.2;
  }


  reroll() {
    this.value = floor(random(this.diceSize))+1;
  }


  update() {
    this.canvas.image(
      images.dice[6][this.value <= 6 ? this.value : 0],
      this.px, this.py,
      this.size, this.size
    );

    if (this.value > 6) {
      this.canvas.noStroke();
      this.canvas.fill(colors["tertiary"]);
      this.canvas.textSize(50);
      this.canvas.text(this.value, this.px, this.py + 15);
    }
  }
}

// #endregion

// #endregion
