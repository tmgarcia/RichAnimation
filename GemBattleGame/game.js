/*jslint white: true */
/*jslint sloppy: true */
document.onkeydown = handleKeyDown;
document.onkeyup = handleKeyUp;

var BASE_PLAYER_HEALTH = 100;
var HEALTH_BAR_WIDTH = 25;
var HEALTH_BAR_HEIGHT = 250;
var HEALTH_BAR_PADDING = 3;
var PLAYER_DISPLAY_WIDTH = 150;

var DAMAGE_GEM_DAMAGE = 5;
var ROCK_GEM_DAMAGE = 5;

var INVENTORY_TEXT_SIZE = 18;

var BOARD_WIDTH = 10;//in squares
var BOARD_HEIGHT = 10;//in squares
var BOARD_FRAME_WIDTH = 5;
var BOARD_FRAME_HEIGHT = 5;
var BOARD_SQUARE_WIDTH = 35;
var BOARD_SQUARE_HEIGHT = 35;
var BOARD_SQUARE_SPACING = 5;
var GEM_HEIGHT = BOARD_SQUARE_HEIGHT;
var GEM_WIDTH = BOARD_SQUARE_WIDTH;

var initialBoardFill;

var musicInstance;

var RAINBOW_GEM_CHANCE = 0.01;

var JModeActive = false;
var JModeAdd = 10;

var endMessage;

var allLoadingComplete;
var loadingSwirl, loadingText;

var selectedGem1, selectedGem2;
var matchedGemsToBreak, waitingForSwap, waitingForMatchBreaks, waitingForDrop,lastDrop;
var player1, player2, currentPlayer, currentPlayerText;
var board;

var KC_LEFT = 37;
var KC_UP = 38;
var KC_RIGHT = 39;
var KC_DOWN = 40;

var KC_W = 87;
var KC_A = 65;
var KC_S = 83;
var KC_D = 68;
var KC_J = 74;

var KC_SPACE = 32;
var KC_SHIFT = 16;

var SCREEN_PADDING = 40;

var canvasWidth = 800;
var canvasHeight = 600;
var stage;
var FPS = 30;
var btnPlay, btnInstruct, btnMenu, btnContinue;
var playingLevelIntro;
var walkingSprite;
var titleScreen, instructionScreen, gameplayScreen, gameOverScreen, levelSign;
var titleContainer, instructionContainer, gameplayContainer, gameOverContainer, levelDisplayContainer;
var gameState;
var frameCount, gameTimer, gameScore;
var gameTimerLimit = 10;
var mouseX, mouseY;
var gameTimeText, gameScoreText, finalScoreText, mouseCoordText, levelText;
var GameStates = { gameTitle:0, gameInstructions:1, gamePlay:2, gameOver:3};
var queue;
manifest = [
    {src:"titleScreen.jpg", id:"titleScreen"},
    {src:"instructions.jpg", id:"instructionScreen"},
    {src:"gameOverScreen.jpg", id:"gameOverScreen"},
    {src:"gameplayArea.jpg", id:"gameplayScreen"},
    {src:"buttons.png", id:"button"},
    {src:"sprites.png", id:"walkingSprites"},
    {src:"levelSign.png", id:"levelSign"},
    {src:"gemRed.png", id:"gemRed"},
    {src:"gemYellow.png", id:"gemYellow"},
    {src:"gemGreen.png", id:"gemGreen"},
    {src:"gemBlue.png", id:"gemBlue"},
    {src:"gemPurple.png", id:"gemPurple"},
    {src:"gemRock.png", id:"gemRock"},
    {src:"gemDamage.png", id:"gemDamage"},
    {src:"gemRainbow.png", id:"gemRainbow"},
    {src:"powerBase.png", id:"powerBase"},
    {src:"powerBaseDimmed.png", id:"powerBaseDimmed"},
    {src:"noCostSlot.png", id:"noCostSlot"},
    {src:"loadingSwirl.png", id:"loadingSwirl"},
    {src:"shatterSound.ogg", id:"shatterSound", data:4},
    {src:"musicLoop.wav", id:"musicLoop"}
];
var audioPath = "Assets/";
/*------------------------------Objects------------------------------*/
//region Objects 
function extend(base, sub) {
  var origProto = sub.prototype;
  sub.prototype = Object.create(base.prototype);
    var key;
  for (key in origProto)  {
     sub.prototype[key] = origProto[key];
  }
  sub.prototype.constructor = sub;
  Object.defineProperty(sub.prototype, 'constructor', { 
    enumerable: false, 
    value: sub 
  });
}
var GemTypes = { Red:0, Yellow:1, Green:2, Blue:3, Purple:4, Rock:5, Damage:6, Rainbow:7};
var SquareContents = {HasGem:8, Empty:9};
//region /*---Gems---*/  
function GemAmount(gemType, amount) 
{
    this.type = gemType;
    this.amount = amount;
}
function Gem(gemType, x, y)
{
    this.type = gemType;
    this.x = x;
    this.y = y;
}
Gem.prototype = {
    matches: function(otherGem) {
        var match = false;
        if(otherGem instanceof Gem)
        {
            if(otherGem.type === GemTypes.Rainbow)
            {
                match = true;
            }
            else
            {
                match =  (this.type === otherGem.type);
            }
        }
        return match;
    },
    shatter: function(player) {
        //abstract
    },
    highlight: function()
    {
        this.image.regX = BOARD_SQUARE_WIDTH/2;
        this.image.regY = BOARD_SQUARE_HEIGHT/2;
        this.image.x = this.image.x+(BOARD_SQUARE_WIDTH/2);
        this.image.y = this.image.y+(BOARD_SQUARE_HEIGHT/2);
        highlight = createjs.Tween.get(this.image, {loop:true, override:true})
        .to({rotation:360}, 1500);
    },
    unhighlight: function()
    {
        console.log("UNHIGHLIGHT");
        createjs.Tween.removeTweens(this.image);
        this.image.regX = 0;
        this.image.regY = 0;
        this.image.x = this.image.x-(BOARD_SQUARE_WIDTH/2);
        this.image.y = this.image.y-(BOARD_SQUARE_HEIGHT/2);
        this.image.rotation = 0;
    },
    setupImage: function()
    {
    }
};
function resetGemPosition(gem)
{
    createjs.Tween.removeTweens(gem.image);
    if(gem.image.regX !== 0 && gem.image.regY !==0)
    {
        gem.image.regX = 0;
        gem.image.regY = 0;
    }
    var properCoords = getSquareDisplayCoords(gem.x, gem.y);
    gem.image.x = properCoords.x;
    gem.image.y = properCoords.y;
    gem.image.rotation = 0;
}
function moveGem(gem, newX, newY)
{
    if(waitingForSwap)
    {
        moveTween = createjs.Tween.get(gem.image, {loop:false, override:true})
        .to({x:newX, y:newY}, 500, createjs.Ease.bounceOut)
        .wait(500)
        .call(swapComplete);
    }
    else if(waitingForDrop)
    {
        moveTween = createjs.Tween.get(gem.image, {loop:false, override:true})
        .to({x:newX, y:newY}, 500, createjs.Ease.bounceOut)
        .wait(500)
        .call(dropsComplete);
    }
    else
    {
        moveTween = createjs.Tween.get(gem.image, {loop:false, override:true})
        .to({x:newX, y:newY}, 500, createjs.Ease.bounceOut);
    }
    //animate moving of gem
}
function gemsAreAdjacent(gemA, gemB)
{
    var adjacent = false;
    if( (gemA.y === gemB.y && (gemA.x === gemB.x+1 || gemA.x === gemB.x-1)) ||
       (gemA.x === gemB.x && (gemA.y === gemB.y+1 || gemA.y === gemB.y-1)))
    {
        adjacent = true;
    }
    return adjacent;
}
function shatterGem(gem, currPlayer)
{
    if(currPlayer === undefined)
    {
        currPlayer = null;
    }
    resetGemPosition(gem);
    if(gem.image.regX === 0 && gem.image.regY === 0)
    {
        gem.image.regX = BOARD_SQUARE_WIDTH/2;
        gem.image.regY = BOARD_SQUARE_HEIGHT/2;
        gem.image.x = gem.image.x+(BOARD_SQUARE_WIDTH/2);
        gem.image.y = gem.image.y+(BOARD_SQUARE_HEIGHT/2);
    }
    board.squares[gem.x][gem.y] = SquareContents.Empty;
    gemTween = createjs.Tween.get(gem.image, {loop:false})
        .call(playShatter)
        .to({rotation:360}, 1500, createjs.Ease.bounceOut)
        .to({y:canvasHeight+200, rotation:0}, 1000, createjs.Ease.backIn)
        .call(gem.shatter, [currPlayer])
        .call(matchedGemBroken);
}
function playShatter()
{
    if(!initialBoardFill)
    {
        createjs.Sound.play("shatterSound",createjs.Sound.INTERRUPT_ANY,0,0,0);
    }
}
    //region Red 
    function RedGem(x, y)
    {
        Gem.call(this, GemTypes.Red, x, y);
    }
    RedGem.prototype = {
        shatter: function(player){
            this.image.visible = false;
            board.container.removeChild(this.image);
            if(player !== null && player!== undefined)
            {
                player.addGemsToInventory(GemTypes.Red, 1);
            }
            //animate breaking
            //give player red gem
        },
        setupImage: function()
        {
            this.image = new createjs.Bitmap(queue.getResult("gemRed"));
            this.image.on("click", handleGemClick, null, false, {gem:this});
        }
    };
    extend(Gem, RedGem);
    //endregion
    //region Yellow 
    function YellowGem(x, y)
    {
        Gem.call(this, GemTypes.Yellow, x, y);
    }
    YellowGem.prototype = {
        shatter: function(player){
            this.image.visible = false;
            board.container.removeChild(this.image);
            if(player !== null && player!== undefined)
            {
                player.addGemsToInventory(GemTypes.Yellow, 1);
            }
            //animate breaking
            //give player yellow gem
        },
        setupImage: function()
        {
            this.image = new createjs.Bitmap(queue.getResult("gemYellow"));
            this.image.on("click", handleGemClick, null, false, {gem:this});
        }
    };
    extend(Gem, YellowGem);
    //endregion
    //region Green 
    function GreenGem(x, y)
    {
        Gem.call(this, GemTypes.Green, x, y);
    }
    GreenGem.prototype = {
        shatter: function(player){
            this.image.visible = false;
            board.container.removeChild(this.image);
            if(player !== null && player!== undefined)
            {
                player.addGemsToInventory(GemTypes.Green, 1);
            }
            //animate breaking
            //give player yellow gem
        },
        setupImage: function()
        {
            this.image = new createjs.Bitmap(queue.getResult("gemGreen"));
            this.image.on("click", handleGemClick, null, false, {gem:this});
        }
    };
    extend(Gem, GreenGem);
    //endregion
    //region Blue 
    function BlueGem(x, y)
    {
        Gem.call(this, GemTypes.Blue, x, y);
    }
    BlueGem.prototype = {
        shatter: function(player){
            this.image.visible = false;
            board.container.removeChild(this.image);
            if(player !== null && player!== undefined)
            {
                player.addGemsToInventory(GemTypes.Blue, 1);
            }
            //animate breaking
            //give player Blue gem
        },
        setupImage: function()
        {
            this.image = new createjs.Bitmap(queue.getResult("gemBlue"));
            this.image.on("click", handleGemClick, null, false, {gem:this});
        }
    };
    extend(Gem, BlueGem);
    //endregion
    //region Purple
    function PurpleGem(x, y)
    {
        Gem.call(this, GemTypes.Purple, x, y);
    }
    PurpleGem.prototype = {
        shatter: function(player){
            this.image.visible = false;
            board.container.removeChild(this.image);
            if(player !== null && player!== undefined)
            {
                player.addGemsToInventory(GemTypes.Purple, 1);
            }
            //animate breaking
            //give player Purple gem
        },
        setupImage: function()
        {
            this.image = new createjs.Bitmap(queue.getResult("gemPurple"));
            this.image.on("click", handleGemClick, null, false, {gem:this});
        }
    };
    extend(Gem, PurpleGem);
    //endregion
    //region Rock 
    function RockGem(x, y)
    {
        Gem.call(this, GemTypes.Rock, x, y);
    }
    RockGem.prototype = {
        shatter: function(player){
            this.image.visible = false;
            board.container.removeChild(this.image);
            if(player !== null && player!== undefined)
            {
                player.addGemsToInventory(GemTypes.Rock, 1);
            }
            //animate breaking
            //give player Rock gem
        },
        setupImage: function()
        {
            this.image = new createjs.Bitmap(queue.getResult("gemRock"));
            this.image.on("click", handleGemClick, null, false, {gem:this});
        }
    };
    extend(Gem, RockGem);
    //endregion
    //region Damage 
    function DamageGem(x, y)
    {
        Gem.call(this, GemTypes.Damage, x, y);
    }
    DamageGem.prototype = {
        shatter: function(player){
            this.image.visible = false;
            board.container.removeChild(this.image);
            if(player !== null)
            {
                if(player === player1)
                {
                    player2.decreaseHealth(DAMAGE_GEM_DAMAGE);
                }
                else
                {
                    player1.decreaseHealth(DAMAGE_GEM_DAMAGE);
                }
            }
            //animate breaking
            //hurt other player
        },
        setupImage: function()
        {
            this.image = new createjs.Bitmap(queue.getResult("gemDamage"));
            this.image.on("click", handleGemClick, null, false, {gem:this});
        }
    };
    extend(Gem, DamageGem);
    //endregion
    //region Rainbow 
    function RainbowGem(x, y)
    {
        Gem.call(this, GemTypes.Rainbow, x, y);
    }
    RainbowGem.prototype = {
        shatter: function(player){
            this.image.visible = false;
            board.container.removeChild(this.image);
            //animate breaking
            //give player correct gem (pass type?)
        },
        setupImage: function()
        {
            this.image = new createjs.Bitmap(queue.getResult("gemRainbow"));
            this.image.on("click", handleGemClick, null, false, {gem:this});
        }
    };
    extend(Gem, RainbowGem);
    //endregion
