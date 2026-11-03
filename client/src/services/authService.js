const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  "https://proofbeforepost.onrender.com";

const TOKEN_KEY = "proofbeforepost_token";

// Login / Signup API handler
export async function authenticateUser(mode, formData) {
  const endpoint =
    mode === "login" ? "/api/auth/login" : "/api/auth/register";

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(formData),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Authentication failed.");
  }

  if (mode === "login") {
    sessionStorage.setItem(TOKEN_KEY, data.token);
  }

  return data;
}

// Get stored token
export function getToken() {
  return sessionStorage.getItem(TOKEN_KEY);
}

// Logout
export function logoutUser() {
  sessionStorage.removeItem(TOKEN_KEY);
}