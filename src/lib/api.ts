const API_URL = 'http://localhost:4000/api';

export const fetchApi = async (endpoint: string, options: RequestInit = {}) => {
  // Obtenemos el token guardado tras el login
  const token = localStorage.getItem('token');
  
  const headers = {
    'Content-Type': 'application/json',
    // Si hay token, lo enviamos en los headers de autorización
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json();

  // Si el token expiró o es inválido, cerramos sesión automáticamente
  if (response.status === 401 || response.status === 403) {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.reload(); // Recarga para volver al login
    throw new Error('Sesión expirada');
  }

  if (!response.ok) {
    throw new Error(data.message || data.error || 'Error en la petición');
  }

  return data;
};