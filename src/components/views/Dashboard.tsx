import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { 
  Package, 
  ShoppingCart, 
  Receipt, 
  Users, 
  TrendingUp, 
  AlertCircle,
  Calendar,
  DollarSign
} from 'lucide-react';
import { mockProductos, mockVentas, mockClientes, mockCitas, mockCompras } from '../../lib/mockData';
import { formatCOP } from '../../lib/format';

export function Dashboard() {
  // Calculate stats
  const totalProductos = mockProductos.length;
  const totalStock = mockProductos.reduce((sum, p) => sum + p.stock, 0);
  const totalVentas = mockVentas.reduce((sum, v) => sum + v.total, 0);
  const totalClientes = mockClientes.length;
  const citasPendientes = mockCitas.filter(c => c.estado === 'pendiente' || c.estado === 'confirmada').length;
  const totalCompras = mockCompras.reduce((sum, c) => sum + c.total, 0);
  const productosLowStock = mockProductos.filter(p => p.stock < 10).length;

  const stats = [
    {
      title: 'Total Ventas',
      value: formatCOP(totalVentas),
      icon: Receipt,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      title: 'Total Compras',
      value: formatCOP(totalCompras),
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
      value: formatCOP(totalVentas - totalCompras),
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
          Resumen general del sistema de gestión
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
                        <div className={`px-2 py-1 rounded text-xs ${
                          cita.estado === 'confirmada' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
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
                    <p>{formatCOP(venta.total)}</p>
                    <p className={`text-xs ${
                      venta.estado === 'pagada' ? 'text-green-600' : 
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