function getRandomGem(x, y)
{
    //Math.random(); 0-1
    var gem;
    var rainbowChance = Math.random();
    if(rainbowChance <= RAINBOW_GEM_CHANCE)
    {
        gem = new RainbowGem(x, y);
    }
    else
    {
        var otherGem = Math.round(Math.random()*6);
        switch(otherGem)
        {
            case GemTypes.Red: gem = new RedGem(x,y); break;
            case GemTypes.Yellow: gem = new YellowGem(x,y); break;    
            case GemTypes.Green: gem = new GreenGem(x,y); break;    
            case GemTypes.Blue: gem = new BlueGem(x,y); break;    
            case GemTypes.Purple: gem = new PurpleGem(x,y); break;    
            case GemTypes.Rock: gem = new RockGem(x,y); break;    
            case GemTypes.Damage: gem = new DamageGem(x,y); break;    
        }
    }
    gem.setupImage();
    return gem;
}
//endregion
//region /*---Powers---*/
function Cost(redCost, yellowCost, greenCost, blueCost, purpleCost)
{
    this.redCost = redCost;
    this.yellowCost = yellowCost;
    this.greenCost = greenCost;
    this.blueCost = blueCost;
    this.purpleCost = purpleCost;
    this.redFulfilled = 0;
    this.yellowFulfilled = 0;
    this.greenFulfilled = 0;
    this.blueFulfilled = 0;
    this.purpleFulfilled = 0;
    this.isFulfilled = false;
}
Cost.prototype = {
    updateFulfilledGems: function(gemType, amount){
        switch(gemType)
        {
            case GemTypes.Red: this.redFulfilled = amount; break;
            case GemTypes.Yellow: this.yellowFulfilled = amount; break;   
            case GemTypes.Green: this.greenFulfilled = amount; break;
            case GemTypes.Blue: this.blueFulfilled = amount; break;
            case GemTypes.Purple: this.purpleFulfilled = amount; break;
        }
        this.isFulfilled = (this.redFulfilled>=this.redCost && 
                            this.yellowFulfilled>=this.yellowCost && 
                            this.greenFulfilled>=this.greenCost && 
                            this.blueFulfilled>=this.blueCost && 
                            this.purpleFulfilled>=this.purpleCost);
        //light up if cost completely fulfilled
    },
    clearFulfilledGems: function(){
        this.redFulfilled = 0;
        this.yellowFulfilled = 0;
        this.greenFulfilled = 0;
        this.blueFulfilled = 0;
        this.purpleFulfilled = 0;
    }
};
function Power(cost)
{
    this.cost = cost;
}
Power.prototype = {
    execute: function(){
        //execute power
    },
    reset: function()
    {
        this.cost.clearFulfilledGems();
        this.backImage.image = queue.getResult("powerBaseDimmed");
    },
    updateCost: function(redGemAmt,yellowGemAmt,greenGemAmt,blueGemAmt,purpleGemAmt)
    {
        this.cost.updateFulfilledGems(GemTypes.Red, redGemAmt);
        this.cost.updateFulfilledGems(GemTypes.Yellow, yellowGemAmt);
        this.cost.updateFulfilledGems(GemTypes.Green, greenGemAmt);
        this.cost.updateFulfilledGems(GemTypes.Blue, blueGemAmt);
        this.cost.updateFulfilledGems(GemTypes.Purple, purpleGemAmt);
        if(this.cost.isFulfilled)
        {
            this.backImage.image = queue.getResult("powerBase");
        }
        else
        {
            this.backImage.image = queue.getResult("powerBaseDimmed");
        }
    },
    setupDisplay: function()
    {
        this.container = new createjs.Container();
        this.backImage = new createjs.Bitmap(queue.getResult("powerBaseDimmed"));
        this.label = new createjs.Text(this.labelText, "12px Arial", "#fff");
        this.container.addChild(this.backImage, this.label);
        var y = 20;
        var textOffset = 10;
        if(this.cost.redCost>0)
        {
            this.redCostText = new createjs.Text(""+this.cost.redCost, "20px Arial", "#000");
            this.redCostText.textAlign = "center";
            this.redCostText.x = 4+textOffset;
            this.redCostText.y = y;
            this.container.addChild(this.redCostText);
        }
        else
        {
            this.noRed = new createjs.Bitmap(queue.getResult("noCostSlot"));
            this.noRed.x = 4;
            this.noRed.y = y;
            this.container.addChild(this.noRed);
        }
        if(this.cost.yellowCost>0)
        {
            this.yellowCostText = new createjs.Text(""+this.cost.yellowCost, "20px Arial", "#000");
            this.yellowCostText.textAlign = "center";
            this.yellowCostText.x = 2*(4) + 25 + textOffset;
            this.yellowCostText.y = y;
            this.container.addChild(this.yellowCostText);
        }
        else
        {
            this.noYellow = new createjs.Bitmap(queue.getResult("noCostSlot"));
            this.noYellow.x = 2*(4) + 25;
            this.noYellow.y = y;
            this.container.addChild(this.noYellow);
        }
        if(this.cost.greenCost>0)
        {
            this.greenCostText = new createjs.Text(""+this.cost.greenCost, "20px Arial", "#000");
            this.greenCostText.textAlign = "center";
            this.greenCostText.x = 3*(4) + 2*(25)+ textOffset;
            this.greenCostText.y = y;
            this.container.addChild(this.greenCostText);
        }
        else
        {
            this.noGreen = new createjs.Bitmap(queue.getResult("noCostSlot"));
            this.noGreen.x = 3*(4) + 2*(25);
            this.noGreen.y = y;
            this.container.addChild(this.noGreen);
        }
        if(this.cost.blueCost>0)
        {
            this.blueCostText = new createjs.Text(""+this.cost.blueCost, "20px Arial", "#000");
            this.blueCostText.textAlign = "center";
            this.blueCostText.x =4*(4) + 3*(25)+ textOffset;
            this.blueCostText.y = y;
            this.container.addChild(this.blueCostText);
        }
        else
        {
            this.noBlue = new createjs.Bitmap(queue.getResult("noCostSlot"));
            this.noBlue.x = 4*(4) + 3*(25);
            this.noBlue.y = y;
            this.container.addChild(this.noBlue);
        }
        if(this.cost.purpleCost>0)
        {
            this.purpleCostText = new createjs.Text(""+this.cost.purpleCost, "20px Arial", "#000");
            this.purpleCostText.textAlign = "center";
            this.purpleCostText.x = ((150-25)-4) + textOffset;
            this.purpleCostText.y = y;
            this.container.addChild(this.purpleCostText);
        }
        else
        {
            this.noPurple = new createjs.Bitmap(queue.getResult("noCostSlot"));
            this.noPurple.x = (150-25)-4;
            this.noPurple.y = y;
            this.container.addChild(this.noPurple);
        }
    }
};
//endregion
//region /*---Classes---*/
function PlayerClass(power1, power2, power3, power4)
{
    this.power1 = power1;
    this.power2 = power2;
    this.power3 = power3;
    this.power4 = power4;
}
PlayerClass.prototype= {
    reset: function()
    {
        this.power1.reset();
        this.power2.reset();
        this.power3.reset();
        this.power4.reset();
    },
    setupDisplay: function()
    {
        this.container = new createjs.Container();
        var powerHeight = 50;
        var pad = 10;
        this.power1.setupDisplay();
        this.power2.setupDisplay();
        this.power2.container.y = powerHeight+pad;
        this.power3.setupDisplay();
        this.power3.container.y = 2*(powerHeight+pad);
        this.power4.setupDisplay();
        this.power4.container.y = 3*(powerHeight+pad);
        this.container.addChild(this.power1.container, this.power2.container,this.power3.container,this.power4.container);
    },
    updatePowers: function(redGemAmt, yellowGemAmt, greenGemAmt, blueGemAmt, purpleGemAmt)
    {
        this.power1.updateCost(redGemAmt, yellowGemAmt, greenGemAmt, blueGemAmt, purpleGemAmt);
        this.power2.updateCost(redGemAmt, yellowGemAmt, greenGemAmt, blueGemAmt, purpleGemAmt);
        this.power3.updateCost(redGemAmt, yellowGemAmt, greenGemAmt, blueGemAmt, purpleGemAmt);
        this.power4.updateCost(redGemAmt, yellowGemAmt, greenGemAmt, blueGemAmt, purpleGemAmt);
    }
}
    //region Class 1 
        //region Power1 
        //Remove all of [x] gem from board
        function C1Power1()
        {
            this.labelText = "Remove all Blue";
            var cost = new Cost(0,3,0,4,2);
            Power.call(this, cost);
        }
        C1Power1.prototype = {
            execute: function(player){
                //Remove all of [x] gem from board
                removeTypeFromBoard(GemTypes.Blue)
            }
        };
        extend(Power, C1Power1);
        //endregion
        //region Power2 
            //Heal [x] life points
            function C1Power2()
            {
                this.labelText = "Heal 15";
                var cost = new Cost(5,3,0,0,1);
                Power.call(this, cost);
            }
            C1Power2.prototype = {
                execute: function(player){
                    //Heal [x] life points
                    player.addHealth(15);
                    otherPlayerTurn();
                }
            };
            extend(Power, C1Power2);
        //endregion
        //region Power3 
            //Convert all of enemy’s [x color] into [y color]
            function C1Power3()
            {
                this.labelText = "Enemy's red to blue";
                var cost = new Cost(0,1,4,5,0);
                Power.call(this, cost);
            }
            C1Power3.prototype = {
                execute: function(player){
                    var otherPlayer = (player===player1)? player2: player1;
                    var numRed = otherPlayer.inventory.RedGems;
                    var numBlue = otherPlayer.inventory.BlueGems;
                    otherPlayer.inventory.modifyGemAmount(GemTypes.Red, numBlue);
                    otherPlayer.inventory.modifyGemAmount(GemTypes.Blue, numRed);
                    otherPlayerTurn();
                }
            };
            extend(Power, C1Power3);
        //endregion
        //region Power4 
            //Hurt enemy [x] amount
            function C1Power4()
            {
                this.labelText = "Hurt enemy 10";
                var cost = new Cost(3,0,2,2,2);
                Power.call(this, cost);
            }
            C1Power4.prototype = {
                execute: function(player){
                    var otherPlayer = (player===player1)? player2: player1;
                    otherPlayer.decreaseHealth(10);
                    otherPlayerTurn();
                }
            };
            extend(Power, C1Power4);
        //endregion
    function Class1()
    {
        var power1 = new C1Power1();
        var power2 = new C1Power2();
        var power3 = new C1Power3();
        var power4 = new C1Power4();
        PlayerClass.call(this, power1, power2, power3, power4);
    }
    extend(PlayerClass, Class1);
    //endregion
