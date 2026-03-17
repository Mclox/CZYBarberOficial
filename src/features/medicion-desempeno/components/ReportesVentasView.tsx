import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import { FileSpreadsheet, FileText, Calendar } from 'lucide-react';
import { mockVentas } from '../../../shared/lib/mockData';
import { exportData } from '../../../lib/exportUtils';
import { toast } from 'sonner';

const COLORS = ['#D4AF37', '#C0C0C0', '#4A4A4A', '#8E8E8E', '#B8860B'];

export function ReportesVentasView() {
  const [periodo, setPeriodo] = useState('mensual');

  // Procesar datos para los gráficos
  const ventasPorDia = [
    { name: 'Lun', total: 450 },
    { name: 'Mar', total: 520 },
    { name: 'Mie', total: 380 },
    { name: 'Jue', total: 610 },
    { name: 'Vie', total: 850 },
    { name: 'Sab', total: 1200 },
    { name: 'Dom', total: 950 },
  ];

  const ventasPorCategoria = [
    { name: 'Servicios', value: 7500 },
    { name: 'Productos', value: 2500 },
    { name: 'Membresías', value: 1200 },
  ];

  const serviciosMasVendidos = [
    { name: 'Corte Clásico', cantidad: 45 },
    { name: 'Barba Premium', cantidad: 32 },
    { name: 'Corte + Barba', cantidad: 28 },
    { name: 'Limpieza Facial', cantidad: 15 },
    { name: 'Coloración', cantidad: 8 },
  ];

  const handleExport = (format: 'excel' | 'pdf') => {
    try {
      const columns = [
        { header: 'Fecha', dataKey: 'fecha' },
        { header: 'ID Venta', dataKey: 'id_venta' },
        { header: 'Total', dataKey: 'total' },
        { header: 'Estado', dataKey: 'estado' },
      ];

      const dataToExport = Array.isArray(mockVentas) ? mockVentas : [];

      exportData(
        dataToExport,
        columns,
        `reporte-ventas-${new Date().toISOString().split('T')[0]}`,
        'Reporte de Ventas Detallado',
        format
      );

      toast.success(`Reporte exportado en formato ${format.toUpperCase()}`);
    } catch (error) {
      console.error('Error al exportar:', error);
      toast.error('Error al generar el reporte');
    }
  };

  const dataToRender = Array.isArray(mockVentas) ? mockVentas.slice(0, 5) : [];

  return (
    <div className="p-4 md:p-8 space-y-6 bg-gray-50 min-h-screen">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Reportes de Ventas</h1>
          <p className="text-gray-500">Análisis detallado de ingresos y tendencias</p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Select value={periodo} onValueChange={setPeriodo}>
            <SelectTrigger className="w-[180px] bg-white border-gray-200">
              <Calendar className="w-4 h-4 mr-2 text-amber-600" />
              <SelectValue placeholder="Periodo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="diario">Hoy</SelectItem>
              <SelectItem value="semanal">Esta Semana</SelectItem>
              <SelectItem value="mensual">Este Mes</SelectItem>
              <SelectItem value="anual">Este Año</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline" className="gap-2 border-gray-200 bg-white" onClick={() => handleExport('excel')}>
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            Excel
          </Button>
          <Button variant="outline" className="gap-2 border-gray-200 bg-white" onClick={() => handleExport('pdf')}>
            <FileText className="w-4 h-4 text-red-600" />
            PDF
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Gráfico de Tendencia de Ventas */}
        <Card className="lg:col-span-2 shadow-sm border-gray-200 overflow-hidden">
          <CardHeader className="bg-white border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Tendencia de Ingresos</CardTitle>
                <CardDescription>Ventas realizadas en la última semana</CardDescription>
              </div>
              <div className="p-2 bg-amber-50 rounded-full text-amber-600">
                <TrendingUpIcon className="w-5 h-5" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="h-[350px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={ventasPorDia}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#6B7280', fontSize: 12 }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#6B7280', fontSize: 12 }}
                    tickFormatter={(value) => `$${value}`}
                  />
                  <Tooltip
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    formatter={(value) => [`$${value}`, 'Ingresos']}
                  />
                  <Line
                    type="monotone"
                    dataKey="total"
                    stroke="#D4AF37"
                    strokeWidth={3}
                    dot={{ r: 4, fill: '#D4AF37', strokeWidth: 2, stroke: '#fff' }}
                    activeDot={{ r: 6, fill: '#D4AF37' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Distribución por Categoría */}
        <Card className="shadow-sm border-gray-200">
          <CardHeader className="bg-white border-b border-gray-100">
            <CardTitle>Distribución de Ventas</CardTitle>
            <CardDescription>Por tipo de concepto</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={ventasPorCategoria}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {ventasPorCategoria.map((_entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`$${value}`, 'Total']} />
                  <Legend verticalAlign="bottom" height={36} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-6 space-y-3">
              {ventasPorCategoria.map((cat, i) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }}></div>
                    <span className="text-gray-600">{cat.name}</span>
                  </div>
                  <span className="font-semibold text-gray-900">${cat.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Servicios más vendidos */}
        <Card className="shadow-sm border-gray-200">
          <CardHeader className="bg-white border-b border-gray-100">
            <CardTitle>Top Servicios</CardTitle>
            <CardDescription>Servicios más demandados</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={serviciosMasVendidos} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E5E7EB" />
                  <XAxis type="number" hide />
                  <YAxis
                    dataKey="name"
                    type="category"
                    axisLine={false}
                    tickLine={false}
                    width={100}
                    tick={{ fill: '#6B7280', fontSize: 11 }}
                  />
                  <Tooltip
                    cursor={{ fill: '#f9fafb' }}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Bar dataKey="cantidad" fill="#D4AF37" radius={[0, 4, 4, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Tabla de ventas recientes */}
        <Card className="lg:col-span-2 shadow-sm border-gray-200">
          <CardHeader className="bg-white border-b border-gray-100">
            <div className="flex items-center justify-between">
              <CardTitle>Últimas Transacciones</CardTitle>
              <Button variant="ghost" size="sm" className="text-amber-600 hover:text-amber-700 hover:bg-amber-50">
                Ver todas
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-gray-500 uppercase bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 font-medium">Fecha</th>
                    <th className="px-6 py-3 font-medium">Cliente</th>
                    <th className="px-6 py-3 font-medium">Concepto</th>
                    <th className="px-6 py-3 font-medium text-right">Monto</th>
                    <th className="px-6 py-3 font-medium text-center">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {dataToRender.length > 0 ? dataToRender.map((venta) => (
                    <tr key={venta.id_venta} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 text-gray-600">{venta.fecha}</td>
                      <td className="px-6 py-4 font-medium text-gray-900">Cliente #{venta.id_cliente}</td>
                      <td className="px-6 py-4 text-gray-600">Venta de Productos</td>
                      <td className="px-6 py-4 text-right font-bold text-gray-900">${venta.total.toFixed(2)}</td>
                      <td className="px-6 py-4 text-center">
                        <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${venta.estado === 'pagada' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                          }`}>
                          {venta.estado}
                        </span>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={5} className="px-6 py-4 text-center text-gray-500">No hay transacciones recientes</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function TrendingUpIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
      <polyline points="16 7 22 7 22 13" />
    </svg>
  );
}

