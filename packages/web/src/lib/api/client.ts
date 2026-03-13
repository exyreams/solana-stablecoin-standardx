import axios from "axios";

const client = axios.create({
	baseURL: import.meta.env.VITE_BACKEND_SERVICES_URL,
});

// Add a request interceptor to include the JWT token
client.interceptors.request.use(
	(config) => {
		const token = localStorage.getItem("admin_token");
		if (token) {
			config.headers.Authorization = `Bearer ${token}`;
		}
		return config;
	},
	(error) => {
		return Promise.reject(error);
	},
);

// Add a response interceptor to handle unauthorized errors
client.interceptors.response.use(
	(response) => response,
	(error) => {
		if (error.response?.status === 401) {
			localStorage.removeItem("admin_token");
			if (window.location.pathname !== "/login") {
				window.location.href = "/login";
			}
		}
		return Promise.reject(error);
	},
);

export default client;
