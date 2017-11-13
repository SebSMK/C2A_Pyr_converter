var logger = require('c2a_utils').logging,
    sprintf = require('sprintf-js').sprintf,
    //config = require('../config'),
    fs = require('fs'),
    exec = require('child_process').exec,
    mmm = require('mmmagic'),
    Magic = mmm.Magic,
    Q = require('q'),
    deleteFile = Q.denodeify(fs.unlink),
    writeFile = Q.denodeify(fs.writeFile),
    readFile = Q.denodeify(fs.readFile),
    promisePipe = require('promisepipe'),
    utils = require('c2a_utils');         

Image = (function() {

    var type, path, storage;    
    //var storage = config.storage.dev;
    //storage =  __dirname + '/';
    
    /**
     * Constructor
     **/
    function Image(storage, path, invnumber) {
        this.path = path;
        this.invnumber = invnumber;
        this.storage = storage;
    }

    /**
     * Public Methods 
     **/
     
     Image.prototype.process = function() {
        var deferred = Q.defer();
        var self = this;
        
        self.image = self.storage + self.invnumber + '.image';
        self.pyr_path = self.storage + self.invnumber + '_pyr.tif';

        logger.info('Image.prototype.process: ' + JSON.stringify(this, null, 4));
        
         utils.createWriteStreamPromise(self.pyr_path + '.tmp')
         .then(function(writeStream){
           return promisePipe(
                fs.createReadStream(self.path), 
                writeStream                
            );
          })                       
          
          .then(function() {
                logger.info('read image file', self.path);
                //self.imageData = data;
                return detectFile(self.path);
            })
            
          .then(function(type) {
                logger.info('detected file type :', type);
                self.type = type;
                //return writeFile(self.image, self.imageData);
                return Q.defer().resolve();
            })           
            .then(function() {
                logger.info('create tmp pyr tiff');
                return convertPyr.call(self, self.pyr_path);
            })
            .then(function(type) {
                logger.info('create pyr tiff');
                return deleteFile(self.pyr_path + '.tmp').then(function() {
                    logger.info('deleted temp pyr copy', self.pyr_path + '.tmp',
                        "(" + self.path + ")")
                });
            }, function (error) {                
                throw(error);
            }, function (progress) {                
                //console.log("Request progress: " + progress);
                deferred.notify(progress);
            })
            /*return pyr file path*/
            .then(function() {
                logger.info('delete tmp pyr tiff');
                deleteFile(self.image).then(function() {
                    logger.info('deleted temp copy', self.image,
                        "(" + self.path + ")")
                });
                //return done(self.pyr_path, 'image/tif');                
                deferred.resolve({type: 'image/tif', pyrpath: self.pyr_path})
            })
            .catch(function(err) {
                /*catch and break on all errors or exceptions on all the above methods*/
                logger.error('Image.prototype.process', err);
                deferred.reject(err);
            })
            
            return deferred.promise;
    }

    Image.prototype.dummyprocess = function() {
        var self = this;
        var deferred = Q.defer();
        
        setTimeout(function() {            
            logger.info(JSON.stringify({process:'Dummy Load', pct:'99', invnumber:self.invnumber})); 
            deferred.notify(JSON.stringify({process:'Dummy Load', pct:'99', invnumber:self.invnumber})); 
             setTimeout(function() {
                  logger.info(JSON.stringify({process:'Dummy Save', pct:'99', invnumber:self.invnumber})); 
                  deferred.notify(JSON.stringify({process:'Dummy Save', pct:'99', invnumber:self.invnumber})); 
                  setTimeout(function() { 
                      logger.info(JSON.stringify({process:'end', pct:'100', invnumber:self.invnumber}));
                      deferred.notify(JSON.stringify({process:'end', pct:'100', invnumber:self.invnumber}));           
                      deferred.resolve({type: 'image/tif', pyrpath: 'dummypath'})
                  }, 500);                         
              }, 100);                       
        }, 100);
        return deferred.promise;
    }
    
    /**
     * Private methods 
     **/
    function convertPyr(path) {
        var self = this;
        var deferred = Q.defer();
        var source = path + '.tmp';
        var target = path;
        var cmd = sprintf("gm convert -monitor '%s' -define tiff:tile-geometry=256x256 -compress jpeg 'ptif:%s'", source, target);
        //var cmd = sprintf("convert -monitor '%s' -define tiff:tile-geometry=256x256 -compress jpeg 'ptif:%s'", source, target);
        //cmd = sprintf("convert '%s' -define tiff:tile-geometry=256x256 -compress jpeg 'ptif:%s'", source, target);                

        logger.info(cmd);        
               
        var child = exec(cmd,
            function(error, stdout, stderr) {
                if (error !== null && error !== '') {
                    logger.error('exec error: ' + error);
                    //deferred.reject(error);
                } else {
                    logger.info('convertPyr Ok');
                    //deferred.resolve('0');  
                }
                logger.info(JSON.stringify({process:'end', pct:100, invnumber:self.invnumber}));
                deferred.notify(JSON.stringify({process:'end', pct:100, invnumber:self.invnumber}));
                deferred.resolve('0');
            });               
         
        child.stderr.on('data', function(data) {
            //console.log(data);
            var lastline = data.split('\r');
            lastline.pop();            
            var lastdata = lastline.pop();
            
            if(lastdata != undefined){              
              var dataout = lastdata.trim().split(" ");
              var pctindex = dataout.shift();
              var pct = pctindex.split('%').shift();
              dataout.shift();
              var process = dataout.shift();                                      
              
              logger.info(JSON.stringify({process:process, pct:pct.trim(), invnumber:self.invnumber}));             
              deferred.notify(JSON.stringify({process:process, pct:pct.trim(), invnumber:self.invnumber}));  
            }            
        });                
               
        return deferred.promise;
    }


    function detectFile(path) {

        var deferred = Q.defer();
        var magic = new Magic(mmm.MAGIC_MIME_TYPE);

        magic.detectFile(path, function(err, result) {
            if (err) {
                logger.error('lookup mime type FAILED');
                deferred.reject(err);
            } else {
                deferred.resolve(result);
            }
        });
        return deferred.promise;
    }
    
    return Image;
})();   
   

/**
 * Helper functions
 **/

function guid() {
    function s4() {
        return Math.floor((1 + Math.random()) * 0x10000)
            .toString(16)
            .substring(1);
    }
    return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
        s4() + '-' + s4() + s4() + s4();
}

function convertDanishChars(string) {
    string = string.replace(/©/g, "Copyright");
    string = string.replace(/Æ/g, "Ae");
    string = string.replace(/Ø/g, "Oe");
    string = string.replace(/Å/g, "Aa");
    string = string.replace(/æ/g, "ae");
    string = string.replace(/ø/g, "oe");
    string = string.replace(/å/g, "aa");
    return string;
}

module.exports = Image;