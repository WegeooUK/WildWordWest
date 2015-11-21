var events      = require('events');
var EventEmitter = require('events').EventEmitter;

var Block       = require('./block.js');
var Level       = require('./level.js');
var BlockType   = require('./blockType.js');
var Countdown   = require('./countdown');

var lettersController = require('../controllers/letters.server.controller');
var wordsController = require('../controllers/words.server.controller');

/**
 * Module exports.
 */

module.exports = Board;

/**
 * Board constructor.
 *
 * @param {locale}
 * @param {numColumns}
 * @param {numRows}
 */
function Board(locale,numColumns,numRows)
{
    /**
     * game options
     */
    this.numColumns    = numColumns;
    this.numRows       = numRows;
    this.locale        = locale;

    /**
     * Array of letters with frequency. used when creating block
     * @type {null}
     */
    this.letterFrequency   = {};
    /**
     * Defines the grid blocks. Array of Columns
     * @type {}
     */
    this.grid              = {};

    /**
     * Defines all new blocks created. This blocks have to be synchronized with the client
     * @type {Array}
     */
    this.nonSynchronizedBlocks = [];

    /**
     * Percent of Normal, Bonus, Bomb Blocks
     * @type {number}
     */
    this.normalPercent      = 85;
    this.bonusPercent       = 10;
    this.bombPercent        = 5;

    /**
     * Time in milliseconds considered as game score
     * @type {number}
     */
    this.score = 0;

    /**
     * Array of Level ( Level has index and decrementPoints )
     * @type {Array}
     */
    this.levels = [];

    /**
     * Level Index
     * @type {number}
     */
    this.currentLevel = 0;

    /**
     * Countdown Object
     * @type {Countdown}
     */
    this.countDown = null;

    /**
     * Total points used to define the level change. Start at 1200 points
     * @type {number}
     */
    this.totalPoints = 1200;

    /**
     * Specifies the best word found by the gamer, regarding the number of points winned with.
     * @type {string}
     */
    this.bestWord = '';

    /**
     * Specifies the number of points winned with the best word.
     * @type {number}
     */
    this.bestWordPoints = 0;

    /**
     * Allows to block the board when the game is over to prevent the client to continue to send words
     * @type {boolean}
     */
    this.isGameOver = false;

    //load the letter informations
    this.loadLetterFrequency(locale);
}

// inherit events.EventEmitter
Board.prototype = Object.create(EventEmitter.prototype);
Board.prototype.constructor = Board;
////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////  LOAD LOCALE
/**
 * Load all about the locale
 *
 * @param {locale}
 */
Board.prototype.loadLetterFrequency = function(locale)
{
    var self = this;
    lettersController.promiseList(locale).exec(function(err, letters)
    {
        for(var iL = 0 ; iL < letters.length ; iL++)
        {
            var lLetter = letters[iL];
            self.letterFrequency[lLetter["letter"]] = lLetter["frequency"];
        }

        console.log(letters);
        self.initialize();
    });
};
////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////// INITIALIZE
Board.prototype.initialize = function()
{
    this.grid.columns = [];
    for(var iC = 0 ; iC < this.numColumns ; iC++)
    {
        var lColumn = [];
        this.grid.columns.push(lColumn);
        for(var iR = 0 ; iR < this.numRows ; iR++)
        {
            var block = this.addBlockToColumn(iC);
            block.__row = iR;
        }
    }

    this.createLevels();

    this.emit('initialized', {
        blocks: this._getNonSynchronizedBlocks(),
        points: 1200,
        level: this.currentLevel,
        speed: this.levels[this.currentLevel].getDecrementPoints()
    });

    this.launchCountdown();
}
////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////// CREATE LEVELS
/**
 * Defines all levels of the game
 */
Board.prototype.createLevels = function()
{
    //this.levels.push(new Level(0,0.05));
    //this.levels.push(new Level(1,0.075));
    //this.levels.push(new Level(2,0.0975));
    //this.levels.push(new Level(3,0.12675));

    //this.levels.push(new Level(0,0.025));
    //this.levels.push(new Level(1,0.05));
    //this.levels.push(new Level(2,0.075));
    //this.levels.push(new Level(3,0.0975));

    this.levels.push(new Level(0,0.025));
    this.levels.push(new Level(1,0.04));
    this.levels.push(new Level(2,0.055));
    this.levels.push(new Level(3,0.07));

}
////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////// BLOCKS MANAGEMENT
Board.prototype.addBlockToColumn = function(column)
{
    var block = this.createBlock();
    this.grid.columns[column].push(block);

    this.nonSynchronizedBlocks.push(block);
    return block;
}
Board.prototype.createBlock = function(letter,type)
{
    console.log('createBlock');

    var letter = letter || this.defineBlockLetter();
    var lType   = type   || this.defineBlockType();

    return new Block(letter,lType);
}
/**
 * Returns the block recently created and not yet synchronized with the client-side.
 * Note that this methods initializes the array of new blocks.
 * 
 * @returns {Array}
 * @private
 */
