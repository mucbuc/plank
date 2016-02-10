var assert = require( 'assert' )
  , define = require( '../bin/definer' )
  , generate = require( '../bin/generator' )
  , path = require( 'path' )
  , Printer = require( './printer' )
  , run = require( '../bin/runner' )
  , translate = require( '../bin/translator' )
  , Promise = require( 'promise' )
  , traverse = require( 'traverjs' )
  , successCounter = 0
  , fs = require( 'fs.extra' );

assert( typeof translate !== 'undefined' ); 

function buildProject( context, cb ) {

  var absPath;

  assert( context.hasOwnProperty('pathJSON') );

  absPath = path.join( context.testDir, context.pathJSON );
  Printer.begin( 'unit', absPath ); 
  Printer.begin( 'define', absPath );

  define( context.pathJSON, context.testDir )
  .then( function(product) {
    
    var dirGYP = path.join(context.testDir, context.tempDir)
      , resultPath = path.join( dirGYP, 'result.json' );

    Printer.finishGreen( 'define' ); 

    if (product.hasOwnProperty('opengl')) {
      context.opengl = true;
    }
    
    Printer.begin( 'copy files', dirGYP );

    copyFiles( dirGYP )
    .then( function() {
      
      Printer.finishGreen( 'copy files' );

      translateData()
      .then( function() {
        generateProject()
        .then( function() {
          if (context.execute) {
            fs.unlink( resultPath, function() {
              executeTarget()
              .then( function() {
                Printer.finishGreen( 'unit' );
                readResults().then( function(results) {
                  cb(results.passed);
                })
                .catch(cb);
              })
              .catch(cb);
            } );
          }
          else {
            Printer.finishGreen( 'unit' );
            cb();
          } 
        });
      });
    });

    function copyFiles(tmpPath) {
      return new Promise(function(resolve, reject) {
        var source = path.join( __dirname, '..', 'lib', 'asserter', 'src' )
          , dest = path.join( tmpPath, 'src' );

        fs.copyRecursive( 
          source, 
          dest,
          function(error) {
            //if (error) throw error;
            resolve();
          }
        ); 
      });
    }

    function readResults(cb) {
      return new Promise(function(resolve, reject) {
        fs.readFile( resultPath, function(err, data) {
          var obj = {};
          if (err) {
            reject(err);
          }
          else {
            try {
              resolve( JSON.parse( data.toString() ) );
            }
            catch(err) {
              console.log( err );
              reject(err);
            }
          }
        });
      }); 
    }

    function generateProject() {
      return new Promise(function(resolve, reject) {

        makePathIfNone( dirGYP, function() {

          context.nameGYP = context.targetName + ".gyp";
          context.pathGYP = path.join( dirGYP, context.nameGYP );
          writeGYP( product, context.pathGYP, function(error) {
            if (error) throw error;
            
            Printer.begin( 'generate', context.pathGYP );
            generate( context )
            .then( function() {
              Printer.finishGreen( 'generate' );
              resolve(); 
            })
            .catch(function(error) {
              Printer.finishRed( 'generate' );
              console.log(error);
              reject(); 
            });
          });
        });
      });
    }

    function executeTarget() {
      return new Promise(function(resolve,reject) {
        Printer.begin( 'execute', context.targetName );

        run(context)
        .then( function() {
          Printer.finishGreen( 'execute' ); 
          resolve();
        })
        .catch( function() {
          Printer.finishRed( 'execute' );
          reject();
        });
      });
    }

    function translateData() {
      return new Promise( function(resolve, reject) {
        if (product.hasOwnProperty('data')) {
          
          var cppDir = path.join(dirGYP, 'src', 'data');

          makePathIfNone( cppDir, function() {
            traverse( product.data, function(entry, next) {
              var fileName = path.basename(path.basename(entry)) + '.h'
                , pathOut = path.join( cppDir, fileName );

              product.sources.push( path.join( 
                  '..',
                  cppDir,
                  fileName
                )
              );
              entry = path.join( context.testDir, entry);

              Printer.begin( 'translate', entry ); 
              translate( entry, pathOut, function() {
                Printer.finishGreen( 'translate' ); 
                next(); 
              });
            })
            .then( resolve )
            .catch( reject );
          });
        }
        else {
          resolve();
        }
      });
    }

  })
  .catch( function(error) {
    Printer.finishRed( 'define' );
  });
}

function writeGYP(product, pathGYP, cb) {
  var gyp = {
        target_defaults: {
          target_name: 'test',
          type: 'executable',
          sources: product.sources,
          include_dirs: [ '../' ]
        }
      };
  fs.writeFile( 
      pathGYP, 
      JSON.stringify( gyp, null, 2 ),
      cb
  );
}

function makePathIfNone( path, cb ) {
  fs.exists(path, function(exists) {
    if (exists) 
      cb();
    else 
      fs.mkdirp( path, [], cb ); 
  });
}

module.exports = buildProject;