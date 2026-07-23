import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { useAuth } from '../../contexts/AuthContext';
import { mockRoles } from '../../lib/mockData';
import { toast } from 'sonner';
import { Eye, EyeOff } from 'lucide-react';

interface RegisterFormProps {
  onBackToLogin: () => void;
}

export const RegisterForm: React.FC<RegisterFormProps> = ({ onBackToLogin }) => {
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    confirmEmail: '',
    password: '',
    confirmPassword: '',
    telefono: '',
    id_rol: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.email !== formData.confirmEmail) {
      toast.error('Los correos electrónicos no coinciden');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error('Las contraseñas no coinciden');
      return;
    }

    setLoading(true);

    const success = await register({
      nombre: formData.nombre,
      email: formData.email,
      password: formData.password,
      telefono: formData.telefono,
      id_rol: parseInt(formData.id_rol),
      estado: 'activo',
    });

    if (success) {
      toast.success('Registro exitoso. Por favor inicia sesión.');
      onBackToLogin();
    } else {
      toast.error('El correo ya está registrado');
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center p-4">
      {/* Background Image with Overlay - Same as Landing */}
      <div 
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1667539916671-b9e7039ccee5?w=1600')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/70 to-black"></div>
      </div>

      {/* Register Card */}
      <Card className="w-full max-w-md relative z-10 bg-white/95 backdrop-blur-sm border-[#D4AF37]/20 max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <CardTitle>Crear Cuenta</CardTitle>
          <CardDescription>Completa el formulario para registrarte</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nombre">Nombre Completo</Label>
              <Input
                id="nombre"
                type="text"
                placeholder="Juan Pérez"
                value={formData.nombre}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Correo Electrónico</Label>
              <Input
                id="email"
                type="email"
                placeholder="usuario@ejemplo.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                autoComplete="new-password"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmEmail">Confirmar Correo Electrónico</Label>
              <Input
                id="confirmEmail"
                type="email"
                placeholder="usuario@ejemplo.com"
                value={formData.confirmEmail}
                onChange={(e) => setFormData({ ...formData, confirmEmail: e.target.value })}
                required
                autoComplete="new-password"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="telefono">Teléfono</Label>
              <Input
                id="telefono"
                type="tel"
                placeholder="555-1234"
                value={formData.telefono}
                onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="rol">Rol</Label>
              <Select value={formData.id_rol} onValueChange={(value) => setFormData({ ...formData, id_rol: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un rol" />
                </SelectTrigger>
                <SelectContent>
                  {mockRoles.map((rol) => (
                    <SelectItem key={rol.id_rol} value={rol.id_rol.toString()}>
                      {rol.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  className="pr-10"
                  autoComplete="new-password"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7 p-0 hover:bg-amber-50"
                >
                  {showPassword ? <EyeOff className="w-4 h-4 text-gray-500" /> : <Eye className="w-4 h-4 text-gray-500" />}
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar Contraseña</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  required
                  className="pr-10"
                  autoComplete="new-password"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7 p-0 hover:bg-amber-50"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4 text-gray-500" /> : <Eye className="w-4 h-4 text-gray-500" />}
                </Button>
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Registrando...' : 'Registrarse'}
            </Button>
            <div className="text-center">
              <span className="text-muted-foreground">¿Ya tienes cuenta? </span>
              <Button
                type="button"
                variant="link"
                className="px-0"
                onClick={onBackToLogin}
              >
                Inicia sesión
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
