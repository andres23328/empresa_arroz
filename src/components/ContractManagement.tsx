import { useState, useEffect } from "react";
import { apiClient } from "@/integrations/firebase/apiClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2 } from "lucide-react";

interface Contract {
  id: string;
  employeeId: string;
  fecha_inicio: string;
  fecha_fin: string;
  valor_contrato: number;
  employee?: {
    id: string;
    nombre: string;
    apellido: string;
    cargo: string;
  };
}

interface Employee {
  id: string;
  nombre: string;
  apellido: string;
}

const ContractManagement = () => {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingContract, setEditingContract] = useState<Contract | null>(null);
  const [formData, setFormData] = useState({
    employeeId: "",
    fecha_inicio: "",
    fecha_fin: "",
    valor_contrato: "",
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    
    try {
      const [contractsData, employeesData] = await Promise.all([
        apiClient.getContracts(),
        apiClient.getEmployees()
      ]);
      console.log("contractsData:", contractsData);
      console.log("employeesData:", employeesData);

      setContracts(contractsData);
      setEmployees(employeesData);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "No se pudieron cargar los datos",
        variant: "destructive",
      });
    }

    setLoading(false);
  };

  const resetForm = () => {
    setFormData({
      employeeId: "",
      fecha_inicio: "",
      fecha_fin: "",
      valor_contrato: "",
    });
    setEditingContract(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const contractData = {
      employeeId: formData.employeeId,
      fecha_inicio: formData.fecha_inicio,
      fecha_fin: formData.fecha_fin,
      valor_contrato: parseFloat(formData.valor_contrato),
    };

    try {
      if (editingContract) {
        await apiClient.updateContract(formData.employeeId, editingContract.id, contractData);
        toast({
          title: "Éxito",
          description: "Contrato actualizado correctamente",
        });
      } else {
        await apiClient.createContract(contractData);
        toast({
          title: "Éxito",
          description: "Contrato creado correctamente",
        });
      }
      setDialogOpen(false);
      resetForm();
      fetchData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Ha ocurrido un error",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (contract: Contract) => {
    setEditingContract(contract);
    setFormData({
      employeeId: contract.employeeId,
      fecha_inicio: contract.fecha_inicio,
      fecha_fin: contract.fecha_fin,
      valor_contrato: contract.valor_contrato.toString(),
    });
    setDialogOpen(true);
  };

  const handleDelete = async (contract: Contract) => {
    if (!confirm("¿Está seguro de eliminar este contrato?")) return;
  
    
    try {
      await apiClient.deleteContract(contract.employeeId, contract.id);
      toast({
        title: "Éxito",
        description: "Contrato eliminado correctamente",
      });
      fetchData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudo eliminar el contrato",
        variant: "destructive",
      });
    }
  };
  
  

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
    }).format(amount);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Gestión de Contratos</CardTitle>
            <CardDescription>Administra los contratos de los empleados</CardDescription>
          </div>
          <Dialog open={dialogOpen} onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Nuevo Contrato
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>{editingContract ? "Editar" : "Nuevo"} Contrato</DialogTitle>
                <DialogDescription>
                  {editingContract ? "Actualiza" : "Ingresa"} los datos del contrato
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="employeeId">Empleado *</Label>
                  <Select value={formData.employeeId} onValueChange={(value) => setFormData({ ...formData, employeeId: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar empleado" />
                    </SelectTrigger>
                    <SelectContent>
                      {employees.map((emp) => (
                        <SelectItem key={emp.id} value={emp.id}>
                          {`${emp.nombre} ${emp.apellido}`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fecha_inicio">Fecha Inicio *</Label>
                  <Input
                    id="fecha_inicio"
                    type="date"
                    value={formData.fecha_inicio}
                    onChange={(e) => setFormData({ ...formData, fecha_inicio: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fecha_fin">Fecha Fin *</Label>
                  <Input
                    id="fecha_fin"
                    type="date"
                    value={formData.fecha_fin}
                    onChange={(e) => setFormData({ ...formData, fecha_fin: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="valor_contrato">Valor del Contrato (COP) *</Label>
                  <Input
                    id="valor_contrato"
                    type="number"
                    step="0.01"
                    value={formData.valor_contrato}
                    onChange={(e) => setFormData({ ...formData, valor_contrato: e.target.value })}
                    required
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit">{editingContract ? "Actualizar" : "Crear"}</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-center text-muted-foreground py-8">Cargando contratos...</p>
        ) : contracts.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">No hay contratos registrados</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Empleado</TableHead>
                  <TableHead>Fecha Inicio</TableHead>
                  <TableHead>Fecha Fin</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {contracts.map((contract) => (
                  <TableRow key={contract.id}>
                    <TableCell>
                      {contract.employee 
                        ? `${contract.employee.nombre} ${contract.employee.apellido}`
                        : 'N/A'
                      }
                    </TableCell>
                    <TableCell>{new Date(contract.fecha_inicio).toLocaleDateString("es-CO")}</TableCell>
                    <TableCell>{new Date(contract.fecha_fin).toLocaleDateString("es-CO")}</TableCell>
                    <TableCell>{formatCurrency(contract.valor_contrato)}</TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm" onClick={() => handleEdit(contract)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="destructive" size="sm" onClick={() => handleDelete(contract)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                            
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ContractManagement;
