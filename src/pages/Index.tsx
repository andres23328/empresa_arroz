import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Wheat, Users, FileText, Search } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-accent/5 to-secondary/10">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <div className="flex justify-center mb-8">
            <div className="h-24 w-24 rounded-full bg-primary flex items-center justify-center shadow-[var(--shadow-medium)]">
              <Wheat className="h-12 w-12 text-primary-foreground" />
            </div>
          </div>

          <div className="space-y-4">
            <h1 className="text-5xl font-bold text-foreground">
              Sistema de Información de Recursos Humanos
            </h1>
            <p className="text-xl text-muted-foreground">
              Molino de Arroz - Gestión Integral de Personal
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
            <div className="p-6 rounded-lg bg-card border shadow-[var(--shadow-soft)]">
              <Users className="h-12 w-12 text-primary mx-auto mb-4" />
              <h3 className="font-semibold text-lg mb-2">Gestión de Empleados</h3>
              <p className="text-sm text-muted-foreground">
                Control completo de información del personal
              </p>
            </div>
            <div className="p-6 rounded-lg bg-card border shadow-[var(--shadow-soft)]">
              <FileText className="h-12 w-12 text-secondary mx-auto mb-4" />
              <h3 className="font-semibold text-lg mb-2">Contratos</h3>
              <p className="text-sm text-muted-foreground">
                Administración de contratos laborales
              </p>
            </div>
            <div className="p-6 rounded-lg bg-card border shadow-[var(--shadow-soft)]">
              <Search className="h-12 w-12 text-accent mx-auto mb-4" />
              <h3 className="font-semibold text-lg mb-2">Búsqueda y Reportes</h3>
              <p className="text-sm text-muted-foreground">
                Generación de reportes en PDF y Excel
              </p>
            </div>
          </div>

          <div className="pt-8">
            <Button size="lg" onClick={() => navigate("/auth")} className="text-lg px-8">
              Acceder al Sistema
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
