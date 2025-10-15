import { useState, useEffect } from "react";
import { apiClient } from "@/integrations/firebase/apiClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2 } from "lucide-react";

interface Employee {
  id: string;
  nro_documento: string;
  nombre: string;
  apellido: string;
  edad: number;
  genero: string;
  cargo: string;
  correo: string;
  nro_contacto: string;
  estado: string;
  observaciones: string | null;
}

const EmployeeManagement = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [formData, setFormData] = useState({
    nro_documento: "",
    nombre: "",
    apellido: "",
    edad: "",
    genero: "",
    cargo: "",
    correo: "",
    nro_contacto: "",
    estado: "Activo",
    observaciones: "",
  });

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const employees = await apiClient.getEmployees();
      setEmployees(employees);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "No se pudieron cargar los empleados",
        variant: "destructive",
      });
    }
    setLoading(false);
  };

  const resetForm = () => {
    setFormData({
      nro_documento: "",
      nombre: "",
      apellido: "",
      edad: "",
      genero: "",
      cargo: "",
      correo: "",
      nro_contacto: "",
      estado: "Activo",
      observaciones: "",
    });
    setEditingEmployee(null);
  };

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  // --- Validaciones ---
  const correoRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const soloLetras = /^[A-Za-zÁÉÍÓÚáéíóúÑñ\s]+$/;
  const soloNumeros = /^\d+$/;
  const telefonoRegex = /^\d{7,15}$/;
  const textoValido = /^[A-Za-zÁÉÍÓÚáéíóúÑñ0-9\s.,;:!?()'"-]+$/;

  // Documento
  if (!formData.nro_documento.trim())
    return showError("El número de documento es obligatorio");
  if (!soloNumeros.test(formData.nro_documento))
    return showError("El número de documento solo puede contener dígitos");

  // Nombre
  if (!formData.nombre.trim())
    return showError("El nombre es obligatorio");
  if (!soloLetras.test(formData.nombre))
    return showError("El nombre solo puede contener letras");
  if (formData.nombre.trim().length < 3)
    return showError("El nombre debe tener al menos 3 letras");

  // Apellido
  if (!formData.apellido.trim())
    return showError("El apellido es obligatorio");
  if (!soloLetras.test(formData.apellido))
    return showError("El apellido solo puede contener letras");
  if (formData.apellido.trim().length < 3)
    return showError("El apellido debe tener al menos 3 letras");

  // Edad
  const edad = parseInt(formData.edad);
  if (isNaN(edad) || edad < 18 || edad > 80)
    return showError("La edad debe ser un número entre 18 y 80");

  // Género
  if (!formData.genero)
    return showError("Debe seleccionar un género");

  // Cargo
  if (!formData.cargo)
    return showError("Debe seleccionar un cargo");

  // Correo
  if (!formData.correo.trim())
    return showError("El correo es obligatorio");
  if (!correoRegex.test(formData.correo))
    return showError("El correo electrónico no es válido");

  // Teléfono
  if (!formData.nro_contacto.trim())
    return showError("El número de contacto es obligatorio");
  if (!telefonoRegex.test(formData.nro_contacto))
    return showError("El número de contacto debe tener entre 7 y 15 dígitos");

  // Estado
  if (!formData.estado)
    return showError("Debe seleccionar un estado válido");

  // ✅ Observaciones
  if (formData.observaciones.trim().length > 0) {
    if (formData.observaciones.trim().length < 7)
      return showError("La observación debe tener al menos 7 caracteres");
    if (!textoValido.test(formData.observaciones))
      return showError("La observación solo puede contener texto válido (letras, números, espacios y signos básicos)");
  }

  // --- Si pasa todas las validaciones ---
  const employeeData = { ...formData, edad };

  try {
    if (editingEmployee) {
      await apiClient.updateEmployee(editingEmployee.id, employeeData);
      toast({
        title: "Éxito",
        description: "Empleado actualizado correctamente",
      });
    } else {
      await apiClient.createEmployee(employeeData);
      toast({
        title: "Éxito",
        description: "Empleado creado correctamente",
      });
    }
    setDialogOpen(false);
    resetForm();
    fetchEmployees();
  } catch (error: any) {
    showError(error.message || "Ha ocurrido un error");
  }
};

