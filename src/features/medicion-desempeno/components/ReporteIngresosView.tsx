// import { useState } from 'react';
// import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../components/ui/card';
// import { Button } from '../../../components/ui/button';
// import { Input } from '../../../components/ui/input';
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
// import {
//   AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
// } from 'recharts';
// import { DollarSign, TrendingUp, Briefcase, Package, Users, FileSpreadsheet, FileText } from 'lucide-react';
// import { toast } from 'sonner';

// // ===================== MOCK DATA =====================
// const mockResumen = {
//   ingresosTotales: 18750000,
//   ingresosPorServicios: 14200000,
//   ingresosPorProductos: 4550000,
// };

// const mockEvolucionIngresos = [
//   { mes: 'Ene', Servicios: 1800000, Productos: 520000 },
//   { mes: 'Feb', Servicios: 2100000, Productos: 610000 },
//   { mes: 'Mar', Servicios: 2400000, Productos: 780000 },
//   { mes: 'Abr', Servicios: 2650000, Productos: 850000 },
//   { mes: 'May', Servicios: 2200000, Productos: 690000 },
//   { mes: 'Jun', Servicios: 2850000, Productos: 920000 },
//   { mes: 'Jul', Servicios: 3100000, Productos: 1050000 },
//   { mes: 'Ago', Servicios: 2900000, Productos: 980000 },
//   { mes: 'Sep', Servicios: 3200000, Productos: 1100000 },
//   { mes: 'Oct', Servicios: 3400000, Productos: 1200000 },
//   { mes: 'Nov', Servicios: 3600000, Productos: 1350000 },
//   { mes: 'Dic', Servicios: 3800000, Productos: 1500000 },
// ];

// const mockDetalleIngresos = [
//   { id: 1, fecha: '2026-04-13', concepto: 'Corte + Barba — Roberto Sánchez', tipo: 'Servicio', barbero: 'Carlos Ruiz', monto: 35000 },
//   { id: 2, fecha: '2026-04-13', concepto: 'Pomada Strong Hold x2', tipo: 'Producto', barbero: 'Carlos Ruiz', monto: 56000 },
//   { id: 3, fecha: '2026-04-13', concepto: 'Tinte + Corte — María López', tipo: 'Servicio', barbero: 'Miguel Ángel', monto: 65000 },
//   { id: 4, fecha: '2026-04-12', concepto: 'Shampoo Premium x1', tipo: 'Producto', barbero: 'David León', monto: 22000 },
//   { id: 5, fecha: '2026-04-12', concepto: 'Alisado Keratina — Laura Torres', tipo: 'Servicio', barbero: 'José Santos', monto: 80000 },
//   { id: 6, fecha: '2026-04-12', concepto: 'Corte Degradado — Diego Ramírez', tipo: 'Servicio', barbero: 'Miguel Ángel', monto: 30000 },
//   { id: 7, fecha: '2026-04-11', concepto: 'Aceite para Barba x3', tipo: 'Producto', barbero: 'Carlos Ruiz', monto: 105000 },
//   { id: 8, fecha: '2026-04-11', concepto: 'Corte Clásico — Camilo Vargas', tipo: 'Servicio', barbero: 'David León', monto: 25000 },
//   { id: 9, fecha: '2026-04-11', concepto: 'Tinte Fantasía — Valentina Díaz', tipo: 'Servicio', barbero: 'José Santos', monto: 90000 },
//   { id: 10, fecha: '2026-04-10', concepto: 'Gel Ultra Fix x5 + Cera Mate x2', tipo: 'Producto', barbero: 'Miguel Ángel', monto: 125000 },
// ];

// const mockCategorias = ['Todas', 'Servicio', 'Producto'];
// const mockBarberos = ['Todos', 'Carlos Ruiz', 'Miguel Ángel', 'David León', 'José Santos'];

// // ===================== COMPONENT =====================
// export function ReporteIngresosView() {
//   const [fechaInicio, setFechaInicio] = useState('2026-04-01');
//   const [fechaFin, setFechaFin] = useState('2026-04-13');
//   const [categoriaFilter, setCategoriaFilter] = useState('Todas');
//   const [barberoFilter, setBarberoFilter] = useState('Todos');

//   const ingresosFiltrados = mockDetalleIngresos.filter((item) => {
//     const matchCategoria = categoriaFilter === 'Todas' || item.tipo === categoriaFilter;
//     const matchBarbero = barberoFilter === 'Todos' || item.barbero === barberoFilter;
//     const matchFecha = item.fecha >= fechaInicio && item.fecha <= fechaFin;
//     return matchCategoria && matchBarbero && matchFecha;
//   });

