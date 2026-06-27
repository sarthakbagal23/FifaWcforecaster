const https = require('https');

const options = {
  hostname: 'api.football-data.org',
  path: '/v4/competitions/WC/scorers',
  method: 'GET',
  headers: {
    'X-Auth-Token': process.env.FOOTBALL_DATA_API_KEY
  }
};

const req = https.request(options, res => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log(data.substring(0, 1000));
  });
});
req.on('error', error => console.error(error));
req.end();
