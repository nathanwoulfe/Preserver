import { EditorController } from './editor.controller';

const controllersModule = angular.module('preserver.controllers', [])
    .controller(EditorController.name, EditorController)
    .name;

const name = 'presever';

angular.module(name, [
    controllersModule
]);

angular.module('umbraco').requires.push(name);   