//endregion
//region /*---Players---*/
function Inventory()
{
    this.RedGems = 0;
    this.YellowGems = 0;
    this.GreenGems = 0;
    this.BlueGems = 0;
    this.PurpleGems = 0;
    this.RockGems = 0;
}
Inventory.prototype = {
    addGems: function(gemType, amount)
    {
        console.log("add " + amount + " " + gemType + " gems");
        switch(gemType)
        {
            case GemTypes.Red: this.RedGems+=amount; this.redAmt.text = ""+this.RedGems; break;
            case GemTypes.Yellow: this.YellowGems+=amount; this.yellowAmt.text = ""+this.YellowGems; break;
            case GemTypes.Green: this.GreenGems+=amount; this.greenAmt.text = ""+this.GreenGems; break;
            case GemTypes.Blue: this.BlueGems+=amount; this.blueAmt.text = ""+this.BlueGems; break;
            case GemTypes.Purple: this.PurpleGems+=amount; this.purpleAmt.text = ""+this.PurpleGems; break;
            case GemTypes.Rock: this.RockGems+=amount; this.rockAmt.text = ""+this.RockGems; break;
        }
    },
    removeGems: function(gemType, amount)
    {
        switch(gemType)
        {
            case GemTypes.Red: this.RedGems-=amount; this.redAmt.text = ""+this.RedGems; break;
            case GemTypes.Yellow: this.YellowGems-=amount; this.yellowAmt.text = ""+this.YellowGems; break;
            case GemTypes.Green: this.GreenGems-=amount; this.greenAmt.text = ""+this.GreenGems; break;
            case GemTypes.Blue: this.BlueGems-=amount; this.blueAmt.text = ""+this.BlueGems; break;
            case GemTypes.Purple: this.PurpleGems-=amount; this.purpleAmt.text = ""+this.PurpleGems; break;
            case GemTypes.Rock: this.RockGems-=amount; this.rockAmt.text = ""+this.RockGems; break;
        }
    },
    modifyGemAmount: function(gemType, newAmount)
    {
        switch(gemType)
        {
            case GemTypes.Red: this.RedGems=newAmount; this.redAmt.text = ""+this.RedGems; break;
            case GemTypes.Yellow: this.YellowGems=newAmount; this.yellowAmt.text = ""+this.YellowGems; break;
            case GemTypes.Green: this.GreenGems=newAmount; this.greenAmt.text = ""+this.GreenGems; break;
            case GemTypes.Blue: this.BlueGems=newAmount; this.blueAmt.text = ""+this.BlueGems; break;
            case GemTypes.Purple: this.PurpleGems=newAmount; this.purpleAmt.text = ""+this.PurpleGems; break;
            case GemTypes.Rock: this.RockGems=newAmount; this.rockAmt.text = ""+this.RockGems; break;
        }
    },
    reset: function()
    {
        this.RedGems = 0;
        this.redAmt.text = ""+0;
        this.YellowGems = 0;
        this.yellowAmt.text = ""+0;
        this.GreenGems = 0;
        this.greenAmt.text = ""+0;
        this.BlueGems = 0;
        this.blueAmt.text = ""+0;
        this.PurpleGems = 0;
        this.purpleAmt.text = ""+0;
        this.RockGems = 0;
        this.rockAmt.text = ""+0;
    },
    setupDisplay: function(onLeft)
    {
        this.container = new createjs.Container();
        var imagePad = 5;
        var imageX = 0;
        var textPad = GEM_WIDTH + 10;
        if(!onLeft)
        {
            imageX = textPad;
            textPad = 0;
        }
        this.redImage = new createjs.Bitmap(queue.getResult("gemRed"));
        this.redImage.x = imageX;
        this.redAmt = new createjs.Text("0", ""+INVENTORY_TEXT_SIZE+"px Arial", "#ffffff");
        this.redAmt.x = textPad;
        this.yellowImage = new createjs.Bitmap(queue.getResult("gemYellow"));
        this.yellowImage.x = imageX;
        this.yellowImage.y = GEM_HEIGHT + imagePad;
        this.yellowAmt = new createjs.Text("0", ""+INVENTORY_TEXT_SIZE+"px Arial", "#ffffff");
        this.yellowAmt.x = textPad;
        this.yellowAmt.y = this.yellowImage.y;
        this.greenImage = new createjs.Bitmap(queue.getResult("gemGreen"));
        this.greenImage.x = imageX;
        this.greenImage.y = 2*(GEM_HEIGHT + imagePad);
        this.greenAmt = new createjs.Text("0", ""+INVENTORY_TEXT_SIZE+"px Arial", "#ffffff");
        this.greenAmt.x = textPad;
        this.greenAmt.y = this.greenImage.y;
        this.blueImage = new createjs.Bitmap(queue.getResult("gemBlue"));
        this.blueImage.y = 3*(GEM_HEIGHT + imagePad);
        this.blueImage.x = imageX;
        this.blueAmt = new createjs.Text("0", ""+INVENTORY_TEXT_SIZE+"px Arial", "#ffffff");
        this.blueAmt.x = textPad;
        this.blueAmt.y = this.blueImage.y;
        this.purpleImage = new createjs.Bitmap(queue.getResult("gemPurple"));
        this.purpleImage.y = 4*(GEM_HEIGHT + imagePad);
        this.purpleImage.x = imageX;
        this.purpleAmt = new createjs.Text("0", ""+INVENTORY_TEXT_SIZE+"px Arial", "#ffffff");
        this.purpleAmt.x = textPad;
        this.purpleAmt.y = this.purpleImage.y;
        this.rockImage = new createjs.Bitmap(queue.getResult("gemRock"));
        this.rockImage.y = 5*(GEM_HEIGHT + imagePad);
        this.rockImage.x = imageX;
        this.rockAmt = new createjs.Text("0", ""+INVENTORY_TEXT_SIZE+"px Arial", "#ffffff");
        this.rockAmt.x = textPad;
        this.rockAmt.y = this.rockImage.y;  this.container.addChild(this.redImage,this.redAmt,this.yellowImage,this.yellowAmt,this.greenImage,this.greenAmt,this.blueImage,this.blueAmt,this.purpleImage,this.purpleAmt,this.rockImage,this.rockAmt);
    }
};
function Player(playerClass)
{
    this.inventory = new Inventory();
    this.health = BASE_PLAYER_HEALTH;
    this.playerClass = playerClass;
}
Player.prototype = {
    decreaseHealth: function(amount)
    {
        this.health -= amount;
        this.updateHealthBar();
        //do something if health <= 0
    },
    addHealth: function(amount)
    {
        this.health += amount;
        this.updateHealthBar();
    },
    reset: function()
    {
        this.health = BASE_PLAYER_HEALTH;
        this.inventory.reset();
        this.playerClass.reset();
        this.updateHealthBar();
    },
    updateHealthBar: function()
    {
        this.healthBar.scaleY = -((this.health/BASE_PLAYER_HEALTH)*HEALTH_BAR_HEIGHT);
    },
    addGemsToInventory: function(gemType, amount)
    {
        this.inventory.addGems(gemType, amount);
        this.playerClass.updatePowers(this.inventory.RedGems, this.inventory.YellowGems,this.inventory.GreenGems,this.inventory.BlueGems,this.inventory.PurpleGems);
    },
    removeGemsFromInventory: function(gemType, amount)
    {
        this.inventory.removeGems(gemType, amount);
        this.playerClass.updatePowers(this.inventory.RedGems, this.inventory.YellowGems,this.inventory.GreenGems,this.inventory.BlueGems,this.inventory.PurpleGems);
    },
    setupHealthBar: function()
    {
        this.healthBarContainer = new createjs.Container();
        this.healthBar = new createjs.Shape();
        this.healthBar.graphics.beginFill("#F00").drawRect(0,0,HEALTH_BAR_WIDTH,1).endFill();
        this.healthBar.y = HEALTH_BAR_HEIGHT;
        this.healthFrame = new createjs.Shape();
        var padding = HEALTH_BAR_PADDING;
        this.healthFrame.graphics.setStrokeStyle(1).beginStroke("#F00").drawRect(-padding/2, -HEALTH_BAR_PADDING/2, HEALTH_BAR_WIDTH+padding, HEALTH_BAR_HEIGHT+padding);
        this.healthBarContainer.addChild(this.healthBar, this.healthFrame);
        //position health bar container and add to player container
    },
    setupDisplay: function(isOnLeft)
    {
        this.container = new createjs.Container();
        this.setupHealthBar();
        this.updateHealthBar();
        //this.healthBarContainer.y = 50;
        this.inventory.setupDisplay(isOnLeft);
        this.inventory.rockImage.on("click", throwRock, null, false, {player:this});
        this.playerClass.setupDisplay();
        this.playerClass.container.y = canvasHeight - 320;
        this.playerClass.power1.container.on("click", executePower, null, false, {player:this, power:this.playerClass.power1});
        this.playerClass.power2.container.on("click", executePower, null, false, {player:this, power:this.playerClass.power2});
        this.playerClass.power3.container.on("click", executePower, null, false, {player:this, power:this.playerClass.power3});
        this.playerClass.power4.container.on("click", executePower, null, false, {player:this, power:this.playerClass.power4});
        if(isOnLeft)
        {
            this.healthBarContainer.x = (PLAYER_DISPLAY_WIDTH - (HEALTH_BAR_WIDTH + (2*HEALTH_BAR_PADDING)));
        }
        else
        {
            this.inventory.container.x = PLAYER_DISPLAY_WIDTH - 75;
        }
        this.container.addChild(this.healthBarContainer, this.inventory.container, this.playerClass.container);
    }
};
//endregion
//region /*---Board---*/
function getBoardSquare(boardArray, x, y)
{
    var square;
    if(x<0 || y<0 || x>=BOARD_WIDTH || y>=BOARD_HEIGHT)
    {
        square = SquareContents.Empty;
    }
    else
    {
        square = boardArray[x][y];
    }
    return square;
}
function getSquareDisplayCoords(gemX, gemY)
{
    var xPos = board.image.x + BOARD_FRAME_WIDTH + (gemX*BOARD_SQUARE_WIDTH) + (gemX*BOARD_SQUARE_SPACING);
    var yPos = board.image.y + BOARD_FRAME_HEIGHT + (gemY*BOARD_SQUARE_HEIGHT) + (gemY*BOARD_SQUARE_SPACING);
    var coordinate = {x:xPos, y:yPos};
    return coordinate;
}
function MatchSet(gemType)
{
    this.gemType = gemType;
    this.numGems = 0;
    this.gems = [];
}
function GameBoard()
{
    this.squares = new Array(BOARD_HEIGHT);
    var i;
    for(i = 0; i < BOARD_HEIGHT; i++)
    {
        this.squares[i] = new Array(BOARD_WIDTH);
    }
    this.width = (BOARD_FRAME_WIDTH*2)+(BOARD_WIDTH*BOARD_SQUARE_WIDTH)+((BOARD_WIDTH-1)*BOARD_SQUARE_SPACING);
    this.height = (BOARD_FRAME_HEIGHT*2)+(BOARD_HEIGHT*BOARD_SQUARE_HEIGHT)+((BOARD_HEIGHT-1)*BOARD_SQUARE_SPACING);
    this.image = new createjs.Rectangle(0,0,this.width, this.height);
    this.container = new createjs.Container();
    this.fillPreviously = false;
    //this.container.addChild(this.image);
}
GameBoard.prototype = {
    fill: function()
    {
        var x, y;
        for(x = 0; x < BOARD_WIDTH; x++)
        {
            for(y = 0; y < BOARD_HEIGHT; y++)
            {
                this.squares[x][y] = getRandomGem(x, y);
                var coords = getSquareDisplayCoords(x, y);
                this.squares[x][y].image.x = coords.x;
                this.squares[x][y].image.y = coords.y;
                this.container.addChild(this.squares[x][y].image);
            }
        }
        this.fillPreviously = true;
    },
    empty: function()
    {
        if(this.fillPreviously)
        {
            for(var x = 0; x < BOARD_WIDTH; x++)
            {
                for(var y = 0; y < BOARD_HEIGHT; y++)
                {
                    var oldGem = this.squares[x][y];
                    oldGem.image.visible = false;
                    this.container.removeChild(oldGem.image);
                    this.squares[x][y] = SquareContents.Empty;
                }
            }
        }
    },
    findGemMatches: function()
    {
        var matchSets = []; //list of lists of gems
        var squaresCopy = this.squares.slice(0);
        var x,y;
        for(x = 0; x < BOARD_WIDTH; x ++)
        {
            for(y = 0; y < BOARD_HEIGHT; y++)
            {
                var target = squaresCopy[x][y];
                if(target !== SquareContents.Empty)//targetGem  is not an empty space)
                {
                    if((target.matches(getBoardSquare(squaresCopy, x+1, y))) && (target.matches(getBoardSquare(squaresCopy, x+2, y))) )
                    {
                        var matchSet = new MatchSet(target.type);//matchSet is new MatchSet
                        var xOffset = 0;
                        while(target.matches(getBoardSquare(squaresCopy, x+xOffset, y)))//[gem at x+xOffset, y] matches targetGem)
                        {
                            matchSet.gems[matchSet.gems.length] = squaresCopy[x+xOffset][y];//add gem at x+xOffset, y to matchSet's combinationSet
                            squaresCopy[x+xOffset][y] = SquareContents.Empty;//gem at x+xOffset, y is an empty space
                            xOffset++;
                            matchSet.numGems++; //matchSet's number of gems ++
                        }
                        matchSets[matchSets.length] = matchSet;
                    }
                }
                if(target !== SquareContents.Empty)
                {
                    if( (target.matches(getBoardSquare(squaresCopy, x, y+1))) && (target.matches(getBoardSquare(squaresCopy, x, y+2))) )
                    {
                        var verticalMatchSet = new MatchSet(target.type);//matchSet is new MatchSet
                        var yOffset = 0;
                        while(target.matches(getBoardSquare(squaresCopy, x, y+yOffset)))
                        {
                            verticalMatchSet.gems[verticalMatchSet.gems.length] = squaresCopy[x][y+yOffset];//add gem at x, y+yOffset to matchSet's combinationSet
                            squaresCopy[x][y+yOffset]= SquareContents.Empty;
                            yOffset++;
                            verticalMatchSet.numGems++;
                        }
                        matchSets[matchSets.length] = verticalMatchSet;
                    }
                }
            }
        }
        return matchSets;
    },
    findFallingGems: function()
    {
        var fallingGems = []; //list of falling gems
        var squaresCopy = this.squares.slice(0);
        var x,y;
        for(x = 0; x<BOARD_WIDTH; x++)
        {
            for(y = BOARD_HEIGHT-2; y>=0; y--)//start at the 2nd to the bottom row
            {
                if(squaresCopy[x][y]!== SquareContents.Empty && squaresCopy[x][y+1]===SquareContents.Empty)//this square not empty but one below it is
                {
                    fallingGems[fallingGems.length] = squaresCopy[x][y];
                    squaresCopy[x][y] = SquareContents.Empty;
                }
            }
        }
        return fallingGems;
    },
    findEmptyColumns: function()//Performed after the falling gems have been found & have fallen, used to fill found columns
    {
        var emptySpacesPerColumn = new Array(BOARD_WIDTH);//array of numbers of empty spaces per column, ie if [0] = 5, column 0 has 5 empty spaces
        var x,y;
        for(x = 0; x < BOARD_WIDTH; x++)
        {
            emptySpacesPerColumn[x] = 0;
            for(y = 0; y < BOARD_HEIGHT; y++)
            {
                if(this.squares[x][y] === SquareContents.Empty)
                {
                    emptySpacesPerColumn[x]++;
                }
            }
        }
        return emptySpacesPerColumn;
    },
    movesExist: function()//check that there are still possible matches existing on board
    {
        var switchPatterns = [
            [[0,1],[1,0],[2,0]],
            [[0,1],[1,1],[2,0]],
            [[0,0],[1,1],[2,0]],
            [[0,1],[1,0],[2,1]],
            [[0,0],[1,0],[2,1]],
            [[0,0],[1,1],[2,1]],
            [[0,0],[0,2],[0,3]],
            [[0,0],[0,1],[0,3]]
        ];
        var x,y;
        for(x = 0; x < BOARD_WIDTH; x++)
        {
            for(y = 0; y < BOARD_HEIGHT; y++)
            {
                for(pat in switchPatterns)
                {
                    if( ( ( getBoardSquare(this.squares, x+pat[0][0], y+pat[0][1]) == getBoardSquare(this.squares, x+pat[1][0], y+pat[1][1])) &&
                            (getBoardSquare(this.squares, x+pat[0][0], y+pat[0][1]) == getBoardSquare(this.squares, x+pat[2][0], y+pat[2][1])) &&
                            (getBoardSquare(this.squares, x+pat[0][0], y+pat[0][1]) != SquareContents.Empty)) ||
                        ( ( getBoardSquare(this.squares, x+pat[0][1], y+pat[0][0]) == getBoardSquare(this.squares, x+pat[1][1], y+pat[1][0])) &&
                            (getBoardSquare(this.squares, x+pat[0][1], y+pat[0][0]) == getBoardSquare(this.squares, x+pat[2][1], y+pat[2][0])) &&
                            (getBoardSquare(this.squares, x+pat[0][1], y+pat[0][0]) != SquareContents.Empty)) )
                    {
                        return true;
                    }
                }
            }
        }
        return false;
    },
    findAllOfGemType: function(gemType)
    {
        var gemsOfType = [];
        for(var x = 0; x < BOARD_WIDTH; x++)
        {
            for(var y = 0; y < BOARD_HEIGHT; y++)
            {
                if(this.squares[x][y].type === gemType)
                {
                    gemsOfType[gemsOfType.length] = this.squares[x][y];    
                }
            }
        }
        return gemsOfType;
    }
}
function removeTypeFromBoard(gemType)
{
    var gemsOfType = board.findAllOfGemType(gemType);
    if(gemsOfType.length > 0)
    {
        matchedGemsToBreak = gemsOfType.length;
        waitingForMatchBreaks = true;
        for(var i = 0; i < gemsOfType.length; i++)
        {
            shatterGem(gemsOfType[i], null);
        }
    }
}
//endregion
//endregion
/*------------------------------Setup------------------------------*/
//region Setup
function setupCanvas()
{
    var canvas = document.getElementById("game");
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
    stage = new createjs.Stage(canvas);
    stage.enableMouseOver();
    stage.on("stagemousemove", function(evt){ mouseX = evt.stageX.toFixed(); mouseY = evt.stageY.toFixed();});
}   

