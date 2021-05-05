export class NotificationController {

    static name = 'Preserver.Notification.Controller';

    constructor($rootScope, notificationsService, editorState) {
        this.$rootScope = $rootScope;
        this.notificationsService = notificationsService;
        this.editorState = editorState;
    }

    update = n => {
        this.$rootScope.$emit('preserver.update', { id: this.editorState.current.id });
        this.discard(n);
    };

    discard = n => this.notificationsService.remove(n);
}
