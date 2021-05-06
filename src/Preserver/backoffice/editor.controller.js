export class EditorController {

    static name = 'Preserver.Editor.Controller';

    constructor($scope, $interval, $rootScope, $element, editorState, notificationsService) {
        this.$scope = $scope;
        this.$interval = $interval;
        this.$rootScope = $rootScope;
        this.$element = $element;
        this.currentEditor = editorState.current;
        this.notificationsService = notificationsService;

        this.interval = null;

        this.dataKey = `preserver_data_${editorState.current.id}`;
        this.nameKey = 'preserver';
        this.notCreatedKey = 'NotCreated';

        this.bindEvents();
    }

    $onInit() {
        /**
         * hide the property editor
         */
        const propElm = this.findAncestor(this.$element[0], 'umb-property');
        if (propElm) {
            propElm.style.display = 'none';
            if (!propElm.nextElementSibling) {
                propElm.previousElementSibling.querySelector('.control-group').classList.add('prsrvr-last-child');
            }
        }

        this.fromStore = localStorage.getItem(this.dataKey);        
        if (this.fromStore) {
            this.notificationsService.add({
                key: 'preserver_notice',
                view: `${Umbraco.Sys.ServerVariables.umbracoSettings.appPluginsPath}/preserver/backoffice/notification.html`
            });
        }

        /**
         * smash it into local storage every 10 seconds, if the node is dirty
         */
        if (this.currentEditor.variants) {
            this.interval = this.$interval(() => {
                const current = this.currentEditor;
                if (current.variants.some(x => x.isDirty)) {
                    localStorage.setItem(this.dataKey, this.getBasicModel(current));
                }
            }, 1e4);
        }
    }

    bindEvents = () => {
        const preserverUpdateKey = 'preserver.update';
        const contentSavedKey = 'content.saved';
        const destroyKey = '$destroy';

        /** 
         *
         */
        const preserverUpdate = this.$rootScope.$on(preserverUpdateKey, (_, data) => {
            if (data.id === this.currentEditor.id) {
                this.mapToEditorModel(JSON.parse(this.fromStore));
            }
        });


        /**
         * listen for the content saved event, and remove local store data
         */
        const contentSaved = this.$rootScope.$on(contentSavedKey, () => localStorage.removeItem(this.dataKey));


        /**
         * make sure the interval is killed along with the controller - otherwise continues to fire when changing sections.
         */
        this.$scope.$on(destroyKey, () => {
            if (this.interval !== null) {
                this.$interval.cancel(interval);
                this.interval = undefined;
            }

            preserverUpdate();
            contentSaved();
        });
    }


    /**
     *
     */
    findAncestor = (el, cls) => {
        while ((el = el.parentElement) && el.localName !== cls);
        return el;
    };


    /**
     * map local values back onto model
     */
    mapToEditorModel = model => {
        for (let m of model) {
            let editorVariant = this.currentEditor.variants.find(x => !x.language || x.language.culture === m.variant);
            if (!editorVariant)
                continue;

            for (let t of m.tabs) {
                this.updateVariant(t, editorVariant);
            }
        }
    }


    /**
     * 
     * @param {*} tab 
     * @param {*} variant 
     */
    updateVariant(tab, variant) {
        let editorTab = variant.tabs.find(x => x.alias === tab.alias);
        if (!editorTab)
            return;

        for (let p of tab.properties) {
            let editorProp = editorTab.properties.find(x => x.alias === p.alias);
            if (!editorProp)
                continue;

            const value = p.value;

            // if it's a block, only assign content and layout
            if (value && value.contentData) {
                editorProp.value.contentData = value.contentData;
                editorProp.value.settingsData = value.settingsData;
                editorProp.value.layout[value.layout] = value.contentData.map(c => ({
                  contentUdi: c.udi  
                }));

                editorProp.onValueChanged(editorProp.value);
            } else {
                editorProp.value = value;
            }
        }
    }


    /**
     *
     */
    getBasicModel = current => {

        const variants = current.variants;
        let model = [];

        for (let v of variants) {
            if (v.state === this.notCreatedKey)
                continue;

            const variant = {
                variant: v.language?.culture || 'invariant',
                tabs: []
            };

            for (let t of v.tabs) {
                variant.tabs.push({
                    alias: t.alias,
                    properties: t.properties
                        .filter(x => x.editor !== this.nameKey)
                        .map(p => this.getPropertyValue(p))
                });
            }

            model.push(variant);
        }

        return JSON.stringify(model);
    };

    /**
     * 
     * @param {*} property 
     * @returns 
     */
    getPropertyValue = property => {
        const alias = property.alias;
        const value = property.value;

        // must discard the layout data for blocklist
        if (value &&
            value.hasOwnProperty('settingsData') &&
            value.hasOwnProperty('contentData') &&
            value.hasOwnProperty('layout')) {
            return {
                alias,
                value: {
                    contentData: value.contentData,
                    settingsData: value.settingsData,
                    layout: property.editor,
                }
            }
        }

        return {
            alias,
            value
        }
    }
}