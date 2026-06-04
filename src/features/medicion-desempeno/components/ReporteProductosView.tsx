// import { useState } from 'react';
// import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../components/ui/card';
// import { Badge } from '../../../components/ui/badge';
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
// import {
//   PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
// } from 'recharts';
// import { Package, DollarSign, Archive, Calendar, TrendingDown } from 'lucide-react';

// // ===================== MOCK DATA =====================
// const mockResumen = {
//   unidadesVendidas: 347,
//   valorInventario: 12450000,
//   unidadesEnStock: 1_280,
// };

// const mockDistribucion = [
//   { name: 'Vendidos', value: 347, color: '#D4AF37' },
//   { name: 'En Stock', value: 1280, color: '#3B82F6' },
// ];

// const mockTendenciaSalidas = [
//   { semana: 'Sem 1 Mar', salidas: 42 },
//   { semana: 'Sem 2 Mar', salidas: 58 },
//   { semana: 'Sem 3 Mar', salidas: 35 },
//   { semana: 'Sem 4 Mar', salidas: 74 },
//   { semana: 'Sem 1 Abr', salidas: 62 },
//   { semana: 'Sem 2 Abr', salidas: 76 },
// ];

// const mockProductosDetalle = [
//   { id: 1, nombre: 'Pomada Strong Hold', categoria: 'Styling', vendidos: 82, stock: 45, precio: 28000, estado: 'Activo' },
//   { id: 2, nombre: 'Shampoo Premium', categoria: 'Cuidado', vendidos: 65, stock: 120, precio: 22000, estado: 'Activo' },
//   { id: 3, nombre: 'Aceite para Barba', categoria: 'Barba', vendidos: 54, stock: 88, precio: 35000, estado: 'Activo' },
//   { id: 4, nombre: 'Cera Mate Finish', categoria: 'Styling', vendidos: 48, stock: 32, precio: 25000, estado: 'Bajo Stock' },
//   { id: 5, nombre: 'After Shave Splash', categoria: 'Barba', vendidos: 38, stock: 95, precio: 18000, estado: 'Activo' },
//   { id: 6, nombre: 'Gel Ultra Fix', categoria: 'Styling', vendidos: 30, stock: 200, precio: 15000, estado: 'Activo' },
//   { id: 7, nombre: 'Tinte Negro Azulado', categoria: 'Coloración', vendidos: 20, stock: 150, precio: 42000, estado: 'Activo' },
//   { id: 8, nombre: 'Bálsamo Hidratante', categoria: 'Cuidado', vendidos: 10, stock: 250, precio: 32000, estado: 'Activo' },
// ];

// const categorias = ['Todas', 'Styling', 'Cuidado', 'Barba', 'Coloración'];

// // ===================== COMPONENT =====================
// export function ReporteProductosView() {
//   const [periodo, setPeriodo] = useState('mensual');
//   const [categoriaFilter, setCategoriaFilter] = useState('Todas');

//   const productosFiltrados = mockProductosDetalle.filter((p) =>
//     categoriaFilter === 'Todas' || p.categoria === categoriaFilter
//   );

//   return (
//     <div className="p-4 md:p-8 space-y-6 bg-gray-50 min-h-screen animate-in fade-in duration-500">
//       {/* Header */}
//       <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
//         <div>
//           <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
//             <div className="p-2 bg-amber-50 rounded-xl">
//               <Package className="w-7 h-7 text-[#D4AF37]" />
//             </div>
//             Reporte de Productos
//           </h1>
//           <p className="text-gray-500 mt-1">Porcentaje de productos vendidos vs inventario disponible</p>
//         </div>
//       </div>

