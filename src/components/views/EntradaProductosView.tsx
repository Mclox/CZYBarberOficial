import { useState, useMemo, useEffect } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Badge } from '../ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../ui/alert-dialog';
// import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import {
    PackagePlus, Search, Eye, Plus, XCircle,
    CheckCircle, Ban, Package, TrendingUp,
    User, FileDown,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../../features/auth';
import { exportToExcelXLSX } from '../../shared/lib/exportUtils';
import { fetchApi } from '../../lib/api'; // <--- INYECCIÓN DE API
import { Pagination } from '../common/Pagination';


// Interfaces actualizadas a la Base de Datos Real
interface ProductoReal {
    id_producto: number;
    nombre: string;
    stock: number;
    estado: string;
}

interface EntradaReal {
    id_entrada: number;
    id_producto: number;
    producto_nombre: string;
    id_usuario: number;
    nombre_usuario: string;
    cantidad: number;
    fecha: string;
    observaciones: string | null;
    estado: 'Activo' | 'Anulado';
    motivo_anulacion: string | null;
    fecha_anulacion: string | null;
}

// Helper: Búsqueda en fechas
const searchInDate = (dateStr: string, searchTerm: string): boolean => {
    if (!dateStr) return false;
    const term = searchTerm.toLowerCase().trim();
    try {
        const date = new Date(dateStr);
        if (date.toLocaleDateString('es-ES').includes(term)) return true;
        if (dateStr.includes(term)) return true;
        return false;
    } catch { return false; }
};

