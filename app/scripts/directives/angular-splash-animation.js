'use strict';

angular
  .module('sj.splash', [])
  .value('splashAnimationConfig', {
    changeInterval: 4e3
  })
  .factory('wordset', function() {
    return {
      // this is an array of arrays containing all the word sets
      words: [],
      currentIndex: 0,
      nextIndex: function() {
        var nextIndex = this.currentIndex + 1;
        if ( nextIndex === this.words.length) {
          nextIndex = 0;
        }
        return nextIndex;
      },
      nextWords: function() {
        return this.words[this.nextIndex()];
      },
      previousIndex: function() {
        var previousIndex = this.currentIndex - 1;
        if ( previousIndex < 0) {
          previousIndex = this.words.length - 1;
        }
        return previousIndex;
      },
      previousWords: function() {
        return this.words[this.previousIndex()];
      }
    }
  })
  .factory('utils', function() {
    return {
      serialize: function(obj) {
        // serialized won't be a JSON!
        var serialized = '{';
        for(var key in obj) {
          serialized += key + ':' + obj[key] + ',';
        }
        // remove the trailing comma
        serialized = serialized.slice(0, - 1);
        serialized += '}';
        return serialized;
      }
    }
  })
  .controller('SplashAnimationController', [
    'splashAnimationConfig', '$scope', '$timeout', '$compile', 'utils', 'wordset',
    function(splashAnimationConfig, $scope, $timeout, $compile, utils, wordset) {

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

      $scope.wordItems = [];
      $scope.wordDomItems = [];
      $scope.wordDomItemsPlaceholder = [];
      $scope.splashItems = [];

      $scope.animate = function animate() {
        // set the new current words, the word items in the view use
        // data binding and will update automatically
        wordset.currentIndex = wordset.nextIndex();

        angular.forEach($scope.wordDomItemsPlaceholder, function(placeholderWord, index) {
          placeholderWord.text(wordset.words[wordset.currentIndex][index]);
          $scope.wordDomItems[index].width(placeholderWord.width());

          $scope.splashItems[wordset.currentIndex][index].removeClass('sa-moveout');
          $scope.splashItems[wordset.currentIndex][index].addClass('sa-movein');
          $scope.splashItems[wordset.previousIndex()][index].removeClass('sa-init');
          $scope.splashItems[wordset.previousIndex()][index].removeClass('sa-movein');
          $scope.splashItems[wordset.previousIndex()][index].addClass('sa-moveout');
          $scope.splashItems[wordset.nextIndex()][index].removeClass('sa-moveout');
        });
        $timeout($scope.animate, splashAnimationConfig.changeInterval);
      };

      $scope.createSplashItems = function() {

        angular.forEach(wordset.words, function(words, wordset_index) {

          var splashes = [];

          angular.forEach(words, function(word, word_index){

            var containerBoundingClientRect = $('.sa-container')[0].getBoundingClientRect();
            var placeholder = $scope.wordDomItemsPlaceholder[word_index];
            var placeholderBoundingClientRect = placeholder[0].getBoundingClientRect();

            placeholder.text(word);

            var boundingClientRect = {
              left: placeholderBoundingClientRect.left - containerBoundingClientRect.left,
              right: containerBoundingClientRect.right - placeholderBoundingClientRect.right,
              width: placeholderBoundingClientRect.width,
              height: placeholderBoundingClientRect.height
            };

            var template = '<splash ' +
              'bounding-client-rect="'+ utils.serialize(boundingClientRect) +'"' +
              '>'+ word +'</splash>';

            // create the splash, add it to the DOM and the splash collection
            var splash = $compile(template)($scope);
            splashes.push(splash);

            $('.sa-container').append(splash);
          });

          $scope.splashItems.push(splashes);
        });

        // reset the initial placeholder values
        angular.forEach($scope.currentWords, function(word, word_index){
          $scope.wordDomItemsPlaceholder[word_index].text(word);
        });
      };

      $scope.initSplashItems = function() {
        angular.forEach($scope.splashItems[0], function(splash) {
          splash.addClass('sa-init');
        });
      };

      $scope.initWordWidth = function() {
        angular.forEach($scope.wordDomItemsPlaceholder, function(placeholderWord, index) {
          $scope.wordDomItems[index].width(placeholderWord.width());
        });
      };

      // create the initial old/new splash items
      $scope.startAnimation = function startAnimation() {
        $scope.createSplashItems();
        $scope.initSplashItems();
        $scope.initWordWidth();

        // wait before starting the animation, otherwise we will skip
        // more or less the first iteration
        $timeout(function(){
          $scope.animate();
        }, splashAnimationConfig.changeInterval);
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
          if (angular.isDefined(attrs.order)) {
            var order = parseInt(attrs.order);
            scope.wordDomItemsPlaceholder[order] = $(element);
          } else {
            // @todo output a warning
          }
        } else {
          if (angular.isDefined(attrs.order)) {
            var order = parseInt(attrs.order);
            scope.wordDomItems[order] = $(element);
          } else {
            // @todo output a warning
          }
        }
      }
    }
  }])
  .directive("splashAnimation", [
    'splashAnimationConfig', '$timeout', 'wordset',
    function(splashAnimationConfig, $timeout, wordset) {
      return {
        restrict: 'E',
        template:
          '<div class="sa-container">' +
          '  <div class="sa-slogan" ng-transclude></div>' +
          '  <div class="sa-placeholder" ng-transclude></div>' +
          '</div>',
        replace: true,
        transclude: true,
        controller: 'SplashAnimationController',
        link: function(scope, element, attrs) {
          if (angular.isDefined(attrs.words)) {
            wordset.words = scope.$eval(attrs.words);
          }
          if (angular.isDefined(attrs.interval)) {
            splashAnimationConfig.changeInterval = scope.$eval(attrs.interval);
          }
          scope.startAnimation();
        }
      };
    }
  ])

  ;
