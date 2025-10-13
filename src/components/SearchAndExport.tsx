import { useState } from "react";
import { apiClient } from "@/integrations/firebase/apiClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";
import { Search, FileDown } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

interface Employee {
  id: string;
  nro_documento: string;
  nombre: string;
  apellido: string;
  cargo?: string;
  correo?: string;
}

interface Contract {
  id: string;
  employeeId: string;
  fecha_inicio: string;
  fecha_fin: string;
  valor_contrato: number;
}

interface SearchResult {
  employee: Employee;
  contracts: Contract[];
}

const SearchAndExport = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResult, setSearchResult] = useState<SearchResult | null>(null);
  const [searching, setSearching] = useState(false);

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      toast({
        title: "Error",
        description: "Por favor ingresa un término de búsqueda",
        variant: "destructive",
      });
      return;
    }

    setSearching(true);

    try {
      // 🔹 Tipamos explícitamente el resultado de la API
      const employees = (await apiClient.getEmployees()) as Employee[];
      console.log("employees:", employees);
      if (!Array.isArray(employees)) {
        throw new Error("La respuesta de empleados no es un arreglo válido");
      }

      const normalize = (str: string | number) =>
        str
          .toString()
          .trim()
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, ""); // elimina tildes
      
      const normalizedSearch = normalize(searchTerm);
      
      const employee = employees.find((emp) => {
        const doc = normalize(emp.nro_documento);
        const name = normalize(emp.nombre);
        const last = normalize(emp.apellido);
        const fullName = `${name} ${last}`; // combinar nombre y apellido
        return (
          doc.includes(normalizedSearch) ||
          name.includes(normalizedSearch) ||
          last.includes(normalizedSearch) ||
          fullName.includes(normalizedSearch) // permite "laura gomez"
        );
      });

      
      console.log("Buscando:", normalizedSearch);
      console.log("Comparando con:", employees.map(e => ({
        doc: normalize(e.nro_documento),
        nombre: normalize(e.nombre),
        apellido: normalize(e.apellido)
      })));

      
      console.log("employee:", employee);

      if (!employee) {
        toast({
          title: "No encontrado",
          description: "No se encontró ningún empleado con ese criterio",
          variant: "destructive",
        });
        setSearchResult(null);
        setSearching(false);
        return;
      }

      // 🔹 Tipamos contratos también
      const contracts = (await apiClient.getContracts()) as Contract[];
      console.log("contracts:", contracts);
      if (!Array.isArray(contracts)) {
        throw new Error("La respuesta de contratos no es un arreglo válido");
      }

      const employeeContracts = contracts.filter(
        (contract) => contract.employeeId === employee.id
      );
      console.log("employeeContracts:", employeeContracts);

      setSearchResult({
        employee,
        contracts: employeeContracts,
      });
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: "Error al realizar la búsqueda",
        variant: "destructive",
      });
    }

    setSearching(false);
  };

  const exportToPDF = () => {
    if (!searchResult) return;

    const doc = new jsPDF();
    const { employee, contracts } = searchResult;

    doc.setFontSize(18);
    doc.text("Reporte de Contratos", 14, 20);

    doc.setFontSize(12);
    doc.text(`Empleado: ${employee.nombre} ${employee.apellido}`, 14, 35);
    doc.text(`Documento: ${employee.nro_documento}`, 14, 42);
    doc.text(`Cargo: ${employee.cargo || "N/A"}`, 14, 49);
    doc.text(`Total de Contratos: ${contracts.length}`, 14, 56);

    const tableData = contracts.map((contract) => [
      new Date(contract.fecha_inicio).toLocaleDateString("es-CO"),
      new Date(contract.fecha_fin).toLocaleDateString("es-CO"),
      new Intl.NumberFormat("es-CO", {
        style: "currency",
        currency: "COP",
      }).format(contract.valor_contrato),
    ]);

    autoTable(doc, {
      head: [["Fecha Inicio", "Fecha Fin", "Valor"]],
      body: tableData,
      startY: 65,
    });

    doc.save(`contratos_${employee.nro_documento}.pdf`);

    toast({
      title: "Éxito",
      description: "Reporte PDF descargado correctamente",
    });
  };

  const exportToExcel = () => {
    if (!searchResult) return;

    const { employee, contracts } = searchResult;

    const data = contracts.map((contract) => ({
      "Nombre Empleado": `${employee.nombre} ${employee.apellido}`,
      "Nro. Documento": employee.nro_documento,
      Cargo: employee.cargo || "",
      Correo: employee.correo || "",
      "Fecha Inicio": new Date(contract.fecha_inicio).toLocaleDateString("es-CO"),
      "Fecha Fin": new Date(contract.fecha_fin).toLocaleDateString("es-CO"),
      "Valor Contrato": contract.valor_contrato,
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Contratos");

    XLSX.writeFile(wb, `contratos_${employee.nro_documento}.xlsx`);

    toast({
      title: "Éxito",
      description: "Reporte Excel descargado correctamente",
    });
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP" }).format(amount);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Búsqueda y Reportes</CardTitle>
        <CardDescription>
          Busca empleados por documento o nombre y exporta sus contratos
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex gap-4">
          <div className="flex-1 space-y-2">
            <Label htmlFor="search">Nro. Documento o Nombre</Label>
            <Input
              id="search"
              placeholder="Ej: 123456789 o Juan Pérez"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            />
          </div>
          <div className="flex items-end">
            <Button onClick={handleSearch} disabled={searching}>
              <Search className="h-4 w-4 mr-2" />
              {searching ? "Buscando..." : "Buscar"}
            </Button>
          </div>
        </div>

        {searchResult && (
          <div className="space-y-4">
            <Card className="bg-accent/20">
              <CardContent className="pt-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Empleado</p>
                    <p className="font-medium">
                      {searchResult.employee.nombre} {searchResult.employee.apellido}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Documento</p>
                    <p className="font-medium">{searchResult.employee.nro_documento}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Cargo</p>
                    <p className="font-medium">{searchResult.employee.cargo}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Contratos</p>
                    <p className="font-medium">{searchResult.contracts.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex gap-2">
              <Button onClick={exportToPDF} variant="outline">
                <FileDown className="h-4 w-4 mr-2" />
                Exportar PDF
              </Button>
              <Button onClick={exportToExcel} variant="outline">
                <FileDown className="h-4 w-4 mr-2" />
                Exportar Excel
              </Button>
            </div>

            {searchResult.contracts.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fecha Inicio</TableHead>
                      <TableHead>Fecha Fin</TableHead>
                      <TableHead>Valor</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {searchResult.contracts.map((contract) => (
                      <TableRow key={contract.id}>
                        <TableCell>
                          {new Date(contract.fecha_inicio).toLocaleDateString("es-CO")}
                        </TableCell>
                        <TableCell>
                          {new Date(contract.fecha_fin).toLocaleDateString("es-CO")}
                        </TableCell>
                        <TableCell>{formatCurrency(contract.valor_contrato)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">
                Este empleado no tiene contratos registrados
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SearchAndExport;
