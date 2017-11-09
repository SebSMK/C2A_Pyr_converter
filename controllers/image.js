var logger = require('./logging'),
    sprintf = require('sprintf-js').sprintf,
    Q = require('q');         

Image = (function() {

    /**
     * Constructor
     **/
    function Image(path, invnumber) {
        this.path = path;
        this.invnumber = invnumber;
    }

    /**
     * Instance Methods 
     **/

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
    
    return Image;
})();   

    /**
     * Private methods 
     **/
    

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