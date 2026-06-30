const https = require('https');
https.get('https://api.ipify.org?format=json', (res) => {
    let data = '';
    res.on('data', (chunk) => data += chunk);
    res.on('end', () => {
        try {
            console.log('Public IP:', JSON.parse(data).ip);
        } catch (e) {
            console.log('Error parsing response:', data);
        }
        process.exit(0);
    });
}).on('error', (err) => {
    console.error('Error fetching IP:', err.message);
    process.exit(1);
});
