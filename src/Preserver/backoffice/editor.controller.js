(() => {

    function preserver($scope, $interval, $rootScope, $element, editorState, notificationsService) {

        const dataKey = `preserver_data_${editorState.current.id}`;


        /**
         *
         */
        const findAncestor = (el, cls) => {
            while ((el = el.parentElement) && !el.classList.contains(cls));
            return el;
        };


        /**
         * map local values back onto model
         */
        const mapToEditorModel = model => {
            for (let m of model) {
                let editorVariant = editorState.current.variants.find(x => x.language.culture === m.variant);
                if (editorVariant) {
                    for (let t of m.tabs) {
                        let editorTab = editorVariant.tabs.find(x => x.alias === t.alias);
                        if (editorTab) {
                            for (let p of t.properties) {
                                let editorProp = editorTab.properties.find(x => x.alias === p.alias);
                                if (editorProp) {
                                    editorProp.value = p.value;
                                }
                            }
                        }
                    }
                }
            }
        }


        /**
         *
         */
        const getBasicModel = current => {

            let variants = current.variants;
            let model = [];

            for (let v of variants) {
                if (v.state != 'NotCreated') {
                    let variant = {
                        variant: v.language.culture,
                        tabs: []
                    };

                    for (let t of v.tabs) {
                        variant.tabs.push({
                            alias: t.alias,
                            properties: t.properties.filter(x => x.editor != 'preserver').map(p => {
                                return {
                                    alias: p.alias, 
                                    value: p.value
                                }
                            })
                        });
                    }

                    model.push(variant);
                }
            }

            return JSON.stringify(model);
        };

 
        /**
         * hide the property editor
         */
        const propElm = findAncestor($element[0], 'umb-property');
        if (propElm) {
            propElm.style.display = 'none';
            if (!propElm.nextElementSibling) {
                propElm.previousElementSibling.querySelector('.control-group').classList.add('p-last-child');
            }
        }

        const fromStore = localStorage.getItem(dataKey);
        if (fromStore) {
            notificationsService.add({
                key: 'preserver_notice',
                view: `${Umbraco.Sys.ServerVariables.umbracoSettings.appPluginsPath}/preserver/backoffice/notification.html`
            });
        }

        
        /** 
         *
         */
        $rootScope.$on('preserver.update', (e, data) => {
            if (data.id === editorState.current.id) {
                mapToEditorModel(JSON.parse(fromStore));
            }
        });


        /**
         * listen for the content saved event, and remove local store data
         */
        $rootScope.$on('content.saved', (e, data) => localStorage.removeItem(dataKey));

        
        /**
         * make sure the interval is killed along with the controller - otherwise continues to fire when changing sections.
         */
        $scope.$on('$destroy', () => {
            if (angular.isDefined(interval)) {
                $interval.cancel(interval);
                interval = undefined;
            }
        });
        

        /**
         * smash it into local storage every 10 seconds, if the node is dirty
         */
        let interval;
        if (editorState.current.variants) {
            interval = $interval(() => {
                if (editorState.current.variants.some(x => x.isDirty)) {
                    localStorage.setItem(dataKey, getBasicModel(editorState.current));
                }
            }, 1e4);
        }
    }

    angular.module('preserver')
        .controller('preserver.editor.controller',
            ['$scope', '$interval', '$rootScope', '$element', 'editorState', 'notificationsService', preserver]);
})();
