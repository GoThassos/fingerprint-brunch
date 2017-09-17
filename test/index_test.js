const Fingerprint = require('../src/index');
const { expect }  = require('chai');
const fs          = require('fs');
const fse         = require('fs-extra');
const path        = require('path');

const ASSETS = {
  'css/sample-2.css': 'css/sample-2-7a6ebaa2.css',
  'css/sample.css': 'css/sample-2df77a0c.css',
  'js/sample.js': 'js/sample-5d19fc29.js'
};

const MAP = {
  'public/css/sample-2.css': 'public/css/sample-2-7a6ebaa2.css',
  'public/css/sample.css': 'public/css/sample-2df77a0c.css',
  'public/js/sample.js': 'public/js/sample-5d19fc29.js'
};

const AUTOREPLACE_ASSETS = {
  'css/sample.css': 'css/sample-2df77a0c.css',
  'css/sample-2.css': 'css/sample-2-7a6ebaa2.css',
  'img/troll.png': 'img/troll-5f2d5cbe.png',
  'fonts/font.eot': 'fonts/font-45d860a3.eot',
  'fonts/font.woff': 'fonts/font-6ced13b9.woff',
  'fonts/font.ttf': 'fonts/font-82c653e7.ttf',
  'fonts/font.svg': 'fonts/font-52343d4f.svg',
  'fonts/font-relative.eot': 'fonts/font-45d860a3.eot',
  'fonts/font-relative.woff': 'fonts/font-6ced13b9.woff',
  'fonts/font-relative.ttf': 'fonts/font-82c653e7.ttf',
  'fonts/font-relative.svg': 'fonts/font-52343d4f.svg'
};

const AUTOREPLACE_MAP = {
  'public/css/sample.css': 'public/css/sample-2df77a0c.css',
  'public/css/sample-2.css': 'public/css/sample-2-7a6ebaa2.css',
  'public/img/troll.png': 'public/img/troll-5f2d5cbe.png',
  'public/fonts/font.eot': 'public/fonts/font-45d860a3.eot',
  'public/fonts/font.woff': 'public/fonts/font-6ced13b9.woff',
  'public/fonts/font.ttf': 'public/fonts/font-82c653e7.ttf',
  'public/fonts/font.svg': 'public/fonts/font-52343d4f.svg',
  'public/fonts/font-relative.eot': 'public/fonts/font-relative-45d860a3.eot',
  'public/fonts/font-relative.woff': 'public/fonts/font-relative-6ced13b9.woff',
  'public/fonts/font-relative.ttf': 'public/fonts/font-relative-82c653e7.ttf',
  'public/fonts/font-relative.svg': 'public/fonts/font-relative-52343d4f.svg'
};

const GENERATED_FILES = [
  {path: path.join(__dirname, 'public', 'js', 'sample.js')},
  {path: path.join(__dirname, 'public', 'css', 'sample.css')},
  {path: path.join(__dirname, 'public', 'css', 'sample-2.css')}
];

const fingerprintFileExists = (filename, done) => {
  filename = path.join(__dirname, 'public', ASSETS[filename] || filename);
  console.log(filename);
  fs.access(filename, fs.constants.R_OK, (err) => {
    done && done(err ? false : true);
  });
};

const fingerprintAutoReplaceFileExists = (filename) => {
  filename = path.join(__dirname, 'public', AUTOREPLACE_ASSETS[filename] || filename);
  fs.access(filename, fs.constants.R_OK, (err) => {
    done && done(err ? false : true);
  });
};

const setupFakeFileSystem = (done) => {
  fse.remove(path.join(__dirname, 'public'), () => {
    fse.copy(path.join(__dirname, 'fixtures'), path.join(__dirname, 'public'), () => {
      done && done();
    });
  });
};


