// XXX BBP clean all this up
Package.describe({
  name: 'meteor-less',
  version: '0.0.1',
  // Brief, one-line summary of the package.
  summary: '',
  // URL to the Git repository containing the source code for this package.
  git: '',
  // By default, Meteor will default to using README.md for documentation.
  // To avoid submitting documentation, set this field to null.
  documentation: 'README.md'
});

Package.registerBuildPlugin({
  name: "compileLessBatch",
  use: ['underscore'],
  sources: [
    'plugin/compile-less.js'
  ],
  npmDependencies: {
    // XXX BBP should we fork and delete some files?
    "less": "2.5.0"
  }
});

Package.onUse(function(api) {
//  api.versionsFrom('1.1.0.2');
  api.addFiles('meteor-less.js');
});

Package.onTest(function(api) {
  api.use('tinytest');
  api.use('meteor-less');
  api.addFiles('meteor-less-tests.js');
});