if (!!(window.addEventListener)) {
    window.addEventListener("DOMContentLoaded", main);
} else {//if using internet explorer 
    window.attatchEvent("onload", main);
}

function loadFiles()
{
    console.log("Loading files");
    queue = new createjs.LoadQueue(true, "Assets/");
    createjs.Sound.alternateExtensions = ["mp3"];
    queue.installPlugin(createjs.Sound);
    queue.on("complete", loadComplete, this);
    queue.loadManifest(manifest);
}
function loadComplete(evt)
{
    console.log("done loading files");
    titleScreen = new createjs.Bitmap(queue.getResult("titleScreen"));
    instructionScreen = new createjs.Bitmap(queue.getResult("instructionScreen"));
    gameplayScreen = new createjs.Bitmap(queue.getResult("gameplayScreen"));
    gameOverScreen = new createjs.Bitmap(queue.getResult("gameOverScreen"));
    levelSign = new createjs.Bitmap(queue.getResult("levelSign"));
    var buttonSheet = new createjs.SpriteSheet({
        images: [queue.getResult("button")],
        frames: {width: 93, height: 33, regX: 46, regY: 15},
        animations: {
            playUp: [0, 0, "playUp"],
            playOver: [1, 1, "playOver"],
            playDown: [2, 2, "playDown"],
            instructUp: [3, 3, "instructUp"],
            instructOver: [4, 4, "instructOver"],
            instructDown: [5, 5, "instructDown"],
            menuUp: [6, 6, "menuUp"],
            menuOver: [7, 7, "menuOver"],
            menuDown: [8, 8, "menuDown"],
            continueUp: [9, 9, "continueUp"],
            continueOver: [10, 10, "continueOver"],
            continueDown: [11, 11, "continueDown"]
        }
    });
    btnPlay = new createjs.Sprite(buttonSheet);
    btnInstruct = new createjs.Sprite(buttonSheet);
    btnMenu = new createjs.Sprite(buttonSheet);
    btnContinue = new createjs.Sprite(buttonSheet);
    
    var walkSheet = new createjs.SpriteSheet({
        images: [queue.getResult("walkingSprites")],
        frames: [[160,0,19,49,0,10.05,48.6],[179,0,34,44,0,17.05,43.6],[213,0,22,46,0,9.05,45.6],[235,0,17,49,0,8.05,48.6],[0,49,25,49,0,10.05,48.6],[25,49,31,46,0,14.05,45.6],[56,49,33,44,0,16.05,43.6],
                 [89,49,30,44,0,17.05,43.6],[119,49,28,46,0,17.05,45.6],[147,49,19,49,0,10.05,48.6],[166,49,23,49,0,14.05,48.6],[189,49,31,46,0,16.05,45.6],[220,49,34,44,0,17.05,43.6],[0,98,19,49,0,9.05,48.6],
                 [19,98,34,44,0,17.05,43.6],[53,98,22,46,0,13.05,45.6],[75,98,17,49,0,9.05,48.6],[92,98,25,49,0,15.05,48.6],[117,98,31,46,0,17.05,45.6],[148,98,33,44,0,17.05,43.6],[181,98,30,44,0,13.05,43.6],
                 [211,98,28,46,0,11.05,45.6],[0,147,19,49,0,9.05,48.6],[19,147,23,49,0,9.05,48.6],[42,147,31,46,0,15.05,45.6],[73,147,34,44,0,17.05,43.6]],
        animations: {
            standRight: [0, 0, "standRight"],
            walkRight: [1, 12, "walkRight", .5],
            standLeft: [13, 13, "standLeft"],
            walkLeft: [14, 25, "walkLeft", .5]
            }     
        });
    
    walkingSprite = new createjs.Sprite(walkSheet);
    console.log("Setup game objects");
    setupGameObjects();
    console.log("Setup buttons");
    setupButtons();
    console.log("Setup title screen");
    setupTitleScreen();
    console.log("Setup game over screen");
    setupGameOverScreen();
    setupGameplayScreen();
    setupInstructionScreen();
    mouseCoordText = new createjs.Text("X: \nY: ", "12px Arial", "#ffffff");
    mouseCoordText.x = 20;
    mouseCoordText.y = canvasHeight-50;
    //stage.addChild(mouseCoordText);
    musicInstance = createjs.Sound.play("musicLoop",createjs.Sound.INTERRUPT_NONE,0,0,-1);
    console.log("mus duration " + musicInstance.getDuration());
    allLoadingComplete = true;
}
function setupButtons()
{
    btnPlay.gotoAndPlay("playUp");
    btnPlay.on("click", function(evt) { btnPlay.gotoAndPlay("playDown"); gameState = GameStates.gamePlay; });
    btnPlay.on("mouseover", function(evt) { btnPlay.gotoAndPlay("playOver"); });
    btnPlay.on("mouseout", function(evt) { btnPlay.gotoAndPlay("playUp");});
    btnPlay.on("mousedown", function(evt) { btnPlay.gotoAndPlay("playDown");});
    
    btnInstruct.gotoAndPlay("instructUp");
    btnInstruct.on("click", function(evt) { btnInstruct.gotoAndPlay("instructDown"); gameState = GameStates.gameInstructions; });
    btnInstruct.on("mouseover", function(evt) { btnInstruct.gotoAndPlay("instructOver");});
    btnInstruct.on("mouseout", function(evt) { btnInstruct.gotoAndPlay("instructUp");});
    btnInstruct.on("mousedown", function(evt) { btnInstruct.gotoAndPlay("instructDown");});
    
    btnMenu.gotoAndPlay("menuUp");
    btnMenu.on("click", function(evt) { btnMenu.gotoAndPlay("menuDown"); gameState = GameStates.gameTitle; });
    btnMenu.on("mouseover", function(evt) { btnMenu.gotoAndPlay("menuOver");});
    btnMenu.on("mouseout", function(evt) { btnMenu.gotoAndPlay("menuUp");});
    btnMenu.on("mousedown", function(evt) { btnMenu.gotoAndPlay("menuDown");});
    
    btnContinue.gotoAndPlay("continueUp");
    btnContinue.on("click", function(evt) { btnContinue.gotoAndPlay("continueDown"); gameState = GameStates.gameTitle; });
    btnContinue.on("mouseover", function(evt) { btnContinue.gotoAndPlay("continueOver");});
    btnContinue.on("mouseout", function(evt) { btnContinue.gotoAndPlay("continueUp");});
    btnContinue.on("mousedown", function(evt) { btnContinue.gotoAndPlay("continueDown");});
}
function setupGameObjects()
{
    var p1Class = new Class1();
    var p2Class = new Class1();
    player1 = new Player(p1Class);
    console.log("Setup player 1 display");
    player1.setupDisplay(true);
    player2 = new Player(p2Class);
    console.log("Setup player 2 display");
    player2.setupDisplay(false);
    console.log("New board");
    board = new GameBoard();
    selectedGem1 = null;
    selectedGem2 = null;
    currentPlayerText = new createjs.Text("Current Player", "20px Arial", "#fff");
    currentPlayerText.textAlign = "center";
}
function resetGameObjects()
{
    JModeActive = false;
    player1.reset();
    player2.reset();
    selectedGem1 = null;
    selectedGem2 = null;
    board.empty();
    board.fill();
    currentPlayerText.x = SCREEN_PADDING + (PLAYER_DISPLAY_WIDTH/2);
    currentPlayerText.y = 10;
    currentPlayer = null;
    initialBoardFill = true;
    loadingText.visible = true;
    loadingSwirl.visible = true;
    swirl = createjs.Tween.get(loadingSwirl, {loop:true, override:true})
        .to({rotation:360}, 1500);
    board.container.visible = false;
    var matchSets = board.findGemMatches();
    if(matchSets.length >0)
    {
        matchedGemsToBreak = matchSets.length;
        waitingForMatchBreaks = true;
        for(var j = 0; j < matchSets.length; j++)
        {
            var matchSet = matchSets[j];
            for(var i = 0; i < matchSet.gems.length; i++)
            {
                shatterGem(matchSet.gems[i], null);
            }
        }
    }
    else
    {
        initialBoardFill = false;
        loadingText.visible = false;
        createjs.Tween.removeTweens(loadingSwirl);
        loadingSwirl.visible = false;
        board.container.visible = true;
        currentPlayer = player1;
    }
}
//endregion
/*----------------------------Main Loop----------------------------*/
//region Main
function loop()
{
    //mouseCoordText.text = "X: " + mouseX +"\nY: " + mouseY;
    if(allLoadingComplete)
    {
        gameStateAction();
        stage.update();
    }
}

