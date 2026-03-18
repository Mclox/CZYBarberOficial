import { useState, useMemo, useEffect } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../ui/alert-dialog';
import { Badge } from '../ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Users, Search, Eye, UserCheck, Trash2, Mail, Phone, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import { fetchApi } from '../../lib/api'; // API Connection

// Función para obtener la fecha de hoy en formato YYYY-MM-DD local
const getTodayDate = () => {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().split('T')[0];
};

export function ClientesTemporalesView() {
  // Estados para BD real
  const [clientesTemporales, setClientesTemporales] = useState<any[]>([]);
  const [citas, setCitas] = useState<any[]>([]); // Para mostrar historial
  const [loading, setLoading] = useState(true);

  // Estados UI
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [convertDialogOpen, setConvertDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [viewingCliente, setViewingCliente] = useState<any | null>(null);
  const [convertingCliente, setConvertingCliente] = useState<any | null>(null);
  const [clienteToDelete, setClienteToDelete] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const [convertFormData, setConvertFormData] = useState({
    password: '',
    confirmPassword: ''
  });

  // --- 1. LEER DATOS (GET) ---
  const fetchData = async () => {
    setLoading(true);
    try {
      // Necesitamos clientes y citas para los contadores y el historial
      const [resClients, resCitas] = await Promise.all([
        fetchApi('/clients'),
        fetchApi('/appointments')
      ]);

      if (resClients.success) {
        // Un cliente temporal es el que NO tiene id_usuario
        const temporales = resClients.data.filter((c: any) => c.id_usuario === null);
        setClientesTemporales(temporales);
      }

      if (resCitas.success) {
        setCitas(resCitas.data);
      }
    } catch (error: any) {
      toast.error('Error al cargar datos desde la base de datos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredClientesTemporales = useMemo(() => {
    if (!searchTerm.trim()) return clientesTemporales;
    const lowerSearch = searchTerm.toLowerCase();

    return clientesTemporales.filter(cliente => {
      const idCliente = cliente.id_cliente?.toString() || '';
      const nombre = (cliente.nombre_final || '').toLowerCase();
      const email = (cliente.email_final || '').toLowerCase();
      const tel = (cliente.telefono_final || '').toLowerCase();

      return nombre.includes(lowerSearch) ||
        idCliente.includes(lowerSearch) ||
        email.includes(lowerSearch) ||
        tel.includes(lowerSearch);
    });
  }, [clientesTemporales, searchTerm]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleViewDetails = (cliente: any) => {
    setViewingCliente(cliente);
    setDetailsDialogOpen(true);
  };

  const handleConvertToUser = (cliente: any) => {
    if (!cliente.email_final) {
      toast.error('El cliente debe tener un correo electrónico para poder registrarlo');
      return;
    }
    setConvertingCliente(cliente);
    setConvertFormData({ password: '', confirmPassword: '' });
    setConvertDialogOpen(true);
  };

  // --- 2. CONVERTIR A USUARIO (POST + PUT) ---
  const confirmConvert = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!convertingCliente) return;

    if (convertFormData.password.length < 6) {
      toast.error('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    if (convertFormData.password !== convertFormData.confirmPassword) {
      toast.error('Las contraseñas no coinciden');
      return;
    }

    try {
      // PASO A: Crear el Usuario en la tabla Usuarios (Rol 3 = Cliente)
      const userPayload = {
        nombre: convertingCliente.nombre_final,
        tipo_documento: 'CC',
        documento: 'CLI-' + Date.now(), // Temp
        email: convertingCliente.email_final,
        telefono: convertingCliente.telefono_final || '',
        id_rol: 3,
        password: convertFormData.password
      };
      const resUser = await fetchApi('/users', {
        method: 'POST',
        body: JSON.stringify(userPayload)
      });

      if (resUser.success) {
        const newUserId = resUser.id_usuario || resUser.data?.id_usuario;

        // PASO B: Actualizar el Cliente existente para amarrarlo al nuevo Usuario
        await fetchApi(`/clients/${convertingCliente.id_cliente}`, {
          method: 'PUT',
          body: JSON.stringify({
            id_usuario: newUserId,
            // Como tu BD prioriza los datos de Usuario si id_usuario existe,
            // no necesitamos borrar los datos de invitado por ahora.
            nombre: convertingCliente.nombre_final,
            email: convertingCliente.email_final,
            telefono: convertingCliente.telefono_final,
            estado: 'Activo'
          })
        });

        toast.success('Cliente convertido a usuario registrado exitosamente');
        setConvertDialogOpen(false);
        fetchData(); // El cliente desaparecerá de esta vista (porque ya no es temporal)
      }
    } catch (e: any) {
      toast.error(e.message || 'Error al convertir cliente');
    }
  };

  const handleDelete = (id: number) => {
    setClienteToDelete(id);
    setDeleteDialogOpen(true);
  };

  // --- 3. ELIMINAR (DELETE) ---
  const confirmDelete = async () => {
    if (clienteToDelete) {
      // Verificar si tiene citas activas
      const citasPendientes = getCitasPendientes(clienteToDelete);
      if (citasPendientes > 0) {
        toast.error('No se puede eliminar: el cliente tiene citas activas');
        setDeleteDialogOpen(false);
        return;
      }

      try {
        await fetchApi(`/clients/${clienteToDelete}`, { method: 'DELETE' });
        toast.success('Cliente temporal eliminado');
        fetchData();
      } catch (e: any) {
        toast.error('No se puede eliminar. Probablemente tenga historial de citas o ventas canceladas/completadas.');
      }
    }
    setDeleteDialogOpen(false);
    setClienteToDelete(null);
  };

  // Funciones de ayuda para contar citas (cruzando con el state 'citas')
  const getCitasCount = (idCliente: number) => {
    return citas.filter(c => c.id_cliente === idCliente).length;
  };

  const getCitasPendientes = (idCliente: number) => {
    return citas.filter(c =>
      c.id_cliente === idCliente && c.estado === 'pendiente'
    ).length;
  };

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-blue-800">
            <Users className="w-6 h-6 text-blue-600" />
            Pre-Registros (Invitados)
          </h1>
          <p className="text-muted-foreground">Gestiona clientes temporales agendados por la web o mostrador</p>
        </div>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total de Invitados</p>
                <p className="text-2xl font-bold">{clientesTemporales.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <CardTitle>Lista de Clientes Temporales</CardTitle>
            <div className="w-full md:w-96">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Buscar invitados..."
                  value={searchTerm}
                  onChange={handleSearch}
                  className="pl-10"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-10">Cargando base de datos...</div>
          ) : filteredClientesTemporales.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No hay clientes temporales registrados</div>
          ) : (
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Contacto</TableHead>
                    <TableHead>Fecha Registro</TableHead>
                    <TableHead>Citas</TableHead>
                    <TableHead className="text-center">Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredClientesTemporales.map((cliente) => (
                    <TableRow key={cliente.id_cliente}>
                      <TableCell className="font-medium">#{cliente.id_cliente}</TableCell>
                      <TableCell className="font-medium">{cliente.nombre_final}</TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1 text-xs">
                          <div className="flex items-center gap-2">
                            <Mail className="w-3.5 h-3.5 text-muted-foreground" />
                            {cliente.email_final || '-'}
                          </div>
                          <div className="flex items-center gap-2">
                            <Phone className="w-3.5 h-3.5 text-muted-foreground" />
                            {cliente.telefono_final || '-'}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{cliente.fecha_registro ? new Date(cliente.fecha_registro).toLocaleDateString('es-ES') : getTodayDate()}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Badge variant="outline">{getCitasCount(cliente.id_cliente)} total</Badge>
                          {getCitasPendientes(cliente.id_cliente) > 0 && (
                            <Badge className="bg-yellow-600">{getCitasPendientes(cliente.id_cliente)} activas</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge className="bg-yellow-600 text-white hover:bg-yellow-700">Invitado / Temp</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" size="sm" onClick={() => handleViewDetails(cliente)}>
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleConvertToUser(cliente)}
                            className="bg-green-50 hover:bg-green-100 text-green-700"
                            title="Convertir a Usuario Registrado"
                          >
                            <UserCheck className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-red-500 hover:bg-red-50"
                            onClick={() => handleDelete(cliente.id_cliente)}
                            disabled={getCitasPendientes(cliente.id_cliente) > 0}
                            title="Eliminar (No disponible si tiene citas activas)"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog de detalles */}
      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalles del Cliente Temporal</DialogTitle>
            <DialogDescription>
              Información completa del pre-registro
            </DialogDescription>
          </DialogHeader>
          {viewingCliente && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nombre Completo</Label>
                  <div className="p-3 bg-muted rounded-md font-medium">{viewingCliente.nombre_final}</div>
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <div className="p-3 bg-muted rounded-md flex items-center gap-2">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    {viewingCliente.email_final || 'N/A'}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Teléfono</Label>
                  <div className="p-3 bg-muted rounded-md flex items-center gap-2">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    {viewingCliente.telefono_final || 'N/A'}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Fecha de Registro</Label>
                  <div className="p-3 bg-muted rounded-md">
                    {viewingCliente.fecha_registro ? new Date(viewingCliente.fecha_registro).toLocaleDateString('es-ES') : getTodayDate()}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Estado</Label>
                  <div className="p-3 bg-muted rounded-md">
                    <Badge className="bg-yellow-600">Invitado / Temp</Badge>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Citas</Label>
                  <div className="p-3 bg-muted rounded-md flex gap-2">
                    <span className="font-medium">{getCitasCount(viewingCliente.id_cliente)} totales</span>
                    {getCitasPendientes(viewingCliente.id_cliente) > 0 && (
                      <span className="text-muted-foreground">({getCitasPendientes(viewingCliente.id_cliente)} activas)</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Mostrar historial de citas */}
              {getCitasCount(viewingCliente.id_cliente) > 0 && (
                <div className="space-y-2 pt-4 border-t">
                  <Label>Historial de Citas</Label>
                  <div className="border rounded-md max-h-48 overflow-y-auto">
                    <Table>
                      <TableHeader className="bg-muted/50 sticky top-0">
                        <TableRow>
                          <TableHead className="text-xs">Servicio</TableHead>
                          <TableHead className="text-xs">Fecha</TableHead>
                          <TableHead className="text-xs">Estado</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {citas
                          .filter(c => c.id_cliente === viewingCliente.id_cliente)
                          .map((cita) => (
                            <TableRow key={cita.id_cita}>
                              <TableCell className="text-xs font-medium">{cita.servicio_nombre}</TableCell>
                              <TableCell className="text-xs">{cita.fecha?.split('T')[0]} a las {cita.hora_inicio?.substring(0, 5)}</TableCell>
                              <TableCell>
                                <Badge variant="outline" className="text-[10px]">{cita.estado}</Badge>
                              </TableCell>
                            </TableRow>
                          ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setDetailsDialogOpen(false)}>Cerrar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog para convertir a usuario */}
      <Dialog open={convertDialogOpen} onOpenChange={setConvertDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Convertir a Usuario Registrado</DialogTitle>
            <DialogDescription>
              Crearemos una cuenta de acceso para este cliente.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={confirmConvert}>
            <div className="space-y-4 py-4">
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg space-y-1">
                <p className="text-sm font-bold text-blue-900">{convertingCliente?.nombre_final}</p>
                <p className="text-xs text-blue-800">{convertingCliente?.email_final}</p>
              </div>
              <div className="space-y-2">
                <Label>Crear Contraseña Inicial <span className="text-red-500">*</span></Label>
                <Input
                  type="password"
                  value={convertFormData.password}
                  onChange={(e) => setConvertFormData({ ...convertFormData, password: e.target.value })}
                  required
                  placeholder="Min. 6 caracteres"
                />
                <p className="text-xs text-muted-foreground">El cliente podrá cambiarla más adelante.</p>
              </div>
              <div className="space-y-2">
                <Label>Confirmar Contraseña <span className="text-red-500">*</span></Label>
                <Input
                  type="password"
                  value={convertFormData.confirmPassword}
                  onChange={(e) => setConvertFormData({ ...convertFormData, confirmPassword: e.target.value })}
                  required
                  placeholder="Repite la contraseña"
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setConvertDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" className="bg-green-600 hover:bg-green-700 text-white">
                <UserCheck className="w-4 h-4 mr-2" />
                Crear Usuario
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}