

function setupData() {
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


  // For local action params [showToken, complete, tokenRarity, token]
  // For other action params [tokenRarity, token]


  tokensData = {
    "neutral": { // Neutral
      "common": [ // Common
        new TokenData(
          "D8", "Roll a D8 and set all of your dice to its value.", "common",
          false, false, function(params, callback) {
            screens[3].dice[0].diceSize = 8;
            screens[3].dice[0].reroll();
            for (let i = 1; i < screens[3].dice.length; i++) {
              screens[3].dice[i].value = screens[3].dice[0].value;
              screens[3].dice[i].diceSize = 8;
            }
            callback(params);
          }, function(params) {},
          loadImage("Assets/Images/Tokens/Neutral/Common/D8.png")
        ),

        new TokenData(
          "Equaliser", "For each of your dice if they are even half them, if they are odd double them.", "common",
          false, false, function(params, callback) {
            for (let i = 0; i < screens[3].dice.length; i++) {
              if (screens[3].dice[i].value%2==0) {
                screens[3].dice[i].value /= 2;
              } else {
                screens[3].dice[i].value *= 2;
              }
            }
            callback(params);
          }, function(params) {},
          loadImage("Assets/Images/Tokens/Neutral/Common/Equaliser.png")
        ),

        new TokenData(
          "Exponential", "Deal 15 to the enemies score, each time you use this multiply this amount by 1.1x.", "common",
          true, false, function(params, callback) {
            let damage = 15 * Math.pow(1.1, screens[3].extraInfo.exponentialUsed);
            params.push(damage);
            screens[3].extraInfo.exponentialUsed++;
            screens[3].scoreInfo.scoreDealt += damage;
            socket.emit("historySend", {
              "text": ("and dealt " + fancyFormat(damage, 2)),
              "formatting": {}
            });
            callback(params);
          }, function(params) {screens[3].scoreInfo.scoreLost += params[1];},
          loadImage("Assets/Images/Tokens/Neutral/Common/Exponential.png")
        ),

        new TokenData(
          "Corrosive Goo", "Deal 10% of your current score total to enemy. For each goo you have this is increased by 15% Additive; Uses all the goo in your hand.", "common",
          true, false, function(params, callback) {
            let count = 0;
            for (let i = 0; i < screens[3].tokens.length; i++) {
              let currentToken = screens[3].tokens[i];
              if (currentToken.token.name=="Corrosive Goo"
                && currentToken != params[1]) {
                count++;
                currentToken.animateOffscreen([], function(params) {});
              }
            }
            let damage = screens[3].scoreInfo.score * (0.1 + 0.15*count);
            params.push(damage);
            screens[3].scoreInfo.scoreDealt += damage;
            socket.emit("historySend", {"text": ("and dealt " + fancyFormat(damage, 2) + " with " + (count+1) + " goos"), "formatting": {}});
            callback(params);
          }, function(params) {screens[3].scoreInfo.scoreLost += params[1];},
          loadImage("Assets/Images/Tokens/Neutral/Common/Goo.png")
        ),

        new TokenData(
          "Heal", "Gain 15 to your score.", "common",
          false, true, function(params, callback) {
            screens[3].scoreInfo.scoreGained += 15;
            socket.emit("historySend", {"text": ("and gained " + 15), "formatting": {}});
            callback(params);
          }, function(params) {},
          loadImage("Assets/Images/Tokens/Neutral/Common/Heal.png")
        ),

        new TokenData(
          "Deal", "Deal 15 to the enemies score.", "common",
          true, true, function(params, callback) {
            let damage = 15;
            params.push(damage);
            socket.emit("historySend", {"text": ("and dealt " + fancyFormat(damage, 2)), "formatting": {}});
            callback(params);
          }, function(params) {screens[3].scoreInfo.scoreLost += params[1];},
          loadImage("Assets/Images/Tokens/Neutral/Common/Kneel.png")
        ),

        new TokenData(
          "Reroll", "Reroll all your dice.", "common",
          false, true, function(params, callback) {
            for (let i = 0; i < screens[3].dice.length; i++) {
              screens[3].dice[i].reroll(screens[3].dice[i].value);
            }
            callback(params);
          }, function(params) {},
          loadImage("Assets/Images/Tokens/Neutral/Common/Reroll.png")
        ),

        new TokenData(
          "Square", "Replace your roll with 2 d6s whose values are squared.", "common",
          false, false, function(params, callback) {
            screens[3].dice = [];
            screens[3].generateDice(2, 6);
            for (let i = 0; i < screens[3].dice.length; i++) {
              screens[3].dice[i].value = screens[3].dice[i].value*screens[3].dice[i].value;
            }
            callback(params);
          }, function(params) {},
          loadImage("Assets/Images/Tokens/Neutral/Common/Square.png")
        )
      ],
      "rare": [ // Rare
        new TokenData(
          "Interval", "For each dice become 3 * the interval (Minimum 1) between it and the next dice. This happens sequentially.", "rare",
          false, false, function(params, callback) {
            for (let i = 0; i < screens[3].dice.length-1; i++) {
              let val = abs(screens[3].dice[i+1].value-screens[3].dice[i].value);
              val = val==0?1:val;
              screens[3].dice[i].value = val * 3;
            }
            callback(params);
          }, function(params) {},
          loadImage("Assets/Images/Tokens/Neutral/Rare/Interval.png")
        ),

        // new TokenData(
        //   "Joker", "Perform a random action of choice 6, onto a random player.", "rare",
        //   true, false, function(params, callback) {
        //     let r1 = floor(random(2));
        //     let r2 = floor(random(6));
        //     params.push(r1);
        //     params.push(r2);
        //     if (r1 == 0) {
        //       if (r2 == 0) {
        //         screens[3].scoreInfo.scoreLost += 25;
        //         socket.emit("historySend", {"text": ("And lost 25 score"), "formatting": {}});
        //       } else if (r2 == 1) {
        //         screens[3].scoreInfo.scoreGained += 25;
        //         socket.emit("historySend", {"text": ("And gained 25 score"), "formatting": {}});
        //       } else if (r2 == 2) {
        //         screens[3].tokens.pop();
        //         screens[3].tokens.pop();
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
        //         screens[3].scoreInfo.scoreDealt += 25;
        //         socket.emit("historySend", {"text": "And removed 25 score", "formatting": {}});
        //       } else if (r2 == 1) {
        //         screens[3].scoreInfo.scoreDealt -= 25;
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
        //         screens[3].scoreInfo.scoreLost += 25;
        //       } else if (params[2] == 1) {
        //         screens[3].scoreInfo.scoreGained += 25;
        //       } else if (params[2] == 2) {
        //         screens[3].tokens.pop();
        //         screens[3].tokens.pop();
        //       } else if (params[2] == 3) {
        //       } else if (params[2] == 4) {
        //       } else if (params[2] == 5) {
        //       }
        //     }
        //   },
        //   loadImage("Assets/Images/Tokens/Neutral/Rare/Joker.png")
        // ),

        new TokenData(
          "Mitosis", "Empty your roll and roll a d10, if it's an even roll, split into 2 D10s and roll again, keep repeating cycle until there are no even rolls.", "rare",
          false, false, function(params, callback) {
            let toSplit = [];
            let splitCount = 0;
            screens[3].dice = [new ShowDice(9, 0), new ShowDice(9, 1)];
            toSplit.push(screens[3].dice[0]);
            toSplit.push(screens[3].dice[1]);
            screens[3].updateDicePositions();
            let trySplit = function() {
              if (toSplit[0].value%2 == 0) {
                splitCount++;
                socket.emit("historySend", {"text": ("Split! ("+screens[3].getRoll()+", " + screens[3].playerName+")"), "formatting": {}});
                let nd1 = new ShowDice(9, 0);
                let nd2 = new ShowDice(9, 0);
                screens[3].dice.push(nd1);
                screens[3].dice.push(nd2);
                toSplit.push(nd1);
                toSplit.push(nd2);
                screens[3].dice.splice(screens[3].dice.indexOf(toSplit[0]), 1);
                screens[3].updateDicePositions();
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
          "Ten Ten", "Roll a d10, and then set your roll to that many 10 valued d10s.", "rare",
          false, false, function(params, callback) {
            screens[3].dice = [];
            let amount = floor(random(10))+1;
            for (let i = 0; i < amount; i++) {
              screens[3].dice.push(new ShowDice(10, i));
            }
            callback(params);
          }, function(params) {},
          loadImage("Assets/Images/Tokens/Neutral/Rare/TenTen.png")
        ),

        new TokenData(
          "Dead Mans Hand", "Reroll your tokens.", "rare",
          false, true, function(params, callback) {
            for (let i = 0; i < screens[3].tokens.length; i++) {
              if (screens[3].tokens[i] != params[1]) {
                screens[3].tokens[i].animateOffscreen([], function(params) {});
              }
            }
            screens[3].generateTokens(5);
            callback(params);
          }, function(params) {},
          loadImage("Assets/Images/Tokens/Neutral/Rare/DeadMansHand.png")
        ),

        new TokenData(
          "Quartic", "Set the size of your first 4 dice to the square of their value, and reroll them.", "rare",
          false, false, function(params, callback) {
            for (let i = 0; i < min(4, screens[3].dice.length); i++) {
              screens[3].dice[i].diceSize = Math.pow(screens[3].dice[i].value, 2);
              screens[3].dice[i].reroll();
            }
            callback(params);
          }, function(params) {},
          loadImage("Assets/Images/Tokens/Neutral/Rare/Quartic.png")
        ),

        new TokenData(
          "Pacify", "Block all incoming damage this turn. After 2 turns wilts into thorns.", "rare",
          false, false, function(params, callback) {
            screens[3].extraInfo.blockDamage = true;
            callback(params);
          }, function(params) {},
          loadImage("Assets/Images/Tokens/Neutral/Rare/Pacify.png")
        )
      ],
      "legendary": [ // Legendary
        new TokenData(
          "Big Bertha", "Roll a d150, set this to your roll and deal 50% to the enemies score.", "legendary",
          true, false, function(params, callback) {
            screens[3].dice = [new ShowDice(150, 0)];
            let damage = screens[3].dice[0].value * 0.5;
            params.push(damage);
            screens[3].scoreInfo.scoreDealt += damage;
            socket.emit("historySend", {"text": ("And dealt " + fancyFormat(damage, 2)), "formatting": {}});
            callback(params);
          }, function(params) {screens[3].scoreInfo.scoreLost += params[1]},
          loadImage("Assets/Images/Tokens/Neutral/Legendary/BigBertha.png"), null
        ),

        new TokenData(
          "50/50", "50% chance to gain 50% of your score, 50% chance to lose 50% of your score.", "legendary",
          false, false, function(params, callback) {
            if (random() < 0.5) {
              screens[3].scoreInfo.scoreGained += screens[3].scoreInfo.score/2;
              socket.emit("historySend", {"text": ("And gained 50% score"), "formatting": {}});
            } else {
              screens[3].scoreInfo.scoreLost += screens[3].scoreInfo.score/2;
              socket.emit("historySend", {"text": ("And lost 50% score"), "formatting": {}});
            }
            callback(params);
          }, function(params) {},
          loadImage("Assets/Images/Tokens/Neutral/Legendary/FiftyFifty.png")
        ),

        new TokenData(
          "Gamble", "50% chance to take half of enemies score. 50% chance the enemy half takes of yours.", "legendary",
          true, false, function(params, callback) {
            params.push("outbound");
            if (random() < 0.5) { // Give 50% to enemy
              params.push("give");
              params.push(screens[3].scoreInfo.score * 0.5);
              screens[3].scoreInfo.scoreLost += screens[3].scoreInfo.score * 0.5;
              socket.emit("historySend", {"text": ("and gave 50% score!"), "formatting": {}});
            } else {
              params.push("take");
            }
            callback(params);
          }, function(params) {
            if (params[1] == "outbound") {
              if (params[2] == "give") {
                screens[3].scoreInfo.scoreGained += params[3];
              } else {
                socket.emit("gameTokenUsed", {"name": "Gamble", "params": [params[0], "inbound", screens[3].scoreInfo.score * 0.5]});
                screens[3].scoreInfo.scoreLost += screens[3].scoreInfo.score * 0.5;
              }

            } else {
              screens[3].scoreInfo.scoreGained += params[2];
              screens[3].scoreInfo.scoreDealt += params[2];
              socket.emit("historySend", {"text": ("and took 50% score!"), "formatting": {}});
            }
          },
          loadImage("Assets/Images/Tokens/Neutral/Legendary/Gamble.png")
        )
      ],
    },


    "class": { // Class tokens
      "one": {
        "common": [
          new TokenData(
            "Blank", "When used sets itself, and any others, to token your topmost non Blank token.", "class",
            false, true, function(params, callback) {
              let replaceToken = null;
              for (let i = 0; i < screens[3].tokens.length; i++) {
                if (screens[3].tokens[i].token.name != "Blank") {
                  replaceToken = screens[3].tokens[i];
                  break;
                }
              }
              if (replaceToken != null) {
                for (let i = 0; i < screens[3].tokens.length; i++) {
                  if (screens[3].tokens[i] != params[1] && screens[3].tokens[i].token.name == "Blank") {
                    screens[3].tokens[i].token = replaceToken.token;
                  }
                }
                screens[3].generateTokens(1);
                screens[3].tokens[screens[3].tokens.length-1].token = replaceToken.token;
              }
              callback(params);
            }, function(params) {},
            loadImage("Assets/Images/Tokens/Class/OneTrick/Blank.png")
          )
        ],
        "rare": [],
        "legendary": []
      },


      "ogre": {
        "common": [
          new TokenData(
            "Drumstick", "Deal 20 to their score, heal 20 to your score.", "common",
            true, true, function(params, callback) {
              screens[3].scoreInfo.scoreGained += 20;
              screens[3].scoreInfo.scoreDealt += 20;
              socket.emit("historySend", {"text":("And gained 20 score"), "formatting":{}});
              socket.emit("historySend", {"text":("And dealt 20 score"), "formatting":{}});
              callback(params);
            }, function(params) {
              screens[3].scoreInfo.scoreLost += 20;
            },
            loadImage("Assets/Images/Tokens/Class/Ogre/Drumstick.png")
          )
        ],
        "rare": [],
        "legendary": []
      },


      "sniper": {
        "common": [
          new TokenData(
            "Iris", "This is a token", "common",
            false, true, function(params, callback) {callback(params);}, function(params) {},
            loadImage("Assets/Images/Tokens/Class/Sniper/Iris.png")
          )
        ],
        "rare": [
          new TokenData(
            "Precision", "Uses 75% stored power to deal 100% stored power to the enemy, with a 25% of critical hit, which multiplies output by 4x but uses all stored power.", "rare",
            true, false, function(params, callback) {
              let damage = screens[3].extraInfo.sniperStoredDamage;
              let r1 = random();
              if (r1 < 0.25) {
                damage *= 4;
                screens[3].extraInfo.sniperStoredDamage = 0;
                socket.emit("historySend", {"text": ("And dealt " + damage + " with a critical hit!"), "formatting":{}});
              } else {
                screens[3].extraInfo.sniperStoredDamage *= 0.25;
                socket.emit("historySend", {"text": ("And dealt " + damage), "formatting":{}});
              }
              screens[3].scoreInfo.scoreDealt += damage;
              params.push(damage);
              callback(params);
            }, function(params) {
              screens[3].scoreInfo.scoreLost += params[1];
            },
            loadImage("Assets/Images/Tokens/Class/Sniper/Precision.png")
          )
        ],
        "legendary": []
      },


      "theif": {
        "common": [
          new TokenData(
            "Conspire", "This is a token", "common",
            false, false, function(params, callback) {callback(params);}, function(params) {},
            loadImage("Assets/Images/Tokens/Class/Thief/Conspire.png")
          )
        ],
        "rare": [],
        "legendary": []
      },


      "warlock": {
        "common": [],
        "rare": [
          new TokenData(
            "Life Sap", "Discard 10% of his score to sap 20% of the enemy's.", "rare",
            true, false, function(params, callback) {
              let damage = screens[3].scoreInfo.score*0.1;
              screens[3].scoreInfo.scoreLost += damage;
              socket.emit("historySend", {"text": ("To sacrifice " + fancyFormat(damage, 2)), "formatting": {}});
              params.push("outbound");
              callback(params);

            }, function(params) {
              if (params[1] == "outbound") {
                let damage = screens[3].scoreInfo.score*0.2;
                screens[3].scoreInfo.scoreLost += damage;
                params[1] = "inbound";
                params.push(damage);
                socket.emit("gameTokenUsed", {"name": params[0].token.name, "params": params});

              } else {
                screens[3].scoreInfo.scoreGained += params[2];
                screens[3].scoreInfo.scoreDealt += params[2];
                socket.emit("historySend", {"text": ("And sapped " + fancyFormat(params[2], 2)), "formatting": {}});
              }
            },
            loadImage("Assets/Images/Tokens/Class/Warlock/LifeSap.png")
          )
        ],
        "legendary": []
      }
    },


    "unobtainable": [
      new TokenData(
        "Thorns", "Deal 15 damage to yourself", "common",
        false, false, function(params, callback) {
          screens[3].scoreInfo.scoreLost += 15;
          callback(params);
        }, function(params) {},
        loadImage("Assets/Images/Tokens/Unobtainable/Thorns.png")
      )
    ]
  }


  classesData = [ // Needs) classId, name, description, custom tokens
    new ClassData(
      "One",
      "One Trick depends on building for large, game-changing combos using his powerful class tokens.",
      [tokensData.class.one.common[0]], function() {return "";}
    ),
    new ClassData(
      "Sniper",
      "The sniper relies on large, powerful blasts to the enemies score. He stores a small amount of score that the enemy gains to be used against them.",
      [tokensData.class.sniper.common[0], tokensData.class.sniper.rare[0]], function() {return "Stored power: " + screens[3].extraInfo.sniperStoredDamage;}
    ),
    new ClassData(
      "Warlock",
      "The warlock primarily focuses on keeping tempo and controlling score, until he can pull of his legendary combo. Every amount that he deals to the enemy, he gains half in score and every amount that the enemy gains, he loses half in score.",
      [tokensData.class.warlock.rare[0]], function() {return "";}
    ),
    new ClassData(
      "Ogre",
      "A big lad who takes 35% less damage and permanently rolls 4 D8s instead of the default 5 D6s.",
      [tokensData.class.ogre.common[0]], function() {return "";}
    ),
    new ClassData(
      "c0",
      "This is the description for c0",
      [tokensData.neutral.common[0]], function() {return "";}
    ),
    new ClassData(
      "c1",
      "This is the description for c1",
      [tokensData.neutral.common[0]], function() {return "";}
    ),
    new ClassData(
      "c2",
      "This is the description for c2",
      [tokensData.neutral.common[0]], function() {return "";}
    )
  ];


  for (let [rarity, tokens] of Object.entries(tokensData.neutral)) { // For each rarity
    for (let i = 0; i < tokens.length; i++) { // For each token
      tokens[i].category = "neutral";
      tokens[i].description = formatTextCharacters(tokens[i].description, 35);
      tokens[i].index = i;
    }
  }

  for (let [clss, rarities] of Object.entries(tokensData.class)) { // For each class
    for (let [rarity, tokens] of Object.entries(rarities)) { // For each rarity
      for (let i = 0; i < tokens.length; i++) { // For each token
        tokens[i].category = "class";
        tokens[i].class = clss;
        tokens[i].description = formatTextCharacters(tokens[i].description, 35);
        tokens[i].index = i;
      }
    }
  }

  for (let i = 0; i < tokensData.unobtainable.length; i++) {
    tokensData.unobtainable[i].category = "unobtainable";
    tokensData.unobtainable[i].description = formatTextCharacters(tokensData.unobtainable[i].description, 35);
    tokensData.unobtainable[i].index = i;
  }
}


// #region - Data

class ClassData {
  constructor(name_, description_, tokens_, extraDescription_) {
    this.name = name_;
    this.description = description_;
    this.tokens = tokens_;
    this.extraDescription = extraDescription_;
  }
}


class TokenData {
  constructor(name_, description_, rarity_, affectsEnemy_, partial_, action_, otherAction_, image_) {
    this.name = name_;
    this.description = description_;
    this.rarity = rarity_;
    this.affectsEnemy = affectsEnemy_;
    this.partial = partial_;
    this.action = action_;
    this.otherAction = otherAction_;
    this.image = image_;
    this.category = "not set";
    this.index = -1;
  }
}

// #endregion