function main()
{
    setupCanvas();
    allLoadingComplete = false;
    loadFiles();
    gameState = GameStates.gameTitle;
    frameCount = 0;
    gameTimer = 0;
    gameScore = 0;
    createjs.Ticker.addEventListener("tick", loop);
    createjs.Ticker.setFPS(FPS);
}

function handleKeyDown(evt)
{
    if(!evt){ var evt = window.event; }  //browser compatibility
    switch(evt.keyCode) 
    {
        case KC_LEFT:  console.log("LEFT ("+evt.keyCode+") down"); return false;
        case KC_RIGHT: console.log("RIGHT ("+evt.keyCode+") down"); return false;
        case KC_UP:    console.log("UP ("+evt.keyCode+") down"); return false;
        case KC_DOWN:  console.log("DOWN ("+evt.keyCode+") down"); return false;
        case KC_W: console.log("W ("+evt.keyCode+") down"); return false;
        case KC_A: console.log("A ("+evt.keyCode+") down"); return false;
        case KC_S: console.log("S ("+evt.keyCode+") down"); return false;
        case KC_D: console.log("D ("+evt.keyCode+") down"); return false;
        case KC_SPACE:  console.log("SPACE ("+evt.keyCode+") down"); return false;
        case KC_SHIFT:  console.log("SHIFT ("+evt.keyCode+") down"); return false;
    }
}

