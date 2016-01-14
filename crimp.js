#!/usr/bin/env node

var assert = require( 'assert' )
  , program = require( 'commander' )
  , buildProject = require( './bin/controller.js' )
  , path = require( 'path' )
  , rmrf = require( 'rmrf' )
  , cp = require( 'child_process' )
  , fs = require( 'fs' )
  , traverse = require( 'traverjs' );

program
  .version( '0.0.1' )
  .option( '-o, --output [path]', 'build output (default: build)' )
  .option( '-p, --path [path]', 'test path (default .)' )
  .option( '-s, --suite [path]', 'suite json' )
  .option( '-t, --test', 'test build (default)' )
  .option( '-d, --debug', 'target debug' )
  .option( '-r, --release', 'target release' )
  .option( '-c, --clean', 'clean build' )
  .option( '-g, --gcc', 'use gcc compiler' )
  .option( '-e, --execute', 'execute product' )
  .option( '-i, --ide', 'open project in ide' )
  .parse( process.argv );

var options = { 
      buildDir: 'build',
      targetName: 'test',
      testDir: '.',
      pathJSON: './test.json'
  };
  
if (program.release) {
  options.release = true;
}
else if (program.debug) {
  options.debug = true;
} 
else {
  options.test = true;
  options.execute = true;
}

if (program.output) {
  options.buildDir = program.output;
}

if (program.gcc) {
  options.gcc = true;
}

if (program.execute) {
  options.execute = true;
}

if (program.ide) {
  options.ide = program.ide;
}

if (program.suite) {

  var dirname = path.dirname( program.suite )
    , pathPop = process.cwd();

  fs.readFile( program.suite, function(err, data) {
    if (err) throw err; 
    
    traverse( JSON.parse( data.toString() ).tests, function( pathJSON, next ) {
      process.chdir( pathPop );
      crimpIt( path.join( dirname, pathJSON ), next );
    } )
    .then( function() {
      
    });
  });
}
else {

  crimpIt( program.path );

}

function crimpIt(pathJSON, cb) {

  console.log( 'crimp', pathJSON );

  options.pathJSON = path.basename( pathJSON );
  options.testDir = path.join( process.cwd(), path.dirname( pathJSON ) );

  if (program.clean) {
    rmrf( path.join( options.testDir, options.buildDir ) ); 
  }

  buildProject( options, cb );
}


