

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
  // The callback animates, updates score, locks if neccessary and sends foreign action if neccessary
  tokensData = {
    "neutral": {
      "common": [
        new TokenData(
          "D8", "Set your first dice to a D8 and reroll then set all your dice to be copies.",
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
          "Equaliser", "For each of your dice if they are even half their value, if they are odd double their value.",
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
            mainCanvas.screens[GAME].gameScoreUpdate(0, 0, damage);
            socket.emit("historySend", {
              "text": ("and dealt " + fancyFormat(damage, 2)),
              "formatting": {}
            });
            callback(params);
          }, function(params) {

            // Take damage based on damage parameter defined previously
            mainCanvas.screens[GAME].gameScoreUpdate(0, params.damage, 0);
          },
        ),

        new TokenData(
          "Corrosive Goo", "Deal 10% of your current score total to enemy. For each goo you have this is increased by 15% Additive; Uses all the goo in your hand.",
          true, false, loadImage("Assets/Images/Tokens/Neutral/Common/Goo.png"),
          function(params, callback) {

            // For each corrosive goo increment count and animate offscreen
            let count = 0;
            params.preventAnimation = true;
            for (let i = 0; i < mainCanvas.screens[GAME].tokens.length; i++) {
              let currentToken = mainCanvas.screens[GAME].tokens[i];
              if (currentToken.token.name == "Corrosive Goo") {
                count++;
                currentToken.animateOffscreen([], function(params) {});
              }
            }

            // Calculate damage based on number of corrosive goos
            let damage = mainCanvas.screens[GAME].scoreInfo.score * (0.1 + 0.15 * count);
            params.damage = damage;
            mainCanvas.screens[GAME].gameScoreUpdate(0, 0, damage);
            socket.emit("historySend", {"text": ("and dealt " + fancyFormat(damage, 2) + " with " + (count+1) + " goos"), "formatting": {}});
            callback(params);
          }, function(params) {

            // Take damage based on damage parameter defined previously
            mainCanvas.screens[GAME].gameScoreUpdate(0, params[1], 0);
          },
        ),

        new TokenData(
          "Heal", "Gain 15 to your score.",
          false, true, loadImage("Assets/Images/Tokens/Neutral/Common/Heal.png"),

          // Gain 15 score
          function(params, callback) {
            mainCanvas.screens[GAME].gameScoreUpdate(15, 0, 0);
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
            mainCanvas.screens[GAME].gameScoreUpdate(0, 0, params.damage);
            socket.emit("historySend", {"text": ("and dealt " + fancyFormat(damage, 2)), "formatting": {}});
            callback(params);
          }, function(params) {

            // Take damage based on damage parameter defined previously
            mainCanvas.screens[GAME].gameScoreUpdate(0, params.damage, 0);
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
          "Square", "Remove your dice, roll 2 D6, then square their values.",
          false, false, loadImage("Assets/Images/Tokens/Neutral/Common/Square.png"),
          function(params, callback) {

            // Empty dice then generate 2 d6. Square their value afterwards
            mainCanvas.screens[GAME].dice = [];
            mainCanvas.screens[GAME].generateDice(2, 6);
            for (let i = 0; i < mainCanvas.screens[GAME].dice.length; i++) {
              let val = mainCanvas.screens[GAME].dice[i].value;
              mainCanvas.screens[GAME].dice[i].value = val * val;
            }
            callback(params);
          }, function(params) {}
        )
      ],
      "rare": [
        new TokenData(
          "Interval", "Each dice values get set to 3 * the interval (Minimum 1) between it and the next dice. This happens sequentially.",
          false, false, loadImage("Assets/Images/Tokens/Neutral/Rare/Interval.png"),
          function(params, callback) {

            // For each dice set its value to the difference between it and the next with minimum of 1
            for (let i = 0; i < mainCanvas.screens[GAME].dice.length - 1; i++) {
              let val = abs(mainCanvas.screens[GAME].dice[i + 1].value - mainCanvas.screens[GAME].dice[i].value);
              mainCanvas.screens[GAME].dice[i].value = max(1, val) * 3;
            }
            callback(params);
          }, function(params) {}
        ),

        // new TokenData(
        //   "Joker", "Perform a random action of choice 6, onto a random player.",
        //   true, false, loadImage("Assets/Images/Tokens/Neutral/Rare/Joker.png"),
        //   function(params, callback) {
        //     let r1 = floor(random(2));
        //     let r2 = floor(random(6));
        //     params.push(r1);
        //     params.push(r2);
        //     if (r1 == 0) {
        //       if (r2 == 0) {
        //         mainCanvas.screens[GAME].gameScoreUpdate(0, 25, 0);
        //         socket.emit("historySend", {"text": ("And lost 25 score"), "formatting": {}});
        //       } else if (r2 == 1) {
        //         mainCanvas.screens[GAME].gameScoreUpdate(25, 0, 0);
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
        //         mainCanvas.screens[GAME].gameScoreUpdate(0, 0, 25);
        //         socket.emit("historySend", {"text": "And removed 25 score", "formatting": {}});
        //       } else if (r2 == 1) {
        //         mainCanvas.screens[GAME].gameScoreUpdate(0, 0, -25);
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
        //         mainCanvas.screens[GAME].gameScoreUpdate(0, 25, 0);
        //       } else if (params[2] == 1) {
        //         mainCanvas.screens[GAME].gameScoreUpdate(25, 0, 0);
        //       } else if (params[2] == 2) {
        //         mainCanvas.screens[GAME].tokens.pop();
        //         mainCanvas.screens[GAME].tokens.pop();
        //       } else if (params[2] == 3) {
        //       } else if (params[2] == 4) {
        //       } else if (params[2] == 5) {
        //       }
        //     }
        //   }
        // ),

        new TokenData(
          "Mitosis", "Remove your dice and roll 2 D9s. repeatedly split any dice you own that are even into 2 D9s and reroll their value.",
          false, false, loadImage("Assets/Images/Tokens/Neutral/Rare/Mitosis.png"),
          function(params, callback) {
            let splitCount = 0;

            // Remove dice and roll 2 d9s which are to be split
            mainCanvas.screens[GAME].dice = [];
            mainCanvas.screens[GAME].dice.push(new GameShowDice(mainCanvas, 9));
            mainCanvas.screens[GAME].dice.push(new GameShowDice(mainCanvas, 9));
            mainCanvas.screens[GAME].updateDicePositions();

            // Recursive function to split all dice
            let trySplit = function() {
              let i = 0;
              let split = false;
              while (i < mainCanvas.screens[GAME].dice.length) {
                if (mainCanvas.screens[GAME].dice[i].value % 2 == 0) {
                  splitCount++;
                  mainCanvas.screens[GAME].dice.push(new GameShowDice(mainCanvas, 9));
                  mainCanvas.screens[GAME].dice.push(new GameShowDice(mainCanvas, 9));
                  mainCanvas.screens[GAME].dice.splice(i, 1);
                  mainCanvas.screens[GAME].updateDicePositions();
                  socket.emit("historySend", {"text": (
                    "Split! (" + mainCanvas.screens[GAME].getRoll()
                    + ", " + mainCanvas.screens[GAME].playerName
                    + ", " + splitCount + ")"
                  ), "formatting": {}});
                  split = true;
                  break;
                }
              }

              // Split again or callback with params
              if (split) setTimeout(trySplit, 500);
              else setTimeout(callback(params), 2000);
            }; trySplit();
          }, function(params) {}
        ),


        new TokenData(
          "Ten Ten", "Roll a D10, Remove your dice and add X D10s with value 10, where X is the original dice's value.",
          false, false, loadImage("Assets/Images/Tokens/Neutral/Rare/TenTen.png"),
          function(params, callback) {

            // Set dice to 'amount' D10s with value 10
            let amount = floor(random(10)) + 1;
            mainCanvas.screens[GAME].dice = [];
            for (let i = 0; i < amount; i++)
              mainCanvas.screens[GAME].dice.push(new GameShowDice(mainCanvas, 10));
            mainCanvas.screens[GAME].updateDicePositions();
            callback(params);
          }, function(params) {}
        ),

        new TokenData(
          "Dead Mans Hand", "Reroll your tokens.",
          false, true, loadImage("Assets/Images/Tokens/Neutral/Rare/DeadMansHand.png"),
          function(params, callback) {

            // Animate all tokens offscreen apart from token that called this action
            // The token that called this action will be animated offscreen in the callback
            let count = mainCanvas.screens[GAME].tokens.length;
            for (let i = 0; i < count; i++) {
              params.preventAnimation = true;
              mainCanvas.screens[GAME].tokens[i].animateOffscreen({}, function(params) {});
            } mainCanvas.screens[GAME].generateTokens(count);
            callback(params);
          }, function(params) {}
        ),

        new TokenData(
          "Quartic", "Set the size of your first 4 dice to the square of their value, and reroll them.",
          false, false, loadImage("Assets/Images/Tokens/Neutral/Rare/Quartic.png"),
          function(params, callback) {

            // Set first 4 or less dices size to square of their value and reroll
            for (let i = 0; i < min(4, mainCanvas.screens[GAME].dice.length); i++) {
              mainCanvas.screens[GAME].dice[i].diceSize = Math.pow(mainCanvas.screens[GAME].dice[i].value, 2);
              mainCanvas.screens[GAME].dice[i].reroll();
            }
            callback(params);
          }, function(params) {}
        ),

        new TokenData(
          "Pacify", "Block all incoming damage this turn. After 2 turns wilts into thorns.", // TODO custom description
          false, false, loadImage("Assets/Images/Tokens/Neutral/Rare/Pacify.png"),
          function(params, callback) {

            // Set blockDamage to true
            mainCanvas.screens[GAME].extraInfo.blockDamage = true;
            callback(params);
          }, function(params) {}
        )
      ],
      "legendary": [
        new TokenData(
          "Big Bertha", "Roll a D200, set this to your roll and deal 50% to the enemies score.",
          true, false, loadImage("Assets/Images/Tokens/Neutral/Legendary/BigBertha.png"),
          function(params, callback) {

            // Set dices to a single D200
            mainCanvas.screens[GAME].dice = [new GameShowDice(mainCanvas, 200)];
            mainCanvas.screens[GAME].updateDicePositions();

            // Deal damage to the enemy equal to half the score of the D200
            let damage = mainCanvas.screens[GAME].dice[0].value * 0.5;
            params.damage = dmaage;
            mainCanvas.screens[GAME].gameScoreUpdate(0, 0, damage);
            socket.emit("historySend", {"text": ("And dealt " + fancyFormat(damage, 2)), "formatting": {}});
            callback(params);
          }, function(params) {

            // Take damage
            mainCanvas.screens[GAME].gameScoreUpdate(0, params.damage, 0);
          }
        ),

        new TokenData(
          "50/50", "50% chance to gain 50% of your score, 50% chance to lose 50% of your score.",
          false, false, loadImage("Assets/Images/Tokens/Neutral/Legendary/FiftyFifty.png"),
          function(params, callback) {

            // Gain 50% score
            if (random() < 0.5) {
              mainCanvas.screens[GAME].gameScoreUpdate(mainCanvas.screens[GAME].scoreInfo.score * 0.5, 0, 0);
              socket.emit("historySend", {"text": ("And gained 50% score"), "formatting": {}});

            // Lose 50% score
            } else {
              mainCanvas.screens[GAME].gameScoreUpdate(0, mainCanvas.screens[GAME].scoreInfo.score * 0.5, 0);
              socket.emit("historySend", {"text": ("And lost 50% score"), "formatting": {}});
            }
            callback(params);
          }, function(params) {}
        ),

        new TokenData(
          "Gamble", "50% chance to take half of enemies score. 50% chance the enemy half takes of yours.",
          true, false, loadImage("Assets/Images/Tokens/Neutral/Legendary/Gamble.png"),
          function(params, callback) {
            params.direction = "outbound";

            // Give 50% to enemy
            if (random() < 0.5) {
              params.amount = mainCanvas.screens[GAME].scoreInfo.score * 0.5;
              mainCanvas.screens[GAME].gameScoreUpdate(0, params.amount, 0);
              socket.emit("historySend", {"text": ("and gave 50% score!"), "formatting": {}});
            } else params.amount = null;
            callback(params);
          }, function(params) {

            // Receive 50% from enemy
            if (params.direction == "outbound") {
              if (params.amount != null) mainCanvas.screens[GAME].gameScoreUpdate(params.amount, 0, 0);

              // 50% stolen by enemy
              else {
                params.durection = "inboud";
                params.amount = mainCanvas.screens[GAME].scoreInfo.score * 0.5;
                socket.emit("gameTokenUsed", params);
                mainCanvas.screens[GAME].gameScoreUpdate(0, mainCanvas.screens[GAME].scoreInfo.score * 0.5, 0);
              }

            // Stolen 50% from enemy
            } else {
              mainCanvas.screens[GAME].gameScoreUpdate(params.amount, 0, params.amount);
              socket.emit("historySend", {"text": ("and took 50% score!"), "formatting": {}});
            }
          }
        )
      ],
    },

    "class": {
      "one": {
        "common": [
          new TokenData(
            "Blank", "When used sets itself, and any others, to token your topmost non Blank token.",
            false, true, loadImage("Assets/Images/Tokens/Class/OneTrick/Blank.png"),
            function(params, callback) {

              // Find first non "Blank" token
              let replaceToken = null;
              for (let i = 0; i < mainCanvas.screens[GAME].tokens.length; i++) {
                if (mainCanvas.screens[GAME].tokens[i].token.name != "Blank") {
                  replaceToken = mainCanvas.screens[GAME].tokens[i];
                  break;
                }
              }

              // If there is a token to replace others with then replace
              if (replaceToken != null) {
                params.preventAnimation = true;
                params.showToken.used = false;
                for (let i = 0; i < mainCanvas.screens[GAME].tokens.length; i++) {
                  if (mainCanvas.screens[GAME].tokens[i].token.name == "Blank") {
                    mainCanvas.screens[GAME].tokens[i].token = replaceToken.token;
                  }
                }
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

              // Gain 20 score, deal 20 score
              mainCanvas.screens[GAME].gameScoreUpdate(20, 0, 20);
              socket.emit("historySend", {"text":("And gained 20 score"), "formatting":{}});
              socket.emit("historySend", {"text":("And dealt 20 score"), "formatting":{}});
              callback(params);
            }, function(params) {

              // Lose 20 score
              mainCanvas.screens[GAME].gameScoreUpdate(0, 20, 0);
            },
          )
        ],
        "rare": [],
        "legendary": []
      },

      "sniper": {
        "common": [
          new TokenData(
            "Iris", "This is a token", // TODO
            false, true, loadImage("Assets/Images/Tokens/Class/Sniper/Iris.png"),
            function(params, callback) {callback(params);}, function(params) {},
          )
        ],
        "rare": [
          new TokenData(
            "Precision", "Uses 75% stored power to deal 100% stored power to the enemy, with a 25% of critical hit which deals 400% but uses 100%.",
            true, false, loadImage("Assets/Images/Tokens/Class/Sniper/Precision.png"),
            function(params, callback) {

              // Deal damage based on sniper stored damage
              let damage = mainCanvas.screens[GAME].extraInfo.sniperStoredDamage;
              let r1 = random();

              // Critical hit: use 100% deal 400%
              if (r1 < 0.25) {
                damage *= 4;
                mainCanvas.screens[GAME].extraInfo.sniperStoredDamage = 0;
                socket.emit("historySend", {"text": ("And dealt " + damage + " with a critical hit!"), "formatting":{}});

                // Normal hit use 75% deal 100%
              } else {
                mainCanvas.screens[GAME].extraInfo.sniperStoredDamage *= 0.25;
                socket.emit("historySend", {"text": ("And dealt " + damage), "formatting":{}});
              }

              // Deal damage
              mainCanvas.screens[GAME].gameScoreUpdate(0, 0, damage);
              params.damage = damage;
              callback(params);
            }, function(params) {

              // Take damage
              mainCanvas.screens[GAME].gameScoreUpdate(0, params.damage, 0);
            },
          )
        ],
        "legendary": []
      },

      "theif": {
        "common": [
          new TokenData(
            "Conspire", "This is a token", // TODO
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
              mainCanvas.screens[GAME].gameScoreUpdate(0, scoreLost, 0);
              socket.emit("historySend", {"text": ("To sacrifice " + fancyFormat(damage, 2)), "formatting": {}});
              params.direction = "outbound";
              callback(params);
            }, function(params) {

              // Give 20% score
              if (params.direction == "outbound") {
                let scoreSapped = mainCanvas.screens[GAME].scoreInfo.score * 0.2;
                mainCanvas.screens[GAME].gameScoreUpdate(0, scoreSapped, 0);
                params.direction = "inbound";
                params.scoreSapped = scoreSapped;
                socket.emit("gameTokenUsed", params);

              // Gain 20% of enemy score
              } else if (params.direction == "inbound") {
                mainCanvas.screens[GAME].gameScoreUpdate(params.scoreSapped, 0, params.scoreSapped);
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

          // Lose 15 score
          mainCanvas.screens[GAME].gameScoreUpdate(0, 15, 0);
          callback(params);
        }, function(params) {}
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
    ),
    new ClassData(
      "c3",
      "This is the description for c3",
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
