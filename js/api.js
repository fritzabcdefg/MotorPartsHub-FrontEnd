// Change your api configuration to this:
const api = axios.create({
    baseURL: 'http://localhost:4000', // Pointing to your backend
    withCredentials: true             // Essential for your auth headers
});