// Intercept all fetch requests to append the JWT token
const originalFetch = window.fetch;

window.fetch = async (...args) => {
  let [resource, config] = args;
  
  if (typeof resource === 'string' && resource.startsWith('/api')) {
    const token = localStorage.getItem('viralstore_token');
    
    if (token) {
      config = config || {};
      const headers = new Headers(config.headers);
      headers.set('Authorization', `Bearer ${token}`);
      config.headers = headers;
    }
  }
  
  return originalFetch(resource, config);
};

export {};
