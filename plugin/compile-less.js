var less = Npm.require('less');
var util = Npm.require('util');
var Future = Npm.require('fibers/future');

Plugin.registerCompiler({
  extensions: ['less'],
  archMatching: 'web'
}, function () {
    return new LessCompiler;
});

var LessCompiler = function () {
};
LessCompiler.prototype.processFilesForTarget = function (inputFiles) {
  var filesByAbsoluteImportPath = {};
  var mains = [];
  // XXX BBP also implement package-relative imports
  inputFiles.forEach(function (inputFile) {
    var packageName = inputFile.xxxPackageName();
    var pathInPackage = inputFile.xxxPathInPackage();
    // XXX BBP think about windows slashes
    var absoluteImportPath = packageName === null
          ? ('{}/' + pathInPackage)
          : ('{' + packageName + '}/' + pathInPackage);
    filesByAbsoluteImportPath[absoluteImportPath] = inputFile;
    if (pathInPackage.match(/\.main\.less$/)) {
      mains.push({inputFile: inputFile,
                  absoluteImportPath: absoluteImportPath});
    }
  });

  var importPlugin = new MeteorImportLessPlugin(filesByAbsoluteImportPath);

  _.each(mains, function (main) {
    var inputFile = main.inputFile;
    var absoluteImportPath = main.absoluteImportPath;
    // XXX BBP less errors get turned into [object Object] by future.throw
    var f = new Future;
    less.render(inputFile.xxxContentsAsBuffer().toString('utf8'), {
      filename: absoluteImportPath,
      plugins: [importPlugin]
    }, f.resolver());
    var output = f.wait();
    // XXX BBP figure out source map
    // XXX BBP note that output.imports has a list of imports, which can
    //     be used for caching
    inputFile.addStylesheet({
      data: output.css,
      path: inputFile.xxxPathInPackage() + '.css'
    });
  });
};

var MeteorImportLessPlugin = function (filesByAbsoluteImportPath) {
  var self = this;
  self.filesByAbsoluteImportPath = filesByAbsoluteImportPath;
};
_.extend(MeteorImportLessPlugin.prototype, {
  install: function (less, pluginManager) {
    var self = this;
    pluginManager.addFileManager(
      new MeteorImportLessFileManager(self.filesByAbsoluteImportPath));
  },
  minVersion: [2, 5, 0]
});

var MeteorImportLessFileManager = function (filesByAbsoluteImportPath) {
  var self = this;
  self.filesByAbsoluteImportPath = filesByAbsoluteImportPath;
};
util.inherits(MeteorImportLessFileManager, less.AbstractFileManager);
_.extend(MeteorImportLessFileManager.prototype, {
  // We want to be the only active FileManager, so claim to support everything.
  supports: function () {
    return true;
  },

  loadFile: function (filename, currentDirectory, options, environment, cb) {
    var self = this;
    if (filename[0] !== '{') {
      // XXX BBP handle relative imports
      // XXX BBP better error handling!
      throw Error("all imports need to specify full package");
    }
    if (! _.has(self.filesByAbsoluteImportPath, filename)) {
      // XXX BBP better error handling?
      cb({type: "File", message: "Unknown import: " + filename});
      return;
    }
    cb(null, {
      contents: self.filesByAbsoluteImportPath[filename]
        .xxxContentsAsBuffer().toString('utf8'),
      filename: filename
    });
    return;
  }
});
