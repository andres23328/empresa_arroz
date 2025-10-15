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
  const [searchResult, setSearchResult] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);

  const normalize = (str: string | number) =>
    str
      .toString()
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");

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
      const employees = (await apiClient.getEmployees()) as Employee[];
      const contracts = (await apiClient.getContracts()) as Contract[];

      const normalizedSearch = normalize(searchTerm);

      // 🔹 Filtrar empleados cuyo nombre, apellido o documento EMPIECE con el texto buscado
      const matchedEmployees = employees.filter((emp) => {
        const doc = normalize(emp.nro_documento);
        const name = normalize(emp.nombre);
        const last = normalize(emp.apellido);

        return (
          doc.startsWith(normalizedSearch) ||
          name.startsWith(normalizedSearch) ||
          last.startsWith(normalizedSearch)
        );
      });

      if (matchedEmployees.length === 0) {
        toast({
          title: "No encontrado",
          description: "No se encontró ningún empleado con ese criterio",
          variant: "destructive",
        });
        setSearchResult([]);
        setSearching(false);
        return;
      }

      // 🔹 Mapear contratos por empleado
      const results: SearchResult[] = matchedEmployees.map((employee) => ({
        employee,
        contracts: contracts.filter((contract) => contract.employeeId === employee.id),
      }));

      setSearchResult(results);
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

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP" }).format(amount);

  const exportToPDF = (employee: Employee, contracts: Contract[]) => {
    const doc = new jsPDF();
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
      formatCurrency(contract.valor_contrato),
    ]);

    autoTable(doc, {
      head: [["Fecha Inicio", "Fecha Fin", "Valor"]],
      body: tableData,
      startY: 65,
    });

    doc.save(`contratos_${employee.nro_documento}.pdf`);
    toast({
      title: "Éxito",
      description: `PDF de ${employee.nombre} descargado correctamente`,
    });
  };

  const exportToExcel = (employee: Employee, contracts: Contract[]) => {
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
      description: `Excel de ${employee.nombre} descargado correctamente`,
    });
  };

  // 🔹 NUEVO: Exportar todos los empleados (PDF)
  const exportAllToPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text("Reporte de Contratos - Todos los Empleados", 14, 20);

    let currentY = 30;

    searchResult.forEach((result, index) => {
      const { employee, contracts } = result;

      doc.setFontSize(12);
      doc.text(`${index + 1}. ${employee.nombre} ${employee.apellido}`, 14, currentY);
      doc.text(`Documento: ${employee.nro_documento}`, 14, currentY + 7);
      doc.text(`Cargo: ${employee.cargo || "N/A"}`, 14, currentY + 14);
      doc.text(`Total de Contratos: ${contracts.length}`, 14, currentY + 21);

      const tableData = contracts.map((contract) => [
        new Date(contract.fecha_inicio).toLocaleDateString("es-CO"),
        new Date(contract.fecha_fin).toLocaleDateString("es-CO"),
        formatCurrency(contract.valor_contrato),
      ]);

      autoTable(doc, {
        head: [["Fecha Inicio", "Fecha Fin", "Valor"]],
        body: tableData,
        startY: currentY + 28,
      });

      currentY = (doc as any).lastAutoTable.finalY + 15;
    });

    doc.save("reporte_general_empleados.pdf");
    toast({
      title: "Éxito",
      description: "PDF general descargado correctamente",
    });
  };

  // 🔹 NUEVO: Exportar todos los empleados (Excel)
  const exportAllToExcel = () => {
    const data: any[] = [];

    searchResult.forEach((result) => {
      const { employee, contracts } = result;
      contracts.forEach((contract) => {
        data.push({
          "Nombre Empleado": `${employee.nombre} ${employee.apellido}`,
          "Nro. Documento": employee.nro_documento,
          Cargo: employee.cargo || "",
          Correo: employee.correo || "",
          "Fecha Inicio": new Date(contract.fecha_inicio).toLocaleDateString("es-CO"),
          "Fecha Fin": new Date(contract.fecha_fin).toLocaleDateString("es-CO"),
          "Valor Contrato": contract.valor_contrato,
        });
      });
    });

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Contratos");

    XLSX.writeFile(wb, `reporte_general_empleados.xlsx`);
    toast({
      title: "Éxito",
      description: "Excel general descargado correctamente",
    });
  };

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
            <Label htmlFor="search">Nro. Documento, Nombre o Apellido</Label>
            <Input
              id="search"
              placeholder="Ej: 123456789 o Alejandro Suarez"
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

        {/* 🔹 Botones globales si hay más de un resultado */}
        {searchResult.length > 1 && (
          <div className="flex justify-center gap-4 mt-4">
            <Button onClick={exportAllToPDF} variant="outline">
              <FileDown className="h-4 w-4 mr-2" />
              Exportar Todo (PDF)
            </Button>
            <Button onClick={exportAllToExcel} variant="outline">
              <FileDown className="h-4 w-4 mr-2" />
              Exportar Todo (Excel)
            </Button>
          </div>
        )}

        {searchResult.length > 0 ? (
          searchResult.map((result) => (
            <Card key={result.employee.id} className="bg-accent/20 mt-4">
              <CardContent className="pt-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Empleado</p>
                    <p className="font-medium">
                      {result.employee.nombre} {result.employee.apellido}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Documento</p>
                    <p className="font-medium">{result.employee.nro_documento}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Cargo</p>
                    <p className="font-medium">{result.employee.cargo || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Contratos</p>
                    <p className="font-medium">{result.contracts.length}</p>
                  </div>
                </div>

                <div className="flex gap-2 mt-4">
                  <Button
                    onClick={() =>
                      exportToPDF(result.employee, result.contracts)
                    }
                    variant="outline"
                  >
                    <FileDown className="h-4 w-4 mr-2" />
                    Exportar PDF
                  </Button>
                  <Button
                    onClick={() =>
                      exportToExcel(result.employee, result.contracts)
                    }
                    variant="outline"
                  >
                    <FileDown className="h-4 w-4 mr-2" />
                    Exportar Excel
                  </Button>
                </div>

                {result.contracts.length > 0 ? (
                  <div className="overflow-x-auto mt-4">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Fecha Inicio</TableHead>
                          <TableHead>Fecha Fin</TableHead>
                          <TableHead>Valor</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {result.contracts.map((contract) => (
                          <TableRow key={contract.id}>
                            <TableCell>
                              {new Date(
                                contract.fecha_inicio
                              ).toLocaleDateString("es-CO")}
                            </TableCell>
                            <TableCell>
                              {new Date(
                                contract.fecha_fin
                              ).toLocaleDateString("es-CO")}
                            </TableCell>
                            <TableCell>
                              {formatCurrency(contract.valor_contrato)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-4">
                    Este empleado no tiene contratos registrados
                  </p>
                )}
              </CardContent>
            </Card>
          ))
        ) : (
          <p className="text-center text-muted-foreground py-8">
            Ingresa un término de búsqueda para ver resultados
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default SearchAndExport;
