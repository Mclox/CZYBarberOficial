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
//   BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, Legend
// } from 'recharts';
// import { CalendarCheck, CalendarX, CalendarClock, Calendar, Filter, Users } from 'lucide-react';

// // ===================== MOCK DATA =====================
// const mockCitasResumen = {
//   totalAgendadas: 184,
//   totalCompletadas: 142,
//   totalCanceladas: 22,
//   totalPendientes: 20,
// };

// const mockCitasPorEstado = [
//   { estado: 'Pendiente', cantidad: 20, color: '#F59E0B' },
//   { estado: 'Confirmada', cantidad: 48, color: '#3B82F6' },
//   { estado: 'En Proceso', cantidad: 12, color: '#8B5CF6' },
//   { estado: 'Completada', cantidad: 142, color: '#10B981' },
//   { estado: 'Cancelada', cantidad: 22, color: '#EF4444' },
//   { estado: 'No Asistió', cantidad: 8, color: '#6B7280' },
// ];

// const mockCitasDetalle = [
//   { id: 1, fecha: '2026-04-13', hora: '09:00', cliente: 'Roberto Sánchez', barbero: 'Carlos Ruiz', servicio: 'Corte Clásico', estado: 'Completada', precio: 25000 },
//   { id: 2, fecha: '2026-04-13', hora: '09:30', cliente: 'María López', barbero: 'Miguel Ángel', servicio: 'Tinte + Corte', estado: 'Completada', precio: 65000 },
//   { id: 3, fecha: '2026-04-13', hora: '10:00', cliente: 'Andrés Gómez', barbero: 'David León', servicio: 'Barba Clásica', estado: 'Cancelada', precio: 15000 },
//   { id: 4, fecha: '2026-04-13', hora: '10:30', cliente: 'Pedro Martínez', barbero: 'Carlos Ruiz', servicio: 'Corte + Barba', estado: 'Pendiente', precio: 35000 },
//   { id: 5, fecha: '2026-04-13', hora: '11:00', cliente: 'Laura Torres', barbero: 'José Santos', servicio: 'Alisado Keratina', estado: 'Confirmada', precio: 80000 },
//   { id: 6, fecha: '2026-04-12', hora: '14:00', cliente: 'Diego Ramírez', barbero: 'Miguel Ángel', servicio: 'Corte Degradado', estado: 'Completada', precio: 30000 },
//   { id: 7, fecha: '2026-04-12', hora: '15:00', cliente: 'Sofía Herrera', barbero: 'David León', servicio: 'Diseño de Cejas', estado: 'Completada', precio: 12000 },
//   { id: 8, fecha: '2026-04-12', hora: '16:00', cliente: 'Camilo Vargas', barbero: 'Carlos Ruiz', servicio: 'Corte Clásico', estado: 'No Asistió', precio: 25000 },
//   { id: 9, fecha: '2026-04-11', hora: '09:00', cliente: 'Valentina Díaz', barbero: 'José Santos', servicio: 'Tinte Fantasía', estado: 'Completada', precio: 90000 },
//   { id: 10, fecha: '2026-04-11', hora: '11:00', cliente: 'Felipe Castro', barbero: 'Miguel Ángel', servicio: 'Corte + Barba', estado: 'En Proceso', precio: 35000 },
// ];

// const mockBarberos = ['Todos', 'Carlos Ruiz', 'Miguel Ángel', 'David León', 'José Santos'];

// const statusColors: Record<string, string> = {
//   Pendiente: 'bg-amber-100 text-amber-800',
//   Confirmada: 'bg-blue-100 text-blue-800',
//   'En Proceso': 'bg-purple-100 text-purple-800',
//   Completada: 'bg-green-100 text-green-800',
//   Cancelada: 'bg-red-100 text-red-800',
//   'No Asistió': 'bg-gray-100 text-gray-700',
// };

// // ===================== COMPONENT =====================
// export function ReporteCitasView() {
//   const [fechaInicio, setFechaInicio] = useState('2026-04-01');
//   const [fechaFin, setFechaFin] = useState('2026-04-13');
//   const [barberoFilter, setBarberoFilter] = useState('Todos');

//   const citasFiltradas = mockCitasDetalle.filter((cita) => {
//     const matchBarbero = barberoFilter === 'Todos' || cita.barbero === barberoFilter;
//     const matchFecha = cita.fecha >= fechaInicio && cita.fecha <= fechaFin;
//     return matchBarbero && matchFecha;
//   });

