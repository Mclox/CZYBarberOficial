import { useState, useEffect, useMemo } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../ui/alert-dialog';
import { Badge } from '../ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '../ui/card';
import {
  Plus,
  Pencil,
  Trash2,
  Search,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  ChevronLeft,
  ChevronRight,
  Calendar,
  User
} from 'lucide-react';
import { mockServicios, mockEmpleados, mockClientes, Cita } from '../../shared/lib/mockData';
import { dataStore } from '../../shared/lib/dataStore';
import { useAuth } from '../../features/auth';
import { toast } from 'sonner';
// --- Utility Functions (Defined outside to avoid TDZ and keep component clean) ---

const parseTimeToMinutes = (time: string) => {
  if (!time) return 0;
  const [hh, mm] = time.split(':').map(Number);
  return hh * 60 + mm;
};

const computeServiciosDuration = (cita: any) => {
  const ids: number[] = cita.id_servicios?.length ? cita.id_servicios : (cita.id_servicio ? [cita.id_servicio] : []);
  if (ids.length === 0) return 30; // default 30 minutes
  return ids.reduce((sum, id) => {
    const s = mockServicios.find(ser => ser.id_servicio === id);
    return sum + (s?.duracion || 30);
  }, 0);
};

const getServicioName = (id: number) => {
  return mockServicios.find(s => s.id_servicio === id)?.nombre || 'N/A';
};

const getEmpleadoName = (id?: number) => {
  if (!id || id === 0) return 'Por asignar';
  const empleado = mockEmpleados.find(e => e.id_empleado === id);
  return empleado ? `${empleado.nombre} ${empleado.apellido}` : 'N/A';
};

const formatDuration = (minutes: number) => {
  if (!minutes) return '0 min';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h > 0 ? `${h}h ${m}m` : `${m} min`;
};

const getNextCitaId = () => {
  return Math.max(...dataStore.citas.map(c => c.id_cita), 0) + 1;
};

const timeSlots = [
  '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '12:00', '12:30', '14:00', '14:30', '15:00', '15:30',
  '16:00', '16:30', '17:00', '17:30', '18:00', '18:30'
];

const getClienteName = (id: number, idTemp?: number) => {
  if (idTemp) {
    const temp = dataStore.clientesTemporales.find(c => c.id_cliente_temporal === idTemp);
    return temp ? `${temp.nombre} (Temporal)` : 'Desconocido';
  }
  const cliente = mockClientes.find(c => c.id_cliente === id);
  return cliente ? `${cliente.nombre} ${cliente.apellido}` : 'Desconocido';
};

const formatServicios = (cita: any) => {
  const ids: number[] = cita.id_servicios?.length ? cita.id_servicios : (cita.id_servicio ? [cita.id_servicio] : []);
  if (ids.length === 0) return 'Sin servicio';
  const names = ids.map(id => mockServicios.find(s => s.id_servicio === id)?.nombre || 'N/A');
  if (names.length > 2) return `${names.slice(0, 2).join(', ')}... (+${names.length - 2})`;
  return names.join(', ');
};

const hasConflict = (empId: number | undefined, fecha: string, hora: string, excludingId?: number) => {
  if (!empId) return false;
  const start = parseTimeToMinutes(hora);

  // Encontrar la cita si es que existe para determinar duración si es edición,
  // pero para nuevas citas necesitamos calcular en base a la lógica de servicios.
  // Sin embargo, hasConflict se usa en handleSubmit, donde ya tenemos la duración actual o nueva.
  // Para simplificar, usaremos una duración promedio o buscaremos en dataStore si es edición.

  // Realmente necesitamos conocer la duración de la cita que se está intentando agendar.
  // Pero hasConflict aquí solo recibe hora/fecha.
  // Verificaremos contra todas las citas en dataStore.
  const duration = 30; // Valor por defecto si no se conoce, pero idealmente debería pasarse.
  const end = start + duration;

  return dataStore.citas.some(c => {
    if (c.id_empleado !== empId || c.fecha !== fecha || c.id_cita === excludingId) return false;
    const cStart = parseTimeToMinutes(c.hora);
    const cDuration = computeServiciosDuration(c);
    const cEnd = cStart + cDuration;
    return start < cEnd && cStart < end;
  });
};

const getClienteEmail = (id_cliente: number, id_cliente_temporal?: number) => {
  if (id_cliente_temporal) {
    return dataStore.clientesTemporales.find(c => c.id_cliente_temporal === id_cliente_temporal)?.email || '';
  }
  return dataStore.clientes.find(c => c.id_cliente === id_cliente)?.email || '';
};

const getClienteTelefono = (id_cliente: number, id_cliente_temporal?: number) => {
  if (id_cliente_temporal) {
    return dataStore.clientesTemporales.find(c => c.id_cliente_temporal === id_cliente_temporal)?.telefono || '';
  }
  return dataStore.clientes.find(c => c.id_cliente === id_cliente)?.telefono || '';
};

