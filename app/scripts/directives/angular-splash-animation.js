'use strict';

angular
  .module('sj.splash', [])
  .value('splashAnimationConfig', {
    currentSplashIndex: 0,
    changeInterval: 3e3
  })
  .directive("splashAnimation", ['splashAnimationConfig', '$timeout', function(splashAnimationConfig, $timeout) {

    return {
      restrict: 'E',
      template: '<div class="sa-container"><div ng-transclude></div><div class="sa-hidden" ng-transclude></div></div>',
      replace: true,
      transclude: true,
      link: function(scope, element, attrs) {

        // parse the words (= string) into a nested javascript array
        if (angular.isDefined(attrs.words)) {
          scope.words = scope.$eval(attrs.words);
        }

        if (angular.isDefined(attrs.interval)) {
          scope.changeInterval = scope.$eval(attrs.interval);
        } else {
          scope.changeInterval = splashAnimationConfig.changeInterval;
        }

        // make the slogan parts invisible and put the absolute
        // positioned elements there
        scope.sloganParts = element.find('.sa-word');
        angular.forEach(scope.sloganParts, function(part) {
          //angular.element(part).addClass('sa-hidden');
          // create new dom elements here by using a service which
          // compiles a template
        });
      }
    };
  }])

  ;