//   return (
//     <div className="p-4 md:p-8 space-y-6 bg-gray-50 min-h-screen animate-in fade-in duration-500">
//       {/* Header */}
//       <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
//         <div>
//           <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
//             <div className="p-2 bg-blue-50 rounded-xl">
//               <CalendarCheck className="w-7 h-7 text-blue-600" />
//             </div>
//             Reporte de Citas
//           </h1>
//           <p className="text-gray-500 mt-1">Seguimiento completo del total de citas y sus estados</p>
//         </div>
//       </div>

//       {/* Filtros */}
//       <Card className="shadow-sm border-gray-200">
//         <CardContent className="pt-6">
//           <div className="flex flex-wrap items-end gap-4">
//             <div className="flex items-center gap-2 text-sm font-medium text-gray-600">
//               <Filter className="w-4 h-4" />
//               Filtros:
//             </div>
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
//       <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
//         <Card className="shadow-sm border-gray-200 bg-white">
//           <CardContent className="pt-6">
//             <div className="flex items-center justify-between mb-2">
//               <p className="text-sm font-medium text-gray-500">Total Agendadas</p>
//               <div className="p-2 bg-blue-50 rounded-lg"><CalendarClock className="w-4 h-4 text-blue-600" /></div>
//             </div>
//             <p className="text-3xl font-black text-gray-900">{mockCitasResumen.totalAgendadas}</p>
//             <p className="text-xs text-blue-600 font-medium mt-1">Todas las citas del periodo</p>
//           </CardContent>
//         </Card>

//         <Card className="shadow-sm border-gray-200 bg-white">
//           <CardContent className="pt-6">
//             <div className="flex items-center justify-between mb-2">
//               <p className="text-sm font-medium text-gray-500">Completadas</p>
//               <div className="p-2 bg-green-50 rounded-lg"><CalendarCheck className="w-4 h-4 text-green-600" /></div>
//             </div>
//             <p className="text-3xl font-black text-green-700">{mockCitasResumen.totalCompletadas}</p>
//             <p className="text-xs text-green-600 font-medium mt-1">{((mockCitasResumen.totalCompletadas / mockCitasResumen.totalAgendadas) * 100).toFixed(1)}% de cumplimiento</p>
//           </CardContent>
//         </Card>

//         <Card className="shadow-sm border-gray-200 bg-white">
//           <CardContent className="pt-6">
//             <div className="flex items-center justify-between mb-2">
//               <p className="text-sm font-medium text-gray-500">Canceladas</p>
//               <div className="p-2 bg-red-50 rounded-lg"><CalendarX className="w-4 h-4 text-red-600" /></div>
//             </div>
//             <p className="text-3xl font-black text-red-600">{mockCitasResumen.totalCanceladas}</p>
//             <p className="text-xs text-red-500 font-medium mt-1">{((mockCitasResumen.totalCanceladas / mockCitasResumen.totalAgendadas) * 100).toFixed(1)}% de cancelación</p>
//           </CardContent>
//         </Card>

//         <Card className="shadow-sm border-gray-200 bg-white">
//           <CardContent className="pt-6">
//             <div className="flex items-center justify-between mb-2">
//               <p className="text-sm font-medium text-gray-500">Pendientes</p>
//               <div className="p-2 bg-amber-50 rounded-lg"><Calendar className="w-4 h-4 text-amber-600" /></div>
//             </div>
//             <p className="text-3xl font-black text-amber-600">{mockCitasResumen.totalPendientes}</p>
//             <p className="text-xs text-amber-600 font-medium mt-1">Por confirmar o atender</p>
//           </CardContent>
//         </Card>
//       </div>

//       {/* BarChart por Estado */}
//       <Card className="shadow-sm border-gray-200">
//         <CardHeader className="bg-white border-b border-gray-100">
//           <CardTitle>Citas por Estado</CardTitle>
//           <CardDescription>Distribución de citas según su estado actual</CardDescription>
//         </CardHeader>
//         <CardContent className="pt-6">
//           <div className="h-[350px] w-full">
//             <ResponsiveContainer width="100%" height="100%">
//               <BarChart data={mockCitasPorEstado} barSize={48}>
//                 <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
//                 <XAxis dataKey="estado" axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} />
//                 <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} />
//                 <Tooltip
//                   contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
//                   formatter={(value: number) => [value, 'Citas']}
//                 />
//                 <Legend />
//                 <Bar dataKey="cantidad" name="Cantidad de Citas" radius={[6, 6, 0, 0]}>
//                   {mockCitasPorEstado.map((entry, index) => (
//                     <Cell key={`cell-${index}`} fill={entry.color} />
//                   ))}
//                 </Bar>
//               </BarChart>
//             </ResponsiveContainer>
//           </div>
//         </CardContent>
//       </Card>

