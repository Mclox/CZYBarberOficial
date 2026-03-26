import { useState, useEffect, useMemo } from 'react';
import { CitasCalendar } from './CitasCalendar';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../ui/alert-dialog';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '../ui/card';
import { Plus, Pencil, Trash2, Search, CheckCircle, XCircle, Clock, Calendar, X, Users, AlertCircle, Package } from 'lucide-react';
import { cn } from '../ui/utils';
import { useAuth } from '../../features/auth';
import { toast } from 'sonner';
import { fetchApi } from '../../lib/api';

// --- Funciones de Utilidad ---
const parseTimeToMinutes = (time: string) => {
  if (!time) return 0;
  const timeShort = time.substring(0, 5);
  const [hh, mm] = timeShort.split(':').map(Number);
  return hh * 60 + mm;
};

const formatDuration = (minutes: number) => {
  if (!minutes) return '0 min';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h > 0 ? `${h}h ${m}m` : `${m} min`;
};

const getStatusConfig = (status: string) => {
  switch (status?.toLowerCase()) {
    case 'completada': return { label: 'Completada', color: 'bg-green-100 text-green-700 border-green-200', icon: CheckCircle };
    case 'cancelada': return { label: 'Cancelada', color: 'bg-red-100 text-red-700 border-red-200', icon: XCircle };
    case 'en-ejecucion': return { label: 'En Ejecución', color: 'bg-orange-100 text-orange-700 border-orange-200', icon: Clock };
    case 'confirmada': return { label: 'Confirmada', color: 'bg-blue-100 text-blue-700 border-blue-200', icon: CheckCircle };
    default: return { label: 'Pendiente', color: 'bg-yellow-100 text-yellow-700 border-yellow-200', icon: Clock };
  }
};

const timeSlots = [
  '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
  '15:00', '15:30', '16:00', '16:30', '17:00', '17:30',
  '18:00', '18:30', '19:00', '19:30'
];