//       {/* Filtros */}
//       <Card className="shadow-sm border-gray-200">
//         <CardContent className="pt-6">
//           <div className="flex flex-wrap items-end gap-4">
//             <div className="space-y-1">
//               <label className="text-xs text-gray-500">Periodo</label>
//               <Select value={periodo} onValueChange={setPeriodo}>
//                 <SelectTrigger className="w-[180px] bg-white border-gray-200">
//                   <Calendar className="w-4 h-4 mr-2 text-amber-600" />
//                   <SelectValue placeholder="Periodo" />
//                 </SelectTrigger>
//                 <SelectContent>
//                   <SelectItem value="semanal">Esta Semana</SelectItem>
//                   <SelectItem value="mensual">Este Mes</SelectItem>
//                   <SelectItem value="trimestral">Este Trimestre</SelectItem>
//                   <SelectItem value="anual">Este Año</SelectItem>
//                 </SelectContent>
//               </Select>
//             </div>
//             <div className="space-y-1">
//               <label className="text-xs text-gray-500">Categoría</label>
//               <Select value={categoriaFilter} onValueChange={setCategoriaFilter}>
//                 <SelectTrigger className="w-[200px] bg-white border-gray-200">
//                   <Package className="w-4 h-4 mr-2 text-blue-600" />
//                   <SelectValue placeholder="Categoría" />
//                 </SelectTrigger>
//                 <SelectContent>
//                   {categorias.map((c) => (
//                     <SelectItem key={c} value={c}>{c}</SelectItem>
//                   ))}
//                 </SelectContent>
//               </Select>
//             </div>
//           </div>
//         </CardContent>
//       </Card>

//       {/* KPI Cards */}
//       <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
//         <Card className="shadow-sm border-gray-200 bg-white">
//           <CardContent className="pt-6">
//             <div className="flex items-center justify-between mb-2">
//               <p className="text-sm font-medium text-gray-500">Unidades Vendidas</p>
//               <div className="p-2 bg-amber-50 rounded-lg"><TrendingDown className="w-4 h-4 text-[#D4AF37]" /></div>
//             </div>
//             <p className="text-3xl font-black text-gray-900">{mockResumen.unidadesVendidas.toLocaleString('es-CO')}</p>
//             <p className="text-xs text-[#D4AF37] font-medium mt-1">Salidas en el periodo</p>
//           </CardContent>
//         </Card>

//         <Card className="shadow-sm border-gray-200 bg-white">
//           <CardContent className="pt-6">
//             <div className="flex items-center justify-between mb-2">
//               <p className="text-sm font-medium text-gray-500">Valor Total Inventario</p>
//               <div className="p-2 bg-green-50 rounded-lg"><DollarSign className="w-4 h-4 text-green-600" /></div>
//             </div>
//             <p className="text-3xl font-black text-green-700">${mockResumen.valorInventario.toLocaleString('es-CO')}</p>
//             <p className="text-xs text-green-600 font-medium mt-1">Valorización actual del stock</p>
//           </CardContent>
//         </Card>

//         <Card className="shadow-sm border-gray-200 bg-white">
//           <CardContent className="pt-6">
//             <div className="flex items-center justify-between mb-2">
//               <p className="text-sm font-medium text-gray-500">Unidades en Stock</p>
//               <div className="p-2 bg-blue-50 rounded-lg"><Archive className="w-4 h-4 text-blue-600" /></div>
//             </div>
//             <p className="text-3xl font-black text-blue-700">{mockResumen.unidadesEnStock.toLocaleString('es-CO')}</p>
//             <p className="text-xs text-blue-600 font-medium mt-1">Disponibles en inventario</p>
//           </CardContent>
//         </Card>
//       </div>

//       {/* Gráficos */}
//       <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
//         {/* PieChart — Vendidos vs Stock */}
//         <Card className="shadow-sm border-gray-200">
//           <CardHeader className="bg-white border-b border-gray-100">
//             <CardTitle>Vendidos vs En Stock</CardTitle>
//             <CardDescription>Proporción de productos que salieron frente al inventario restante</CardDescription>
//           </CardHeader>
//           <CardContent className="pt-6">
//             <div className="h-[320px] w-full">
//               <ResponsiveContainer width="100%" height="100%">
//                 <PieChart>
//                   <Pie
//                     data={mockDistribucion}
//                     cx="50%"
//                     cy="50%"
//                     innerRadius={70}
//                     outerRadius={110}
//                     paddingAngle={4}
//                     dataKey="value"
//                     label={({ name, percent }) => `${name} ${(percent * 100).toFixed(1)}%`}
//                   >
//                     {mockDistribucion.map((entry, index) => (
//                       <Cell key={`cell-${index}`} fill={entry.color} />
//                     ))}
//                   </Pie>
//                   <Tooltip formatter={(value: number) => [value.toLocaleString('es-CO'), 'Unidades']} />
//                   <Legend verticalAlign="bottom" height={36} />
//                 </PieChart>
//               </ResponsiveContainer>
//             </div>
//           </CardContent>
//         </Card>

