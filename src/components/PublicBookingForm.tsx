import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { Calendar, Clock, Scissors, CheckCircle2, MessageCircle } from 'lucide-react';
import { fetchApi } from '../lib/api';
import { toast } from 'sonner';
import { formatCOP } from '../lib/format';

interface PublicBookingFormProps {
  open: boolean;
  onClose: () => void;
}

export function PublicBookingForm({ open, onClose }: PublicBookingFormProps) {
  const [step, setStep] = useState<'info' | 'booking' | 'success'>('info');
  const [clienteData, setClienteData] = useState({
    nombre: '',
    email: '',
    tipo_documento: 'CC',
    documento: '',
    telefono: '',
  });
  const [bookingData, setBookingData] = useState({
    id_servicio: '',
    id_servicios: [] as string[],
    id_empleado: '',
    fecha: '',
    hora: '',
    observaciones: '',
  });

  const [servicios, setServicios] = useState<any[]>([]);
  const [barberos, setBarberos] = useState<any[]>([]);
  const [busySlots, setBusySlots] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const [calendarMonth, setCalendarMonth] = useState(() => {
    const d = new Date();
    d.setDate(1);
    return d;
  });

  // Cargar datos reales desde el backend cuando se abre el modal
  useEffect(() => {
    if (open) {
      const loadPublicData = async () => {
        setLoading(true);
        try {
          const [resServ, resBarb, resEmployees, resUsers, resBusy] = await Promise.all([
            fetchApi('/services/public').catch(() => ({ success: false, data: [] })),
            fetchApi('/employees/public').catch(() => ({ success: false, data: [] })),
            fetchApi('/employees').catch(() => ({ success: false, data: [] })),
            fetchApi('/users').catch(() => ({ success: false, data: [] })),
            fetchApi('/appointments/public-busy-slots').catch(() => ({ success: false, data: [] }))
          ]);

          if (resServ.success && Array.isArray(resServ.data)) {
            const normalized = resServ.data.map((s: any) => ({
              id_servicio: s.id_servicio,
              nombre: s.nombre,
              precio: parseFloat(s.precio_neto || s.precio || 0),
              duracion: parseInt(s.duracion_minutos || s.duracion || 30),
              estado: s.estado
            }));
            setServicios(normalized.filter((s: any) => (s.estado || 'Activo').toLowerCase() === 'activo'));
          }

          // Combinar barberos desde /employees/public, /employees y /users (con rol Barbero)
          const rawBarbers = [
            ...(resBarb.success && Array.isArray(resBarb.data) ? resBarb.data : []),
            ...(resEmployees.success && Array.isArray(resEmployees.data) ? resEmployees.data : []),
            ...(resUsers.success && Array.isArray(resUsers.data) ? resUsers.data.filter((u: any) => (u.rol_nombre || u.rol || '').toLowerCase().includes('barbero') || u.id_rol === 3) : [])
          ];

          const barberMap = new Map();
          rawBarbers.forEach((b: any) => {
            const bId = b.id_empleado || b.id_barbero || b.id_usuario;
            if (bId) {
              const statusStr = (b.estado || 'Activo').toString().toLowerCase();
              if (statusStr === 'activo') {
                barberMap.set(String(bId), {
                  id_empleado: bId,
                  nombre: b.nombre || b.primer_nombre || 'Barbero',
                  apellido: b.apellido || b.primer_apellido || '',
                  cargo: b.cargo || b.rol_nombre || 'Barbero',
                  telefono: b.telefono || ''
                });
              }
            }
          });

          setBarberos(Array.from(barberMap.values()));

          if (resBusy.success && Array.isArray(resBusy.data)) {
            setBusySlots(resBusy.data);
          }
        } catch (error) {
          console.error("Error al cargar datos públicos:", error);
          toast.error("Error al conectar con la base de datos de la barbería");
        } finally {
          setLoading(false);
        }
      };
      loadPublicData();
    }
  }, [open]);

  const monthDays = (() => {
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
  })();

  const getLocalTodayStr = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
  const todayStr = getLocalTodayStr();

  const handleClienteSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validar datos del cliente
    if (!clienteData.nombre || !clienteData.email || !clienteData.tipo_documento || !clienteData.documento || !clienteData.telefono) {
      toast.error('Por favor completa todos los campos obligatorios');
      return;
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(clienteData.email)) {
      toast.error('Por favor ingresa un email válido');
      return;
    }

    setStep('booking');
  };

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const hasSelectedServices = (bookingData.id_servicios || []).length || bookingData.id_servicio;
    if (!hasSelectedServices || !bookingData.fecha || !bookingData.hora) {
      toast.error('Por favor completa todos los campos obligatorios');
      return;
    }

    // Validar disponibilidad por duracion
    const empleadoId = bookingData.id_empleado ? parseInt(bookingData.id_empleado) : 0;
    if (hasConflictPublic(empleadoId, bookingData.fecha, bookingData.hora)) {
      toast.error(
        empleadoId === 0
          ? 'No hay ningún barbero disponible en la fecha y hora seleccionadas'
          : 'El barbero seleccionado no está disponible en la fecha y hora seleccionadas'
      );
      return;
    }

    // Calcular hora_fin
    const startMins = parseTimeToMinutes(bookingData.hora);
    const totalDuration = computeSelectedServicesDuration();
    const endMins = startMins + totalDuration;
    const endHH = Math.floor(endMins / 60).toString().padStart(2, '0');
    const endMM = (endMins % 60).toString().padStart(2, '0');

    // Determinar ID de barbero válido (asignación automática si se selecciona "Cualquier barbero")
    let selectedBarberId: number | null = null;
    const rawEmpId = bookingData.id_empleado ? parseInt(bookingData.id_empleado) : 0;

    if (rawEmpId > 0) {
      selectedBarberId = rawEmpId;
    } else {
      const dObj = new Date(bookingData.fecha + 'T00:00:00');
      const dayOfWeek = dObj.getDay();
      const start = parseTimeToMinutes(bookingData.hora);
      const duration = computeSelectedServicesDuration();
      const end = start + duration;

      const availableBarber = barberos.find(barber => {
        const bId = Number(barber.id_empleado);
        const sched = getBarberScheduleForDay(bId, dayOfWeek);
        if (!sched.activo) return false;

        const schedStart = parseTimeToMinutes(sched.hora_inicio || '09:00');
        const schedEnd = parseTimeToMinutes(sched.hora_fin || '18:00');
        if (start < schedStart || end > schedEnd) return false;

        if (isSlotBlockedByTimeBlock(bId, start, end)) return false;

        const isBusy = busySlots.some(c => {
          const cBId = Number(c.id_barbero || c.id_empleado || c.id_usuario);
          if (cBId !== bId || c.fecha !== bookingData.fecha) return false;
          const cStart = parseTimeToMinutes(c.hora);
          const cEnd = parseTimeToMinutes(c.hora_fin || c.hora);
          return start < cEnd && cStart < end;
        });

        return !isBusy;
      });

      if (availableBarber) {
        selectedBarberId = Number(availableBarber.id_empleado);
      } else if (barberos.length > 0) {
        selectedBarberId = Number(barberos[0].id_empleado);
      }
    }

    // Construir payload para la reserva pública
    const payload = {
      clienteData: {
        nombre: clienteData.nombre,
        email: clienteData.email,
        telefono: clienteData.telefono,
        tipo_documento: clienteData.tipo_documento,
        documento: clienteData.documento
      },
      bookingData: {
        id_servicios: (bookingData.id_servicios || []).length
          ? bookingData.id_servicios.map(id => parseInt(id))
          : (bookingData.id_servicio ? [parseInt(bookingData.id_servicio)] : []),
        id_barbero: selectedBarberId,
        fecha: bookingData.fecha,
        hora_inicio: bookingData.hora,
        hora_fin: `${endHH}:${endMM}`,
        observaciones: bookingData.observaciones
      }
    };

    setLoading(true);
    try {
      const res = await fetchApi('/appointments/public-booking', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      if (res.success) {
        setStep('success');
        toast.success('¡Cita agendada exitosamente!');
      }
    } catch (err: any) {
      toast.error(err.message || 'Error al procesar el agendamiento de tu cita');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setStep('info');
    setClienteData({ nombre: '', email: '', telefono: '', tipo_documento: 'CC', documento: '' });
    setBookingData({
      id_servicio: '',
      id_servicios: [],
      id_empleado: '',
      fecha: '',
      hora: '',
      observaciones: ''
    });
    onClose();
  };

  const formatDurationPublic = (minutes: number) => {
    if (!minutes) return '0 min';
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return h > 0 ? `${h}h ${m}m` : `${m} min`;
  };

  const formatSelectedServicesPublic = (booking: any) => {
    const ids: number[] = (booking.id_servicios && booking.id_servicios.length) 
      ? booking.id_servicios.map((s: string) => parseInt(s)) 
      : (booking.id_servicio ? [parseInt(booking.id_servicio)] : []);
    if (ids.length === 0) return 'N/A';
    return ids.map(id => servicios.find(s => s.id_servicio === id)?.nombre || 'N/A').join(', ');
  };

  // Generar horarios disponibles
  const timeSlots = [
    '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
    '12:00', '12:30', '14:00', '14:30', '15:00', '15:30',
    '16:00', '16:30', '17:00', '17:30', '18:00', '18:30'
  ];

  const parseTimeToMinutes = (time: string) => {
    const [hh, mm] = time.split(':').map(Number);
    return hh * 60 + mm;
  };

  const computeSelectedServicesDuration = () => {
    const selectedIds = (bookingData.id_servicios || []);
    const ids = selectedIds.length ? selectedIds.map(s => parseInt(s)) : (bookingData.id_servicio ? [parseInt(bookingData.id_servicio)] : []);
    if (ids.length === 0) return 30;
    return ids.reduce((sum, id) => sum + (servicios.find(s => s.id_servicio === id)?.duracion || 30), 0);
  };

  const computeSelectedServicesPrice = () => {
    const selectedIds = (bookingData.id_servicios || []);
    const ids = selectedIds.length ? selectedIds.map(s => parseInt(s)) : (bookingData.id_servicio ? [parseInt(bookingData.id_servicio)] : []);
    if (ids.length === 0) return 0;
    return ids.reduce((sum, id) => sum + (servicios.find(s => s.id_servicio === id)?.precio || 0), 0);
  };

  const getBarberScheduleForDay = (empId: number, dayOfWeek: number) => {
    const saved = localStorage.getItem(`barber_schedule_${empId}`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const match = parsed.find((s: any) => Number(s.dayId) === Number(dayOfWeek));
          if (match) return match;
        }
      } catch (e) {}
    }
    if (dayOfWeek === 0) {
      return { dayId: 0, dayName: 'Domingo', activo: false, hora_inicio: '09:00', hora_fin: '14:00' };
    }
    return {
      dayId: dayOfWeek,
      activo: true,
      hora_inicio: dayOfWeek === 6 ? '08:00' : '09:00',
      hora_fin: dayOfWeek === 6 ? '19:00' : '18:00'
    };
  };

  const getBarberTimeBlocks = (empId: number) => {
    const saved = localStorage.getItem(`barber_blocks_${empId}`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed.filter((b: any) => b.activo);
      } catch (e) {}
    }
    return [{ id: '1', motivo: 'Almuerzo', hora_inicio: '13:00', hora_fin: '14:00', activo: true }];
  };

  const isSlotBlockedByTimeBlock = (empId: number, startMins: number, endMins: number) => {
    const blocks = getBarberTimeBlocks(empId);
    return blocks.some((b: any) => {
      const bStart = parseTimeToMinutes(b.hora_inicio);
      const bEnd = parseTimeToMinutes(b.hora_fin);
      return startMins < bEnd && bStart < endMins;
    });
  };

  const getOccupiedTimesPublic = (fecha?: string, empleadoId?: number) => {
    if (!fecha) return [] as string[];
    const desiredDuration = computeSelectedServicesDuration();
    
    // Si la fecha es hoy, filtrar horarios pasados
    const today = new Date();
    const todayStrLocal = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    const currentMins = today.getHours() * 60 + today.getMinutes();

    const dObj = new Date(fecha + 'T00:00:00');
    const dayOfWeek = dObj.getDay();

    return timeSlots.filter(slot => {
      if (fecha === todayStrLocal) {
        const slotMins = parseTimeToMinutes(slot);
        if (slotMins < currentMins) {
          return true; // Considerado ocupado si ya pasó
        }
      }

      const start = parseTimeToMinutes(slot);
      const end = start + desiredDuration;
      const empIdNum = empleadoId !== undefined ? Number(empleadoId) : 0;

      if (empIdNum !== 0) {
        // Barbero específico: verificar si labora este día y horario
        const sched = getBarberScheduleForDay(empIdNum, dayOfWeek);
        if (!sched.activo) return true; // Día de descanso

        const schedStart = parseTimeToMinutes(sched.hora_inicio || '09:00');
        const schedEnd = parseTimeToMinutes(sched.hora_fin || '18:00');
        if (start < schedStart || end > schedEnd) return true; // Fuera de horario laborable

        // Verificar si el slot coincide con un Bloqueo de Tiempo (ej. Almuerzo/Diligencia)
        if (isSlotBlockedByTimeBlock(empIdNum, start, end)) return true;

        return busySlots.some(c => {
          const cBId = Number(c.id_barbero || c.id_empleado || c.id_usuario);
          if (cBId !== empIdNum || c.fecha !== fecha) return false;
          const cStart = parseTimeToMinutes(c.hora);
          const cEnd = parseTimeToMinutes(c.hora_fin || c.hora);
          return start < cEnd && cStart < end;
        });
      } else {
        // Cualquier barbero disponible:
        if (barberos.length === 0) {
          return busySlots.some(c => {
            if (c.fecha !== fecha) return false;
            const cStart = parseTimeToMinutes(c.hora);
            const cEnd = parseTimeToMinutes(c.hora_fin || c.hora);
            return start < cEnd && cStart < end;
          });
        }
        
        // Ocupado si NINGÚN barbero labora en ese slot o todos están en pausa/ocupados
        const atLeastOneAvailable = barberos.some(barber => {
          const bId = Number(barber.id_empleado);
          const sched = getBarberScheduleForDay(bId, dayOfWeek);
          if (!sched.activo) return false;

          const schedStart = parseTimeToMinutes(sched.hora_inicio || '09:00');
          const schedEnd = parseTimeToMinutes(sched.hora_fin || '18:00');
          if (start < schedStart || end > schedEnd) return false;

          if (isSlotBlockedByTimeBlock(bId, start, end)) return false;

          const isBusy = busySlots.some(c => {
            const cBId = Number(c.id_barbero || c.id_empleado || c.id_usuario);
            if (cBId !== bId || c.fecha !== fecha) return false;
            const cStart = parseTimeToMinutes(c.hora);
            const cEnd = parseTimeToMinutes(c.hora_fin || c.hora);
            return start < cEnd && cStart < end;
          });

          return !isBusy;
        });

        return !atLeastOneAvailable;
      }
    });
  };

  const hasConflictPublic = (empleadoId: number, fecha: string, hora: string) => {
    const start = parseTimeToMinutes(hora);
    const duration = computeSelectedServicesDuration();
    const end = start + duration;
    
    // Validar si es hoy y la hora ya pasó
    const today = new Date();
    const todayStrLocal = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    const currentMins = today.getHours() * 60 + today.getMinutes();
    if (fecha === todayStrLocal && start < currentMins) {
      return true;
    }

    const dObj = new Date(fecha + 'T00:00:00');
    const dayOfWeek = dObj.getDay();

    const empIdNum = Number(empleadoId);
    if (empIdNum !== 0) {
      const sched = getBarberScheduleForDay(empIdNum, dayOfWeek);
      if (!sched.activo) return true;

      const schedStart = parseTimeToMinutes(sched.hora_inicio || '09:00');
      const schedEnd = parseTimeToMinutes(sched.hora_fin || '18:00');
      if (start < schedStart || end > schedEnd) return true;

      if (isSlotBlockedByTimeBlock(empIdNum, start, end)) return true;

      return busySlots.some(c => {
        const cBId = Number(c.id_barbero || c.id_empleado || c.id_usuario);
        if (cBId !== empIdNum || c.fecha !== fecha) return false;
        const cStart = parseTimeToMinutes(c.hora);
        const cEnd = parseTimeToMinutes(c.hora_fin || c.hora);
        return start < cEnd && cStart < end;
      });
    } else {
      if (barberos.length === 0) {
        return busySlots.some(c => {
          if (c.fecha !== fecha) return false;
          const cStart = parseTimeToMinutes(c.hora);
          const cEnd = parseTimeToMinutes(c.hora_fin || c.hora);
          return start < cEnd && cStart < end;
        });
      }
      
      const atLeastOneAvailable = barberos.some(barber => {
        const bId = Number(barber.id_empleado);
        const sched = getBarberScheduleForDay(bId, dayOfWeek);
        if (!sched.activo) return false;

        const schedStart = parseTimeToMinutes(sched.hora_inicio || '09:00');
        const schedEnd = parseTimeToMinutes(sched.hora_fin || '18:00');
        if (start < schedStart || end > schedEnd) return false;

        if (isSlotBlockedByTimeBlock(bId, start, end)) return false;

        const isBusy = busySlots.some(c => {
          const cBId = Number(c.id_barbero || c.id_empleado || c.id_usuario);
          if (cBId !== bId || c.fecha !== fecha) return false;
          const cStart = parseTimeToMinutes(c.hora);
          const cEnd = parseTimeToMinutes(c.hora_fin || c.hora);
          return start < cEnd && cStart < end;
        });

        return !isBusy;
      });

      return !atLeastOneAvailable;
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        {loading && (
          <div className="absolute inset-0 z-50 bg-black/30 backdrop-blur-sm flex items-center justify-center rounded-lg">
            <div className="text-center bg-white p-6 rounded-lg shadow-xl flex flex-col items-center">
              <Clock className="w-8 h-8 text-[#0057FF] animate-spin mb-2" />
              <p className="text-sm font-bold text-gray-700">Procesando solicitud...</p>
            </div>
          </div>
        )}

        <DialogHeader>
          {step === 'info' && (
            <>
              <DialogTitle className="flex items-center gap-2">
                <Scissors className="w-6 h-6 text-[#0057FF]" />
                Reserva tu Cita
              </DialogTitle>
              <DialogDescription>
                Completa tus datos para agendar una cita. Te enviaremos un recordatorio por correo.
              </DialogDescription>
            </>
          )}
          {step === 'booking' && (
            <>
              <DialogTitle className="flex items-center gap-2">
                <Calendar className="w-6 h-6 text-[#0057FF]" />
                Selecciona Servicio y Fecha
              </DialogTitle>
              <DialogDescription>
                Elige el servicio que deseas y la fecha/hora de tu cita
              </DialogDescription>
            </>
          )}
          {step === 'success' && (
            <>
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle2 className="w-10 h-10 text-green-600" />
                </div>
              </div>
              <DialogTitle className="text-center">¡Cita Agendada Exitosamente!</DialogTitle>
              <DialogDescription className="text-center">
                Hemos enviado un correo de confirmación a <strong>{clienteData.email}</strong>
              </DialogDescription>
            </>
          )}
        </DialogHeader>

        {step === 'info' && (
          <form onSubmit={handleClienteSubmit}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="nombre">Nombre Completo *</Label>
                <Input
                  id="nombre"
                  placeholder="Juan Pérez"
                  value={clienteData.nombre}
                  onChange={(e) => setClienteData({ ...clienteData, nombre: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Correo Electrónico *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="juan@email.com"
                  value={clienteData.email}
                  onChange={(e) => setClienteData({ ...clienteData, email: e.target.value })}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Te enviaremos un recordatorio de tu cita a este correo
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="tipo_documento">Tipo de Documento *</Label>
                  <Select
                    value={clienteData.tipo_documento}
                    onValueChange={(val) => setClienteData({ ...clienteData, tipo_documento: val })}
                  >
                    <SelectTrigger id="tipo_documento" className="bg-white">
                      <SelectValue placeholder="Seleccione..." />
                    </SelectTrigger>
                    <SelectContent className="bg-white z-50">
                      <SelectItem value="CC">Cédula (CC)</SelectItem>
                      <SelectItem value="CE">Cédula Extranjería (CE)</SelectItem>
                      <SelectItem value="TI">Tarjeta Identidad (TI)</SelectItem>
                      <SelectItem value="NIT">NIT</SelectItem>
                      <SelectItem value="Pasaporte">Pasaporte</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="documento">Documento de Identidad *</Label>
                  <Input
                    id="documento"
                    placeholder="Ej: 1020304050"
                    value={clienteData.documento}
                    onChange={(e) => setClienteData({ ...clienteData, documento: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="telefono">Teléfono *</Label>
                <Input
                  id="telefono"
                  type="tel"
                  placeholder="555-1234"
                  value={clienteData.telefono}
                  onChange={(e) => setClienteData({ ...clienteData, telefono: e.target.value })}
                  required
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleClose}>
                Cancelar
              </Button>
              <Button
                type="submit"
                style={{ backgroundColor: '#0057FF', color: '#FFFFFF', fontWeight: 700, border: 'none', minWidth: '110px' }}
              >
                Continuar
              </Button>
            </DialogFooter>
          </form>
        )}

        {step === 'booking' && (
          <form onSubmit={handleBookingSubmit}>
            <div 
              style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
                gap: '24px' 
              }} 
              className="py-4"
            >
              {/* Left Column: Services & Barber & Observaciones */}
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label>Servicios *</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-48 overflow-y-auto p-2 border rounded">
                    {servicios.map(servicio => {
                      const checked = (bookingData.id_servicios || []).includes(servicio.id_servicio.toString());
                      return (
                        <label key={servicio.id_servicio} className="flex items-center gap-2 text-sm cursor-pointer">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={(e) => {
                              const next = new Set((bookingData.id_servicios || []));
                              if (e.target.checked) next.add(servicio.id_servicio.toString()); else next.delete(servicio.id_servicio.toString());
                              setBookingData({ ...bookingData, id_servicios: Array.from(next), hora: '' });
                            }}
                          />
                          <div className="flex-1">
                            <div className="font-medium text-gray-800">{servicio.nombre}</div>
                            <div className="text-xs text-muted-foreground">{formatCOP(servicio.precio)} — {servicio.duracion} min</div>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                  <div className="mt-2 text-sm text-muted-foreground">Duración total: <span className="font-semibold text-[#0057FF]">{formatDurationPublic(computeSelectedServicesDuration())}</span> • Precio total: <span className="font-semibold text-[#0057FF]">{formatCOP(computeSelectedServicesPrice())}</span></div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="empleado">Barbero (Opcional)</Label>
                  <Select
                    value={bookingData.id_empleado}
                    onValueChange={(value) => setBookingData({ ...bookingData, id_empleado: value, hora: '' })}
                  >
                    <SelectTrigger className="bg-white">
                      <SelectValue placeholder="Cualquier barbero disponible" />
                    </SelectTrigger>
                    <SelectContent className="bg-white z-50">
                      <SelectItem value="0">Cualquier barbero disponible</SelectItem>
                      {barberos.map((empleado) => (
                        <SelectItem key={empleado.id_empleado} value={empleado.id_empleado.toString()}>
                          {empleado.nombre} {empleado.apellido} - {empleado.cargo}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="observaciones">Observaciones (Opcional)</Label>
                  <Textarea
                    id="observaciones"
                    placeholder="Preferencias o detalles especiales..."
                    value={bookingData.observaciones}
                    onChange={(e) => setBookingData({ ...bookingData, observaciones: e.target.value })}
                    rows={3}
                  />
                </div>
              </div>

              {/* Right Column: Calendar & Hour Selection & Summary */}
              <div className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Fecha de tu Cita *</Label>
                    <div className="flex items-center gap-2 bg-muted/50 rounded-lg p-1">
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7"
                        onClick={() => {
                          const d = new Date(calendarMonth);
                          d.setMonth(d.getMonth() - 1);
                          setCalendarMonth(d);
                        }}
                      >
                        ‹
                      </Button>
                      <div className="px-2 font-medium text-xs min-w-24 text-center capitalize">
                        {calendarMonth.toLocaleString('es-ES', { month: 'long', year: 'numeric' })}
                      </div>
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7"
                        onClick={() => {
                          const d = new Date(calendarMonth);
                          d.setMonth(d.getMonth() + 1);
                          setCalendarMonth(d);
                        }}
                      >
                        ›
                      </Button>
                    </div>
                  </div>

                  <div 
                    style={{ 
                      display: 'grid', 
                      gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', 
                      gap: '4px' 
                    }} 
                    className="bg-muted/20 p-2 rounded-lg border border-[#0057FF]/20"
                  >
                    {['D', 'L', 'M', 'X', 'J', 'V', 'S'].map(d => (
                      <div key={d} className="text-center text-[10px] font-bold text-muted-foreground uppercase py-1">{d}</div>
                    ))}

                    {(() => {
                      const cells: Array<{ day?: number; dateStr?: string } | null> = [];
                      for (let i = 0; i < monthDays.firstDay; i++) cells.push(null);
                      monthDays.days.forEach(d => cells.push({ day: d.day, dateStr: d.dateStr }));

                      return cells.map((cell, idx) => {
                        if (!cell) return <div key={`empty-${idx}`} />;

                        const day = cell.day;
                        const dateStr = cell.dateStr;
                        if (!day || !dateStr) return <div key={`empty-${idx}`} />;

                        const isToday = dateStr === todayStr;
                        const isSelected = bookingData.fecha === dateStr;
                        const isPast = dateStr < todayStr;

                        return (
                           <button
                             key={dateStr}
                             type="button"
                             disabled={isPast}
                             onClick={() => setBookingData({ ...bookingData, fecha: dateStr, hora: '' })}
                             className={`
                               h-8 w-full rounded-md text-xs font-medium transition-all
                               ${isSelected ? 'bg-[#0057FF] text-white scale-105 shadow-lg shadow-[#0057FF]/20' : 'hover:bg-[#0057FF]/20'}
                               ${isToday && !isSelected ? 'border border-[#0057FF] text-[#0057FF]' : ''}
                               ${isPast ? 'opacity-20 cursor-not-allowed text-muted-foreground' : 'cursor-pointer px-1'}
                             `}
                           >
                             {day}
                           </button>
                        );
                      });
                    })()}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="hora" className={!bookingData.fecha ? 'opacity-50' : ''}>Hora *</Label>
                  <Select
                    value={bookingData.hora}
                    onValueChange={(value) => setBookingData({ ...bookingData, hora: value })}
                    disabled={!bookingData.fecha}
                  >
                    <SelectTrigger className="bg-white" disabled={!bookingData.fecha}>
                      <SelectValue placeholder={bookingData.fecha ? "Selecciona hora" : "Selecciona una fecha primero"} />
                    </SelectTrigger>
                    <SelectContent className="bg-white z-50">
                      {(() => {
                        if (!bookingData.fecha) return null;
                        const empleadoId = bookingData.id_empleado ? parseInt(bookingData.id_empleado) : 0;
                        const occupied = getOccupiedTimesPublic(bookingData.fecha, empleadoId) || [];
                        return timeSlots.map((time) => (
                          <SelectItem key={time} value={time} disabled={occupied.includes(time)} className={occupied.includes(time) ? 'opacity-50 cursor-not-allowed' : ''}>
                            {time}{occupied.includes(time) ? ' — ocupado' : ''}
                          </SelectItem>
                        ));
                      })()}
                    </SelectContent>
                  </Select>
                </div>

                {((bookingData.id_servicios || []).length > 0 || bookingData.id_servicio) && (
                  <div className="p-4 bg-[#0057FF]/10 border border-[#0057FF]/30 rounded-lg">
                    <p className="font-semibold mb-2 text-sm text-[#0057FF]">Resumen de tu cita:</p>
                    <div className="space-y-1">
                      <p className="text-xs">
                        <span className="text-muted-foreground mr-1">Servicios:</span> {formatSelectedServicesPublic(bookingData)}
                      </p>
                      <p className="text-xs">
                        <span className="text-muted-foreground mr-1">Precio total:</span> {formatCOP(computeSelectedServicesPrice())}
                      </p>
                      <p className="text-xs">
                        <span className="text-muted-foreground mr-1">Duración total:</span> {formatDurationPublic(computeSelectedServicesDuration())}
                      </p>
                      {bookingData.fecha && (
                        <p className="text-xs">
                          <span className="text-muted-foreground mr-1">Fecha:</span> {new Date(bookingData.fecha + 'T00:00:00').toLocaleDateString('es-ES', {
                            weekday: 'long', day: 'numeric', month: 'long'
                          })}
                        </p>
                      )}
                      {bookingData.hora && (
                        <p className="text-xs">
                          <span className="text-muted-foreground mr-1">Hora:</span> {bookingData.hora}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setStep('info')}>
                Atrás
              </Button>
              <Button
                type="submit"
                style={{ backgroundColor: '#0057FF', color: '#FFFFFF', fontWeight: 700, border: 'none', minWidth: '130px' }}
              >
                Confirmar Cita
              </Button>
            </DialogFooter>
          </form>
        )}

        {step === 'success' && (() => {
          const selectedBarberObj = barberos.find(b => String(b.id_empleado) === String(bookingData.id_empleado));
          const barberName = selectedBarberObj ? `${selectedBarberObj.nombre} ${selectedBarberObj.apellido}`.trim() : 'Cualquier barbero disponible';
          const barberPhone = selectedBarberObj?.telefono || '';

          const fechaFormat = bookingData.fecha ? new Date(bookingData.fecha + 'T00:00:00').toLocaleDateString('es-ES', {
            weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
          }) : '';

          const messageText = `💈 *Reserva de Cita - CzBarber* 💈\n\n` +
            `👤 *Cliente:* ${clienteData.nombre}\n` +
            `📱 *Teléfono:* ${clienteData.telefono}\n` +
            `✂️ *Servicio(s):* ${formatSelectedServicesPublic(bookingData)}\n` +
            `📅 *Fecha:* ${fechaFormat}\n` +
            `⏰ *Hora:* ${bookingData.hora}\n` +
            `💈 *Barbero:* ${barberName}\n` +
            `💰 *Total:* ${formatCOP(computeSelectedServicesPrice())}\n\n` +
            `¡Hola! Acabo de agendar esta cita desde la web. Quedo atento a la confirmación.`;

          const cleanPhone = barberPhone.replace(/[^0-9]/g, '');
          const whatsappUrl = cleanPhone 
            ? `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(messageText)}`
            : `https://api.whatsapp.com/send?text=${encodeURIComponent(messageText)}`;

          return (
            <div className="py-6 space-y-4">
              <div className="bg-gradient-to-r from-[#1a1a1a] to-[#2d2d2d] text-white p-6 rounded-lg space-y-3">
                <div className="flex items-start gap-3">
                  <Scissors className="w-5 h-5 text-[#0057FF] flex-shrink-0 mt-1" />
                  <div>
                    <p className="text-[10px] text-gray-400 uppercase tracking-wider">Servicios</p>
                    <p className="font-medium text-sm">{formatSelectedServicesPublic(bookingData)}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Calendar className="w-5 h-5 text-[#0057FF] flex-shrink-0 mt-1" />
                  <div>
                    <p className="text-[10px] text-gray-400 uppercase tracking-wider">Fecha</p>
                    <p className="font-medium text-sm">
                      {fechaFormat}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-[#0057FF] flex-shrink-0 mt-1" />
                  <div>
                    <p className="text-[10px] text-gray-400 uppercase tracking-wider">Hora y Barbero</p>
                    <p className="font-medium text-sm">{bookingData.hora} — <span className="text-[#0057FF] font-bold">{barberName}</span></p>
                  </div>
                </div>
              </div>

              {/* Botón WhatsApp */}
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition-all shadow-md hover:shadow-emerald-200/50 text-sm"
              >
                <MessageCircle className="w-5 h-5 text-white" />
                Enviar mensaje por WhatsApp al barbero
              </a>

              <div className="p-4 bg-muted/30 border border-muted rounded-lg">
                <p className="text-xs text-muted-foreground">
                  <strong className="text-foreground">Nota:</strong> Te enviaremos un recordatorio por correo a <strong>{clienteData.email}</strong>.
                  También puedes pulsar el botón de WhatsApp arriba para enviar el resumen directamente al barbero.
                </p>
              </div>

              <DialogFooter className="mt-4">
                <Button
                  onClick={handleClose}
                  style={{ backgroundColor: '#0057FF', color: '#FFFFFF', fontWeight: 700, border: 'none', width: '100%' }}
                >
                  Cerrar
                </Button>
              </DialogFooter>
            </div>
          );
        })()}
      </DialogContent>
    </Dialog>
  );
}
