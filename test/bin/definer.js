#!/usr/bin/env node

var test = require( 'tape' )
  , define = require( '../../bin/definer' )
  , Expector = require( 'expector' ).Expector;

test( 'data prep', function(t) {
  
  var controller = new Expector(t)
  controller.expect( "data/content.json" );

  define( './test-data.json', function(path, cb) {
    cb( { 
      "sources": [
        "src/main-data.cpp"
      ],
      "data": [ 
        "data/content.json" 
      ]
    } );
  } )
  .then( function(gyp) {
    controller.emit( gyp.data ).check(); 
  })
  .catch( function(err) {
    throw err;
  });
});

test( 'define recursion', function(t) {
  
  var controller = new Expector(t)
    , expected = [
      '../lib/sublib/src/subsrc.h', 
      '../lib/sublib/src/subsrc.cpp', 
      '../lib/sublib2/src/subsrc.cpp'
    ];

  define( './test-import.json', mapFile )
  .then( function(gyp) {
    t.assert( gyp.hasOwnProperty( 'sources' ) );
    t.deepEqual( gyp.sources, expected ); 
    t.end();
  } );

  function mapFile(path, cb) {

    var result = {
      "./test-import.json": 
        { import: [ 'lib/sublib/def.json' ] },
      "lib/sublib/def.json": 
        { import: [ 'lib/sublib2/def.json' ],
          sources: [ 'src/subsrc.h', 'src/subsrc.cpp' ] },
      "lib/sublib2/def.json": 
        { sources: [ 'src/subsrc.cpp' ] }
      };

    cb( result[path] ); 
  }
});

test( 'test definer', function(t) {
  
  var controller = new Expector(t);

  controller.expect( '["../src/main.cpp"]' );
  define( './test.json', function(path, cb) {
    cb( { "sources":  [ "src/main.cpp" ] } );
  } )
  .then( function(product) {
    t.assert( product.hasOwnProperty('sources') );
    
    console.log( JSON.stringify(product.sources) ); 
    controller.emit( JSON.stringify(product.sources) ).check();
  });
});