// función auxiliar para mostrar errores
const showError = (msg: string) => {
  toast({
    title: "Error",
    description: msg,
    variant: "destructive",
  });
};



  const handleEdit = (employee: Employee) => {
    setEditingEmployee(employee);
    setFormData({
      nro_documento: employee.nro_documento,
      nombre: employee.nombre,
      apellido: employee.apellido,
      edad: employee.edad.toString(),
      genero: employee.genero,
      cargo: employee.cargo,
      correo: employee.correo,
      nro_contacto: employee.nro_contacto,
      estado: employee.estado,
      observaciones: employee.observaciones || "",
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Está seguro de eliminar este empleado?")) return;

    try {
      await apiClient.deleteEmployee(id);
      toast({
        title: "Éxito",
        description: "Empleado eliminado correctamente",
      });
      fetchEmployees();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudo eliminar el empleado",
        variant: "destructive",
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Gestión de Empleados</CardTitle>
            <CardDescription>Administra la información de los empleados del molino</CardDescription>
          </div>
          <Dialog open={dialogOpen} onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Nuevo Empleado
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingEmployee ? "Editar" : "Nuevo"} Empleado</DialogTitle>
                <DialogDescription>
                  {editingEmployee ? "Actualiza" : "Ingresa"} los datos del empleado
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="nro_documento">Nro. Documento *</Label>
                    <Input
                      id="nro_documento"
                      value={formData.nro_documento}
                      onChange={(e) => setFormData({ ...formData, nro_documento: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edad">Edad *</Label>
                    <Input
                      id="edad"
                      type="number"
                      value={formData.edad}
                      onChange={(e) => setFormData({ ...formData, edad: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="nombre">Nombre *</Label>
                    <Input
                      id="nombre"
                      value={formData.nombre}
                      onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="apellido">Apellido *</Label>
                    <Input
                      id="apellido"
                      value={formData.apellido}
                      onChange={(e) => setFormData({ ...formData, apellido: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="genero">Género *</Label>
                    <Select value={formData.genero} onValueChange={(value) => setFormData({ ...formData, genero: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Masculino">Masculino</SelectItem>
                        <SelectItem value="Femenino">Femenino</SelectItem>
                        <SelectItem value="Otro">Otro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cargo">Cargo *</Label>
                    <Select value={formData.cargo} onValueChange={(value) => setFormData({ ...formData, cargo: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Gerente General">Gerente General</SelectItem>
                        <SelectItem value="Jefe de Producción">Jefe de Producción</SelectItem>
                        <SelectItem value="Operario de Molino">Operario de Molino</SelectItem>
                        <SelectItem value="Operario de Empaque">Operario de Empaque</SelectItem>
                        <SelectItem value="Técnico de Mantenimiento">Técnico de Mantenimiento</SelectItem>
                        <SelectItem value="Supervisor de Calidad">Supervisor de Calidad</SelectItem>
                        <SelectItem value="Contador">Contador</SelectItem>
                        <SelectItem value="Auxiliar Administrativo">Auxiliar Administrativo</SelectItem>
                        <SelectItem value="Conductor">Conductor</SelectItem>
                        <SelectItem value="Auxiliar de Bodega">Auxiliar de Bodega</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="correo">Correo *</Label>
                    <Input
                      id="correo"
                      type="email"
                      value={formData.correo}
                      onChange={(e) => setFormData({ ...formData, correo: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="nro_contacto">Nro. Contacto *</Label>
                    <Input
                      id="nro_contacto"
                      value={formData.nro_contacto}
                      onChange={(e) => setFormData({ ...formData, nro_contacto: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="estado">Estado *</Label>
                    <Select value={formData.estado} onValueChange={(value) => setFormData({ ...formData, estado: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Activo">Activo</SelectItem>
                        <SelectItem value="Inactivo">Inactivo</SelectItem>
                        <SelectItem value="Vacaciones">Vacaciones</SelectItem>
                        <SelectItem value="Incapacitado">Incapacitado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="observaciones">Observaciones</Label>
                  <Textarea
                    id="observaciones"
                    value={formData.observaciones}
                    onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
                    rows={3}
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit">{editingEmployee ? "Actualizar" : "Crear"}</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-center text-muted-foreground py-8">Cargando empleados...</p>
        ) : employees.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">No hay empleados registrados</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Documento</TableHead>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Edad</TableHead>
                  <TableHead>Género</TableHead>
                  <TableHead>Cargo</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {employees.map((employee) => (
                  <TableRow key={employee.id}>
                    <TableCell>{employee.nro_documento}</TableCell>
                    <TableCell>{`${employee.nombre} ${employee.apellido}`}</TableCell>
                    <TableCell>{employee.edad}</TableCell>
                    <TableCell>{employee.genero}</TableCell>
                    <TableCell>{employee.cargo}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        employee.estado === "Activo" ? "bg-success/20 text-success" : "bg-muted text-muted-foreground"
                      }`}>
                        {employee.estado}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm" onClick={() => handleEdit(employee)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="destructive" size="sm" onClick={() => handleDelete(employee.id)}>
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

export default EmployeeManagement;
