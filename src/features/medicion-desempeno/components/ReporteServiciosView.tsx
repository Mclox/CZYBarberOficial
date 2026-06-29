// import { useState } from 'react';
// import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../components/ui/card';
// import { Badge } from '../../../components/ui/badge';
// import { Input } from '../../../components/ui/input';
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
// import {
//   Table,
//   TableBody,
//   TableCell,
//   TableHead,
//   TableHeader,
//   TableRow,
// } from '../../../components/ui/table';
// import {
//   BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
// } from 'recharts';
// import { Scissors, Trophy, Star, Users, TrendingUp } from 'lucide-react';

// // ===================== MOCK DATA =====================
// const mockResumen = {
//   servicioEstrella: 'Corte Clásico',
//   servicioEstrellaCant: 245,
//   totalServicios: 687,
// };

// const mockTopServicios = [
//   { name: 'Corte Clásico', cantidad: 245, ingresos: 6125000 },
//   { name: 'Corte + Barba', cantidad: 168, ingresos: 5880000 },
//   { name: 'Corte Degradado', cantidad: 102, ingresos: 3060000 },
//   { name: 'Barba Clásica', cantidad: 95, ingresos: 1425000 },
//   { name: 'Tinte + Corte', cantidad: 77, ingresos: 5005000 },
// ];

// const mockDetalleServicios = [
//   { id: 1, servicio: 'Corte Clásico', veces: 245, ingresos: 6125000, precioPromedio: 25000, barberoTop: 'Carlos Ruiz', tendencia: '+12%' },
//   { id: 2, servicio: 'Corte + Barba', veces: 168, ingresos: 5880000, precioPromedio: 35000, barberoTop: 'Miguel Ángel', tendencia: '+8%' },
//   { id: 3, servicio: 'Corte Degradado', veces: 102, ingresos: 3060000, precioPromedio: 30000, barberoTop: 'David León', tendencia: '+15%' },
//   { id: 4, servicio: 'Barba Clásica', veces: 95, ingresos: 1425000, precioPromedio: 15000, barberoTop: 'José Santos', tendencia: '-3%' },
//   { id: 5, servicio: 'Tinte + Corte', veces: 77, ingresos: 5005000, precioPromedio: 65000, barberoTop: 'Miguel Ángel', tendencia: '+20%' },
//   { id: 6, servicio: 'Alisado Keratina', veces: 42, ingresos: 3360000, precioPromedio: 80000, barberoTop: 'Carlos Ruiz', tendencia: '+5%' },
//   { id: 7, servicio: 'Diseño de Cejas', veces: 35, ingresos: 420000, precioPromedio: 12000, barberoTop: 'David León', tendencia: '+2%' },
//   { id: 8, servicio: 'Tinte Fantasía', veces: 22, ingresos: 1980000, precioPromedio: 90000, barberoTop: 'José Santos', tendencia: '+25%' },
//   { id: 9, servicio: 'Tratamiento Capilar', veces: 18, ingresos: 900000, precioPromedio: 50000, barberoTop: 'Miguel Ángel', tendencia: '-1%' },
//   { id: 10, servicio: 'Corte Infantil', veces: 15, ingresos: 225000, precioPromedio: 15000, barberoTop: 'Carlos Ruiz', tendencia: '0%' },
// ];

// const mockBarberos = ['Todos', 'Carlos Ruiz', 'Miguel Ángel', 'David León', 'José Santos'];

// const COLORS = ['#D4AF37', '#2563eb', '#8B5CF6', '#10B981', '#F59E0B'];

// // ===================== COMPONENT =====================
// export function ReporteServiciosView() {
//   const [fechaInicio, setFechaInicio] = useState('2026-03-01');
//   const [fechaFin, setFechaFin] = useState('2026-04-13');
//   const [barberoFilter, setBarberoFilter] = useState('Todos');

//   const serviciosFiltrados = mockDetalleServicios.filter((s) =>
//     barberoFilter === 'Todos' || s.barberoTop === barberoFilter
//   );

//   return (
//     <div className="p-4 md:p-8 space-y-6 bg-gray-50 min-h-screen animate-in fade-in duration-500">
//       {/* Header */}
//       <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
//         <div>
//           <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
//             <div className="p-2 bg-purple-50 rounded-xl">
//               <Scissors className="w-7 h-7 text-purple-600" />
//             </div>
//             Reporte de Servicios
//           </h1>
//           <p className="text-gray-500 mt-1">Servicios más solicitados para priorizar recursos de la barbería</p>
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

