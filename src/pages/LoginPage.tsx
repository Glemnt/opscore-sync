import { useState } from 'react';
import { LogIn, UserPlus } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import logoGrupoTG from '@/assets/logo-grupo-tg.jpg';

export function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email.trim() || !password.trim()) {
      setError('Preencha todos os campos.');
      return;
    }
    setLoading(true);
    try {
      const success = await login(email.trim(), password);
      if (!success) {
        setError('E-mail ou senha inválidos.');
      }
    } finally {
      setLoading(false);
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
          {isSignup && (
            <div className="space-y-2">
              <Label htmlFor="name">Nome</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Seu nome completo"
              />
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="email">E-mail</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
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

          {error && <p className="text-sm text-destructive font-medium">{error}</p>}
          {message && <p className="text-sm text-primary font-medium">{message}</p>}

          <Button type="submit" className="w-full gradient-primary shadow-primary" disabled={loading}>
            {isSignup ? <UserPlus className="w-4 h-4 mr-2" /> : <LogIn className="w-4 h-4 mr-2" />}
            {loading ? 'Aguarde...' : isSignup ? 'Criar conta' : 'Entrar'}
          </Button>

          <Button
            type="button"
            variant="ghost"
            className="w-full text-sm"
            onClick={() => { setIsSignup(!isSignup); setError(''); setMessage(''); }}
          >
            {isSignup ? 'Já tem conta? Faça login' : 'Não tem conta? Cadastre-se'}
          </Button>
        </form>
      </div>
    </div>
  );
}
