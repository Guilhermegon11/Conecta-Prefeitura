import {randomBytes} from 'node:crypto';
console.log('Credenciais para coleta real. Copie para as variáveis de ambiente da Vercel e guarde em seu gerenciador de senhas. Não publique estes valores no GitHub.\n');
console.log('TEST_MODE=false');
console.log('ADMIN_USERNAME=admin');
console.log('ADMIN_PASSWORD='+randomBytes(24).toString('base64url'));
console.log('SESSION_SECRET='+randomBytes(48).toString('base64url'));
console.log('\nMantenha as duas variáveis do Turso e faça Redeploy para aplicar a configuração.');
