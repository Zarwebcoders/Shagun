import axios from 'axios';

// Detect local environment (localhost, local IP, ngrok, localt, etc.)
const isLocal = 
    window.location.hostname === 'localhost' || 
    window.location.hostname === '127.0.0.1' || 
    window.location.hostname.startsWith('192.168.') || 
    window.location.hostname.startsWith('10.') || 
    window.location.hostname.startsWith('172.') || 
    window.location.hostname.endsWith('.local') ||
    window.location.hostname.endsWith('.ngrok-free.dev') || 
    window.location.hostname.endsWith('.loca.lt') || 
    window.location.hostname.endsWith('.lhr.life');

const client = axios.create({
    baseURL: isLocal ? '/api' : 'https://shagunbackend.vercel.app/api',
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add a request interceptor to add the auth token to headers
client.interceptors.request.use(
    (config) => {
        const user = JSON.parse(localStorage.getItem('user'));
        if (user && user.token) {
            config.headers.Authorization = `Bearer ${user.token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Add a response interceptor to handle errors globally
client.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            // Clear local storage and redirect to login if unauthorized
            localStorage.removeItem('user');
            // Avoid infinite loops if already on login page
            if (window.location.pathname !== '/login') {
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

// Wrap get requests in a lightweight cache/deduplicator
const originalGet = client.get;
const getCache = new Map(); // key -> { promise, timestamp }

client.get = function (url, config) {
    const key = JSON.stringify({ url, params: config?.params });
    const now = Date.now();
    const cached = getCache.get(key);

    if (cached && (now - cached.timestamp < 3000)) { // 3 seconds frontend cache
        return cached.promise;
    }

    const promise = originalGet.call(this, url, config);
    getCache.set(key, {
        promise,
        timestamp: now
    });

    // Delete from cache on failure so it can be retried immediately
    promise.catch(() => {
        getCache.delete(key);
    });

    return promise;
};

export default client;
