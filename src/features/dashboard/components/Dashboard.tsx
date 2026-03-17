import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import {
  Package,
  ShoppingCart,
  Receipt,
  Users,
  TrendingUp,
  AlertCircle,
  Calendar,
  DollarSign,
  Clock,
  Scissors
} from 'lucide-react';
import { mockProductos, mockVentas, mockClientes, mockCitas, mockCompras, mockServicios } from '../../../shared/lib/mockData';
import { useAuth } from '../../auth';
import { Button } from '../../../components/ui/button';

export function Dashboard() {
  const { user } = useAuth();
  const isCliente = user?.id_rol === 3;

  // Calculate stats
  const totalProductos = mockProductos.length;
  const totalStock = mockProductos.reduce((sum, p) => sum + p.stock, 0);
  const totalVentas = mockVentas.reduce((sum, v) => sum + v.total, 0);
  const totalClientes = mockClientes.length;
  const citasPendientes = mockCitas.filter(c => c.estado === 'pendiente' || c.estado === 'confirmada').length;
  const totalCompras = mockCompras.reduce((sum, c) => sum + c.total, 0);
  const productosLowStock = mockProductos.filter(p => p.stock < 10).length;

  if (isCliente) {
    const misCitas = mockCitas.filter(c => c.id_cliente === user?.id_usuario);
    const proximasCitas = misCitas.filter(c => c.estado === 'pendiente' || c.estado === 'confirmada');

    return (
      <div className="p-4 md:p-8 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1>Bienvenido, {user?.nombre}</h1>
            <p className="text-muted-foreground">
              Este es tu resumen personal en CzBarber
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-900/10 dark:to-amber-900/10 border-orange-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Calendar className="w-4 h-4 text-orange-600" />
                Citas Programadas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{proximasCitas.length}</div>
              <p className="text-xs text-muted-foreground mt-1">Citas pendientes o confirmadas</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/10 dark:to-indigo-900/10 border-blue-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-600" />
                Historial Total
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{misCitas.length}</div>
              <p className="text-xs text-muted-foreground mt-1">Servicios realizados con nosotros</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/10 dark:to-emerald-900/10 border-green-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Scissors className="w-4 h-4 text-green-600" />
                Servicios Disponibles
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{mockServicios.length}</div>
              <p className="text-xs text-muted-foreground mt-1">Opciones para tu próximo look</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Tus Próximas Citas</CardTitle>
            </CardHeader>
            <CardContent>
              {proximasCitas.length > 0 ? (
                <div className="space-y-4">
                  {proximasCitas.map(cita => {
                    const servicio = mockServicios.find(s => s.id_servicio === cita.id_servicio);
                    return (
                      <div key={cita.id_cita} className="flex items-center justify-between p-4 bg-muted/50 rounded-xl border border-border">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                            <Calendar className="w-6 h-6 text-orange-600" />
                          </div>
                          <div>
                            <p className="font-semibold">{servicio?.nombre}</p>
                            <p className="text-sm text-muted-foreground">{cita.fecha} a las {cita.hora}</p>
                          </div>
                        </div>
                        <div className={`px-3 py-1 rounded-full text-xs font-medium ${cita.estado === 'confirmada' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                          }`}>
                          {cita.estado.charAt(0).toUpperCase() + cita.estado.slice(1)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8 space-y-4">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-muted">
                    <Calendar className="w-6 h-6 text-muted-foreground" />
                  </div>
                  <div className="space-y-1">
                    <p className="font-medium">No tienes citas programadas</p>
                    <p className="text-sm text-muted-foreground">¡Reserva tu espacio hoy mismo!</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Servicios Recomendados</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockServicios.slice(0, 3).map(servicio => (
                  <div key={servicio.id_servicio} className="flex items-center justify-between p-4 bg-muted/50 rounded-xl border border-border">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center overflow-hidden">
                        {servicio.imagen ? (
                          <img src={servicio.imagen} alt={servicio.nombre} className="w-full h-full object-cover" />
                        ) : (
                          <Scissors className="w-6 h-6 text-blue-600" />
                        )}
                      </div>
                      <div>
                        <p className="font-semibold">{servicio.nombre}</p>
                        <p className="text-sm text-muted-foreground">{servicio.duracion} min • ${servicio.precio.toFixed(2)}</p>
                      </div>
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

  const stats = [
    {
      title: 'Total Ventas',
      value: `$${totalVentas.toFixed(2)}`,
      icon: Receipt,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      title: 'Total Compras',
      value: `$${totalCompras.toFixed(2)}`,
      icon: ShoppingCart,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Productos',
      value: totalProductos,
      icon: Package,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
    {
      title: 'Stock Total',
      value: totalStock,
      icon: TrendingUp,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
    },
    {
      title: 'Clientes',
      value: totalClientes,
      icon: Users,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
    },
    {
      title: 'Citas Pendientes',
      value: citasPendientes,
      icon: Calendar,
      color: 'text-cyan-600',
      bgColor: 'bg-cyan-50',
    },
    {
      title: 'Stock Bajo',
      value: productosLowStock,
      icon: AlertCircle,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
    },
    {
      title: 'Ganancia Estimada',
      value: `$${(totalVentas - totalCompras).toFixed(2)}`,
      icon: DollarSign,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
    },
  ];

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div>
        <h1>Dashboard</h1>
        <p className="text-muted-foreground">
          Resumen general de CzBarber
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index} className="hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm">{stat.title}</CardTitle>
                <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                  <Icon className={`w-4 h-4 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl">{stat.value}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Productos con Stock Bajo</CardTitle>
          </CardHeader>
          <CardContent>
            {productosLowStock > 0 ? (
              <div className="space-y-3">
                {mockProductos
                  .filter(p => p.stock < 10)
                  .slice(0, 5)
                  .map(producto => (
                    <div key={producto.id_producto} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <div>
                        <p>{producto.nombre}</p>
                        <p className="text-sm text-muted-foreground">{producto.codigo}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-red-600">Stock: {producto.stock}</p>
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-4">
                No hay productos con stock bajo
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Próximas Citas</CardTitle>
          </CardHeader>
          <CardContent>
            {citasPendientes > 0 ? (
              <div className="space-y-3">
                {mockCitas
                  .filter(c => c.estado === 'pendiente' || c.estado === 'confirmada')
                  .slice(0, 5)
                  .map(cita => {
                    const cliente = mockClientes.find(cl => cl.id_cliente === cita.id_cliente);
                    return (
                      <div key={cita.id_cita} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                        <div>
                          <p>{cliente?.nombre} {cliente?.apellido}</p>
                          <p className="text-sm text-muted-foreground">{cita.fecha} - {cita.hora}</p>
                        </div>
                        <div className={`px-2 py-1 rounded text-xs ${cita.estado === 'confirmada' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                          }`}>
                          {cita.estado}
                        </div>
                      </div>
                    );
                  })}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-4">
                No hay citas pendientes
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Sales */}
      <Card>
        <CardHeader>
          <CardTitle>Ventas Recientes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {mockVentas.slice(0, 5).map(venta => {
              const cliente = mockClientes.find(c => c.id_cliente === venta.id_cliente);
              return (
                <div key={venta.id_venta} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div>
                    <p>{cliente?.nombre} {cliente?.apellido || ''}</p>
                    <p className="text-sm text-muted-foreground">{venta.fecha}</p>
                  </div>
                  <div className="text-right">
                    <p>${venta.total.toFixed(2)}</p>
                    <p className={`text-xs ${venta.estado === 'pagada' ? 'text-green-600' :
                        venta.estado === 'pendiente' ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                      {venta.estado}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