//       {/* KPI Cards */}
//       <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
//         <Card className="shadow-sm border-gray-200 bg-white">
//           <CardContent className="pt-6">
//             <div className="flex items-center justify-between mb-2">
//               <p className="text-sm font-medium text-gray-500">Servicio Estrella</p>
//               <div className="p-2 bg-amber-50 rounded-lg"><Trophy className="w-4 h-4 text-[#D4AF37]" /></div>
//             </div>
//             <p className="text-2xl font-black text-[#D4AF37]">{mockResumen.servicioEstrella}</p>
//             <div className="mt-2 flex items-center gap-1">
//               <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
//               <p className="text-xs text-gray-500 font-medium">{mockResumen.servicioEstrellaCant} veces solicitado</p>
//             </div>
//           </CardContent>
//         </Card>

//         <Card className="shadow-sm border-gray-200 bg-white">
//           <CardContent className="pt-6">
//             <div className="flex items-center justify-between mb-2">
//               <p className="text-sm font-medium text-gray-500">Total Servicios Realizados</p>
//               <div className="p-2 bg-blue-50 rounded-lg"><Scissors className="w-4 h-4 text-blue-600" /></div>
//             </div>
//             <p className="text-3xl font-black text-gray-900">{mockResumen.totalServicios.toLocaleString('es-CO')}</p>
//             <p className="text-xs text-blue-600 font-medium mt-1">En el periodo seleccionado</p>
//           </CardContent>
//         </Card>

//         <Card className="shadow-sm border-gray-200 bg-white">
//           <CardContent className="pt-6">
//             <div className="flex items-center justify-between mb-2">
//               <p className="text-sm font-medium text-gray-500">Tendencia General</p>
//               <div className="p-2 bg-green-50 rounded-lg"><TrendingUp className="w-4 h-4 text-green-600" /></div>
//             </div>
//             <p className="text-3xl font-black text-green-700">+10.4%</p>
//             <p className="text-xs text-green-600 font-medium mt-1">Crecimiento vs periodo anterior</p>
//           </CardContent>
//         </Card>
//       </div>

//       {/* Gráfico de Barras Horizontal — Top 5 */}
//       <Card className="shadow-sm border-gray-200">
//         <CardHeader className="bg-white border-b border-gray-100">
//           <CardTitle>Top 5 Servicios Más Solicitados</CardTitle>
//           <CardDescription>Ranking basado en la cantidad de veces que fueron realizados</CardDescription>
//         </CardHeader>
//         <CardContent className="pt-6">
//           <div className="h-[350px] w-full">
//             <ResponsiveContainer width="100%" height="100%">
//               <BarChart data={mockTopServicios} layout="vertical" barSize={28}>
//                 <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E5E7EB" />
//                 <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} />
//                 <YAxis
//                   dataKey="name"
//                   type="category"
//                   axisLine={false}
//                   tickLine={false}
//                   width={130}
//                   tick={{ fill: '#374151', fontSize: 13, fontWeight: 600 }}
//                 />
//                 <Tooltip
//                   cursor={{ fill: '#f9fafb' }}
//                   contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
//                   formatter={(value: number, _name: string, props: any) => [
//                     `${value} veces — $${props.payload.ingresos.toLocaleString('es-CO')}`,
//                     'Detalle',
//                   ]}
//                 />
//                 <Bar dataKey="cantidad" name="Veces Solicitado" radius={[0, 6, 6, 0]}>
//                   {mockTopServicios.map((_entry, index) => (
//                     <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
//                   ))}
//                 </Bar>
//               </BarChart>
//             </ResponsiveContainer>
//           </div>
//         </CardContent>
//       </Card>

