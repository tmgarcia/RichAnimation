/*jslint white: true */
/*jslint sloppy: true */
document.onkeydown = handleKeyDown;
document.onkeyup = handleKeyUp;

var BASE_PLAYER_HEALTH = 100;
var BOARD_WIDTH = 10;
var BOARD_HEIGHT = 10;
var BOARD_SQUARE_WIDTH = 10;
var BOARD_SQUARE_HEIGHT = 10;
var RAINBOW_GEM_CHANCE = 0.1;

var selectedGem1, selectedGem2;

var player1, player2;
var board;

var KC_LEFT = 37;
var KC_UP = 38;
var KC_RIGHT = 39;
var KC_DOWN = 40;

var KC_W = 87;
var KC_A = 65;
var KC_S = 83;
var KC_D = 68;

var KC_SPACE = 32;
var KC_SHIFT = 16;

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
    {src:"levelSign.png", id:"levelSign"}
];

/*------------------------------Objects------------------------------*/
function extend(base, sub) {
  var origProto = sub.prototype;
  sub.prototype = Object.create(base.prototype);
  for (var key in origProto)  {
     sub.prototype[key] = origProto[key];
  }
  sub.prototype.constructor = sub;
  Object.defineProperty(sub.prototype, 'constructor', { 
    enumerable: false, 
    value: sub 
  });
}
var GemTypes = { Red:0, Yellow:1, Green:2, Blue:3, Purple:4, Rock:5, Damage:6, Rainbow:7};
var SquareContents = {Gem:0, Empty:1};
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
            match =  (this.type == otherGem.type);
        }
        return match;
    },
    shatter: function(player) {
        //abstract
    }
}
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
    return gem;
}
function moveGem(gem, newX, newY)
{
    board.squares[gem.x][gem.y] = SquareContents.Empty;
    board.squares[newX][newY] = gem;
    gem.x = newX;
    gem.y = newY;
    //animate moving of gem
}
function gemsAreAdjacent(gemA, gemB)
{
    var adjacent = false;
    if( (gemA.y == gemB.y && (gemA.x == gemB.x+1 || gemA.x == gemB.x-1)) ||
       (gemA.x == gemB.x && (gemA.y == gemB.y+1 || gemA.y == gemB.y-1)))
    {
        adjacent = true;
    }
    return adjacent;
}
    //region Red 
    function RedGem(x, y)
    {
        Gem.call(this, GemTypes.Red, x, y);
    }
    RedGem.prototype = {
        shatter: function(player){
            //animate breaking
            //give player red gem
        }
    }
    extend(Gem, RedGem);
    //endregion
    //region Yellow 
    function YellowGem(x, y)
    {
        Gem.call(this, GemTypes.Yellow, x, y);
    }
    YellowGem.prototype = {
        shatter: function(player){
            //animate breaking
            //give player yellow gem
        }
    }
    extend(Gem, YellowGem);
    //endregion
    //region Green 
    function GreenGem(x, y)
    {
        Gem.call(this, GemTypes.Green, x, y);
    }
    GreenGem.prototype = {
        shatter: function(player){
            //animate breaking
            //give player yellow gem
        }
    }
    extend(Gem, GreenGem);
    //endregion
    //region Blue 
    function BlueGem(x, y)
    {
        Gem.call(this, GemTypes.Blue, x, y);
    }
    BlueGem.prototype = {
        shatter: function(player){
            //animate breaking
            //give player Blue gem
        }
    }
    extend(Gem, BlueGem);
    //endregion
    //region Purple
    function PurpleGem(x, y)
    {
        Gem.call(this, GemTypes.Purple, x, y);
    }
    PurpleGem.prototype = {
        shatter: function(player){
            //animate breaking
            //give player Purple gem
        }
    }
    extend(Gem, PurpleGem);
    //endregion
    //region Rock 
    function RockGem(x, y)
    {
        Gem.call(this, GemTypes.Rock, x, y);
    }
    RockGem.prototype = {
        shatter: function(player){
            //animate breaking
            //give player Rock gem
        }
    }
    extend(Gem, RockGem);
    //endregion
    //region Damage 
    function DamageGem(x, y)
    {
        Gem.call(this, GemTypes.Damage, x, y);
    }
    DamageGem.prototype = {
        shatter: function(player){
            //animate breaking
            //hurt other player
        }
    }
    extend(Gem, DamageGem);
    //endregion
    //region Rainbow 
    function RainbowGem(x, y)
    {
        Gem.call(this, GemTypes.Rainbow, x, y);
    }
    RainbowGem.prototype = {
        shatter: function(player){
            //animate breaking
            //give player correct gem (pass type?)
        }
    }
    extend(Gem, RainbowGem);
    //endregion
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
}
Cost.prototype = {
    updateFulfilledGems: function(gemType, amount){
        switch(gemType)
        {
            case GemTypes.Red: this.redFulfilled = amount;
            case GemTypes.Yellow: this.yellowFulfilled = amount;    
            case GemTypes.Green: this.greenFulfilled = amount;    
            case GemTypes.Blue: this.blueFulfilled = amount;    
            case GemTypes.Purple: this.purpleFulfilled = amount;  
        }
        //light up if cost completely fulfilled
    },
    clearFulfilledGems: function(){
        this.redFulfilled = 0;
        this.yellowFulfilled = 0;
        this.greenFulfilled = 0;
        this.blueFulfilled = 0;
        this.purpleFulfilled = 0;
    }
}
function Power(cost)
{
    this.cost = cost;
}
Power.prototype = {
    execute: function(){
        //execute power
    }
}
//endregion
//region /*---Classes---*/
function PlayerClass(power1, power2, power3, power4)
{
    this.power1 = power1;
    this.power2 = power2;
    this.power3 = power3;
    this.power4 = power4;
}
    //region Class 1 
        //region Power1 
        //Remove all of [x] gem from board
        function C1Power1()
        {
            var cost = new Cost(0,0,0,0,0);
            Power.call(this, cost);
        }
        C1Power1.prototype = {
            execute: function(){
                //Remove all of [x] gem from board
            }
        }
        extend(Power, C1Power1);
        //endregion
        //region Power2 
            //Heal [x] life points
            function C1Power2()
            {
                var cost = new Cost(0,0,0,0,0);
                Power.call(this, cost);
            }
            C1Power2.prototype = {
                execute: function(){
                    //Heal [x] life points
                }
            }
            extend(Power, C1Power2);
        //endregion
        //region Power3 
            //Convert all of enemy’s [x color] into [y color]
            function C1Power3()
            {
                var cost = new Cost(0,0,0,0,0);
                Power.call(this, cost);
            }
            C1Power3.prototype = {
                execute: function(){
                    //Convert all of enemy’s [x color] into [y color]
                }
            }
            extend(Power, C1Power3);
        //endregion
        //region Power4 
            //Hurt enemy [x] amount
            function C1Power4()
            {
                var cost = new Cost(0,0,0,0,0);
                Power.call(this, cost);
            }
            C1Power4.prototype = {
                execute: function(){
                    //Hurt enemy [x] amount
                }
            }
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
        switch(gemType)
        {
            case GemTypes.Red: this.RedGems++; break;
            case GemTypes.Yellow: this.YellowGems++; break;
            case GemTypes.Green: this.GreenGems++; break;
            case GemTypes.Blue: this.BlueGems++; break;
            case GemTypes.Purple: this.PurpleGems++; break;
            case GemTypes.Rock: this.RockGems++; break;
        }
    }
}
function Player(playerClass)
{
    this.inventory = new Inventory();
    this.health = BASE_PLAYER_HEALTH;
    this.class = playerClass;
}
Player.prototype = {
    decreaseHealth: function(amount)
    {
        this.health -= amount;
        //do something if health <= 0
    }
};
//endregion
//region /*---Board---*/
function getBoardSquare(boardArray, x, y)
{
    var square;
    if(x<0 || y<0 || x>=BOARD_WIDTH || y>=BOARDHEIGHT)
    {
        square = SquareContents.Empty;
    }
    else
    {
        square = boardArray[x][y];
    }
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
    for(var i = 0; i < BOARD_HEIGHT; i++)
    {
        this.squares[i] = new Array(BOARD_WIDTH);
    }
}
GameBoard.prototype = {
    fill: function()
    {
        for(var x = 0; x < BOARD_WIDTH; x++)
        {
            for(var y = 0; y < BOARD_HEIGHT; y++)
            {
                this.squares[x][y] = getRandomGem(x, y);
            }
        }
    },
    findGemMatches: function()
    {
        var matchSets = []; //list of lists of gems
        var squaresCopy = this.squares.slice(0);
        for(var x = 0; x < BOARD_WIDTH; x ++)
        {
            for(var y = 0; y < BOARD_HEIGHT; y++)
            {
                var target = squaresCopy[x][y];
                if(target != SquareContents.Empty)//targetGem  is not an empty space)
                {
                    if((target.matches(getBoardSquare(squaresCopy, x+1, y))) && (target.matches(getBoardSquare(squaresCopy, x+2, y))) )
                    {
                        var matchSet = new MatchSet(targetGem.type);//matchSet is new MatchSet
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
                if(target != SquareContents.Empty)
                {
                    if( (target.matches(getBoardSquare(squaresCopy, x, y+1))) && (target.matches(getBoardSquare(squaresCopy, x, y+2))) )
                    {
                        var matchSet = new MatchSet(targetGem.type);//matchSet is new MatchSet
                        var yOffset = 0;
                        while(target.matches(getBoardSquare(squaresCopy, x, y+yOffset)))
                        {
                            matchSet.gems[matchSet.gems.length] = squaresCopy[x][y+yOffset];//add gem at x, y+yOffset to matchSet's combinationSet
                            squaresCopy[x][y+yOffset]= SquareContents.Empty;
                            yOffset++;
                            matchSet.numGems++;
                        }
                        matchSets[matchSets.length] = matchSet;
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
        for(var x = 0; x<BOARD_WIDTH; x++)
        {
            for(var y = BOARD_HEIGHT-2; y>=0; y++)//start at the 2nd to the bottom row
            {
                if(squaresCopy[x][y]!= SquareContents.Empty && squaresCopy[x][y-1]===SquareContents.Empty)//this square not empty but one below it is
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
        var emptySpacesPerColumn = [BOARD_WIDTH];//array of numbers of empty spaces per column, ie if [0] = 5, column 0 has 5 empty spaces
        for(var x = 0; x < BOARD_WIDTH; x++)
        {
            emptySpacesPerColumn[x] = 0;
            for(var y = 0; y < BOARD_HEIGHT; y++)
            {
                if(this.squares[x][y] === SquareContents.Empty)
                {
                    emptySpacesPerColumn[x]++;
                }
            }
        }
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
        for(var x = 0; x < BOARD_WIDTH; x++)
        {
            for(var y = 0; y < BOARD_HEIGHT; y++)
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
    queue = new createjs.LoadQueue(true, "assets/");
    queue.on("complete", loadComplete, this);
    queue.loadManifest(manifest);
}
function loadComplete(evt)
{
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
    
    setupGameObjects();
    setupButtons();
    setupTitleScreen();
    setupGameOverScreen();
    setupGameplayScreen();
    setupInstructionScreen();
    mouseCoordText = new createjs.Text("X: \nY: ", "12px Arial", "#ffffff");
    mouseCoordText.x = 20;
    mouseCoordText.y = canvasHeight-50;
    stage.addChild(mouseCoordText);
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
    player2 = new Player(p2Class);
    
    board = new GameBoard();
    board.fill();
}
//endregion
/*----------------------------Main Loop----------------------------*/
//region Main
function loop()
{
    mouseCoordText.text = "X: " + mouseX +"\nY: " + mouseY;
    gameStateAction();
    stage.update();
}

function main()
{
    setupCanvas();
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
            if(!playingLevelIntro)
            {
                runGameTimer();
                walkingSprite.x +=1;
                gameTimeText.text = "" + gameTimer.toFixed();
                if(gameTimer >= gameTimerLimit)
                {
                    gameState = GameStates.gameOver;
                    walkingSprite.stop();
                }
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
            finalScoreText = "Score: " +gameScoreText;
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

//endregion
/*---------------------------Title Screen---------------------------*/
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
/*---------------------------Instructions---------------------------*/
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
/*----------------------------Game Play----------------------------*/
//region Title
function setupGameplayScreen()
{
    gameTimeText = new createjs.Text("10", "50px Arial", "#ffffff");
    gameTimeText.x = canvasWidth - 80;
    gameTimeText.y = 50;
    
    gameScoreText = new createjs.Text("0", "50px Arial", "#ffffff");
    gameScoreText.x = 50;
    gameScoreText.y = 50;
    
    walkingSprite.x=10;
    walkingSprite.y=530;
    //walk.gotoAndPlay("walkRight");
    
    setupLevelDisplay();
    
    gameplayContainer = new createjs.Container();
    gameplayContainer.addChild(gameplayScreen, gameTimeText, gameScoreText, walkingSprite, levelDisplayContainer);
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
    walkingSprite.x=10;
    levelDisplayContainer.regX = levelDisplayContainer.getBounds().width/2;
    levelDisplayContainer.regY = levelDisplayContainer.getBounds().height/2;
    levelDisplayContainer.x = 0;
    levelDisplayContainer.y = -canvasHeight;
    levelDisplayContainer.visible = true;
    tweenLevel();
}
var levelTween;
function tweenLevel()
{
    playingLevelIntro = true;
    levelTween = createjs.Tween.get(levelDisplayContainer, {loop:false})
        .wait(500)
        .to({x:0, y:0, rotation:0}, 2000, createjs.Ease.bounceOut)
        .wait(500)
        .to({y:canvasHeight+200, rotation:0}, 1000, createjs.Ease.backIn)
        .call(levelTweenComplete);
}
function levelTweenComplete()
{
    playingLevelIntro = false;
    levelDisplayContainer.visible = false;
    walkingSprite.gotoAndPlay("walkRight");
}
//endregion
/*----------------------------Game Over----------------------------*/
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