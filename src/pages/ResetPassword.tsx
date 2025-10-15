import { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { apiClient } from "@/integrations/firebase/apiClient";

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // 🔒 Función de validación de contraseña segura
  const validatePassword = (password: string) => {
    const minLength = 8;
    const hasUppercase = /[A-Z]/.test(password);
    const hasLowercase = /[a-z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSpecial = /[@$!%*?&]/.test(password);

    if (password.length < minLength)
      return "La contraseña debe tener al menos 8 caracteres";
    if (!hasUppercase)
      return "Debe incluir al menos una letra mayúscula";
    if (!hasLowercase)
      return "Debe incluir al menos una letra minúscula";
    if (!hasNumber)
      return "Debe incluir al menos un número";
    if (!hasSpecial)
      return "Debe incluir al menos un carácter especial (@, $, !, %, *, ?, &)";
    return null;
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!token) {
      toast({
        title: "Token inválido",
        description: "El enlace de restablecimiento no es válido o ha expirado.",
        variant: "destructive",
      });
      return;
    }

    // 🔍 Validación de contraseñas
    const passwordError = validatePassword(password);
    if (passwordError) {
      toast({
        title: "Contraseña inválida",
        description: passwordError,
        variant: "destructive",
      });
      return;
    }

    if (password !== confirmPassword) {
      toast({
        title: "Error",
        description: "Las contraseñas no coinciden",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      await apiClient.resetPassword(token, password);
      toast({
        title: "Contraseña restablecida",
        description: "Tu contraseña ha sido actualizada correctamente.",
      });
      navigate("/auth");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudo restablecer la contraseña.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md shadow-[var(--shadow-medium)]">
        <CardHeader className="text-center space-y-2">
          <CardTitle className="text-2xl font-bold">Restablecer Contraseña</CardTitle>
          <CardDescription>Ingresa tu nueva contraseña para continuar</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleReset} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">Nueva Contraseña</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <p className="text-xs text-muted-foreground">
                Debe tener al menos 8 caracteres, incluir mayúscula, minúscula, número y símbolo.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar Contraseña</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Restableciendo..." : "Actualizar Contraseña"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
