import {randomBytes} from 'node:crypto';
console.log('Copie para as variáveis de ambiente da Vercel e guarde em seu gerenciador de senhas. Não publique estes valores no GitHub.\n');
console.log('ADMIN_PASSWORD='+randomBytes(24).toString('base64url'));
console.log('SESSION_SECRET='+randomBytes(48).toString('base64url'));