function handleKeyUp(evt) 
{
    if(!evt){ var evt = window.event; }  //browser compatibility
    switch(evt.keyCode) 
    {
        case KC_LEFT:console.log("LEFT ("+evt.keyCode+") up"); break;
        case KC_RIGHT: console.log("RIGHT ("+evt.keyCode+") up"); break;
        case KC_UP:	console.log("UP ("+evt.keyCode+") up"); break;
        case KC_DOWN:	console.log("DOWN ("+evt.keyCode+") up"); break;
        case KC_W:	console.log("W ("+evt.keyCode+") up"); break;
        case KC_A:	console.log("A ("+evt.keyCode+") up"); break;
        case KC_S:	console.log("S ("+evt.keyCode+") up"); break;
        case KC_D:	console.log("D ("+evt.keyCode+") up"); break;
        case KC_SPACE:	console.log("SPACE ("+evt.keyCode+") up"); break;
        case KC_SHIFT:	console.log("SHIFT ("+evt.keyCode+") up"); break;
        case KC_J: toggleJMode(); break;
    }
}

function resetGameTimer()
{
    frameCount = 0;
    gameTimer = 0;
}
function runGameTimer()
{
    frameCount += 1;
    if(frameCount%(FPS/10) === 0)
    {
        gameTimer = frameCount/(FPS);
    }
}

