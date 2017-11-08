
var Q = require('q'),    
    logger = require("./logging"),
    path = require('path'),
  config = require('./config'), 
  Solr = require('./solr'),
  iipproxy = require('./iip'),       
  sprintf = require('sprintf-js').sprintf,  
  fs = require('fs'),    
  Image = require('./image');

Converter = (function() {    
    
    /**
     * Constructor
     **/
    function Converter() {}
    
    /**
     * Instance Methods 
     **/
     
    Converter.prototype.exec = function(params) {
        var deferred = Q.defer(), 
        filePath, 
        resourcePath, 
        solrid, 
        invnumber;                 
                           
        /*check params*/                      
        solrid = params.id;            
        logger.info("solrid :", solrid);
        
        invnumber = params.invnumber;            
        logger.info("invnumber :", invnumber);
        
        resourcePath = params.link;            
        logger.info("resourcePath :", resourcePath);
    
        filePath = resourcePath; //path.join(config.root, resourcePath);
        logger.info("filePath name :", filePath);
        
        fs.exists(filePath, 
           function(exists) {
              var image, imageProcessor;            
              if (!exists) {
                  deferred.reject(sprintf('ERROR - %s not found', filePath));
              }
              try{
                  logger.info("Converter processing :", filePath);
                  image = new Image(filePath, invnumber, solrid);
                  imageProcessor = config.dummy ? image.dummyprocess.bind(image) : image.process.bind(image);
                  
                  /*
                  return imageProcessor(function(data, type) {                                                                    
                    deferred.resolve({id: solrid, pyrpath: data});                                                                             
                    },
                    function(error) {
                        deferred.reject(error);
                    });
                  */
                  
                  imageProcessor()
                  .then(function(data) {                      
                    deferred.resolve({id: solrid, pyrpath: data.pyrpath});
                  }, function (error) {                
                      throw(error);
                  }, function (progress) {                
                      //console.log("Converter progress: " + progress);
                      deferred.notify(progress);
                  })
                  .catch(function(err) {
                      throw(error); 
                  })
                  
              }
              catch(ex){
                  logger.error(ex);
                  deferred.reject(ex);
              }                        
          },
          function(err) {            
              logger.error('converter error', err);
              deferred.reject(err);
          });        
        
        return deferred.promise;
    }      

    return Converter;
})();

module.exports = Converter;
