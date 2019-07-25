

// #region - Socket Functions

let socket;
function connectToServer() {
  socket = io.connect();


  socket.on("gameConnectResponse", function(data) {
    screens[2].gameConnectResponse(data);
  });
  socket.on("gameStart", function(data) {
    screens[3].gameStart();
  });
  socket.on("gameTurn", function(data) {
    screens[3].gameTurn(data);
  });
  socket.on("gameTurnWin", function() {
    screens[3].scoreInfo.score += 10;
    screens[3].gameScoreUpdateSend("update");
  });
  socket.on("gameTokenUsed", function(data) {
    screens[3].gameTokenUsed(data);
  });
  socket.on("gameScoreUpdateReceive", function(data) {
    screens[3].gameScoreUpdateReceive(data);
  });
  socket.on("gameEnd", function(data) {
    screens[3].gameEnd(data);
  });


  socket.on("chatReceiveMessage", function(data) {
    chatCanvasObj.receiveMessage(data, 0);
  });
  socket.on("chatUpdateData", function(data) {
    chatCanvasObj.chatUpdateData(data);
  });


  socket.on("historyReceive", function(data) {
    historyCanvasObj.historyReceive(data);
  });
}

// #endregion


// #region - History canvas

function historyCanvas(canvas) {
  canvas.setup = function() {
    canvas.createCanvas(300, 600);
    canvas.textFont(fontBold);
    canvas.history = [];
  }


  canvas.draw = function() {
    canvas.background(colors["tertiary"]);
    canvas.noStroke();
    canvas.fill(colors["secondary"]);

    canvas.textSize(45); // Show history title
    canvas.textAlign(LEFT);
    canvas.text("History", 20, 50);
    canvas.rect(0, 70, canvas.width, 2);

    canvas.noStroke(); // Show history text
    let counter = 0;
    for (let i = canvas.history.length-1; i >= 0; i--) {
      canvas.fill(canvas.history[i].formatting.color);
      canvas.textSize(canvas.history[i].formatting.size);
      canvas.text(canvas.history[i].text, 20, 100+counter*30);
      counter += 1 + (canvas.history[i].text.split("\n").length - 1);
      if (counter > 15) break;
    }
  }


  canvas.historyReceive = function(data) {
    canvas.history.push({
      "text":formatText(data.text, 27),
        "formatting": {
          "size": data.formatting.size!=null?data.formatting.size:25,
          "color":
            (data.formatting.color!=null)
            ? (data.formatting.color)
            : (data.formatting.serverColor!=null
                ? color(data.formatting.serverColor[0], data.formatting.serverColor[1], data.formatting.serverColor[2])
                : colors["secondary"])
        }
      }
    );
  }
}

// #endregion


// #region - Chat Canvas

