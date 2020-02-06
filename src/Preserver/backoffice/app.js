(() => {

    angular.module('preserver', []);
    angular.module('umbraco').requires.push('preserver');   
    
})();
 