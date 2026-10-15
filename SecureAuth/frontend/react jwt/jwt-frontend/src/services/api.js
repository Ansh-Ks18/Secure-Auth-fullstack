
const API_URL = "http://localhost:8085/api/auth";

async function request(endpoint, options = {}) {
    const response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        credentials: "include",
        headers: {
            ...(options.body
                ? { "Content-Type": "application/json" }
                : {}),
            ...options.headers,
        },
    });

    const text = await response.text();

    let data = text;

    if (text) {
        try {
            data = JSON.parse(text);
        } catch {
            // Keep plain-text responses unchanged.
        }
    }

    if (!response.ok) {
        const message =
            typeof data === "string" && data
                ? data
                : data?.message ||
                  data?.error ||
                  `Request failed (${response.status})`;

        const error = new Error(message);
        error.status = response.status;

        console.error(
            `API error: ${endpoint}`,
            response.status,
            data
        );

        throw error;
    }

    return data;
}

export function registerUser(userData) {
    return request("/register", {
        method: "POST",
        body: JSON.stringify(userData),
    });
}

export function loginUser(credentials) {
    return request("/login", {
        method: "POST",
        body: JSON.stringify(credentials),
    });
}

export function getProfile(accessToken) {
    return request("/profile", {
        method: "GET",
        headers: {
            Authorization: `Bearer ${accessToken}`,
        },
    });
}

export function refreshAccessToken() {
    return request("/refresh", {
        method: "POST",
    });
}

export function logoutUser() {
    return request("/logout", {
        method: "POST",
    });
}
