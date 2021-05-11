export class EditorController {

    static name = 'Preserver.Editor.Controller';

    constructor($scope, $interval, $timeout, $window, $element, editorState, localizationService, overlayService, contentResource, fileManager) {
        this.$interval = $interval;
        this.$timeout = $timeout;
        this.$element = $element;
        this.$window = $window;
        this.$scope = $scope;
        this.fileManager = fileManager;

        this.currentEditor = editorState.current;
        this.overlayService = overlayService;
        this.contentResource = contentResource;
        this.localizationService = localizationService;

        this.interval = null;

        this.dataKey = `preserver_data_${editorState.current.id}`;
        this.nameKey = 'preserver';
        this.notCreatedKey = 'NotCreated';

        this.blockListEditorAlias = 'Umbraco.BlockList';
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
            const dialog = {
                view: `${Umbraco.Sys.ServerVariables.umbracoSettings.appPluginsPath}/preserver/backoffice/notification.html`,
                submitButtonLabelKey: "general_import",
                nodeId: this.currentEditor.id,
                submit: result => {
                    this.onOverlaySubmit(result.nodeId);
                    this.overlayService.close();
                },
                close: () => {
                    this.overlayService.close();
                }
            };

            this.localizationService.localize("preserver_foundContentHeading").then(value => {
                dialog.title = value;
                this.overlayService.open(dialog);
            });
        }

        /**
         * smash it into local storage every 10 seconds, if the node is dirty
         */
        if (this.currentEditor.variants) {
            this.interval = this.$interval(() => {
                console.log(this.currentEditor.variants);
                if (this.currentEditor.variants.some(x => x.isDirty)) {
                    localStorage.setItem(this.dataKey, this.getBasicModel());
                }
            }, 1e4);
        }
    }


    /**
     * 
     */
    $onDestroy = () => {
        if (this.interval !== null) {
            this.$interval.cancel(this.interval);
            this.interval = undefined;
        }
    }


    /**
     * 
     * @param {*} id 
     */
    onOverlaySubmit = id => {
        if (id === this.currentEditor.id) {
            this.mapToEditorModel();

            // dear god, forgive me this hideousity
            for (let openNc of document.querySelectorAll('.umb-nested-content__item--active .umb-nested-content__header-bar')) {
                this.$timeout(() => openNc.click());
            }

            const scope = this.getPageScope();
            scope.page.buttonGroupState = 'busy';

            this.contentResource.save(this.currentEditor, false, this.fileManager.getFiles(), false)
                .then(() => {
                    scope.page.buttonGroupState = 'init';
                    localStorage.removeItem(this.dataKey);
                    this.$window.location.reload(true);
                });
        }
    }


    /**
     *
     */
    findAncestor = (el, cls) => {
        while ((el = el.parentElement) && el.localName !== cls);
        return el;
    };


    /**
     * 
     */
    getPageScope = () => {
        let el = this.$scope;

        while ((el = el.$parent) && !el.hasOwnProperty('page'));
        return el;
    }
    
    /**
     * map local values back onto model
     */
    mapToEditorModel = (noUpdate = false) => {
        const model = JSON.parse(this.fromStore);

        for (let m of model) {
            let editorVariant = this.getVariantByCulture(m.variant);
            if (!editorVariant)
                continue;

            for (let t of m.tabs) {
                this.updateVariant(t, editorVariant, noUpdate);
            }
        }
    }


    /**
     * 
     * @param {*} tab 
     * @param {*} variant 
     */
    updateVariant(tab, variant) {
        const editorTab = variant.tabs.find(x => x.alias === tab.alias);

        if (!editorTab)
            return;

        variant.save = true;

        for (let p of tab.properties) {
            const alias = p.alias;
            const value = p.value;

            const editorProp = editorTab.properties.find(x => x.alias === alias);

            if (!editorProp)
                continue;

            // if it's a block, only assign content and layout
            if (p.editor === this.blockListEditorAlias) {
                editorProp.value.contentData = value.contentData;
                editorProp.value.settingsData = value.settingsData;
                editorProp.value.layout[this.blockListEditorAlias] = value.contentData.map(c => ({
                    contentUdi: c.udi
                }));

                //editorProp.onValueChanged(editorProp.value);
            } else {
                editorProp.value = value;
            }            
        }
    }


    getVariantByCulture = culture =>
        this.currentEditor.variants.find(x => !x.language || x.language.culture === culture);


    /**
     *
     */
    getBasicModel = () => {

        const variants = this.currentEditor.variants;
        let model = [];

        for (let v of variants) {
            if (v.state === this.notCreatedKey || !v.isDirty)
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
        const editor = property.editor;
        const label = property.label;

        // must discard the layout data for blocklist
        if (editor === this.blockListEditorAlias) {
            return {
                alias,
                editor,
                label,
                value: {
                    contentData: value.contentData,
                    settingsData: value.settingsData,
                }
            }
        }

        return {
            alias,
            editor,
            label,
            value,
        }
    }
}