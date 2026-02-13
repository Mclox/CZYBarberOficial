import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { Calendar, Clock, Scissors, CheckCircle2 } from 'lucide-react';
import { mockServicios, mockEmpleados, ClienteTemporal, Cita } from '../shared/lib/mockData';
import { dataStore, addClienteTemporal, addCita, getNextClienteTemporalId, getNextCitaId } from '../shared/lib/dataStore';
import { toast } from 'sonner';

interface PublicBookingFormProps {
  open: boolean;
  onClose: () => void;
}

export function PublicBookingForm({ open, onClose }: PublicBookingFormProps) {
  const [step, setStep] = useState<'info' | 'booking' | 'success'>('info');
  const [clienteData, setClienteData] = useState({
    nombre: '',
    email: '',
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

  const [calendarMonth, setCalendarMonth] = useState(() => {
    const d = new Date();
    d.setDate(1);
    return d;
  });

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

  const todayStr = new Date().toISOString().slice(0, 10);

  const handleClienteSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validar datos del cliente
    if (!clienteData.nombre || !clienteData.email || !clienteData.telefono) {
      toast.error('Por favor completa todos los campos');
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

  const handleBookingSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const hasSelectedServices = (bookingData.id_servicios || []).length || bookingData.id_servicio;
    if (!hasSelectedServices || !bookingData.fecha || !bookingData.hora) {
      toast.error('Por favor completa todos los campos obligatorios');
      return;
    }

    // validate availability by summed duration
    const empleadoId = bookingData.id_empleado ? parseInt(bookingData.id_empleado) : undefined;
    const desiredDuration = computeSelectedServicesDuration();
    if (empleadoId && hasConflictPublic(empleadoId, bookingData.fecha, bookingData.hora)) {
      toast.error('El barbero no está disponible en la fecha y hora seleccionadas');
      return;
    }

    // Guardar cliente temporal
    const newClienteTemporal: ClienteTemporal = {
      id_cliente_temporal: getNextClienteTemporalId(),
      nombre: clienteData.nombre,
      email: clienteData.email,
      telefono: clienteData.telefono,
      fecha_registro: new Date().toISOString().split('T')[0],
      estado: 'pendiente',
    };
    addClienteTemporal(newClienteTemporal);

    // Crear cita
    const firstServiceId = (bookingData.id_servicios || []).length
      ? parseInt((bookingData.id_servicios || [])[0])
      : parseInt(bookingData.id_servicio || '0');

    const newCita: Cita = {
      id_cita: getNextCitaId(),
      id_cliente: 0, // No tiene cliente registrado
      id_cliente_temporal: newClienteTemporal.id_cliente_temporal,
      id_servicio: firstServiceId,
      id_servicios: (bookingData.id_servicios || []).length
        ? (bookingData.id_servicios || []).map(s => parseInt(s))
        : [firstServiceId],
      id_empleado: bookingData.id_empleado && bookingData.id_empleado !== '0' ? parseInt(bookingData.id_empleado) : undefined,
      fecha: bookingData.fecha,
      hora: bookingData.hora,
      estado: 'pendiente',
      observaciones: bookingData.observaciones,
    };
    addCita(newCita);

    setStep('success');
    toast.success('¡Cita agendada exitosamente!');
  };

  const handleClose = () => {
    setStep('info');
    setClienteData({ nombre: '', email: '', telefono: '' });
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

  const getServiceName = (id: number) => {
    return mockServicios.find(s => s.id_servicio === id)?.nombre || '';
  };

  const getServicePrice = (id: number) => {
    return mockServicios.find(s => s.id_servicio === id)?.precio || 0;
  };

  const formatDurationPublic = (minutes: number) => {
    if (!minutes) return '0 min';
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return h > 0 ? `${h}h ${m}m` : `${m} min`;
  };

  const formatSelectedServicesPublic = (booking: any) => {
    const ids: number[] = (booking.id_servicios && booking.id_servicios.length) ? booking.id_servicios.map((s: string) => parseInt(s)) : (booking.id_servicio ? [parseInt(booking.id_servicio)] : []);
    if (ids.length === 0) return 'N/A';
    return ids.map(id => mockServicios.find(s => s.id_servicio === id)?.nombre || 'N/A').join(', ');
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

  const computeServiciosDuration = (cita: any) => {
    const ids: number[] = cita.id_servicios?.length ? cita.id_servicios : (cita.id_servicio ? [cita.id_servicio] : []);
    if (ids.length === 0) return 30;
    return ids.reduce((sum, id) => sum + (mockServicios.find(s => s.id_servicio === id)?.duracion || 30), 0);
  };

  const computeSelectedServicesDuration = () => {
    const selectedIds = (bookingData.id_servicios || []);
    const ids = selectedIds.length ? selectedIds.map(s => parseInt(s)) : (bookingData.id_servicio ? [parseInt(bookingData.id_servicio)] : []);
    if (ids.length === 0) return 30;
    return ids.reduce((sum, id) => sum + (mockServicios.find(s => s.id_servicio === id)?.duracion || 30), 0);
  };

  const computeSelectedServicesPrice = () => {
    const selectedIds = (bookingData.id_servicios || []);
    const ids = selectedIds.length ? selectedIds.map(s => parseInt(s)) : (bookingData.id_servicio ? [parseInt(bookingData.id_servicio)] : []);
    if (ids.length === 0) return 0;
    return ids.reduce((sum, id) => sum + (mockServicios.find(s => s.id_servicio === id)?.precio || 0), 0);
  };

  const getOccupiedTimesPublic = (fecha?: string, empleadoId?: number) => {
    if (!fecha || !empleadoId) return [] as string[];
    const desiredDuration = computeSelectedServicesDuration();
    return timeSlots.filter(slot => {
      const start = parseTimeToMinutes(slot);
      const end = start + desiredDuration;
      return dataStore.citas.some(c => {
        if (c.id_empleado !== empleadoId || c.fecha !== fecha) return false;
        const cStart = parseTimeToMinutes(c.hora);
        const cDuration = computeServiciosDuration(c);
        const cEnd = cStart + cDuration;
        return start < cEnd && cStart < end;
      });
    });
  };

  const hasConflictPublic = (empleadoId: number, fecha: string, hora: string) => {
    if (!empleadoId) return false;
    const start = parseTimeToMinutes(hora);
    const duration = computeSelectedServicesDuration();
    const end = start + duration;
    return dataStore.citas.some(c => {
      if (c.id_empleado !== empleadoId || c.fecha !== fecha) return false;
      const cStart = parseTimeToMinutes(c.hora);
      const cDuration = computeServiciosDuration(c);
      const cEnd = cStart + cDuration;
      return start < cEnd && cStart < end;
    });
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          {step === 'info' && (
            <>
              <DialogTitle className="flex items-center gap-2">
                <Scissors className="w-6 h-6 text-[#D4AF37]" />
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
                <Calendar className="w-6 h-6 text-[#D4AF37]" />
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
                <p className="text-sm text-muted-foreground">
                  Te enviaremos un recordatorio de tu cita a este correo
                </p>
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
              <Button type="submit" className="bg-[#D4AF37] hover:bg-[#B8941F] text-black">
                Continuar
              </Button>
            </DialogFooter>
          </form>
        )}

        {step === 'booking' && (
          <form onSubmit={handleBookingSubmit}>
            <div className="space-y-6 py-4">
              <div className="space-y-2">
                <Label>Servicios *</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-48 overflow-y-auto p-2 border rounded">
                  {mockServicios.map(servicio => {
                    const checked = (bookingData.id_servicios || []).includes(servicio.id_servicio.toString());
                    return (
                      <label key={servicio.id_servicio} className="flex items-center gap-2 text-sm cursor-pointer">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={(e) => {
                            const next = new Set((bookingData.id_servicios || []));
                            if (e.target.checked) next.add(servicio.id_servicio.toString()); else next.delete(servicio.id_servicio.toString());
                            setBookingData({ ...bookingData, id_servicios: Array.from(next) });
                          }}
                        />
                        <div className="flex-1">
                          <div className="font-medium">{servicio.nombre}</div>
                          <div className="text-xs text-muted-foreground">${servicio.precio.toFixed(2)} — {servicio.duracion} min</div>
                        </div>
                      </label>
                    );
                  })}
                </div>
                <div className="mt-2 text-sm text-muted-foreground">Duración total: <span className="font-medium text-white">{formatDurationPublic(computeSelectedServicesDuration())}</span> • Precio total: <span className="font-medium text-white">${computeSelectedServicesPrice().toFixed(2)}</span></div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="empleado">Barbero (Opcional)</Label>
                <Select
                  value={bookingData.id_empleado}
                  onValueChange={(value) => setBookingData({ ...bookingData, id_empleado: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Cualquier barbero disponible" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">Cualquier barbero disponible</SelectItem>
                    {mockEmpleados.map((empleado) => (
                      <SelectItem key={empleado.id_empleado} value={empleado.id_empleado.toString()}>
                        {empleado.nombre} {empleado.apellido} - {empleado.cargo}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

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

                <div className="grid grid-cols-7 gap-1 bg-muted/20 p-2 rounded-lg border border-[#D4AF37]/20">
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
                          onClick={() => setBookingData({ ...bookingData, fecha: dateStr })}
                          className={`
                            h-8 w-full rounded-md text-xs font-medium transition-all
                            ${isSelected ? 'bg-[#D4AF37] text-black scale-105 shadow-lg shadow-[#D4AF37]/20' : 'hover:bg-[#D4AF37]/20'}
                            ${isToday && !isSelected ? 'border border-[#D4AF37] text-[#D4AF37]' : ''}
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
                <Label htmlFor="hora">Hora *</Label>
                <Select
                  value={bookingData.hora}
                  onValueChange={(value) => setBookingData({ ...bookingData, hora: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona hora" />
                  </SelectTrigger>
                  <SelectContent>
                    {(() => {
                      const empleadoId = bookingData.id_empleado ? parseInt(bookingData.id_empleado) : undefined;
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

              {((bookingData.id_servicios || []).length > 0 || bookingData.id_servicio) && (
                <div className="p-4 bg-[#D4AF37]/10 border border-[#D4AF37]/30 rounded-lg">
                  <p className="font-semibold mb-2 text-sm text-[#D4AF37]">Resumen de tu cita:</p>
                  <div className="space-y-1">
                    <p className="text-xs">
                      <span className="text-muted-foreground mr-1">Servicios:</span> {formatSelectedServicesPublic(bookingData)}
                    </p>
                    <p className="text-xs">
                      <span className="text-muted-foreground mr-1">Precio total:</span> ${computeSelectedServicesPrice().toFixed(2)}
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
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setStep('info')}>
                Atrás
              </Button>
              <Button type="submit" className="bg-[#D4AF37] hover:bg-[#B8941F] text-black">
                Confirmar Cita
              </Button>
            </DialogFooter>
          </form>
        )}

        {step === 'success' && (
          <div className="py-6">
            <div className="bg-gradient-to-r from-[#1a1a1a] to-[#2d2d2d] text-white p-6 rounded-lg space-y-3">
              <div className="flex items-start gap-3">
                <Scissors className="w-5 h-5 text-[#D4AF37] flex-shrink-0 mt-1" />
                <div>
                  <p className="text-[10px] text-gray-400 uppercase tracking-wider">Servicios</p>
                  <p className="font-medium text-sm">{formatSelectedServicesPublic(bookingData)}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Calendar className="w-5 h-5 text-[#D4AF37] flex-shrink-0 mt-1" />
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
                <Clock className="w-5 h-5 text-[#D4AF37] flex-shrink-0 mt-1" />
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
                className="w-full bg-[#D4AF37] hover:bg-[#B8941F] text-black"
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
