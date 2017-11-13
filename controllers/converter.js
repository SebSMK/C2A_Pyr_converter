var Q = require('q'),    
  logger = require('c2a_utils').logging,     
  sprintf = require('sprintf-js').sprintf,  
  fs = require('fs'),    
  Image = require('./image-pyr');

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
        invnumber;                 
                           
        /*check params*/                              
        invnumber = params.invnumber;            
        logger.info("invnumber :", invnumber);
        
        resourcePath = params.link;            
        logger.info("resourcePath :", resourcePath);
    
        filePath = resourcePath;
        logger.info("filePath name :", filePath);
        
        fs.exists(filePath, 
           function(exists) {
           
              var image, imageProcessor;            
              if (!exists) {
                  deferred.reject(sprintf('ERROR - %s not found', filePath));
              }
              try{
                  logger.info("Converter processing :", filePath);
                  image = new Image(filePath, invnumber);
                  imageProcessor = process.env.NODE_ENV != 'production' ? image.dummyprocess.bind(image) : image.process.bind(image);                            
                  
                  imageProcessor()
                  .then(function(data) {                      
                    deferred.resolve({id: invnumber, pyrpath: data.pyrpath});
                  }, function (error) {                
                      throw(error);
                  }, function (progress) {                
                      //console.log("Converter progress: " + progress);
                      deferred.notify(progress);
                  })
                  .catch(function(err){
                      deferred.reject(err); 
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
