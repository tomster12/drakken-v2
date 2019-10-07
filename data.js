

function setupData() {
  // Setup extra images
  images = {
    "dice": {
      "6": [
        loadImage("Assets/Images/Dice/D60.png"),
        loadImage("Assets/Images/Dice/D61.png"),
        loadImage("Assets/Images/Dice/D62.png"),
        loadImage("Assets/Images/Dice/D63.png"),
        loadImage("Assets/Images/Dice/D64.png"),
        loadImage("Assets/Images/Dice/D65.png"),
        loadImage("Assets/Images/Dice/D66.png")
      ]
    }
  };

  // TokenData - (Name, Description, affects enemy, completes turn, local func, foreign func, image)
  tokensData = {
    "neutral": {
      "common": [
        new TokenData(
          "D8", "Roll a D8 and set all of your dice to its value.",
          false, false, loadImage("Assets/Images/Tokens/Neutral/Common/D8.png"),
          function(params, callback) {

            // Reroll first dice as a d8 and then set all other dices to be the same
            mainCanvas.screens[GAME].dice[0].diceSize = 8;
            mainCanvas.screens[GAME].dice[0].reroll();
            for (let i = 1; i < mainCanvas.screens[GAME].dice.length; i++) {
              mainCanvas.screens[GAME].dice[i].diceSize = 8;
              mainCanvas.screens[GAME].dice[i].value = mainCanvas.screens[GAME].dice[0].value;
            }
            callback(params);
          }, function(params) {},
        ),

        new TokenData(
          "Equaliser", "For each of your dice if they are even half them, if they are odd double them.",
          false, false, loadImage("Assets/Images/Tokens/Neutral/Common/Equaliser.png"),
          function(params, callback) {

            // For each dice if their value is even then half, otherwise double
            for (let i = 0; i < mainCanvas.screens[GAME].dice.length; i++) {
              if (mainCanvas.screens[GAME].dice[i].value % 2 == 0)
                mainCanvas.screens[GAME].dice[i].value /= 2;
              else mainCanvas.screens[GAME].dice[i].value *= 2;
            }
            callback(params);
          }, function(params) {},
        ),

        new TokenData(
          "Exponential", "Deal 15 to the enemies score, each time you use this multiply this amount by 1.1x.",
          true, false, loadImage("Assets/Images/Tokens/Neutral/Common/Exponential.png"),
          function(params, callback) {

            // Calculate damage based on how many exponentials used so far, increment count and then deal damage
            let damage = 15 * Math.pow(1.1, mainCanvas.screens[GAME].extraInfo.exponentialUsed);
            params.damage = damage;
            mainCanvas.screens[GAME].extraInfo.exponentialUsed++;
            mainCanvas.screens[GAME].scoreInfo.scoreDealt += damage;
            socket.emit("historySend", {
              "text": ("and dealt " + fancyFormat(damage, 2)),
              "formatting": {}
            });
            callback(params);
          }, function(params) {

            // Take damage based on damage parameter defined previously
            mainCanvas.screens[GAME].scoreInfo.scoreLost += params.damage;
          },
        ),

        new TokenData(
          "Corrosive Goo", "Deal 10% of your current score total to enemy. For each goo you have this is increased by 15% Additive; Uses all the goo in your hand.",
          true, false, loadImage("Assets/Images/Tokens/Neutral/Common/Goo.png"),
          function(params, callback) {

            // For each corrosive goo increment count and animate offscreen
            let count = 0;
            for (let i = 0; i < mainCanvas.screens[GAME].tokens.length; i++) {
              let currentToken = mainCanvas.screens[GAME].tokens[i];
              if (currentToken.token.name == "Corrosive Goo"
                && currentToken != params.showToken) {
                count++;
                currentToken.animateOffscreen([], function(params) {});
              }
            }

            // Calculate damage based on number of corrosive goos
            let damage = mainCanvas.screens[GAME].scoreInfo.score * (0.1 + 0.15 * count);
            params.damage = damage;
            mainCanvas.screens[GAME].scoreInfo.scoreDealt += damage;
            socket.emit("historySend", {"text": ("and dealt " + fancyFormat(damage, 2) + " with " + (count+1) + " goos"), "formatting": {}});
            callback(params);
          }, function(params) {

            // Take damage based on damage parameter defined previously
            mainCanvas.screens[GAME].scoreInfo.scoreLost += params[1];
          },
        ),

        new TokenData(
          "Heal", "Gain 15 to your score.",
          false, true, loadImage("Assets/Images/Tokens/Neutral/Common/Heal.png"),

          // Gain 15 score
          function(params, callback) {
            mainCanvas.screens[GAME].scoreInfo.scoreGained += 15;
            socket.emit("historySend", {"text": ("and gained " + 15), "formatting": {}});
            callback(params);
          }, function(params) {}
        ),

        new TokenData(
          "Deal", "Deal 15 to the enemies score.",
          true, true, loadImage("Assets/Images/Tokens/Neutral/Common/Kneel.png"),
          function(params, callback) {

            // Deal 15 score
            let damage = 15;
            params.damage = damage;
            socket.emit("historySend", {"text": ("and dealt " + fancyFormat(damage, 2)), "formatting": {}});
            callback(params);
          }, function(params) {

            // Take damage based on damage parameter defined previously
            mainCanvas.screens[GAME].scoreInfo.scoreLost += params.damage;
          },
        ),

        new TokenData(
          "Reroll", "Reroll all your dice.",
          false, true, loadImage("Assets/Images/Tokens/Neutral/Common/Reroll.png"),
          function(params, callback) {

            // Reroll each dice
            for (let i = 0; i < mainCanvas.screens[GAME].dice.length; i++)
              mainCanvas.screens[GAME].dice[i].reroll();
            callback(params);
          }, function(params) {},
        ),

        new TokenData(
          "Square", "Replace your roll with 2 d6s whose values are squared.",
          false, false, loadImage("Assets/Images/Tokens/Neutral/Common/Square.png"),
          function(params, callback) {

            // Empty dice then generate 2 d6. Square their value afterwards
            mainCanvas.screens[GAME].dice = [];
            mainCanvas.screens[GAME].generateDice(2, 6);
            for (let i = 0; i < mainCanvas.screens[GAME].dice.length; i++)
              mainCanvas.screens[GAME].dice[i].value = mainCanvas.screens[GAME].dice[i].value * mainCanvas.screens[GAME].dice[i].value;
            callback(params);
          }, function(params) {},
        )
      ],
      "rare": [
        new TokenData(
          "Interval", "For each dice become 3 * the interval (Minimum 1) between it and the next dice. This happens sequentially.",
          false, false, function(params, callback) {
            for (let i = 0; i < mainCanvas.screens[GAME].dice.length-1; i++) {
              let val = abs(mainCanvas.screens[GAME].dice[i+1].value-mainCanvas.screens[GAME].dice[i].value);
              val = val== 0 ? 1 : val;
              mainCanvas.screens[GAME].dice[i].value = val * 3;
            }
            callback(params);
          }, function(params) {},
          loadImage("Assets/Images/Tokens/Neutral/Rare/Interval.png")
        ),

        // new TokenData(
        //   "Joker", "Perform a random action of choice 6, onto a random player.",
        //   true, false, function(params, callback) {
        //     let r1 = floor(random(2));
        //     let r2 = floor(random(6));
        //     params.push(r1);
        //     params.push(r2);
        //     if (r1 == 0) {
        //       if (r2 == 0) {
        //         mainCanvas.screens[GAME].scoreInfo.scoreLost += 25;
        //         socket.emit("historySend", {"text": ("And lost 25 score"), "formatting": {}});
        //       } else if (r2 == 1) {
        //         mainCanvas.screens[GAME].scoreInfo.scoreGained += 25;
        //         socket.emit("historySend", {"text": ("And gained 25 score"), "formatting": {}});
        //       } else if (r2 == 2) {
        //         mainCanvas.screens[GAME].tokens.pop();
        //         mainCanvas.screens[GAME].tokens.pop();
        //         socket.emit("historySend", {"text": ("And lost 2 tokens"), "formatting": {}});
        //       } else if (r2 == 3) {
        //         socket.emit("historySend", {"text": ("tmp04"), "formatting": {}});
        //       } else if (r2 == 4) {
        //         socket.emit("historySend", {"text": ("tmp05"), "formatting": {}});
        //       } else if (r2 == 5) {
        //         socket.emit("historySend", {"text": ("tmp05"), "formatting": {}});
        //       }
        //     } else {
        //       if (r2 == 0) {
        //         mainCanvas.screens[GAME].scoreInfo.scoreDealt += 25;
        //         socket.emit("historySend", {"text": "And removed 25 score", "formatting": {}});
        //       } else if (r2 == 1) {
        //         mainCanvas.screens[GAME].scoreInfo.scoreDealt -= 25;
        //         socket.emit("historySend", {"text": ("And gave 25", "formatting": {}});
        //       } else if (r2 == 2) {
        //       socket.emit("historySend", {"text": ("And removed 2 tokens", "formatting": {}});
        //       } else if (r2 == 3) {
        //         socket.emit("historySend", {"text": ("tmp14"), "formatting": {}});
        //       } else if (r2 == 4) {
        //         socket.emit("historySend", {"text": ("tmp15"), "formatting": {}});
        //       } else if (r2 == 5) {
        //         socket.emit("historySend", {"text": ("tmp16"), "formatting": {}});
        //       }
        //     }
        //     callback(params);
        //   }, function(params) {
        //     if (params[1] == 1) {
        //       if (params[2] == 0) {
        //         mainCanvas.screens[GAME].scoreInfo.scoreLost += 25;
        //       } else if (params[2] == 1) {
        //         mainCanvas.screens[GAME].scoreInfo.scoreGained += 25;
        //       } else if (params[2] == 2) {
        //         mainCanvas.screens[GAME].tokens.pop();
        //         mainCanvas.screens[GAME].tokens.pop();
        //       } else if (params[2] == 3) {
        //       } else if (params[2] == 4) {
        //       } else if (params[2] == 5) {
        //       }
        //     }
        //   },
        //   loadImage("Assets/Images/Tokens/Neutral/Rare/Joker.png")
        // ),

        new TokenData(
          "Mitosis", "Empty your roll and roll a d10, if it's an even roll, split into 2 D10s and roll again, keep repeating cycle until there are no even rolls.",
          false, false, function(params, callback) {
            let toSplit = [];
            let splitCount = 0;
            mainCanvas.screens[GAME].dice = [new GameShowDice(9, 0), new GameShowDice(9, 1)];
            toSplit.push(mainCanvas.screens[GAME].dice[0]);
            toSplit.push(mainCanvas.screens[GAME].dice[1]);
            mainCanvas.screens[GAME].updateDicePositions();
            let trySplit = function() {
              if (toSplit[0].value%2 == 0) {
                splitCount++;
                socket.emit("historySend", {"text": ("Split! ("+mainCanvas.screens[GAME].getRoll()+", " + mainCanvas.screens[GAME].playerName+")"), "formatting": {}});
                let nd1 = new GameShowDice(9, 0);
                let nd2 = new GameShowDice(9, 0);
                mainCanvas.screens[GAME].dice.push(nd1);
                mainCanvas.screens[GAME].dice.push(nd2);
                toSplit.push(nd1);
                toSplit.push(nd2);
                mainCanvas.screens[GAME].dice.splice(mainCanvas.screens[GAME].dice.indexOf(toSplit[0]), 1);
                mainCanvas.screens[GAME].updateDicePositions();
              }
              toSplit.splice(0, 1);
              if (toSplit.length > 0) {setTimeout(trySplit, toSplit[0].value%2==0?500:0);
              } else {setTimeout(callback(params), 2000)}
            }
            let timer = toSplit[0].value%2==0?500:0;
            setTimeout(trySplit(), timer);
          }, function(params) {},
          loadImage("Assets/Images/Tokens/Neutral/Rare/Mitosis.png")
        ),


        new TokenData(
          "Ten Ten", "Roll a d10, and then set your roll to that many 10 valued d10s.",
          false, false, function(params, callback) {
            mainCanvas.screens[GAME].dice = [];
            let amount = floor(random(10))+1;
            for (let i = 0; i < amount; i++) {
              mainCanvas.screens[GAME].dice.push(new GameShowDice(10, i));
            }
            callback(params);
          }, function(params) {},
          loadImage("Assets/Images/Tokens/Neutral/Rare/TenTen.png")
        ),

        new TokenData(
          "Dead Mans Hand", "Reroll your tokens.",
          false, true, function(params, callback) {
            for (let i = 0; i < mainCanvas.screens[GAME].tokens.length; i++) {
              if (mainCanvas.screens[GAME].tokens[i] != params[1]) {
                mainCanvas.screens[GAME].tokens[i].animateOffscreen([], function(params) {});
              }
            }
            mainCanvas.screens[GAME].generateTokens(5);
            callback(params);
          }, function(params) {},
          loadImage("Assets/Images/Tokens/Neutral/Rare/DeadMansHand.png")
        ),

        new TokenData(
          "Quartic", "Set the size of your first 4 dice to the square of their value, and reroll them.",
          false, false, function(params, callback) {
            for (let i = 0; i < min(4, mainCanvas.screens[GAME].dice.length); i++) {
              mainCanvas.screens[GAME].dice[i].diceSize = Math.pow(mainCanvas.screens[GAME].dice[i].value, 2);
              mainCanvas.screens[GAME].dice[i].reroll();
            }
            callback(params);
          }, function(params) {},
          loadImage("Assets/Images/Tokens/Neutral/Rare/Quartic.png")
        ),

        new TokenData(
          "Pacify", "Block all incoming damage this turn. After 2 turns wilts into thorns.",
          false, false, function(params, callback) {
            mainCanvas.screens[GAME].extraInfo.blockDamage = true;
            callback(params);
          }, function(params) {},
          loadImage("Assets/Images/Tokens/Neutral/Rare/Pacify.png")
        )
      ],
      "legendary": [
        new TokenData(
          "Big Bertha", "Roll a d150, set this to your roll and deal 50% to the enemies score.",
          true, false, function(params, callback) {
            mainCanvas.screens[GAME].dice = [new GameShowDice(150, 0)];
            let damage = mainCanvas.screens[GAME].dice[0].value * 0.5;
            params.push(damage);
            mainCanvas.screens[GAME].scoreInfo.scoreDealt += damage;
            socket.emit("historySend", {"text": ("And dealt " + fancyFormat(damage, 2)), "formatting": {}});
            callback(params);
          }, function(params) {mainCanvas.screens[GAME].scoreInfo.scoreLost += params[1]},
          loadImage("Assets/Images/Tokens/Neutral/Legendary/BigBertha.png"), null
        ),

        new TokenData(
          "50/50", "50% chance to gain 50% of your score, 50% chance to lose 50% of your score.",
          false, false, function(params, callback) {
            if (random() < 0.5) {
              mainCanvas.screens[GAME].scoreInfo.scoreGained += mainCanvas.screens[GAME].scoreInfo.score/2;
              socket.emit("historySend", {"text": ("And gained 50% score"), "formatting": {}});
            } else {
              mainCanvas.screens[GAME].scoreInfo.scoreLost += mainCanvas.screens[GAME].scoreInfo.score/2;
              socket.emit("historySend", {"text": ("And lost 50% score"), "formatting": {}});
            }
            callback(params);
          }, function(params) {},
          loadImage("Assets/Images/Tokens/Neutral/Legendary/FiftyFifty.png")
        ),

        // new TokenData(
        //   "Gamble", "50% chance to take half of enemies score. 50% chance the enemy half takes of yours.",
        //   true, false, function(params, callback) {
        //     params.push("outbound");
        //     if (random() < 0.5) { // Give 50% to enemy
        //       params.push("give");
        //       params.push(mainCanvas.screens[GAME].scoreInfo.score * 0.5);
        //       mainCanvas.screens[GAME].scoreInfo.scoreLost += mainCanvas.screens[GAME].scoreInfo.score * 0.5;
        //       socket.emit("historySend", {"text": ("and gave 50% score!"), "formatting": {}});
        //     } else {
        //       params.push("take");
        //     }
        //     callback(params);
        //   }, function(params) {
        //     if (params[1] == "outbound") {
        //       if (params[2] == "give") {
        //         mainCanvas.screens[GAME].scoreInfo.scoreGained += params[3];
        //       } else {
        //         socket.emit("gameTokenUsed", {"name": "Gamble", "params": {"showToken": params.showToken, "inbound", mainCanvas.screens[GAME].scoreInfo.score * 0.5}});
        //         mainCanvas.screens[GAME].scoreInfo.scoreLost += mainCanvas.screens[GAME].scoreInfo.score * 0.5;
        //       }
        //
        //     } else {
        //       mainCanvas.screens[GAME].scoreInfo.scoreGained += params[2];
        //       mainCanvas.screens[GAME].scoreInfo.scoreDealt += params[2];
        //       socket.emit("historySend", {"text": ("and took 50% score!"), "formatting": {}});
        //     }
        //   },
        //   loadImage("Assets/Images/Tokens/Neutral/Legendary/Gamble.png")
        // )
      ],
    },

    "class": {
      "one": {
        "common": [
          new TokenData(
            "Blank", "When used sets itself, and any others, to token your topmost non Blank token.",
            false, true, loadImage("Assets/Images/Tokens/Class/OneTrick/Blank.png"),

            function(params, callback) {
              let replaceToken = null;
              for (let i = 0; i < mainCanvas.screens[GAME].tokens.length; i++) {
                if (mainCanvas.screens[GAME].tokens[i].token.name != "Blank") {
                  replaceToken = mainCanvas.screens[GAME].tokens[i];
                  break;
                }
              }
              if (replaceToken != null) {
                for (let i = 0; i < mainCanvas.screens[GAME].tokens.length; i++) {
                  if (mainCanvas.screens[GAME].tokens[i] != params[1] && mainCanvas.screens[GAME].tokens[i].token.name == "Blank") {
                    mainCanvas.screens[GAME].tokens[i].token = replaceToken.token;
                  }
                }
                mainCanvas.screens[GAME].generateTokens(1);
                mainCanvas.screens[GAME].tokens[mainCanvas.screens[GAME].tokens.length-1].token = replaceToken.token;
              }
              callback(params);
            }, function(params) {},
          )
        ],
        "rare": [],
        "legendary": []
      },

      "ogre": {
        "common": [
          new TokenData(
            "Drumstick", "Deal 20 to their score, heal 20 to your score.",
            true, true, loadImage("Assets/Images/Tokens/Class/Ogre/Drumstick.png"),

            function(params, callback) {
              mainCanvas.screens[GAME].scoreInfo.scoreGained += 20;
              mainCanvas.screens[GAME].scoreInfo.scoreDealt += 20;
              socket.emit("historySend", {"text":("And gained 20 score"), "formatting":{}});
              socket.emit("historySend", {"text":("And dealt 20 score"), "formatting":{}});
              callback(params);
            }, function(params) {
              mainCanvas.screens[GAME].scoreInfo.scoreLost += 20;
            },
          )
        ],
        "rare": [],
        "legendary": []
      },

      "sniper": {
        "common": [
          new TokenData(
            "Iris", "This is a token",
            false, true, loadImage("Assets/Images/Tokens/Class/Sniper/Iris.png"),
            function(params, callback) {callback(params);}, function(params) {},
          )
        ],
        "rare": [
          new TokenData(
            "Precision", "Uses 75% stored power to deal 100% stored power to the enemy, with a 25% of critical hit, which multiplies output by 4x but uses all stored power.",
            true, false, loadImage("Assets/Images/Tokens/Class/Sniper/Precision.png"),

            function(params, callback) {
              let damage = mainCanvas.screens[GAME].extraInfo.sniperStoredDamage;
              let r1 = random();
              if (r1 < 0.25) {
                damage *= 4;
                mainCanvas.screens[GAME].extraInfo.sniperStoredDamage = 0;
                socket.emit("historySend", {"text": ("And dealt " + damage + " with a critical hit!"), "formatting":{}});
              } else {
                mainCanvas.screens[GAME].extraInfo.sniperStoredDamage *= 0.25;
                socket.emit("historySend", {"text": ("And dealt " + damage), "formatting":{}});
              }
              mainCanvas.screens[GAME].scoreInfo.scoreDealt += damage;
              params.push(damage);
              callback(params);

            }, function(params) {
              mainCanvas.screens[GAME].scoreInfo.scoreLost += params[1];
            },
          )
        ],
        "legendary": []
      },

      "theif": {
        "common": [
          new TokenData(
            "Conspire", "This is a token",
            false, false, loadImage("Assets/Images/Tokens/Class/Thief/Conspire.png"),
            function(params, callback) {callback(params);}, function(params) {},
          )
        ],
        "rare": [],
        "legendary": []
      },

      "warlock": {
        "common": [],
        "rare": [
          new TokenData(
            "Life Sap", "Discard 10% of his score to sap 20% of the enemy's.",
            true, false, loadImage("Assets/Images/Tokens/Class/Warlock/LifeSap.png"),
            function(params, callback) {

              // Lose 10% score
              let scoreLost = mainCanvas.screens[GAME].scoreInfo.score * 0.1;
              mainCanvas.screens[GAME].scoreInfo.scoreLost += scoreLost;
              socket.emit("historySend", {"text": ("To sacrifice " + fancyFormat(damage, 2)), "formatting": {}});
              params.direction = "outbound";
              callback(params);
            }, function(params) {

              // Give 20% score
              if (params.direction == "outbound") {
                let scoreSapped = mainCanvas.screens[GAME].scoreInfo.score * 0.2;
                mainCanvas.screens[GAME].scoreInfo.scoreLost += scoreSapped;
                params.direction = "inbound";
                params.scoreSapped = scoreSapped;
                socket.emit("gameTokenUsed", params);

              // Gain 20% of enemy score
              } else if (params.direction == "inbound") {
                mainCanvas.screens[GAME].scoreInfo.scoreGained += params.scoreSapped;
                mainCanvas.screens[GAME].scoreInfo.scoreDealt += params.scoreSapped;
                socket.emit("historySend", {"text": ("And sapped " + fancyFormat(params[2], 2)), "formatting": {}});
              }
            },
          )
        ],
        "legendary": []
      }
    },

    "unobtainable": [
      new TokenData(
        "Thorns", "Deal 15 damage to yourself",
        false, false, loadImage("Assets/Images/Tokens/Unobtainable/Thorns.png"),
        function(params, callback) {

          mainCanvas.screens[GAME].scoreInfo.scoreLost += 15;
          callback(params);
        }, function(params) {},
      )
    ]
  }

  // ClassData - (classID, name, description, custom tokens)
  classesData = [
    new ClassData(
      "One",
      "One Trick depends on building for large, game-changing combos using his powerful class tokens.",
      function() {return "";}
    ),
    new ClassData(
      "Sniper",
      "The sniper relies on large, powerful blasts to the enemies score. He stores a small amount of score that the enemy gains to be used against them.",
      function() {return "Stored power: " + mainCanvas.screens[GAME].extraInfo.sniperStoredDamage;}
    ),
    new ClassData(
      "Warlock",
      "The warlock primarily focuses on keeping tempo and controlling score, until he can pull of his legendary combo. Every amount that he deals to the enemy, he gains half in score and every amount that the enemy gains, he loses half in score.",
      function() {return "";}
    ),
    new ClassData(
      "Ogre",
      "A big lad who takes 35% less damage and permanently rolls 4 D8s instead of the default 5 D6s.",
      function() {return "";}
    ),
    new ClassData(
      "c0",
      "This is the description for c0",
      function() {return "";}
    ),
    new ClassData(
      "c1",
      "This is the description for c1",
      function() {return "";}
    ),
    new ClassData(
      "c2",
      "This is the description for c2",
      function() {return "";}
    )
  ];

  // For each class
  for (let i = 0; i < classesData.length; i++) {
    if (tokensData.class[classesData[i].name.toLowerCase()] != null) {
      classesData[i].tokens = [
        tokensData.class[classesData[i].name.toLowerCase()].common,
        tokensData.class[classesData[i].name.toLowerCase()].rare,
        tokensData.class[classesData[i].name.toLowerCase()].legendary
      ];
    }
    classesData[i].showImage =
      classesData[i].tokens[0].length > 0
      ? classesData[i].tokens[0][0].image
      : classesData[i].tokens[1].length > 0
      ? classesData[i].tokens[1][0].image
      : classesData[i].tokens[2].length > 0
      ? classesData[i].tokens[2][0].image
      : tokensData.neutral.common[0].image;
    if (classesData[i].showImage == null) console.log("test" + classesData[i].name);
  }

  // For each token in each rarity in neutral - Set category/rarity/index, format description
  for (let [rarity, tokens] of Object.entries(tokensData.neutral)) {
    for (let i = 0; i < tokens.length; i++) {
      tokens[i].category = "neutral";
      tokens[i].rarity = rarity;
      tokens[i].index = i;
    }
  }

  // For each token in each rarity in each class - Set category/rarity/index/class, format description
  for (let [cls, rarities] of Object.entries(tokensData.class)) {
    for (let [rarity, tokens] of Object.entries(rarities)) {
      for (let i = 0; i < tokens.length; i++) {
        tokens[i].category = "class";
        tokens[i].rarity = rarity;
        tokens[i].index = i;
        tokens[i].class = cls;
      }
    }
  }

  // For each token in unobtainable - Set category/index, format description
  for (let i = 0; i < tokensData.unobtainable.length; i++) {
    tokensData.unobtainable[i].category = "unobtainable";
    tokensData.unobtainable[i].index = i;
  }

  // Setup colors
  colors = {
    "background": color(219, 199, 152),
    "primary": color(167, 148, 129),
    "secondary": color(62, 58, 49),
    "tertiary": color(230, 220, 194)
  };
}


// #region - Data

class ClassData {
  constructor(name_, description_, tokens_, extraDescription_) {
    this.name = name_;
    this.description = description_;
    this.extraDescription = extraDescription_;

    this.tokens = [[], [], []];
    this.showImage = null;
  }
}


class TokenData {
  constructor(name_, description_,
  affectsEnemy_, partial_, image_,
  action_, foreignAction_) {

    this.name = name_;
    this.description = description_;

    this.affectsEnemy = affectsEnemy_;
    this.partial = partial_;
    this.action = action_;
    this.foreignAction = foreignAction_;
    this.image = image_;

    this.category = "not set";
    this.rarity = "not set";
    this.index = -1;
  }
}

// #endregion
