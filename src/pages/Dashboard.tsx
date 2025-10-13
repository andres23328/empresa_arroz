import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiClient } from "@/integrations/firebase/apiClient";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LogOut, Wheat } from "lucide-react";
import EmployeeManagement from "@/components/EmployeeManagement";
import ContractManagement from "@/components/ContractManagement";
import SearchAndExport from "@/components/SearchAndExport";

const Dashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    console.log('token', token);
    if (!token) {
      navigate("/auth");
      return;
    }
  
    const fetchUser = async () => {
      try {
        const userData = await apiClient.getCurrentUser();
        setUser(userData.user);
      } catch (error) {
        navigate("/auth");
      } finally {
        setLoading(false);
      }
    };
  
    fetchUser();
  }, [navigate]);
  

  const handleLogout = async () => {
    localStorage.removeItem('authToken');
    navigate("/auth");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <Wheat className="h-12 w-12 text-primary animate-pulse mx-auto" />
          <p className="text-muted-foreground">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card shadow-[var(--shadow-soft)]">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center">
              <Wheat className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold">SIRH - Molino de Arroz</h1>
              <p className="text-sm text-muted-foreground">Sistema de Recursos Humanos</p>
            </div>
          </div>
          <Button variant="outline" onClick={handleLogout}>
            <LogOut className="h-4 w-4 mr-2" />
            Cerrar Sesión
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Tabs defaultValue="employees" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 max-w-2xl mx-auto">
            <TabsTrigger value="employees">Empleados</TabsTrigger>
            <TabsTrigger value="contracts">Contratos</TabsTrigger>
            <TabsTrigger value="search">Búsqueda y Reportes</TabsTrigger>
          </TabsList>

          <TabsContent value="employees" className="space-y-4">
            <EmployeeManagement />
          </TabsContent>

          <TabsContent value="contracts" className="space-y-4">
            <ContractManagement />
          </TabsContent>

          <TabsContent value="search" className="space-y-4">
            <SearchAndExport />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Dashboard;
