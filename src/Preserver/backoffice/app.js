import { EditorController } from './editor.controller';
import { NotificationController } from './notification.controller';

const controllersModule = angular.module('preserver.controllers', [])
    .controller(EditorController.name, EditorController)
    .controller(NotificationController.name, NotificationController)
    .name;

const name = 'presever';

angular.module(name, [
    controllersModule
]);

angular.module('umbraco').requires.push(name);   
