import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Pagination } from '../../components/common/Pagination';
import { SearchBar } from '../../components/common/SearchBar';
import { toast } from 'sonner';
import { fetchApi } from '../../lib/api';
import { 
  Bell, 
  Calendar, 
  DollarSign, 
  Package, 
  Users, 
  Shield, 
  Clock,
  AlertCircle
} from 'lucide-react';

export function NotificacionesView() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const limit = 10;

  const fetchNotifications = async (page = 1) => {
    setLoading(true);
    try {
      const response = await fetchApi(`/notifications/all?page=${page}&limit=${limit}`);
      if (response.success) {
        setNotifications(response.data);
        if (response.pagination) {
          setTotalPages(response.pagination.totalPages);
          setTotalItems(response.pagination.total);
          setCurrentPage(response.pagination.page);
        }
      }
    } catch (error: any) {
      toast.error(error.message || 'Error al cargar el historial de notificaciones');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications(currentPage);

    // Escuchar el evento personalizado de nueva notificación para refrescar la lista si estamos en la página 1
    const handleNewNotification = () => {
      fetchNotifications(1);
    };

    window.addEventListener('notifications:new', handleNewNotification);
    return () => {
      window.removeEventListener('notifications:new', handleNewNotification);
    };
  }, [currentPage]);

  const handleMarkAsRead = async (id: number) => {
    try {
      const response = await fetchApi(`/notifications/${id}/read`, { method: 'PUT' });
      if (response.success) {
        setNotifications(prev => 
          prev.map(n => n.id === id ? { ...n, leido: true } : n)
        );
        toast.success('Notificación marcada como leída');
        // Despachar evento para actualizar el layout
        window.dispatchEvent(new CustomEvent('notifications:updated'));
      }
    } catch (error: any) {
      toast.error(error.message || 'Error al actualizar la notificación');
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const response = await fetchApi('/notifications/read-all', { method: 'PUT' });
      if (response.success) {
        setNotifications(prev => prev.map(n => ({ ...n, leido: true })));
        toast.success('Todas las notificaciones marcadas como leídas');
        window.dispatchEvent(new CustomEvent('notifications:updated'));
      }
    } catch (error: any) {
      toast.error(error.message || 'Error al marcar todas las notificaciones');
    }
  };

  const getModuleConfig = (modulo: string) => {
    const mod = (modulo || '').toLowerCase();
    switch (mod) {
      case 'ventas':
        return { icon: DollarSign, color: 'text-green-600', bgColor: 'bg-green-50 border-green-200' };
      case 'citas':
        return { icon: Calendar, color: 'text-blue-600', bgColor: 'bg-blue-50 border-blue-200' };
      case 'productos':
      case 'entradas de productos':
        return { icon: Package, color: 'text-amber-600', bgColor: 'bg-amber-50 border-amber-200' };
      case 'clientes':
        return { icon: Users, color: 'text-indigo-600', bgColor: 'bg-indigo-50 border-indigo-200' };
      case 'empleados':
        return { icon: Users, color: 'text-purple-600', bgColor: 'bg-purple-50 border-purple-200' };
      case 'usuarios':
        return { icon: Users, color: 'text-cyan-600', bgColor: 'bg-cyan-50 border-cyan-200' };
      case 'roles':
        return { icon: Shield, color: 'text-rose-600', bgColor: 'bg-rose-50 border-rose-200' };
      case 'devoluciones':
        return { icon: AlertCircle, color: 'text-red-600', bgColor: 'bg-red-50 border-red-200' };
      default:
        return { icon: Bell, color: 'text-gray-600', bgColor: 'bg-gray-50 border-gray-200' };
    }
  };

  const getActionBadge = (accion: string) => {
    const act = (accion || '').toLowerCase();
    switch (act) {
      case 'creacion':
        return <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white font-normal text-[10px]">CREACIÓN</Badge>;
      case 'edicion':
        return <Badge className="bg-blue-500 hover:bg-blue-600 text-white font-normal text-[10px]">EDICIÓN</Badge>;
      case 'eliminacion':
        return <Badge className="bg-red-500 hover:bg-red-700 text-white font-normal text-[10px]">ELIMINACIÓN</Badge>;
      case 'cambio_estado':
        return <Badge className="bg-purple-500 hover:bg-purple-600 text-white font-normal text-[10px]">ESTADO</Badge>;
      default:
        return <Badge variant="secondary" className="font-normal text-[10px]">{accion.toUpperCase()}</Badge>;
    }
  };

  // Filtrar localmente por búsqueda si es necesario
  const filteredNotifications = useMemo(() => {
    if (!searchTerm.trim()) return notifications;
    const lowerSearch = searchTerm.toLowerCase();
    return notifications.filter(n => 
      (n.modulo || '').toLowerCase().includes(lowerSearch) ||
      (n.accion || '').toLowerCase().includes(lowerSearch) ||
      (n.descripcion || '').toLowerCase().includes(lowerSearch) ||
      (n.usuario_nombre || '').toLowerCase().includes(lowerSearch)
    );
  }, [notifications, searchTerm]);

  return (
    <div className="space-y-6 max-w-6xl mx-auto p-4 md:p-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
            <Bell className="w-8 h-8 text-blue-600" />
            Historial de Notificaciones
          </h1>
          <p className="text-gray-500 mt-1">
            Revisa el registro cronológico completo de las acciones y eventos relevantes del sistema.
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={() => fetchNotifications(currentPage)} 
            variant="outline" 
            size="sm"
            className="border-gray-300 hover:bg-gray-100"
          >
            Refrescar
          </Button>
          <Button 
            onClick={handleMarkAllAsRead} 
            disabled={notifications.every(n => n.leido)}
            variant="default"
            size="sm"
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            Marcar todo como leído
          </Button>
        </div>
      </div>

      {/* Main card */}
      <Card className="shadow-md border border-gray-200">
        <CardHeader className="pb-3 border-b border-gray-100 bg-gray-50/50">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-lg font-semibold text-gray-900">Actividades Registradas</CardTitle>
              <CardDescription>Visualiza las últimas operaciones realizadas en los módulos del sistema.</CardDescription>
            </div>
            <div className="w-full md:w-80">
              <SearchBar 
                value={searchTerm} 
                onChange={setSearchTerm} 
                placeholder="Buscar por módulo, acción, descripción..." 
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <p className="mt-4 text-gray-500 font-medium">Cargando notificaciones...</p>
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                <Bell className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">No hay notificaciones</h3>
              <p className="text-gray-500 max-w-sm mt-1">
                {searchTerm ? 'No se encontraron resultados para tu búsqueda.' : 'Aún no se han registrado eventos relevantes en el sistema.'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredNotifications.map((notif) => {
                const config = getModuleConfig(notif.modulo);
                const Icon = config.icon;
                const formattedDate = notif.fecha_creacion 
                  ? new Date(notif.fecha_creacion).toLocaleString('es-ES', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit'
                    })
                  : 'N/A';

                return (
                  <div 
                    key={notif.id}
                    className={`flex flex-col md:flex-row md:items-center justify-between p-4 rounded-xl border transition-all ${
                      notif.leido 
                        ? 'bg-white border-gray-100' 
                        : 'bg-blue-50/40 border-blue-100/75 shadow-sm hover:bg-blue-50/60'
                    }`}
                  >
                    <div className="flex gap-4 items-start">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 border ${config.bgColor}`}>
                        <Icon className={`w-5 h-5 ${config.color}`} />
                      </div>
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-semibold text-gray-900 text-sm">{notif.modulo}</span>
                          {getActionBadge(notif.accion)}
                          {!notif.leido && (
                            <Badge className="bg-blue-600 hover:bg-blue-600 text-white font-semibold text-[9px] tracking-wide py-0.5 px-1.5">
                              NUEVA
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-700 leading-relaxed">{notif.descripcion}</p>
                        <div className="flex items-center gap-4 text-xs text-gray-400 mt-2">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-gray-400" />
                            {formattedDate}
                          </span>
                          <span className="flex items-center gap-1 font-medium text-gray-500">
                            Realizado por: {notif.usuario_nombre || 'Sistema'}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 mt-4 md:mt-0 self-end md:self-center shrink-0">
                      {!notif.leido && (
                        <Button 
                          onClick={() => handleMarkAsRead(notif.id)} 
                          variant="ghost" 
                          size="sm"
                          className="text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50/50"
                        >
                          Marcar como leída
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}

              <Pagination 
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={totalItems}
                itemsPerPage={limit}
                onPageChange={(page) => fetchNotifications(page)}
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