//   const handleExportExcel = () => {
//     toast.info('Exportar Excel', { description: 'Función de exportación será conectada al backend.' });
//   };

//   const handleExportPDF = () => {
//     toast.info('Exportar PDF', { description: 'Función de exportación será conectada al backend.' });
//   };

//   return (
//     <div className="p-4 md:p-8 space-y-6 bg-gray-50 min-h-screen animate-in fade-in duration-500">
//       {/* Header */}
//       <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
//         <div>
//           <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
//             <div className="p-2 bg-amber-50 rounded-xl">
//               <DollarSign className="w-7 h-7 text-[#D4AF37]" />
//             </div>
//             Reporte de Ingresos
//           </h1>
//           <p className="text-gray-500 mt-1">Total de ingresos desglosado por Productos y Servicios</p>
//         </div>

//         {/* Export Buttons */}
//         <div className="flex gap-2">
//           <Button variant="outline" className="gap-2 border-gray-200 bg-white" onClick={handleExportExcel}>
//             <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
//             Exportar Excel
//           </Button>
//           <Button variant="outline" className="gap-2 border-gray-200 bg-white" onClick={handleExportPDF}>
//             <FileText className="w-4 h-4 text-red-500" />
//             Exportar PDF
//           </Button>
//         </div>
//       </div>

//       {/* Filtros */}
//       <Card className="shadow-sm border-gray-200">
//         <CardContent className="pt-6">
//           <div className="flex flex-wrap items-end gap-4">
//             <div className="space-y-1">
//               <label className="text-xs text-gray-500">Desde</label>
//               <Input type="date" value={fechaInicio} onChange={(e) => setFechaInicio(e.target.value)} className="w-[170px] bg-white" />
//             </div>
//             <div className="space-y-1">
//               <label className="text-xs text-gray-500">Hasta</label>
//               <Input type="date" value={fechaFin} onChange={(e) => setFechaFin(e.target.value)} className="w-[170px] bg-white" />
//             </div>
//             <div className="space-y-1">
//               <label className="text-xs text-gray-500">Categoría</label>
//               <Select value={categoriaFilter} onValueChange={setCategoriaFilter}>
//                 <SelectTrigger className="w-[180px] bg-white border-gray-200">
//                   <Package className="w-4 h-4 mr-2 text-purple-600" />
//                   <SelectValue placeholder="Categoría" />
//                 </SelectTrigger>
//                 <SelectContent>
//                   {mockCategorias.map((c) => (
//                     <SelectItem key={c} value={c}>{c}</SelectItem>
//                   ))}
//                 </SelectContent>
//               </Select>
//             </div>
//             <div className="space-y-1">
//               <label className="text-xs text-gray-500">Barbero</label>
//               <Select value={barberoFilter} onValueChange={setBarberoFilter}>
//                 <SelectTrigger className="w-[200px] bg-white border-gray-200">
//                   <Users className="w-4 h-4 mr-2 text-blue-600" />
//                   <SelectValue placeholder="Barbero" />
//                 </SelectTrigger>
//                 <SelectContent>
//                   {mockBarberos.map((b) => (
//                     <SelectItem key={b} value={b}>{b}</SelectItem>
//                   ))}
//                 </SelectContent>
//               </Select>
//             </div>
//           </div>
//         </CardContent>
//       </Card>

//       {/* KPI Cards — Gold Accent */}
//       <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
//         <Card className="shadow-md border-gray-200 bg-gradient-to-br from-amber-50 via-white to-amber-50 border-t-4 border-t-[#D4AF37]">
//           <CardContent className="pt-6">
//             <div className="flex items-center justify-between mb-2">
//               <p className="text-sm font-medium text-gray-500">Ingresos Totales</p>
//               <div className="p-2 bg-amber-100 rounded-lg"><DollarSign className="w-5 h-5 text-[#D4AF37]" /></div>
//             </div>
//             <p className="text-3xl font-black text-[#D4AF37]">${mockResumen.ingresosTotales.toLocaleString('es-CO')}</p>
//             <div className="mt-2 flex items-center gap-1">
//               <TrendingUp className="w-3 h-3 text-green-600" />
//               <p className="text-xs text-green-600 font-semibold">+14.2% vs periodo anterior</p>
//             </div>
//           </CardContent>
//         </Card>

//         <Card className="shadow-md border-gray-200 bg-gradient-to-br from-blue-50 via-white to-blue-50 border-t-4 border-t-blue-500">
//           <CardContent className="pt-6">
//             <div className="flex items-center justify-between mb-2">
//               <p className="text-sm font-medium text-gray-500">Ingresos por Servicios</p>
//               <div className="p-2 bg-blue-100 rounded-lg"><Briefcase className="w-5 h-5 text-blue-600" /></div>
//             </div>
//             <p className="text-3xl font-black text-blue-700">${mockResumen.ingresosPorServicios.toLocaleString('es-CO')}</p>
//             <p className="text-xs text-blue-600 font-medium mt-1">{((mockResumen.ingresosPorServicios / mockResumen.ingresosTotales) * 100).toFixed(1)}% del total</p>
//           </CardContent>
//         </Card>

