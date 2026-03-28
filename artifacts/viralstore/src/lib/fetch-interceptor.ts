// Intercept all fetch requests to append JWT token + API base URL
const originalFetch = window.fetch;

// In production (Vercel), VITE_API_URL points to the Replit backend
// In development (Replit), API calls are relative (/api/...)
const API_BASE = import.meta.env.VITE_API_URL ?? "";

window.fetch = async (...args) => {
  let [resource, config] = args;

  if (typeof resource === "string" && resource.startsWith("/api")) {
    // Prepend API base URL if set (production on Vercel)
    resource = `${API_BASE}${resource}`;

    const token = localStorage.getItem("viralstore_token");
    if (token) {
      config = config ?? {};
      const headers = new Headers(config.headers);
      headers.set("Authorization", `Bearer ${token}`);
      config.headers = headers;
    }
  }

  return originalFetch(resource, config);
};

export {};