export function EntradaProductosView() {
    const { user } = useAuth();

    // Estados Reales
    const [entradas, setEntradas] = useState<EntradaReal[]>([]);
    const [productos, setProductos] = useState<ProductoReal[]>([]);
    const [loading, setLoading] = useState(true);

    // UI state
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    // Dialogs
    const [createDialogOpen, setCreateDialogOpen] = useState(false);
    const [viewDialogOpen, setViewDialogOpen] = useState(false);
    const [anularDialogOpen, setAnularDialogOpen] = useState(false);

    // Selected records
    const [viewingEntrada, setViewingEntrada] = useState<EntradaReal | null>(null);
    const [entradaToAnular, setEntradaToAnular] = useState<EntradaReal | null>(null);

    // Form state
    const [formData, setFormData] = useState({ id_producto: '', cantidad: '', observaciones: '' });
    const [formErrors, setFormErrors] = useState<Record<string, string>>({});
    const [motivoAnulacion, setMotivoAnulacion] = useState('');

    // ── Cargar Datos de BD ────────────────────────────────────
    const fetchData = async () => {
        setLoading(true);
        try {
            // Cargar Entradas
            const entradasRes = await fetchApi('/product-entries');
            if (entradasRes.success) setEntradas(entradasRes.data);

            // Cargar Productos (para el Select y mostrar stock actual)
            const productosRes = await fetchApi('/products');
            if (productosRes.success) setProductos(productosRes.data);
        } catch (error: any) {
            toast.error('Error al cargar datos desde el servidor');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // ── Helpers ────────────────────────────────────────────────
    // const getProductoName = (id: number, fallbackName: string) => {
    //     const p = productos.find(p => p.id_producto === id);
    //     return p ? p.nombre : fallbackName;
    // };

    const getEstadoBadge = (estado: string) =>
        estado === 'Activo' ? (
            <Badge className="px-3 py-1 rounded-full border-2 bg-green-600 text-white border-transparent shadow-sm">
                <span className="w-2 h-2 rounded-full mr-2 bg-green-200"></span>
                Activo
            </Badge>
        ) : (
            <Badge className="px-3 py-1 rounded-full border-2 bg-red-600 text-white border-transparent shadow-sm">
                <span className="w-2 h-2 rounded-full mr-2 bg-red-200"></span>
                Anulado
            </Badge>
        );

    // ── Filtering ───────────────────────────────────────────────
    const filteredEntradas = useMemo(() => {
        if (!searchTerm.trim()) return entradas;
        const lower = searchTerm.toLowerCase();
        const clean = lower.replace('#', '').trim();
        return entradas.filter(e => {
            const productoName = (e.producto_nombre || '').toLowerCase();
            const usuarioName = (e.nombre_usuario || '').toLowerCase();
            return (
                e.id_entrada.toString().includes(clean) ||
                productoName.includes(lower) ||
                usuarioName.includes(lower) ||
                e.cantidad.toString().includes(clean) ||
                (e.estado || '').toLowerCase().includes(lower) ||
                searchInDate(e.fecha, lower)
            );
        });
    }, [entradas, searchTerm]);

    const totalPages = Math.ceil(filteredEntradas.length / itemsPerPage);
    const paginated = filteredEntradas.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    // ── Stats ───────────────────────────────────────────────────
    const totalEntradas = filteredEntradas.length;
    const totalActivas = filteredEntradas.filter(e => e.estado === 'Activo').length;
    const totalAnuladas = filteredEntradas.filter(e => e.estado === 'Anulado').length;
    const unidadesIngresadas = filteredEntradas.filter(e => e.estado === 'Activo').reduce((s, e) => s + e.cantidad, 0);

    // ── Form validation ─────────────────────────────────────────
    const validateForm = (): boolean => {
        const errors: Record<string, string> = {};
        if (!formData.id_producto) errors.id_producto = 'Debes seleccionar un producto';
        const cant = parseInt(formData.cantidad);
        if (!formData.cantidad || isNaN(cant) || cant <= 0) errors.cantidad = 'La cantidad debe ser mayor a 0';
        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    // ── Handlers de API ─────────────────────────────────────────
    const handleCreate = async () => {
        if (!validateForm()) return;

        try {
            const payload = {
                id_producto: parseInt(formData.id_producto),
                cantidad: parseInt(formData.cantidad),
                observaciones: formData.observaciones.trim() || null
            };

            await fetchApi('/product-entries', {
                method: 'POST',
                body: JSON.stringify(payload)
            });

            toast.success('Entrada registrada exitosamente', {
                description: `El stock ha sido actualizado.`,
                style: { background: '#10b981', color: '#fff' },
            });
            
            setCreateDialogOpen(false);
            fetchData(); // Recargar tablas para traer datos y stock fresco

        } catch (error: any) {
            toast.error(error.message || 'Error al registrar la entrada');
        }
    };

    const handleConfirmAnular = async () => {
        if (!entradaToAnular) return;
        if (!motivoAnulacion.trim()) { toast.error('Debes indicar el motivo'); return; }

        const toastId = toast.loading('Anulando entrada...');
        try {
            await fetchApi(`/product-entries/${entradaToAnular.id_entrada}/annul`, {
                method: 'PUT',
                body: JSON.stringify({ motivo_anulacion: motivoAnulacion.trim() })
            });

            toast.success('Entrada anulada correctamente', { id: toastId });
            setAnularDialogOpen(false);
            setEntradaToAnular(null);
            fetchData(); // Recargar datos
        } catch (error: any) {
            toast.error(error.message || 'Error al anular la entrada', { id: toastId });
        }
    };

    const handleExport = () => {
        const data = entradas.map(e => ({
            ID: e.id_entrada,
            Fecha: new Date(e.fecha).toLocaleDateString('es-ES'),
            Producto: e.producto_nombre,
            Cantidad: e.cantidad,
            'Registrado por': e.nombre_usuario,
            Estado: e.estado,
            'Motivo anulación': e.motivo_anulacion ?? '',
        }));
        exportToExcelXLSX(data, `Entradas_${new Date().toLocaleDateString('es-ES').replace(/\//g, '-')}`, 'Entradas');
        toast.success('Exportado exitosamente');
    };

    // Mantenemos las aperturas de modales igual
    const handleOpenCreate = () => { setFormData({ id_producto: '', cantidad: '', observaciones: '' }); setFormErrors({}); setCreateDialogOpen(true); };
    const handleView = (entrada: EntradaReal) => { setViewingEntrada(entrada); setViewDialogOpen(true); };
    const handleOpenAnular = (entrada: EntradaReal) => { setEntradaToAnular(entrada); setMotivoAnulacion(''); setAnularDialogOpen(true); };

    // ── Render ──────────────────────────────────────────────────
    return (
        <div className="p-4 md:p-8 space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                    <h1 className="flex items-center gap-2 text-2xl font-bold text-blue-800"><PackagePlus className="w-6 h-6 text-blue-600" /> Entrada de Productos</h1>
                    <p className="text-muted-foreground text-sm mt-1">Registro de ingresos de inventario — único mecanismo para aumentar el stock</p>
                </div>
                <div className="flex gap-2">
                    <Button onClick={handleOpenCreate} className="bg-blue-600 hover:bg-blue-700 text-white"><Plus className="w-4 h-4 mr-2" /> Nueva Entrada</Button>
                    <Button onClick={handleExport} variant="outline"><FileDown className="w-4 h-4 mr-2" /> Exportar</Button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="bg-gradient-to-r from-amber-50 to-amber-100 border-amber-300">
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="p-2 bg-amber-600 rounded-lg"><Package className="w-5 h-5 text-white" /></div>
                        <div><p className="text-xs text-muted-foreground">Total Entradas</p><p className="text-2xl font-bold text-amber-700">{totalEntradas}</p></div>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-r from-green-50 to-green-100 border-green-300">
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="p-2 bg-green-600 rounded-lg"><CheckCircle className="w-5 h-5 text-white" /></div>
                        <div><p className="text-xs text-muted-foreground">Activas</p><p className="text-2xl font-bold text-green-700">{totalActivas}</p></div>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-r from-gray-50 to-gray-100 border-gray-300">
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="p-2 bg-gray-500 rounded-lg"><Ban className="w-5 h-5 text-white" /></div>
                        <div><p className="text-xs text-muted-foreground">Anuladas</p><p className="text-2xl font-bold text-gray-600">{totalAnuladas}</p></div>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-300">
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="p-2 bg-blue-600 rounded-lg"><TrendingUp className="w-5 h-5 text-white" /></div>
                        <div><p className="text-xs text-muted-foreground">Unidades Activas</p><p className="text-2xl font-bold text-blue-700">{unidadesIngresadas}</p></div>
                    </CardContent>
                </Card>
            </div>



            {/* Table */}
            <Card>
                <CardHeader>
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <CardTitle>Listado de Entradas</CardTitle>
                        <div className="w-full md:w-96 relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                            <Input placeholder="Buscar..." value={searchTerm} onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }} className="pl-10" />
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="text-center py-12 text-muted-foreground">Cargando datos del servidor...</div>
                    ) : filteredEntradas.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">No hay entradas registradas.</div>
                    ) : (
                        <>
                            <div className="rounded-md border overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>ID</TableHead>
                                            <TableHead>Fecha</TableHead>
                                            <TableHead>Producto</TableHead>
                                            <TableHead className="text-center">Cantidad</TableHead>
                                            <TableHead>Usuario</TableHead>
                                            <TableHead>Estado</TableHead>
                                            <TableHead className="text-right">Acciones</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {paginated.map(entrada => (
                                            <TableRow key={entrada.id_entrada} className={entrada.estado === 'Anulado' ? 'opacity-60' : ''}>
                                                <TableCell className="font-medium">#{entrada.id_entrada}</TableCell>
                                                <TableCell>{new Date(entrada.fecha).toLocaleDateString('es-ES')}</TableCell>
                                                <TableCell className="font-medium">{entrada.producto_nombre}</TableCell>
                                                <TableCell className="text-center">
                                                    <span className={`font-bold ${entrada.estado === 'Activo' ? 'text-green-700' : 'text-gray-400 line-through'}`}>
                                                        +{entrada.cantidad}
                                                    </span>
                                                </TableCell>
                                                <TableCell>{entrada.nombre_usuario}</TableCell>
                                                <TableCell>
                                                    {entrada.estado === 'Activo' ? (
                                                        <button
                                                            onClick={() => handleOpenAnular(entrada)}
                                                            className="focus:outline-none transition-transform active:scale-95"
                                                            title="Anular entrada"
                                                        >
                                                            <Badge 
                                                                className="cursor-pointer px-3 py-1 rounded-full border-2 bg-green-600 text-white hover:bg-green-700 border-transparent shadow-sm transition-all duration-200"
                                                            >
                                                                <span className="w-2 h-2 rounded-full mr-2 bg-green-200"></span>
                                                                Activo
                                                            </Badge>
                                                        </button>
                                                    ) : (
                                                        <Badge 
                                                            className="px-3 py-1 rounded-full border-2 bg-red-600 text-white border-transparent shadow-sm"
                                                        >
                                                            <span className="w-2 h-2 rounded-full mr-2 bg-red-200"></span>
                                                            Anulado
                                                        </Badge>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex justify-end gap-2">
                                                        <Button variant="outline" size="sm" onClick={() => handleView(entrada)}><Eye className="w-4 h-4" /></Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                            <div className="flex flex-col md:flex-row items-center justify-between gap-4 mt-6 pt-4 border-t">
                                <div className="flex items-center gap-2">
                                    <Label className="text-sm text-muted-foreground">Mostrar:</Label>
                                    <Select value={itemsPerPage.toString()} onValueChange={v => { setItemsPerPage(parseInt(v)); setCurrentPage(1); }}>
                                        <SelectTrigger className="w-[80px] h-8"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            {['5', '10', '20', '50'].map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <Pagination
                                    currentPage={currentPage}
                                    totalPages={totalPages}
                                    onPageChange={setCurrentPage}
                                    itemsPerPage={itemsPerPage}
                                    totalItems={filteredEntradas.length}
                                />
                            </div>
                        </>
                    )}
                </CardContent>
            </Card>

            {/* ── Dialog: Nueva Entrada ──────────────────────────── */}
            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2"><PackagePlus className="w-5 h-5 text-blue-600" /> Nueva Entrada</DialogTitle>
                        <DialogDescription>El stock aumentará automáticamente al confirmar en la Base de Datos.</DialogDescription>
                    </DialogHeader>

                    <div className="space-y-5 py-2">
                        {/* Usuario (solo lectura) */}
                        <div className="space-y-2">
                            <Label className="flex items-center gap-1 text-sm font-medium"><User className="w-4 h-4 text-muted-foreground" /> Registrado por</Label>
                            <div className="flex items-center gap-2 h-10 px-3 rounded-md border bg-muted text-sm text-muted-foreground">
                                {user?.nombre ?? 'Sistema'}
                                <span className="ml-auto text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">Automático (Token JWT)</span>
                            </div>
                        </div>

                        {/* Producto */}
                        <div className="space-y-2">
                            <Label htmlFor="producto" className="font-medium">Producto <span className="text-red-500">*</span></Label>
                            <Select value={formData.id_producto} onValueChange={v => { setFormData(f => ({ ...f, id_producto: v })); setFormErrors(e => ({ ...e, id_producto: '' })); }}>
                                <SelectTrigger id="producto" className={formErrors.id_producto ? 'border-red-500' : ''}>
                                    <SelectValue placeholder="Selecciona un producto" />
                                </SelectTrigger>
                                <SelectContent>
                                    {productos.filter(p => p.estado === 'Activo').map(p => (
                                        <SelectItem key={p.id_producto} value={p.id_producto.toString()}>
                                            <span className="flex items-center gap-2">
                                                {p.nombre} <span className="text-xs text-muted-foreground">(Stock: {p.stock})</span>
                                            </span>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {formErrors.id_producto && <p className="text-xs text-red-500">{formErrors.id_producto}</p>}
                        </div>

                        {/* Cantidad */}
                        <div className="space-y-2">
                            <Label htmlFor="cantidad" className="font-medium">Cantidad <span className="text-red-500">*</span></Label>
                            <Input id="cantidad" type="number" min="1" placeholder="Ej. 20" value={formData.cantidad} onChange={e => { setFormData(f => ({ ...f, cantidad: e.target.value })); setFormErrors(er => ({ ...er, cantidad: '' })); }} />
                            {formErrors.cantidad && <p className="text-xs text-red-500">{formErrors.cantidad}</p>}
                        </div>

                        {/* Observaciones */}
                        <div className="space-y-2">
                            <Label htmlFor="observaciones" className="font-medium">Observaciones <span className="text-muted-foreground text-xs">(opcional)</span></Label>
                            <Textarea id="observaciones" value={formData.observaciones} onChange={e => setFormData(f => ({ ...f, observaciones: e.target.value }))} rows={2} />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>Cancelar</Button>
                        <Button onClick={handleCreate} className="bg-blue-600 hover:bg-blue-700 text-white"><PackagePlus className="w-4 h-4 mr-2" /> Guardar</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ── Dialog: Ver Detalle ────────────────────────────── */}
            <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
                <DialogContent className="max-w-lg">
                    <DialogHeader><DialogTitle className="flex items-center gap-2"><Package className="w-5 h-5 text-blue-600" /> Detalle de Entrada #{viewingEntrada?.id_entrada}</DialogTitle></DialogHeader>
                    {viewingEntrada && (
                        <div className="grid grid-cols-2 gap-4 py-2">
                            {[
                                { label: 'Estado', value: getEstadoBadge(viewingEntrada.estado) },
                                { label: 'Producto', value: viewingEntrada.producto_nombre },
                                { label: 'Cantidad', value: `+${viewingEntrada.cantidad}` },
                                { label: 'Fecha Registro', value: new Date(viewingEntrada.fecha).toLocaleString('es-ES') },
                                { label: 'Registrado por', value: viewingEntrada.nombre_usuario },
                            ].map(({ label, value }, i) => (
                                <div key={i} className="space-y-1"><Label className="text-xs text-muted-foreground uppercase">{label}</Label><div className="p-2 bg-muted rounded-md text-sm font-medium">{value}</div></div>
                            ))}
                            {viewingEntrada.observaciones && (
                                <div className="col-span-2 space-y-1"><Label className="text-xs text-muted-foreground uppercase">Observaciones</Label><div className="p-2 bg-muted rounded-md text-sm">{viewingEntrada.observaciones}</div></div>
                            )}
                            {viewingEntrada.estado === 'Anulado' && (
                                <div className="col-span-2 space-y-1 p-3 bg-red-50 border border-red-200 rounded-lg">
                                    <p className="text-xs font-semibold text-red-700 uppercase">Información de Anulación</p>
                                    <p className="text-sm text-red-800"><strong>Motivo:</strong> {viewingEntrada.motivo_anulacion}</p>
                                    <p className="text-sm text-red-800"><strong>Fecha:</strong> {new Date(viewingEntrada.fecha_anulacion || '').toLocaleString('es-ES')}</p>
                                </div>
                            )}
                        </div>
                    )}
                    <DialogFooter><Button onClick={() => setViewDialogOpen(false)}>Cerrar</Button></DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ── AlertDialog: Anular ────────────────────────────── */}
            <AlertDialog open={anularDialogOpen} onOpenChange={setAnularDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2 text-red-700"><XCircle className="w-5 h-5" /> Anular Entrada #{entradaToAnular?.id_entrada}</AlertDialogTitle>
                        <AlertDialogDescription>Esta acción <strong>revertirá el stock</strong> de <em>{entradaToAnular?.producto_nombre}</em> en <strong>{entradaToAnular?.cantidad} unidades</strong> mediante un Trigger en SQL.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <div className="py-2 space-y-2">
                        <Label htmlFor="motivo" className="font-medium">Motivo de anulación <span className="text-red-500">*</span></Label>
                        <Textarea id="motivo" placeholder="Describe el motivo..." value={motivoAnulacion} onChange={e => setMotivoAnulacion(e.target.value)} rows={3} />
                    </div>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleConfirmAnular} className="bg-red-600 hover:bg-red-700 text-white">Ejecutar Anulación en BD</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}