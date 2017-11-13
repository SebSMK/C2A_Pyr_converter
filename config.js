
var config = {    
    // Import parameters        
    dummy: false,
    last_processed: 'kms3432',
    maxFileSize:  300000000, // ---> control on size does'nt work??!! -> try with kms3696 8bit  
    
    // Metadata values
    attribution : "Close2Art", /*max 32 bytes!*/
    oldAttribution : 'Hans Petersen',
    copyrightDefault : 'Public Domain (CC0)',
    city : 'Copenhagen',
    country : 'Denmark',

    // IIP
    IIPHost : '172.20.1.203',
    IIPPath : '/iipsrv/iipsrv.fcgi',
    IIPImageSize:{
              thumb: 100,
              medium: 200,
              large: 500    
    },    
    
    storage: {
      dev: '/mnt/hires/dev/',
      test: '/mnt/hires/test/',
      prod: '/mnt/hires/prod/'              
    }
            
    // MongoDB
    //mongoURL: 'mongodb://localhost:27017/DAM_PYR',
    
}

module.exports = config;

