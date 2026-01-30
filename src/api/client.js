import axios from 'axios';

const client = axios.create({
    baseURL: (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') ? '/api' : 'https://shagunbackend.vercel.app/api',
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

export default client;
