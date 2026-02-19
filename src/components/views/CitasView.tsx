import { useState, useEffect, useMemo } from 'react';
import { CitasCalendar } from './CitasCalendar';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import {
  Select,
  SelectContent,
  SelectGroup,
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
  Calendar,
  User,
  X
} from 'lucide-react';
import { cn } from '../ui/utils';
import { mockServicios, mockEmpleados, mockClientes, mockProductos, Cita, Venta, VentaProductoDetalle } from '../../shared/lib/mockData';
import { dataStore } from '../../shared/lib/dataStore';
import { useAuth } from '../../features/auth';
import { toast } from 'sonner';

// --- Utility Functions ---

const parseTimeToMinutes = (time: string) => {
  if (!time) return 0;
  const [hh, mm] = time.split(':').map(Number);
  return hh * 60 + mm;
};

const computeServiciosDuration = (cita: any) => {
  const ids: number[] = cita.id_servicios?.length ? cita.id_servicios : (cita.id_servicio ? [cita.id_servicio] : []);
  if (ids.length === 0) return 30;
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
  const servicesNames = ids.map(id => mockServicios.find(s => s.id_servicio === id)?.nombre || 'N/A');
  const productIds: number[] = cita.id_productos || [];
  const productsNames = productIds.map(id => mockProductos.find(p => p.id_producto === id)?.nombre || 'N/A');
  const allNames = [...servicesNames, ...productsNames];
  if (allNames.length === 0) return 'Sin servicio/producto';
  if (allNames.length > 2) return `${allNames.slice(0, 2).join(', ')}... (+${allNames.length - 2})`;
  return allNames.join(', ');
};

const hasConflict = (empId: number | undefined, fecha: string, hora: string, excludingId?: number, desiredDuration: number = 30) => {
  if (!empId) return false;
  const start = parseTimeToMinutes(hora);
  const end = start + desiredDuration;

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
  const serviceIds: number[] = (cita.id_servicios || []).map((id: any) => parseInt(id));
  if (serviceIds.length === 0 && cita.id_servicio) {
    serviceIds.push(parseInt(cita.id_servicio));
  }
  const serviciosTotal = serviceIds.reduce((sum, id) => {
    const price = mockServicios.find(s => s.id_servicio === id)?.precio || 0;
    return sum + price;
  }, 0);
  const productData: { id: string, cantidad: number }[] = cita.id_productos_detallados || [];
  const productosTotal = productData.reduce((sum, item) => {
    const price = mockProductos.find(p => p.id_producto === parseInt(item.id))?.precio || 0;
    return sum + (price * item.cantidad);
  }, 0);
  return serviciosTotal + productosTotal;
};

