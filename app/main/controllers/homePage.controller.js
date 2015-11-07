'use strict';

(function (angular)
{

    ///////////////////////////////////////////////////////////////////////////
    ///////////////////////////////////////////////////////////  CONSTRUCTOR
    function HomePageController(Scores)
    {
        this.Scores = Scores;

        this.scores = [];

        this._init();
    }
    ///////////////////////////////////////////////////////////////////////////
    ///////////////////////////////////////////////////////////   INIT
    HomePageController.prototype._init = function()
    {
        this._dislayRanking();
    }

    HomePageController.prototype._dislayRanking = function()
    {
        var self = this;
        var scores = this.Scores.getScore().query({locale:'fr_FR' , from: 0} , function() {

            self.scores = scores;

        });
    }

    ///////////////////////////////////////////////////////////////////////////
    /////////////////////////////////////////////////////////// ANGULAR REGISTERING
    HomePageController.$inject = ['Scores'];
    angular.module('main').controller('HomePageController', HomePageController);

})(angular);
