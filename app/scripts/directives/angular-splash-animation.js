'use strict';

angular
  .module('sj.splash', [])
  .value('splashAnimationConfig', {
    changeInterval: 3e3
  })
  .factory('SplashItem', function($compile) {
    return function(word, scope) {
      var splashItem = {
        dom: null,
        style: {
          left: 0,
          width: 0
        }
      };
      splashItem.dom = $compile('<div class="sa-splash" style="left: 100px;">'+ word +'</div>')(scope);
      return splashItem;
    };
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
      }
    }
  })
  .controller('SplashController', [
    'splashAnimationConfig', '$scope', '$timeout', '$compile', 'utils',
    'SplashItem',
    function(splashAnimationConfig, $scope, $timeout, $compile, utils,
      SplashItem) {


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

      var splash = $compile('<splash></splash>')($scope);
      console.log(splash);

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

      $scope.splashItems = {
        moveIn: [],
        moveOut: []
      };

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
//            $scope.createNew;
          }, 0);
        });

        $timeout($scope.animate, $scope.changeInterval);
      };

      $scope.createSplashItems = function() {
        // we need as double of splashes as the amount of words per
        // word set because we'll need a moving-in and moving-out
        // splash for a placeholder
        angular.forEach($scope.currentWords, function(word, index){
          var splash = SplashItem(word, $scope);
          $scope.splashItems.moveOut.push(splash);
          $('.sa-container').append(splash.dom);
        });

        angular.forEach(utils.nextWords($scope.words, $scope.currentWordsIndex), function(word, index){
          var splash = SplashItem(word, $scope);
          $scope.splashItems.moveIn.push(splash);
          $('.sa-container').append(splash.dom);
        });
      };

      // create the initial old/new splash items
      $scope.startAnimation = function startAnimation() {
        $scope.createSplashItems();

        angular.forEach($scope.wordDomItems, function(word, index) {

//          var element = $.extend(true, placeholderWord, {});
          var element = $compile('<div class="sa-splash">'+ word.text() +'</div>')($scope);
//          $(element).css('left', word[0].getBoundingClientRect().left + 'px');
//          $(element).left(300);

          $('.sa-container').append(element);
//          element.css
//          element[0].css({
//            left: 300 + 'px'
//          });
//          console.log(element[0].style);// css('left', '200px');
        });

//        console.log($scope.wordDomItemsPlaceholder);

        // wait before starting the animation, otherwise we will skip
        // more or less the first iteration
        $timeout(function(){
          $scope.animate();
        }, $scope.changeInterval);
      };
    }])
  .directive("word", [function(){
    return {
      restrict: 'E',
      controller: 'SplashController',
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
  .directive("splash", [function(){
    return {
      restrict: 'E',
      controller: ['$scope', function($scope){
        $scope.left = 0;
        $scope.width = 0;

        console.log('controller');
      }],
      template: '<div class="sa-splash"></div>',
      replace: true,
      scope: {},
      link: function(scope, element, attrs) {
        console.log('link');
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
        scope.startAnimation();
//        scope.animate();
      }
    };
  }])

  ;