Board.prototype._getNonSynchronizedBlocks = function()
{
    var blocks = this.nonSynchronizedBlocks;
    console.log(this.nonSynchronizedBlocks.length);
    this.nonSynchronizedBlocks = [];
    console.log(this.nonSynchronizedBlocks.length);

    return blocks;
}
////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////// BLOCK OPTION GENERATOR
/**
 * Returns a type randomly
 *
 * @returns {string}
 */
Board.prototype.defineBlockType = function ()
{
    var blockType = "";
    var float = Math.random() * 100;
    if ( float >= 100 - this.bombPercent)
    {
        blockType = BlockType.BOMB;
    }else if ( float >= 100 - (this.bonusPercent + this.bombPercent))
    {
        blockType = BlockType.BONUS;
    }else if ( float >= 100 - (this.normalPercent + this.bonusPercent + this.bombPercent))
    {
        blockType = BlockType.BASIC;
    }
    return blockType;
}

/**
 * Returns a letter randomly ( depending on the frequency in the language )
 *
 * @returns {string}
 */
Board.prototype.defineBlockLetter = function ()
{
    var blockLetter = "";

    var float = Math.random() * 100;

    var pointer = 0;
    for(var letter in this.letterFrequency)
    {
        var lLetterPercent = this.letterFrequency[letter];

        pointer += lLetterPercent;

        if ( pointer > float)
        {
            blockLetter = letter;
            break;
        }
    }
    return blockLetter;
}
////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////// RECYCLE BLOCKS AFTER REMOVE
/**
 * Renews the selected blocks to remove and create the same quantity with a letter and a type
 * @param blockPositions
 */
Board.prototype.renewBlocks = function(blockPositions)
{
    var self = this;

    //add closest block of bomb blocks
    var lExplodedBlockPositions = [];
    blockPositions.forEach(function(blockPosition)
    {
        var lColumn = blockPosition[0];
        var lRow    = blockPosition[1];

        var block = self.grid.columns[lColumn][lRow];
        console.log(block.getLetter() + " " + block.getType());

        if ( block.getType() == BlockType.BOMB)
        {
            var lClosestBlocks = self.getClosestBlockPositions(lColumn,lRow );
            lExplodedBlockPositions = lExplodedBlockPositions.concat(lClosestBlocks);
        }
    })

    //concat selected blocks positions and the exploded block positions
    blockPositions = blockPositions.concat(lExplodedBlockPositions);

    //make the array with unique values
    blockPositions = this.getUniquePositions(blockPositions);

    //sort by row to remove the top blocks at first
    //console.log(blocks);
    blockPositions.sort(function(a,b)
    {
        if ( a[0] < b[0])
        {
            return -1;
        }else if ( a[0] > b[0]){
            return 1;
        }else{
            return a[1] > b[1] ? -1 : 1;
        }

    });

    //remove the selected blocks and create another one
    for(var iP = 0 ; iP < blockPositions.length ; iP++)
    {
        var lPosition = blockPositions[iP];
        var lColumn = lPosition[0];
        var lRow    = lPosition[1];

        this.grid.columns[lColumn].splice(lRow,1);

        this.addBlockToColumn(lColumn);
    }
}

Board.prototype.getClosestBlockPositions = function(column, row)
{
    var self = this;

    console.log("getClosestBlockPositions");
    console.log("column:"+column);
    console.log("row:"+row);

    var lBlockPositions = [];

    //define the distance of the bomb impact
    var lImpactDistance = 1;

    for(var iC = column-lImpactDistance; iC <= column+lImpactDistance ; iC++)
    {
        for(var iR = row-lImpactDistance; iR <= row+lImpactDistance ; iR++)
        {
            //detect limit of the grid and ignore the block whose position is the same than the parameters
            if ( iC >= 0 && iC < self.numColumns
                && iR >= 0 && iR < self.numRows
                && (iC == column && iR == row) == false )
            {
                lBlockPositions.push([iC, iR]);
            }
        }
    }

    return lBlockPositions;
}
Board.prototype.getUniquePositions = function(positions)
{
    var lPositions = {};
    positions.forEach(function(position)
    {
        lPositions[position.toString()] = true;
    });

    var lUniqueArray = [];
    for(var lKey in lPositions)
    {
        lUniqueArray.push(lKey.split(","));
    }
    return lUniqueArray;
}
////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////
/**
 * Decrements points depending on the current level with the optimized way
 * @return void
 */
Board.prototype.launchCountdown = function()
{
    var self = this;

    var currentLevel = this.levels[this.currentLevel];

    this.countDown = new Countdown(1200);
    this.countDown.setDecrementPoints(currentLevel.getDecrementPoints())
    this.countDown.start();
    this.countDown.once("complete" , function(countdownTime)
    {
        console.log("countdownTime:"+countdownTime);

        self.score = countdownTime;

        //emit gameover
        self.emit("gameOver" , countdownTime);

        //block the board
        self.isGameOver = true;
    })
}
////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////// ANALYZE WORD
/**
 * Analyzes the word by calling the mongodb database and emit the results with points.
 *
 * @param selectedBlocks Array of block positions
 */
