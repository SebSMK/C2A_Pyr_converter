var express = require('express'),
//router = express(),
path = require('path'),
logger = require("../logging"),
config = require('../config'),
converter = require('../converter'), 
Solr = require('../solr'),
iipproxy = require('../iip'),       
sprintf = require('sprintf-js').sprintf,  
Q = require('q'),
fs = require('fs'),    
Image = require('../image'),
upath = require('upath'),
request = require('request');

module.exports = function(router, io) {
  router.set('views', path.join(__dirname, '../views'));
  router.set('view engine', 'jade');

   router.get('/imgsrv/add/all',        
   
    // loading interface and socket IO before proceeding with the route...
      function(req, res, next) {             
           res.render('chat');  
            io.on('connection', function(socket){
              console.log('io connected');                                                          
              next();        
        });               
      },
      function(req, res, next) {             
          io.sockets.emit('message', { message: 'welcome to import console ' + config.version});                                            
          next();                               
      },
      // ...real stuff starting here
      function(req, res, next) {
        
        sendInterfaceMessage('//////// start processing *******');
                        
        var promise = [];                     
        var solrPath = sprintf('%sselect?q=invnumber%%3Akms*+AND+(type%%3A".tif"+OR+type%%3A".jpg")&sort=invnumber+ASC&rows=100&wt=json&indent=true', config.solrDAMCore);    
        var solr = new Solr(config.solrDAMHost, config.solrDAMPort);   
        var deferred = Q.defer();                                        
          
        solr.get(solrPath)                    
            .then( function(solrResponse){
                 
                // find artwork(s) in solrdam 
                 if(solrResponse.response.numFound > 0){                            
                   logger.info("/imgsrv/post - solr says:", solrResponse);
                   sendInterfaceMessage("/imgsrv/post - solr says: solrResponse.response.numFound - " +  solrResponse.response.numFound);
                   
                    // convert artwork(s)
                   for (i = 0; i < solrResponse.response.docs.length; i++){
                        var pyrconv = new converter(); 
                        var params = {}, doc = solrResponse.response.docs[i];
                        params.id = doc.id;
                        params.link = pathConv2Unix(doc.link);
                        params.invnumber = doc.invnumber;                              
                                                
                        sendInterfaceMessage(sprintf("** start processing - %s - %s %s", params.invnumber, params.id, params.link ));                                                                                  
                        
                        promise.push(
                         pyrconv.exec(params)
                          .then(
                            function(result){
                              sendInterfaceMessage(sprintf("PROCESSED - %s **", result ));
                            },
                            function(err){
                              sendInterfaceMessage(sprintf("processing error - %s **", err ));
                            })                          
                        );                                                                                                       
                   };                 
                                                              
                 }else{              
                   logger.info("/imgsrv/post - image not found :" + solrResponse);
                   deferred.reject({error: "/imgsrv/post - image not found: " + JSON.stringify(solrResponse)});  
                   sendInterfaceMessage("/imgsrv/post - image not found: " +  JSON.stringify(solrResponse));                   
                 }          
                                     
                 Q.allSettled(promise).then(function(result) {
                  //loop through array of promises, add items  
                  var tosend = []
                  result.forEach(function(res) { 
                    if (res.state === "fulfilled") {
                      tosend.push(res.value);
                    }                
                    if (res.state === "rejected") {
                      tosend.push(res.reason);
                    }                
                  });     
                  promise = []; //empty array, since it's global.
                  deferred.resolve(tosend);
                }); 
                
                return deferred.promise;
                    
            })
            .then(
              // processing output
              function(tosend){
                  sendInterfaceMessage('******** processing done //////////');
                  res.end();
            },
            function(error){
                  sendInterfaceMessage('ERROR -- ' + JSON.stringify(error));
                  sendInterfaceMessage('******** processing terminating //////////');
            })
            .catch(function (err){
              //catch and break on all errors or exceptions on all the above methods
              logger.error('/imgsrv/post', err);          
              return res.status(500).send({error: err});
            });  
  });
  
  router.get('/imgsrv/add/:id', 
    // loading interface and socket IO before proceeding with the route...
      /*
      function(req, res, next) {             
           res.render('chat');  
            io.on('connection', function(socket){
              console.log('io connected');                                                          
              next();        
        });               
      },
      function(req, res, next) {             
          io.sockets.emit('message', { message: 'welcome to import console ' + config.version});                                            
          next();                               
      },
      
      */
      // ...real stuff starting here
      function(req, res, next) {
        
        sendInterfaceMessage('//////// start processing *******');
                        
        var promise = [];                     
        var solrPath = sprintf('%sselect?q=id%%3A%s+OR+invnumber%%3A%s&wt=json&fl=link,id,invnumber', config.solrDAMCore, req.params.id, req.params.id);    
        var solr = new Solr(config.solrDAMHost, config.solrDAMPort);   
        var deferred = Q.defer();                                        
          
        solr.get(solrPath)                    
            .then( function(solrResponse){
                 
                // find artwork(s) in solrdam 
                 if(solrResponse.response.numFound > 0){                            
                   logger.info("/imgsrv/post - solr says:", solrResponse);
                   sendInterfaceMessage("/imgsrv/post - solr says:" +  JSON.stringify(solrResponse));
                   
                    // convert artwork(s)
                   for (i = 0; i < solrResponse.response.numFound; i++){
                        var pyrconv = new converter(); 
                        var params = {}, doc = solrResponse.response.docs[i];
                        params.id = doc.id;
                        params.link = pathConv2Unix(doc.link);
                        params.invnumber = doc.invnumber;      
                        
                        var log = function(){
                            sendInterfaceMessage(sprintf("** start processing - %s - %s %s", params.invnumber, params.id, params.link ));
                            return Q.defer().resolve('kok');
                        }
                                                
                        sendInterfaceMessage(sprintf("** start processing - %s - %s %s", params.invnumber, params.id, params.link ));                                                                                  
                        
                        promise.push(
                         pyrconv.exec(params)
                          .then(
                            function(result){
                              sendInterfaceMessage(sprintf("processed - %s **", result ));
                            },
                            function(err){
                              sendInterfaceMessage(sprintf("processing ERROR - %s **", err ));
                            })                          
                        );                                                                                                       
                   };                 
                                                              
                 }else{              
                   logger.info("/imgsrv/post - image not found :" + solrResponse);
                   deferred.reject({error: "/imgsrv/post - image not found: " + JSON.stringify(solrResponse)});  
                   sendInterfaceMessage("/imgsrv/post - image not found: " +  JSON.stringify(solrResponse));                   
                 }          
                                     
                 Q.allSettled(promise).then(function(result) {
                  //loop through array of promises, add items  
                  var tosend = []
                  result.forEach(function(res) { 
                    if (res.state === "fulfilled") {
                      tosend.push(res.value);
                    }                
                    if (res.state === "rejected") {
                      tosend.push(res.reason);
                    }                
                  });     
                  promise = []; //empty array, since it's global.
                  deferred.resolve(tosend);
                }); 
                
                return deferred.promise;
                    
            })
            .then(
              // processing output
              function(tosend){
                  sendInterfaceMessage('******** processing done //////////');
                  res.end();
            },
            function(error){
                  sendInterfaceMessage('ERROR -- ' + JSON.stringify(error));
                  sendInterfaceMessage('******** processing done //////////');
            })
            .catch(function (err){
              //catch and break on all errors or exceptions on all the above methods
              logger.error('/imgsrv/post', err);          
              return res.status(500).send({error: err});
            });  
  });

  /***
 *  PRIVATE FUNCTIONS
 **/
 
  function pathConv2Unix(windowsPath){
    var unixPath = upath.toUnix(windowsPath);
    return unixPath.replace('F:/FotoII/', '');  
  };
  
  function sendInterfaceMessage(message){
      io.sockets.emit('message', { message: sprintf('%s -- %s', getFormatedNowDate() , message )});  
  };
  
  function getFormatedNowDate(){
       var date = new Date();
       var y = date.getFullYear();
       var M = date.getMonth();
       var d = date.getDate();
       var h = date.getHours();
       var m = date.getMinutes();
       var s = date.getSeconds();
       var ms = date.getMilliseconds();
       
       
       return sprintf('%s-%s-%sT%s:%s:%s.%s', y, M, d, h, m, s, ms);
        
  };

}



/*
router.get('/test/emit', 
    function(app, io, req, res, next) {
     res.render('chat');
     
     io.on('connection', function(socket){
        console.log('io connected');
        socket.emit('message', { message: 'welcome to the chat4' });
        io.sockets.emit('message', { message: 'welcome to test!!' });                    
      });    
    
});


module.exports = router;    */
