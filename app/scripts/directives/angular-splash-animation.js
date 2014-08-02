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
      forward: function() {
        this.currentIndex = this.nextIndex();
      },
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
  .factory('splashes', [
    '$rootScope', '$compile', 'utils', 'wordset',
    function($rootScope, $compile, utils, wordset) {
      return {
        collection: [],
        create: function(wordsetIndex, word, boundingClientRect) {
          var template = '<splash ' +
            'bounding-client-rect="'+ utils.serialize(boundingClientRect) +'"' +
            '>'+ word +'</splash>';
          var splash = $compile(template)($rootScope.$new());

          if (! angular.isArray(this.collection[wordsetIndex])) {
            this.collection[wordsetIndex] = [];
          }

          this.collection[wordsetIndex].push(splash);
          return splash;
        },
        animate: function() {
          angular.forEach(this.collection[wordset.currentIndex], function(splash) {
            splash.removeClass('sa-moveout');
            splash.addClass('sa-movein');
          });
          angular.forEach(this.collection[wordset.previousIndex()], function(splash) {
            splash.removeClass('sa-init');
            splash.removeClass('sa-movein');
            splash.addClass('sa-moveout');
          });
          angular.forEach(this.collection[wordset.nextIndex()], function(splash) {
            splash.removeClass('sa-moveout');
          });
        },
        init: function(wordsetIndex) {
          angular.forEach(this.collection[wordsetIndex], function(splash) {
            splash.addClass('sa-init');
          });
        }
      }
    }
  ])
  .controller('SplashAnimationController', [
    'splashAnimationConfig', '$scope', '$timeout', '$compile', 'utils', 'wordset', 'splashes',
    function(splashAnimationConfig, $scope, $timeout, $compile, utils, wordset, splashes) {

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

      $scope.animate = function animate() {

        wordset.forward();
        splashes.animate();

        angular.forEach($scope.wordDomItemsPlaceholder, function(placeholderWord, index) {
          placeholderWord.text(wordset.words[wordset.currentIndex][index]);
          $scope.wordDomItems[index].width(placeholderWord.width());
        });

        $timeout($scope.animate, splashAnimationConfig.changeInterval);
      };

      $scope.createSplashItems = function() {
        angular.forEach(wordset.words, function(words, wordset_index) {

          // replace all the placeholder words
          angular.forEach(words, function(word, word_index){
            $scope.wordDomItemsPlaceholder[word_index].text(word);
          });

          // now calculate all the placeholder positions and create the
          // splashes accordingly
          angular.forEach(words, function(word, word_index){
            var containerBoundingClientRect = $('.sa-container')[0].getBoundingClientRect();
            var placeholder = $scope.wordDomItemsPlaceholder[word_index];
            var placeholderBoundingClientRect = placeholder[0].getBoundingClientRect();

            var boundingClientRect = {
              left: placeholder.position().left,
              right: placeholder.position().right,
              width: placeholderBoundingClientRect.width,
              height: placeholderBoundingClientRect.height
            };

            // create the splash and append it to the splash animation container
            var splash = splashes.create(wordset_index, word, boundingClientRect);
            $('.sa-container').append(splash);
          });
        });

        // reset the initial placeholder values
        angular.forEach(wordset.words[0], function(word, word_index){
          $scope.wordDomItemsPlaceholder[word_index].text(word);
        });

        // position the first splashes
        splashes.init(0);
      };

      $scope.initWordWidth = function() {
        angular.forEach($scope.wordDomItemsPlaceholder, function(placeholderWord, index) {
          $scope.wordDomItems[index].width(placeholderWord.width());
        });
      };

      // create the initial old/new splash items
      $scope.startAnimation = function startAnimation() {
        $scope.createSplashItems();
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
      controller: ['$scope', function($scope) {
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
