import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"form">) {
  const navigate = useNavigate();
  const { login } = useAuth();
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      await login({
        email,
        password,
        remember_me: rememberMe,
      });
      
      // Redireciona para a página inicial após login
      navigate("/");
    } catch (err: any) {
      console.error("Erro no login:", err);
      setError(
        err?.response?.data?.error || 
        "Erro ao fazer login. Verifique suas credenciais."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form 
      className={cn("flex flex-col gap-6", className)} 
      onSubmit={handleSubmit}
      {...props}
    >
      <FieldGroup>
        {error && (
          <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
            {error}
          </div>
        )}

        <Field>
          <FieldLabel htmlFor="email">Email</FieldLabel>
          <Input
            id="email"
            type="email"
            placeholder="Insira seu email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={isLoading}
          />
        </Field>

        <Field>
          <div className="flex items-center">
            <FieldLabel htmlFor="password">Senha</FieldLabel>
          </div>
          <Input
            id="password"
            type="password"
            placeholder="Insira sua senha"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={isLoading}
          />
        </Field>

        <Field>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="remember"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              disabled={isLoading}
              className="h-4 w-4"
            />
            <label htmlFor="remember" className="text-sm">
              Lembrar-me
            </label>
          </div>
        </Field>

        <Field>
          <Button type="submit" disabled={isLoading} className="w-full">
            {isLoading ? "Entrando..." : "Login"}
          </Button>
        </Field>
      </FieldGroup>
    </form>
  );
}
