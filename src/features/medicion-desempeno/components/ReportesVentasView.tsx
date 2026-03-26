import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { Badge } from '../../../components/ui/badge';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Legend
} from 'recharts';
import { FileSpreadsheet, FileText, Calendar } from 'lucide-react';
import { fetchApi } from '../../../lib/api';
import { exportToExcelXLSX } from '../../../shared/lib/exportUtils';
import { toast } from 'sonner';

const COLORS = ['#2563eb', '#D4AF37', '#4A4A4A', '#8E8E8E', '#1e40af'];

export function ReportesVentasView() {
  const [periodo, setPeriodo] = useState('semanal');
  const [loading, setLoading] = useState(true);
  
  // Estados para los gráficos reales
  const [ventasPorDia, setVentasPorDia] = useState<any[]>([]);
  const [ventasPorCategoria, setVentasPorCategoria] = useState<any[]>([]);
  const [serviciosMasVendidos, setServiciosMasVendidos] = useState<any[]>([]);
  const [ultimasTransacciones, setUltimasTransacciones] = useState<any[]>([]);

  // Efecto que recarga datos cuando cambia el periodo (filtro)
  useEffect(() => {
    const loadReports = async () => {
      setLoading(true);
      try {
        const res = await fetchApi(`/reports/sales?period=${periodo}`);
        if (res.success) {
          setVentasPorDia(res.data.ventasPorDia);
          setVentasPorCategoria(res.data.ventasPorCategoria);
          setServiciosMasVendidos(res.data.serviciosMasVendidos);
          setUltimasTransacciones(res.data.ultimasTransacciones);
        }
      } catch (error) {
        toast.error('Error al cargar los reportes');
      } finally {
        setLoading(false);
      }
    };
    loadReports();
  }, [periodo]);

  const handleExport = () => {
    try {
      const dataToExport = ultimasTransacciones.map(v => ({
        'ID Venta': v.id_venta,
        'Fecha': new Date(v.fecha).toLocaleDateString('es-ES'),
        'Cliente': v.cliente_nombre,
        'Método Pago': v.metodo_pago,
        'Total': `$${v.total.toFixed(2)}`
      }));
      exportToExcelXLSX(dataToExport, `Reporte_Ventas_${periodo}`, 'Ventas');
      toast.success(`Reporte exportado correctamente`);
    } catch (error) {
      toast.error('Error al generar el reporte');
    }
  };

  return (
    <div className="p-4 md:p-8 space-y-6 bg-gray-50 min-h-screen animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Reportes de Ventas</h1>
          <p className="text-gray-500">Análisis detallado de ingresos y tendencias reales</p>
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

          <Button variant="outline" className="gap-2 border-gray-200 bg-white" onClick={handleExport}>
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" /> Excel
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-muted-foreground">Procesando métricas en la Base de Datos...</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* GRÁFICO: TENDENCIA DE INGRESOS */}
          <Card className="lg:col-span-2 shadow-sm border-gray-200 overflow-hidden">
            <CardHeader className="bg-white border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Tendencia de Ingresos</CardTitle>
                  <CardDescription>Ventas realizadas en el periodo: {periodo}</CardDescription>
                </div>
                <div className="p-2 bg-amber-50 rounded-full text-amber-600"><TrendingUpIcon className="w-5 h-5" /></div>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="h-[350px] w-full">
                {ventasPorDia.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={ventasPorDia}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} tickFormatter={(value) => `$${value}`} />
                      <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} formatter={(value) => [`$${value}`, 'Ingresos']} />
                      <Line type="monotone" dataKey="total" stroke="#2563eb" strokeWidth={3} dot={{ r: 4, fill: '#2563eb', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6, fill: '#2563eb' }} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : <div className="flex h-full items-center justify-center text-muted-foreground text-sm">No hay ventas en este periodo</div>}
              </div>
            </CardContent>
          </Card>

          {/* GRÁFICO: DISTRIBUCIÓN POR CATEGORÍA */}
          <Card className="shadow-sm border-gray-200">
            <CardHeader className="bg-white border-b border-gray-100">
              <CardTitle>Distribución de Ventas</CardTitle>
              <CardDescription>Productos vs Servicios</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="h-[250px] w-full">
                {ventasPorCategoria.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={ventasPorCategoria} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                        {ventasPorCategoria.map((_entry, index) => (<Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />))}
                      </Pie>
                      <Tooltip formatter={(value) => [`$${value}`, 'Total']} />
                      <Legend verticalAlign="bottom" height={36} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : <div className="flex h-full items-center justify-center text-muted-foreground text-sm">Sin datos</div>}
              </div>
              <div className="mt-6 space-y-3">
                {ventasPorCategoria.map((cat, i) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }}></div>
                      <span className="text-gray-600">{cat.name}</span>
                    </div>
                    <span className="font-semibold text-gray-900">${cat.value.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* GRÁFICO: SERVICIOS MÁS VENDIDOS */}
          <Card className="shadow-sm border-gray-200">
            <CardHeader className="bg-white border-b border-gray-100">
              <CardTitle>Top Servicios</CardTitle>
              <CardDescription>Los más demandados ({periodo})</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="h-[300px] w-full">
                {serviciosMasVendidos.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={serviciosMasVendidos} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E5E7EB" />
                      <XAxis type="number" hide />
                      <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} width={100} tick={{ fill: '#6B7280', fontSize: 11 }} />
                      <Tooltip cursor={{ fill: '#f9fafb' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                      <Bar dataKey="cantidad" fill="#2563eb" radius={[0, 4, 4, 0]} barSize={20} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : <div className="flex h-full items-center justify-center text-muted-foreground text-sm">Sin ventas registradas</div>}
              </div>
            </CardContent>
          </Card>

          {/* TABLA: ÚLTIMAS TRANSACCIONES */}
          <Card className="lg:col-span-2 shadow-sm border-gray-200">
            <CardHeader className="bg-white border-b border-gray-100">
              <CardTitle>Últimas Transacciones Reales</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-gray-500 uppercase bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 font-medium">Fecha</th>
                      <th className="px-6 py-3 font-medium">Cliente</th>
                      <th className="px-6 py-3 font-medium text-right">Monto</th>
                      <th className="px-6 py-3 font-medium text-center">Método Pago</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {ultimasTransacciones.length > 0 ? ultimasTransacciones.map((venta) => (
                      <tr key={venta.id_venta} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 text-gray-600">{new Date(venta.fecha).toLocaleDateString('es-ES')}</td>
                        <td className="px-6 py-4 font-bold text-gray-900">{venta.cliente_nombre}</td>
                        <td className="px-6 py-4 text-right font-black text-[#D4AF37]">${venta.total.toFixed(2)}</td>
                        <td className="px-6 py-4 text-center">
                          <Badge variant="outline" className="bg-green-50 text-green-700">{venta.metodo_pago}</Badge>
                        </td>
                      </tr>
                    )) : (
                      <tr><td colSpan={4} className="px-6 py-8 text-center text-gray-500">No hay transacciones en este periodo</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

function TrendingUpIcon(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
      <polyline points="16 7 22 7 22 13" />
    </svg>
  );
}