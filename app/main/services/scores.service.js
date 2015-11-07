'use strict';

(function (angular)
{
    ///////////////////////////////////////////////////////////////////////////
    ///////////////////////////////////////////////////////////  CONSTRUCTOR
    function Scores($resource)
    {
        var methods = {};

        methods.getScore = function()
        {
            return $resource('http://localhost:3000/scores/:locale/:from', {
            }, {
                update: {
                    method: 'GET'
                }
            });
        };

        return methods;
    }
    ///////////////////////////////////////////////////////////////////////////
    ///////////////////////////////////////////////////////////   INIT MAP
    ///////////////////////////////////////////////////////////////////////////
    /////////////////////////////////////////////////////////// ANGULAR REGISTERING
    Scores.$inject = ['$resource'];
    angular.module('main').factory('Scores', Scores);

})(angular);