//       {/* Tabla Ranking Detallado */}
//       <Card className="shadow-sm border-gray-200">
//         <CardHeader className="bg-white border-b border-gray-100">
//           <CardTitle>Ranking Detallado de Servicios</CardTitle>
//           <CardDescription>Ordenados por cantidad de veces solicitados — {serviciosFiltrados.length} resultado(s)</CardDescription>
//         </CardHeader>
//         <CardContent className="p-0">
//           <div className="rounded-md overflow-x-auto">
//             <Table>
//               <TableHeader>
//                 <TableRow>
//                   <TableHead className="w-12 text-center">#</TableHead>
//                   <TableHead>Servicio</TableHead>
//                   <TableHead className="text-right">Veces</TableHead>
//                   <TableHead className="text-right">Ingresos</TableHead>
//                   <TableHead className="text-right">Precio Promedio</TableHead>
//                   <TableHead>Barbero Top</TableHead>
//                   <TableHead className="text-center">Tendencia</TableHead>
//                 </TableRow>
//               </TableHeader>
//               <TableBody>
//                 {serviciosFiltrados.map((s, idx) => (
//                   <TableRow key={s.id} className="hover:bg-gray-50 transition-colors">
//                     <TableCell className="text-center">
//                       {idx < 3 ? (
//                         <div className={`w-7 h-7 rounded-full flex items-center justify-center mx-auto text-xs font-bold text-white ${
//                           idx === 0 ? 'bg-[#D4AF37]' : idx === 1 ? 'bg-gray-400' : 'bg-amber-700'
//                         }`}>
//                           {idx + 1}
//                         </div>
//                       ) : (
//                         <span className="text-gray-400 font-medium">{idx + 1}</span>
//                       )}
//                     </TableCell>
//                     <TableCell className="font-semibold text-gray-900">{s.servicio}</TableCell>
//                     <TableCell className="text-right font-bold text-blue-700">{s.veces}</TableCell>
//                     <TableCell className="text-right font-bold text-[#D4AF37]">${s.ingresos.toLocaleString('es-CO')}</TableCell>
//                     <TableCell className="text-right text-gray-600">${s.precioPromedio.toLocaleString('es-CO')}</TableCell>
//                     <TableCell className="text-gray-700">{s.barberoTop}</TableCell>
//                     <TableCell className="text-center">
//                       <Badge
//                         variant="outline"
//                         className={
//                           s.tendencia.startsWith('+') ? 'bg-green-50 text-green-700' :
//                           s.tendencia.startsWith('-') ? 'bg-red-50 text-red-700' :
//                           'bg-gray-50 text-gray-600'
//                         }
//                       >
//                         {s.tendencia}
//                       </Badge>
//                     </TableCell>
//                   </TableRow>
//                 ))}
//               </TableBody>
//             </Table>
//           </div>
//         </CardContent>
//       </Card>
//     </div>
//   );
// }


import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Input } from '../../../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/table';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Scissors, Trophy, Star, Users } from 'lucide-react';
import { fetchApi } from '../../../lib/api';
import { toast } from 'sonner';
import { formatCOP } from '../../../lib/format';
import { Pagination } from '../../../components/common/Pagination';
import { Label } from '../../../components/ui/label';


const COLORS = ['#D4AF37', '#2563eb', '#8B5CF6', '#10B981', '#F59E0B'];

