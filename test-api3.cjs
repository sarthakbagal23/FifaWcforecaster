const https = require('https');

const options = {
  hostname: 'api.football-data.org',
  path: '/v4/competitions/WC/standings',
  method: 'GET',
  headers: {
    'X-Auth-Token': process.env.FOOTBALL_DATA_API_KEY
  }
};

const req = https.request(options, res => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    const json = JSON.parse(data);
    console.log(JSON.stringify(json.standings?.[0], null, 2));
  });
});
req.on('error', error => console.error(error));
req.end();
