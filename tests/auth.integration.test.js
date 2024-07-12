import { token } from '../getToken.js'; // ajuste o caminho conforme necessário
import dotenv from 'dotenv';

// Carregando variáveis de ambiente específicas para teste
dotenv.config({ path: '.env.test' });

describe('Real Authentication Test', () => {
  it('should return a bearer token on successful login', async () => {
    const result = await token();
    expect(result).toBeDefined();
    expect(typeof result).toBe('string');
    console.log('Bearer Token:', result);
  });
});