function chatCanvas(canvas) {
  // #region - Setup

  canvas.setup = function() {
    canvas.createCanvas(300, 600);
    canvas.textAlign(RIGHT);
    canvas.textFont(fontBold);

    canvas.deleteTimer = 0;
    canvas.canvasFocused = false;
    canvas.chatInfo = {
      "connected": true,
      "nickname": "",
      "chatColor": null,
      "messages": [],

      "boxPos": {"x": 50, "y": canvas.height-32},
      "boxSize": {"x": 240, "y": 20},
      "boxFocused": false,
      "boxCurrent": "",

      "chatAnmTime": 0,
      "chatAnmTog": false,

      "colPos": {"x": 20, "y": canvas.height-32},
      "colSize": {"x": 20, "y": 20}
    };

    canvas.receiveMessage({
      "message": "Enter your nickname and send to join the chat.",
      "chatColor": null
    }, 1);
  }

  // #endregion


  // #region - Main

  canvas.draw = function() {
    if (canvas.deleteTimer>0) canvas.deleteTimer--; // Update delete timer
    if (keyIsDown(8) && canvas.chatInfo.boxFocused && canvas.deleteTimer==0) {
      canvas.chatInfo.boxCurrent = canvas.chatInfo.boxCurrent.slice(0, canvas.chatInfo.boxCurrent.length-1);
      canvas.deleteTimer = 5;
    }

    canvas.background(colors["tertiary"]);
    canvas.noStroke();
    canvas.fill(colors["secondary"]);

    canvas.textSize(45); // Show chat title
    canvas.text("Chat", canvas.width-20, 50);
    canvas.rect(0, 70, canvas.width, 2);
    if (canvas.chatInfo.nickname != "") {
      canvas.fill(canvas.chatInfo.chatColor);
      canvas.textAlign(LEFT);
      canvas.textSize(20);
      canvas.text(canvas.chatInfo.nickname, 25, 45);
      canvas.textAlign(RIGHT);
    }

    canvas.textSize(25); // Show chat messages
    let counter = 0;
    for (let i = canvas.chatInfo.messages.length-1; i >= 0; i--) {
      canvas.fill(canvas.chatInfo.messages[i].chatColor);
      canvas.text(canvas.chatInfo.messages[i].message, canvas.width-15, 100 + counter*30);
      counter += 1 + (canvas.chatInfo.messages[i].message.split("\n").length - 1);
    }

    canvas.rect(0, canvas.height-62, canvas.width, 2); // Show chat box
    canvas.fill(colors["primary"]);
    canvas.rect(0, canvas.height-60, canvas.width, 60);
    canvas.fill(colors["tertiary"]);
    canvas.rect(
      canvas.chatInfo.boxPos.x-8,
      canvas.chatInfo.boxPos.y-8,
      canvas.chatInfo.boxSize.x,
      canvas.chatInfo.boxSize.y
    );

    canvas.textSize(16); // Show box text
    canvas.fill(colors["secondary"]);
    canvas.text(
      canvas.chatInfo.boxCurrent,
      canvas.chatInfo.boxPos.x+canvas.chatInfo.boxSize.x-15,
      canvas.chatInfo.boxPos.y+canvas.chatInfo.boxSize.y-12
    );

    canvas.fill(colors["primary"]); // Cover unneeded box text
    canvas.rect(
      canvas.chatInfo.boxPos.x-40-8,
      canvas.chatInfo.boxPos.y-8,
      40,
      canvas.chatInfo.boxSize.y
    );

    canvas.fill(255);
    canvas.rect(
      canvas.chatInfo.colPos.x-8,
      canvas.chatInfo.colPos.y-8,
      canvas.chatInfo.colSize.x,
      canvas.chatInfo.colSize.y
    );

    if (canvas.chatInfo.boxFocused) { // Show chat selected
      if (canvas.chatInfo.chatAnmTog) {
        canvas.fill(colors["secondary"]);
        canvas.rect(
          canvas.chatInfo.boxPos.x+canvas.chatInfo.boxSize.x-8-4,
          canvas.chatInfo.boxPos.y-8+2,
          2,
          canvas.chatInfo.boxSize.y-4
        );
      }
      canvas.chatInfo.chatAnmTime--;
      if (canvas.chatInfo.chatAnmTime < 0) {
        canvas.chatInfo.chatAnmTime = 20;
        canvas.chatInfo.chatAnmTog = !canvas.chatInfo.chatAnmTog;
      }
    }

    if (showDebug) {
      canvas.fill(colors["secondary"]); // Debug
      canvas.text("Focused: " + canvas.canvasFocused, canvas.width*0.65, 35);
      canvas.text("Chat Focused: " + canvas.chatInfo.boxFocused, canvas.width*0.65, 60);
    }
  }

  // #endregion


  // #region - Other

  canvas.receiveMessage = function(data, type) { // Receive chat message
    data.message = formatText(data.message, 28);
    if (data.chatColor == null) {data.chatColor = colors["secondary"];
    } else if (type == 0) data.chatColor = color(data.chatColor[0],data.chatColor[1],data.chatColor[2]);
    canvas.chatInfo.messages.push(data);
  }


  canvas.sendMessage = function() { // Send chat message
    if (canvas.chatInfo.boxCurrent.length > 0) {
      if (canvas.chatInfo.nickname == "") {
        if (canvas.chatInfo.boxCurrent.length > 10) {
          canvas.receiveMessage({
            "message": "Enter a nickname 10 characters or less!",
            "chatColor": null
          }, 1);
        } else {
          socket.emit("chatRequestNickname", canvas.chatInfo.boxCurrent);
        }
      } else {
        socket.emit("chatSendMessage", canvas.chatInfo.boxCurrent);
      }
      canvas.chatInfo.boxCurrent = "";
    }
  }


  canvas.chatUpdateData = function(data) { // Update chat data
    canvas.chatInfo.chatColor = color(data.chatColor[0], data.chatColor[1], data.chatColor[2]);
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

  canvas.mousePressed = function() {
    if (canvas.insideCanvas()) {
      canvas.focusCanvas();

      canvas.chatInfo.boxFocused = ( // Focus chat box
        canvas.mouseX > canvas.chatInfo.boxPos.x
        && canvas.mouseX < (canvas.chatInfo.boxPos.x+canvas.chatInfo.boxSize.x)
        && canvas.mouseY > canvas.chatInfo.boxPos.y
        && canvas.mouseY < (canvas.chatInfo.boxPos.y+canvas.chatInfo.boxSize.y)
      );

      if (
        canvas.mouseX > canvas.chatInfo.colPos.x // Request color change
        && canvas.mouseX < (canvas.chatInfo.colPos.x+canvas.chatInfo.colSize.x)
        && canvas.mouseY > canvas.chatInfo.colPos.y
        && canvas.mouseY < (canvas.chatInfo.colPos.y+canvas.chatInfo.colSize.y)
        && canvas.chatInfo.nickname != ""
      ) {
        socket.emit("chatRequestColorChange");
      }
    }
  }
  canvas.focusCanvas = function() {
    canvas.canvasFocused = true;
    unfocusCanvas();
  }


  canvas.unfocusCanvas = function() {
    canvas.canvasFocused = false;
    canvas.chatInfo.boxFocused = false;
  }


  canvas.keyPressed = function() {
    if (canvas.chatInfo.boxFocused) {
      if (keyCode == 13) {
        canvas.sendMessage();

      } else {
        if (keyCode >= 65 && keyCode <= 90 || keyCode == 32) {
          if (keyIsDown(16)) {
            canvas.chatInfo.boxCurrent += key;
          } else {
            canvas.chatInfo.boxCurrent += key.toLowerCase();
          }
        }
      }
    }
  }

  // #endregion
}

// #endregion



// #region - Setup

let mainCanvasObj;
let historyCanvasObj;
let chatCanvasObj;

let fontRegular;
let fontBold;
let images;
let tokensData;
let sectionedTokenData;
let classesData;
let colors;
let screens;

let showDebug;
let currentScreen;
let connected;
let canvasFocused;


function preload() {
  document.onkeydown = function(e) {
    if (keyCode == 8) {
      e.preventDefault();
    }
  };

  fontRegular = loadFont("Assets/Font/gasalt.ttf");
  fontBold = loadFont("Assets/Font/gasaltbold.ttf");
  setupData();
}


function setup() {
  mainCanvasObj = createCanvas(800, 800);

  textAlign(CENTER);
  textFont(fontBold);
  textSize(30);
  imageMode(CENTER);
  setupVariables();
  connectToServer();

  historyCanvasObj = new p5(historyCanvas, "canvasContainer");
  mainCanvasObj.parent("canvasContainer");
  chatCanvasObj = new p5(chatCanvas, "canvasContainer");
}


function setupVariables() { // Set up the global variables
  colors = {
    "background": color(219, 199, 152),
    "primary": color(167, 148, 129),
    "secondary": color(62, 58, 49),
    "tertiary": color(230, 220, 194)
  };
  screens = [
    new IntroScreen(),
    new MenuScreen(),
    new ConnectScreen(),
    new GameScreen()
  ];

  showDebug = false;
  currentScreen = 0;
  connected = false;
  canvasFocused = true;
}

// #endregion


// #region - Main

function draw() {
  screens[currentScreen].update();
}


function getRandomToken() {
  let r1 = random(1);

  if (r1 < 0.675) { // Common
    let r2 = random(1);
    if (r2 <= 0.35 && tokensData.class[screens[3].class.name.toLowerCase()].common.length>0) {
      let r3 = floor(random(tokensData.class[screens[3].class.name.toLowerCase()].common.length));
      return tokensData.class[screens[3].class.name.toLowerCase()].common[r3];
    } else {
      let r3 = floor(random(tokensData.neutral.common.length));
      return tokensData.neutral.common[r3];
    }

  } else if (r1 < 0.675 + 0.25) { // Rare
    let r2 = random(1);
    if (r2 <= 0.35 && tokensData.class[screens[3].class.name.toLowerCase()].rare.length>0) {
      let r3 = floor(random(tokensData.class[screens[3].class.name.toLowerCase()].rare.length));
      return tokensData.class[screens[3].class.name.toLowerCase()].rare[r3];
    } else {
      let r3 = floor(random(tokensData.neutral.rare.length));
      return tokensData.neutral.rare[r3];
    }

  } else if (r1 < 0.675 + 0.25 + 0.075) { // Legendary
    let r2 = random(1);
    if (r2 <= 0.35 && tokensData.class[screens[3].class.name.toLowerCase()].legendary.length>0) {
      let r3 = floor(random(tokensData.class[screens[3].class.name.toLowerCase()].legendary.length));
      return tokensData.class[screens[3].class.name.toLowerCase()].legendary[r3];
    } else {
      let r3 = floor(random(tokensData.neutral.legendary.length));
      return tokensData.neutral.legendary[r3];
    }
  }
}


function countDecimals(value) {
  if (Math.floor(value) === value) return 0;
  return value.toString().split(".")[1].length || 0;
}


function fancyFormat(value, decimals) {
  let before = floor(Math.log10(value))+1;
  let after = min(countDecimals(value), 2);
  return nf(value, before, after);
}

// #endregion


// #region - Other

function alphaStroke(col, alpha) {
  stroke(
    red(col),
    green(col),
    blue(col),
    alpha
  );
}


function alphaFill(col, alpha) {
  fill(
    red(col),
    green(col),
    blue(col),
    alpha
  );
}


function formatText(text_, count) {
  let text = text_;
  for (let i = 0; i < text.length; i++) {
    if (i>0 && i%count==0) {
      text = text.slice(0, i) + "\n" +  text.slice(i, text.length);
    }
  }
  return text;
}


function insideCanvas() {
  return (
    mouseX > 0
    && mouseX < width
    && mouseY > 0
    && mouseY < height
  );
}

// #endregion


// #region - Input

function keyPressed() {
  if (canvasFocused) {
    if (keyCode == 81) showDebug = !showDebug;
    screens[currentScreen].keyPressed(keyCode);

  } else if (chatCanvasObj.canvasFocused) {
    chatCanvasObj.keyPressed();
  }
}


function mousePressed() {
  if (insideCanvas()) {
    screens[currentScreen].mousePressed();
    focusCanvas();
  }
}
function focusCanvas() {
  canvasFocused = true;
  chatCanvasObj.unfocusCanvas();
}
function unfocusCanvas() {
  canvasFocused = false;
}


function mouseReleased() {
  if (insideCanvas()) {
    screens[currentScreen].mouseReleased();
  }
}

// #endregion



class IntroScreen {
  // #region - Setup

  constructor() {
    this.resetVariables();
  }
  resetVariables() {}

  // #endregion


  // #region - Main

  update() {
    textFont(fontRegular);
    background(colors["background"]);
    noStroke();
    fill(colors["secondary"]);

    textSize(70);
    text("Drakken", width/2, height/2 + 10);

    textSize(40);
    text("Press any key to continue...", width/2, height/2 + 70);
  }

  // #endregion


  // #region - Input


  mousePressed() {
    currentScreen = 1;
  }



  keyPressed(keyCode) {}
  mouseReleased() {}

  // #endregion
}



class MenuScreen {
  // #region - Setup

  constructor() {
    this.resetVariables();
  }
  resetVariables() {
    this.scrollProgress = 1.5; // Menu variables

    this.outputTextInfo = { // Output text
      "text": "",
      "time": 0,
      "progress": 0
    };

    this.selectionInfo = { // Selection config
      "classSelected": null,
      "classInterval": 120,
      "classSize": 90,
      "classAlphaRadius": 2.5,
      "classCentre": {"x":width/2, "y":height-100},
      "classList": [],
      "tokenInterval": 100,
      "tokenSize": 70,
    };

    this.scrollInfo = { // Scroll config
      "scrollStart": 100,
      "scrollEnd": width-100,
      "scrollHeight": height-15,
      "scrollSize": 10,
      "barWidth": 50,
      "barPos": 100,
      "barSelected": false
    };

    for (let i = 0; i < classesData.length; i++) { // Additional setup
      this.selectionInfo.classList.push(
        new ShowClass(this, classesData[i], i)
      );
    }
    this.selectClass(0);
  }

  // #endregion


  // #region - Main

  update() { // Change scrollProgress based on mouse position
    textFont(fontBold);
    if (mouseY>this.selectionInfo.classCentre.y-this.selectionInfo.classSize*1.5) {
      let amount = map(
        mouseX-this.selectionInfo.classCentre.x,
        -125, 125,
        -1, 1);
      amount = Math.pow(amount, 3) * 0.035;
      this.scrollProgress += amount;
    }
    this.scrollProgress = constrain(this.scrollProgress, 1.5, this.selectionInfo.classList.length-2.5);

    background(colors["background"]); // Update showClasses
    for (let showClass of this.selectionInfo.classList) {
      showClass.update();
    }

    let sStart = this.scrollInfo.scrollStart; // Variables for scroll
    let sEnd = this.scrollInfo.scrollEnd;
    let sHeight = this.scrollInfo.scrollHeight;
    let sSize = this.scrollInfo.scrollSize;
    let sSelected = this.scrollInfo.barSelected;
    let sWidth = this.scrollInfo.barWidth;
    if (sSelected) {
      this.scrollInfo.barPos = constrain(mouseX-sWidth/2, sStart, sEnd-sWidth);
      this.scrollProgress = map(this.scrollInfo.barPos, sStart, sEnd-sWidth, 1.5, this.selectionInfo.classList.length-2.5);
    } else {
      this.scrollInfo.barPos = map(this.scrollProgress,
      1.5, this.selectionInfo.classList.length-2.5,sStart, sEnd-sWidth);
    }
    let pos = this.scrollInfo.barPos;

    noStroke(); // Draw scroll
    fill(colors["tertiary"]);
    ellipse(sStart, sHeight, sSize, sSize);
    ellipse(sEnd, sHeight, sSize, sSize);
    rect(sStart, sHeight-sSize/2, sEnd-sStart, sSize);
    fill(255);
    ellipse(pos, sHeight, sSize, sSize);
    rect(pos, sHeight-sSize/2, sWidth, sSize);
    ellipse(pos+sWidth, sHeight, sSize, sSize);


    if (this.outputTextInfo.text != null) { // Show output text
      let alpha = this.outputTextInfo.progress/this.outputTextInfo.time;
      alpha = 255 * (1-Math.pow(alpha, 5));
      noStroke();
      alphaFill(colors["secondary"], alpha);
      textSize(30);
      text(this.outputTextInfo.text, width/2, height-200);

      this.outputTextInfo.progress++; // Update output text
      if (this.outputTextInfo.progress > this.outputTextInfo.time) {
        this.outputTextInfo = {
          "text": "",
          "time": 0,
          "progress": 0
        };
      }
    }

    if (showDebug) {
      noStroke();
      fill(colors["secondary"]);
      text("focused: " + canvasFocused, width*0.15, 50);
    }
  }


  selectClass(classIndex) { // Select a showClass
    for (let o = 0; o < this.selectionInfo.classList.length; o++) {
      this.selectionInfo.classList[o].selected = o==classIndex;
    }
    this.selectionInfo.classSelected = this.selectionInfo.classList[classIndex];
  }


  startGame() { // Start the game
    screens[3].class = this.selectionInfo.classSelected.class;
    currentScreen = 2;
    screens[2].connectRequest();
  }

  // #endregion


  // #region - Input

  keyPressed(keyCode) {}


  mousePressed() {
    for (let i = 0; i < this.selectionInfo.classList.length; i++) { // Pressed show class
      if (this.selectionInfo.classList[i].ontop()) {
        if (this.selectionInfo.classList[i].selected) {
          this.startGame();
        } else {
          this.selectClass(i);
        }
      }
    }

    let start = this.scrollInfo.barPos; // Check if over scrollbar
    let end = start+this.scrollInfo.barWidth;
    let hgt = this.scrollInfo.scrollHeight;
    let size = this.scrollInfo.scrollSize;
    if (
      mouseX>start
      &&mouseX<end
      &&mouseY>hgt-size/2
      &&mouseY<hgt+size/2
    ) {
      this.scrollInfo.barSelected = true;
    }
  }


  mouseReleased() {
    this.scrollInfo.barSelected = false;
  }

  // #endregion
}

// #region - ShowClass

class ShowClass {
  constructor(menu_, class_, index_) {
    this.menu = menu_; // Setup variables
    this.class = class_;
    this.index = index_;

    this.selected = false;
    this.px = this.menu.selectionInfo.classCentre.x;
    this.py = this.menu.selectionInfo.classCentre.y;
    this.baseSize = this.menu.selectionInfo.classSize;
    this.size = this.baseSize;
    this.hoverProgress = 0;
  }


  update() {
    if (this.selected) { // Change size
      this.size = this.baseSize * 1.2;
    } else if (this.ontop()) {
      this.size = this.baseSize * 1.1;
    } else {
      this.size = this.baseSize;
    }

    let alpha = map( // Alpha based on distance from center
      abs(this.index-this.menu.scrollProgress),
      0, this.menu.selectionInfo.classAlphaRadius,
      0, 1
    );
    alpha = (1 - (alpha*alpha*alpha)) * 255;
    this.px =
    this.menu.selectionInfo.classCentre.x
    + (this.index-this.menu.scrollProgress)
    * this.menu.selectionInfo.classInterval;

    if (this.selected) { // Draw show class
      noStroke();
      alphaFill(colors["secondary"], alpha);
      ellipse(
        this.px, this.py,
        this.size+10, this.size+10
      );
    }
    tint(255, alpha);
    image(this.class.tokens[0].image, this.px, this.py, this.size, this.size);
    noTint();

    if (this.ontop()) { // Show play option
      textSize(30);
      if (this.selected) {
        noStroke();
        fill(255, 60);
        ellipse(this.px, this.py, this.size, this.size);

        strokeWeight(2);
        stroke(colors["secondary"]);
        fill(colors["tertiary"]);
        textSize(35);
        text("Play!", this.px, this.py+10);
      }

      noStroke(); // Show name
      alphaFill(colors["secondary"], alpha);
      text(this.class["name"], this.px, this.py - this.size*0.5 -10 -(this.selected?5:0));
    }

    if (showDebug) { // Show alpha when debugging
      noStroke();
      fill(0);
      textSize(15);
      text(nf(abs(this.index-this.menu.scrollProgress), 1, 1), this.px, this.py+5);
    }

    if (this.selected) { // Show title and description if selected
      noStroke();
      fill(colors["secondary"]);
      textSize(50);
      text(formatText(this.class.name, 50), 350, 75);
      rect(350- 22*this.class.name.length/2, 80, 22*this.class.name.length, 2);

      textSize(50);
      text("Tokens", width-100, 50);
      rect(width-100 -22*3, 55, 22*6, 2);

      textSize(30);
      text(formatText(this.class.description, 50), 350, 125);


      for (let i = 0; i < this.class.tokens.length; i++) { // Show each token
        let interval = this.menu.selectionInfo.tokenInterval;
        let size = this.menu.selectionInfo.tokenSize;
        let px = width-100;
        let py = 80+(i+0.35)*interval;
        image(this.class.tokens[i].image, px, py, size, size);
      }
    }
  }


  ontop() {
    return (
      dist(mouseX, mouseY, this.px, this.py) < this.size/2
      && abs(this.index-this.menu.scrollProgress) <= this.menu.selectionInfo.classAlphaRadius-0.125
    );
  }
}

// #endregion



class ConnectScreen {
  // #region - Setup

  constructor() {
    this.resetVariables();
  }
  resetVariables() {}

  // #endregion


  // #region - Main

  connectRequest() {
    socket.emit("gameConnectRequest");
  }


  gameConnectResponse(data) {
    if (data.accepted) {
      currentScreen = 3;
      screens[3].resetVariables();
      screens[3].playerName = data.name;
      screens[3].class = screens[1].selectionInfo.classSelected.class;;

    } else {
      currentScreen = 1;
      screens[1].outputTextInfo = {
        "text": "Could not connect",
        "time": 60,
        "progress": 0
      }
    }
  }


  update() {
    background(colors["background"]);
    noStroke();
    fill(colors["secondary"]);
    textSize(40);
    text("Connecting...", width/2, height/2 + 40/3);
  }

  // #endregion


  // #region - Input

  keyPressed() {}
  mousePressed() {}
  mouseReleased() {}

  // #endregion
}



class GameScreen {
  // #region - Setup

  constructor() {
    this.resetVariables();
  }


  resetVariables() {
    this.objectsInfo = {
      "tokenStart": {"x": 80, "y": 80},
      "tokenInterval": 120,
      "tokenSize": 100,

      "diceStart": {"x": 325, "y": height - 80},
      "diceInterval": 100,
      "diceSize": 80,
      "diceRowSize": 5,

      "lockPos": {"x": 20, "y": height - 120},
      "lockSize": {"x": 150, "y": 80},
      "locked": false,

      "extraTokenPos": {"x": 200, "y": height-110},
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
    this.class = null
    this.tokens = [];
    this.dice = [];
    this.score = 0;
    this.enemyScore = 0;
  }

  // #endregion


  // #region - Main

  update() {
    background(colors["background"]); // Token board
    noStroke();
    fill(colors["primary"]);
    rect(0, 0, 100, height);
    fill(colors["tertiary"]);
    rect(100, 0, 10, height);

    for (let i = 0; i < this.tokens.length; i++) { // Update tokens and dice
      this.tokens[i].update();
    }
    for (let i = 0; i < this.dice.length; i++) {
      this.dice[i].update();
    }

    noStroke(); // Show name and turn count
    textSize(42);
    textAlign(RIGHT);
    if (this.playerName == "Player 1") {fill(34, 117, 246);
    } else {fill(152, 40, 40)}
    text(this.playerName, width - 30, 50);
    fill(colors["secondary"]);
    image(this.class.tokens[0].image, width-205, 37.5, 50, 50);
    text("Turn " + this.turnCount, width - 30, 90);


    let sc1 = this.scoreInfo.enemyScoreGained - this.scoreInfo.enemyScoreLost; // Show enemy score
    if (sc1 > 0) {sc1 = "+"+fancyFormat(sc1, 2);
    } else if (sc1 < 0) {sc1 = fancyFormat(sc1, 2);
    } else {sc1 = "";}
    text("Enemy Score: " + fancyFormat(this.scoreInfo.enemyScore, 2) + sc1, width - 30, 140);

    let sc2 = this.scoreInfo.scoreGained - this.getScoreLost(); // Show friendly score
    if (sc2 > 0) {sc2 = "+"+fancyFormat(sc2, 2);
    } else if (sc2 < 0) {sc2 = fancyFormat(sc2, 2);
    } else {sc2 = "";}
    text("Score: " + fancyFormat(this.scoreInfo.score, 2) + sc2, width - 30, 180);
    text("Roll: " + (this.dice.length>0?this.getRoll():0), width - 30, 220);
    textAlign(CENTER);


    if (this.started && dist(mouseX, mouseY, width-205+8, 37.5+8) < 25) { // Show class info
      textSize(60);
      text(this.class.name, width/2 + 110/2, 300);
      textSize(35);
      text(formatText(this.class.description, 35) + "\n\n" + this.class.extraDescription(), width/2 + 110/2, 350);
    }

    strokeWeight(4); // Show lock button
    stroke(colors["secondary"]);
    if (this.objectsInfo.locked) { fill(210);
    } else if (this.ontopLock()) { fill(180);
    } else {fill(colors["primary"]);}
    rect(
      this.objectsInfo.lockPos.x,
      this.objectsInfo.lockPos.y,
      this.objectsInfo.lockSize.x,
      this.objectsInfo.lockSize.y
    );
    textSize(40);
    noStroke();
    fill(colors["secondary"]);
    text(
      this.objectsInfo.locked?"Locked":"Lock-In",
      this.objectsInfo.lockPos.x + this.objectsInfo.lockSize.x/2,
      this.objectsInfo.lockPos.y + this.objectsInfo.lockSize.y/2+10
    );

    strokeWeight(4); // Show extra token button
    stroke(colors["secondary"]);
    if (this.objectsInfo.extraTokenUsed) { fill(210);
    } else if (this.ontopExtraToken() && !this.objectsInfo.locked) { fill(180);
    } else {fill(colors["primary"]);}
    rect(
      this.objectsInfo.extraTokenPos.x,
      this.objectsInfo.extraTokenPos.y,
      this.objectsInfo.extraTokenSize.x,
      this.objectsInfo.extraTokenSize.y
    );
    if (this.ontopExtraToken()) {
      noStroke();
      fill(colors["secondary"]);
      textSize(30);
      textAlign(CENTER);
      text(
        "Extra token use (-20 score)",
        this.objectsInfo.extraTokenPos.x
        + this.objectsInfo.extraTokenSize.x/2,
        this.objectsInfo.extraTokenPos.y-35
      );
    }

    if (!this.started) { // Waiting for other player
      noStroke();
      fill(colors["secondary"]);
      textSize(50);
      text("Waiting for other player...", width/2 + 110/2, height/2);
    }
  }


  // #region - Game

  gameStart() { // Game started
    this.started = true;
    this.generateTokens(5);
    let dAmount = 5;
    let dSize = 6;
    if (this.class.name=="Ogre") {dAmount=4; dSize=8;}
    this.generateDice(dAmount, dSize);
  }


  gameTurn(data) { // Sent instantly as soon as both people are ready
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
  }


  gameEnd(data) { // Game ended - change screen back
    currentScreen = 1;
    screens[1].outputTextInfo = {
      "text": "Game ended: "+data,
      "time": 60,
      "progress": 0
    };
    historyCanvasObj.history = [];
  }


  gameScoreUpdateSend(type) { // After: token use, enemy token use, extra token
    let sendScoreInfo = {
      "score": this.scoreInfo.score,
      "scoreGained": this.scoreInfo.scoreGained,
      "scoreLost": this.getScoreLost(),
      "scoreDealt": this.scoreInfo.scoreDealt,
    }
    socket.emit("gameScoreUpdateSend", {"scoreInfo": sendScoreInfo, "type": type});
  }


  gameScoreUpdateReceive(data) {
    if (data.type == "update") {
      this.scoreInfo.enemyScore = data.scoreInfo.score;
      this.scoreInfo.enemyScoreGained = data.scoreInfo.scoreGained;
      this.scoreInfo.enemyScoreLost = data.scoreInfo.scoreLost;
      this.scoreInfo.enemyScoreDealt = data.scoreInfo.scoreDealt;
    } else {
      if (this.class.name == "Sniper") this.extraInfo.sniperStoredDamage += 0.35*data.scoreInfo.scoreGained;
    }
  }


  gameTokenUsed(data) { // Enemy used a token
    let currentToken = data.params[0].token;
    if (currentToken.category == "class") {
      tokensData.class[currentToken.class][currentToken.rarity][currentToken.index].otherAction(data.params);
    } else {
      tokensData.neutral[currentToken.rarity][currentToken.index].otherAction(data.params);
    }
    screens[3].gameScoreUpdateSend("update");
  }


  lockTurn() { // Officially lock turn in after everything done
    this.objectsInfo.locked = true;
    socket.emit("gameLockin");
  }


  getScoreLost() {
    let scoreLost = this.scoreInfo.scoreLost;
    if (this.class.name == "Ogre") scoreLost *= 0.65;
    if (this.extraInfo.blockDamage) scoreLost = 0;
    return scoreLost;
  }

  // #endregion


  // #region - Dice and Tokens

  generateTokens(amount) {
    for (let i = 0; i < amount; i++) {
      this.tokens.push(
        new ShowToken(null, this.tokens.length)
      );
    }
  }
  generateDice(amount, size) {
    console.log("generating " + amount + " d" + size + "'s");
    for (let i = 0; i < amount; i++) {
      this.dice.push(
        new ShowDice(size, this.dice.length)
      );
    }
  }


  updateTokenPositions() {
    for (let i = 0; i < this.tokens.length; i++) {
      this.tokens[i].index = i;
      this.tokens[i].updateBasePos();
    }
  }
  updateDicePositions() {
    for (let i = 0; i < this.dice.length; i++) {
      this.dice[i].index = i;
      this.dice[i].updateBasePos();
    }
  }


  selectToken(ind) {
    this.selectedTokens.push(this.tokens[ind]);
    this.tokens[ind].selected = true;
  }
  deselectTokens() {
    for (let i = 0; i < this.tokens.length; i++) {
      this.tokens[i].selected = false;
    }
  }
  removeToken(ind) {
    this.tokens.splice(ind, 1);
  }

  // #endregion


  // #region - Other

  ontopLock() {
    return (mouseX > this.objectsInfo.lockPos.x
    && mouseX < this.objectsInfo.lockPos.x+this.objectsInfo.lockSize.x
    && mouseY > this.objectsInfo.lockPos.y
    && mouseY < this.objectsInfo.lockPos.y+this.objectsInfo.lockSize.y);
  }


  ontopExtraToken() {
    return (mouseX > this.objectsInfo.extraTokenPos.x
    && mouseX < this.objectsInfo.extraTokenPos.x+this.objectsInfo.extraTokenSize.x
    && mouseY > this.objectsInfo.extraTokenPos.y
    && mouseY < this.objectsInfo.extraTokenPos.y+this.objectsInfo.extraTokenSize.y);
  }


  getRoll() {
    let total = 0;
    for (let i = 0; i < this.dice.length; i++) {
      total += this.dice[i].value;
    }
    return total;
  }

  // #endregion

  // #endregion


  // #region - Input

  mousePressed() {
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
  }


  keyPressed(keyCode) {}
  mouseReleased() {}

  // #endregion
}

// #region - ShowToken

class ShowToken {

  constructor(token_, index_) {
    if (token_ == null) {this.token = getRandomToken();
    } else {this.token = token_;}
    this.index = index_;

    this.used = false;
    this.size = screens[3].objectsInfo.tokenSize;
    this.updateBasePos();
    this.px = this.basePx-100;
    this.py = this.basePy;
    this.gotoPx = this.basePx;
    this.gotoPy = this.basePy;
    this.turns = 0;
  }


  updateBasePos() {
    this.basePx = screens[3].objectsInfo.tokenStart.x;
    this.basePy = screens[3].objectsInfo.tokenStart.y
      + screens[3].objectsInfo.tokenInterval*this.index;
  }


  update() {
    if (!this.used) { // Update base position
      this.gotoPx = this.basePx;
      this.gotoPy = this.basePy;
      if (this.ontop()) {
        this.gotoPx = this.basePx+20;
      }
    }

    if (this.px != this.gotoPx) { // Update actual position
      let dir = (this.gotoPx-this.px) / 5;
      if (abs(dir) < 0.02) {this.px = this.gotoPx;
      } else {this.px += dir}
    }
    if (this.py != this.gotoPy) {
      let dir = (this.gotoPy-this.py) / 5;
      if (abs(dir) < 0.02) {this.py = this.gotoPy;
      } else {this.py += dir}
    }

    if (this.used) { // Draw token
      noStroke();
      fill(colors["secondary"]);
      ellipse(
        this.px, this.py,
        this.size+10, this.size+10
      );
    }
    if (this.token.image != null) image(this.token.image, this.px, this.py, this.size, this.size);


    if (this.ontop()) { // Show name and description
      noStroke();
      fill(colors["secondary"]);
      textSize(60);
      text(this.token.name, width/2 + 110/2, 300);
      textSize(35);
      text(this.token.description, width/2 + 110/2, 350);
    }
  }


  animateOffscreen(params, callback) {
    this.used = true;
    this.gotoPx = -100;
    let ind = this.index;
    setTimeout(function(token) {
      screens[3].updateDicePositions();
      screens[3].removeToken(token.index);
      screens[3].updateTokenPositions();
    }, 600, this);
    setTimeout(function() {callback(params);}, 600);
  }


  click() {
    let complete = (!this.token.partial && !screens[3].objectsInfo.extraTokenHave);
    if (screens[3].objectsInfo.extraTokenHave) screens[3].objectsInfo.extraTokenHave = false;
    if (complete) screens[3].objectsInfo.locked = true;

    let showToken = this;
    this.used = true;
    socket.emit("historySend", {"text": (screens[3].playerName + " used " + showToken.token.name), "formatting": {}});


    this.token.action([
      complete,
      showToken
    ], function(params) { // After instant action, animate and affect enemy

      if (params[1].token.affectsEnemy) {
        socket.emit("gameTokenUsed", {
          "name": showToken.token.name,
          "params": params.slice(1,params.length)
        });
      }

      params[1].animateOffscreen(params, function(params) { // After animation, lock turn
        if (params[0]) screens[3].lockTurn();
        screens[3].gameScoreUpdateSend("update");
      });
    });
  }


  ontop() {
    return(
      dist(mouseX, mouseY, this.px, this.py) < this.size/2
      || (
        mouseX > 0
        && mouseX < this.px
        && mouseY > this.py-this.size/2
        && mouseY < this.py+this.size/2
      )
    );
  }


  turn() {
    this.turns++;
    if (this.token.name == "Pacify" && this.turns == 2) {
      this.animateOffscreen([], function() {
        screens[3].tokens.push(new ShowToken(tokensData.unobtainable[0], screens[3].tokens.length));
      });
    }
  }
}

// #endregion


// #region - ShowDice

class ShowDice {

  constructor(diceSize_, index_) {
    this.diceSize = diceSize_;
    this.index = index_;
    this.updateBasePos();
    this.reroll();
  }


  updateBasePos() {
    this.size = screens[3].objectsInfo.diceSize;
    this.px = screens[3].objectsInfo.diceStart.x
    + screens[3].objectsInfo.diceInterval*(this.index%screens[3].objectsInfo.diceRowSize);
    this.py = screens[3].objectsInfo.diceStart.y
    - floor(this.index/screens[3].objectsInfo.diceRowSize)
    * screens[3].objectsInfo.diceSize*1.2;
  }


  reroll() {
    this.value = floor(random(this.diceSize))+1;
  }


  update() {
    image(
      images.dice[6][this.value<=6?this.value:0],
      this.px, this.py,
      this.size, this.size
    );

    if (this.value > 6) {
      noStroke();
      fill(colors["tertiary"]);
      textSize(50);
      text(this.value, this.px, this.py+15);
    }
  }
}

// #endregion