Board.prototype.analyzeWord = function(selectedBlocks)
{
    var self = this;

    if( self.isGameOver == false )
    {
        if (this.isInARow(selectedBlocks)) {
            var selectedWord = this.getWordFromSelectedBlocks(selectedBlocks);


            var self = this;
            wordsController.promiseWordByName(selectedWord, this.locale).exec(function(err, word)
            {
                var points = 0;

                if ( true )
                {
                    points = self.getPointsFromSelectedBlocks(selectedBlocks);

                    if ( points > self.bestWordPoints)
                    {
                        self.bestWordPoints = points;
                        self.bestWord = selectedWord;
                    }
                    self.totalPoints += points;
                    self.renewBlocks(selectedBlocks);
                }else{

                }

                //add points to the countdown
                self.countDown.addPoints(points);

                //check if we need to change the level
                self.checkLevelUp();

                //emit to the client side
                self.emit("boardUpdated", {
                    points: points,
                    blocks: self._getNonSynchronizedBlocks(),
                    level: self.currentLevel,
                    speed: self.levels[self.currentLevel].getDecrementPoints(),
                    bestWord: self.bestWord,
                    bestWordPoints: self.bestWordPoints
                });


            });
        }
    }else{
        console.log("Hey the board is blocked. No more words will be accepted !!");
    }
};
Board.prototype.isInARow = function(selectedBlocks)
{
    return true;//@TODO
};

Board.prototype.checkLevelUp = function()
{
    var currentLevel = this.levels[this.currentLevel];
    if ( this.totalPoints > 1200 && this.totalPoints > 1200 + (currentLevel.getIndex()+1) * 2400)
    {
        this.levelUp();
    }

};
Board.prototype.levelUp = function()
{
    if ( this.currentLevel < this.levels.length - 1 )
    {
        console.log("LLLLLEEEEEEEEEVVVVVVVEEEEEEELLLLLLLLL UUUUUUUUPPPPPPPPPPP !!!!!!!!!!!!!");

        this.currentLevel++;

        this.emit("levelUp" , this.levels[this.currentLevel].getDecrementPoints() , this.countDown.getPoints());

        this.countDown.setDecrementPoints(this.levels[this.currentLevel].getDecrementPoints());
    }
}
////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////  GET POINTS/WORD FROM SELECTED BLOCKS
/**
 * Compute points depending on the letters and their frequency in the language
 *
 * @param selectedBlocks
 * @returns {number}
 */
Board.prototype.getPointsFromSelectedBlocks = function(selectedBlocks)
{
    var points = 0;
    for(var iP = 0 ; iP < selectedBlocks.length ; iP++)
    {
        var lPosition = selectedBlocks[iP];
        var lColumn = lPosition[0];
        var lRow    = lPosition[1];

        var block = this.grid.columns[lColumn][lRow];

        points += this.getPointFromBlock(block);
        //console.log("points total:"+points);
    }

    points *= selectedBlocks.length;
    points = Math.round(points);
    return points;
}
/**
 * Returns points depending on the letter and its frequency in the language
 * @param block
 * @returns {number}
 */
Board.prototype.getPointFromBlock = function(block)
{
    console.log()
    var letter = block.getLetter();
    var letterFrequency = this.letterFrequency[letter];

    var points = Math.sqrt(50/letterFrequency) * 4;

    if ( block.getType() === BlockType.BONUS)
    {
        points *= 2;
    }
    return points;
}
/**
 * Returns the word formed by the selected blocks
 * @param selectedBlocks
 * @returns {string}
 */
Board.prototype.getWordFromSelectedBlocks = function(selectedBlocks)
{
    var lWord = "";
    for(var iP = 0 ; iP < selectedBlocks.length ; iP++)
    {
        var lPosition = selectedBlocks[iP];
        var lColumn = lPosition[0];
        var lRow    = lPosition[1];

        var block = this.grid.columns[lColumn][lRow];

        lWord += block.getLetter();
    }

    return lWord;
}
////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////// GETTER
Board.prototype.getScore = function()
{
    return this.score;
}
Board.prototype.getLocale = function()
{
    return this.locale;
}
////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////// UTILS ( LOG )
Board.prototype.visualize = function()
{
    var lNumRows = this.grid.columns[0].length;

    console.log("=============");
    for(var iR = lNumRows-1 ; iR >= 0  ; iR--)
    {
        var lRow = "";
        for(var iC = 0 ; iC < this.grid.columns.length ; iC++)
        {
            var lColumn = this.grid.columns[iC];
            lRow += lColumn[iR].getLetter().toUpperCase() + " ";
        }
        console.log(lRow);

    }
    console.log("=============");
}