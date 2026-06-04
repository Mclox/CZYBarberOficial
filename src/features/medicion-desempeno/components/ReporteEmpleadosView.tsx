import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../components/ui/card';
import { Input } from '../../../components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/table';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Users, Trophy, Calendar } from 'lucide-react';
import { fetchApi } from '../../../lib/api';
import { toast } from 'sonner';

export function ReporteEmpleadosView() {
  const today = new Date().toISOString().split('T')[0];
  const firstDay = new Date(new Date().setDate(1)).toISOString().split('T')[0];

  const [fechaInicio, setFechaInicio] = useState(firstDay);
  const [fechaFin, setFechaFin] = useState(today);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const res = await fetchApi(`/reports/employees?start=${fechaInicio}&end=${fechaFin}`);
        if (res.success) setData(res.data);
      } catch (error) {
        toast.error('Error al cargar reporte de empleados');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [fechaInicio, fechaFin]);

  return (
    <div className="p-4 md:p-8 space-y-6 bg-gray-50 min-h-screen animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <div className="p-2 bg-blue-50 rounded-xl"><Users className="w-7 h-7 text-blue-600" /></div>
          Reporte de Empleados
        </h1>
        <p className="text-gray-500 mt-1">Barberos más solicitados y comparación de carga de trabajo</p>
      </div>

      <Card className="shadow-sm border-gray-200">
        <CardContent className="pt-6 flex flex-wrap gap-4">
          <div className="space-y-1"><label className="text-xs text-gray-500">Desde</label><Input type="date" value={fechaInicio} onChange={e => setFechaInicio(e.target.value)} /></div>
          <div className="space-y-1"><label className="text-xs text-gray-500">Hasta</label><Input type="date" value={fechaFin} onChange={e => setFechaFin(e.target.value)} /></div>
        </CardContent>
      </Card>

      {loading ? <div className="text-center py-12">Calculando productividad...</div> : data && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card className="bg-gradient-to-br from-amber-50 to-white border-l-4 border-l-[#D4AF37]">
              <CardContent className="pt-6">
                <div className="flex justify-between mb-2"><p className="text-sm font-medium text-gray-500">Barbero del Mes</p><Trophy className="w-4 h-4 text-[#D4AF37]" /></div>
                <p className="text-2xl font-black text-[#D4AF37]">{data.empleados[0]?.nombre || 'N/A'}</p>
                <p className="text-xs text-gray-600 font-medium mt-2">${data.empleados[0]?.ingresos?.toFixed(2)} en ingresos generados</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex justify-between mb-2"><p className="text-sm font-medium text-gray-500">Promedio Citas/Empleado</p><Calendar className="w-4 h-4 text-blue-600" /></div>
                <p className="text-3xl font-black text-gray-900">
                  {data.empleados.length > 0 ? Math.round(data.empleados.reduce((s: number, e: any) => s + e.citasAtendidas, 0) / data.empleados.length) : 0}
                </p>
                <p className="text-xs text-blue-600 font-medium mt-1">En el periodo seleccionado</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader><CardTitle>Carga de Trabajo Diaria (Ventas Globales del Local)</CardTitle></CardHeader>
            <CardContent className="h-[380px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.productividadGlobal}>
                  <defs>
                    <linearGradient id="gradGroup" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#2563eb" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} />
                  <YAxis axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ borderRadius: '10px' }} />
                  <Legend />
                  <Area type="monotone" name="Total Generado por el Equipo" dataKey="totalGrupo" stroke="#2563eb" fill="url(#gradGroup)" strokeWidth={2.5} />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Ranking de Barberos</CardTitle></CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader><TableRow><TableHead className="w-12 text-center">#</TableHead><TableHead>Barbero</TableHead><TableHead className="text-right">Citas Atendidas</TableHead><TableHead className="text-right">Ingresos (Ventas directas)</TableHead></TableRow></TableHeader>
                <TableBody>
                  {data.empleados.map((emp: any, idx: number) => (
                    <TableRow key={emp.id_empleado}>
                      <TableCell className="text-center font-bold">{idx + 1}</TableCell>
                      <TableCell className="font-bold text-gray-900">{emp.nombre}</TableCell>
                      <TableCell className="text-right font-bold text-blue-700">{emp.citasAtendidas}</TableCell>
                      <TableCell className="text-right font-bold text-[#D4AF37]">${emp.ventasGeneradas?.toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}