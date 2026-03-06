const fs = require('fs');
const Twit = require('twit');

// Load credentials from file
let creds;
try {
  creds = JSON.parse(fs.readFileSync('/Users/hectorhernandez/.openclaw/x-api-creds.json', 'utf8'));
} catch {
  // Fallback - try home directory expansion
  creds = JSON.parse(fs.readFileSync(require('os').homedir() + '/.openclaw/x-api-creds.json', 'utf8'));
}

const T = new Twit({
  consumer_key: creds.api_key,
  consumer_secret: creds.api_secret,
  access_token: creds.access_token,
  access_token_secret: creds.access_token_secret,
});

const text = process.argv.slice(2).join(' ');

T.post('tweets', { text }, (err, data, response) => {
  if (err) {
    console.error('Error:', JSON.stringify(err));
  } else {
    console.log('Posted successfully!');
  }
});
