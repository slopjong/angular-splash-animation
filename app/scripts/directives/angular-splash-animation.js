'use strict';

angular
  .module('sj.splash', [])
  .directive("splashAnimation", function() {
    return {
      restrict: 'E',
      template: '<div>test</div>',
      replace: true,
      link: function(scope, element, attrs) {
      }
    };
  })

  ;
