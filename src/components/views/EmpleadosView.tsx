import { useState, useMemo, useEffect } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Badge } from '../ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '../ui/card';
import { Search, X, UserPlus, UserCheck, UserX, DollarSign, Settings, Briefcase } from 'lucide-react';
import { cn } from '../ui/utils';
import { toast } from 'sonner';
import { fetchApi } from '../../lib/api'; // Conexión API real

export function EmpleadosView() {
  const [empleados, setEmpleados] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // --- Employee Management State ---
  const [employeeFormData, setEmployeeFormData] = useState({
    nombre: '',
    apellido: '',
    cargo: 'Barbero',
    telefono: '',
    email: '',
    estado: 'Activo',
    tipo_esquema: 'comision',
    porcentaje_comision: 60,
    porcentaje_dueno: 40,
    pago_silla_semanal: 0,
  });
  
  const [editingEmployee, setEditingEmployee] = useState<any | null>(null);
  const [showEmployeeForm, setShowEmployeeForm] = useState(false);
  const [employeeSearch, setEmployeeSearch] = useState('');

  // --- FETCH DATA ---
  const fetchEmpleados = async () => {
    setLoading(true);
    try {
      const response = await fetchApi('/employees');
      if (response.success) {
        setEmpleados(response.data);
      }
    } catch (error) {
      toast.error('Error al cargar barberos de la BD');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmpleados();
  }, []);

  const filteredEmployees = useMemo(() => {
    if (!employeeSearch.trim()) return empleados;
    return empleados.filter(e =>
      (e.nombre || '').toLowerCase().includes(employeeSearch.toLowerCase()) ||
      (e.apellido || '').toLowerCase().includes(employeeSearch.toLowerCase())
    );
  }, [empleados, employeeSearch]);

  const handleEmployeeCreate = () => {
    setEditingEmployee(null);
    setEmployeeFormData({
      nombre: '', apellido: '', cargo: 'Barbero', telefono: '', email: '',
      estado: 'Activo', tipo_esquema: 'porcentaje', porcentaje_comision: 60,
      porcentaje_dueno: 40, pago_silla_semanal: 0,
    });
    setShowEmployeeForm(true);
    window.scrollTo(0, 0);
  };

  const handleEmployeeEdit = (emp: any) => {
    setEditingEmployee(emp);
    setEmployeeFormData({
      nombre: emp.nombre || '',
      apellido: emp.apellido || '',
      cargo: emp.cargo || 'Barbero',
      telefono: emp.telefono || '',
      email: emp.email || '',
      estado: emp.estado || 'Activo',
      tipo_esquema: emp.tipo_esquema === 'alquiler' ? 'silla' : 'comision',
      porcentaje_comision: emp.porcentaje_comision || 0,
      porcentaje_dueno: 100 - (emp.porcentaje_comision || 0),
      pago_silla_semanal: emp.pago_silla_semanal || 0,
    });
    setShowEmployeeForm(true);
    window.scrollTo(0, 0);
  };

  const handleEmployeeSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (employeeFormData.tipo_esquema === 'comision') {
      const com = employeeFormData.porcentaje_comision || 0;
      const due = employeeFormData.porcentaje_dueno || 0;
      if (com + due !== 100) return toast.error('La suma de porcentajes debe ser 100%');
    }

    // Adaptar nombres para la BD
    const payload = {
        ...employeeFormData,
        tipo_esquema: employeeFormData.tipo_esquema === 'silla' ? 'alquiler' : 'porcentaje'
    };

    try {
        if (editingEmployee) {
            await fetchApi(`/employees/${editingEmployee.id_empleado}`, {
                method: 'PUT',
                body: JSON.stringify(payload)
            });
            toast.success('Perfil de barbero actualizado');
        } else {
            await fetchApi('/employees', {
                method: 'POST',
                body: JSON.stringify(payload)
            });
            toast.success('Nuevo barbero registrado');
        }
        setShowEmployeeForm(false);
        fetchEmpleados();
    } catch (error: any) {
        toast.error(error.message || 'Error guardando barbero');
    }
  };

  const toggleEmployeeStatus = async (emp: any) => {
    const newStatus = emp.estado === 'Activo' ? 'Inactivo' : 'Activo';
    try {
        await fetchApi(`/employees/${emp.id_empleado}/status`, {
            method: 'PUT',
            body: JSON.stringify({ estado: newStatus })
        });
        toast.success(`Barbero marcado como ${newStatus}`);
        fetchEmpleados();
    } catch (e) {
        toast.error('Error cambiando el estado');
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-[1600px] mx-auto w-full space-y-8 h-full">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold">
            <Briefcase className="w-6 h-6 text-[#D4AF37]" />
            Gestión de Empleados
          </h1>
          <p className="text-muted-foreground">Configura los barberos y esquemas de pago.</p>
        </div>
      </div>

      <div className="space-y-8 animate-in fade-in duration-500">
        {showEmployeeForm ? (
          <Card className="border-2 border-[#D4AF37]/20 shadow-2xl">
            <CardHeader className="bg-muted/20 border-b pb-6">
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="text-2xl font-black">{editingEmployee ? `Editar: ${editingEmployee.nombre}` : 'Nuevo Barbero'}</CardTitle>
                  <CardDescription>Define el esquema de pago y datos del profesional</CardDescription>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setShowEmployeeForm(false)}><X /></Button>
              </div>
            </CardHeader>
            <form onSubmit={handleEmployeeSave}>
              <CardContent className="p-8 space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-[#D4AF37] border-b pb-2">Datos Personales</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2"><Label>Nombre *</Label><Input required value={employeeFormData.nombre} onChange={e => setEmployeeFormData({ ...employeeFormData, nombre: e.target.value })} /></div>
                      <div className="space-y-2"><Label>Apellido (Opcional)</Label><Input value={employeeFormData.apellido} onChange={e => setEmployeeFormData({ ...employeeFormData, apellido: e.target.value })} /></div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2"><Label>Email</Label><Input type="email" value={employeeFormData.email} onChange={e => setEmployeeFormData({ ...employeeFormData, email: e.target.value })} disabled={!!editingEmployee} /></div>
                      <div className="space-y-2"><Label>Teléfono</Label><Input value={employeeFormData.telefono} onChange={e => setEmployeeFormData({ ...employeeFormData, telefono: e.target.value })} /></div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-[#D4AF37] border-b pb-2">Esquema de Pago</h3>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Tipo de Pago *</Label>
                        <Select value={employeeFormData.tipo_esquema} onValueChange={v => setEmployeeFormData({ ...employeeFormData, tipo_esquema: v as any })}>
                          <SelectTrigger className="h-11"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="comision">Porcentaje (Comisión)</SelectItem>
                            <SelectItem value="silla">Alquiler Silla (Fijo)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {employeeFormData.tipo_esquema === 'comision' ? (
                        <div className="grid grid-cols-2 gap-4 animate-in slide-in-from-left-2">
                          <div className="space-y-2">
                            <Label>Comisión Barbero %</Label>
                            <Input type="number" min="0" max="100" value={employeeFormData.porcentaje_comision} onChange={e => setEmployeeFormData({ ...employeeFormData, porcentaje_comision: parseInt(e.target.value), porcentaje_dueno: 100 - parseInt(e.target.value) })} />
                          </div>
                          <div className="space-y-2">
                            <Label>Negocio %</Label>
                            <Input type="number" disabled value={employeeFormData.porcentaje_dueno} />
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-2 animate-in slide-in-from-right-2">
                          <Label>Valor Alquiler (No guardado en DB aún)</Label>
                          <div className="relative">
                            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input type="number" className="pl-10" value={employeeFormData.pago_silla_semanal} onChange={e => setEmployeeFormData({ ...employeeFormData, pago_silla_semanal: parseInt(e.target.value) })} disabled />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="bg-muted/30 p-8 flex justify-end gap-3 border-t mt-4">
                <Button type="button" variant="outline" onClick={() => setShowEmployeeForm(false)}>Cancelar</Button>
                <Button type="submit" className="bg-[#D4AF37] text-black px-8 font-bold hover:bg-[#B8941F]">Guardar Barbero</Button>
              </CardFooter>
            </form>
          </Card>
        ) : (
          <>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
              <div className="relative w-full md:w-96">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Buscar barbero..." value={employeeSearch} onChange={e => setEmployeeSearch(e.target.value)} className="pl-10" />
              </div>
              <Button onClick={handleEmployeeCreate} className="bg-[#D4AF37] hover:bg-[#B8941F] text-black shadow-md hover:shadow-[#D4AF37]/20 transition-all">
                <UserPlus className="w-4 h-4 mr-2" /> Nuevo barbero
              </Button>
            </div>

            {loading ? <p className="text-center text-muted-foreground py-10">Cargando barberos...</p> : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 pb-20">
                {filteredEmployees.map(emp => (
                  <Card key={emp.id_empleado} className={cn("hover:shadow-lg transition-all border-l-4 h-full flex flex-col", emp.estado === 'Activo' ? "border-l-green-500" : "border-l-gray-300")}>
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center font-bold text-lg uppercase">
                            {emp.nombre ? emp.nombre[0] : 'B'}
                          </div>
                          <div>
                            <CardTitle className="text-lg">{emp.nombre}</CardTitle>
                            <CardDescription>{emp.cargo}</CardDescription>
                          </div>
                        </div>
                        <Badge variant={emp.estado === 'Activo' ? 'default' : 'secondary'} className={cn(emp.estado === 'Activo' ? "bg-green-100 text-green-700" : "")}>
                          {emp.estado}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4 pt-4 flex-1">
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="flex flex-col gap-1">
                          <span className="text-muted-foreground uppercase font-bold text-[9px]">Esquema</span>
                          <span className="font-bold flex items-center gap-1">
                            {emp.tipo_esquema === 'porcentaje' ? <DollarSign className="w-3 h-3" /> : <Briefcase className="w-3 h-3" />}
                            {emp.tipo_esquema?.toUpperCase() || 'NO DEFINIDO'}
                          </span>
                        </div>
                        <div className="flex flex-col gap-1">
                          <span className="text-muted-foreground uppercase font-bold text-[9px]">Detalle</span>
                          <span className="font-bold">
                            {emp.tipo_esquema === 'porcentaje' ? `${emp.porcentaje_comision || 0}%` : `Fijo`}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="border-t bg-muted/10 p-4 flex justify-between mt-auto">
                      <Button variant="ghost" size="sm" onClick={() => handleEmployeeEdit(emp)}><Settings className="w-4 h-4 mr-2" /> Configurar</Button>
                      <Button variant="ghost" size="sm" className={cn(emp.estado === 'Activo' ? "text-red-500" : "text-green-600")} onClick={() => toggleEmployeeStatus(emp)}>
                        {emp.estado === 'Activo' ? <UserX className="w-4 h-4 mr-2" /> : <UserCheck className="w-4 h-4 mr-2" />}
                        {emp.estado === 'Activo' ? 'Inactivar' : 'Activar'}
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}