describe('Fingerprint', () => {
  let fingerprint = null;

  // executed before each test
  beforeEach(() =>
    fingerprint = new Fingerprint({
      environments: ['production'],
      paths: {
        public: path.join('test', 'public')
      },
      plugins: {
        fingerprint: {
          publicRootPath: './test/public',
          manifest: './test/public/assets.json'
        }
      }
    })
  );

  // executed after each test
  afterEach((done) => {
    fse.remove(path.join(__dirname, 'public'), () => {
      done()
    });
  });


  // Test without config
  describe('Without configuration passed', () => {
    it('should work', () => {
      fingerprint = new Fingerprint({
        environments: ['production'],
        paths: {
          public: path.join('test', 'public')
        }
      });
      expect(fingerprint).to.be.instanceOf(Fingerprint);
    });
    
  });

  // General tests
  describe('General testing', () => {
    it('is an instance of Fingerprint', () => expect(fingerprint).to.be.instanceOf(Fingerprint));
    it('has default config keys', () => expect(fingerprint.options).to.include.keys('hashLength', 'environments'));
  });


  // Testing Unixifysiation
  describe('Unixify', function() {
    it('should work', function() {
      expect(fingerprint.unixify('c:\\Users\\project\\fingerprint-brunch')).to.be.equal('c:/Users/project/fingerprint-brunch');
    });
  });

  // Testing pattern
  describe('Pattern testing', function() {
    beforeEach((done) => setupFakeFileSystem(() => done()));

    it('assets inner finded', function() {
      const samplePath = path.join(__dirname, 'public', 'css', 'sample.css');
      fingerprint._matchAssetsPattern(samplePath, (data) => {
        expect(data.filePaths).to.not.equal(null);
      });
    });

    it('extract params from url assets', function() {
      const url = 'http://github.com/dlepaux/fingerprint-brunch?test=test';
      const hash = fingerprint._extractHashFromURL(url);
      expect(hash).to.be.equal('?test=test');
    });

    it('extract hash from url assets', function() {
      const url = 'http://github.com/dlepaux/fingerprint-brunch#test=test';
      const hash = fingerprint._extractHashFromURL(url);
      expect(hash).to.be.equal('#test=test');
    });

    it('extract both from url assets', function() {
      const url = 'http://github.com/dlepaux/fingerprint-brunch?test=test#test';
      const hash = fingerprint._extractHashFromURL(url);
      expect(hash).to.be.equal('?test=test#test');
    });

    it('escape string for regexifisation', function() {
      let string = 'url(/img/test.png)';
      string = fingerprint._escapeStringToRegex(string);
      expect(string).to.be.equal('url\\(\\/img\\/test\\.png\\)');
    });
  });


  // Cleaning in dev env
  describe('Cleanning old hashed files', function() {
    beforeEach((done) => setupFakeFileSystem(() => done()));

    it('sample.js is exists', function() {
      const pathFile = path.join(__dirname, 'public', 'js/sample.js');
      fs.access(pathFile, fs.constants.R_OK, (err) => {
        expect(!err?true:false).to.be.true;
      })
    });

    it('sample.js well removed', function() {
      fingerprint._clearOldFilesAsync(path.join(__dirname, 'public', 'js'), 'sample', '.js', (err) => {
        fingerprintFileExists('js/sample.js', (isExist) => {
          expect(isExist).to.be.false;
        });
      });
    });

    it('sample.css is exists', function() {
      const pathFile = path.join(__dirname, 'public', 'css/sample.css');
      fs.access(pathFile, fs.constants.R_OK, (err) => {
        expect(!err?true:false).to.be.true;
      });
    });

    it('sample.css well removed', function() {
      fingerprint._clearOldFilesAsync(path.join(__dirname, 'public', 'css'), 'sample', '.css', (err) => {
        fingerprintFileExists('css/sample.css', (isExist) => {
          expect(isExist).to.be.false;
        });
      });
    });

    it('sample-2.css is exists', function() {
      const pathFile = path.join(__dirname, 'public', 'css/sample-2.css');
      fs.access(pathFile, fs.constants.R_OK, (err) => {
        expect(!err?true:false).to.be.true;
      });
    });

    it('sample-2.css well removed', function() {
      fingerprint._clearOldFilesAsync(path.join(__dirname, 'public', 'css'), 'sample-2', '.css', (err) => {
        fingerprintFileExists('css/sample-2.css', (isExist) => {
          expect(isExist).to.be.false;
        });
      });
    });

    it('test wrong dir took to cleaner', function() {
      fingerprint._clearOldFilesAsync(path.join(__dirname, 'this', 'dir', 'not', 'exist'), 'sample', '.css', (err) => {
        expect(err).to.be.instanceOf(Error)
        expect(err).to.not.equal(null);
      });
    });
  });


  // Fingerprinting
  describe('Fingerprinting', function() {
    beforeEach((done) => setupFakeFileSystem(() => done()));

    it('sample.js with fingerprint', function() {
      const fileName = path.join(__dirname, 'public', 'js', 'sample.js');
      fingerprint._fingerprintFileAsync(fileName, (err, fileNewName) => {
        expect(fileName).to.be.not.equal(fileNewName);
      });
    });

    it('sample.css with fingerprint', function() {
      const fileName = path.join(__dirname, 'public', 'css', 'sample.css');
      fingerprint._fingerprintFileAsync(fileName, (err, fileNewName) => {
        expect(fileName).to.be.not.equal(fileNewName);
      });
    });

    it('sample-2.css with fingerprint', function() {
      const fileName = path.join(__dirname, 'public', 'css', 'sample-2.css');
      fingerprint._fingerprintFileAsync(fileName, (err, fileNewName) => {
        expect(fileName).to.be.not.equal(fileNewName);
      });
    });

    it('with wrong filePath', function() {
      fingerprint._fingerprintFileAsync(path.join(__dirname, 'this', 'file', 'dont', 'exist.css'), (err, fileNewName) => {
        expect(err).to.be.instanceOf(Error)
        expect(err).to.not.equal(null);
      });
    });
  });

  // Renaming
  /*
  describe('onCompile Renaming', function() {
    beforeEach((done) => setupFakeFileSystem(() => done()));

    it('renames sample.css with fingerprint', function() {
      fingerprint.onCompile(GENERATED_FILES, () => {        
        fingerprintFileExists('css/sample.css', (isExist) => {
          expect(isExist).to.be.true;
        });
      });
    });

    it('renames sample.js with fingerprint', function() {
      fingerprint.onCompile(GENERATED_FILES, () => {        
        fingerprintFileExists('js/sample.js', (isExist) => {
          expect(isExist).to.be.true;
        });
      });
    });
  });
  */

  // Manifest
  describe('Manifest', function() {
    describe('The mapping', function() {
      beforeEach((done) => setupFakeFileSystem(() => done()));

      it('add pair to map', function() {
        const sourcePath = path.join(fingerprint.options.publicRootPath, 'test/test.js');
        const destPath = path.join(fingerprint.options.publicRootPath, 'test/test-123456.js');
        fingerprint._addToMap(sourcePath, destPath);
        expect(fingerprint.map[fingerprint.unixify(sourcePath)]).to.be.equal(fingerprint.unixify(destPath));
      });
    });

    describe('_createAsync', function() {
      beforeEach((done) => setupFakeFileSystem(() => done()));

      it('create with param (MAP)', function() {
        fingerprint._createManifestAsync(MAP, (err) => {
          fs.access(fingerprint.options.manifest, fs.constants.R_OK, (err) => {
            expect(!err?true:false).to.be.true;
          });
        });
      });

      it('create with this.map setted', function() {
        fingerprint.map = MAP;
        fingerprint._createManifestAsync((err) => {
          fs.access(fingerprint.options.manifest, fs.constants.R_OK, (err) => {
            expect(!err?true:false).to.be.true;
          });
        });
      });

      it('create (forced)', function() {
        fingerprint.options.manifestGenerationForce = true;
        fingerprint.options.environments = [];
        fingerprint.options.alwaysRun = false;
        fingerprint._createManifestAsync(MAP, (err) => {
          fs.access(fingerprint.options.manifest, fs.constants.R_OK, (err) => {
            expect(!err?true:false).to.be.true;
          });
        });
      });

      it('create with a unvalid name (?)', function() {
        fingerprint.options.manifest = './test/public/ass\0ets.json';
        fingerprint._createManifestAsync(MAP, (err) => {
          expect(err).to.be.instanceOf(Error)
          expect(err).to.not.equal(null);
        });
      });

      it('create MAP passed, but not written', function() {
        fingerprint.options.manifestGenerationForce = false;
        fingerprint.options.environments = [];
        fingerprint.options.alwaysRun = false;
        fingerprint._createManifestAsync(MAP, (err) => {
          fs.access(fingerprint.options.manifest, fs.constants.R_OK, (err) => {
            expect(!err?true:false).to.be.false;
          });
        });
      });
    });

    describe('_mergeAsync', function() {
      beforeEach((done) => setupFakeFileSystem(() => done()));

      it('check manifest is not exist on init (access should be false)', () => {
        fs.access(fingerprint.options.manifest, fs.constants.R_OK, (err) => {
          expect(!err?true:false).to.be.false;
        });
      });

      it('merging an non existing one (access should be false)', function() {
        fingerprint._mergeManifestAsync(() => {
          fs.access(fingerprint.options.manifest, fs.constants.R_OK, (err) => {
            expect(!err?true:false).to.be.false;
          });
        });
      });

      it('merging an non existing one with forcing (should create it)', function() {
        fingerprint.options.manifestGenerationForce = true;
        // Add key/value to map
        Object.keys(MAP).forEach( function(key) {
          fingerprint._addToMap(key, MAP[key]);
        });
        fingerprint._mergeManifestAsync((err) => {
          fs.access(fingerprint.options.manifest, fs.constants.R_OK, (err) => {
            expect(!err?true:false).to.be.true;
          });
        });
      });

      it('merging an existing manifest', function() {
        fingerprint.options.manifestGenerationForce = true;
        // Add key/value to map
        Object.keys(MAP).forEach( function(key) {
          fingerprint._addToMap(key, MAP[key]);
        });
        fs.writeFile(fingerprint.options.manifest, '{"hello/world":"hello/world"}', (err) => {
          fingerprint._mergeManifestAsync(() => {
            fs.readFile(fingerprint.options.manifest, (err, data) => {
              expect(!err?true:false).to.be.true;
              data = JSON.parse(data.toString());
              expect(data['hello/world']).to.be.equal('hello/world');
            });
          });
        });
      });
    });

    describe('_writeAsync', function() {
      beforeEach((done) => setupFakeFileSystem(() => done()));

      it('write manifest with createManifest', function() {
        Object.keys(MAP).forEach( function(key) {
          fingerprint._addToMap(key, MAP[key]);
        });

        fingerprint._writeManifestAsync(() => {
          fs.access(fingerprint.options.manifest, fs.constants.R_OK, (err) => {
            expect(!err?true:false).to.be.true;
          });
        });
      });

      it('write manifest with mergeManifest', function() {
        Object.keys(MAP).forEach( function(key) {
          fingerprint._addToMap(key, MAP[key]);
        });

        fs.writeFile(fingerprint.options.manifest, '{"hello/world":"hello/world"}', 'utf8', (err) => {
          fingerprint._writeManifestAsync(() => {
            fs.access(fingerprint.options.manifest, fs.constants.R_OK, (err) => {
              expect(!err?true:false).to.be.true;
            });
          });
        });
      });
    });
  });

  // Making coffee
  describe('Fingerprinting (non sub assets)', function() {
    beforeEach((done) => setupFakeFileSystem(() => done()));

    it('should fingerprint file', function() {
      fingerprint.options.alwaysRun = true;
      const sourceFullPath = path.join(__dirname, 'public', 'css', 'sample.css');
      fingerprint._makeCoffee(sourceFullPath, (filePath) => {
        expect(typeof(fingerprint.map[fingerprint.unixify(filePath)])).to.be.not.equal('undefined');
        expect(typeof(fingerprint.map[fingerprint.unixify(filePath)])).to.be.not.equal(undefined);
        expect(fingerprint.map[fingerprint.unixify(filePath)]).to.be.not.equal(fingerprint.unixify(filePath));
      });
    });

    it('should not fingerprint file', function() {
      fingerprint.options.alwaysRun = false;
      fingerprint._makeCoffee(path.join(__dirname, 'public', 'css', 'sample.css'), (filePath) => {
        expect(typeof(fingerprint.map[fingerprint.unixify(filePath)])).to.be.not.equal('undefined');
        expect(typeof(fingerprint.map[fingerprint.unixify(filePath)])).to.be.not.equal(undefined);
        expect(fingerprint.map[fingerprint.unixify(filePath)]).to.be.equal(fingerprint.unixify(filePath));  
      });
    });
  });
  


  // Environment detection
  describe('Environment detection', function() {
    beforeEach((done) => setupFakeFileSystem(() => done()));

    it('does not run in non-production environment', function() {
      fingerprint.options.environments = ['development'];
      expect(fingerprint._isFingerprintable()).to.be.true;
    });

    it('does run with alwaysRun flag set', function() {
      fingerprint.options.environments = [];
      fingerprint.options.alwaysRun = true;
      expect(fingerprint._isFingerprintable()).to.be.true;
    });

    it('does run in production environment', function() {
      fingerprint.options.environments = ['production'];
      expect(fingerprint._isFingerprintable()).to.be.true;
    });
  });

  // Matching assets to hash
  describe('AutoReplace sub assets', function() {
    beforeEach((done) => setupFakeFileSystem(() => done()));

    it('extract url from css "url()" attribute', function() {
      expect(fingerprint._extractURL('url("test.png")')).to.be.equal('test.png');
    });

    it('autoReplace in css sample', function() {
      fingerprint.options.alwaysRun = true;
      fingerprint.options.autoReplaceAndHash = true;
      fingerprint._findAndReplaceSubAssetsAsync(path.join(__dirname, 'public', 'css', 'sample.css'), (filePath) => {
        // Expect parent file well fingerprinted
        expect(typeof(fingerprint.map[fingerprint.unixify(filePath)])).to.be.not.equal('undefined');
        expect(typeof(fingerprint.map[fingerprint.unixify(filePath)])).to.be.not.equal(undefined);
        expect(fingerprint.map[fingerprint.unixify(filePath)]).to.be.not.equal(fingerprint.unixify(filePath));  
        
        console.log(fingerprint.map);
        // Expect children file well fingerprinted too
        filePath = path.join('test', 'public', 'img', 'troll.png');
        expect(typeof(fingerprint.map[fingerprint.unixify(filePath)])).to.be.not.equal('undefined');
        expect(typeof(fingerprint.map[fingerprint.unixify(filePath)])).to.be.not.equal(undefined);
        expect(fingerprint.map[fingerprint.unixify(filePath)]).to.be.not.equal(fingerprint.unixify(filePath));  
      });
    });

    it('autoReplace in css sample (with doublon in map)', function() {
      fingerprint.options.alwaysRun = true;
      fingerprint.options.autoReplaceAndHash = true;
      fingerprint._findAndReplaceSubAssetsAsync(path.join(__dirname, 'public', 'css', 'sample-2.css'), (filePath) => {
        // Expect parent file well fingerprinted
        expect(typeof(fingerprint.map[fingerprint.unixify(filePath)])).to.be.not.equal('undefined');
        expect(typeof(fingerprint.map[fingerprint.unixify(filePath)])).to.be.not.equal(undefined);
        expect(fingerprint.map[fingerprint.unixify(filePath)]).to.be.not.equal(fingerprint.unixify(filePath));  
        
        console.log(fingerprint.map);
        // Expect children file well fingerprinted too
        filePath = path.join('test', 'public', 'img', 'troll.png');
        expect(typeof(fingerprint.map[fingerprint.unixify(filePath)])).to.be.not.equal('undefined');
        expect(typeof(fingerprint.map[fingerprint.unixify(filePath)])).to.be.not.equal(undefined);
        expect(fingerprint.map[fingerprint.unixify(filePath)]).to.be.not.equal(fingerprint.unixify(filePath));

        // troll.png is in doublon
        fingerprint._findAndReplaceSubAssetsAsync(path.join(__dirname, 'public', 'css', 'sample.css'), (filePath) => {
          // Expect parent file well fingerprinted
          expect(typeof(fingerprint.map[fingerprint.unixify(filePath)])).to.be.not.equal('undefined');
          expect(typeof(fingerprint.map[fingerprint.unixify(filePath)])).to.be.not.equal(undefined);
          expect(fingerprint.map[fingerprint.unixify(filePath)]).to.be.not.equal(fingerprint.unixify(filePath));
        });
      });
    });

    it('autoReplace in css sample (without sub assets)', function() {
      fingerprint.options.alwaysRun = true;
      fingerprint.options.autoReplaceAndHash = true;
      fingerprint._findAndReplaceSubAssetsAsync(path.join(__dirname, 'public', 'css', 'sample-3.css'), (filePath) => {
        // Expect parent file well fingerprinted
        expect(typeof(fingerprint.map[fingerprint.unixify(filePath)])).to.be.not.equal('undefined');
        expect(typeof(fingerprint.map[fingerprint.unixify(filePath)])).to.be.not.equal(undefined);
        expect(fingerprint.map[fingerprint.unixify(filePath)]).to.be.not.equal(fingerprint.unixify(filePath));  
      });
    });
  });

  // Matching assets to hash
  describe('Full Test with onCompile', function() {
    beforeEach((done) => setupFakeFileSystem(() => done()));

    it('test with one file (with autoReplace)', function() {
      fingerprint.onCompile([{path: path.join(__dirname, 'public', 'js', 'sample.js')}], (filePath) => {
        expect(filePath).to.be.not.null();
      });
    });

    it('test with one file (without autoReplace)', function() {
      fingerprint.options.autoReplaceAndHash = false;
      fingerprint.onCompile([{path: path.join(__dirname, 'public', 'js', 'sample.js')}], (filePath) => {
        expect(filePath).to.be.not.null();
      });
    });

    it('test with one file (without autoClear)', function() {
      fingerprint.options.autoClearOldFiles = true;
      fingerprint.onCompile([{path: path.join(__dirname, 'public', 'js', 'sample.js')}], (filePath) => {
        expect(filePath).to.be.not.null();
      });
    });
  });
});
      
