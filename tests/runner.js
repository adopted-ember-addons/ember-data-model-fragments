(function(){
  var moduleNames = Object.keys(requirejs.entries);

  moduleNames.forEach(function(moduleName) {
    if (moduleName.match(/[_-]test$/)) {
      require(moduleName);
    }
  });
})();