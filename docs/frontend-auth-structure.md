# Estrutura de Autenticação do Frontend

Este documento descreve a estrutura completa de autenticação implementada no frontend, incluindo integração com a API Django e suporte para a funcionalidade "lembrar-me".

## 📁 Arquivos Criados

### 1. **Types (Tipos TypeScript)**

#### `frontend/src/types/auth.ts`
Define todos os tipos TypeScript relacionados à autenticação.

**Para que serve:**
- Garante type-safety em todo o código
- Define a estrutura dos dados do usuário, credenciais de login e respostas da API
- Previne erros de tipos em tempo de desenvolvimento

**Principais tipos:**
- `User`: Dados do usuário (id, username, email, etc.)
- `LoginCredentials`: Credenciais de login incluindo o campo `remember_me`
- `LoginResponse`: Resposta da API de login
- `AuthTokens`: Tokens de acesso e refresh
- `AuthState`: Estado global de autenticação

---

### 2. **Configuração**

#### `frontend/src/config/api.ts`
Centraliza todas as configurações da API.

**Para que serve:**
- Define a URL base da API (vinda da variável de ambiente)
- Lista todos os endpoints disponíveis
- Define timeout das requisições
- Armazena as chaves usadas no localStorage/sessionStorage

**Principais configurações:**
- `API_CONFIG.BASE_URL`: URL do backend (http://localhost:8000)
- `API_CONFIG.ENDPOINTS`: Todos os endpoints da API
- `STORAGE_KEYS`: Chaves para armazenamento local

---

### 3. **Serviços**

#### `frontend/src/services/storage.service.ts`
Gerencia o armazenamento de dados de autenticação.

**Para que serve:**
- Decide onde salvar os dados (localStorage vs sessionStorage) baseado em "lembrar-me"
- Se `remember_me = true`: usa localStorage (persiste após fechar o navegador)
- Se `remember_me = false`: usa sessionStorage (apaga ao fechar o navegador)

**Principais métodos:**
- `setRememberMe(remember)`: Define se deve lembrar o usuário
- `setTokens(tokens)`: Salva os tokens JWT
- `getAccessToken()`: Recupera o token de acesso
- `getRefreshToken()`: Recupera o token de refresh
- `setUser(user)`: Salva dados do usuário
- `getUser()`: Recupera dados do usuário
- `clearAuth()`: Limpa todos os dados de autenticação
- `hasValidSession()`: Verifica se existe uma sessão válida

---

#### `frontend/src/services/api.service.ts`
Serviço principal para fazer requisições HTTP à API.

**Para que serve:**
- Cria uma instância do Axios configurada
- Adiciona automaticamente o token JWT em todas as requisições
- Gerencia refresh automático do token quando expira (401)
- Implementa fila de requisições durante o refresh do token

**Como funciona:**
1. Toda requisição adiciona automaticamente: `Authorization: Bearer {token}`
2. Se receber erro 401 (token expirado):
   - Faz requisição para renovar o token usando o refresh token
   - Atualiza o token no storage
   - Repete a requisição original com o novo token
3. Se o refresh token também expirou, redireciona para login

**Principais métodos:**
- `get<T>(url, config)`: Requisição GET
- `post<T>(url, data, config)`: Requisição POST
- `put<T>(url, data, config)`: Requisição PUT
- `patch<T>(url, data, config)`: Requisição PATCH
- `delete<T>(url, config)`: Requisição DELETE

---

#### `frontend/src/services/auth.service.ts`
Serviço de autenticação de alto nível.

**Para que serve:**
- Fornece métodos específicos para operações de autenticação
- Usa o `apiService` internamente
- Integra com o `storageService` para gerenciar sessão

**Principais métodos:**
- `login(credentials)`: Realiza login e salva tokens/usuário
- `logout()`: Faz logout no backend e limpa dados locais
- `getCurrentUser()`: Busca dados atualizados do usuário logado
- `isAuthenticated()`: Verifica se o usuário está autenticado
- `getStoredUser()`: Retorna usuário armazenado localmente
- `changePassword(data)`: Altera a senha do usuário

---

### 4. **Hooks React**

#### `frontend/src/hooks/useAuth.tsx`
Hook customizado e Context Provider para autenticação.

**Para que serve:**
- Fornece um Context React com estado global de autenticação
- Permite que qualquer componente acesse dados do usuário e funções de autenticação
- Gerencia o estado de loading durante verificação de autenticação

**Como usar:**

```tsx
// 1. Envolva seu app com o AuthProvider (no main.tsx ou App.tsx)
import { AuthProvider } from './hooks/useAuth';

<AuthProvider>
  <App />
</AuthProvider>

// 2. Use o hook em qualquer componente
import { useAuth } from './hooks/useAuth';

function MyComponent() {
  const { user, isAuthenticated, isLoading, login, logout } = useAuth();

  if (isLoading) return <div>Carregando...</div>;

  if (!isAuthenticated) {
    return <div>Você precisa fazer login</div>;
  }

  return (
    <div>
      <p>Olá, {user?.username}!</p>
      <button onClick={logout}>Sair</button>
    </div>
  );
}
```

**Principais propriedades:**
- `user`: Dados do usuário logado (ou null)
- `isAuthenticated`: Se o usuário está autenticado
- `isLoading`: Se está verificando autenticação
- `login(credentials)`: Função para fazer login
- `logout()`: Função para fazer logout
- `refreshUser()`: Atualiza dados do usuário

---

### 5. **Variáveis de Ambiente**

#### `frontend/.env`
Arquivo com variáveis de ambiente (não deve ser commitado).

#### `frontend/.env.example`
Exemplo do arquivo de variáveis de ambiente (deve ser commitado).

**Para que serve:**
- Define a URL do backend de forma configurável
- Permite diferentes URLs em desenvolvimento/produção
- O prefixo `VITE_` é **obrigatório** para que o Vite exponha a variável no frontend

**Conteúdo:**
```env
VITE_BACKEND_URL=http://localhost:8000
```

---

## 🔄 Fluxo de Autenticação

### Login com "Lembrar-me"

```
1. Usuário preenche formulário de login
   ↓
2. Frontend chama authService.login({ username, password, remember_me: true })
   ↓
3. authService faz POST para /api/auth/login/
   ↓
4. Backend retorna: { user, access, refresh }
   ↓
5. storageService verifica remember_me:
   - Se true: salva em localStorage (persiste)
   - Se false: salva em sessionStorage (temporário)
   ↓
6. useAuth atualiza o estado global
   ↓
7. Usuário está autenticado e pode navegar no app
```

### Requisições Autenticadas

```
1. Componente faz requisição (ex: apiService.get('/api/users/'))
   ↓
2. apiService adiciona automaticamente: Authorization: Bearer {token}
   ↓
3. Se token válido: requisição bem-sucedida ✓
   ↓
4. Se token expirado (401):
   - apiService usa refresh token para obter novo access token
   - Salva novo token
   - Repete requisição original
   ↓
5. Se refresh token também expirou:
   - Limpa sessão
   - Redireciona para /login
```

---

## 🔧 Alterações no Backend

### `backend/accounts/serializers.py`
Adicionado campo `remember_me` ao `LoginSerializer`:

```python
class LoginSerializer(serializers.Serializer):
    username = serializers.CharField(required=True)
    password = serializers.CharField(required=True, write_only=True)
    remember_me = serializers.BooleanField(required=False, default=False)
```

### `backend/accounts/views.py`
Modificado `LoginView` para suportar tokens de longa duração:

```python
from datetime import timedelta

def post(self, request):
    # ...
    remember_me = serializer.validated_data.get('remember_me', False)

    if user is not None:
        refresh = RefreshToken.for_user(user)

        # Se "lembrar-me" estiver ativo, aumenta a validade dos tokens
        if remember_me:
            # Refresh token válido por 30 dias
            refresh.set_exp(lifetime=timedelta(days=30))
            # Access token válido por 24 horas
            refresh.access_token.set_exp(lifetime=timedelta(hours=24))
```

**Comportamento:**
- **Sem "lembrar-me"**: Access token válido por 60 min, Refresh por 7 dias (padrão)
- **Com "lembrar-me"**: Access token válido por 24h, Refresh por 30 dias

---

## 📝 Exemplo de Uso Completo

### 1. Configurar o AuthProvider no App

```tsx
// frontend/src/main.tsx
import { AuthProvider } from './hooks/useAuth';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </React.StrictMode>
);
```

### 2. Criar Página de Login

```tsx
// frontend/src/pages/Login.tsx
import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';

export function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');

  const { login, isLoading } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      await login({ username, password, remember_me: rememberMe });
      // Redirecionar para dashboard
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erro ao fazer login');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        placeholder="Usuário"
      />

      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Senha"
      />

      <label>
        <input
          type="checkbox"
          checked={rememberMe}
          onChange={(e) => setRememberMe(e.target.checked)}
        />
        Lembrar-me
      </label>

      {error && <p>{error}</p>}

      <button type="submit" disabled={isLoading}>
        {isLoading ? 'Entrando...' : 'Entrar'}
      </button>
    </form>
  );
}
```

### 3. Fazer Requisições Autenticadas

```tsx
// frontend/src/pages/Dashboard.tsx
import { useEffect, useState } from 'react';
import { apiService } from '../services/api.service';
import { useAuth } from '../hooks/useAuth';

export function Dashboard() {
  const { user, logout } = useAuth();
  const [data, setData] = useState([]);

  useEffect(() => {
    // Requisição autenticada - token é adicionado automaticamente
    apiService.get('/api/some-endpoint/')
      .then(setData)
      .catch(console.error);
  }, []);

  return (
    <div>
      <h1>Olá, {user?.username}!</h1>
      <button onClick={logout}>Sair</button>
      {/* Renderizar dados */}
    </div>
  );
}
```

---

## 🔐 Segurança

### Boas Práticas Implementadas

1. **Tokens não expostos no Context**: O `AuthContext` não expõe os tokens JWT, apenas as funções e dados do usuário
2. **Refresh automático**: Tokens expirados são renovados automaticamente sem intervenção do usuário
3. **Logout completo**: Ao fazer logout, o refresh token é blacklisted no backend e todos os dados são limpos do storage
4. **Variáveis de ambiente**: URL da API não está hardcoded, facilitando mudanças entre ambientes

### localStorage vs sessionStorage

- **localStorage**: Dados persistem mesmo após fechar o navegador (usado quando "lembrar-me" está ativo)
- **sessionStorage**: Dados são apagados ao fechar o navegador (usado quando "lembrar-me" está desativado)

---

## 🚀 Próximos Passos

Para começar a desenvolver:

1. **Instale as dependências** (se ainda não instalou):
   ```bash
   cd frontend
   npm install
   ```

2. **Configure o .env**:
   - Copie `.env.example` para `.env`
   - Ajuste `VITE_BACKEND_URL` se necessário

3. **Adicione o AuthProvider no App**:
   ```tsx
   // src/main.tsx
   import { AuthProvider } from './hooks/useAuth';

   <AuthProvider>
     <App />
   </AuthProvider>
   ```

4. **Crie sua página de login** usando o exemplo acima

5. **Use o hook useAuth** em qualquer componente para acessar dados de autenticação

---

## 📚 Dependências Adicionadas

- **axios**: Cliente HTTP para fazer requisições à API
  ```bash
  npm install axios
  ```

---

## ❓ Dúvidas Comuns

### Por que o prefixo VITE_ nas variáveis de ambiente?

O Vite só expõe variáveis que começam com `VITE_` para o frontend. Isso é uma medida de segurança para evitar que variáveis sensíveis do servidor sejam acidentalmente expostas no código do cliente (que é público).

### Como testar o "lembrar-me"?

1. Faça login com "lembrar-me" marcado
2. Feche o navegador completamente
3. Abra novamente - você ainda estará logado
4. Faça login sem marcar "lembrar-me"
5. Feche o navegador
6. Abra novamente - você terá que fazer login novamente

### E se eu quiser adicionar mais endpoints?

Adicione em `frontend/src/config/api.ts`:

```typescript
export const API_CONFIG = {
  // ...
  ENDPOINTS: {
    // Auth endpoints
    LOGIN: '/api/auth/login/',
    // ... outros endpoints

    // Seus novos endpoints
    PRODUCTS: '/api/products/',
    ORDERS: '/api/orders/',
  },
}
```

Então use com:
```typescript
apiService.get(API_CONFIG.ENDPOINTS.PRODUCTS)
```
