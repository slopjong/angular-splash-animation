'use strict';

angular
  .module('sj.splash', [])
  .value('splashAnimationConfig', {
    changeInterval: 3e3
  })
  .factory('utils', function() {
    return {
      nextWordsIndex: function(wordset, currentIndex) {
        var nextIndex = currentIndex + 1;
        if ( nextIndex === wordset.length) {
          nextIndex = 0;
        }
        return nextIndex;
      },
      nextWords: function(wordset, currentIndex) {
        return wordset[this.nextWordsIndex(wordset, currentIndex)];
      },
      previousWordsIndex: function(wordset, currentIndex) {
        var previousIndex = currentIndex - 1;
        if ( previousIndex < 0) {
          previousIndex = wordset.length - 1;
        }
        return previousIndex;
      },
      previousWords: function(wordset, currentIndex) {
        return wordset[this.previousWordsIndex(wordset, currentIndex)];
      },
      serialize: function(obj) {
        var serialized = '{';
        for(var key in obj) {
          serialized += key + ':' + obj[key] + ',';
        }
        serialized = serialized.slice(0, - 1);
        serialized += '}';
        return serialized;
      }
    }
  })
  .controller('SplashAnimationController', [
    'splashAnimationConfig', '$scope', '$timeout', '$compile', 'utils',
    function(splashAnimationConfig, $scope, $timeout, $compile, utils) {

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
      $scope.nextWordsIndex = 1;
      $scope.nextWords = [];

      $scope.wordItems = [];

      $scope.wordDomItems = [];
      $scope.wordDomItemsPlaceholder = [];

      $scope.splashItems = [];

      $scope.animate = function animate() {
        // set the new current words, the word items in the view use
        // data binding and will update automatically
        $scope.currentWordsIndex = utils.nextWordsIndex($scope.words, $scope.currentWordsIndex);
        $scope.currentWords = utils.nextWords($scope.words, $scope.currentWordsIndex);

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

      $scope.createSplashItems = function() {

        angular.forEach($scope.words, function(words, wordset_index) {

          var splashes = [];

          angular.forEach(words, function(word, word_index){

            var containerBoundingClientRect = $('.sa-container')[0].getBoundingClientRect();
            var placeholder = $scope.wordDomItemsPlaceholder[word_index];
            var placeholderBoundingClientRect = placeholder[0].getBoundingClientRect();

            // we must use a timeout of 0s so that we change the width
            // on digest cycles, or in other words, we must wait until
            // angular has updated the view, we'd take the width with the
            // old view's content otherwise.
            // @todo do we need the timeout here? it was needed in a former experiment
            //       with another context but right in this place?
            $timeout(function(){
              placeholder.text(word);
            }, 0);

            var boundingClientRect = {
              left: placeholderBoundingClientRect.left - containerBoundingClientRect.left,
              right: containerBoundingClientRect.right - placeholderBoundingClientRect.right,
              width: placeholderBoundingClientRect.width,
              height: placeholderBoundingClientRect.height
            };

            var template = '<splash wordset="0"' +
              'bounding-client-rect="'+ utils.serialize(boundingClientRect) +'"' +
              '>'+ word +'</splash>';

            // create the splash, add it to the DOM and the splash collection
            var splash = $compile(template)($scope);
            splashes.push(splash);
            $('.sa-container').append(splash);

          });

          $scope.splashItems.push(splashes);
        });
      };

      // create the initial old/new splash items
      $scope.startAnimation = function startAnimation() {
        $scope.createSplashItems();

        // wait before starting the animation, otherwise we will skip
        // more or less the first iteration
        $timeout(function(){
          $scope.animate();
        }, $scope.changeInterval);
      };
    }])
  .directive("splash", [function(){
    return {
      restrict: 'E',
      controller: ['$scope', function($scope){
        $scope.boundingClientRect = {}
      }],
      template: '<div class="sa-splash" ng-style="boundingClientRect" ng-transclude></div>',
      replace: true,
      transclude: true,
      scope: {},
      link: function(scope, element, attrs) {
        if (angular.isDefined(attrs.boundingClientRect)) {
          scope.boundingClientRect = scope.$eval(attrs.boundingClientRect);
        }
      }
    }
  }])
  .directive("word", [function(){
    return {
      restrict: 'E',
      controller: 'SplashAnimationController',
      template: '<div class="sa-word"></div>',
      replace: true,
      link: function(scope, element, attrs) {
        // add the jQlite/jQuery references to the scope, we need them
        // to get the width of the placeholder words and to set the
        // word item widths explicitly in order to use the css transition
        if(element.parent().hasClass('sa-placeholder')) {
          scope.wordDomItemsPlaceholder.push($(element));
        } else {
          scope.wordDomItems.push($(element));
        }
      }
    }
  }])
  .directive("splashAnimation", ['splashAnimationConfig', '$timeout', function(splashAnimationConfig, $timeout) {
    return {
      restrict: 'E',
      template: '<div class="sa-container"><div ng-transclude></div><div class="sa-placeholder" ng-transclude></div></div>',
      replace: true,
      transclude: true,
      controller: 'SplashAnimationController',
      link: function(scope, element, attrs) {
        // parse the words (= string) into a nested javascript array
        if (angular.isDefined(attrs.words)) {
          scope.words = scope.$eval(attrs.words);
          scope.currentWords = scope.words[0];
        }
        if (angular.isDefined(attrs.interval)) {
          scope.changeInterval = scope.$eval(attrs.interval);
        }
        scope.startAnimation();
      }
    };
  }])

  ;
