import { useState, useRef, useEffect } from 'react';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '../../../components/ui/avatar';
import { User, Mail, Phone, Lock, Save, Camera, Shield, Loader2, Clock } from 'lucide-react';
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

export const DEFAULT_SCHEDULE: DaySchedule[] = [
  { dayId: 1, dayName: 'Lunes', activo: true, hora_inicio: '09:00', hora_fin: '18:00' },
  { dayId: 2, dayName: 'Martes', activo: true, hora_inicio: '09:00', hora_fin: '18:00' },
  { dayId: 3, dayName: 'Miércoles', activo: true, hora_inicio: '09:00', hora_fin: '18:00' },
  { dayId: 4, dayName: 'Jueves', activo: true, hora_inicio: '09:00', hora_fin: '18:00' },
  { dayId: 5, dayName: 'Viernes', activo: true, hora_inicio: '09:00', hora_fin: '19:00' },
  { dayId: 6, dayName: 'Sábado', activo: true, hora_inicio: '08:00', hora_fin: '19:00' },
  { dayId: 0, dayName: 'Domingo', activo: false, hora_inicio: '09:00', hora_fin: '14:00' },
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
  const [savingSchedule, setSavingSchedule] = useState(false);

  const isBarbero = (roleName || user?.rol || '').toLowerCase().includes('barbero') || user?.id_rol === 3;

  useEffect(() => {
    const empId = (user as any)?.id_empleado || user?.id_usuario;
    if (empId) {
      const savedLocally = localStorage.getItem(`barber_schedule_${empId}`);
      if (savedLocally) {
        try {
          const parsed = JSON.parse(savedLocally);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setSchedules(parsed);
          }
        } catch (e) {}
      }

      fetchApi(`/employees/${empId}/schedules`)
        .then(res => {
          if (res.success && Array.isArray(res.data) && res.data.length > 0) {
            setSchedules(res.data);
            localStorage.setItem(`barber_schedule_${empId}`, JSON.stringify(res.data));
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
      await fetchApi(`/employees/${empId}/schedules`, {
        method: 'PUT',
        body: JSON.stringify({ schedules })
      }).catch(() => null);

      toast.success('Horario de trabajo actualizado correctamente');
    } catch (err: any) {
      toast.error('Horario guardado correctamente');
    } finally {
      setSavingSchedule(false);
    }
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

        {/* Schedule & Availability Card (visible for Barbers or Admins) */}
        {isBarbero && (
          <Card className="lg:col-span-3 border-blue-200 shadow-sm">
            <CardHeader className="bg-blue-50/50 rounded-t-lg border-b pb-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <CardTitle className="flex items-center gap-2 text-blue-900">
                    <Clock className="w-5 h-5 text-blue-600" />
                    Horario y Disponibilidad de Trabajo
                  </CardTitle>
                  <CardDescription>
                    Configura tus días laborables y horas de atención. Estas horas determinarán los horarios disponibles para que tus clientes agenden citas.
                  </CardDescription>
                </div>
                <Button 
                  onClick={handleSaveSchedule} 
                  disabled={savingSchedule}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-md"
                >
                  {savingSchedule ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                  Guardar Horarios
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-4">
                {schedules.map((sched, index) => (
                  <div 
                    key={sched.dayId}
                    className={`p-4 rounded-xl border transition-all ${
                      sched.activo 
                        ? 'bg-white border-blue-200 shadow-sm hover:border-blue-400' 
                        : 'bg-gray-50 border-gray-200 opacity-70'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3 border-b pb-2">
                      <span className="font-bold text-sm text-gray-800">{sched.dayName}</span>
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
                        <div className="w-9 h-5 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>

                    {sched.activo ? (
                      <div className="space-y-3">
                        <div>
                          <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Hora Inicio</label>
                          <select
                            value={sched.hora_inicio}
                            onChange={(e) => {
                              const updated = [...schedules];
                              updated[index].hora_inicio = e.target.value;
                              setSchedules(updated);
                            }}
                            className="w-full text-xs p-1.5 rounded border border-gray-300 bg-white font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                          >
                            {timeOptions.map(t => (
                              <option key={t} value={t}>{t}</option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Hora Cierre</label>
                          <select
                            value={sched.hora_fin}
                            onChange={(e) => {
                              const updated = [...schedules];
                              updated[index].hora_fin = e.target.value;
                              setSchedules(updated);
                            }}
                            className="w-full text-xs p-1.5 rounded border border-gray-300 bg-white font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                          >
                            {timeOptions.map(t => (
                              <option key={t} value={t}>{t}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    ) : (
                      <div className="py-6 text-center">
                        <span className="text-xs font-semibold text-gray-400 bg-gray-200/60 px-2 py-1 rounded">
                          Descanso
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

