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
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '../ui/tabs';
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
  X,
  Users,
  UserPlus,
  UserCheck,
  UserX,
  DollarSign,
  Settings,
  Briefcase
} from 'lucide-react';
import { cn } from '../ui/utils';
import { mockServicios, mockEmpleados, mockClientes, mockProductos, Cita, Venta, VentaProductoDetalle, Empleado } from '../../shared/lib/mockData';
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

  // --- Helper to generate sale from appointment ---
  const generateSaleFromCita = (cita: Cita) => {
    if (cita.id_venta) return; // Ya facturada previamente

    const newVentaId = Math.max(...dataStore.ventas.map(v => v.id_venta), 100) + 1;
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
    const productIds = cita.id_productos || [];
    const productCounts = productIds.reduce((acc, pid) => {
      acc[pid] = (acc[pid] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);

    const productDetails: VentaProductoDetalle[] = Object.entries(productCounts).map(([pidStr, qty]) => {
      const pid = parseInt(pidStr);
      const product = mockProductos.find(p => p.id_producto === pid);
      return {
        id_venta_prod_detalle: currentDetalleId + detailCounter++,
        id_venta: newVentaId,
        tipo: 'producto',
        id_producto: pid,
        cantidad: qty,
        precio_unitario: product?.precio || 0,
        subtotal: (product?.precio || 0) * qty,
      };
    });

    const allDetails = [...serviceDetails, ...productDetails];
    const total = allDetails.reduce((sum, d) => sum + d.subtotal, 0);

    const newVenta: Venta = {
      id_venta: newVentaId,
      id_cliente: cita.id_cliente,
      id_cliente_temporal: cita.id_cliente_temporal, // Soportar clientes temporales
      id_usuario: user?.id_usuario || 1,
      fecha: cita.fecha,
      total: total,
      estado: 'pagada',
    };

    dataStore.ventas.push(newVenta);
    dataStore.ventasDetalle.push(...allDetails);
    cita.id_venta = newVentaId; // Vincular la cita con la venta generada

    toast.success(`Venta #${newVentaId} generada automáticamente por $${total.toFixed(2)}`, {
      icon: '💰',
      duration: 5000
    });
  };

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

  // --- Employee Management State ---
  const [employeeFormData, setEmployeeFormData] = useState<Partial<Empleado>>({
    nombre: '',
    apellido: '',
    cargo: 'Barbero',
    telefono: '',
    email: '',
    estado: 'activo',
    tipo_esquema: 'comision',
    porcentaje_comision: 60,
    porcentaje_dueno: 40,
    pago_silla_semanal: 0,
    fecha_contratacion: new Date().toISOString().slice(0, 10),
  });
  const [editingEmployee, setEditingEmployee] = useState<Empleado | null>(null);
  const [showEmployeeForm, setShowEmployeeForm] = useState(false);
  const [employeeSearch, setEmployeeSearch] = useState('');
  const [activeTab, setActiveTab] = useState('agenda');

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
      if (idx !== -1) {
        dataStore.citas[idx] = { ...dataStore.citas[idx], ...common };
        // Generar venta al registrar/actualizar la cita (si no tiene una vinculada)
        generateSaleFromCita(dataStore.citas[idx]);
      }
    } else {
      const newCita = { id_cita: getNextCitaId(), ...common };
      dataStore.citas.push(newCita);
      // Generar venta al registrar la nueva cita
      generateSaleFromCita(newCita);
    }
    refreshData();
    setShowForm(false);
    toast.success('¡Cita registrada exitosamente!');
  };

  const handleStatusChange = (id: number, status: Cita['estado']) => {
    const idx = dataStore.citas.findIndex(c => c.id_cita === id);
    if (idx !== -1) {
      dataStore.citas[idx].estado = status;

      // Generar venta si cambia a un estado activo (y no tiene una vinculada)
      if (status !== 'cancelada') {
        generateSaleFromCita(dataStore.citas[idx]);
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

  // --- Employee Management Logic ---
  const handleEmployeeCreate = () => {
    setEditingEmployee(null);
    setEmployeeFormData({
      nombre: '',
      apellido: '',
      cargo: 'Barbero',
      telefono: '',
      email: '',
      estado: 'activo',
      tipo_esquema: 'comision',
      porcentaje_comision: 60,
      porcentaje_dueno: 40,
      pago_silla_semanal: 0,
      fecha_contratacion: new Date().toISOString().slice(0, 10),
    });
    setShowEmployeeForm(true);
    window.scrollTo(0, 0);
  };

  const handleEmployeeEdit = (emp: Empleado) => {
    setEditingEmployee(emp);
    setEmployeeFormData({ ...emp });
    setShowEmployeeForm(true);
    window.scrollTo(0, 0);
  };

  const handleEmployeeSave = (e: React.FormEvent) => {
    e.preventDefault();

    // Validaciones
    if (employeeFormData.tipo_esquema === 'comision') {
      const com = employeeFormData.porcentaje_comision || 0;
      const due = employeeFormData.porcentaje_dueno || 0;
      if (com + due !== 100) {
        toast.error('La suma de porcentajes debe ser 100%');
        return;
      }
    } else if (employeeFormData.tipo_esquema === 'silla') {
      if (!employeeFormData.pago_silla_semanal || employeeFormData.pago_silla_semanal <= 0) {
        toast.error('Indica un valor de alquiler válido');
        return;
      }
    }

    if (editingEmployee) {
      const idx = dataStore.empleados.findIndex(e => e.id_empleado === editingEmployee.id_empleado);
      if (idx !== -1) {
        dataStore.empleados[idx] = { ...editingEmployee, ...employeeFormData } as Empleado;
        toast.success('Perfil de barbero actualizado');
      }
    } else {
      const newEmp: Empleado = {
        id_empleado: Math.max(...dataStore.empleados.map(e => e.id_empleado), 0) + 1,
        ...employeeFormData
      } as Empleado;
      dataStore.empleados.push(newEmp);
      toast.success('Nuevo barbero registrado');
    }

    setShowEmployeeForm(false);
    refreshData();
  };

  const toggleEmployeeStatus = (emp: Empleado) => {
    const newStatus = emp.estado === 'activo' ? 'inactivo' : 'activo';
    const idx = dataStore.empleados.findIndex(e => e.id_empleado === emp.id_empleado);
    if (idx !== -1) {
      dataStore.empleados[idx].estado = newStatus;
      toast.info(`Barbero marcado como ${newStatus}`);
      refreshData();
    }
  };

  const handleMarkChairPayment = (idControl: number) => {
    const idx = dataStore.controlesPagoSilla.findIndex(c => c.id_control_pago === idControl);
    if (idx !== -1) {
      dataStore.controlesPagoSilla[idx].estado = 'pagado';
      dataStore.controlesPagoSilla[idx].fecha_pago = new Date().toISOString().slice(0, 10);
      toast.success('Pago de silla registrado');
      refreshData();
    }
  };

  return (
    <div className="flex flex-col gap-12 p-4 md:p-8 max-w-[1600px] mx-auto w-full">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="flex items-center justify-between pb-6 border-b mb-8">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-bold">
              <Calendar className="w-6 h-6 text-[#D4AF37]" />
              Agendamiento
            </h1>
            <p className="text-muted-foreground">
              Gestiona citas y el equipo de barberos
            </p>
          </div>

          <TabsList className="bg-muted/40 p-1">
            <TabsTrigger value="agenda" className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Agenda
            </TabsTrigger>
            <TabsTrigger value="barberos" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Barberos
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="agenda">
          <div className="space-y-12">
            {!showForm && (
              <div className="flex justify-end mb-4">
                <Button onClick={() => handleCreate()} className="bg-[#D4AF37] hover:bg-[#B8941F] text-black shadow-md hover:shadow-[#D4AF37]/20 transition-all">
                  <Plus className="w-4 h-4 mr-2" />
                  Nueva Cita
                </Button>
              </div>
            )}

            {!showForm ? (
              <>
                {(isAdmin || isBarbero) && (
                  <section className="animate-in fade-in duration-500">
                    <div className="flex flex-row gap-2 w-full">
                      {Object.entries(stats).map(([k, v]) => (
                        <Card key={k} className="flex-1 hover:shadow-md transition-shadow border-muted/60 min-w-0">
                          <CardContent className="p-2">
                            <div className="flex items-center gap-2">
                              <div className={cn(
                                "p-1.5 rounded-lg shrink-0",
                                k === 'pendiente' && 'bg-yellow-50 text-yellow-600',
                                k === 'confirmada' && 'bg-blue-50 text-blue-600',
                                k === 'en-ejecucion' && 'bg-orange-50 text-orange-600',
                                k === 'completada' && 'bg-green-50 text-green-600',
                                k === 'cancelada' && 'bg-red-50 text-red-600'
                              )}>
                                {k === 'completada' ? <CheckCircle className="w-4 h-4" /> :
                                  k === 'cancelada' ? <XCircle className="w-4 h-4" /> :
                                    <Clock className="w-4 h-4" />}
                              </div>
                              <div className="min-w-0">
                                <p className="text-[9px] uppercase font-bold text-muted-foreground/70 truncate">
                                  {k.replace('-', ' ')}
                                </p>
                                <p className="text-lg font-black leading-none">{v}</p>
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
                              {dataStore.empleados.map(e => <SelectItem key={e.id_empleado} value={e.id_empleado.toString()}>{e.nombre}</SelectItem>)}
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
                                {dataStore.empleados.filter(e => e.estado === 'activo').map(e => <SelectItem key={e.id_empleado} value={e.id_empleado.toString()}>{e.nombre}</SelectItem>)}
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
        </TabsContent>

        <TabsContent value="barberos">
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
                          <div className="space-y-2"><Label>Apellido *</Label><Input required value={employeeFormData.apellido} onChange={e => setEmployeeFormData({ ...employeeFormData, apellido: e.target.value })} /></div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-2"><Label>Email</Label><Input type="email" value={employeeFormData.email} onChange={e => setEmployeeFormData({ ...employeeFormData, email: e.target.value })} /></div>
                          <div className="space-y-2"><Label>Teléfono</Label><Input value={employeeFormData.telefono} onChange={e => setEmployeeFormData({ ...employeeFormData, telefono: e.target.value })} /></div>
                        </div>

                        <div className="space-y-2"><Label>Cargo</Label><Input value={employeeFormData.cargo} onChange={e => setEmployeeFormData({ ...employeeFormData, cargo: e.target.value })} /></div>
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
                              <Label>Valor Alquiler Semanal</Label>
                              <div className="relative">
                                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input type="number" className="pl-10" value={employeeFormData.pago_silla_semanal} onChange={e => setEmployeeFormData({ ...employeeFormData, pago_silla_semanal: parseInt(e.target.value) })} />
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
                  <Button onClick={handleEmployeeCreate} className="bg-[#D4AF37] hover:bg-[#B8941F] text-black">
                    <UserPlus className="w-4 h-4 mr-2" /> Nuevo barbero
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {dataStore.empleados.filter(e =>
                    e.nombre.toLowerCase().includes(employeeSearch.toLowerCase()) ||
                    e.apellido.toLowerCase().includes(employeeSearch.toLowerCase())
                  ).map(emp => (
                    <Card key={emp.id_empleado} className={cn("hover:shadow-lg transition-all border-l-4", emp.estado === 'activo' ? "border-l-green-500" : "border-l-gray-300")}>
                      <CardHeader className="pb-2">
                        <div className="flex justify-between items-start">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center font-bold text-lg">
                              {emp.nombre[0]}{emp.apellido[0]}
                            </div>
                            <div>
                              <CardTitle className="text-lg">{emp.nombre} {emp.apellido}</CardTitle>
                              <CardDescription>{emp.cargo}</CardDescription>
                            </div>
                          </div>
                          <Badge variant={emp.estado === 'activo' ? 'default' : 'secondary'} className={cn(emp.estado === 'activo' ? "bg-green-100 text-green-700" : "")}>
                            {emp.estado}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4 pt-4">
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="flex flex-col gap-1">
                            <span className="text-muted-foreground uppercase font-bold text-[9px]">Esquema</span>
                            <span className="font-bold flex items-center gap-1">
                              {emp.tipo_esquema === 'comision' ? <DollarSign className="w-3 h-3" /> : <Briefcase className="w-3 h-3" />}
                              {emp.tipo_esquema.toUpperCase()}
                            </span>
                          </div>
                          <div className="flex flex-col gap-1">
                            <span className="text-muted-foreground uppercase font-bold text-[9px]">Detalle</span>
                            <span className="font-bold">
                              {emp.tipo_esquema === 'comision' ? `${emp.porcentaje_comision}%` : `$${emp.pago_silla_semanal?.toLocaleString()}`}
                            </span>
                          </div>
                        </div>

                        {emp.tipo_esquema === 'silla' && (
                          <div className="bg-muted/30 p-3 rounded-lg space-y-2">
                            <div className="flex justify-between items-center text-[10px] font-bold">
                              <span>CONTROL DE SILLA (SEMANAL)</span>
                              <Button variant="link" size="sm" className="h-auto p-0 text-[10px]">Ver historial</Button>
                            </div>
                            {dataStore.controlesPagoSilla.filter(c => c.id_empleado === emp.id_empleado).slice(0, 1).map(ctrl => (
                              <div key={ctrl.id_control_pago} className="flex justify-between items-center">
                                <span className="text-xs text-muted-foreground">{ctrl.fecha_inicio_semana} al {ctrl.fecha_fin_semana}</span>
                                {ctrl.estado === 'pendiente' ? (
                                  <Button size="sm" variant="outline" className="h-7 text-[10px] border-orange-500 text-orange-600 hover:bg-orange-50" onClick={() => handleMarkChairPayment(ctrl.id_control_pago)}>Marcar Pagado</Button>
                                ) : (
                                  <Badge className="bg-green-100 text-green-700 text-[10px]">PAGADO</Badge>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </CardContent>
                      <CardFooter className="border-t bg-muted/10 p-4 flex justify-between">
                        <Button variant="ghost" size="sm" onClick={() => handleEmployeeEdit(emp)}><Settings className="w-4 h-4 mr-2" /> Configurar</Button>
                        <Button variant="ghost" size="sm" className={cn(emp.estado === 'activo' ? "text-red-500" : "text-green-600")} onClick={() => toggleEmployeeStatus(emp)}>
                          {emp.estado === 'activo' ? <UserX className="w-4 h-4 mr-2" /> : <UserCheck className="w-4 h-4 mr-2" />}
                          {emp.estado === 'activo' ? 'Inactivar' : 'Activar'}
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              </>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
