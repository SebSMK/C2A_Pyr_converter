var Q = require('q'),
logger = require('c2a_utils').logging,
sprintf = require('sprintf-js').sprintf,
converter = require('./controllers/converter');

module.exports = {
  insert: insert
}

/**
 * Params:
 * params.link
 * params.invnumber
 * params.institution  
 *  */
function insert(params) {
  var promise = [];
  var deferred = Q.defer();
  var pyrconv = new converter();                              
                          
  sendInterfaceMessage(sprintf("** start processing - %s - %s %s", params.invnumber, params.institution, params.link));                                                                                  
  
  promise.push(
   
   pyrconv.exec(params)
    .then(function(result){
        sendInterfaceMessage(sprintf("PROCESSED - %s **", result ));
      },
      function(err){
        sendInterfaceMessage(sprintf("processing error - %s **", err ));
      })
    .catch(function(err){
        deferred.reject(err); 
    })                          
  ); 
  
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
}


 /***
 *  PRIVATE FUNCTIONS
 **/
function sendInterfaceMessage(message){
  //console.log('message', { message: sprintf('%s -- %s', getFormatedNowDate() , message )});
  //console.log(process.env.NODE_ENV);
  logger.debug('message', message);  
};     