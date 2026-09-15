import axios from 'axios';

// Backend (C#) API'mizin çalıştığı adres (Dün tarayıcıda açtığımız port)
const API_URL = 'https://pelt-corsage-unsorted.ngrok-free.dev/api';

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'ngrok-skip-browser-warning': 'true'
    }
});

// Gönderilen her kargonun (isteğin) içine Yaka Kartımızı (Token) otomatik ekleyen kurye
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export default api;