var lastGameState;
function gameStateAction()
{
    if(gameState != lastGameState)
    {
        gameStateSwitch();
    }
    lastGameState = gameState;
    switch(gameState)
    {
        case GameStates.gameOver:
            
        break;
        case GameStates.gameTitle:
            
        break;
        case GameStates.gamePlay:
            if(player1.health <= 0)
            {
                gameState = GameStates.gameOver;
                finalScoreText.text = "Player 2 Wins!"
            }
            else if(player2.health <= 0)
            {
                gameState = GameStates.gameOver;
                finalScoreText.text = "Player 1 Wins!"
            }
        break;
        case GameStates.gameInstructions:
            
        break;
    }
}

//run once when the game state has changed
function gameStateSwitch()
{
    switch(gameState)
    {
        case GameStates.gameOver:
            titleContainer.visible = false;
            instructionContainer.visible = false;
            gameplayContainer.visible = false;
            gameOverContainer.visible = true;
        break;
        case GameStates.gameTitle:
            titleContainer.visible = true;
            instructionContainer.visible = false;
            gameplayContainer.visible = false;
            gameOverContainer.visible = false;
        break;
        case GameStates.gamePlay:
            startGameplay();
            titleContainer.visible = false;
            instructionContainer.visible = false;
            gameplayContainer.visible = true;
            gameOverContainer.visible = false;
        break;
        case GameStates.gameInstructions:
            titleContainer.visible = false;
            instructionContainer.visible = true;
            gameplayContainer.visible = false;
            gameOverContainer.visible = false;
        break;
    }
}

function toggleJMode()
{
    if(JModeActive)
    {
        JModeActive = false;
        player1.removeGemsFromInventory(GemTypes.Red, JModeAdd);
        player1.removeGemsFromInventory(GemTypes.Yellow, JModeAdd);
        player1.removeGemsFromInventory(GemTypes.Green, JModeAdd);
        player1.removeGemsFromInventory(GemTypes.Blue, JModeAdd);
        player1.removeGemsFromInventory(GemTypes.Purple, JModeAdd);
        player1.removeGemsFromInventory(GemTypes.Rock, JModeAdd);
        
        player2.removeGemsFromInventory(GemTypes.Red, JModeAdd);
        player2.removeGemsFromInventory(GemTypes.Yellow, JModeAdd);
        player2.removeGemsFromInventory(GemTypes.Green, JModeAdd);
        player2.removeGemsFromInventory(GemTypes.Blue, JModeAdd);
        player2.removeGemsFromInventory(GemTypes.Purple, JModeAdd);
        player2.removeGemsFromInventory(GemTypes.Rock, JModeAdd);
    }
    else
    {
        JModeActive = true;
        player1.addGemsToInventory(GemTypes.Red, JModeAdd);
        player1.addGemsToInventory(GemTypes.Yellow, JModeAdd);
        player1.addGemsToInventory(GemTypes.Green, JModeAdd);
        player1.addGemsToInventory(GemTypes.Blue, JModeAdd);
        player1.addGemsToInventory(GemTypes.Purple, JModeAdd);
        player1.addGemsToInventory(GemTypes.Rock, JModeAdd);
        
        player2.addGemsToInventory(GemTypes.Red, JModeAdd);
        player2.addGemsToInventory(GemTypes.Yellow, JModeAdd);
        player2.addGemsToInventory(GemTypes.Green, JModeAdd);
        player2.addGemsToInventory(GemTypes.Blue, JModeAdd);
        player2.addGemsToInventory(GemTypes.Purple, JModeAdd);
        player2.addGemsToInventory(GemTypes.Rock, JModeAdd);
    }
}