export function CitasView() {
  const { user } = useAuth();
  const [refreshKey, setRefreshKey] = useState(0);
  const refreshData = () => setRefreshKey((prev: number) => prev + 1);

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
    id_productos_detallados: [] as { id: string, cantidad: number }[],
    id_empleado: '',
    fecha: '',
    hora: '',
    estado: 'pendiente' as 'pendiente' | 'confirmada' | 'en-ejecucion' | 'completada' | 'cancelada',
    observaciones: '',
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [showForm, setShowForm] = useState(false);
  const [cantidadProductoInput, setCantidadProductoInput] = useState('1');

  const [calendarEmpleadoFilter, setCalendarEmpleadoFilter] = useState<string>(() => {
    try {
      return localStorage.getItem('calendarEmpleadoFilter') || 'all';
    } catch (e) {
      return 'all';
    }
  });

  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [dayDialogOpen, setDayDialogOpen] = useState(false);
  const [servicioSeleccionado, setServicioSeleccionado] = useState('');
  const [productoSeleccionadoCita, setProductoSeleccionadoCita] = useState('');

  const isAdmin = user?.id_rol === 1;
  const isBarbero = user?.id_rol === 2;
  const isCliente = user?.id_rol === 3;

  const { displayCitas, citasByDate, stats } = useMemo(() => {
    let list = dataStore.citas;
    if (isCliente) {
      const clienteRecord = dataStore.clientes.find(c => c.email === user?.email);
      list = list.filter(c => c.id_cliente === clienteRecord?.id_cliente);
    } else if (isBarbero) {
      const empleadoRecord = dataStore.empleados.find(e => e.email === user?.email);
      list = list.filter(c => c.id_empleado === empleadoRecord?.id_empleado);
    }

    let calendarList = list;
    if (calendarEmpleadoFilter && calendarEmpleadoFilter !== 'all') {
      const empId = parseInt(calendarEmpleadoFilter);
      calendarList = calendarList.filter(c => c.id_empleado === empId);
    }

    const statsObj = {
      pendiente: calendarList.filter(c => c.estado === 'pendiente').length,
      confirmada: calendarList.filter(c => c.estado === 'confirmada').length,
      'en-ejecucion': calendarList.filter(c => c.estado === 'en-ejecucion').length,
      completada: calendarList.filter(c => c.estado === 'completada').length,
      cancelada: calendarList.filter(c => c.estado === 'cancelada').length,
    };

    const term = searchTerm.toLowerCase();
    const searched = list.filter(cita => {
      if (!term) return true;
      const clienteName = getClienteName(cita.id_cliente, cita.id_cliente_temporal).toLowerCase();
      const sName = getServicioName(cita.id_servicio).toLowerCase();
      const eName = getEmpleadoName(cita.id_empleado).toLowerCase();
      return clienteName.includes(term) || sName.includes(term) || eName.includes(term) ||
        cita.id_cita.toString().includes(term) || cita.fecha.includes(term) || cita.estado.toLowerCase().includes(term);
    });

    const byDate: Record<string, Cita[]> = {};
    calendarList.forEach(c => {
      if (!byDate[c.fecha]) byDate[c.fecha] = [];
      byDate[c.fecha].push(c);
    });

    return { displayCitas: searched, citasByDate: byDate, stats: statsObj };
  }, [user, searchTerm, calendarEmpleadoFilter, refreshKey]);

  useEffect(() => {
    const targetDate = editingCita?.fecha || formData.fecha;
    if (targetDate) {
      const d = new Date(targetDate + 'T00:00:00');
      if (!isNaN(d.getTime())) setSelectedDate(targetDate);
    }
  }, [editingCita?.fecha, formData.fecha]);

  useEffect(() => {
    try {
      localStorage.setItem('calendarEmpleadoFilter', calendarEmpleadoFilter);
    } catch (e) { }
  }, [calendarEmpleadoFilter]);

  const handleCreate = (date?: string, employeeId?: string) => {
    const baseData = {
      id_cliente: '',
      id_servicio: '',
      id_servicios: [] as string[],
      id_productos_detallados: [] as { id: string, cantidad: number }[],
      id_empleado: employeeId || '',
      fecha: date || '',
      hora: '',
      estado: 'pendiente' as const,
      observaciones: '',
    };
    if (isCliente) {
      const clienteRecord = dataStore.clientes.find(c => c.email === user?.email);
      if (clienteRecord) baseData.id_cliente = clienteRecord.id_cliente.toString();
    }
    setEditingCita(null);
    setFormData(baseData);
    setServicioSeleccionado('');
    setProductoSeleccionadoCita('');
    setCantidadProductoInput('1');
    setFormErrors({});
    setShowForm(true);
  };

  const handleEdit = (cita: Cita) => {
    if (isCliente) {
      toast.error('No tienes permisos para editar citas');
      return;
    }
    setEditingCita(cita);
    const detailedProducts = (cita.id_productos || []).map(id => ({ id: id.toString(), cantidad: 1 }));
    const consolidatedProducts: { id: string, cantidad: number }[] = [];
    detailedProducts.forEach(p => {
      const existing = consolidatedProducts.find(cp => cp.id === p.id);
      if (existing) existing.cantidad += 1;
      else consolidatedProducts.push(p);
    });

    setFormData({
      id_cliente: cita.id_cliente.toString(),
      id_servicio: cita.id_servicio ? cita.id_servicio.toString() : '',
      id_servicios: cita.id_servicios ? cita.id_servicios.map(s => s.toString()) : (cita.id_servicio ? [cita.id_servicio.toString()] : []),
      id_productos_detallados: consolidatedProducts,
      id_empleado: cita.id_empleado?.toString() || '',
      fecha: cita.fecha,
      hora: cita.hora,
      estado: cita.estado,
      observaciones: cita.observaciones || '',
    });
    setServicioSeleccionado('');
    setProductoSeleccionadoCita('');
    setCantidadProductoInput('1');
    setFormErrors({});
    setShowForm(true);
  };

  const handleDelete = (id: number) => {
    if (isCliente) return toast.error('No tienes permisos');
    setCitaToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (citaToDelete) {
      const index = dataStore.citas.findIndex(c => c.id_cita === citaToDelete);
      if (index !== -1) {
        dataStore.citas.splice(index, 1);
        refreshData();
        toast.success('Cita eliminada');
      }
    }
    setDeleteDialogOpen(false);
    setCitaToDelete(null);
  };

  const computeSelectedServicesDuration = () => {
    const ids = formData.id_servicios.map(s => parseInt(s));
    if (!ids.length && formData.id_servicio) ids.push(parseInt(formData.id_servicio));
    return ids.length ? ids.reduce((sum, id) => sum + (mockServicios.find(s => s.id_servicio === id)?.duracion || 30), 0) : 30;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};
    if (!formData.id_cliente) errors.id_cliente = 'Debes seleccionar un cliente';
    if (!formData.id_servicios.length && !formData.id_servicio) errors.servicios = 'Selecciona al menos un servicio';
    if (!formData.fecha) errors.fecha = 'Selecciona la fecha';
    if (!formData.hora) errors.hora = 'Selecciona la hora';

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      toast.error('Completa los campos obligatorios');
      return;
    }

    const empId = formData.id_empleado ? parseInt(formData.id_empleado) : undefined;
    const dur = computeSelectedServicesDuration();
    if (empId && hasConflict(empId, formData.fecha, formData.hora, editingCita?.id_cita, dur)) {
      toast.error('El barbero ya tiene una cita en ese horario');
      return;
    }

    const flatProductIds: number[] = [];
    formData.id_productos_detallados.forEach(p => {
      for (let i = 0; i < p.cantidad; i++) flatProductIds.push(parseInt(p.id));
    });

    const common = {
      id_cliente: parseInt(formData.id_cliente) || 0,
      id_servicio: parseInt(formData.id_servicios[0] || formData.id_servicio || '0'),
      id_servicios: formData.id_servicios.map(s => parseInt(s)),
      id_productos: flatProductIds,
      id_empleado: empId,
      fecha: formData.fecha,
      hora: formData.hora,
      estado: formData.estado as Cita['estado'],
      observaciones: formData.observaciones,
    };

    if (editingCita) {
      const idx = dataStore.citas.findIndex(c => c.id_cita === editingCita.id_cita);
      if (idx !== -1) dataStore.citas[idx] = { ...dataStore.citas[idx], ...common };
    } else {
      dataStore.citas.push({ id_cita: getNextCitaId(), ...common });
    }
    refreshData();
    setShowForm(false);
    toast.success('¡Cita registrada exitosamente!');
  };

  const handleStatusChange = (id: number, status: Cita['estado']) => {
    const idx = dataStore.citas.findIndex(c => c.id_cita === id);
    if (idx !== -1) {
      const oldStatus = dataStore.citas[idx].estado;
      dataStore.citas[idx].estado = status;

      // Si la cita se marca como completada y no estaba completada antes, creamos la venta
      if (status === 'completada' && oldStatus !== 'completada') {
        const cita = dataStore.citas[idx];
        const newVentaId = Math.max(...dataStore.ventas.map(v => v.id_venta), 100) + 1;

        // Preparar detalles (Servicios + Productos)
        const currentDetalleId = Math.max(...dataStore.ventasDetalle.map(d => d.id_venta_prod_detalle), 500);
        let detailCounter = 1;

        // 1. Detalles de Servicios
        const serviceIds = cita.id_servicios || (cita.id_servicio ? [cita.id_servicio] : []);
        const serviceDetails: VentaProductoDetalle[] = serviceIds.map(sid => {
          const service = mockServicios.find(s => s.id_servicio === sid);
          return {
            id_venta_prod_detalle: currentDetalleId + detailCounter++,
            id_venta: newVentaId,
            tipo: 'servicio',
            id_servicio: sid,
            cantidad: 1,
            precio_unitario: service?.precio || 0,
            subtotal: service?.precio || 0,
          };
        });

        // 2. Detalles de Productos
        // Usamos id_productos (lista plana)
        const productIds = cita.id_productos || [];
        const productDetails: VentaProductoDetalle[] = [];

        // Consolidar productos por ID
        const productCounts = productIds.reduce((acc, pid) => {
          acc[pid] = (acc[pid] || 0) + 1;
          return acc;
        }, {} as Record<number, number>);

        Object.entries(productCounts).forEach(([pidStr, qty]) => {
          const pid = parseInt(pidStr);
          const product = mockProductos.find(p => p.id_producto === pid);
          productDetails.push({
            id_venta_prod_detalle: currentDetalleId + detailCounter++,
            id_venta: newVentaId,
            tipo: 'producto',
            id_producto: pid,
            cantidad: qty,
            precio_unitario: product?.precio || 0,
            subtotal: (product?.precio || 0) * qty,
          });
        });

        const allDetails = [...serviceDetails, ...productDetails];
        const total = allDetails.reduce((sum, d) => sum + d.subtotal, 0);

        const newVenta: Venta = {
          id_venta: newVentaId,
          id_cliente: cita.id_cliente,
          id_usuario: user?.id_usuario || 1,
          fecha: cita.fecha,
          total: total,
          estado: 'pagada',
        };

        dataStore.ventas.push(newVenta);
        dataStore.ventasDetalle.push(...allDetails);
        toast.success(`Venta #${newVentaId} generada por $${total.toFixed(2)}`, {
          icon: '💰'
        });
      }

      refreshData();
      toast.success(`Cita marcada como ${status}`);
    }
  };

  const handleConfirm = (id: number) => handleStatusChange(id, 'confirmada');
  const handleComplete = (id: number) => handleStatusChange(id, 'completada');
  const handleCancel = (id: number) => handleStatusChange(id, 'cancelada');

  const handleViewDetails = (cita: Cita) => { setViewingCita(cita); setDetailsDialogOpen(true); };
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => _setSearchTerm(e.target.value);

  const getOccupiedTimes = (fecha?: string, empId?: number, excludingId?: number) => {
    if (!fecha || !empId) return [];
    const dur = computeSelectedServicesDuration();
    return timeSlots.filter(slot => {
      const start = parseTimeToMinutes(slot);
      const end = start + dur;
      return dataStore.citas.some(c => {
        if (c.id_empleado !== empId || c.fecha !== fecha || c.id_cita === excludingId) return false;
        const cStart = parseTimeToMinutes(c.hora);
        const cEnd = cStart + computeServiciosDuration(c);
        return start < cEnd && cStart < end;
      });
    });
  };

  const handleSelectDay = (dateStr: string) => {
    setSelectedDate(dateStr);
    if (window.innerWidth < 1024) setDayDialogOpen(true);
  };

  const handleAgregarServicioCita = () => {
    if (!servicioSeleccionado) return toast.error('Elige un servicio de la lista');
    if (formData.id_servicios.includes(servicioSeleccionado)) return toast.error('Servicio ya incluido');
    setFormData(prev => ({ ...prev, id_servicios: [...prev.id_servicios, servicioSeleccionado] }));
    setServicioSeleccionado('');
  };

  const handleAgregarProductoCita = () => {
    if (!productoSeleccionadoCita) return toast.error('Elige un producto');
    const qty = parseInt(cantidadProductoInput);
    if (isNaN(qty) || qty <= 0) return toast.error('Indica una cantidad válida');
    setFormData(prev => {
      const current = [...prev.id_productos_detallados];
      const idx = current.findIndex(i => i.id === productoSeleccionadoCita);
      if (idx >= 0) current[idx].cantidad += qty;
      else current.push({ id: productoSeleccionadoCita, cantidad: qty });
      return { ...prev, id_productos_detallados: current };
    });
    setProductoSeleccionadoCita('');
    setCantidadProductoInput('1');
  };

  const todayStr = new Date().toISOString().slice(0, 10);

  return (
    <div className="flex flex-col gap-12 p-4 md:p-8 max-w-[1600px] mx-auto w-full">
      <div className="flex items-center justify-between pb-6 border-b">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold">
            <Calendar className="w-6 h-6 text-[#D4AF37]" />
            Citas
          </h1>
          <p className="text-muted-foreground">
            {isCliente ? 'Gestiona tus citas' : 'Gestiona las citas programadas'}
          </p>
        </div>
        {!showForm && (
          <Button onClick={() => handleCreate()} className="bg-[#D4AF37] hover:bg-[#B8941F] text-black shadow-md hover:shadow-[#D4AF37]/20 transition-all">
            <Plus className="w-4 h-4 mr-2" />
            Nueva Cita
          </Button>
        )}
      </div>

      {!showForm ? (
        <>
          {(isAdmin || isBarbero) && (
            <section className="animate-in fade-in duration-500">
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                {Object.entries(stats).map(([k, v]) => (
                  <Card key={k} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-4">
                        <div className={cn(
                          "p-3 rounded-lg",
                          k === 'pendiente' && 'bg-yellow-100 text-yellow-600',
                          k === 'confirmada' && 'bg-blue-100 text-blue-600',
                          k === 'en-ejecucion' && 'bg-orange-100 text-orange-600',
                          k === 'completada' && 'bg-green-100 text-green-600',
                          k === 'cancelada' && 'bg-red-100 text-red-600'
                        )}>
                          {k === 'completada' ? <CheckCircle className="w-6 h-6" /> :
                            k === 'cancelada' ? <XCircle className="w-6 h-6" /> :
                              <Clock className="w-6 h-6" />}
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground capitalize font-medium">{k.replace('-', ' ')}</p>
                          <p className="text-2xl font-bold">{v}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          )}

          <section className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
              <Card className="lg:col-span-3 shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between border-b pb-4">
                  <CardTitle className="text-xl">Panel de Calendario</CardTitle>
                  <div className="flex items-center gap-3">
                    <Label className="text-xs text-muted-foreground font-bold">Barbero:</Label>
                    <Select value={calendarEmpleadoFilter} onValueChange={setCalendarEmpleadoFilter}>
                      <SelectTrigger className="w-48 h-9"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos los barberos</SelectItem>
                        {mockEmpleados.map(e => <SelectItem key={e.id_empleado} value={e.id_empleado.toString()}>{e.nombre}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  <CitasCalendar citasByDate={citasByDate} selectedDate={selectedDate} onSelectDay={handleSelectDay} onEventClick={handleViewDetails} />
                </CardContent>
              </Card>

              <Card className="lg:col-span-1 h-fit sticky top-4 shadow-sm border-[#D4AF37]/10">
                <CardHeader className="border-b bg-muted/20 pb-4">
                  <CardTitle className="text-lg flex items-center gap-2"><Clock className="w-5 h-5 text-[#D4AF37]" /> Agenda del Día</CardTitle>
                  <CardDescription className="font-medium text-xs">
                    {selectedDate ? new Date(selectedDate + 'T00:00:00').toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' }) : 'Selecciona una fecha'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-0 max-h-[500px] overflow-y-auto custom-scrollbar">
                  {(() => {
                    const dayCitas = selectedDate ? (citasByDate[selectedDate] || []) : [];
                    if (!selectedDate) return <div className="p-10 text-center italic text-muted-foreground text-sm">Escoge un día en el calendario</div>;
                    if (!dayCitas.length) return <div className="p-10 text-center text-muted-foreground text-sm">Sin actividades programadas</div>;

                    return dayCitas.sort((a, b) => parseTimeToMinutes(a.hora) - parseTimeToMinutes(b.hora)).map(c => (
                      <div key={c.id_cita} className="p-4 border-b hover:bg-muted/30 transition-colors group cursor-pointer" onClick={() => handleViewDetails(c)}>
                        <div className="flex justify-between items-start mb-2">
                          <Badge variant="outline" className="font-bold text-[10px]">{c.hora}</Badge>
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); handleEdit(c); }}><Pencil className="h-3.5 w-3.5" /></Button>
                            <Button size="icon" variant="ghost" className="h-7 w-7 text-red-500" onClick={(e) => { e.stopPropagation(); handleDelete(c.id_cita); }}><Trash2 className="h-3.5 w-3.5" /></Button>
                          </div>
                        </div>
                        <p className="text-sm font-bold text-foreground truncate">{getServicioName(c.id_servicio)}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{getClienteName(c.id_cliente)}</p>
                      </div>
                    ));
                  })()}
                </CardContent>
                <CardFooter className="p-4 bg-muted/30 border-t">
                  <Button className="w-full bg-[#D4AF37] hover:bg-[#B8941F] text-black font-bold" onClick={() => handleCreate(selectedDate || todayStr)}>
                    <Plus className="w-4 h-4 mr-2" /> Agendar ahora
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </section>

          <section className="mt-8">
            <Card className="shadow-sm">
              <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b pb-4">
                <div><CardTitle className="text-xl">Historial Maestro</CardTitle></div>
                <div className="relative w-full md:w-80">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Filtrar por nombre o servicio..." value={searchTerm} onChange={handleSearch} className="pl-9" />
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader className="bg-muted/10">
                    <TableRow>
                      <TableHead className="pl-6">Cliente</TableHead><TableHead>Servicios</TableHead><TableHead>Horario</TableHead><TableHead>Estado</TableHead><TableHead className="text-right pr-6">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {displayCitas.map(c => (
                      <TableRow key={c.id_cita} className="hover:bg-muted/5">
                        <TableCell className="pl-6 font-medium">{getClienteName(c.id_cliente)}</TableCell>
                        <TableCell className="max-w-[250px] truncate">{formatServicios(c)}</TableCell>
                        <TableCell>
                          <div className="flex flex-col"><span className="text-sm">{c.fecha}</span><span className="text-xs text-muted-foreground">{c.hora}</span></div>
                        </TableCell>
                        <TableCell>
                          <Badge className={cn(
                            "text-[10px]",
                            c.estado === 'completada' ? 'bg-green-600' :
                              c.estado === 'confirmada' ? 'bg-blue-600' :
                                c.estado === 'pendiente' ? 'bg-yellow-600' : 'bg-red-600'
                          )}>{c.estado}</Badge>
                        </TableCell>
                        <TableCell className="text-right pr-6">
                          <div className="flex justify-end gap-1">
                            <Button variant="ghost" size="icon" onClick={() => handleViewDetails(c)}><Eye className="h-4 w-4" /></Button>
                            {!isCliente && (
                              <div className="flex gap-1 border-l ml-1 pl-1">
                                {c.estado === 'pendiente' && <Button variant="ghost" size="icon" className="text-blue-600" onClick={() => handleConfirm(c.id_cita)}><CheckCircle className="h-4 w-4" /></Button>}
                                {c.estado === 'confirmada' && <Button variant="ghost" size="icon" className="text-orange-600" onClick={() => handleStatusChange(c.id_cita, 'en-ejecucion')}><Clock className="h-4 w-4" /></Button>}
                                {c.estado === 'en-ejecucion' && <Button variant="ghost" size="icon" className="text-green-600" onClick={() => handleComplete(c.id_cita)}><CheckCircle className="h-4 w-4" /></Button>}
                                <Button variant="ghost" size="icon" onClick={() => handleEdit(c)}><Pencil className="h-4 w-4" /></Button>
                                <Button variant="ghost" size="icon" className="text-red-500" onClick={() => handleCancel(c.id_cita)} disabled={c.estado === 'cancelada'}><XCircle className="h-4 w-4" /></Button>
                              </div>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </section>
        </>
      ) : (
        <Card className="border-2 border-[#D4AF37]/20 shadow-2xl animate-in slide-in-from-bottom-2 fade-in duration-300">
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
                <div className="space-y-6">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-[#D4AF37] border-b pb-2">Datos Principales</h3>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Cliente Responsable *</Label>
                      <Select value={formData.id_cliente} onValueChange={v => setFormData({ ...formData, id_cliente: v })}>
                        <SelectTrigger className={cn("h-11", formErrors.id_cliente && "border-destructive")}>
                          <SelectValue placeholder="Seleccionar cliente..." />
                        </SelectTrigger>
                        <SelectContent>{mockClientes.map(c => <SelectItem key={c.id_cliente} value={c.id_cliente.toString()}>{c.nombre} {c.apellido}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Profesional asignado</Label>
                      <Select value={formData.id_empleado} onValueChange={v => setFormData({ ...formData, id_empleado: v })}>
                        <SelectTrigger className="h-11"><SelectValue placeholder="Seleccionar barbero" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="0" className="italic text-muted-foreground">Por asignar</SelectItem>
                          {mockEmpleados.map(e => <SelectItem key={e.id_empleado} value={e.id_empleado.toString()}>{e.nombre}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-2"><Label>Fecha *</Label><Input type="date" value={formData.fecha} onChange={e => setFormData({ ...formData, fecha: e.target.value })} className="h-11" /></div>
                      <div className="space-y-2"><Label>Hora *</Label>
                        <Select value={formData.hora} onValueChange={v => setFormData({ ...formData, hora: v })}>
                          <SelectTrigger className="h-11"><SelectValue placeholder="Bloque" /></SelectTrigger>
                          <SelectContent className="max-h-60 overflow-y-auto">
                            <SelectGroup>
                              {timeSlots.map(s => {
                                const occupied = getOccupiedTimes(formData.fecha, parseInt(formData.id_empleado), editingCita?.id_cita);
                                const isOccupied = occupied.includes(s);
                                return (
                                  <SelectItem key={s} value={s} disabled={isOccupied}>{s} {isOccupied ? '(Ocupado)' : ''}</SelectItem>
                                );
                              })}
                            </SelectGroup>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-[#D4AF37] border-b pb-2">Servicios y Productos</h3>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Añadir Servicios *</Label>
                      <div className="flex gap-2">
                        <Select value={servicioSeleccionado} onValueChange={setServicioSeleccionado}>
                          <SelectTrigger className="h-11 flex-1"><SelectValue placeholder="Elegir servicio..." /></SelectTrigger>
                          <SelectContent>{mockServicios.map(s => <SelectItem key={s.id_servicio} value={s.id_servicio.toString()}>{s.nombre} — ${s.precio}</SelectItem>)}</SelectContent>
                        </Select>
                        <Button type="button" variant="secondary" onClick={handleAgregarServicioCita} className="h-11"><Plus /></Button>
                      </div>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {formData.id_servicios.map(sid => (
                          <Badge key={sid} className="bg-foreground text-background py-1.5 px-3">
                            {getServicioName(parseInt(sid))} <X className="ml-2 h-3 w-3 cursor-pointer" onClick={() => setFormData(p => ({ ...p, id_servicios: p.id_servicios.filter(id => id !== sid) }))} />
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Venta de Productos</Label>
                      <div className="flex gap-2">
                        <Select value={productoSeleccionadoCita} onValueChange={setProductoSeleccionadoCita}>
                          <SelectTrigger className="h-11 flex-1"><SelectValue placeholder="Elegir producto..." /></SelectTrigger>
                          <SelectContent>{mockProductos.map(p => <SelectItem key={p.id_producto} value={p.id_producto.toString()}>{p.nombre}</SelectItem>)}</SelectContent>
                        </Select>
                        <Input type="number" min="1" className="w-16 h-11" value={cantidadProductoInput} onChange={e => setCantidadProductoInput(e.target.value)} />
                        <Button type="button" variant="outline" onClick={handleAgregarProductoCita} className="h-11"><Plus /></Button>
                      </div>
                      <div className="space-y-2 mt-4 max-h-[150px] overflow-y-auto">
                        {formData.id_productos_detallados.map(i => (
                          <div key={i.id} className="flex justify-between items-center p-3 bg-muted/30 rounded-lg text-xs font-bold">
                            <span>{mockProductos.find(p => p.id_producto === parseInt(i.id))?.nombre} (x{i.cantidad})</span>
                            <X className="h-4 w-4 cursor-pointer text-red-500" onClick={() => setFormData(p => ({ ...p, id_productos_detallados: p.id_productos_detallados.filter(item => item.id !== i.id) }))} />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="p-5 bg-[#D4AF37]/10 rounded-xl border border-[#D4AF37]/30 flex justify-between items-center">
                    <div className="flex flex-col"><span className="text-[10px] font-black text-[#D4AF37] uppercase">Total Liquidado</span><span className="text-3xl font-black text-[#D4AF37]">${computeServiciosPrice(formData).toFixed(2)}</span></div>
                    <div className="text-right text-xs font-bold text-muted-foreground"><Clock className="inline w-3 h-3 mr-1" /> {formatDuration(computeSelectedServicesDuration())}</div>
                  </div>
                </div>
              </div>
              <div className="mt-8 space-y-2">
                <Label>Observaciones Técnicas / Notas</Label>
                <Textarea value={formData.observaciones} onChange={e => setFormData({ ...formData, observaciones: e.target.value })} rows={3} className="resize-none" />
              </div>
            </CardContent>
            <CardFooter className="bg-muted/30 p-8 flex justify-end gap-3 border-t">
              <Button type="button" variant="outline" onClick={() => setShowForm(false)} className="h-12 px-8">Cancelar</Button>
              <Button type="submit" className="bg-[#D4AF37] text-black h-12 px-12 font-black text-lg">Guardar registro</Button>
            </CardFooter>
          </form>
        </Card>
      )}

      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent className="max-w-xl p-0 overflow-hidden rounded-2xl">
          <DialogHeader className="bg-[#1a1a1a] text-white p-6">
            <DialogTitle className="uppercase tracking-tighter">Resumen de Cita</DialogTitle>
            <DialogDescription className="text-white/50">ID: {viewingCita?.id_cita}</DialogDescription>
          </DialogHeader>
          <div className="p-8 space-y-6">
            {viewingCita && (
              <>
                <div className="grid grid-cols-2 gap-6">
                  <div><Label className="text-[10px] uppercase font-bold text-muted-foreground">Cliente</Label><p className="font-bold">{getClienteName(viewingCita.id_cliente, viewingCita.id_cliente_temporal)}</p><p className="text-xs text-muted-foreground">{getClienteEmail(viewingCita.id_cliente, viewingCita.id_cliente_temporal)}</p><p className="text-xs text-muted-foreground">{getClienteTelefono(viewingCita.id_cliente, viewingCita.id_cliente_temporal)}</p></div>
                  <div><Label className="text-[10px] uppercase font-bold text-muted-foreground">Barbero</Label><p className="font-bold">{getEmpleadoName(viewingCita.id_empleado)}</p></div>
                  <div><Label className="text-[10px] uppercase font-bold text-muted-foreground">Programación</Label><p className="font-bold">{viewingCita.fecha}</p><p className="text-sm font-bold text-[#D4AF37]">{viewingCita.hora}</p></div>
                  <div><Label className="text-[10px] uppercase font-bold text-muted-foreground">Estado</Label><Badge>{viewingCita.estado}</Badge></div>
                </div>
                <div className="pt-4 border-t space-y-2">
                  <Label className="text-[10px] uppercase font-bold text-muted-foreground">Servicios</Label>
                  <p className="text-sm font-medium">{formatServicios(viewingCita)}</p>
                  <div className="flex justify-between items-center bg-muted/40 p-4 rounded-lg mt-4">
                    <span className="font-bold text-sm">TOTAL</span>
                    <span className="text-2xl font-black text-orange-600">${computeServiciosPrice(viewingCita).toFixed(2)}</span>
                  </div>
                </div>
              </>
            )}
            <Button onClick={() => setDetailsDialogOpen(false)} className="w-full h-11 font-bold">Cerrar</Button>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-2xl font-black">¿Confirmar eliminación?</AlertDialogTitle>
            <AlertDialogDescription>Esta acción es permanente y no se podrá recuperar el registro.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="pt-4">
            <AlertDialogCancel className="h-11 px-6 rounded-xl">Mantener</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="h-11 px-8 bg-red-600 font-extrabold rounded-xl">Eliminar definitivamente</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={dayDialogOpen} onOpenChange={setDayDialogOpen}>
        <DialogContent className="rounded-2xl">
          <DialogHeader><DialogTitle className="font-black">Agenda: {selectedDate}</DialogTitle></DialogHeader>
          <div className="space-y-3 py-4">
            {(selectedDate ? (citasByDate[selectedDate] || []) : []).map(c => (
              <div key={c.id_cita} className="flex justify-between p-4 bg-muted/30 rounded-xl border items-center hover:bg-muted/50 transition-all" onClick={() => { handleViewDetails(c); setDayDialogOpen(false); }}>
                <div className="flex flex-col"><span className="font-black text-sm">{c.hora}</span><span className="text-xs text-muted-foreground">{getServicioName(c.id_servicio)}</span><span className="text-[10px] font-bold mt-1">{getClienteName(c.id_cliente)}</span></div>
                <Button size="icon" variant="ghost" className="rounded-full"><Eye className="w-4 h-4" /></Button>
              </div>
            ))}
          </div>
          <DialogFooter className="flex gap-2"><Button variant="outline" onClick={() => setDayDialogOpen(false)} className="flex-1 h-11">Cerrar</Button><Button onClick={() => { handleCreate(selectedDate || todayStr); setDayDialogOpen(false); }} className="flex-1 bg-[#D4AF37] text-black font-black h-11">Añadir Cita</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
