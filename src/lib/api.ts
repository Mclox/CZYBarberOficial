export const API_BASE_URL = 'http://localhost:4000';
const API_URL = `${API_BASE_URL}/api`;

/**
 * Error de autenticación tipado.
 * Permite distinguir errores 401 (token expirado) de 403 (sin permiso)
 * sin destruir la sesión globalmente.
 */
export class AuthError extends Error {
  public status: number;
  constructor(status: number, message: string) {
    super(message);
    this.name = 'AuthError';
    this.status = status;
  }
}

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

  if (response.status === 401) {
    // Token expirado o inválido → notificar al AuthProvider para que limpie
    // el estado de forma controlada (sin recargar la página).
    window.dispatchEvent(new CustomEvent('auth:session-expired'));
    throw new AuthError(401, data.message || 'Sesión expirada. Por favor inicia sesión nuevamente.');
  }

  if (response.status === 403) {
    // Sin permiso para esta acción → lanzar error SIN destruir la sesión
    throw new AuthError(403, data.message || 'No tienes permiso para realizar esta acción.');
  }

  if (!response.ok) {
    throw new Error(data.message || data.error || 'Error en la petición');
  }

  return data;
};