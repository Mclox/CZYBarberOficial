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
import { Plus, Minus, Pencil, Trash2, Search, CheckCircle, XCircle, Clock, Calendar, X, Users, AlertCircle, Package } from 'lucide-react';
import { cn } from '../ui/utils';
import { useAuth } from '../../features/auth';
import { toast } from 'sonner';
import { fetchApi } from '../../lib/api';
import { formatCOP } from '../../lib/format';

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
  const [productos, setProductos] = useState<any[]>([]);
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

  // --- Estados para múltiples servicios y productos ---
  const [selectedServicios, setSelectedServicios] = useState<{ id_servicio: number; cantidad: number }[]>([]);
  const [selectedProductos, setSelectedProductos] = useState<{ id_producto: number; cantidad: number }[]>([]);
  
  const [selectedServiceId, setSelectedServiceId] = useState<string>('');
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [productQtyToAdd, setProductQtyToAdd] = useState<number>(1);

  const isAdmin = user?.id_rol === 1 || user?.rol === 'Administrador';
  const isBarbero = user?.id_rol === 2 || user?.rol === 'Barbero';
  const isCliente = user?.id_rol === 3 || user?.rol === 'Cliente';

  const todayStr = new Date().toISOString().split('T')[0];

  // --- FETCH DATA ---
  const fetchData = async () => {
    setLoading(true);
    try {
      const [resCitas, resClientes, resBarberos, resServicios, resProductos] = await Promise.all([
        fetchApi('/appointments').catch(() => ({ success: false, data: [] })),
        fetchApi('/clients').catch(() => ({ success: false, data: [] })),
        fetchApi(isBarbero || isCliente ? '/employees/public' : '/employees').catch(() => ({ success: false, data: [] })),
        fetchApi(isBarbero || isCliente ? '/services/public' : '/services').catch(() => ({ success: false, data: [] })),
        fetchApi(isBarbero || isCliente ? '/products/public' : '/products').catch(() => ({ success: false, data: [] }))
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
      if (resProductos.success) setProductos(resProductos.data);
    } catch (error) {
      toast.error('Error al cargar la información desde la base de datos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  // Autocompletar cliente responsable para el rol Cliente
  useEffect(() => {
    if (isCliente && clientes.length > 0 && showForm) {
      const miCliente = clientes.find(c => c.id_usuario === user?.id_usuario);
      if (miCliente && !formData.id_cliente) {
        setFormData(prev => ({ ...prev, id_cliente: miCliente.id_cliente.toString() }));
      }
    }
  }, [clientes, isCliente, user, showForm]);

  // Autocompletar profesional asignado para el rol Barbero
  useEffect(() => {
    if (isBarbero && barberos.length > 0 && showForm) {
      const miBarbero = barberos.find(b => b.id_usuario === user?.id_usuario);
      if (miBarbero && !formData.id_barbero) {
        setFormData(prev => ({ ...prev, id_barbero: miBarbero.id_empleado.toString() }));
      }
    }
  }, [barberos, isBarbero, user, showForm]);

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
  const subtotalServicios = useMemo(() => {
    return selectedServicios.reduce((total, item) => {
      const sObj = servicios.find(s => s.id_servicio === item.id_servicio);
      return total + (sObj?.precio_neto || 0) * item.cantidad;
    }, 0);
  }, [selectedServicios, servicios]);

  const subtotalProductos = useMemo(() => {
    return selectedProductos.reduce((total, item) => {
      const pObj = productos.find(p => p.id_producto === item.id_producto);
      return total + (pObj?.precio_neto || 0) * item.cantidad;
    }, 0);
  }, [selectedProductos, productos]);

  const totalGeneral = subtotalServicios + subtotalProductos;

  const duracionTotal = useMemo(() => {
    return selectedServicios.reduce((total, item) => {
      const sObj = servicios.find(s => s.id_servicio === item.id_servicio);
      return total + (sObj?.duracion_minutos || 30) * item.cantidad;
    }, 0);
  }, [selectedServicios, servicios]);

  const selectedClienteObj = clientes.find(c => c.id_cliente.toString() === formData.id_cliente);
  const clienteDocumento = selectedClienteObj?.documento 
    ? `${selectedClienteObj.tipo_documento || 'CC'} - ${selectedClienteObj.documento}` 
    : '';

  const selectedBarberoObj = barberos.find(b => (b.id_empleado || b.id_barbero || b.id_usuario).toString() === formData.id_barbero);
  const barberoDocumento = selectedBarberoObj?.documento 
    ? `${selectedBarberoObj.tipo_documento || 'CC'} - ${selectedBarberoObj.documento}` 
    : '';

  // --- FILTROS Y ESTADÍSTICAS ---
  const { citasByDate, stats } = useMemo(() => {
    let list = citas;

    if (isBarbero && user?.id_usuario) {
      const miBarbero = barberos.find(b => b.id_usuario === user.id_usuario);
      if (miBarbero) {
        list = list.filter(c => c.id_barbero === miBarbero.id_empleado);
      }
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

    return { citasByDate: byDate, stats: statsObj };
  }, [citas, calendarEmpleadoFilter, user, clientes]);

  // --- VALIDACIONES DE REGLAS DE NEGOCIO (SERVICIOS) ---
  const validateServiceAddition = (serviceId: number): string | null => {
    const serviceToAdd = servicios.find(s => s.id_servicio === serviceId);
    if (!serviceToAdd) return 'Servicio no encontrado';

    const normalize = (name: string) => name.toLowerCase().replace(/\s+/g, '').replace(/[áàäâ]/g, 'a').replace(/[éèëê]/g, 'e').replace(/[íìïî]/g, 'i').replace(/[óòöô]/g, 'o').replace(/[úùüû]/g, 'u');
    const nameToAdd = normalize(serviceToAdd.nombre);

    const currentSelectedObjects = selectedServicios.map(item => ({
      id_servicio: item.id_servicio,
      name: normalize(servicios.find(s => s.id_servicio === item.id_servicio)?.nombre || '')
    }));

    if (currentSelectedObjects.some(item => item.id_servicio === serviceId)) {
      return null;
    }

    const getParts = (name: string) => {
      if (name.includes('+')) return name.split('+').map(p => p.trim());
      if (name.includes('y') && !name.startsWith('y')) return name.split('y').map(p => p.trim());
      return [name];
    };

    const addedParts = getParts(nameToAdd);

    if (addedParts.length > 1) {
      for (const part of addedParts) {
        if (currentSelectedObjects.some(item => item.name === part || item.name.includes(part) || part.includes(item.name))) {
          const matchingObj = currentSelectedObjects.find(item => item.name === part || item.name.includes(part) || part.includes(item.name));
          const actualName = servicios.find(s => s.id_servicio === matchingObj?.id_servicio)?.nombre;
          return `No puedes agregar "${serviceToAdd.nombre}" porque ya tienes el servicio individual o conflictivo "${actualName}" en la cita.`;
        }
      }
    }

    for (const sel of currentSelectedObjects) {
      const selParts = getParts(sel.name);
      if (selParts.length > 1) {
        if (selParts.some(part => part === nameToAdd || part.includes(nameToAdd) || nameToAdd.includes(part))) {
          const actualSelName = servicios.find(s => s.id_servicio === sel.id_servicio)?.nombre;
          return `No puedes agregar "${serviceToAdd.nombre}" porque ya tienes el servicio combinado "${actualSelName}" en la cita.`;
        }
      }
    }

    return null;
  };

  const handleAddService = () => {
    if (!selectedServiceId) return;
    const sId = parseInt(selectedServiceId);
    
    const errorMsg = validateServiceAddition(sId);
    if (errorMsg) {
      toast.error(errorMsg);
      return;
    }

    setSelectedServicios(prev => {
      const existingIndex = prev.findIndex(item => item.id_servicio === sId);
      if (existingIndex > -1) {
        const next = [...prev];
        next[existingIndex].cantidad += 1;
        return next;
      } else {
        return [...prev, { id_servicio: sId, cantidad: 1 }];
      }
    });
    setSelectedServiceId('');
  };

  const handleRemoveService = (sId: number) => {
    setSelectedServicios(prev => prev.filter(item => item.id_servicio !== sId));
  };

  const handleServiceQtyChange = (sId: number, qty: number) => {
    if (qty < 1) return;
    setSelectedServicios(prev => prev.map(item => item.id_servicio === sId ? { ...item, cantidad: qty } : item));
  };

  const handleAddProduct = () => {
    if (!selectedProductId) return;
    const pId = parseInt(selectedProductId);
    const prod = productos.find(p => p.id_producto === pId);
    if (!prod) {
      toast.error('Producto no encontrado');
      return;
    }

    const requestedQty = productQtyToAdd;
    if (requestedQty < 1) {
      toast.error('La cantidad debe ser al menos 1');
      return;
    }

    const currentSelectedQty = selectedProductos.find(p => p.id_producto === pId)?.cantidad || 0;
    const totalQty = currentSelectedQty + requestedQty;

    if (totalQty > (prod.stock || 0)) {
      toast.error(`Stock insuficiente para "${prod.nombre}". Stock disponible: ${prod.stock || 0}`);
      return;
    }

    setSelectedProductos(prev => {
      const existingIndex = prev.findIndex(item => item.id_producto === pId);
      if (existingIndex > -1) {
        const next = [...prev];
        next[existingIndex].cantidad = totalQty;
        return next;
      } else {
        return [...prev, { id_producto: pId, cantidad: requestedQty }];
      }
    });

    setSelectedProductId('');
    setProductQtyToAdd(1);
  };

  const handleRemoveProduct = (pId: number) => {
    setSelectedProductos(prev => prev.filter(item => item.id_producto !== pId));
  };

  const handleProductQtyChange = (pId: number, qty: number) => {
    if (qty < 1) return;
    const prod = productos.find(p => p.id_producto === pId);
    if (!prod) return;

    if (qty > (prod.stock || 0)) {
      toast.error(`Stock insuficiente. Stock disponible: ${prod.stock || 0}`);
      return;
    }

    setSelectedProductos(prev => prev.map(item => item.id_producto === pId ? { ...item, cantidad: qty } : item));
  };

  const getCitaServiciosLabel = (cita: any) => {
    try {
      if (cita.detalles_json) {
        const details = typeof cita.detalles_json === 'string' ? JSON.parse(cita.detalles_json) : cita.detalles_json;
        if (details.servicios && details.servicios.length > 0) {
          const names = details.servicios.map((item: any) => {
            const s = servicios.find(srv => srv.id_servicio === item.id_servicio);
            return s ? `${s.nombre} (x${item.cantidad})` : `Servicio #${item.id_servicio}`;
          });
          return names.join(', ');
        }
      }
    } catch (e) {}
    return cita.servicio_nombre || getServicioName(cita.id_servicio);
  };

  const getOccupiedTimes = (fecha?: string, empId?: number, excludingId?: number) => {
    if (!fecha || !empId) return [];
    return timeSlots.filter(slot => {
      const start = parseTimeToMinutes(slot);
      const end = start + (duracionTotal || 30);
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
    setSelectedServicios([]);
    setSelectedProductos([]);
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

    let parsedServicios: { id_servicio: number; cantidad: number }[] = [];
    let parsedProductos: { id_producto: number; cantidad: number }[] = [];
    try {
      if (cita.detalles_json) {
        const details = typeof cita.detalles_json === 'string' ? JSON.parse(cita.detalles_json) : cita.detalles_json;
        if (details.servicios) parsedServicios = details.servicios;
        if (details.productos) parsedProductos = details.productos;
      } else if (cita.id_servicio) {
        parsedServicios = [{ id_servicio: parseInt(cita.id_servicio), cantidad: 1 }];
      }
    } catch (e) {
      if (cita.id_servicio) {
        parsedServicios = [{ id_servicio: parseInt(cita.id_servicio), cantidad: 1 }];
      }
    }

    setSelectedServicios(parsedServicios);
    setSelectedProductos(parsedProductos);
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
    if (!formData.fecha) errors.fecha = 'Requerido';
    if (!formData.hora_inicio) errors.hora_inicio = 'Requerido';
    if (selectedServicios.length === 0) {
      errors.servicios = 'Debes seleccionar al menos un servicio';
    }

    if (formData.fecha && formData.fecha < todayStr) {
      errors.fecha = 'La fecha de la cita no puede ser anterior a la fecha actual';
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      toast.error(errors.fecha || errors.servicios || 'Completa los campos obligatorios');
      return;
    }

    const startMins = parseTimeToMinutes(formData.hora_inicio);
    const endMins = startMins + (duracionTotal || 30);
    const endHH = Math.floor(endMins / 60).toString().padStart(2, '0');
    const endMM = (endMins % 60).toString().padStart(2, '0');

    const payload = {
      id_cliente: parseInt(formData.id_cliente),
      id_barbero: parseInt(formData.id_barbero),
      id_servicio: selectedServicios[0]?.id_servicio || null, // Guardar el primero como primario
      fecha: formData.fecha,
      hora_inicio: formData.hora_inicio,
      hora_fin: `${endHH}:${endMM}`,
      detalles_json: {
        servicios: selectedServicios,
        productos: selectedProductos
      }
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

  const viewingClienteObj = viewingCita 
    ? clientes.find(cl => cl.id_cliente === parseInt(viewingCita.id_cliente)) 
    : null;
  const viewingClienteDoc = viewingClienteObj?.documento 
    ? `${viewingClienteObj.tipo_documento || 'CC'} - ${viewingClienteObj.documento}` 
    : 'No registrado';

  const viewingBarberId = viewingCita 
    ? parseInt(viewingCita.id_barbero || viewingCita.id_usuario || viewingCita.id_empleado) 
    : null;
  const viewingBarberoObj = viewingBarberId 
    ? barberos.find(b => b.id_empleado === viewingBarberId || b.id_barbero === viewingBarberId || b.id_usuario === viewingBarberId) 
    : null;
  const viewingBarberoDoc = viewingBarberoObj?.documento 
    ? `${viewingBarberoObj.tipo_documento || 'CC'} - ${viewingBarberoObj.documento}` 
    : 'No registrado';

  const viewingDetalles = useMemo(() => {
    if (!viewingCita) return null;
    try {
      if (viewingCita.detalles_json) {
        return typeof viewingCita.detalles_json === 'string' 
          ? JSON.parse(viewingCita.detalles_json) 
          : viewingCita.detalles_json;
      }
    } catch (e) {
      console.error(e);
    }
    return null;
  }, [viewingCita]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[450px] w-full bg-background">
        <div className="flex flex-col items-center gap-4 animate-pulse">
          <Clock className="w-10 h-10 text-blue-600 animate-spin" />
          <p className="text-sm font-bold text-muted-foreground">Cargando agendamiento de citas...</p>
        </div>
      </div>
    );
  }

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
                                  <p className="text-lg font-black leading-none">{v as React.ReactNode}</p>
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
                              <p className="text-sm font-bold text-foreground truncate">{getCitaServiciosLabel(c)}</p>
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
              <Card className="border border-blue-200 shadow-2xl animate-in slide-in-from-bottom-2 fade-in duration-300">
                <CardHeader className="bg-muted/20 border-b pb-6">
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle className="text-2xl font-black text-blue-800">{editingCita ? 'Actualizar Cita' : 'Programar Nueva Cita'}</CardTitle>
                      <CardDescription>Completa los detalles para agendar el espacio</CardDescription>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => setShowForm(false)}><X /></Button>
                  </div>
                </CardHeader>
                <form onSubmit={handleSubmit}>
                  <CardContent className="p-8">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                      {/* LADO IZQUIERDO: DATOS PRINCIPALES */}
                      <div className="space-y-6">
                        <h3 className="text-xs font-bold uppercase tracking-widest text-blue-800 border-b pb-2">Datos Principales</h3>
                        <div className="space-y-6">
                          
                          {/* CLIENTE */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label className="text-sm font-semibold">Cliente Responsable *</Label>
                              <Select disabled={isCliente} value={formData.id_cliente} onValueChange={v => setFormData({ ...formData, id_cliente: v })}>
                                <SelectTrigger className={cn("h-11 border-muted-foreground/25 focus:ring-2 focus:ring-blue-500/20", formErrors.id_cliente && "border-destructive")}>
                                  <SelectValue placeholder="Seleccionar cliente..." />
                                </SelectTrigger>
                                <SelectContent>{clientes.map(c => <SelectItem key={c.id_cliente} value={c.id_cliente.toString()}>{c.nombre_final || c.nombre}</SelectItem>)}</SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-2">
                              <Label className="text-sm font-semibold text-muted-foreground">Documento Identidad (Cliente)</Label>
                              <Input value={clienteDocumento || 'No seleccionado'} readOnly className="h-11 bg-muted/40 border-muted/50 text-muted-foreground font-medium select-none" />
                            </div>
                          </div>

                          {/* PROFESIONAL */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label className="text-sm font-semibold">Profesional asignado *</Label>
                              <Select disabled={isBarbero} value={formData.id_barbero} onValueChange={v => setFormData({ ...formData, id_barbero: v })}>
                                <SelectTrigger className={cn("h-11 border-muted-foreground/25 focus:ring-2 focus:ring-blue-500/20", formErrors.id_barbero && "border-destructive")}><SelectValue placeholder="Seleccionar barbero" /></SelectTrigger>
                                <SelectContent>
                                  {barberos.map(b => {
                                    const bId = (b.id_empleado || b.id_barbero || b.id_usuario).toString();
                                    return <SelectItem key={bId} value={bId}>{b.nombre}</SelectItem>
                                  })}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-2">
                              <Label className="text-sm font-semibold text-muted-foreground">Documento Identidad (Profesional)</Label>
                              <Input value={barberoDocumento || 'No seleccionado'} readOnly className="h-11 bg-muted/40 border-muted/50 text-muted-foreground font-medium select-none" />
                            </div>
                          </div>

                          {/* FECHA Y HORA */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label className="text-sm font-semibold">Fecha *</Label>
                              <Input type="date" value={formData.fecha} onChange={e => setFormData({ ...formData, fecha: e.target.value })} className={cn("h-11 border-muted-foreground/25 focus:ring-2 focus:ring-blue-500/20", formErrors.fecha && "border-destructive")} />
                              {formErrors.fecha && <p className="text-[11px] text-red-500 font-medium mt-0.5">{formErrors.fecha}</p>}
                            </div>
                            <div className="space-y-2">
                              <Label className="text-sm font-semibold">Hora *</Label>
                              <Select value={formData.hora_inicio} onValueChange={v => setFormData({ ...formData, hora_inicio: v })}>
                                <SelectTrigger className={cn("h-11 border-muted-foreground/25 focus:ring-2 focus:ring-blue-500/20", formErrors.hora_inicio && "border-destructive")}><SelectValue placeholder="Bloque" /></SelectTrigger>
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

                      {/* LADO DERECHO: SERVICIOS Y PRODUCTOS */}
                      <div className="space-y-6">
                        <h3 className="text-xs font-bold uppercase tracking-widest text-blue-800 border-b pb-2">Servicios y Productos</h3>
                        
                        {/* SERVICIOS MULTI-SELECT */}
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label className="text-sm font-semibold">Agregar Servicio *</Label>
                            <div className="flex gap-2">
                              <div className="flex-1">
                                <Select value={selectedServiceId} onValueChange={setSelectedServiceId}>
                                  <SelectTrigger className="h-11 border-muted-foreground/25 focus:ring-2 focus:ring-blue-500/20">
                                    <SelectValue placeholder="Seleccionar servicio para agregar..." />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {servicios.map(s => (
                                      <SelectItem key={s.id_servicio} value={s.id_servicio.toString()}>
                                        {s.nombre} — {formatCOP(s.precio_neto)} ({s.duracion_minutos || 30} min)
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              <Button type="button" onClick={handleAddService} className="bg-blue-600 hover:bg-blue-700 text-white h-11 w-11 shrink-0 p-0 flex items-center justify-center">
                                <Plus className="h-4 w-4" />
                              </Button>
                            </div>
                            {formErrors.servicios && <p className="text-[11px] text-red-500 font-medium mt-0.5">{formErrors.servicios}</p>}
                          </div>

                          {/* LISTA DE SERVICIOS */}
                          <div className="space-y-2">
                            <Label className="text-xs font-bold text-muted-foreground">Servicios Seleccionados</Label>
                            {selectedServicios.length === 0 ? (
                              <p className="text-xs text-muted-foreground italic text-center py-4 border border-dashed rounded-lg">No se han seleccionado servicios.</p>
                            ) : (
                              <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                                {selectedServicios.map(item => {
                                  const sObj = servicios.find(s => s.id_servicio === item.id_servicio);
                                  if (!sObj) return null;
                                  return (
                                    <div key={item.id_servicio} className="flex items-center justify-between p-2 border rounded-lg bg-background hover:bg-muted/10 transition-colors">
                                      <div className="min-w-0 flex-1">
                                        <p className="text-xs font-bold truncate">{sObj.nombre}</p>
                                        <p className="text-[10px] text-muted-foreground">{formatCOP(sObj.precio_neto || 0)} c/u</p>
                                      </div>
                                      <div className="flex items-center gap-3 shrink-0 ml-2">
                                        <div className="flex items-center border rounded-md h-8 bg-background">
                                          <Button type="button" variant="ghost" size="icon" className="h-7 w-7 rounded-none" onClick={() => handleServiceQtyChange(item.id_servicio, item.cantidad - 1)}>
                                            <Minus className="h-3 w-3" />
                                          </Button>
                                          <span className="w-8 text-center text-xs font-bold">{item.cantidad}</span>
                                          <Button type="button" variant="ghost" size="icon" className="h-7 w-7 rounded-none" onClick={() => handleServiceQtyChange(item.id_servicio, item.cantidad + 1)}>
                                            <Plus className="h-3 w-3" />
                                          </Button>
                                        </div>
                                        <span className="text-xs font-bold w-16 text-right">{formatCOP((sObj.precio_neto || 0) * item.cantidad)}</span>
                                        <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={() => handleRemoveService(item.id_servicio)}>
                                          <Trash2 className="h-3.5 w-3.5" />
                                        </Button>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* PRODUCTOS SECTOR */}
                        <div className="space-y-4 border-t pt-4">
                          <div className="space-y-2">
                            <Label className="text-sm font-semibold text-muted-foreground flex items-center gap-2"><Package className="w-4 h-4" /> Agregar Producto</Label>
                            <div className="flex gap-2">
                              <div className="flex-1">
                                <Select value={selectedProductId} onValueChange={setSelectedProductId}>
                                  <SelectTrigger className="h-11 border-muted-foreground/25 focus:ring-2 focus:ring-blue-500/20">
                                    <SelectValue placeholder="Seleccionar producto para agregar..." />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {productos.map(p => (
                                      <SelectItem key={p.id_producto} value={p.id_producto.toString()} disabled={(p.stock || 0) < 1}>
                                        {p.nombre} — {formatCOP(p.precio_neto)} (Stock: {p.stock || 0})
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="w-20 shrink-0">
                                <Input type="number" min="1" placeholder="Cant" value={productQtyToAdd} onChange={e => setProductQtyToAdd(parseInt(e.target.value) || 1)} className="h-11 text-center" />
                              </div>
                              <Button type="button" onClick={handleAddProduct} className="bg-blue-600 hover:bg-blue-700 text-white h-11 w-11 shrink-0 p-0 flex items-center justify-center">
                                <Plus className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>

                          {/* LISTA DE PRODUCTOS */}
                          <div className="space-y-2">
                            <Label className="text-xs font-bold text-muted-foreground">Productos Seleccionados</Label>
                            {selectedProductos.length === 0 ? (
                              <p className="text-xs text-muted-foreground italic text-center py-4 border border-dashed rounded-lg">No se han seleccionado productos.</p>
                            ) : (
                              <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                                {selectedProductos.map(item => {
                                  const pObj = productos.find(p => p.id_producto === item.id_producto);
                                  if (!pObj) return null;
                                  return (
                                    <div key={item.id_producto} className="flex items-center justify-between p-2 border rounded-lg bg-background hover:bg-muted/10 transition-colors">
                                      <div className="min-w-0 flex-1">
                                        <p className="text-xs font-bold truncate">{pObj.nombre}</p>
                                        <p className="text-[10px] text-muted-foreground">{formatCOP(pObj.precio_neto || 0)} c/u | Stock: {pObj.stock || 0}</p>
                                      </div>
                                      <div className="flex items-center gap-3 shrink-0 ml-2">
                                        <div className="flex items-center border rounded-md h-8 bg-background">
                                          <Button type="button" variant="ghost" size="icon" className="h-7 w-7 rounded-none" onClick={() => handleProductQtyChange(item.id_producto, item.cantidad - 1)}>
                                            <Minus className="h-3 w-3" />
                                          </Button>
                                          <span className="w-8 text-center text-xs font-bold">{item.cantidad}</span>
                                          <Button type="button" variant="ghost" size="icon" className="h-7 w-7 rounded-none" onClick={() => handleProductQtyChange(item.id_producto, item.cantidad + 1)}>
                                            <Plus className="h-3 w-3" />
                                          </Button>
                                        </div>
                                        <span className="text-xs font-bold w-16 text-right">{formatCOP((pObj.precio_neto || 0) * item.cantidad)}</span>
                                        <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={() => handleRemoveProduct(item.id_producto)}>
                                          <Trash2 className="h-3.5 w-3.5" />
                                        </Button>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* SUMMARY BOX */}
                        <div className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50/50 rounded-xl border border-blue-200 space-y-3 shadow-inner mt-8">
                          <div className="flex justify-between items-center text-xs font-semibold text-muted-foreground border-b pb-2">
                            <span>Subtotal Servicios:</span>
                            <span className="font-bold text-foreground">{formatCOP(subtotalServicios)}</span>
                          </div>
                          <div className="flex justify-between items-center text-xs font-semibold text-muted-foreground border-b pb-2">
                            <span>Subtotal Productos:</span>
                            <span className="font-bold text-foreground">{formatCOP(subtotalProductos)}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <div className="flex flex-col">
                              <span className="text-[10px] font-black text-blue-800 uppercase tracking-widest">Total Estimado Cita</span>
                              <span className="text-4xl font-black text-blue-700 mt-1">{formatCOP(totalGeneral)}</span>
                            </div>
                            <div className="text-right text-xs font-extrabold text-muted-foreground flex items-center gap-1.5 bg-white py-2 px-3.5 rounded-lg border shadow-sm">
                              <Clock className="w-4 h-4 text-blue-600" />
                              <span>{formatDuration(duracionTotal)}</span>
                            </div>
                          </div>
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
                      {/* CLIENTE */}
                      <div className="space-y-2">
                        <Label>Cliente Solicitante</Label>
                        <Input value={viewingCita.cliente_nombre || getClienteName(viewingCita.id_cliente)} readOnly className="bg-muted" />
                      </div>
                      <div className="space-y-2">
                        <Label>Documento Cliente</Label>
                        <Input value={viewingClienteDoc} readOnly className="bg-muted" />
                      </div>

                      <div className="space-y-2">
                        <Label>Teléfono Cliente</Label>
                        <Input value={getClienteInfo(viewingCita.id_cliente).telefono || 'Sin teléfono'} readOnly className="bg-muted" />
                      </div>
                      <div className="space-y-2">
                        {/* Spacing alignment */}
                      </div>

                      {/* PROFESIONAL */}
                      <div className="space-y-2">
                        <Label>Profesional Asignado</Label>
                        <Input value={viewingCita.barbero_nombre || getBarberoName(viewingCita.id_barbero || viewingCita.id_usuario || viewingCita.id_empleado)} readOnly className="bg-muted" />
                      </div>
                      <div className="space-y-2">
                        <Label>Documento Profesional</Label>
                        <Input value={viewingBarberoDoc} readOnly className="bg-muted" />
                      </div>

                      {/* FECHA Y HORARIO */}
                      <div className="space-y-2">
                        <Label>Fecha Agendada</Label>
                        <Input value={viewingCita.fecha?.split('T')[0]} readOnly className="bg-muted" />
                      </div>
                      <div className="space-y-2">
                        <Label>Horario</Label>
                        <Input value={`${viewingCita.hora_inicio_corta} a ${viewingCita.hora_fin_corta}`} readOnly className="bg-muted" />
                      </div>

                      {/* DETALLE DE SERVICIOS Y PRODUCTOS */}
                      <div className="space-y-4 md:col-span-2 border-t pt-4">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-blue-800">Servicios Contratados</h4>
                        <div className="space-y-2">
                          {viewingDetalles?.servicios && viewingDetalles.servicios.length > 0 ? (
                            viewingDetalles.servicios.map((item: any, idx: number) => {
                              const sObj = servicios.find(s => s.id_servicio === item.id_servicio);
                              const name = sObj?.nombre || `Servicio #${item.id_servicio}`;
                              const price = sObj?.precio_neto || 0;
                              return (
                                <div key={idx} className="flex justify-between items-center text-xs p-2 bg-muted/40 rounded-lg">
                                  <span>{name} <span className="text-muted-foreground font-bold font-mono">x{item.cantidad}</span></span>
                                  <span className="font-bold">{formatCOP(price * item.cantidad)}</span>
                                </div>
                              );
                            })
                          ) : (
                            <div className="flex justify-between items-center text-xs p-2 bg-muted/40 rounded-lg">
                              <span>{viewingCita.servicio_nombre || getServicioName(viewingCita.id_servicio)} <span className="text-muted-foreground font-bold font-mono">x1</span></span>
                              <span className="font-bold">{formatCOP(viewingCita.precio_neto || 0)}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {viewingDetalles?.productos && viewingDetalles.productos.length > 0 && (
                        <div className="space-y-4 md:col-span-2 border-t pt-4">
                          <h4 className="text-xs font-bold uppercase tracking-wider text-blue-800">Productos Adquiridos</h4>
                          <div className="space-y-2">
                            {viewingDetalles.productos.map((item: any, idx: number) => {
                              const pObj = productos.find(p => p.id_producto === item.id_producto);
                              const name = pObj?.nombre || `Producto #${item.id_producto}`;
                              const price = pObj?.precio_neto || 0;
                              return (
                                <div key={idx} className="flex justify-between items-center text-xs p-2 bg-muted/40 rounded-lg">
                                  <span>{name} <span className="text-muted-foreground font-bold font-mono">x{item.cantidad}</span></span>
                                  <span className="font-bold">{formatCOP(price * item.cantidad)}</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {(() => {
                      let totalVal = viewingCita.precio_neto || 0;
                      let durVal = 0;
                      if (viewingDetalles) {
                        const servSum = (viewingDetalles.servicios || []).reduce((sum: number, item: any) => {
                          const s = servicios.find(srv => srv.id_servicio === item.id_servicio);
                          return sum + (s?.precio_neto || 0) * item.cantidad;
                        }, 0);
                        const prodSum = (viewingDetalles.productos || []).reduce((sum: number, item: any) => {
                          const p = productos.find(prd => prd.id_producto === item.id_producto);
                          return sum + (p?.precio_neto || 0) * item.cantidad;
                        }, 0);
                        totalVal = servSum + prodSum;
                        
                        durVal = (viewingDetalles.servicios || []).reduce((sum: number, item: any) => {
                          const s = servicios.find(srv => srv.id_servicio === item.id_servicio);
                          return sum + (s?.duracion_minutos || 30) * item.cantidad;
                        }, 0);
                      }
                      
                      return (
                        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg flex justify-between items-center mt-4">
                          <div className="flex flex-col">
                            <span className="text-xs font-bold text-blue-800">Valor Total Estimado</span>
                            <span className="text-xl font-bold text-blue-700 mt-1">{formatCOP(totalVal)}</span>
                          </div>
                          {durVal > 0 && (
                            <div className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5 bg-white py-1.5 px-3 rounded-lg border shadow-sm">
                              <Clock className="w-3.5 h-3.5 text-blue-600" />
                              <span>{formatDuration(durVal)}</span>
                            </div>
                          )}
                        </div>
                      );
                    })()}
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