export function CitasView() {
  const { user } = useAuth();

  // --- Estados (Datos reales de BD) ---
  const [citas, setCitas] = useState<any[]>([]);
  const [clientes, setClientes] = useState<any[]>([]);
  const [barberos, setBarberos] = useState<any[]>([]);
  const [servicios, setServicios] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // --- Estados UI ---
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingCita, setEditingCita] = useState<any | null>(null);
  const [viewingCita, setViewingCita] = useState<any | null>(null);
  const [citaToDelete, setCitaToDelete] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [calendarEmpleadoFilter, setCalendarEmpleadoFilter] = useState<string>('all');
  const [activeTab, setActiveTab] = useState('agenda');

  // Barberos UI
  const [employeeSearch, setEmployeeSearch] = useState('');

  // --- Estado Formulario (Ajustado para BD V2) ---
  const [formData, setFormData] = useState({
    id_cliente: '',
    id_barbero: '',
    id_servicio: '',
    fecha: '',
    hora_inicio: '',
    observaciones: '',
    estado: 'pendiente'
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const isAdmin = user?.id_rol === 1 || user?.rol === 'Administrador';
  const isBarbero = user?.id_rol === 2 || user?.rol === 'Barbero';
  const isCliente = user?.id_rol === 3 || user?.rol === 'Cliente';

  const todayStr = new Date().toISOString().split('T')[0];

  // --- FETCH DATA ---
  const fetchData = async () => {
    setLoading(true);
    try {
      const [resCitas, resClientes, resBarberos, resServicios] = await Promise.all([
        fetchApi('/appointments').catch(() => ({ success: false, data: [] })),
        fetchApi('/clients').catch(() => ({ success: false, data: [] })),
        fetchApi('/employees').catch(() => ({ success: false, data: [] })), // Asumimos endpoint de empleados
        fetchApi('/services').catch(() => ({ success: false, data: [] }))
      ]);

      if (resCitas.success) {
        // Enriquecer citas con datos locales si faltan en la respuesta de la API
        const formattedCitas = resCitas.data.map((c: any) => {
          const sObj = resServicios.data.find((s: any) => s.id_servicio === c.id_servicio);
          const clObj = resClientes.data.find((cl: any) => cl.id_cliente === c.id_cliente);
          
          const extractTime = (str: string) => {
            if (!str) return '00:00';
            if (str.includes('T')) return str.split('T')[1].substring(0, 5);
            if (str.includes(' ')) return str.split(' ')[1].substring(0, 5);
            return str.substring(0, 5);
          };

          return {
            ...c,
            hora_inicio_corta: extractTime(c.hora_inicio),
            hora_fin_corta: extractTime(c.hora_fin),
            precio_neto: c.precio_neto || sObj?.precio_neto || 0,
            servicio_nombre: c.servicio_nombre || sObj?.nombre || 'Servicio',
            cliente_nombre: c.cliente_nombre || clObj?.nombre_final || clObj?.nombre || 'Cliente'
          };
        });
        setCitas(formattedCitas);
      }
      if (resClientes.success) setClientes(resClientes.data);
      if (resServicios.success) setServicios(resServicios.data);
      if (resBarberos.success) setBarberos(resBarberos.data);
    } catch (error) {
      toast.error('Error al cargar la información desde la base de datos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  // --- HELPERS BÚSQUEDA RÁPIDA ---
  const getClienteName = (id: any) => {
    const c = clientes.find(c => c.id_cliente === parseInt(id));
    return c ? (c.nombre_final || c.nombre) : 'N/A';
  };
  const getServicioName = (id: any) => servicios.find(s => s.id_servicio === parseInt(id))?.nombre || 'N/A';
  const getBarberoName = (id: any) => {
    const bId = parseInt(id);
    const b = barberos.find(b => b.id_empleado === bId || b.id_barbero === bId || b.id_usuario === bId);
    return b ? b.nombre : 'N/A';
  };
  const getClienteInfo = (id: any) => clientes.find(c => c.id_cliente === parseInt(id)) || {};

  // --- CÁLCULOS DINÁMICOS FORMULARIO ---
  const servicioSeleccionadoObj = servicios.find(s => s.id_servicio === parseInt(formData.id_servicio));
  const duracionEstimada = servicioSeleccionadoObj?.duracion_minutos || 30;
  const precioEstimado = servicioSeleccionadoObj?.precio_neto || 0;

  // --- FILTROS Y ESTADÍSTICAS ---
  const { displayCitas, citasByDate, stats } = useMemo(() => {
    let list = citas;

    if (isBarbero && user?.id_usuario) {
      list = list.filter(c => c.id_barbero === user.id_usuario || c.id_usuario === user.id_usuario || c.id_empleado === user.id_usuario);
    }
    if (isCliente && user?.id_usuario) {
      const miCliente = clientes.find(c => c.id_usuario === user.id_usuario);
      if (miCliente) list = list.filter(c => c.id_cliente === miCliente.id_cliente);
    }

    if (calendarEmpleadoFilter && calendarEmpleadoFilter !== 'all') {
      const empId = parseInt(calendarEmpleadoFilter);
      list = list.filter(c => c.id_barbero === empId || c.id_usuario === empId || c.id_empleado === empId);
    }

    const statsObj = {
      pendiente: list.filter(c => c.estado?.toLowerCase() === 'pendiente').length,
      confirmada: list.filter(c => c.estado?.toLowerCase() === 'confirmada').length,
      'en-ejecucion': list.filter(c => c.estado?.toLowerCase() === 'en-ejecucion').length,
      completada: list.filter(c => c.estado?.toLowerCase() === 'completada').length,
      cancelada: list.filter(c => c.estado?.toLowerCase() === 'cancelada').length,
    };

    const byDate: Record<string, any[]> = {};
    list.forEach(c => {
      if (!c.fecha) return;
      const fechaCorta = c.fecha.split('T')[0];
      if (!byDate[fechaCorta]) byDate[fechaCorta] = [];
      byDate[fechaCorta].push(c);
    });

    return { displayCitas: list, citasByDate: byDate, stats: statsObj };
  }, [citas, calendarEmpleadoFilter, user, clientes]);

  const getOccupiedTimes = (fecha?: string, empId?: number, excludingId?: number) => {
    if (!fecha || !empId) return [];
    return timeSlots.filter(slot => {
      const start = parseTimeToMinutes(slot);
      const end = start + duracionEstimada;
      return citas.some(c => {
        const cBarbero = c.id_barbero || c.id_usuario || c.id_empleado;
        if (cBarbero !== empId || c.fecha?.split('T')[0] !== fecha || c.id_cita === excludingId) return false;
        const cStart = parseTimeToMinutes(c.hora_inicio_corta);
        const cEnd = parseTimeToMinutes(c.hora_fin_corta);
        return start < cEnd && cStart < end;
      });
    });
  };

  // --- MODALES Y ACCIONES ---
  const handleCreate = (date?: string) => {
    setEditingCita(null);
    setFormData({
      id_cliente: '',
      id_barbero: '',
      id_servicio: '',
      fecha: date || todayStr,
      hora_inicio: '',
      observaciones: '',
      estado: 'pendiente'
    });
    setFormErrors({});
    setShowForm(true);
  };

  const handleEdit = (cita: any) => {
    if (isCliente) { toast.error('No tienes permisos'); return; }
    setEditingCita(cita);
    setFormData({
      id_cliente: cita.id_cliente?.toString() || '',
      id_barbero: cita.id_barbero?.toString() || cita.id_usuario?.toString() || cita.id_empleado?.toString() || '',
      id_servicio: cita.id_servicio?.toString() || '',
      fecha: cita.fecha ? cita.fecha.split('T')[0] : '',
      hora_inicio: cita.hora_inicio_corta || '',
      observaciones: cita.observaciones || '',
      estado: cita.estado || 'pendiente',
    });
    setFormErrors({});
    setShowForm(true);
  };

  const confirmDelete = async () => {
    if (citaToDelete) {
      try {
        const res = await fetchApi(`/appointments/${citaToDelete}`, { method: 'DELETE' });
        if (res.success) { toast.success('Cita eliminada'); fetchData(); }
      } catch (e: any) { toast.error(e.message || 'Error al eliminar'); }
    }
    setDeleteDialogOpen(false);
    setCitaToDelete(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};
    if (!formData.id_cliente) errors.id_cliente = 'Requerido';
    if (!formData.id_barbero) errors.id_barbero = 'Requerido';
    if (!formData.id_servicio) errors.id_servicio = 'Requerido';
    if (!formData.fecha) errors.fecha = 'Requerido';
    if (!formData.hora_inicio) errors.hora_inicio = 'Requerido';

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      toast.error('Completa los campos obligatorios');
      return;
    }

    const startMins = parseTimeToMinutes(formData.hora_inicio);
    const endMins = startMins + duracionEstimada;
    const endHH = Math.floor(endMins / 60).toString().padStart(2, '0');
    const endMM = (endMins % 60).toString().padStart(2, '0');

    const payload = {
      id_cliente: parseInt(formData.id_cliente),
      id_barbero: parseInt(formData.id_barbero),
      id_servicio: parseInt(formData.id_servicio),
      fecha: formData.fecha,
      hora_inicio: formData.hora_inicio,
      hora_fin: `${endHH}:${endMM}`
    };

    try {
      if (editingCita) {
        await fetchApi(`/appointments/${editingCita.id_cita}`, { method: 'PUT', body: JSON.stringify(payload) });
        toast.success('Cita actualizada');
      } else {
        await fetchApi('/appointments', { method: 'POST', body: JSON.stringify(payload) });
        toast.success('Cita registrada exitosamente');
      }
      setShowForm(false);
      fetchData();
    } catch (error: any) {
      toast.error(error.message || 'Error guardando cita en BD');
    }
  };

  const handleStatusChange = async (id: number, status: string) => {
    try {
      await fetchApi(`/appointments/${id}/status`, { method: 'PUT', body: JSON.stringify({ estado: status }) });
      toast.success(`Cita marcada como ${status}`);
      setDetailsDialogOpen(false);
      fetchData();
    } catch (e: any) { toast.error(e.message || 'Error de conexión'); }
  };

  return (
    <div className="flex flex-col gap-12 p-4 md:p-8 max-w-[1600px] mx-auto w-full">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        {/* ENCABEZADO */}
        <div className="flex items-center justify-between pb-6 border-b mb-8">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-bold text-blue-800">
              <Calendar className="w-6 h-6" /> Agendamiento
            </h1>
            <p className="text-muted-foreground">Gestiona citas y el equipo de barberos</p>
          </div>
          <TabsList className="bg-muted/40 p-1">
            <TabsTrigger value="agenda" className="flex items-center gap-2"><Calendar className="w-4 h-4" /> Agenda</TabsTrigger>
            <TabsTrigger value="barberos" className="flex items-center gap-2"><Users className="w-4 h-4" /> Barberos</TabsTrigger>
          </TabsList>
        </div>

        {/* PESTAÑA: AGENDA */}
        <TabsContent value="agenda">
          <div className="space-y-12">
            {!showForm && (
              <div className="flex justify-end mb-4">
                <Button onClick={() => handleCreate()} className="bg-blue-600 hover:bg-blue-700 text-white shadow-md transition-all">
                  <Plus className="w-4 h-4 mr-2" /> Nueva Cita
                </Button>
              </div>
            )}

            {!showForm ? (
              <>
                {/* TARJETAS ESTADÍSTICAS */}
                {(isAdmin || isBarbero) && (
                  <section className="animate-in fade-in duration-500">
                    <div className="flex flex-row gap-2 w-full flex-wrap md:flex-nowrap">
                      {Object.entries(stats).map(([k, v]) => {
                        // SOLUCIÓN APLICADA: Extraer el componente Icono
                        const StatusIcon = getStatusConfig(k).icon;

                        return (
                          <Card key={k} className="flex-1 hover:shadow-md transition-shadow border-muted/60 min-w-[140px]">
                            <CardContent className="p-2">
                              <div className="flex items-center gap-2">
                                <div className={cn("p-1.5 rounded-lg shrink-0",
                                  k === 'pendiente' && 'bg-yellow-50 text-yellow-600',
                                  k === 'confirmada' && 'bg-blue-50 text-blue-600',
                                  k === 'en-ejecucion' && 'bg-orange-50 text-orange-600',
                                  k === 'completada' && 'bg-green-50 text-green-600',
                                  k === 'cancelada' && 'bg-red-50 text-red-600'
                                )}>
                                  <StatusIcon className="w-4 h-4" />
                                </div>
                                <div className="min-w-0">
                                  <p className="text-[9px] uppercase font-bold text-muted-foreground/70 truncate">{k.replace('-', ' ')}</p>
                                  <p className="text-lg font-black leading-none">{v}</p>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  </section>
                )}

                <section className="space-y-4">
                  <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                    {/* CALENDARIO */}
                    <Card className="lg:col-span-3 shadow-sm">
                      <CardHeader className="flex flex-row items-center justify-between border-b pb-4">
                        <CardTitle className="text-xl">Panel de Calendario</CardTitle>
                        <div className="flex items-center gap-3">
                          <Label className="text-xs text-muted-foreground font-bold">Barbero:</Label>
                          <Select value={calendarEmpleadoFilter} onValueChange={setCalendarEmpleadoFilter}>
                            <SelectTrigger className="w-48 h-9"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">Todos los barberos</SelectItem>
                              {barberos.map(b => {
                                const bId = (b.id_empleado || b.id_barbero || b.id_usuario).toString();
                                return <SelectItem key={bId} value={bId}>{b.nombre}</SelectItem>
                              })}
                            </SelectContent>
                          </Select>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-6">
                        <CitasCalendar citasByDate={citasByDate} selectedDate={selectedDate} onSelectDay={(d) => { setSelectedDate(d); }} onEventClick={(c) => { setViewingCita(c); setDetailsDialogOpen(true); }} />
                      </CardContent>
                    </Card>

                    {/* AGENDA DEL DÍA (Derecha) */}
                    <Card className="lg:col-span-1 h-fit sticky top-4 shadow-sm border-blue-200 bg-gradient-to-b from-blue-50/50 to-transparent">
                      <CardHeader className="border-b bg-blue-50/50 pb-4">
                        <CardTitle className="text-lg flex items-center gap-2 text-blue-800"><Clock className="w-5 h-5" /> Agenda del Día</CardTitle>
                        <CardDescription className="font-medium text-xs">
                          {selectedDate ? new Date(selectedDate + 'T00:00:00').toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' }) : 'Selecciona una fecha'}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="p-0 max-h-[500px] overflow-y-auto custom-scrollbar">
                        {(() => {
                          const dayCitas = selectedDate ? (citasByDate[selectedDate] || []) : [];
                          if (!selectedDate) return <div className="p-10 text-center italic text-muted-foreground text-sm">Escoge un día en el calendario</div>;
                          if (!dayCitas.length) return <div className="p-10 text-center text-muted-foreground text-sm">Sin actividades programadas</div>;

                          return dayCitas.sort((a, b) => parseTimeToMinutes(a.hora_inicio_corta) - parseTimeToMinutes(b.hora_inicio_corta)).map(c => (
                            <div key={c.id_cita} className="p-4 border-b hover:bg-muted/30 transition-colors group cursor-pointer" onClick={() => { setViewingCita(c); setDetailsDialogOpen(true); }}>
                              <div className="flex justify-between items-start mb-2">
                                <Badge variant="outline" className="font-bold text-[10px]">{c.hora_inicio_corta}</Badge>
                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); handleEdit(c); }}><Pencil className="h-3.5 w-3.5" /></Button>
                                  <Button size="icon" variant="ghost" className="h-7 w-7 text-red-500" onClick={(e) => { e.stopPropagation(); setCitaToDelete(c.id_cita); setDeleteDialogOpen(true); }}><Trash2 className="h-3.5 w-3.5" /></Button>
                                </div>
                              </div>
                              <p className="text-sm font-bold text-foreground truncate">{c.servicio_nombre || getServicioName(c.id_servicio)}</p>
                              <p className="text-xs text-muted-foreground mt-0.5">{c.cliente_nombre || getClienteName(c.id_cliente)}</p>
                            </div>
                          ));
                        })()}
                      </CardContent>
                      <CardFooter className="p-4 bg-muted/30 border-t">
                        <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold" onClick={() => handleCreate(selectedDate || todayStr)}>
                          <Plus className="w-4 h-4 mr-2" /> Agendar ahora
                        </Button>
                      </CardFooter>
                    </Card>
                  </div>
                </section>
              </>
            ) : (
              /* FORMULARIO DE CITA (DISEÑO DORADO) */
              <Card className="border-2 border-blue-200 shadow-2xl animate-in slide-in-from-bottom-2 fade-in duration-300">
                <CardHeader className="bg-muted/20 border-b pb-6">
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle className="text-2xl font-black">{editingCita ? 'Actualizar Cita' : 'Programar Nueva Cita'}</CardTitle>
                      <CardDescription>Completa los detalles para agendar el espacio</CardDescription>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => setShowForm(false)}><X /></Button>
                  </div>
                </CardHeader>
                <form onSubmit={handleSubmit}>
                  <CardContent className="p-8">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                      {/* LADO IZQUIERDO */}
                      <div className="space-y-6">
                        <h3 className="text-xs font-bold uppercase tracking-widest text-blue-800 border-b pb-2">Datos Principales</h3>
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label>Cliente Responsable *</Label>
                            <Select value={formData.id_cliente} onValueChange={v => setFormData({ ...formData, id_cliente: v })}>
                              <SelectTrigger className={cn("h-11", formErrors.id_cliente && "border-destructive")}>
                                <SelectValue placeholder="Seleccionar cliente..." />
                              </SelectTrigger>
                              <SelectContent>{clientes.map(c => <SelectItem key={c.id_cliente} value={c.id_cliente.toString()}>{c.nombre_final || c.nombre}</SelectItem>)}</SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label>Profesional asignado *</Label>
                            <Select value={formData.id_barbero} onValueChange={v => setFormData({ ...formData, id_barbero: v })}>
                              <SelectTrigger className={cn("h-11", formErrors.id_barbero && "border-destructive")}><SelectValue placeholder="Seleccionar barbero" /></SelectTrigger>
                              <SelectContent>
                                {barberos.map(b => {
                                  const bId = (b.id_empleado || b.id_barbero || b.id_usuario).toString();
                                  return <SelectItem key={bId} value={bId}>{b.nombre}</SelectItem>
                                })}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-2"><Label>Fecha *</Label><Input type="date" value={formData.fecha} onChange={e => setFormData({ ...formData, fecha: e.target.value })} className={cn("h-11", formErrors.fecha && "border-destructive")} /></div>
                            <div className="space-y-2"><Label>Hora *</Label>
                              <Select value={formData.hora_inicio} onValueChange={v => setFormData({ ...formData, hora_inicio: v })}>
                                <SelectTrigger className={cn("h-11", formErrors.hora_inicio && "border-destructive")}><SelectValue placeholder="Bloque" /></SelectTrigger>
                                <SelectContent className="max-h-60">
                                  {timeSlots.map(s => {
                                    const occupied = getOccupiedTimes(formData.fecha, parseInt(formData.id_barbero), editingCita?.id_cita);
                                    const isOccupied = occupied.includes(s);
                                    return <SelectItem key={s} value={s} disabled={isOccupied}>{s} {isOccupied ? '(Ocupado)' : ''}</SelectItem>;
                                  })}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* LADO DERECHO */}
                      <div className="space-y-6">
                        <h3 className="text-xs font-bold uppercase tracking-widest text-blue-800 border-b pb-2">Servicios y Productos</h3>
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label>Servicio a Realizar *</Label>
                            <Select value={formData.id_servicio} onValueChange={v => setFormData({ ...formData, id_servicio: v })}>
                              <SelectTrigger className={cn("h-11", formErrors.id_servicio && "border-destructive")}><SelectValue placeholder="Elegir servicio..." /></SelectTrigger>
                              <SelectContent>{servicios.map(s => <SelectItem key={s.id_servicio} value={s.id_servicio.toString()}>{s.nombre} — ${s.precio_neto?.toFixed(2)}</SelectItem>)}</SelectContent>
                            </Select>
                            {formData.id_servicio && (
                              <Badge className="bg-foreground text-background py-1.5 px-3 mt-2">{getServicioName(formData.id_servicio)}</Badge>
                            )}
                          </div>

                          <div className="space-y-2 pt-4">
                            <Label className="text-muted-foreground flex items-center gap-2"><Package className="w-4 h-4" /> Venta de Productos</Label>
                            <div className="p-4 border rounded-md bg-muted/20 text-xs text-muted-foreground">
                              <AlertCircle className="w-4 h-4 inline mr-1 text-blue-500" />
                              En la versión V2, los productos se agregan y facturan directamente en el módulo de <strong>Ventas</strong> al finalizar la cita.
                            </div>
                          </div>
                        </div>

                        <div className="p-5 bg-blue-50 rounded-xl border border-blue-200 flex justify-between items-center">
                          <div className="flex flex-col"><span className="text-[10px] font-black text-blue-800 uppercase">Total Servicio (Neto)</span><span className="text-3xl font-black text-blue-700">${precioEstimado.toFixed(2)}</span></div>
                          <div className="text-right text-xs font-bold text-muted-foreground"><Clock className="inline w-3 h-3 mr-1" /> {formatDuration(duracionEstimada)}</div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="bg-muted/30 p-8 flex justify-end gap-3 border-t">
                    <Button type="button" variant="outline" onClick={() => setShowForm(false)} className="h-12 px-8">Cancelar</Button>
                    <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white h-12 px-12 font-black text-lg">Guardar registro</Button>
                  </CardFooter>
                </form>
              </Card>
            )}

            {/* MODAL DE DETALLES REESTRUCTURADO */}
            <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Detalle de la Cita</DialogTitle>
                </DialogHeader>
                {viewingCita && (
                  <div className="py-4 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Cod. Registro</Label>
                        <Input value={`#${viewingCita.id_cita}`} readOnly className="bg-muted" />
                      </div>
                      <div className="space-y-2">
                        <Label>Estado</Label>
                        <div>
                          <Badge variant="outline" className={cn("px-4 py-1.5 rounded-md font-medium border", getStatusConfig(viewingCita.estado).color)}>
                            {getStatusConfig(viewingCita.estado).label}
                          </Badge>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Cliente Solicitante</Label>
                        <Input value={viewingCita.cliente_nombre || getClienteName(viewingCita.id_cliente)} readOnly className="bg-muted" />
                      </div>
                      <div className="space-y-2">
                        <Label>Teléfono Cliente</Label>
                        <Input value={getClienteInfo(viewingCita.id_cliente).telefono || 'Sin teléfono'} readOnly className="bg-muted" />
                      </div>
                      <div className="space-y-2">
                        <Label>Profesional Asignado</Label>
                        <Input value={viewingCita.barbero_nombre || getBarberoName(viewingCita.id_barbero || viewingCita.id_usuario || viewingCita.id_empleado)} readOnly className="bg-muted" />
                      </div>
                      <div className="space-y-2">
                        <Label>Fecha Agendada</Label>
                        <Input value={viewingCita.fecha?.split('T')[0]} readOnly className="bg-muted" />
                      </div>
                      <div className="space-y-2">
                        <Label>Horario</Label>
                        <Input value={`${viewingCita.hora_inicio_corta} a ${viewingCita.hora_fin_corta}`} readOnly className="bg-muted" />
                      </div>
                      <div className="space-y-2">
                        <Label>Servicio Seleccionado</Label>
                        <Input value={viewingCita.servicio_nombre || getServicioName(viewingCita.id_servicio)} readOnly className="bg-muted" />
                      </div>
                    </div>
                    
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-md flex justify-between items-center mt-4">
                      <span className="text-sm font-bold text-blue-800">Valor Estimado</span>
                      <span className="text-xl font-bold text-blue-700">${(viewingCita.precio_neto || 0).toFixed(2)}</span>
                    </div>
                  </div>
                )}
                <DialogFooter className="flex-col sm:flex-row gap-2 flex-wrap sm:justify-between items-center w-full">
                  <div className="flex gap-2 w-full sm:w-auto">
                    {(isAdmin || isBarbero) && viewingCita?.estado?.toLowerCase() === 'pendiente' && (
                      <>
                        <Button className="bg-green-600 hover:bg-green-700 text-white flex-1 sm:flex-none" onClick={() => handleStatusChange(viewingCita.id_cita, 'completado')}>
                          <CheckCircle className="w-4 h-4 mr-2" /> Completada
                        </Button>
                        <Button variant="outline" className="border-red-200 text-red-600 hover:bg-red-50 flex-1 sm:flex-none" onClick={() => handleStatusChange(viewingCita.id_cita, 'cancelado')}>
                          <XCircle className="w-4 h-4 mr-2" /> Cancelar Cita
                        </Button>
                      </>
                    )}
                  </div>
                  <Button variant="outline" onClick={() => setDetailsDialogOpen(false)} className="w-full sm:w-auto">
                    Cerrar
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
              <AlertDialogContent className="rounded-2xl">
                <AlertDialogHeader>
                  <AlertDialogTitle className="text-2xl font-black">¿Confirmar eliminación?</AlertDialogTitle>
                  <AlertDialogDescription>Esta acción es permanente y borrará la cita de la base de datos.</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="pt-4">
                  <AlertDialogCancel onClick={() => { setDeleteDialogOpen(false); setCitaToDelete(null); }}>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={confirmDelete} className="bg-red-600">Eliminar definitivamente</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </TabsContent>

        {/* PESTAÑA: BARBEROS */}
        <TabsContent value="barberos">
          <div className="space-y-8 animate-in fade-in duration-500 pt-6">
            <div className="flex justify-between items-center bg-blue-50 border border-blue-200 p-4 rounded-xl">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-6 h-6 text-blue-600" />
                <div>
                  <p className="font-bold text-blue-800">Gestión de Barberos en V2</p>
                  <p className="text-sm text-blue-700">En esta versión, los barberos se gestionan desde el módulo central de <strong>Usuarios / Empleados</strong>. Aquí puedes visualizar el equipo actual.</p>
                </div>
              </div>
            </div>

            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
              <div className="relative w-full md:w-96">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Buscar barbero..." value={employeeSearch} onChange={e => setEmployeeSearch(e.target.value)} className="pl-10" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {barberos.filter(e => e.nombre.toLowerCase().includes(employeeSearch.toLowerCase())).map(emp => {
                const bId = emp.id_empleado || emp.id_barbero || emp.id_usuario;
                return (
                  <Card key={bId} className="hover:shadow-lg transition-all border-l-4 border-l-blue-600">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center font-bold text-lg">
                          {emp.nombre[0]}
                        </div>
                        <div>
                          <CardTitle className="text-lg">{emp.nombre}</CardTitle>
                          <CardDescription>Profesional</CardDescription>
                        </div>
                      </div>
                      <Badge className="bg-green-100 text-green-700">Activo</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4 pt-4">
                    <div className="text-xs text-muted-foreground">
                      <p>Email: {emp.email}</p>
                      <p>Teléfono: {emp.telefono || 'No registrado'}</p>
                    </div>
                  </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}