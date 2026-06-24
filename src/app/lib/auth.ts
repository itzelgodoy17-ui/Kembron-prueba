import Cookies from 'js-cookie';

export function guardarToken(token: string) {
  Cookies.set('token', token, { expires: 1 });
}

export function obtenerToken(): string | undefined {
  return Cookies.get('token');
}

export function eliminarToken() {
  Cookies.remove('token');
}

export function obtenerUsuario() {
  const token = obtenerToken();
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload;
  } catch {
    return null;
  }
}