//         <Card className="shadow-md border-gray-200 bg-gradient-to-br from-emerald-50 via-white to-emerald-50 border-t-4 border-t-emerald-500">
//           <CardContent className="pt-6">
//             <div className="flex items-center justify-between mb-2">
//               <p className="text-sm font-medium text-gray-500">Ingresos por Productos</p>
//               <div className="p-2 bg-emerald-100 rounded-lg"><Package className="w-5 h-5 text-emerald-600" /></div>
//             </div>
//             <p className="text-3xl font-black text-emerald-700">${mockResumen.ingresosPorProductos.toLocaleString('es-CO')}</p>
//             <p className="text-xs text-emerald-600 font-medium mt-1">{((mockResumen.ingresosPorProductos / mockResumen.ingresosTotales) * 100).toFixed(1)}% del total</p>
//           </CardContent>
//         </Card>
//       </div>

//       {/* AreaChart — Evolución Mensual */}
//       <Card className="shadow-sm border-gray-200">
//         <CardHeader className="bg-white border-b border-gray-100">
//           <div className="flex items-center justify-between">
//             <div>
//               <CardTitle>Evolución de Ingresos</CardTitle>
//               <CardDescription>Comparativa mensual: Servicios vs Productos</CardDescription>
//             </div>
//             <div className="p-2 bg-amber-50 rounded-full">
//               <TrendingUp className="w-5 h-5 text-[#D4AF37]" />
//             </div>
//           </div>
//         </CardHeader>
//         <CardContent className="pt-6">
//           <div className="h-[400px] w-full">
//             <ResponsiveContainer width="100%" height="100%">
//               <AreaChart data={mockEvolucionIngresos}>
//                 <defs>
//                   <linearGradient id="gradServicios" x1="0" y1="0" x2="0" y2="1">
//                     <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
//                     <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.02} />
//                   </linearGradient>
//                   <linearGradient id="gradProductos" x1="0" y1="0" x2="0" y2="1">
//                     <stop offset="5%" stopColor="#D4AF37" stopOpacity={0.3} />
//                     <stop offset="95%" stopColor="#D4AF37" stopOpacity={0.02} />
//                   </linearGradient>
//                 </defs>
//                 <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
//                 <XAxis dataKey="mes" axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} />
//                 <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} tickFormatter={(value) => `$${(value / 1000000).toFixed(1)}M`} />
//                 <Tooltip
//                   contentStyle={{ borderRadius: '10px', border: 'none', boxShadow: '0 4px 12px rgb(0 0 0 / 0.1)' }}
//                   formatter={(value: number) => [`$${value.toLocaleString('es-CO')}`, '']}
//                 />
//                 <Legend />
//                 <Area type="monotone" dataKey="Servicios" stroke="#3B82F6" strokeWidth={2.5} fill="url(#gradServicios)" dot={{ r: 4, fill: '#3B82F6', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
//                 <Area type="monotone" dataKey="Productos" stroke="#D4AF37" strokeWidth={2.5} fill="url(#gradProductos)" dot={{ r: 4, fill: '#D4AF37', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
//               </AreaChart>
//             </ResponsiveContainer>
//           </div>
//         </CardContent>
//       </Card>

