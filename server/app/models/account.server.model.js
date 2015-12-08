'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

/**
 * Device Schema
 * @type {mongoose.Schema}
 */
var DeviceSchema = new Schema({
    uuid: { type: String, default: '', require: true},
    model: { type: String, default: '', require: true},
    platform: { type: String, default: '', require: true},
    version: { type: String, default: '', require: true}
});
mongoose.model('Device', DeviceSchema);

/**
 * Score Schema
 * @type {mongoose.Schema}
 */
var ScoreSchema = new Schema({
    highestTime:        { type: Number, default: 0},
    highestWord:        { type: String, default: ''},
    highestWordPoints:  { type: Number, default: 0},
    totalNumLetters:    { type: Number, default: 0},
    totalNumWords:      { type: Number, default: 0},
    totalNumGames:      { type: Number, default: 0},
    totalTime:          { type: Number, default: 0},
    totalPoints:        { type: Number, default: 0},
});
mongoose.model('Score', ScoreSchema);
/**
 * Account Schema
 * @type {mongoose.Schema}
 */
var AccountSchema = new Schema({
    uuid: String,
    name: String,
    email: String,
    selectedLocale: String,
    level: { type: Number, default: 1},
    totalPoints: { type: Number, default: 0},
    devices: [DeviceSchema],
    scores: {
        en_GB: ScoreSchema,
        fr_FR: ScoreSchema,
    },
    achievements: { type: Number, default: 0}, //@TODO
    weapons: {
        numBombs: { type: Number, default: 10},
        numNitros: { type: Number, default: 5},
        numFreezes: { type: Number, default: 3},
        numBonusMultipliers: { type: Number, default: 2},
        numRecycles: { type: Number, default: 0},
    },
    balance: { type: Number, default: 0},
    activationCode: String,
    active : { type: Boolean, default: false},

    token: String,
    premium: Boolean,
    numGamesRemainingPerDay: { type: Number, default: 5},
});



AccountSchema.statics.findByUUID = function(uuid, callback)
{
    return this.findOne({uuid:uuid} , callback);
}
mongoose.model('Account', AccountSchema);

