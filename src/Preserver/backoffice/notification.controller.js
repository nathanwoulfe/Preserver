(() => {

    function notificationController($rootScope, notificationsService, editorState) {

        this.update = n => {
            $rootScope.$emit('preserver.update', { id: editorState.current.id });
            this.discard(n);
        };

        this.discard = n => notificationsService.remove(n);
    }

    // register controller 
    angular.module('preserver').controller('preserver.notification.controller', ['$rootScope', 'notificationsService', 'editorState', notificationController]);
})();
  