//       {/* Tabla Detalle de Ingresos */}
//       <Card className="shadow-sm border-gray-200">
//         <CardHeader className="bg-white border-b border-gray-100">
//           <CardTitle>Detalle de Ingresos</CardTitle>
//           <CardDescription>Últimas transacciones — {ingresosFiltrados.length} resultado(s)</CardDescription>
//         </CardHeader>
//         <CardContent className="p-0">
//           <div className="overflow-x-auto">
//             <table className="w-full text-sm text-left">
//               <thead className="text-xs text-gray-500 uppercase bg-gray-50">
//                 <tr>
//                   <th className="px-6 py-3 font-medium">Fecha</th>
//                   <th className="px-6 py-3 font-medium">Concepto</th>
//                   <th className="px-6 py-3 font-medium text-center">Tipo</th>
//                   <th className="px-6 py-3 font-medium">Barbero</th>
//                   <th className="px-6 py-3 font-medium text-right">Monto</th>
//                 </tr>
//               </thead>
//               <tbody className="divide-y divide-gray-100">
//                 {ingresosFiltrados.length === 0 ? (
//                   <tr>
//                     <td colSpan={5} className="px-6 py-8 text-center text-gray-500">No hay registros con los filtros aplicados</td>
//                   </tr>
//                 ) : (
//                   ingresosFiltrados.map((item) => (
//                     <tr key={item.id} className="hover:bg-gray-50 transition-colors">
//                       <td className="px-6 py-4 text-gray-600">{new Date(item.fecha + 'T00:00:00').toLocaleDateString('es-CO')}</td>
//                       <td className="px-6 py-4 font-semibold text-gray-900">{item.concepto}</td>
//                       <td className="px-6 py-4 text-center">
//                         <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${
//                           item.tipo === 'Servicio' ? 'bg-blue-50 text-blue-700' : 'bg-amber-50 text-[#D4AF37]'
//                         }`}>
//                           {item.tipo === 'Servicio' ? <Briefcase className="w-3 h-3" /> : <Package className="w-3 h-3" />}
//                           {item.tipo}
//                         </span>
//                       </td>
//                       <td className="px-6 py-4 text-gray-700">{item.barbero}</td>
//                       <td className="px-6 py-4 text-right font-black text-[#D4AF37]">${item.monto.toLocaleString('es-CO')}</td>
//                     </tr>
//                   ))
//                 )}
//               </tbody>
//             </table>
//           </div>
//         </CardContent>
//       </Card>
//     </div>
//   );
// }

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../components/ui/card';
import { Input } from '../../../components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/table';
import { Badge } from '../../../components/ui/badge';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { DollarSign, Briefcase, Package } from 'lucide-react';
import { fetchApi } from '../../../lib/api';
import { toast } from 'sonner';

export function ReporteIngresosView() {
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
        const res = await fetchApi(`/reports/income?start=${fechaInicio}&end=${fechaFin}`);
        if (res.success) setData(res.data);
      } catch (error) {
        toast.error('Error al cargar reporte de ingresos');
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
          <div className="p-2 bg-amber-50 rounded-xl"><DollarSign className="w-7 h-7 text-[#D4AF37]" /></div>
          Reporte de Ingresos
        </h1>
        <p className="text-gray-500 mt-1">Desglose de facturación real</p>
      </div>

      <Card className="shadow-sm border-gray-200">
        <CardContent className="pt-6 flex gap-4">
          <div className="space-y-1"><label className="text-xs text-gray-500">Desde</label><Input type="date" value={fechaInicio} onChange={e => setFechaInicio(e.target.value)} /></div>
          <div className="space-y-1"><label className="text-xs text-gray-500">Hasta</label><Input type="date" value={fechaFin} onChange={e => setFechaFin(e.target.value)} /></div>
        </CardContent>
      </Card>

      {loading ? <div className="text-center py-12">Consolidando facturas...</div> : data && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="border-t-4 border-t-[#D4AF37]">
              <CardContent className="pt-6">
                <p className="text-sm font-medium text-gray-500">Ingresos Totales</p>
                <p className="text-3xl font-black text-[#D4AF37] mt-2">${data.resumen.ingresosTotales?.toFixed(2)}</p>
              </CardContent>
            </Card>
            <Card className="border-t-4 border-t-blue-500">
              <CardContent className="pt-6">
                <p className="text-sm font-medium text-gray-500">Por Servicios</p>
                <p className="text-3xl font-black text-blue-700 mt-2">${data.resumen.ingresosPorServicios?.toFixed(2)}</p>
              </CardContent>
            </Card>
            <Card className="border-t-4 border-t-emerald-500">
              <CardContent className="pt-6">
                <p className="text-sm font-medium text-gray-500">Por Productos</p>
                <p className="text-3xl font-black text-emerald-700 mt-2">${data.resumen.ingresosPorProductos?.toFixed(2)}</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader><CardTitle>Detalle de Facturación</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader><TableRow><TableHead>Fecha</TableHead><TableHead>Concepto</TableHead><TableHead>Tipo</TableHead><TableHead>Vendedor</TableHead><TableHead className="text-right">Monto</TableHead></TableRow></TableHeader>
                <TableBody>
                  {data.detalle.map((d: any) => (
                    <TableRow key={`${d.id}-${d.concepto}`}>
                      <TableCell>{new Date(d.fecha).toLocaleDateString('es-ES')}</TableCell>
                      <TableCell className="font-bold">{d.concepto}</TableCell>
                      <TableCell><Badge variant="outline">{d.tipo}</Badge></TableCell>
                      <TableCell>{d.barbero}</TableCell>
                      <TableCell className="text-right font-black text-[#D4AF37]">${d.monto?.toFixed(2)}</TableCell>
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