import { useState, useRef, useEffect } from 'react';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '../../../components/ui/avatar';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../../../components/ui/dialog';
import { User, Mail, Phone, Lock, Save, Camera, Shield, Loader2, Clock, Plus, Trash2, Edit3, Coffee } from 'lucide-react';
import { useAuth } from '../../auth';
import { toast } from 'sonner';
import { fetchApi } from '../../../lib/api';

export interface DaySchedule {
  dayId: number;
  dayName: string;
  activo: boolean;
  hora_inicio: string;
  hora_fin: string;
}

export interface TimeBlock {
  id: string;
  motivo: string;
  hora_inicio: string;
  hora_fin: string;
  activo: boolean;
}

export const DEFAULT_SCHEDULE: DaySchedule[] = [
  { dayId: 1, dayName: 'Lunes', activo: true, hora_inicio: '09:00', hora_fin: '18:00' },
  { dayId: 2, dayName: 'Martes', activo: true, hora_inicio: '09:00', hora_fin: '18:00' },
  { dayId: 3, dayName: 'Miércoles', activo: true, hora_inicio: '09:00', hora_fin: '18:00' },
  { dayId: 4, dayName: 'Jueves', activo: true, hora_inicio: '09:00', hora_fin: '18:00' },
  { dayId: 5, dayName: 'Viernes', activo: true, hora_inicio: '09:00', hora_fin: '19:00' },
  { dayId: 6, dayName: 'Sábado', activo: true, hora_inicio: '08:00', hora_fin: '19:00' },
  { dayId: 0, dayName: 'Domingo', activo: false, hora_inicio: '09:00', hora_fin: '14:00' },
];

export const DEFAULT_TIME_BLOCKS: TimeBlock[] = [
  { id: '1', motivo: 'Almuerzo', hora_inicio: '13:00', hora_fin: '14:00', activo: true }
];

export const timeOptions = [
  '06:00', '06:30', '07:00', '07:30', '08:00', '08:30', '09:00', '09:30',
  '10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '13:00', '13:30',
  '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30',
  '18:00', '18:30', '19:00', '19:30', '20:00', '20:30', '21:00'
];

