export const API_BASE_URL = 'http://localhost:4000';
const API_URL = `${API_BASE_URL}/api`;


export const fetchApi = async (endpoint: string, options: RequestInit = {}) => {
  const token = localStorage.getItem('token');
  
  const isFormData = options.body instanceof FormData;
  
  const headers = {
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json();

  if (response.status === 401 || response.status === 403) {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.reload(); 
    throw new Error('Sesión expirada');
  }

  if (!response.ok) {
    throw new Error(data.message || data.error || 'Error en la petición');
  }

  return data;
};