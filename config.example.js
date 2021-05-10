// config.js
const config = {
    app: {
      port: 3000,
      influx_url: 'http://localhost:8086'
    },
    influx: {
        url: '',
        token: '',
        org: '',
        bucket: ''
    },
    device: {
        user: 'admin',
        password: 'password'
    }
   };
   
module.exports = config;