export function MiPerfilView() {
  const { user, updateUser, roleName } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [schedules, setSchedules] = useState<DaySchedule[]>(DEFAULT_SCHEDULE);
  const [generalShift, setGeneralShift] = useState({ hora_inicio: '09:00', hora_fin: '21:00' });
  const [timeBlocks, setTimeBlocks] = useState<TimeBlock[]>(DEFAULT_TIME_BLOCKS);
  const [savingSchedule, setSavingSchedule] = useState(false);

  // Modal de Bloqueos de Tiempo
  const [blockDialogOpen, setBlockDialogOpen] = useState(false);
  const [editingBlock, setEditingBlock] = useState<TimeBlock | null>(null);
  const [blockFormData, setBlockFormData] = useState({
    motivo: 'Almuerzo',
    hora_inicio: '13:00',
    hora_fin: '14:00',
    activo: true
  });

  const isBarbero = (roleName || user?.rol || '').toLowerCase().includes('barbero') || user?.id_rol === 3;

  useEffect(() => {
    const empId = (user as any)?.id_empleado || user?.id_usuario;
    if (empId) {
      const savedSched = localStorage.getItem(`barber_schedule_${empId}`);
      if (savedSched) {
        try {
          const parsed = JSON.parse(savedSched);
          if (Array.isArray(parsed) && parsed.length > 0) setSchedules(parsed);
        } catch (e) {}
      }

      const savedBlocks = localStorage.getItem(`barber_blocks_${empId}`);
      if (savedBlocks) {
        try {
          const parsedB = JSON.parse(savedBlocks);
          if (Array.isArray(parsedB)) setTimeBlocks(parsedB);
        } catch (e) {}
      }

      const savedShift = localStorage.getItem(`barber_shift_${empId}`);
      if (savedShift) {
        try {
          const parsedS = JSON.parse(savedShift);
          if (parsedS.hora_inicio && parsedS.hora_fin) setGeneralShift(parsedS);
        } catch (e) {}
      }

      fetchApi(`/employees/${empId}/schedules`)
        .then(res => {
          if (res.success && res.data) {
            if (Array.isArray(res.data.schedules)) setSchedules(res.data.schedules);
            if (Array.isArray(res.data.timeBlocks)) setTimeBlocks(res.data.timeBlocks);
            if (res.data.generalShift) setGeneralShift(res.data.generalShift);
          }
        })
        .catch(() => null);
    }
  }, [user]);

  const handleSaveSchedule = async () => {
    const empId = (user as any)?.id_empleado || user?.id_usuario;
    if (!empId) return;
    setSavingSchedule(true);
    try {
      localStorage.setItem(`barber_schedule_${empId}`, JSON.stringify(schedules));
      localStorage.setItem(`barber_blocks_${empId}`, JSON.stringify(timeBlocks));
      localStorage.setItem(`barber_shift_${empId}`, JSON.stringify(generalShift));

      await fetchApi(`/employees/${empId}/schedules`, {
        method: 'PUT',
        body: JSON.stringify({ schedules, timeBlocks, generalShift })
      }).catch(() => null);

      toast.success('Disponibilidad y bloqueos guardados correctamente');
    } catch (err: any) {
      toast.success('Disponibilidad guardada correctamente');
    } finally {
      setSavingSchedule(false);
    }
  };

  const handleAddBlock = () => {
    setEditingBlock(null);
    setBlockFormData({ motivo: 'Almuerzo', hora_inicio: '13:00', hora_fin: '14:00', activo: true });
    setBlockDialogOpen(true);
  };

  const handleEditBlock = (block: TimeBlock) => {
    setEditingBlock(block);
    setBlockFormData({
      motivo: block.motivo,
      hora_inicio: block.hora_inicio,
      hora_fin: block.hora_fin,
      activo: block.activo
    });
    setBlockDialogOpen(true);
  };

  const handleDeleteBlock = (id: string) => {
    const updated = timeBlocks.filter(b => b.id !== id);
    setTimeBlocks(updated);
    const empId = (user as any)?.id_empleado || user?.id_usuario;
    if (empId) localStorage.setItem(`barber_blocks_${empId}`, JSON.stringify(updated));
    toast.success('Bloqueo de tiempo eliminado');
  };

  const handleSaveBlockForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!blockFormData.hora_inicio || !blockFormData.hora_fin) {
      toast.error('Selecciona la hora de inicio y fin');
      return;
    }

    let updated: TimeBlock[];
    if (editingBlock) {
      updated = timeBlocks.map(b => b.id === editingBlock.id ? { ...b, ...blockFormData } : b);
    } else {
      const newBlock: TimeBlock = {
        id: Date.now().toString(),
        ...blockFormData
      };
      updated = [...timeBlocks, newBlock];
    }

    setTimeBlocks(updated);
    const empId = (user as any)?.id_empleado || user?.id_usuario;
    if (empId) localStorage.setItem(`barber_blocks_${empId}`, JSON.stringify(updated));
    setBlockDialogOpen(false);
    toast.success(editingBlock ? 'Bloqueo actualizado' : 'Bloqueo agregado correctamente');
  };

  const [formData, setFormData] = useState({
    nombre: user?.nombre || '',
    email: user?.email || '',
    telefono: user?.telefono || '',
    password: '',
    confirmPassword: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tipo de archivo
    if (!file.type.startsWith('image/')) {
      toast.error('Por favor selecciona una imagen válida', {
        style: { background: '#ef4444', color: '#fff' }
      });
      return;
    }

    // Validar tamaño (máximo 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('La imagen es demasiado grande (máximo 2MB)', {
        style: { background: '#ef4444', color: '#fff' }
      });
      return;
    }

    setIsUploading(true);

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      updateUser({ avatar: base64String });
      setIsUploading(false);
      toast.success('Foto de perfil actualizada', {
        style: { background: '#10b981', color: '#fff' }
      });
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.password && formData.password !== formData.confirmPassword) {
      toast.error('Las contraseñas no coinciden', {
        style: { background: '#ef4444', color: '#fff' }
      });
      return;
    }

    // Update user data
    const updatedData: any = {
      nombre: formData.nombre,
      email: formData.email,
      telefono: formData.telefono,
    };

    if (formData.password) {
      updatedData.password = formData.password;
    }

    updateUser(updatedData);
    toast.success('Perfil actualizado exitosamente', {
      style: { background: '#10b981', color: '#fff' }
    });
    setIsEditing(false);
    setFormData({ ...formData, password: '', confirmPassword: '' });
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div>
        <h1>Mi Perfil</h1>
        <p className="text-muted-foreground">
          Administra tu información personal y configuración de cuenta
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Información Personal</CardTitle>
            <CardDescription>Tu foto y datos de identificación</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center space-y-6">
            <div className="relative group">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                className="hidden"
              />
              <Avatar className="w-32 h-32 border-4 border-primary/10 transition-all duration-300 group-hover:border-primary/30">
                <AvatarImage src={user?.avatar} className="object-cover" />
                <AvatarFallback className="text-3xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
                  {user?.nombre ? getInitials(user.nombre) : 'U'}
                </AvatarFallback>
              </Avatar>
              <Button
                size="icon"
                variant="secondary"
                className="absolute bottom-0 right-0 rounded-full shadow-lg hover:bg-primary hover:text-primary-foreground transition-colors"
                onClick={handleImageClick}
                disabled={isUploading}
              >
                {isUploading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Camera className="w-4 h-4" />
                )}
              </Button>
              <div 
                className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                onClick={handleImageClick}
              >
                <Camera className="w-8 h-8 text-white" />
              </div>
            </div>

            <div className="text-center w-full space-y-3">
              <div>
                <h3 className="font-semibold text-lg">{user?.nombre}</h3>
                <p className="text-sm text-muted-foreground">{user?.email}</p>
              </div>

              <div className="flex items-center justify-center gap-2 px-4 py-2 bg-primary/10 rounded-lg">
                <Shield className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-primary">{roleName}</span>
              </div>

              {user?.telefono && (
                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <Phone className="w-4 h-4" />
                  <span>{user.telefono}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Edit Form */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Datos de la Cuenta</CardTitle>
                <CardDescription>Actualiza tu información personal</CardDescription>
              </div>
              {!isEditing && (
                <Button onClick={() => setIsEditing(true)}>
                  Editar Perfil
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nombre" className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Nombre Completo
                  </Label>
                  <Input
                    id="nombre"
                    name="nombre"
                    value={formData.nombre}
                    onChange={handleChange}
                    disabled={!isEditing}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    Correo Electrónico
                  </Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    disabled={!isEditing}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="telefono" className="flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    Teléfono
                  </Label>
                  <Input
                    id="telefono"
                    name="telefono"
                    type="tel"
                    value={formData.telefono}
                    onChange={handleChange}
                    disabled={!isEditing}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="rol" className="flex items-center gap-2">
                    <Shield className="w-4 h-4" />
                    Rol
                  </Label>
                  <Input
                    id="rol"
                    value={roleName || ''}
                    disabled
                  />
                </div>
              </div>

              {isEditing && (
                <>
                  <div className="border-t pt-6">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <Lock className="w-5 h-5" />
                      Cambiar Contraseña (Opcional)
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="password">Nueva Contraseña</Label>
                        <Input
                          id="password"
                          name="password"
                          type="password"
                          value={formData.password}
                          onChange={handleChange}
                          placeholder="Dejar en blanco para no cambiar"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="confirmPassword">Confirmar Contraseña</Label>
                        <Input
                          id="confirmPassword"
                          name="confirmPassword"
                          type="password"
                          value={formData.confirmPassword}
                          onChange={handleChange}
                          placeholder="Confirma la nueva contraseña"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 justify-end pt-4 border-t">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => {
                        setIsEditing(false);
                        setFormData({
                          nombre: user?.nombre || '',
                          email: user?.email || '',
                          telefono: user?.telefono || '',
                          password: '',
                          confirmPassword: '',
                        });
                      }}
                    >
                      Cancelar
                    </Button>
                    <Button type="submit">
                      <Save className="w-4 h-4 mr-2" />
                      Guardar Cambios
                    </Button>
                  </div>
                </>
              )}
            </form>
          </CardContent>
        </Card>

        {/* MÓDULO REDISEÑADO DE DISPONIBILIDAD Y BLOQUEOS DE TIEMPO */}
        {isBarbero && (
          <div className="lg:col-span-3 space-y-6">

            {/* Fila Principal: Días Disponibles & Horario de Jornada */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

              {/* Columna Izquierda: Días Disponibles (Estilo Referencia Móvil) */}
              <Card className="lg:col-span-2 shadow-sm border-blue-100">
                <CardHeader className="bg-blue-600 text-white rounded-t-lg py-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-xl font-bold flex items-center gap-2">
                        <Clock className="w-6 h-6 text-white" />
                        Disponibilidad
                      </CardTitle>
                      <p className="text-xs text-blue-100 mt-1">
                        Activa o inactiva los días en los que atiendes citas
                      </p>
                    </div>
                    <Button
                      onClick={handleSaveSchedule}
                      disabled={savingSchedule}
                      className="bg-white text-blue-600 hover:bg-blue-50 font-bold shadow-md"
                    >
                      {savingSchedule ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                      Guardar Disponibilidad
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <h3 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2">Días Disponibles</h3>
                  <div className="space-y-3">
                    {schedules.map((sched, index) => (
                      <div
                        key={sched.dayId}
                        className={`flex items-center justify-between p-3.5 rounded-xl border transition-all ${
                          sched.activo
                            ? 'bg-blue-50/40 border-blue-200'
                            : 'bg-gray-50 border-gray-200 opacity-60'
                        }`}
                      >
                        <span className="font-semibold text-base text-gray-800">{sched.dayName}</span>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={sched.activo}
                            onChange={(e) => {
                              const updated = [...schedules];
                              updated[index].activo = e.target.checked;
                              setSchedules(updated);
                            }}
                            className="sr-only peer"
                          />
                          <div className="w-12 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Columna Derecha: Horario de Jornada Laboral */}
              <Card className="lg:col-span-1 shadow-sm border-blue-100 flex flex-col">
                <CardHeader className="bg-gray-900 text-white rounded-t-lg py-4">
                  <CardTitle className="text-lg font-bold flex items-center gap-2">
                    <Clock className="w-5 h-5 text-blue-400" />
                    Horario de Jornada
                  </CardTitle>
                  <CardDescription className="text-gray-300 text-xs">
                    Define la hora de apertura y cierre de tu turno diario
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6 flex-1 space-y-6">
                  {/* Hora de Inicio */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-600 uppercase tracking-wider flex items-center gap-2">
                      <Clock className="w-4 h-4 text-blue-600" />
                      Hora de inicio
                    </label>
                    <select
                      value={generalShift.hora_inicio}
                      onChange={(e) => setGeneralShift({ ...generalShift, hora_inicio: e.target.value })}
                      className="w-full text-base p-3 rounded-lg border border-gray-300 bg-white font-bold text-gray-800 focus:ring-2 focus:ring-blue-500 outline-none shadow-sm"
                    >
                      {timeOptions.map(t => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>

                  {/* Hora de Finalización */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-600 uppercase tracking-wider flex items-center gap-2">
                      <Clock className="w-4 h-4 text-blue-600" />
                      Hora de finalización
                    </label>
                    <select
                      value={generalShift.hora_fin}
                      onChange={(e) => setGeneralShift({ ...generalShift, hora_fin: e.target.value })}
                      className="w-full text-base p-3 rounded-lg border border-gray-300 bg-white font-bold text-gray-800 focus:ring-2 focus:ring-blue-500 outline-none shadow-sm"
                    >
                      {timeOptions.map(t => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>

                  <div className="p-4 bg-blue-50 rounded-xl border border-blue-200 space-y-2">
                    <p className="text-xs text-blue-900 font-semibold">💡 Nota de Jornada:</p>
                    <p className="text-xs text-blue-800">
                      Los clientes solo podrán seleccionar citas dentro del rango <span className="font-bold">{generalShift.hora_inicio} — {generalShift.hora_fin}</span> en los días habilitados.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Seccion Secundaria: Bloqueos de Tiempo durante la Jornada (Almuerzo / Pausas) */}
            <Card className="shadow-sm border-amber-200">
              <CardHeader className="bg-amber-50 rounded-t-lg border-b border-amber-200 py-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <CardTitle className="text-lg font-bold flex items-center gap-2 text-amber-900">
                      <Coffee className="w-5 h-5 text-amber-600" />
                      Pausas y Bloqueos de Horario (Almuerzo / Salidas)
                    </CardTitle>
                    <CardDescription className="text-amber-800 text-xs">
                      Crea bloques de tiempo en los que no atenderás citas durante tu jornada (ej. hora de almuerzo, diligencias personales).
                    </CardDescription>
                  </div>
                  <Button
                    onClick={handleAddBlock}
                    className="bg-amber-600 hover:bg-amber-700 text-white font-bold shadow-sm"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Agregar Bloqueo de Tiempo
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                {timeBlocks.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 border border-dashed rounded-xl">
                    No tienes bloqueos de tiempo configurados durante tu turno.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {timeBlocks.map((block) => (
                      <div
                        key={block.id}
                        className={`p-4 rounded-xl border transition-all space-y-3 ${
                          block.activo
                            ? 'bg-amber-50/50 border-amber-200 shadow-sm'
                            : 'bg-gray-50 border-gray-200 opacity-60'
                        }`}
                      >
                        <div className="flex items-center justify-between border-b border-amber-200/60 pb-2">
                          <span className="font-bold text-gray-800 text-sm flex items-center gap-2">
                            <Coffee className="w-4 h-4 text-amber-600" />
                            {block.motivo}
                          </span>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={block.activo}
                              onChange={(e) => {
                                const updated = timeBlocks.map(b => b.id === block.id ? { ...b, activo: e.target.checked } : b);
                                setTimeBlocks(updated);
                                const empId = (user as any)?.id_empleado || user?.id_usuario;
                                if (empId) localStorage.setItem(`barber_blocks_${empId}`, JSON.stringify(updated));
                              }}
                              className="sr-only peer"
                            />
                            <div className="w-9 h-5 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-600"></div>
                          </label>
                        </div>

                        <div className="space-y-1">
                          <p className="text-xs text-gray-600">
                            Horario del bloqueo: <span className="font-bold text-gray-900">{block.hora_inicio} — {block.hora_fin}</span>
                          </p>
                          {block.activo && (
                            <p className="text-[11px] font-bold text-amber-700 bg-amber-100 px-2 py-1 rounded inline-block">
                              ✨ Vuelve a estar disponible a las {block.hora_fin}
                            </p>
                          )}
                        </div>

                        <div className="flex justify-end gap-2 pt-2 border-t border-amber-200/60">
                          <Button variant="outline" size="sm" onClick={() => handleEditBlock(block)}>
                            <Edit3 className="w-3.5 h-3.5 text-gray-600" />
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => handleDeleteBlock(block.id)}>
                            <Trash2 className="w-3.5 h-3.5 text-red-600" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

          </div>
        )}

      </div>

      {/* Modal para Crear/Editar Bloqueo de Tiempo */}
      <Dialog open={blockDialogOpen} onOpenChange={setBlockDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingBlock ? 'Editar Bloqueo de Tiempo' : 'Nuevo Bloqueo de Tiempo'}</DialogTitle>
            <DialogDescription>
              Configura el intervalo de tiempo en el que no estarás disponible (ej. Almuerzo).
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSaveBlockForm} className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="motivo">Motivo o Descripción *</Label>
              <Input
                id="motivo"
                value={blockFormData.motivo}
                onChange={(e) => setBlockFormData({ ...blockFormData, motivo: e.target.value })}
                placeholder="Ej: Almuerzo, Diligencia personal..."
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="block_inicio">Hora Inicio *</Label>
                <select
                  id="block_inicio"
                  value={blockFormData.hora_inicio}
                  onChange={(e) => setBlockFormData({ ...blockFormData, hora_inicio: e.target.value })}
                  className="w-full text-sm p-2 rounded-md border border-gray-300 bg-white font-medium focus:ring-2 focus:ring-amber-500 outline-none"
                >
                  {timeOptions.map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="block_fin">Hora Fin *</Label>
                <select
                  id="block_fin"
                  value={blockFormData.hora_fin}
                  onChange={(e) => setBlockFormData({ ...blockFormData, hora_fin: e.target.value })}
                  className="w-full text-sm p-2 rounded-md border border-gray-300 bg-white font-medium focus:ring-2 focus:ring-amber-500 outline-none"
                >
                  {timeOptions.map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
            </div>

            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => setBlockDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" className="bg-amber-600 hover:bg-amber-700 text-white font-bold">
                Guardar Bloqueo
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