//endregion
/*----------------------------Game Play----------------------------*/
//region gameplay
function executePower(evt, data)
{
    console.log("player " + player + " power " + power);
    console.log("execute power");
    var player = data.player;
    var power = data.power;
    if(player === currentPlayer)
    {
        if(power.cost.isFulfilled)
        {
            console.log("executed");
            power.execute(player);
            console.log("remove cost gems");
            player.removeGemsFromInventory(GemTypes.Red, power.cost.redCost);
            player.removeGemsFromInventory(GemTypes.Yellow, power.cost.yellowCost);
            player.removeGemsFromInventory(GemTypes.Green, power.cost.greenCost);
            player.removeGemsFromInventory(GemTypes.Blue, power.cost.blueCost);
            player.removeGemsFromInventory(GemTypes.Purple, power.cost.purpleCost);
            console.log("done removing cost gems");
        }
        else
        {
            console.log("cost not fulfilled");   
        }
    }
    else
    {
        console.log("not current player");
    }
}
function throwRock(evt, data)
{
    var player = data.player;
    if(player === currentPlayer)
    {
        if(player.inventory.RockGems >= 3)
        {
            var otherPlayer = (player===player1)? player2 : player1;
            otherPlayer.decreaseHealth(ROCK_GEM_DAMAGE);
            player.removeGemsFromInventory(GemTypes.Rock, 3);
            otherPlayerTurn();
        }
    }
}
function otherPlayerTurn()
{
    if(currentPlayer === player1)
    {
        currentPlayer = player2;
        var newTextX = (canvasWidth - SCREEN_PADDING) - (PLAYER_DISPLAY_WIDTH/2);
        moveTween = createjs.Tween.get(currentPlayerText, {loop:false, override:true})
        .to({x:newTextX}, 500, createjs.Ease.bounceOut);
        //tween =  currentPlayerText.x = SCREEN_PADDING + (PLAYER_DISPLAY_WIDTH/2);
    }
    else
    {
        currentPlayer = player1;
        var newTextX = SCREEN_PADDING + (PLAYER_DISPLAY_WIDTH/2);
        moveTween = createjs.Tween.get(currentPlayerText, {loop:false, override:true})
        .to({x:newTextX}, 500, createjs.Ease.bounceOut);
    }
}
function handleGemClick(evt, data)
{
    var clickedGem = data.gem;
    //highlight the clicked gem
    if(selectedGem1 === null)
    {
        selectedGem1 = clickedGem;
        clickedGem.highlight();
    }
    else if(selectedGem2 === null)
    {
        selectedGem2 = clickedGem;
        //clickedGem.highlight();
        handleMove();
    }
}
function swapGems(gemA, gemB)
{
    board.squares[gemA.x][gemA.y] = gemB;
    board.squares[gemB.x][gemB.y] = gemA;
    var tempX = gemA.x;
    var tempY = gemA.y;
    gemA.x = gemB.x;
    gemA.y = gemB.y;
    gemB.x = tempX;
    gemB.y = tempY;
    var newACoords = getSquareDisplayCoords(gemA.x, gemA.y);
    var newBCoords = getSquareDisplayCoords(gemB.x, gemB.y);
    if(waitingForSwap)
    {
        waitingForSwap = false;
        moveGem(gemA, newACoords.x, newACoords.y);
        waitingForSwap = true;
        moveGem(gemB, newBCoords.x, newBCoords.y);
    }
    else
    {
        moveGem(gemA, newACoords.x, newACoords.y);
        moveGem(gemB, newBCoords.x, newBCoords.y);
    }
}
function handleMove()
{
    if(gemsAreAdjacent(selectedGem1, selectedGem2))
    {
        selectedGem1.unhighlight();
        waitingForSwap = true;
        swapGems(selectedGem1, selectedGem2);
    }
    else
    {
        selectedGem1.unhighlight();
        selectedGem1 = null;
        selectedGem2 = null;
        //selectedGem2.unhighlight();
        //un-highlight gems, play 'you fail at this' noise
    }
}
function swapComplete()
{
    if(waitingForSwap)
    {
        waitingForSwap = false;
        var matchSets = board.findGemMatches();
        if(matchSets.length >0)
        {
            matchedGemsToBreak = matchSets.length;
            waitingForMatchBreaks = true;
            for(var j = 0; j < matchSets.length; j++)
            {
                var matchSet = matchSets[j];
                var setType = null;
                var g = 0;
                while(setType === null && g<matchSet.gems.length)
                {
                    if(matchSet.gems[g].type !== GemTypes.Rainbow)
                    {
                        setType = matchSet.gems[g].type;
                    }
                    g++;
                }
                for(var i = 0; i < matchSet.gems.length; i++)
                {
                    if(matchSet.gems[i].type === GemTypes.Rainbow)
                    {
                        matchSet.gems[i].type = setType;
                    }
                    shatterGem(matchSet.gems[i],currentPlayer);
                }
            }
        }
        else
        {
            swapGems(selectedGem1, selectedGem2);
            selectedGem1 = null;
            selectedGem2 = null;
        }
    }
}
function matchedGemBroken()
{
    matchedGemsToBreak -= 1;
    if(matchedGemsToBreak===0)
    {
        var fallingGems = board.findFallingGems();
        if(fallingGems.length>0)
        {
            waitingForDrop = true;
            while(fallingGems.length >0)
            {
                for(var i = 0; i < fallingGems.length; i++)
                {
                    var gem = fallingGems[i];
                    board.squares[gem.x][gem.y] = SquareContents.Empty;
                    board.squares[gem.x][gem.y+1] = gem;
                    gem.y = gem.y+1;
                    var newCoords = getSquareDisplayCoords(gem.x, gem.y);
                    moveGem(gem, newCoords.x, newCoords.y);
                }
                fallingGems = board.findFallingGems();
            }
            lastDrop = true;
        }
        else
        {
            waitingForDrop = false;
            lastDrop = true;
            dropsComplete();
        }
    }
}
function dropsComplete()
{
    if(lastDrop)
    {
        lastDrop = false;
        waitingForDrop = false;
        var emptySpaces = board.findEmptyColumns();
        for(var x = 0; x < emptySpaces.length; x++)
        {
            for(var y = 0; y < emptySpaces[x]; y++)
            {
                var newGem = getRandomGem(x, y);
                board.squares[x][y] = newGem;
                var coords = getSquareDisplayCoords(x,y);
                newGem.image.x = coords.x;
                newGem.image.y = coords.y-100;
                board.container.addChild(newGem.image);
                moveGem(newGem, coords.x, coords.y);
            }
        }
        var matchSets = board.findGemMatches();
        if(matchSets.length >0)
        {
            matchedGemsToBreak = matchSets.length;
            waitingForMatchBreaks = true;
            for(var j = 0; j < matchSets.length; j++)
            {
                var matchSet = matchSets[j];
                for(var i = 0; i < matchSet.gems.length; i++)
                {
                    shatterGem(matchSet.gems[i],currentPlayer);
                }
            }
        }
        else
        {
            if(initialBoardFill)
            {
                initialBoardFill = false;
                loadingText.visible = false;
                createjs.Tween.removeTweens(loadingSwirl);
                loadingSwirl.visible = false;
                board.container.visible = true;
            }
            otherPlayerTurn();
            selectedGem1 = null;
            selectedGem2 = null;
        }
    }
}
//endregion
/*---------------------------Title Screen Setup---------------------------*/
//region Title
function setupTitleScreen()
{
    btnPlay.x = canvasWidth/2;
    btnPlay.y = canvasHeight/2;
    
    btnInstruct.x = (canvasWidth/2);
    btnInstruct.y = (canvasHeight/2)+50;
    
    titleContainer = new createjs.Container();
    titleContainer.addChild(titleScreen, btnPlay, btnInstruct);
    stage.addChild(titleContainer);
    titleContainer.visible = true;
}
function resetTitle()
{
    btnPlay.x = canvasWidth/2;
    btnPlay.y = canvasHeight/2;
    
    btnInstruct.x = (canvasWidth/2);
    btnInstruct.y = (canvasHeight/2)+50;
}
//endregion
/*---------------------------Instructions Setup---------------------------*/
//region Title
function setupInstructionScreen()
{
    btnMenu.x = canvasWidth/2;
    btnMenu.y = canvasHeight-80;
    
    instructionContainer = new createjs.Container();
    instructionContainer.addChild(instructionScreen, btnMenu);
    stage.addChild(instructionContainer);
    instructionContainer.visible = false;
}
//endregion
/*----------------------------Game Play Setup----------------------------*/
//region Title
function setupGameplayScreen()
{
    gameTimeText = new createjs.Text("10", "50px Arial", "#ffffff");
    //gameTimeText.x = canvasWidth - 80;
    //gameTimeText.y = 50;
    
    gameScoreText = new createjs.Text("0", "50px Arial", "#ffffff");
    //gameScoreText.x = 50;
    //gameScoreText.y = 50;
    loadingText = new createjs.Text("Loading New Board", "40px Arial", "#ccc");
    loadingText.textAlign = "center";
    loadingText.x = canvasWidth/2;
    loadingText.y = canvasHeight/2;
    
    loadingSwirl = new createjs.Bitmap(queue.getResult("loadingSwirl"));
    loadingSwirl.regX = 100;
    loadingSwirl.regY = 100;
    loadingSwirl.x = canvasWidth/2;
    loadingSwirl.y = canvasHeight/2;
    
    //walkingSprite.x=10;
   // walkingSprite.y=530;
    //walk.gotoAndPlay("walkRight");
    
    board.container.x = (canvasWidth/2)-(board.width/2);
    //board.container.y = (canvasHeight/2)-(board.height/2);
    board.container.y = SCREEN_PADDING;
    
    player1.container.x = SCREEN_PADDING;
    player1.container.y = SCREEN_PADDING;
    player2.container.x = (canvasWidth-PLAYER_DISPLAY_WIDTH)-SCREEN_PADDING;
    player2.container.y = SCREEN_PADDING;
    //setupLevelDisplay();
    
    gameplayContainer = new createjs.Container();
    //gameplayContainer.addChild(gameplayScreen, gameTimeText, gameScoreText, walkingSprite, levelDisplayContainer, board.container);
    gameplayContainer.addChild(gameplayScreen, board.container, player1.container, player2.container, currentPlayerText,loadingSwirl,loadingText);
    stage.addChild(gameplayContainer);
    gameplayContainer.visible = false;
}
function setupLevelDisplay()
{
    levelSign.x = canvasWidth/2;
    levelSign.y = canvasHeight/2;
    
    levelText = new createjs.Text("0", "80px Arial", "#ffffff");
    levelText.textAlign = "center";
    levelText.x = canvasWidth/2+220;
    levelText.y = canvasHeight/2+130;
    
    levelDisplayContainer = new createjs.Container();
    levelDisplayContainer.addChild(levelSign, levelText);
    levelDisplayContainer.visible = false;
}
function startGameplay()
{
    resetGameTimer();
    gameScore = 0;
    resetGameObjects();
}
//endregion
/*----------------------------Game Over Setup----------------------------*/
//region Title
function setupGameOverScreen()
{
    btnContinue.x = canvasWidth/2;
    btnContinue.y = canvasHeight/2+100;
    
    finalScoreText = new createjs.Text("Score: 0", "40px Arial", "#ffffff");
    finalScoreText.textAlign = "center"
    finalScoreText.x = canvasWidth/2;
    finalScoreText.y = canvasHeight/2;
    
    gameOverContainer = new createjs.Container();
    gameOverContainer.addChild(gameOverScreen, btnContinue, finalScoreText);
    stage.addChild(gameOverContainer);
    gameOverContainer.visible = false;
}
//endregion