IonicModule.constant('$ionicTabConfig', {
  type: ''
});

/**
 * @ngdoc directive
 * @name ionTab
 * @module ionic
 * @restrict E
 * @parent ionic.directive:ionTabs
 *
 * @description
 * Contains a tab's content.  The content only exists while the given tab is selected.
 *
 * Each ionTab has its own view history.
 *
 * @usage
 * ```html
 * <ion-tab
 *   title="Tab!"
 *   icon="my-icon"
 *   href="#/tab/tab-link"
 *   on-select="onTabSelected()"
 *   on-deselect="onTabDeselected()">
 * </ion-tab>
 * ```
 * For a complete, working tab bar example, see the {@link ionic.directive:ionTabs} documentation.
 *
 * @param {string} title The title of the tab.
 * @param {string=} href The link that this tab will navigate to when tapped.
 * @param {string=} icon The icon of the tab. If given, this will become the default for icon-on and icon-off.
 * @param {string=} icon-on The icon of the tab while it is selected.
 * @param {string=} icon-off The icon of the tab while it is not selected.
 * @param {expression=} badge The badge to put on this tab (usually a number).
 * @param {expression=} badge-style The style of badge to put on this tab (eg tabs-positive).
 * @param {expression=} on-select Called when this tab is selected.
 * @param {expression=} on-deselect Called when this tab is deselected.
 * @param {expression=} ng-click By default, the tab will be selected on click. If ngClick is set, it will not.  You can explicitly switch tabs using {@link ionic.service:$ionicTabsDelegate#select $ionicTabsDelegate.select()}.
 */
IonicModule
.directive('ionTab', [
  '$rootScope',
  '$ionicConfig',
  '$ionicBind',
  '$compile',
  '$state',
  '$ionicViewService',
function($rootScope, $ionicConfig, $ionicBind, $compile, $state, $ionicViewService) {

  //Returns ' key="value"' if value exists
  function attrStr(k,v) {
    return angular.isDefined(v) ? ' ' + k + '="' + v + '"' : '';
  }
  return {
    restrict: 'E',
    require: ['^ionTabs', 'ionTab'],
    controller: '$ionicTab',
    scope: true,
    compile: function(element, attr) {

      //We create the tabNavTemplate in the compile phase so that the
      //attributes we pass down won't be interpolated yet - we want
      //to pass down the 'raw' versions of the attributes
      var tabNavTemplate = '<ion-tab-nav' +
        attrStr('ng-click', attr.ngClick) +
        attrStr('title', attr.title) +
        attrStr('icon', attr.icon) +
        attrStr('icon-on', attr.iconOn) +
        attrStr('icon-off', attr.iconOff) +
        attrStr('badge', attr.badge) +
        attrStr('badge-style', attr.badgeStyle) +
        attrStr('hidden', attr.hidden) +
        attrStr('class', attr['class']) +
        '></ion-tab-nav>';

      //Remove the contents of the element so we can compile them later, if tab is selected
      var tabContent = document.createElement('div');
      tabContent.innerHTML = element.html();
      element.empty();

      var navViewName;
      var tabChildEle = tabContent.children;
      if(tabChildEle.length && tabChildEle[0].tagName === 'ION-NAV-VIEW') {
        navViewName = tabChildEle[0].getAttribute('name');
      }

      return function link($scope, $element, $attr, ctrls) {
        var childScope;
        var childElement;
        var tabsCtrl = ctrls[0];
        var tabCtrl = ctrls[1];
        var isTabContentAttached = false;

        $ionicBind($scope, $attr, {
          onSelect: '&',
          onDeselect: '&',
          title: '@',
          uiSref: '@',
          href: '@'
        });

        tabsCtrl.add($scope);
        $scope.$on('$destroy', function() {
          if(!$scope.$tabsDestroy) {
            // if the containing ionTabs directive is being destroyed
            // then don't bother going through the controllers remove
            // method, since remove will reset the active tab as each tab
            // is being destroyed, causing unnecessary view loads and transitions
            tabsCtrl.remove($scope);
          }
          tabNavElement.isolateScope().$destroy();
          tabNavElement.remove();
        });

        //Remove title attribute so browser-tooltip does not apear
        $element[0].removeAttribute('title');

        if (navViewName) {
          tabCtrl.navViewName = $scope.navViewName = navViewName;
        }
        $scope.$on('$stateChangeSuccess', selectIfMatchesState);
        selectIfMatchesState();
        function selectIfMatchesState() {
          if (tabCtrl.tabMatchesState()) {
            tabsCtrl.select($scope, false);
          }
        }

        var tabNavElement = jqLite(tabNavTemplate);
        tabNavElement.data('$ionTabsController', tabsCtrl);
        tabNavElement.data('$ionTabController', tabCtrl);
        tabsCtrl.$tabsElement.append($compile(tabNavElement)($scope));


        function tabSelected(isSelected) {
          if (isSelected) {
            // this tab is being selected

            // check if the tab is already in the DOM
            if(!isTabContentAttached) {
              // tab should be selected and is NOT in the DOM
              // create a new scope and append it
              childScope = $scope.$new();
              childElement = jqLite('<div class="tab-content pane view-cache">');
              childElement.html(tabContent.innerHTML);
              tabsCtrl.$element.append( childElement );
              $compile(childElement)(childScope);
              isTabContentAttached = true;

            }

            // remove the hide class so the tabs content shows up
            childElement.removeClass('view-cache');

          } else if(isTabContentAttached && childElement) {
            // this tab should NOT be selected, and it is already in the DOM

            if( $ionicConfig.maxCachedViews > 0 ) {
              // keep the tabs in the DOM, only css hide it
              childElement.addClass('view-cache');

            } else {
              // do not keep tabs in the DOM
              childScope && childScope.$destroy();
              childScope = null;
              childElement && childElement.remove();
              childElement = null;
              isTabContentAttached = false;
            }

          }
        }

        $scope.$watch('$tabSelected', tabSelected);

        $scope.$on('$ionicView.navViewActive', function() {
          childElement && childElement.removeClass('view-cache');
        });

      };
    }
  };
}]);