//       {/* Tabla de Detalle */}
//       <Card className="shadow-sm border-gray-200">
//         <CardHeader className="bg-white border-b border-gray-100">
//           <CardTitle>Detalle de Citas</CardTitle>
//           <CardDescription>Lista detallada filtrada — {citasFiltradas.length} resultado(s)</CardDescription>
//         </CardHeader>
//         <CardContent className="p-0">
//           <div className="rounded-md overflow-x-auto">
//             <Table>
//               <TableHeader>
//                 <TableRow>
//                   <TableHead>ID</TableHead>
//                   <TableHead>Fecha</TableHead>
//                   <TableHead>Hora</TableHead>
//                   <TableHead>Cliente</TableHead>
//                   <TableHead>Barbero</TableHead>
//                   <TableHead>Servicio</TableHead>
//                   <TableHead className="text-right">Precio</TableHead>
//                   <TableHead className="text-center">Estado</TableHead>
//                 </TableRow>
//               </TableHeader>
//               <TableBody>
//                 {citasFiltradas.length === 0 ? (
//                   <TableRow>
//                     <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
//                       No se encontraron citas con estos filtros
//                     </TableCell>
//                   </TableRow>
//                 ) : (
//                   citasFiltradas.map((cita) => (
//                     <TableRow key={cita.id} className="hover:bg-gray-50 transition-colors">
//                       <TableCell className="font-medium text-gray-500">#{cita.id}</TableCell>
//                       <TableCell>{new Date(cita.fecha + 'T00:00:00').toLocaleDateString('es-CO')}</TableCell>
//                       <TableCell>{cita.hora}</TableCell>
//                       <TableCell className="font-semibold text-gray-900">{cita.cliente}</TableCell>
//                       <TableCell>{cita.barbero}</TableCell>
//                       <TableCell>{cita.servicio}</TableCell>
//                       <TableCell className="text-right font-bold text-[#D4AF37]">${cita.precio.toLocaleString('es-CO')}</TableCell>
//                       <TableCell className="text-center">
//                         <Badge variant="outline" className={statusColors[cita.estado] || 'bg-gray-100'}>
//                           {cita.estado}
//                         </Badge>
//                       </TableCell>
//                     </TableRow>
//                   ))
//                 )}
//               </TableBody>
//             </Table>
//           </div>
//         </CardContent>
//       </Card>
//     </div>
//   );
// }


import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../components/ui/card';
import { Input } from '../../../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/table';
import { Badge } from '../../../components/ui/badge';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { CalendarCheck, CalendarX, CalendarClock, Calendar, Filter, Users } from 'lucide-react';
import { fetchApi } from '../../../lib/api';
import { toast } from 'sonner';

