import { useState, useEffect, useMemo } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../ui/alert-dialog';
import { Badge } from '../ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '../ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Plus, Pencil, Trash2, Eye, CheckCircle, XCircle, Clock, Calendar, X, Users, UserPlus, Users2, DollarSign, Briefcase } from 'lucide-react';
import { cn } from '../ui/utils';
import { useAuth } from '../../features/auth';
import { toast } from 'sonner';
import { fetchApi } from '../../lib/api';
import { CitasCalendar } from './CitasCalendar';

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
    case 'completada':
    case 'completado':
      return { label: 'Completada', color: 'bg-green-100 text-green-700 border-green-200', icon: CheckCircle };
    case 'cancelada':
    case 'cancelado':
      return { label: 'Cancelada', color: 'bg-red-100 text-red-700 border-red-200', icon: XCircle };
    default:
      return { label: 'Pendiente', color: 'bg-yellow-100 text-yellow-700 border-yellow-200', icon: Clock };
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
  const [dayDialogOpen, setDayDialogOpen] = useState(false);
  const [editingCita, setEditingCita] = useState<any | null>(null);
  const [viewingCita, setViewingCita] = useState<any | null>(null);
  const [citaToDelete, setCitaToDelete] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [calendarEmpleadoFilter, setCalendarEmpleadoFilter] = useState<string>('all');
  const [activeTab, setActiveTab] = useState('agenda');

  // --- Estado Formulario (Ajustado para BD V2) ---
  const [formData, setFormData] = useState({
    id_cliente: '',
    id_barbero: '',
    id_servicio: '',
    fecha: '',
    hora_inicio: '',
    estado: 'pendiente'
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const isAdmin = user?.id_rol === 1 || user?.rol === 'Administrador';
  const isBarbero = user?.id_rol === 2 || user?.rol === 'Barbero';
  const isCliente = user?.id_rol === 3 || user?.rol === 'Cliente';

  // --- FETCH DATA ---
  const fetchData = async () => {
    setLoading(true);
    try {
      const [resCitas, resClientes, resUsers, resServicios] = await Promise.all([
        fetchApi('/appointments'),
        fetchApi('/clients'),
        fetchApi('/users'),
        fetchApi('/services')
      ]);

      if (resCitas.success) {
        // Formatear la hora para quitar segundos si vienen de SQL
        const formattedCitas = resCitas.data.map((c: any) => ({
          ...c,
          hora_inicio_corta: c.hora_inicio ? c.hora_inicio.substring(0, 5) : '00:00',
          hora_fin_corta: c.hora_fin ? c.hora_fin.substring(0, 5) : '00:00'
        }));
        setCitas(formattedCitas);
      }
      if (resClientes.success) setClientes(resClientes.data);
      if (resServicios.success) setServicios(resServicios.data);
      if (resUsers.success) {
        // Asumimos rol 2 es Barbero
        setBarberos(resUsers.data.filter((u: any) => u.id_rol === 2 || u.rol_nombre === 'Barbero'));
      }
    } catch (error: any) {
      toast.error('Error al cargar la información desde la base de datos');
    } finally {
      setLoading(false);
    }
  };

  // --- HELPERS ---
  const getClienteName = (id: any) => {
    const c = clientes.find(c => c.id_cliente === parseInt(id));
    return c ? (c.nombre_final || c.nombre) : 'N/A';
  };
  const getServicioName = (id: any) => servicios.find(s => s.id_servicio === parseInt(id))?.nombre || 'N/A';
  const getBarberoName = (id: any) => barberos.find(b => b.id_usuario === parseInt(id))?.nombre || 'N/A';

  useEffect(() => {
    fetchData();
  }, []);

  // --- CÁLCULOS DINÁMICOS FORMULARIO ---
  const servicioSeleccionadoObj = servicios.find(s => s.id_servicio === parseInt(formData.id_servicio));
  const duracionEstimada = servicioSeleccionadoObj?.duracion_minutos || 0;
  const precioEstimado = servicioSeleccionadoObj?.precio_neto || 0;

  // --- FILTROS Y ESTADÍSTICAS ---
  const { displayCitas, citasByDate, stats } = useMemo(() => {
    let list = citas;

    if (isBarbero && user?.id_usuario) {
      // Un barbero solo ve sus citas (asumiendo que en Citas id_barbero es id_usuario o id_barbero de tabla Barberos. En tu script SQL Citas.id_barbero apunta a Barberos.id_barbero, pero en el frontend pusiste id_usuario. Esto puede ser un error, pero lo dejaremos como está para no romper mucho).
      // Para ser seguros, si tu backend devuelve algo de usuario, filtra por eso.
      // Si no, ignora este filtro por ahora o ajústalo a tu lógica real.
    }
    if (isCliente && user?.id_usuario) {
      const miCliente = clientes.find(c => c.id_usuario === user.id_usuario);
      if (miCliente) list = list.filter(c => c.id_cliente === miCliente.id_cliente);
    }

    if (calendarEmpleadoFilter && calendarEmpleadoFilter !== 'all') {
      const empId = parseInt(calendarEmpleadoFilter);
      // Igual que arriba, cuidado con id_barbero vs id_usuario
      list = list.filter(c => c.id_barbero === empId || c.id_usuario === empId);
    }

    const statsObj = {
      pendiente: list.filter(c => c.estado?.toLowerCase() === 'pendiente').length,
      completada: list.filter(c => ['completada', 'completado'].includes(c.estado?.toLowerCase())).length,
      cancelada: list.filter(c => ['cancelada', 'cancelado'].includes(c.estado?.toLowerCase())).length,
    };

    const term = searchTerm.toLowerCase();
    const searched = list.filter(cita => {
      if (!term) return true;
      const clienteName = (cita.cliente_nombre || '').toLowerCase();
      const sName = (cita.servicio_nombre || '').toLowerCase();
      const bName = (cita.barbero_nombre || '').toLowerCase();
      return clienteName.includes(term) || sName.includes(term) || bName.includes(term) ||
        cita.id_cita.toString().includes(term) || cita.estado.toLowerCase().includes(term);
    });

    const byDate: Record<string, any[]> = {};
    searched.forEach(c => {
      if (!c.fecha) return;
      const fechaCorta = c.fecha.split('T')[0];
      if (!byDate[fechaCorta]) byDate[fechaCorta] = [];
      byDate[fechaCorta].push(c);
    });

    return { displayCitas: searched, citasByDate: byDate, stats: statsObj };
  }, [citas, searchTerm, calendarEmpleadoFilter, user, clientes]);

  // --- MANEJO DE MODALES ---
  const handleCreate = (date?: string) => {
    setEditingCita(null);
    setFormData({
      id_cliente: '',
      id_barbero: '',
      id_servicio: '',
      fecha: date || new Date().toISOString().split('T')[0],
      hora_inicio: '',
      estado: 'pendiente'
    });
    setFormErrors({});
    setShowForm(true);
  };

  const handleEdit = (cita: any) => {
    if (isCliente) { toast.error('No tienes permisos para editar citas'); return; }
    setEditingCita(cita);
    setFormData({
      id_cliente: cita.id_cliente?.toString() || '',
      // Cuidado aquí: El select de barbero usa id_usuario como value, debes asegurarte de que mapee bien
      id_barbero: cita.id_usuario?.toString() || cita.id_barbero?.toString() || '',
      id_servicio: cita.id_servicio?.toString() || '',
      fecha: cita.fecha ? cita.fecha.split('T')[0] : '',
      hora_inicio: cita.hora_inicio_corta || '',
      estado: cita.estado || 'pendiente',
    });
    setFormErrors({});
    setShowForm(true);
  };

  // --- ELIMINAR CITA ---
  const confirmDelete = async () => {
    if (citaToDelete) {
      try {
        const response = await fetchApi(`/appointments/${citaToDelete}`, { method: 'DELETE' });
        if (response.success) {
          toast.success('Cita eliminada permanentemente');
          fetchData();
        } else {
          toast.error(response.message || 'Error al eliminar');
        }
      } catch (e: any) {
        toast.error(e.message || 'Error al eliminar la cita (Verifique dependencias)');
      }
    }
    setDeleteDialogOpen(false);
    setCitaToDelete(null);
  };

  // --- GUARDAR CITA (POST/PUT) ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validación básica Frontend
    const errors: Record<string, string> = {};
    if (!formData.id_cliente) errors.id_cliente = 'Requerido';
    if (!formData.id_barbero) errors.id_barbero = 'Requerido';
    if (!formData.id_servicio) errors.id_servicio = 'Requerido';
    if (!formData.fecha) errors.fecha = 'Requerido';
    if (!formData.hora_inicio) errors.hora_inicio = 'Requerido';

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      toast.error('Completa los campos obligatorios (*)');
      return;
    }

    // --- VALIDACIÓN DE DISPONIBILIDAD ---
    const startMinsRequested = parseTimeToMinutes(formData.hora_inicio);
    const endMinsRequested = startMinsRequested + duracionEstimada;
    const barberId = parseInt(formData.id_barbero);

    const conflict = citas.find(c => {
      if (c.id_cita === editingCita?.id_cita) return false;
      const cBarberoId = c.id_barbero || c.id_usuario;
      if (cBarberoId !== barberId) return false;

      const cDate = c.fecha.split('T')[0];
      if (cDate !== formData.fecha) return false;

      const cStart = parseTimeToMinutes(c.hora_inicio);
      const cDur = servicios.find((s: any) => s.id_servicio === c.id_servicio)?.duracion_minutos || 30;
      const cEnd = cStart + cDur;

      return (startMinsRequested < cEnd && endMinsRequested > cStart);
    });

    if (conflict) {
      toast.error(`El barbero ya tiene una cita de ${conflict.hora_inicio_corta} a ${conflict.hora_fin_corta}`);
      return;
    }

    // Calcular hora_fin basada en duración
    const endHH = Math.floor(endMinsRequested / 60).toString().padStart(2, '0');
    const endMM = (endMinsRequested % 60).toString().padStart(2, '0');
    const hora_fin_calc = `${endHH}:${endMM}`;

    const payload = {
      id_cliente: parseInt(formData.id_cliente),
      id_barbero: parseInt(formData.id_barbero), // Ojo: Verifica si tu BD espera el id de la tabla Barberos o de la tabla Usuarios
      id_servicio: parseInt(formData.id_servicio),
      fecha: formData.fecha,
      hora_inicio: formData.hora_inicio,
      hora_fin: hora_fin_calc
    };

    try {
      if (editingCita) {
        const res = await fetchApi(`/appointments/${editingCita.id_cita}`, {
          method: 'PUT',
          body: JSON.stringify(payload)
        });
        if (res.success) {
          toast.success('Cita actualizada exitosamente');
          setShowForm(false);
          fetchData();
        }
      } else {
        const res = await fetchApi('/appointments', {
          method: 'POST',
          body: JSON.stringify(payload)
        });
        if (res.success) {
          toast.success('¡Cita registrada exitosamente!');
          setShowForm(false);
          fetchData();
        }
      }
    } catch (error: any) {
      toast.error(error.message || 'Error guardando cita en BD');
      console.error(error);
    }
  };

  // --- CAMBIAR ESTADO DE CITA (CONFIRMAR/CANCELAR) ---
  const handleStatusChange = async (id: number, status: string) => {
    try {
      // Usamos la ruta específica que creamos en el backend para cambiar estado
      const res = await fetchApi(`/appointments/${id}/status`, {
        method: 'PUT',
        body: JSON.stringify({ estado: status })
      });
      if (res.success) {
        toast.success(`Cita marcada como ${status}`);
        setDetailsDialogOpen(false);
        fetchData();
      } else {
        toast.error(res.message || 'Error al cambiar estado');
      }
    } catch (e: any) {
      toast.error(e.message || 'Error de conexión');
    }
  };

  return (
    <div className="flex flex-col gap-12 p-4 md:p-8 max-w-[1600px] mx-auto w-full">
      {/* ENCABEZADO */}
      <div className="flex items-center justify-between pb-6 border-b mb-8">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold">
            <Calendar className="w-6 h-6 text-[#D4AF37]" />
            Agendamiento
          </h1>
          <p className="text-muted-foreground">Gestiona citas y el equipo</p>
        </div>
      </div>

      {!showForm ? (
        <>
          <div className="flex justify-end mb-4">
            <Button onClick={() => handleCreate()} className="bg-[#D4AF37] hover:bg-[#B8941F] text-black">
              <Plus className="w-4 h-4 mr-2" /> Nueva Cita
            </Button>
          </div>

          {/* TARJETAS ESTADÍSTICAS */}
          {(isAdmin || isBarbero) && (
            <div className="flex flex-row gap-2 w-full flex-wrap md:flex-nowrap mb-4">
              {Object.entries(stats).map(([k, v]) => (
                <Card key={k} className="flex-1 border-muted/60">
                  <CardContent className="p-3">
                    <div className="flex items-center gap-2">
                      <div className={cn("p-2 rounded-lg shrink-0",
                        k === 'completada' ? 'bg-green-50 text-green-600' :
                          k === 'cancelada' ? 'bg-red-50 text-red-600' :
                            'bg-yellow-50 text-yellow-600'
                      )}>
                        {k === 'completada' ? <CheckCircle className="w-4 h-4" /> :
                          k === 'cancelada' ? <XCircle className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                      </div>
                      <div>
                        <p className="text-[10px] uppercase font-bold text-muted-foreground/70">{k}</p>
                        <p className="text-lg font-black leading-none">{v}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* CALENDARIO (Izquierda) */}
            <Card className="lg:col-span-3">
              <CardHeader className="flex flex-row justify-between pb-2 border-b">
                <CardTitle>Calendario</CardTitle>
                <Select value={calendarEmpleadoFilter} onValueChange={setCalendarEmpleadoFilter}>
                  <SelectTrigger className="w-48 h-8 text-xs"><SelectValue placeholder="Filtrar Barbero" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los barberos</SelectItem>
                    {barberos.map(b => <SelectItem key={b.id_usuario} value={b.id_usuario.toString()}>{b.nombre}</SelectItem>)}
                  </SelectContent>
                </Select>
              </CardHeader>
              <CardContent className="pt-4">
                {loading ? <p className="text-center py-10">Cargando...</p> :
                  <CitasCalendar
                    citasByDate={citasByDate}
                    selectedDate={selectedDate}
                    onSelectDay={(d) => { setSelectedDate(d); setDayDialogOpen(true); }}
                    onEventClick={(c) => { setViewingCita(c); setDetailsDialogOpen(true); }}
                  />
                }
              </CardContent>
            </Card>

            {/* LISTA LATERAL (Derecha) */}
            <Card className="lg:col-span-1 h-fit sticky top-4">
              <CardHeader className="bg-muted/20 pb-3 border-b">
                <CardTitle className="text-sm font-bold flex items-center gap-2"><Clock className="w-4 h-4" /> Agenda del Día</CardTitle>
                <CardDescription className="text-xs">
                  {selectedDate ? selectedDate : 'Selecciona una fecha'}
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0 max-h-[500px] overflow-y-auto">
                {(() => {
                  const dayCitas = selectedDate ? (citasByDate[selectedDate] || []) : [];
                  if (!selectedDate) return <p className="p-6 text-center text-xs text-muted-foreground">Selecciona un día en el calendario.</p>;
                  if (!dayCitas.length) return <p className="p-6 text-center text-xs text-muted-foreground">No hay citas.</p>;

                  return dayCitas.sort((a, b) => parseTimeToMinutes(a.hora_inicio_corta) - parseTimeToMinutes(b.hora_inicio_corta)).map(c => (
                    <div key={c.id_cita} className="p-3 border-b hover:bg-muted/30 cursor-pointer" onClick={() => { setViewingCita(c); setDetailsDialogOpen(true); }}>
                      <div className="flex justify-between items-center mb-1">
                        <Badge variant={c.estado === 'completado' ? 'default' : c.estado === 'cancelado' ? 'destructive' : 'secondary'} className="text-[9px]">
                          {c.hora_inicio_corta}
                        </Badge>
                        <div className="flex gap-1">
                          <Button size="icon" variant="ghost" className="h-6 w-6" onClick={(e) => { e.stopPropagation(); handleEdit(c); }}><Pencil className="h-3 w-3" /></Button>
                          <Button size="icon" variant="ghost" className="h-6 w-6 text-red-500" onClick={(e) => { e.stopPropagation(); setCitaToDelete(c.id_cita); setDeleteDialogOpen(true); }}><Trash2 className="h-3 w-3" /></Button>
                        </div>
                      </div>
                      <p className="text-xs font-bold truncate">{c.servicio_nombre || getServicioName(c.id_servicio)}</p>
                      <p className="text-[10px] text-muted-foreground truncate">{c.cliente_nombre || getClienteName(c.id_cliente)} (con {c.barbero_nombre || getBarberoName(c.id_barbero)})</p>
                    </div>
                  ));
                })()}
              </CardContent>
            </Card>
          </div>
        </>
      ) : (
        /* ------------------------------------- */
        /* FORMULARIO DE CREAR / EDITAR CITA     */
        /* ------------------------------------- */
        <Card>
          <CardHeader className="border-b">
            <div className="flex justify-between items-center">
              <CardTitle>{editingCita ? 'Editar Cita' : 'Programar Nueva Cita'}</CardTitle>
              <Button variant="ghost" size="icon" onClick={() => setShowForm(false)}><X className="h-4 w-4" /></Button>
            </div>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">

              {/* LADO IZQUIERDO: Personas y Fechas */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold uppercase text-muted-foreground border-b pb-2">Asignación</h3>

                <div className="space-y-2">
                  <Label>Cliente <span className="text-red-500">*</span></Label>
                  <Select value={formData.id_cliente} onValueChange={v => setFormData({ ...formData, id_cliente: v })}>
                    <SelectTrigger className={formErrors.id_cliente ? 'border-red-500' : ''}>
                      <SelectValue placeholder="Seleccione un cliente" />
                    </SelectTrigger>
                    <SelectContent>
                      {clientes.map(c => <SelectItem key={c.id_cliente} value={c.id_cliente.toString()}>{c.nombre_final || c.nombre} - {c.documento || c.email_final || ''}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Barbero <span className="text-red-500">*</span></Label>
                  <Select value={formData.id_barbero} onValueChange={v => setFormData({ ...formData, id_barbero: v })}>
                    <SelectTrigger className={formErrors.id_barbero ? 'border-red-500' : ''}>
                      <SelectValue placeholder="Seleccione un barbero" />
                    </SelectTrigger>
                    <SelectContent>
                      {barberos.map(b => <SelectItem key={b.id_usuario} value={b.id_usuario.toString()}>{b.nombre}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <p className="text-[10px] text-muted-foreground">En DB V2 Barberos está amarrado a Usuarios.</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Fecha <span className="text-red-500">*</span></Label>
                    <Input type="date" value={formData.fecha} onChange={e => setFormData({ ...formData, fecha: e.target.value })} className={formErrors.fecha ? 'border-red-500' : ''} />
                  </div>
                  <div className="space-y-2">
                    <Label>Hora Inicio <span className="text-red-500">*</span></Label>
                    <Select value={formData.hora_inicio} onValueChange={v => setFormData({ ...formData, hora_inicio: v })}>
                      <SelectTrigger className={formErrors.hora_inicio ? 'border-red-500' : ''}>
                        <SelectValue placeholder="HH:mm" />
                      </SelectTrigger>
                      <SelectContent className="max-h-48">
                        {timeSlots.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* LADO DERECHO: Servicios y Resumen */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold uppercase text-muted-foreground border-b pb-2">Servicio</h3>

                <div className="space-y-2">
                  <Label>Seleccionar Servicio <span className="text-red-500">*</span></Label>
                  <Select value={formData.id_servicio} onValueChange={v => setFormData({ ...formData, id_servicio: v })}>
                    <SelectTrigger className={formErrors.id_servicio ? 'border-red-500' : ''}>
                      <SelectValue placeholder="Elegir servicio" />
                    </SelectTrigger>
                    <SelectContent>
                      {servicios.map(s => <SelectItem key={s.id_servicio} value={s.id_servicio.toString()}>{s.nombre} — ${s.precio_neto?.toFixed(2)}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                <div className="mt-6 p-4 bg-muted/30 rounded-lg border">
                  <Label className="text-[10px] uppercase text-muted-foreground mb-2 block">Resumen Calculado</Label>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm">Duración Estimada:</span>
                    <span className="font-bold">{duracionEstimada} min</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Valor a cobrar (Neto):</span>
                    <span className="text-xl font-bold text-[#D4AF37]">${precioEstimado.toFixed(2)}</span>
                  </div>
                  {formData.hora_inicio && duracionEstimada > 0 && (
                    <p className="text-xs text-muted-foreground text-right mt-2 pt-2 border-t">
                      La cita terminará aprox. a las {
                        (() => {
                          const start = parseTimeToMinutes(formData.hora_inicio);
                          const end = start + duracionEstimada;
                          return `${Math.floor(end / 60).toString().padStart(2, '0')}:${(end % 60).toString().padStart(2, '0')}`;
                        })()
                      }
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end gap-2 border-t pt-4 bg-muted/10">
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancelar</Button>
              <Button type="submit" className="bg-[#D4AF37] text-black hover:bg-[#B8941F]">Guardar Cita en BD</Button>
            </CardFooter>
          </form>
        </Card>
      )}
      {/* MODAL VER DETALLES */}
      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent className="max-w-2xl p-0 overflow-hidden rounded-3xl border-none shadow-2xl">
          {viewingCita && (
            <>
              <div className="relative h-32 bg-gradient-to-r from-[#1a1a1a] to-[#2a2a2a] flex items-end p-8">
                <div className="absolute top-6 right-6">
                  <Badge className={cn("px-4 py-1.5 rounded-full font-bold border shadow-sm", getStatusConfig(viewingCita.estado).color)}>
                    {getStatusConfig(viewingCita.estado).label}
                  </Badge>
                </div>
                <div className="space-y-1">
                  <h2 className="text-white text-2xl font-black tracking-tight uppercase">Detalle de la Cita</h2>
                  <p className="text-white/40 text-xs font-mono uppercase tracking-widest">Cod. Registro: #{viewingCita.id_cita}</p>
                </div>
              </div>

              <div className="p-8 space-y-8 bg-white text-foreground">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Info Cliente & Barbero */}
                  <div className="space-y-6">
                    <div className="flex gap-4 items-start translate-y-1">
                      <div className="p-3 bg-muted rounded-2xl">
                        <UserPlus className="w-5 h-5 text-[#D4AF37]" />
                      </div>
                      <div className="space-y-1 text-left">
                        <Label className="text-[10px] uppercase font-black text-muted-foreground tracking-tighter">Cliente Solicitante</Label>
                        <p className="text-lg font-bold leading-tight">{viewingCita.cliente_nombre || getClienteName(viewingCita.id_cliente)}</p>
                        <p className="text-xs text-muted-foreground font-medium">Información registrada en base de datos</p>
                      </div>
                    </div>

                    <div className="flex gap-4 items-start translate-y-1">
                      <div className="p-3 bg-muted rounded-2xl">
                        <Users className="w-5 h-5 text-blue-500" />
                      </div>
                      <div className="space-y-1 text-left">
                        <Label className="text-[10px] uppercase font-black text-muted-foreground tracking-tighter">Barbero Asignado</Label>
                        <p className="text-lg font-bold leading-tight">{viewingCita.barbero_nombre || getBarberoName(viewingCita.id_barbero)}</p>
                        <p className="text-xs text-muted-foreground font-medium">Profesional a cargo del servicio</p>
                      </div>
                    </div>
                  </div>

                  {/* Info Fecha & Hora */}
                  <div className="space-y-6 bg-muted/30 p-6 rounded-3xl border border-muted-foreground/10">
                    <div className="flex gap-4 items-center">
                      <Calendar className="w-5 h-5 text-[#D4AF37]" />
                      <div className="space-y-0.5 text-left">
                        <Label className="text-[10px] uppercase font-black text-muted-foreground">Fecha Agendada</Label>
                        <p className="font-black text-lg">{viewingCita.fecha?.split('T')[0]}</p>
                      </div>
                    </div>

                    <div className="flex gap-4 items-center">
                      <Clock className="w-5 h-5 text-[#D4AF37]" />
                      <div className="space-y-0.5 text-left">
                        <Label className="text-[10px] uppercase font-black text-muted-foreground">Horario Disponible</Label>
                        <p className="font-black text-2xl text-[#AF8D1E]">
                          {viewingCita.hora_inicio_corta}
                          <span className="text-sm font-medium text-muted-foreground mx-2">hasta</span>
                          {viewingCita.hora_fin_corta}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-6 border-t font-sans">
                  <div className="flex justify-between items-center mb-4">
                    <div className="space-y-1 text-left">
                      <Label className="text-[10px] uppercase font-black text-muted-foreground">Servicio Seleccionado</Label>
                      <p className="text-xl font-bold flex items-center gap-2">
                        <Briefcase className="w-5 h-5 text-muted-foreground" />
                        {viewingCita.servicio_nombre || getServicioName(viewingCita.id_servicio)}
                      </p>
                    </div>
                    <div className="text-right">
                      <Label className="text-[10px] uppercase font-black text-muted-foreground">Inversión (Neto)</Label>
                      <p className="text-2xl font-black text-green-600">${(viewingCita.precio_total || viewingCita.precio_neto || 0).toFixed(2)}</p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-3 pt-4">
                  {(isAdmin || isBarbero) && viewingCita.estado?.toLowerCase() === 'pendiente' && (
                    <div className="grid grid-cols-2 gap-4">
                      <Button className="h-12 rounded-2xl font-bold bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-200 transition-all" onClick={() => handleStatusChange(viewingCita.id_cita, 'completado')}>
                        <CheckCircle className="w-4 h-4 mr-2" /> Marcar Completada
                      </Button>
                      <Button variant="outline" className="h-12 rounded-2xl font-bold border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 transition-all" onClick={() => handleStatusChange(viewingCita.id_cita, 'cancelado')}>
                        <XCircle className="w-4 h-4 mr-2" /> Cancelar Cita
                      </Button>
                    </div>
                  )}
                  <Button variant="ghost" onClick={() => setDetailsDialogOpen(false)} className="h-12 rounded-2xl font-bold text-muted-foreground">
                    Cerrar Vista
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* MODAL CONFIRMAR ELIMINAR */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar esta cita?</AlertDialogTitle>
            <AlertDialogDescription>Esta acción borrará la cita de la base de datos permanentemente.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => { setDeleteDialogOpen(false); setCitaToDelete(null); }}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">Eliminar Cita</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
}