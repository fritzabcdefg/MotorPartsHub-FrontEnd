// API client using axios - attach to global window object
window.api = axios.create({
  baseURL: 'http://localhost:4000',
  withCredentials: true
});
