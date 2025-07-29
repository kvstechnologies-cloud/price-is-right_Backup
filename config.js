const isLocal = window.location.hostname === 'localhost';

export const API_BASE_URL = isLocal 
  ? 'http://localhost:3001/api' 
  : 'https://udjszezwob.execute-api.us-east-1.amazonaws.com/stage/api';
