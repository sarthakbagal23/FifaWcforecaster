const https = require('https');

const options = {
  hostname: 'api.football-data.org',
  path: '/v4/competitions/WC/matches?status=LIVE,IN_PLAY,PAUSED,FINISHED,SCHEDULED',
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
    console.log(JSON.stringify(json.matches.slice(55, 62), null, 2));
  });
});
req.on('error', error => console.error(error));
req.end();