//         {/* LineChart — Tendencia de Salidas */}
//         <Card className="shadow-sm border-gray-200">
//           <CardHeader className="bg-white border-b border-gray-100">
//             <CardTitle>Tendencia de Salidas</CardTitle>
//             <CardDescription>Evolución de salidas de productos en el tiempo</CardDescription>
//           </CardHeader>
//           <CardContent className="pt-6">
//             <div className="h-[320px] w-full">
//               <ResponsiveContainer width="100%" height="100%">
//                 <LineChart data={mockTendenciaSalidas}>
//                   <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
//                   <XAxis dataKey="semana" axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 11 }} />
//                   <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} />
//                   <Tooltip
//                     contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
//                     formatter={(value: number) => [value, 'Unidades']}
//                   />
//                   <Line type="monotone" dataKey="salidas" stroke="#D4AF37" strokeWidth={3} dot={{ r: 5, fill: '#D4AF37', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 7, fill: '#D4AF37' }} />
//                 </LineChart>
//               </ResponsiveContainer>
//             </div>
//           </CardContent>
//         </Card>
//       </div>

//       {/* Tabla de Productos */}
//       <Card className="shadow-sm border-gray-200">
//         <CardHeader className="bg-white border-b border-gray-100">
//           <CardTitle>Inventario Detallado</CardTitle>
//           <CardDescription>{productosFiltrados.length} producto(s) encontrados</CardDescription>
//         </CardHeader>
//         <CardContent className="p-0">
//           <div className="rounded-md overflow-x-auto">
//             <table className="w-full text-sm text-left">
//               <thead className="text-xs text-gray-500 uppercase bg-gray-50">
//                 <tr>
//                   <th className="px-6 py-3 font-medium">Producto</th>
//                   <th className="px-6 py-3 font-medium">Categoría</th>
//                   <th className="px-6 py-3 font-medium text-right">Vendidos</th>
//                   <th className="px-6 py-3 font-medium text-right">Stock</th>
//                   <th className="px-6 py-3 font-medium text-right">Precio Unit.</th>
//                   <th className="px-6 py-3 font-medium text-center">Estado</th>
//                 </tr>
//               </thead>
//               <tbody className="divide-y divide-gray-100">
//                 {productosFiltrados.map((prod) => (
//                   <tr key={prod.id} className="hover:bg-gray-50 transition-colors">
//                     <td className="px-6 py-4 font-semibold text-gray-900">{prod.nombre}</td>
//                     <td className="px-6 py-4 text-gray-600">{prod.categoria}</td>
//                     <td className="px-6 py-4 text-right font-bold text-[#D4AF37]">{prod.vendidos}</td>
//                     <td className="px-6 py-4 text-right font-medium text-gray-700">{prod.stock}</td>
//                     <td className="px-6 py-4 text-right text-gray-600">${prod.precio.toLocaleString('es-CO')}</td>
//                     <td className="px-6 py-4 text-center">
//                       <Badge variant="outline" className={prod.estado === 'Bajo Stock' ? 'bg-amber-100 text-amber-800' : 'bg-green-100 text-green-800'}>
//                         {prod.estado}
//                       </Badge>
//                     </td>
//                   </tr>
//                 ))}
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
import { Badge } from '../../../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { Package, DollarSign, Archive, TrendingDown } from 'lucide-react';
import { fetchApi } from '../../../lib/api';
import { toast } from 'sonner';

const COLORS = ['#D4AF37', '#3B82F6']; // Dorado (Vendidos), Azul (En Stock)

