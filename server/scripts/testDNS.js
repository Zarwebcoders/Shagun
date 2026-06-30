const dns = require('dns').promises;
dns.setServers(['8.8.8.8', '1.1.1.1']);

async function testResolution() {
    try {
        console.log('Attempting SRV lookup for _mongodb._tcp.cluster0.lqgakzj.mongodb.net...');
        const srv = await dns.resolveSrv('_mongodb._tcp.cluster0.lqgakzj.mongodb.net');
        console.log('SRV resolution success:', JSON.stringify(srv, null, 2));
    } catch (err) {
        console.error('SRV resolution failed:', err.message);
    }

    try {
        console.log('Attempting A lookup for cluster0-shard-00-00.lqgakzj.mongodb.net...');
        const addresses = await dns.resolve4('cluster0-shard-00-00.lqgakzj.mongodb.net');
        console.log('A resolution success:', addresses);
    } catch (err) {
        console.error('A resolution failed:', err.message);
    }
}

testResolution();
