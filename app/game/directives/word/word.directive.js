'use strict';

angular.module('game').directive('wildWord', [
    function () {
        return {
            templateUrl: 'game/directives/word/word.html',
            restrict: 'E',
            replace: false,
            scope: {},
            bindToController: {
            },
            controller: 'WordController',
            controllerAs: 'vm'
        };
    }
]);
