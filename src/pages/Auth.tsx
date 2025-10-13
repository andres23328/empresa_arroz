import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiClient } from "@/integrations/firebase/apiClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { Wheat } from "lucide-react";
import { getAuth, sendPasswordResetEmail } from "firebase/auth";


const Auth = () => {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [isRecovery, setIsRecovery] = useState(false);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
  
    try {
      if (isRecovery) {
        // 🔹 Llamar al endpoint del backend para enviar el correo de recuperación
        await apiClient.requestPasswordReset(email);
  
        toast({
          title: "Correo enviado",
          description: "Revisa tu bandeja de entrada para restablecer tu contraseña.",
        });
  
        setIsRecovery(false); // volver al login después de enviar
        return;
      }
  
      if (isLogin) {
        // 🔹 Iniciar sesión
        const response = await apiClient.login(email, password);
        apiClient.setToken(response.token);
        toast({
          title: "Bienvenido",
          description: "Has iniciado sesión exitosamente",
        });
        navigate("/dashboard");
      } else {
        // 🔹 Registrar usuario
        const response = await apiClient.register(email, password, email.split('@')[0]);
        apiClient.setToken(response.token);
        toast({
          title: "Cuenta creada",
          description: "Tu cuenta ha sido creada exitosamente",
        });
        navigate("/dashboard");
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || error.message || "Ha ocurrido un error",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md shadow-[var(--shadow-medium)]">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <div className="h-16 w-16 rounded-full bg-primary flex items-center justify-center">
              <Wheat className="h-8 w-8 text-primary-foreground" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">
            {isRecovery ? "Recuperar Contraseña" : isLogin ? "Iniciar Sesión" : "Registrarse"}
          </CardTitle>
          <CardDescription>
            {isRecovery
              ? "Ingresa tu correo para recuperar tu contraseña"
              : isLogin
              ? "Sistema de Recursos Humanos - Molino de Arroz"
              : "Crear una nueva cuenta"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAuth} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Correo Electrónico</Label>
              <Input
                id="email"
                type="email"
                placeholder="correo@ejemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            {!isRecovery && (
              <div className="space-y-2">
                <Label htmlFor="password">Contraseña</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            )}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading
                ? "Cargando..."
                : isRecovery
                ? "Enviar Correo"
                : isLogin
                ? "Iniciar Sesión"
                : "Registrarse"}
            </Button>
          </form>
          <div className="mt-4 text-center text-sm space-y-2">
            {!isRecovery && (
              <>
                <button
                  onClick={() => setIsLogin(!isLogin)}
                  className="text-primary hover:underline"
                >
                  {isLogin ? "¿No tienes cuenta? Regístrate" : "¿Ya tienes cuenta? Inicia sesión"}
                </button>
                {isLogin && (
                  <>
                    <br />
                    <button
                      onClick={() => setIsRecovery(true)}
                      className="text-muted-foreground hover:text-primary hover:underline"
                    >
                      ¿Olvidaste tu contraseña?
                    </button>
                  </>
                )}
              </>
            )}
            {isRecovery && (
              <button
                onClick={() => setIsRecovery(false)}
                className="text-primary hover:underline"
              >
                Volver al inicio de sesión
              </button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
