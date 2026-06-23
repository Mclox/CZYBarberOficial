import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { Calendar, Clock, Scissors, CheckCircle2 } from 'lucide-react';
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
          const [resServ, resBarb, resBusy] = await Promise.all([
            fetchApi('/services/public'),
            fetchApi('/employees/public'),
            fetchApi('/appointments/public-busy-slots')
          ]);
          
          if (resServ.success) {
            const normalized = resServ.data.map((s: any) => ({
              id_servicio: s.id_servicio,
              nombre: s.nombre,
              precio: parseFloat(s.precio_neto || 0),
              duracion: parseInt(s.duracion_minutos || 30),
              estado: s.estado
            }));
            setServicios(normalized.filter((s: any) => s.estado === 'Activo'));
          }
          if (resBarb.success) {
            setBarberos(resBarb.data.filter((b: any) => b.estado === 'Activo'));
          }
          if (resBusy.success) {
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
          ? bookingData.id_servicios
          : [bookingData.id_servicio],
        id_barbero: bookingData.id_empleado ? parseInt(bookingData.id_empleado) : 0,
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

  const getOccupiedTimesPublic = (fecha?: string, empleadoId?: number) => {
    if (!fecha) return [] as string[];
    const desiredDuration = computeSelectedServicesDuration();
    
    // Si la fecha es hoy, filtrar horarios pasados
    const today = new Date();
    const todayStrLocal = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    const currentMins = today.getHours() * 60 + today.getMinutes();

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
        // Barbero específico
        return busySlots.some(c => {
          if (c.id_barbero !== empIdNum || c.fecha !== fecha) return false;
          const cStart = parseTimeToMinutes(c.hora);
          const cEnd = parseTimeToMinutes(c.hora_fin || c.hora);
          return start < cEnd && cStart < end;
        });
      } else {
        // Cualquier barbero disponible: ocupado si TODOS los barberos activos están ocupados
        if (barberos.length === 0) return true;
        return barberos.every(barber => {
          const bId = Number(barber.id_empleado);
          return busySlots.some(c => {
            if (c.id_barbero !== bId || c.fecha !== fecha) return false;
            const cStart = parseTimeToMinutes(c.hora);
            const cEnd = parseTimeToMinutes(c.hora_fin || c.hora);
            return start < cEnd && cStart < end;
          });
        });
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

    const empIdNum = Number(empleadoId);
    if (empIdNum !== 0) {
      return busySlots.some(c => {
        if (c.id_barbero !== empIdNum || c.fecha !== fecha) return false;
        const cStart = parseTimeToMinutes(c.hora);
        const cEnd = parseTimeToMinutes(c.hora_fin || c.hora);
        return start < cEnd && cStart < end;
      });
    } else {
      if (barberos.length === 0) return true;
      return barberos.every(barber => {
        const bId = Number(barber.id_empleado);
        return busySlots.some(c => {
          if (c.id_barbero !== bId || c.fecha !== fecha) return false;
          const cStart = parseTimeToMinutes(c.hora);
          const cEnd = parseTimeToMinutes(c.hora_fin || c.hora);
          return start < cEnd && cStart < end;
        });
      });
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

        {step === 'success' && (
          <div className="py-6">
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
                    {new Date(bookingData.fecha + 'T00:00:00').toLocaleDateString('es-ES', {
                      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
                    })}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-[#0057FF] flex-shrink-0 mt-1" />
                <div>
                  <p className="text-[10px] text-gray-400 uppercase tracking-wider">Hora</p>
                  <p className="font-medium text-sm">{bookingData.hora}</p>
                </div>
              </div>
            </div>
            <div className="mt-6 p-4 bg-muted/30 border border-muted rounded-lg">
              <p className="text-xs text-muted-foreground">
                <strong className="text-foreground">Nota:</strong> Te enviaremos un recordatorio por correo 24 horas antes de tu cita.
                Si necesitas cancelar o reprogramar, por favor contáctanos al (555) 123-4567.
              </p>
            </div>
            <DialogFooter className="mt-6">
              <Button
                onClick={handleClose}
                style={{ backgroundColor: '#0057FF', color: '#FFFFFF', fontWeight: 700, border: 'none', width: '100%' }}
              >
                Cerrar
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