export function ReporteProductosView() {
  const [periodo, setPeriodo] = useState('mensual');
  const [categoriaFilter, setCategoriaFilter] = useState('Todas');
  
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const res = await fetchApi(`/reports/products?period=${periodo}&category=${categoriaFilter}`);
        if (res.success) setData(res.data);
      } catch (error) {
        toast.error('Error al cargar reporte de productos');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [periodo, categoriaFilter]);

  return (
    <div className="p-4 md:p-8 space-y-6 bg-gray-50 min-h-screen animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <div className="p-2 bg-amber-50 rounded-xl"><Package className="w-7 h-7 text-[#D4AF37]" /></div>
            Reporte de Productos
          </h1>
          <p className="text-gray-500 mt-1">Porcentaje de productos vendidos vs inventario disponible</p>
        </div>
      </div>

      <Card className="shadow-sm border-gray-200">
        <CardContent className="pt-6 flex flex-wrap gap-4">
          <div className="space-y-1">
            <label className="text-xs text-gray-500">Categoría</label>
            <Select value={categoriaFilter} onValueChange={setCategoriaFilter}>
              <SelectTrigger className="w-[200px]"><Package className="w-4 h-4 mr-2 text-blue-600" /><SelectValue placeholder="Categoría" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Todas">Todas las categorías</SelectItem>
                <SelectItem value="Cuidado Capilar">Cuidado Capilar</SelectItem>
                <SelectItem value="Cuidado de Barba">Cuidado de Barba</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {loading ? <div className="text-center py-12">Calculando inventario...</div> : data && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card><CardContent className="pt-6"><div className="flex justify-between mb-2"><p className="text-sm font-medium text-gray-500">Unidades Vendidas</p><TrendingDown className="w-4 h-4 text-[#D4AF37]" /></div><p className="text-3xl font-black text-gray-900">{data.resumen.unidadesVendidas}</p><p className="text-xs text-[#D4AF37] font-medium mt-1">Salidas históricas</p></CardContent></Card>
            <Card><CardContent className="pt-6"><div className="flex justify-between mb-2"><p className="text-sm font-medium text-gray-500">Valor Total Inventario</p><DollarSign className="w-4 h-4 text-green-600" /></div><p className="text-3xl font-black text-green-700">${data.resumen.valorInventario?.toFixed(2)}</p><p className="text-xs text-green-600 font-medium mt-1">Valorización actual del stock</p></CardContent></Card>
            <Card><CardContent className="pt-6"><div className="flex justify-between mb-2"><p className="text-sm font-medium text-gray-500">Unidades en Stock</p><Archive className="w-4 h-4 text-blue-600" /></div><p className="text-3xl font-black text-blue-700">{data.resumen.unidadesEnStock}</p><p className="text-xs text-blue-600 font-medium mt-1">Disponibles en inventario</p></CardContent></Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="shadow-sm border-gray-200">
              <CardHeader><CardTitle>Vendidos vs En Stock</CardTitle><CardDescription>Proporción histórica de salidas frente al inventario restante</CardDescription></CardHeader>
              <CardContent className="h-[320px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={[{ name: 'Vendidos', value: data.resumen.unidadesVendidas }, { name: 'En Stock', value: data.resumen.unidadesEnStock }]} cx="50%" cy="50%" innerRadius={70} outerRadius={110} paddingAngle={4} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(1)}%`}>
                      <Cell fill={COLORS[0]} />
                      <Cell fill={COLORS[1]} />
                    </Pie>
                    <Tooltip formatter={(value: number) => [value, 'Unidades']} />
                    <Legend verticalAlign="bottom" height={36} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="shadow-sm border-gray-200 overflow-hidden">
              <CardHeader><CardTitle>Inventario Detallado</CardTitle><CardDescription>{data.detalle.length} producto(s) encontrados</CardDescription></CardHeader>
              <CardContent className="p-0 overflow-y-auto max-h-[320px]">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-gray-500 uppercase bg-gray-50 sticky top-0">
                    <tr><th className="px-6 py-3 font-medium">Producto</th><th className="px-6 py-3 font-medium text-right">Vendidos</th><th className="px-6 py-3 font-medium text-right">Stock</th><th className="px-6 py-3 font-medium text-center">Estado</th></tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {data.detalle.map((prod: any) => (
                      <tr key={prod.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 font-semibold text-gray-900">{prod.nombre} <br/><span className="text-xs font-normal text-gray-500">{prod.categoria}</span></td>
                        <td className="px-6 py-4 text-right font-bold text-[#D4AF37]">{prod.vendidos}</td>
                        <td className="px-6 py-4 text-right font-medium text-gray-700">{prod.stock}</td>
                        <td className="px-6 py-4 text-center"><Badge variant="outline" className={prod.estado === 'Bajo Stock' ? 'bg-amber-100 text-amber-800' : 'bg-green-100 text-green-800'}>{prod.estado}</Badge></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}