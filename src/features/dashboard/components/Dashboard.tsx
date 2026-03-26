import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Badge } from '../../../components/ui/badge';
import {
  Package, ShoppingCart, Receipt, Users, TrendingUp, AlertCircle,
  Calendar, DollarSign, Clock, Scissors
} from 'lucide-react';
import { useAuth } from '../../auth';
import { fetchApi } from '../../../lib/api';
import { toast } from 'sonner';

export function Dashboard() {
  const { user } = useAuth();
  const isCliente = user?.id_rol === 3 || user?.rol === 'Cliente';
  
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const res = await fetchApi('/dashboard');
        if (res.success) setData(res.data);
      } catch (error) {
        toast.error('Error al cargar datos del Dashboard');
      } finally {
        setLoading(false);
      }
    };
    loadDashboard();
  }, []);

  if (loading) {
    return <div className="p-8 text-center text-muted-foreground">Cargando métricas en tiempo real...</div>;
  }

  if (!data) return null;

  // --- VISTA PARA CLIENTES ---
  if (isCliente) {
    return (
      <div className="p-4 md:p-8 space-y-6 animate-in fade-in duration-500">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Bienvenido, {user?.nombre}</h1>
            <p className="text-muted-foreground">Este es tu resumen personal en CzBarber</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-gradient-to-br from-orange-50 to-amber-50 border-orange-200">
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium flex items-center gap-2"><Calendar className="w-4 h-4 text-orange-600" /> Citas Programadas</CardTitle></CardHeader>
            <CardContent><div className="text-3xl font-bold text-orange-700">{data.stats?.citasProgramadas}</div><p className="text-xs text-muted-foreground mt-1">Próximas a realizarse</p></CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium flex items-center gap-2"><Clock className="w-4 h-4 text-blue-600" /> Historial Total</CardTitle></CardHeader>
            <CardContent><div className="text-3xl font-bold text-blue-700">{data.stats?.historialTotal}</div><p className="text-xs text-muted-foreground mt-1">Servicios completados con nosotros</p></CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium flex items-center gap-2"><Scissors className="w-4 h-4 text-green-600" /> Servicios Disponibles</CardTitle></CardHeader>
            <CardContent><div className="text-3xl font-bold text-green-700">{data.stats?.serviciosDisponibles}</div><p className="text-xs text-muted-foreground mt-1">Opciones para tu próximo look</p></CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader><CardTitle>Tus Próximas Citas</CardTitle></CardHeader>
            <CardContent>
              {data.nextCitas?.length > 0 ? (
                <div className="space-y-4">
                  {data.nextCitas.map((cita: any) => (
                    <div key={cita.id_cita} className="flex items-center justify-between p-4 bg-muted/50 rounded-xl border">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center"><Calendar className="w-5 h-5 text-orange-600" /></div>
                        <div><p className="font-bold">{cita.servicio_nombre}</p><p className="text-xs text-muted-foreground">{new Date(cita.fecha).toLocaleDateString('es-ES')} - {cita.hora_inicio?.substring(0,5)}</p></div>
                      </div>
                      <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-200">{cita.estado}</Badge>
                    </div>
                  ))}
                </div>
              ) : <p className="text-center py-6 text-muted-foreground text-sm">No tienes citas programadas</p>}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Servicios Recomendados</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data.recommendedServices?.map((servicio: any) => (
                  <div key={servicio.id_servicio} className="flex items-center justify-between p-4 bg-muted/50 rounded-xl border">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center"><Scissors className="w-5 h-5 text-blue-600" /></div>
                      <div><p className="font-bold">{servicio.nombre}</p><p className="text-xs text-muted-foreground">{servicio.duracion_minutos} min • ${servicio.precio_neto?.toFixed(2)}</p></div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // --- VISTA PARA ADMIN Y BARBEROS ---
  const statsBoxes = [
    { title: 'Total Ventas', value: `$${data.stats?.totalVentas?.toFixed(2)}`, icon: Receipt, color: 'text-green-600', bgColor: 'bg-green-50' },
    { title: 'Inversión Inventario', value: `$${data.stats?.totalCompras?.toFixed(2)}`, icon: ShoppingCart, color: 'text-blue-600', bgColor: 'bg-blue-50' },
    { title: 'Productos Diferentes', value: data.stats?.totalProductos, icon: Package, color: 'text-purple-600', bgColor: 'bg-purple-50' },
    { title: 'Stock Total', value: data.stats?.stockTotal, icon: TrendingUp, color: 'text-orange-600', bgColor: 'bg-orange-50' },
    { title: 'Clientes Registrados', value: data.stats?.totalClientes, icon: Users, color: 'text-indigo-600', bgColor: 'bg-indigo-50' },
    { title: 'Citas Pendientes', value: data.stats?.citasPendientes, icon: Calendar, color: 'text-cyan-600', bgColor: 'bg-cyan-50' },
    { title: 'Stock Crítico', value: data.stats?.stockBajo, icon: AlertCircle, color: 'text-red-600', bgColor: 'bg-red-50' },
    { title: 'Ganancia Estimada', value: `$${data.stats?.gananciaEstimada?.toFixed(2)}`, icon: DollarSign, color: 'text-emerald-600', bgColor: 'bg-emerald-50' },
  ];

  return (
    <div className="p-4 md:p-8 space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-2xl font-bold">Dashboard General</h1>
        <p className="text-muted-foreground">Métricas y resumen en tiempo real</p>
      </div>

      {/* METRICAS SUPERIORES */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statsBoxes.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index} className="hover:shadow-md transition-shadow border-muted/50">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs font-bold uppercase text-muted-foreground">{stat.title}</CardTitle>
                <div className={`p-2 rounded-lg ${stat.bgColor}`}><Icon className={`w-4 h-4 ${stat.color}`} /></div>
              </CardHeader>
              <CardContent><div className="text-2xl font-black">{stat.value}</div></CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* STOCK BAJO */}
        <Card className="shadow-sm">
          <CardHeader><CardTitle className="flex items-center gap-2"><AlertCircle className="w-5 h-5 text-red-500"/> Productos con Stock Bajo</CardTitle></CardHeader>
          <CardContent>
            {data.lowStock?.length > 0 ? (
              <div className="space-y-3">
                {data.lowStock.map((prod: any) => (
                  <div key={prod.id_producto} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border">
                    <div><p className="font-bold text-sm">{prod.nombre}</p><p className="text-xs text-muted-foreground">Cód: {prod.codigo || 'S/N'}</p></div>
                    <div className="text-right"><Badge variant="destructive" className="font-mono">Stock: {prod.stock}</Badge></div>
                  </div>
                ))}
              </div>
            ) : <p className="text-muted-foreground text-center py-4 text-sm">Inventario en niveles óptimos</p>}
          </CardContent>
        </Card>

        {/* PRÓXIMAS CITAS */}
        <Card className="shadow-sm">
          <CardHeader><CardTitle className="flex items-center gap-2"><Calendar className="w-5 h-5 text-blue-500"/> Próximas Citas</CardTitle></CardHeader>
          <CardContent>
            {data.nextCitas?.length > 0 ? (
              <div className="space-y-3">
                {data.nextCitas.map((cita: any) => (
                  <div key={cita.id_cita} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border">
                    <div><p className="font-bold text-sm">{cita.cliente_nombre}</p><p className="text-xs text-muted-foreground">{new Date(cita.fecha).toLocaleDateString('es-ES')} - {cita.hora_inicio?.substring(0,5)}</p></div>
                    <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-200">{cita.estado}</Badge>
                  </div>
                ))}
              </div>
            ) : <p className="text-muted-foreground text-center py-4 text-sm">No hay citas pendientes</p>}
          </CardContent>
        </Card>
      </div>

      {/* VENTAS RECIENTES */}
      <Card className="shadow-sm">
        <CardHeader><CardTitle className="flex items-center gap-2"><Receipt className="w-5 h-5 text-green-500"/> Ventas Recientes</CardTitle></CardHeader>
        <CardContent>
          {data.recentSales?.length > 0 ? (
            <div className="space-y-3">
              {data.recentSales.map((venta: any) => (
                <div key={venta.id_venta} className="flex items-center justify-between p-4 bg-muted/30 rounded-lg border">
                  <div>
                    <p className="font-bold text-sm">{venta.cliente_nombre}</p>
                    <p className="text-xs text-muted-foreground">{new Date(venta.fecha).toLocaleDateString('es-ES')} - {venta.metodo_pago}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-black text-lg text-[#D4AF37]">${venta.total?.toFixed(2)}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : <p className="text-muted-foreground text-center py-4 text-sm">Aún no hay ventas registradas</p>}
        </CardContent>
      </Card>
    </div>
  );
}