const computeServiciosPrice = (cita: any) => {
  const ids: number[] = cita.id_servicios?.length ? cita.id_servicios : (cita.id_servicio ? [cita.id_servicio] : []);
  return ids.reduce((sum, id) => sum + (mockServicios.find(s => s.id_servicio === id)?.precio || 0), 0);
};

export function CitasView() {
  const { user } = useAuth();

  // Single source of truth for triggering re-renders when dataStore changes
  const [refreshKey, setRefreshKey] = useState(0);
  const refreshData = () => setRefreshKey((prev: number) => prev + 1);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingCita, setEditingCita] = useState<Cita | null>(null);
  const [viewingCita, setViewingCita] = useState<Cita | null>(null);
  const [citaToDelete, setCitaToDelete] = useState<number | null>(null);
  const [searchTerm, _setSearchTerm] = useState('');

  const [formData, setFormData] = useState({
    id_cliente: '',
    id_servicio: '',
    id_servicios: [] as string[],
    id_empleado: '',
    fecha: '',
    hora: '',
    estado: 'pendiente' as 'pendiente' | 'confirmada' | 'completada' | 'cancelada',
    observaciones: '',
  });

  const [calendarMonth, setCalendarMonth] = useState(() => {
    const d = new Date();
    d.setDate(1);
    return d;
  });

  const [calendarEmpleadoFilter, setCalendarEmpleadoFilter] = useState<string>(() => {
    try {
      return localStorage.getItem('calendarEmpleadoFilter') || 'all';
    } catch (e) {
      return 'all';
    }
  });

  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [dayDialogOpen, setDayDialogOpen] = useState(false);

  // Permisos basados en rol
  const isAdmin = user?.id_rol === 1;
  const isBarbero = user?.id_rol === 2;
  const isCliente = user?.id_rol === 3;

  // Optimized grouped data
  const { displayCitas, citasByDate, stats } = useMemo(() => {
    // 1. Base list by role
    let list = dataStore.citas;
    if (isCliente) {
      const clienteRecord = dataStore.clientes.find(c => c.email === user?.email);
      list = list.filter(c => c.id_cliente === clienteRecord?.id_cliente);
    } else if (isBarbero) {
      const empleadoRecord = dataStore.empleados.find(e => e.email === user?.email);
      list = list.filter(c => c.id_empleado === empleadoRecord?.id_empleado);
    }

    // 2. Further filtering by Barbero filter (Calendar synchronization)
    let calendarList = list;
    if (calendarEmpleadoFilter && calendarEmpleadoFilter !== 'all') {
      const empId = parseInt(calendarEmpleadoFilter);
      calendarList = calendarList.filter(c => c.id_empleado === empId);
    }

    // 3. Stats based on filtered list (by role + barbero filter)
    const statsObj = {
      pendiente: calendarList.filter(c => c.estado === 'pendiente').length,
      confirmada: calendarList.filter(c => c.estado === 'confirmada').length,
      completada: calendarList.filter(c => c.estado === 'completada').length,
      cancelada: calendarList.filter(c => c.estado === 'cancelada').length,
    };

    // 4. Search results
    const term = searchTerm.toLowerCase();
    const searched = list.filter(cita => {
      if (!term) return true;
      const clienteName = getClienteName(cita.id_cliente, cita.id_cliente_temporal).toLowerCase();
      const sName = getServicioName(cita.id_servicio).toLowerCase();
      const eName = getEmpleadoName(cita.id_empleado).toLowerCase();
      return clienteName.includes(term) || sName.includes(term) || eName.includes(term) ||
        cita.id_cita.toString().includes(term) || cita.fecha.includes(term) || cita.estado.toLowerCase().includes(term);
    });

    // 5. Group by date for calendar efficiency
    const byDate: Record<string, Cita[]> = {};
    calendarList.forEach(c => {
      if (!byDate[c.fecha]) byDate[c.fecha] = [];
      byDate[c.fecha].push(c);
    });

    return {
      displayCitas: searched,
      citasByDate: byDate,
      stats: statsObj
    };
  }, [user, searchTerm, calendarEmpleadoFilter, refreshKey]);

  // Sync calendar with editing/form date
  useEffect(() => {
    const targetDate = editingCita?.fecha || formData.fecha;
    if (targetDate) {
      const d = new Date(targetDate + 'T00:00:00');
      if (!isNaN(d.getTime())) {
        setSelectedDate(targetDate);
        if (d.getMonth() !== calendarMonth.getMonth() || d.getFullYear() !== calendarMonth.getFullYear()) {
          setCalendarMonth(new Date(d.getFullYear(), d.getMonth(), 1));
        }
      }
    }
  }, [editingCita?.fecha, formData.fecha]);

  // Persist filter
  useEffect(() => {
    try {
      localStorage.setItem('calendarEmpleadoFilter', calendarEmpleadoFilter);
    } catch (e) { }
  }, [calendarEmpleadoFilter]);

  const handleCreate = () => {
    const baseData = {
      id_cliente: '',
      id_servicio: '',
      id_servicios: [],
      id_empleado: '',
      fecha: '',
      hora: '',
      estado: 'pendiente' as const,
      observaciones: '',
    };

    if (isCliente) {
      const clienteRecord = dataStore.clientes.find(c => c.email === user?.email);
      if (!clienteRecord) {
        toast.error('No se encontró el registro de cliente');
        return;
      }
      baseData.id_cliente = clienteRecord.id_cliente.toString();
    }

    setEditingCita(null);
    setFormData(baseData);
    setDialogOpen(true);
  };

  const handleEdit = (cita: Cita) => {
    if (isCliente) {
      toast.error('No tienes permisos para editar citas');
      return;
    }
    setEditingCita(cita);
    setFormData({
      id_cliente: cita.id_cliente.toString(),
      id_servicio: cita.id_servicio ? cita.id_servicio.toString() : '',
      id_servicios: cita.id_servicios ? cita.id_servicios.map(s => s.toString()) : (cita.id_servicio ? [cita.id_servicio.toString()] : []),
      id_empleado: cita.id_empleado?.toString() || '',
      fecha: cita.fecha,
      hora: cita.hora,
      estado: cita.estado,
      observaciones: cita.observaciones || '',
    });
    setDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    if (isCliente) {
      toast.error('No tienes permisos para eliminar citas');
      return;
    }
    setCitaToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (citaToDelete) {
      const index = dataStore.citas.findIndex(c => c.id_cita === citaToDelete);
      if (index !== -1) {
        dataStore.citas.splice(index, 1);
        refreshData();
        toast.success('Cita eliminada correctamente');
      }
    }
    setDeleteDialogOpen(false);
    setCitaToDelete(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // 1. Validaciones de campos obligatorios
    if (!formData.id_cliente) {
      toast.error('Por favor, selecciona un cliente.');
      return;
    }
    if ((!formData.id_servicios || formData.id_servicios.length === 0) && !formData.id_servicio) {
      toast.error('Por favor, selecciona al menos un servicio.');
      return;
    }
    if (!formData.id_empleado || formData.id_empleado === '0') {
      toast.error('Por favor, selecciona un barbero.');
      return;
    }
    if (!formData.fecha) {
      toast.error('Por favor, selecciona una fecha.');
      return;
    }
    if (!formData.hora) {
      toast.error('Por favor, selecciona una hora.');
      return;
    }

    // 2. Validación de conflictos de horario
    const empleadoId = parseInt(formData.id_empleado);
    if (hasConflict(empleadoId, formData.fecha, formData.hora, editingCita?.id_cita)) {
      toast.error('El barbero seleccionado ya tiene una cita en ese horario. Por favor elige otra hora.');
      return;
    }

    // Preparar datos comunes
    const firstServiceId = (formData.id_servicios || []).length
      ? parseInt((formData.id_servicios || [])[0])
      : (formData.id_servicio ? parseInt(formData.id_servicio) : 0);

    const commonData = {
      id_cliente: parseInt(formData.id_cliente),
      id_servicio: firstServiceId,
      id_servicios: (formData.id_servicios || []).length ? (formData.id_servicios || []).map(s => parseInt(s)) : [firstServiceId],
      id_empleado: empleadoId,
      fecha: formData.fecha,
      hora: formData.hora,
      estado: formData.estado as Cita['estado'],
      observaciones: formData.observaciones,
    };

    if (editingCita) {
      const index = dataStore.citas.findIndex(c => c.id_cita === editingCita.id_cita);
      if (index !== -1) {
        dataStore.citas[index] = { ...dataStore.citas[index], ...commonData };
        toast.success('Cita actualizada correctamente');
      }
    } else {
      const newCita: Cita = {
        id_cita: getNextCitaId(),
        ...commonData,
      };
      dataStore.citas.push(newCita);
      toast.success('Cita creada correctamente');
    }

    refreshData();
    setDialogOpen(false);
  };

  const handleStatusChange = (id: number, status: Cita['estado']) => {
    const index = dataStore.citas.findIndex(c => c.id_cita === id);
    if (index !== -1) {
      dataStore.citas[index].estado = status;
      refreshData();
      toast.success(`Cita ${status}`);
    }
  };

  const handleConfirm = (id: number) => handleStatusChange(id, 'confirmada');
  const handleComplete = (id: number) => handleStatusChange(id, 'completada');
  const handleCancel = (id: number) => handleStatusChange(id, 'cancelada');

  const handleViewDetails = (cita: Cita) => {
    setViewingCita(cita);
    setDetailsDialogOpen(true);
  };

  useEffect(() => {
    if (!isCliente) return;
    const clienteRecord = dataStore.clientes.find(c => c.email === user?.email);
    if (!clienteRecord) return;
    const counts: Record<number, number> = {};
    dataStore.citas.forEach(c => {
      if (c.id_cliente === clienteRecord.id_cliente && c.id_empleado) {
        counts[c.id_empleado] = (counts[c.id_empleado] || 0) + 1;
      }
    });
    const entries = Object.entries(counts);
    if (entries.length === 0) return;
    entries.sort((a, b) => b[1] - a[1]);
    const topEmpleado = entries[0][0];
    try {
      const saved = localStorage.getItem('calendarEmpleadoFilter');
      if (!saved) setCalendarEmpleadoFilter(topEmpleado.toString());
    } catch (e) {
      setCalendarEmpleadoFilter(topEmpleado.toString());
    }
  }, [isCliente, user?.email]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('prefillReserva');
      if (!raw) return;
      const payload = JSON.parse(raw);
      const clienteRecord = dataStore.clientes.find(c => c.email === user?.email);
      if (clienteRecord) {
        setFormData(prev => ({
          ...prev,
          id_cliente: clienteRecord.id_cliente.toString(),
          id_empleado: payload.empleadoId ? String(payload.empleadoId) : prev.id_empleado || '',
          id_servicios: payload.servicioId ? [String(payload.servicioId)] : prev.id_servicios || [],
        }));
        setEditingCita(null);
        setTimeout(() => setDialogOpen(true), 0);
      }
      localStorage.removeItem('prefillReserva');
    } catch (e) {
      console.error('Error reading prefillReserva', e);
    }
  }, [user?.email]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    _setSearchTerm(e.target.value);
  };

  const computeSelectedServicesDuration = () => {
    const selectedIds = (formData.id_servicios || []);
    const ids = selectedIds.length ? selectedIds.map((s: string) => parseInt(s)) : (formData.id_servicio ? [parseInt(formData.id_servicio)] : []);
    if (ids.length === 0) return 30;
    return ids.reduce((sum: number, id: number) => sum + (mockServicios.find(s => s.id_servicio === id)?.duracion || 30), 0);
  };

  const getOccupiedTimes = (fecha?: string, empId?: number, excludingId?: number) => {
    if (!fecha || !empId) return [] as string[];
    const desiredDuration = computeSelectedServicesDuration();
    return timeSlots.filter((slot: string) => {
      const start = parseTimeToMinutes(slot);
      const end = start + desiredDuration;
      return dataStore.citas.some((c: Cita) => {
        if (c.id_empleado !== empId || c.fecha !== fecha || c.id_cita === excludingId) return false;
        const cStart = parseTimeToMinutes(c.hora);
        const cDuration = computeServiciosDuration(c);
        const cEnd = cStart + cDuration;
        return start < cEnd && cStart < end;
      });
    });
  };

  const handleSelectDay = (dateStr: string) => {
    setSelectedDate(dateStr);
    if (window.innerWidth < 1024) {
      setDayDialogOpen(true);
    }
  };

  const monthDays = useMemo(() => {
    const year = calendarMonth.getFullYear();
    const month = calendarMonth.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days: Array<{ day: number; dateStr: string }> = [];
    for (let i = 1; i <= daysInMonth; i++) {
      const d = new Date(year, month, i);
      const dateStr = d.toISOString().slice(0, 10);
      days.push({ day: i, dateStr });
    }
    return { firstDay, days };
  }, [calendarMonth]);

  const todayStr = new Date().toISOString().slice(0, 10);

  return (
    <div className="flex flex-col gap-12 p-4 md:p-8 max-w-[1600px] mx-auto w-full">
      <div className="flex items-center justify-between pb-6 border-b">
        <div>
          <h1 className="flex items-center gap-2">
            <Calendar className="w-6 h-6" />
            Citas
          </h1>
          <p className="text-muted-foreground">
            {isCliente ? 'Gestiona tus citas' : 'Gestiona las citas programadas'}
          </p>
        </div>
        <Button onClick={handleCreate} className="bg-[#D4AF37] hover:bg-[#B8941F] text-black">
          <Plus className="w-4 h-4 mr-2" />
          Nueva Cita
        </Button>
      </div>

      {/* Estadísticas rápidas para Admin y Barbero */}
      {(isAdmin || isBarbero) && (
        <section>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-yellow-100 rounded-lg">
                    <Clock className="w-6 h-6 text-yellow-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Pendientes</p>
                    <p className="text-2xl font-bold">{stats.pendiente}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <CheckCircle className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Confirmadas</p>
                    <p className="text-2xl font-bold">{stats.confirmada}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-green-100 rounded-lg">
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Completadas</p>
                    <p className="text-2xl font-bold">{stats.completada}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-red-100 rounded-lg">
                    <XCircle className="w-6 h-6 text-red-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Canceladas</p>
                    <p className="text-2xl font-bold">{stats.cancelada}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
      )}

      {/* Sección Calendario y Agenda */}
      <section className="space-y-4">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
          {/* Calendario (3 columnas) */}
          <Card className="lg:col-span-3 h-fit">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Calendario</CardTitle>
                <div className="flex items-center gap-2">
                  <div>
                    <Label className="text-xs mb-1">Filtrar Barbero</Label>
                    <Select value={calendarEmpleadoFilter} onValueChange={(v) => setCalendarEmpleadoFilter(v)}>
                      <SelectTrigger className="w-[180px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos los barberos</SelectItem>
                        {mockEmpleados.map(e => (
                          <SelectItem key={e.id_empleado} value={e.id_empleado.toString()}>{e.nombre} {e.apellido}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="hidden md:flex border-[#D4AF37] text-[#D4AF37] hover:bg-[#D4AF37] hover:text-black transition-all"
                      onClick={() => setCalendarMonth(new Date())}
                    >
                      Hoy
                    </Button>
                    <div className="flex items-center bg-muted/50 rounded-lg p-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 hover:bg-[#D4AF37] hover:text-black transition-colors"
                        onClick={() => {
                          const d = new Date(calendarMonth);
                          d.setMonth(d.getMonth() - 1);
                          setCalendarMonth(d);
                        }}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <div className="px-4 font-semibold min-w-32 text-center capitalize">
                        {calendarMonth.toLocaleString('es-ES', { month: 'long', year: 'numeric' })}
                      </div>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 hover:bg-[#D4AF37] hover:text-black transition-colors"
                        onClick={() => {
                          const d = new Date(calendarMonth);
                          d.setMonth(d.getMonth() + 1);
                          setCalendarMonth(d);
                        }}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="w-full">
                <div
                  className="grid grid-cols-7 gap-px md:gap-2 bg-muted/30 p-px md:p-2 rounded-xl h-[500px] md:h-[640px]"
                  style={{
                    gridTemplateRows: 'auto repeat(6, 1fr)',
                  }}
                >
                  {/* Day cells */}
                  {(() => {
                    const totalCells = 42;
                    const cells: Array<{ day: number; dateStr: string } | null> = [];
                    for (let i = 0; i < monthDays.firstDay; i++) cells.push(null);
                    monthDays.days.forEach((d: { day: number; dateStr: string }) => cells.push({ day: d.day, dateStr: d.dateStr }));
                    while (cells.length < totalCells) cells.push(null);

                    return cells.map((cell, idx) => {
                      if (!cell) return (
                        <div key={`empty-${idx}`} className="bg-muted/10 rounded-lg" />
                      );

                      const { day, dateStr } = cell;
                      const citasDay = citasByDate[dateStr] || [];
                      const shown = citasDay.slice(0, 3);
                      const more = Math.max(0, citasDay.length - 3);
                      const isToday = dateStr === todayStr;
                      const isSelected = selectedDate === dateStr;

                      return (
                        <div
                          key={dateStr}
                          onClick={() => handleSelectDay(dateStr)}
                          className={`
                          relative group flex flex-col p-1 md:p-2 rounded-lg transition-all duration-200 cursor-pointer
                          ${isSelected ? 'bg-[#D4AF37]/20 ring-1 ring-[#D4AF37]' : 'bg-background hover:bg-muted/50'}
                          ${isToday ? 'border border-[#D4AF37]/50' : 'border border-transparent'}
                        `}
                        >
                          <div className="flex items-center justify-between pointer-events-none">
                            <span className={`
                            text-xs md:text-sm font-semibold flex items-center justify-center w-6 h-6 rounded-full transition-colors
                            ${isToday ? 'bg-[#D4AF37] text-black' : 'text-foreground'}
                            ${isSelected && !isToday ? 'text-[#D4AF37]' : ''}
                          `}>
                              {day}
                            </span>
                            {citasDay.length > 0 && (
                              <Badge variant="outline" className="h-4 px-1 text-[8px] md:text-[10px] bg-[#D4AF37]/10 text-[#D4AF37] border-none">
                                {citasDay.length}
                              </Badge>
                            )}
                          </div>

                          <div className="mt-1 flex-1 overflow-hidden hidden md:block pointer-events-none">
                            <div className="flex flex-col gap-1">
                              {shown.map((c: Cita) => (
                                <div key={c.id_cita} className="flex items-center gap-1 text-[10px] leading-tight truncate">
                                  <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${c.estado === 'completada' ? 'bg-green-500' :
                                    c.estado === 'pendiente' ? 'bg-yellow-500' : 'bg-blue-500'
                                    }`} />
                                  <span className="font-medium text-muted-foreground">{c.hora}</span>
                                  <span className="truncate">{getServicioName(c.id_servicio)}</span>
                                </div>
                              ))}
                            </div>
                            {more > 0 && (
                              <div className="text-[10px] text-muted-foreground mt-1 font-medium italic">
                                + {more} más...
                              </div>
                            )}
                          </div>

                          {/* Spark indicator for mobile */}
                          <div className="md:hidden flex justify-center mt-auto gap-0.5 pointer-events-none">
                            {shown.map((c: Cita) => (
                              <div key={c.id_cita} className={`w-1 h-1 rounded-full ${c.estado === 'completada' ? 'bg-green-500' :
                                c.estado === 'pendiente' ? 'bg-yellow-500' : 'bg-blue-500'
                                }`} />
                            ))}
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Panel lateral: Agenda del Día (1 columna) */}
          <Card className="lg:col-span-1 h-fit sticky top-4">
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-lg flex items-center gap-2">
                <Clock className="w-5 h-5 text-[#D4AF37]" />
                Agenda del Día
              </CardTitle>
              <CardDescription>
                {selectedDate ? new Date(selectedDate + 'T00:00:00').toLocaleDateString('es-ES', {
                  weekday: 'long', day: 'numeric', month: 'long'
                }) : 'Selecciona una fecha'}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0 max-h-[640px] overflow-y-auto custom-scrollbar">
              {(() => {
                const dayCitas = selectedDate ? (citasByDate[selectedDate] || []) : [];
                if (!selectedDate) return <div className="p-8 text-center text-muted-foreground italic">Selecciona un día en el calendario para ver la agenda.</div>;
                if (dayCitas.length === 0) return <div className="p-8 text-center text-muted-foreground">No hay citas programadas para este día.</div>;

                return (
                  <div className="divide-y">
                    {dayCitas.sort((a, b) => parseInt(a.hora.replace(':', '')) - parseInt(b.hora.replace(':', ''))).map(cita => (
                      <div key={cita.id_cita} className="p-4 hover:bg-muted/50 transition-colors">
                        <div className="flex items-start justify-between mb-2">
                          <Badge variant={cita.estado === 'completada' ? 'default' : cita.estado === 'confirmada' ? 'secondary' : 'outline'} className="text-[10px] font-bold">
                            {cita.hora}
                          </Badge>
                          <div className="flex items-center gap-1">
                            <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => handleViewDetails(cita)}>
                              <Eye className="w-3 h-3" />
                            </Button>
                            {!isCliente && (
                              <Button size="icon" variant="ghost" className="h-6 w-6 text-red-500 hover:text-red-700 hover:bg-red-100" onClick={() => handleDelete(cita.id_cita)}>
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            )}
                          </div>
                        </div>
                        <div className="mb-1">
                          <h4 className="text-sm font-semibold text-foreground/90">{getServicioName(cita.id_servicio)}</h4>
                          <p className="text-xs text-muted-foreground">{getClienteName(cita.id_cliente, cita.id_cliente_temporal)}</p>
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-muted-foreground mt-2">
                          <span className="bg-muted px-1.5 py-0.5 rounded flex items-center gap-1">
                            <User className="w-3 h-3" /> {getEmpleadoName(cita.id_empleado)}
                          </span>
                        </div>
                        {!isCliente && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full mt-3 h-7 text-xs border-dashed"
                            onClick={() => handleEdit(cita)}
                          >
                            <Pencil className="w-3 h-3 mr-1.5" /> Editar
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                );
              })()}
            </CardContent>
            <CardFooter className="p-3 border-t bg-muted/20">
              <Button
                className="w-full bg-[#D4AF37] hover:bg-[#B8941F] text-black"
                onClick={() => {
                  const emp = calendarEmpleadoFilter && calendarEmpleadoFilter !== 'all' ? calendarEmpleadoFilter : formData.id_empleado;
                  setFormData({ ...formData, fecha: selectedDate || todayStr, id_empleado: emp || '' });
                  setDialogOpen(true);
                }}
              >
                <Plus className="w-4 h-4 mr-2" /> Agendar en este día
              </Button>
            </CardFooter>
          </Card>
        </div>
      </section>

      <div className="border-t border-border" />

      {/* Sección Listado Completo */}
      <section className="flex flex-col gap-6 relative z-10 bg-background/50 backdrop-blur-sm rounded-xl">
        <div className="flex items-center gap-2">
          <div className="bg-primary/10 p-2 rounded-full">
            <Search className="w-5 h-5 text-primary" />
          </div>
          <h2 className="text-xl font-bold">Historial de Citas</h2>
        </div>

        <Card className="shadow-md border-muted/40">
          <CardHeader>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <CardTitle>Lista de Citas</CardTitle>
              <div className="w-full md:w-96">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    placeholder="Buscar citas..."
                    value={searchTerm}
                    onChange={handleSearch}
                    className="pl-10"
                  />
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Servicio</TableHead>
                    <TableHead>Barbero</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Hora</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {displayCitas.map((cita) => (
                    <TableRow key={cita.id_cita}>
                      <TableCell>#{cita.id_cita}</TableCell>
                      <TableCell>{getClienteName(cita.id_cliente, cita.id_cliente_temporal)}</TableCell>
                      <TableCell>{formatServicios(cita)}</TableCell>
                      <TableCell>{getEmpleadoName(cita.id_empleado)}</TableCell>
                      <TableCell>{new Date(cita.fecha + 'T00:00:00').toLocaleDateString('es-ES')}</TableCell>
                      <TableCell>{cita.hora}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            cita.estado === 'completada' ? 'default' :
                              cita.estado === 'confirmada' ? 'secondary' :
                                cita.estado === 'cancelada' ? 'destructive' : 'outline'
                          }
                          className={
                            cita.estado === 'completada' ? 'bg-green-600' :
                              cita.estado === 'confirmada' ? 'bg-blue-600' :
                                cita.estado === 'pendiente' ? 'bg-yellow-600' : ''
                          }
                        >
                          {cita.estado}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" size="sm" onClick={() => handleViewDetails(cita)}>
                            <Eye className="w-4 h-4" />
                          </Button>
                          {!isCliente && (
                            <>
                              {cita.estado === 'pendiente' && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleConfirm(cita.id_cita)}
                                  className="bg-blue-50 hover:bg-blue-100"
                                >
                                  <CheckCircle className="w-4 h-4 text-blue-600" />
                                </Button>
                              )}
                              {cita.estado === 'confirmada' && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleComplete(cita.id_cita)}
                                  className="bg-green-50 hover:bg-green-100"
                                >
                                  <CheckCircle className="w-4 h-4 text-green-600" />
                                </Button>
                              )}
                              <Button variant="outline" size="sm" onClick={() => handleEdit(cita)}>
                                <Pencil className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleCancel(cita.id_cita)}
                                disabled={cita.estado === 'cancelada' || cita.estado === 'completada'}
                              >
                                <XCircle className="w-4 h-4" />
                              </Button>
                              <Button variant="outline" size="sm" onClick={() => handleDelete(cita.id_cita)}>
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Dialog que muestra citas del día seleccionado (Moved here) */}
      <Dialog open={dayDialogOpen} onOpenChange={setDayDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              Citas del {selectedDate ? new Date(selectedDate + 'T00:00:00').toLocaleDateString('es-ES', {
                weekday: 'long', day: 'numeric', month: 'long'
              }) : ''}
            </DialogTitle>
            <DialogDescription>
              Lista de citas para la fecha seleccionada
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {(() => {
              const dayCitas = selectedDate ? (citasByDate[selectedDate] || []) : [];
              if (dayCitas.length === 0) return <div className="p-4 text-sm text-muted-foreground">No hay citas en esta fecha.</div>;
              return (
                <div className="space-y-2">
                  {dayCitas.map(cita => (
                    <Card key={cita.id_cita}>
                      <CardContent className="p-3 flex items-center justify-between">
                        <div>
                          <div className="font-medium">{cita.hora} — {getServicioName(cita.id_servicio)}</div>
                          <div className="text-sm text-muted-foreground">{getClienteName(cita.id_cliente, cita.id_cliente_temporal)} • {getEmpleadoName(cita.id_empleado)}</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button size="sm" variant="ghost" onClick={() => { handleViewDetails(cita); setDayDialogOpen(false); }}>
                            <Eye className="w-4 h-4" />
                          </Button>
                          {!isCliente && (
                            <>
                              <Button size="sm" variant="ghost" onClick={() => { handleEdit(cita); setDayDialogOpen(false); }}>
                                <Pencil className="w-4 h-4" />
                              </Button>
                              <Button size="sm" variant="ghost" onClick={() => { handleDelete(cita.id_cita); setDayDialogOpen(false); }}>
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              );
            })()}
          </div>
          <DialogFooter>
            <Button onClick={() => {
              const emp = calendarEmpleadoFilter && calendarEmpleadoFilter !== 'all' ? calendarEmpleadoFilter : formData.id_empleado;
              setFormData({ ...formData, fecha: selectedDate || '', id_empleado: emp || '' });
              setDayDialogOpen(false);
              setDialogOpen(true);
            }} className="bg-[#D4AF37] hover:bg-[#B8941F] text-black">Nueva Cita</Button>
            <Button onClick={() => setDayDialogOpen(false)}>Cerrar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog para crear/editar cita */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingCita ? 'Editar Cita' : 'Nueva Cita'}</DialogTitle>
            <DialogDescription>
              {editingCita ? 'Actualiza la información de la cita' : 'Registra una nueva cita'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
              {!isCliente && (
                <div className="space-y-2">
                  <Label htmlFor="id_cliente">Cliente *</Label>
                  <Select
                    value={formData.id_cliente}
                    onValueChange={(value) => setFormData({ ...formData, id_cliente: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona un cliente" />
                    </SelectTrigger>
                    <SelectContent>
                      {mockClientes.map((cliente) => (
                        <SelectItem key={cliente.id_cliente} value={cliente.id_cliente.toString()}>
                          {cliente.nombre} {cliente.apellido}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-2 md:col-span-2">
                <Label>Servicios *</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-48 overflow-y-auto p-2 border rounded">
                  {mockServicios.map(servicio => {
                    const checked = (formData.id_servicios || []).includes(servicio.id_servicio.toString());
                    return (
                      <label key={servicio.id_servicio} className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={(e) => {
                            const next = new Set((formData.id_servicios || []));
                            if (e.target.checked) next.add(servicio.id_servicio.toString()); else next.delete(servicio.id_servicio.toString());
                            setFormData({ ...formData, id_servicios: Array.from(next) });
                          }}
                        />
                        <div className="flex-1">
                          <div className="font-medium">{servicio.nombre}</div>
                          <div className="text-xs text-muted-foreground">${servicio.precio.toFixed(2)}</div>
                        </div>
                      </label>
                    );
                  })}
                </div>
                <div className="mt-2 text-sm text-muted-foreground">Duración total: <span className="font-medium text-white">{formatDuration(computeSelectedServicesDuration())}</span></div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="id_empleado">Barbero</Label>
                <Select
                  value={formData.id_empleado}
                  onValueChange={(value) => setFormData({ ...formData, id_empleado: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sin asignar" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">Sin asignar</SelectItem>
                    {mockEmpleados.map((empleado) => (
                      <SelectItem key={empleado.id_empleado} value={empleado.id_empleado.toString()}>
                        {empleado.nombre} {empleado.apellido}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {!isCliente && (
                <div className="space-y-2">
                  <Label htmlFor="estado">Estado *</Label>
                  <Select
                    value={formData.estado}
                    onValueChange={(value: any) => setFormData({ ...formData, estado: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pendiente">Pendiente</SelectItem>
                      <SelectItem value="confirmada">Confirmada</SelectItem>
                      <SelectItem value="completada">Completada</SelectItem>
                      <SelectItem value="cancelada">Cancelada</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="fecha">Fecha *</Label>
                <Input
                  id="fecha"
                  type="date"
                  value={formData.fecha}
                  onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="hora">Hora *</Label>
                <Select
                  value={formData.hora}
                  onValueChange={(value) => {
                    setFormData({ ...formData, hora: value });
                    const empleadoId = formData.id_empleado ? parseInt(formData.id_empleado) : undefined;
                    if (hasConflict(empleadoId, formData.fecha, value, editingCita?.id_cita)) {
                      toast.error('El barbero no está disponible en la fecha y hora seleccionadas');
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona hora" />
                  </SelectTrigger>
                  <SelectContent>
                    {(() => {
                      const empleadoId = formData.id_empleado ? parseInt(formData.id_empleado) : undefined;
                      const occupied = getOccupiedTimes(formData.fecha, empleadoId, editingCita?.id_cita) || [];
                      return timeSlots.map((time) => (
                        <SelectItem
                          key={time}
                          value={time}
                          disabled={occupied.includes(time)}
                          className={occupied.includes(time) ? 'opacity-50 cursor-not-allowed' : ''}
                        >
                          {time}{occupied.includes(time) ? ' — ocupado' : ''}
                        </SelectItem>
                      ));
                    })()}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="observaciones">Observaciones</Label>
                <Textarea
                  id="observaciones"
                  value={formData.observaciones}
                  onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" className="bg-[#D4AF37] hover:bg-[#B8941F] text-black">
                {editingCita ? 'Actualizar' : 'Crear'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog de detalles */}
      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalles de la Cita #{viewingCita?.id_cita}</DialogTitle>
            <DialogDescription>
              Información completa de la cita programada
            </DialogDescription>
          </DialogHeader>
          {viewingCita && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Cliente</Label>
                  <div className="p-3 bg-muted rounded-md">
                    <p className="font-medium">{getClienteName(viewingCita.id_cliente, viewingCita.id_cliente_temporal)}</p>
                    {viewingCita.id_cliente_temporal && (
                      <Badge variant="outline" className="mt-1">Reserva Web</Badge>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Contacto</Label>
                  <div className="p-3 bg-muted rounded-md">
                    <p className="text-sm">{getClienteEmail(viewingCita.id_cliente, viewingCita.id_cliente_temporal)}</p>
                    <p className="text-sm">{getClienteTelefono(viewingCita.id_cliente, viewingCita.id_cliente_temporal)}</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Servicio</Label>
                  <div className="p-3 bg-muted rounded-md">
                    <p className="font-medium">{formatServicios(viewingCita)}</p>
                    <p className="text-sm text-muted-foreground">${computeServiciosPrice(viewingCita).toFixed(2)}</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Barbero</Label>
                  <div className="p-3 bg-muted rounded-md">
                    <p className="font-medium">{getEmpleadoName(viewingCita.id_empleado)}</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Fecha y Hora</Label>
                  <div className="p-3 bg-muted rounded-md">
                    <p className="font-medium">{new Date(viewingCita.fecha + 'T00:00:00').toLocaleDateString('es-ES', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}</p>
                    <p className="text-sm text-muted-foreground">{viewingCita.hora}</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Estado</Label>
                  <div className="p-3 bg-muted rounded-md">
                    <Badge
                      variant={
                        viewingCita.estado === 'completada' ? 'default' :
                          viewingCita.estado === 'confirmada' ? 'secondary' :
                            viewingCita.estado === 'cancelada' ? 'destructive' : 'outline'
                      }
                      className={
                        viewingCita.estado === 'completada' ? 'bg-green-600' :
                          viewingCita.estado === 'confirmada' ? 'bg-blue-600' :
                            viewingCita.estado === 'pendiente' ? 'bg-yellow-600' : ''
                      }
                    >
                      {viewingCita.estado}
                    </Badge>
                  </div>
                </div>
              </div>
              {viewingCita.observaciones && (
                <div className="space-y-2">
                  <Label>Observaciones</Label>
                  <div className="p-3 bg-muted rounded-md">
                    <p>{viewingCita.observaciones}</p>
                  </div>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setDetailsDialogOpen(false)}>Cerrar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de confirmación de eliminación */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. La cita será eliminada permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
