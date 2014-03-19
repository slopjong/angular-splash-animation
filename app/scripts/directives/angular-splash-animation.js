'use strict';

angular
  .module('sj.splash', [])
  .value('splashAnimationConfig', {
    changeInterval: 3e3
  })
  .controller('SplashController', ['splashAnimationConfig', '$scope', '$timeout',

    function(splashAnimationConfig, $scope, $timeout) {

      // By defining a controller via module().controller() every directive
      // using this controller as their controller will lead to a new instance
      // but with a shared scope. To avoid the redefinition of controller
      // methods we add a reference to the scope and simply return on upcoming
      // constructor calls. We could also have a dedicated directive defined
      // with a controller being shared with other directives as described
      // here: http://stackoverflow.com/a/15691865
      if (! angular.isDefined($scope.controller)) {
        $scope.controller = this;
      } else {
        return;
      }

      $scope.changeInterval = splashAnimationConfig.changeInterval;

      // this is an array of arrays containing all the word sets
      $scope.words = [];

      // keeps track of the current displayed words
      $scope.currentWordsIndex = 0;
      $scope.currentWords = [];

      $scope.wordDomItems = [];
      $scope.wordDomItemsPlaceholder = [];

      $scope.animate = function animate() {
        $scope.currentWordsIndex++;

        if ($scope.currentWordsIndex === $scope.words.length) {
          $scope.currentWordsIndex = 0;
        }

        // set the new current words, the word items in the view use
        // data binding and will update automatically
        $scope.currentWords = $scope.words[$scope.currentWordsIndex];

        angular.forEach($scope.wordDomItemsPlaceholder, function(placeholderWord, index) {
          // we must use a timeout of 0s so that we change the width
          // on digest cycles, or in other words, we must wait until
          // angular has updated the view, we'd take the width with the
          // old view's content otherwise.
          $timeout(function(){
            $scope.wordDomItems[index].width(placeholderWord.width());
          }, 0);
        });

        $timeout($scope.animate, $scope.changeInterval);
      };

//      $scope.startAnimation = function startAnimation() {
//        // wait before starting the animation, otherwise we will skip
//        // more or less the first iteration
//        $timeout(function(){
//          $scope.animate();
//        }, $scope.changeInterval);
//      };
    }])
  .directive("word", [function(){
    return {
      restrict: 'A',
      controller: 'SplashController',
      link: function(scope, element, attrs) {
        // add the jQlite/jQuery references to the scope, we need them
        // to get the width of the placeholder words and to set the
        // word item widths explicitly in order to use the css transition
        if(element.parent().hasClass('sa-placeholder')) {
          scope.wordDomItemsPlaceholder.push($(element));
        } else {
          scope.wordDomItems.push($(element));
        }
        angular.element(element).addClass('sa-word');
      }
    }
  }])
  .directive("splashAnimation", ['splashAnimationConfig', '$timeout', function(splashAnimationConfig, $timeout) {
    return {
      restrict: 'E',
      template: '<div class="sa-container"><div ng-transclude></div><div class="sa-placeholder" ng-transclude></div></div>',
      replace: true,
      transclude: true,
      controller: 'SplashController',
      link: function(scope, element, attrs) {
        // parse the words (= string) into a nested javascript array
        if (angular.isDefined(attrs.words)) {
          scope.words = scope.$eval(attrs.words);
          scope.currentWords = scope.words[0];
        }
        if (angular.isDefined(attrs.interval)) {
          scope.changeInterval = scope.$eval(attrs.interval);
        }
//        scope.startAnimation();
        scope.animate();
      }
    };
  }])

  ;