export function ReporteCitasView() {
  const today = new Date().toISOString().split('T')[0];
  const firstDay = new Date(new Date().setDate(1)).toISOString().split('T')[0];

  const [fechaInicio, setFechaInicio] = useState(firstDay);
  const [fechaFin, setFechaFin] = useState(today);
  const [barberoFilter, setBarberoFilter] = useState('Todos');
  
  const [barberos, setBarberos] = useState<any[]>([]);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Cargar lista de barberos para el filtro
    fetchApi('/employees').then(res => { if(res.success) setBarberos(res.data); });
  }, []);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const barberoQ = barberoFilter === 'Todos' ? '' : barberoFilter;
        // Construimos la URL correctamente
        const res = await fetchApi(`/reports/appointments?start=${fechaInicio}&end=${fechaFin}&barbero=${barberoQ}`);
        
        if (res.success) {
          setData(res.data);
        } else {
          toast.error(res.message || 'Error del servidor al cargar citas');
        }
      } catch (error) {
        toast.error('Error al cargar reporte de citas');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [fechaInicio, fechaFin, barberoFilter]);
  
  const getStatusColor = (estado: string) => {
    switch(estado.toLowerCase()) {
      case 'completada': return '#10B981'; // Green
      case 'cancelada': return '#EF4444'; // Red
      case 'en-ejecucion': return '#F97316'; // Orange
      case 'confirmada': return '#3B82F6'; // Blue
      default: return '#F59E0B'; // Yellow (Pendiente)
    }
  };

  return (
    <div className="p-4 md:p-8 space-y-6 bg-gray-50 min-h-screen animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <div className="p-2 bg-blue-50 rounded-xl"><CalendarCheck className="w-7 h-7 text-blue-600" /></div>
          Reporte de Citas
        </h1>
        <p className="text-gray-500 mt-1">Seguimiento en tiempo real de la agenda</p>
      </div>

      {/* FILTROS */}
      <Card className="shadow-sm border-gray-200">
        <CardContent className="pt-6 flex flex-wrap gap-4">
          <div className="space-y-1"><label className="text-xs text-gray-500">Desde</label><Input type="date" value={fechaInicio} onChange={e => setFechaInicio(e.target.value)} /></div>
          <div className="space-y-1"><label className="text-xs text-gray-500">Hasta</label><Input type="date" value={fechaFin} onChange={e => setFechaFin(e.target.value)} /></div>
          <div className="space-y-1">
            <label className="text-xs text-gray-500">Barbero</label>
            <Select value={barberoFilter} onValueChange={setBarberoFilter}>
              <SelectTrigger className="w-[200px]"><Users className="w-4 h-4 mr-2 text-blue-600"/><SelectValue placeholder="Barbero" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Todos">Todos los barberos</SelectItem>
                {barberos.map(b => <SelectItem key={b.id_usuario} value={b.id_usuario.toString()}>{b.nombre}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {loading ? <div className="text-center py-12">Calculando métricas...</div> : data && (
        <>
          {/* KPI CARDS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card><CardContent className="pt-6"><div className="flex justify-between mb-2"><p className="text-sm font-medium text-gray-500">Total Agendadas</p><CalendarClock className="w-4 h-4 text-blue-600" /></div><p className="text-3xl font-black">{data.resumen.totalAgendadas}</p></CardContent></Card>
            <Card><CardContent className="pt-6"><div className="flex justify-between mb-2"><p className="text-sm font-medium text-gray-500">Completadas</p><CalendarCheck className="w-4 h-4 text-green-600" /></div><p className="text-3xl font-black text-green-700">{data.resumen.totalCompletadas}</p></CardContent></Card>
            <Card><CardContent className="pt-6"><div className="flex justify-between mb-2"><p className="text-sm font-medium text-gray-500">Canceladas</p><CalendarX className="w-4 h-4 text-red-600" /></div><p className="text-3xl font-black text-red-600">{data.resumen.totalCanceladas}</p></CardContent></Card>
            <Card><CardContent className="pt-6"><div className="flex justify-between mb-2"><p className="text-sm font-medium text-gray-500">Pendientes</p><Calendar className="w-4 h-4 text-amber-600" /></div><p className="text-3xl font-black text-amber-600">{data.resumen.totalPendientes}</p></CardContent></Card>
          </div>

          {/* GRÁFICO */}
          <Card>
            <CardHeader><CardTitle>Citas por Estado</CardTitle></CardHeader>
            <CardContent className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.porEstado} barSize={48}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="estado" axisLine={false} tickLine={false} />
                  <YAxis axisLine={false} tickLine={false} />
                  <Tooltip cursor={{fill: 'transparent'}} contentStyle={{ borderRadius: '8px' }} />
                  <Bar dataKey="cantidad" radius={[6, 6, 0, 0]}>
                    {data.porEstado.map((entry: any, i: number) => (
                      <Cell key={`cell-${i}`} fill={getStatusColor(entry.estado)} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* TABLA */}
          <Card>
            <CardHeader><CardTitle>Detalle de Citas</CardTitle><CardDescription>{data.detalle.length} registros encontrados</CardDescription></CardHeader>
            <CardContent>
              <Table>
                <TableHeader><TableRow><TableHead>Fecha</TableHead><TableHead>Hora</TableHead><TableHead>Cliente</TableHead><TableHead>Barbero</TableHead><TableHead>Servicio</TableHead><TableHead>Estado</TableHead></TableRow></TableHeader>
                <TableBody>
                  {data.detalle.map((c: any) => (
                    <TableRow key={c.id}>
                      <TableCell>{new Date(c.fecha).toLocaleDateString('es-ES')}</TableCell>
                      <TableCell className="font-bold">{c.hora.substring(0,5)}</TableCell>
                      <TableCell>{c.cliente}</TableCell>
                      <TableCell>{c.barbero}</TableCell>
                      <TableCell>{c.servicio}</TableCell>
                      <TableCell><Badge variant="outline" style={{ color: getStatusColor(c.estado), borderColor: getStatusColor(c.estado) }}>{c.estado}</Badge></TableCell>
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