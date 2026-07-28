/**
 * Origen del API. El backend habilita CORS, así que en desarrollo el dashboard puede consumirlo
 * directamente. Vive en una constante y no repartido por los servicios para que cambiar de entorno
 * sea un solo ajuste.
 */
export const API_BASE_URL = 'http://localhost:3000/api';
