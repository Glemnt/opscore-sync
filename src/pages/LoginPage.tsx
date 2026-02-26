import { useState } from 'react';
import { LogIn } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import logoGrupoTG from '@/assets/logo-grupo-tg.jpg';

export function LoginPage() {
  const { login } = useAuth();
  const [loginValue, setLoginValue] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!loginValue.trim() || !password.trim()) {
      setError('Preencha todos os campos.');
      return;
    }
    const success = login(loginValue.trim(), password);
    if (!success) {
      setError('Login ou senha inválidos.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <img src={logoGrupoTG} alt="Grupo TG" className="w-16 h-16 rounded-2xl object-cover shadow-primary mb-4" />
          <h1 className="text-xl font-bold text-foreground">Grupo TG</h1>
          <p className="text-sm text-muted-foreground">Faça login para acessar o sistema</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-card border border-border rounded-xl p-6 shadow-sm space-y-4">
          <div className="space-y-2">
            <Label htmlFor="login">Login</Label>
            <Input
              id="login"
              value={loginValue}
              onChange={(e) => setLoginValue(e.target.value)}
              placeholder="Seu login"
              autoFocus
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Senha</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Sua senha"
            />
          </div>

          {error && (
            <p className="text-sm text-destructive font-medium">{error}</p>
          )}

          <Button type="submit" className="w-full gradient-primary shadow-primary">
            <LogIn className="w-4 h-4 mr-2" />
            Entrar
          </Button>
        </form>
      </div>
    </div>
  );
}