export function ReporteServiciosView() {
  const today = new Date().toISOString().split('T')[0];
  const firstDay = new Date(new Date().setDate(1)).toISOString().split('T')[0];

  const [fechaInicio, setFechaInicio] = useState(firstDay);
  const [fechaFin, setFechaFin] = useState(today);
  const [barberoFilter, setBarberoFilter] = useState('Todos');
  
  const [barberos, setBarberos] = useState<any[]>([]);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);


  useEffect(() => {
    fetchApi('/employees').then(res => { if(res.success) setBarberos(res.data); });
  }, []);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const barberoQ = barberoFilter === 'Todos' ? '' : barberoFilter;
        const res = await fetchApi(`/reports/services?start=${fechaInicio}&end=${fechaFin}&barbero=${barberoQ}`);
        if (res.success) setData(res.data);
      } catch (error) {
        toast.error('Error al cargar reporte de servicios');
      } finally {
        setLoading(false);
      }
    };
    setCurrentPage(1);
    loadData();
  }, [fechaInicio, fechaFin, barberoFilter]);

  const totalPages = Math.ceil((data?.ranking?.length || 0) / itemsPerPage);
  const paginatedRanking = (data?.ranking || []).slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );


  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
          <div className="p-2 bg-purple-50 rounded-xl"><Scissors className="w-6 h-6 text-purple-600" /></div>
          Servicios
        </h1>
        <p className="text-gray-500 mt-1">Servicios más solicitados para priorizar recursos de la barbería</p>
      </div>

      <Card className="shadow-sm border-gray-200">
        <CardContent className="pt-6 flex flex-wrap gap-4">
          <div className="space-y-1"><label className="text-xs text-gray-500">Desde</label><Input type="date" value={fechaInicio} onChange={e => setFechaInicio(e.target.value)} /></div>
          <div className="space-y-1"><label className="text-xs text-gray-500">Hasta</label><Input type="date" value={fechaFin} onChange={e => setFechaFin(e.target.value)} /></div>
          <div className="space-y-1">
            <label className="text-xs text-gray-500">Barbero</label>
            <Select value={barberoFilter} onValueChange={setBarberoFilter}>
              <SelectTrigger className="w-[200px]"><Users className="w-4 h-4 mr-2 text-blue-600" /><SelectValue placeholder="Barbero" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Todos">Todos</SelectItem>
                {barberos.map(b => <SelectItem key={b.id_usuario} value={b.id_usuario.toString()}>{b.nombre}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {loading ? <div className="text-center py-12">Consolidando servicios...</div> : data && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card><CardContent className="pt-6"><div className="flex justify-between mb-2"><p className="text-sm font-medium text-gray-500">Servicio Estrella</p><Trophy className="w-4 h-4 text-[#D4AF37]" /></div><p className="text-2xl font-black text-[#D4AF37]">{data.resumen.servicioEstrella}</p><div className="mt-2 flex items-center gap-1"><Star className="w-3 h-3 text-amber-400 fill-amber-400" /><p className="text-xs text-gray-500 font-medium">{data.resumen.servicioEstrellaCant} veces solicitado</p></div></CardContent></Card>
            <Card><CardContent className="pt-6"><div className="flex justify-between mb-2"><p className="text-sm font-medium text-gray-500">Total Servicios Realizados</p><Scissors className="w-4 h-4 text-blue-600" /></div><p className="text-3xl font-black text-gray-900">{data.resumen.totalServicios}</p><p className="text-xs text-blue-600 font-medium mt-1">En el periodo seleccionado</p></CardContent></Card>
          </div>

          <Card>
            <CardHeader><CardTitle>Top 5 Servicios Más Solicitados</CardTitle></CardHeader>
            <CardContent className="h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.ranking.slice(0, 5)} layout="vertical" barSize={28}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" hide />
                  <YAxis dataKey="servicio" type="category" axisLine={false} tickLine={false} width={130} tick={{ fill: '#374151', fontSize: 13, fontWeight: 600 }} />
                  <Tooltip formatter={(value: number, _name: string, props: any) => [`${value} veces — ${formatCOP(props.payload.ingresos)}`, 'Detalle']} />
                  <Bar dataKey="veces" radius={[0, 6, 6, 0]}>
                    {data.ranking.slice(0, 5).map((_entry: any, index: number) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Ranking Detallado de Servicios</CardTitle></CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader><TableRow><TableHead className="w-12 text-center">#</TableHead><TableHead>Servicio</TableHead><TableHead className="text-right">Veces</TableHead><TableHead className="text-right">Ingresos Totales</TableHead><TableHead className="text-right">Precio Promedio</TableHead></TableRow></TableHeader>
                <TableBody>
                  {paginatedRanking.map((s: any, idx: number) => (
                    <TableRow key={s.id} className="hover:bg-gray-50">
                      <TableCell className="text-center font-bold text-gray-400">{(currentPage - 1) * itemsPerPage + idx + 1}</TableCell>
                      <TableCell className="font-semibold text-gray-900">{s.servicio}</TableCell>
                      <TableCell className="text-right font-bold text-blue-700">{s.veces}</TableCell>
                      <TableCell className="text-right font-bold text-[#D4AF37]">{formatCOP(s.ingresos)}</TableCell>
                      <TableCell className="text-right text-gray-600">{formatCOP(s.precioPromedio)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              
              <div className="flex flex-col md:flex-row items-center justify-between gap-4 mt-6 pt-4 pb-4 px-4 border-t">
                <div className="flex items-center gap-2">
                  <Label className="text-sm text-muted-foreground">Mostrar:</Label>
                  <Select value={itemsPerPage.toString()} onValueChange={v => { setItemsPerPage(parseInt(v)); setCurrentPage(1); }}>
                    <SelectTrigger className="w-[80px] h-8"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {['5', '10', '20'].map(val => <SelectItem key={val} value={val}>{val}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                  itemsPerPage={itemsPerPage}
                  totalItems={data.ranking.length}
                />
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}