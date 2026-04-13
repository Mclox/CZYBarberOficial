import { useState, useEffect } from 'react';
import { Card, CardContent } from './ui/card';
import { Package } from 'lucide-react';
import { Badge } from './ui/badge';
import { mockProductos } from '../shared/lib/mockData';

interface Product {
  id_producto: number;
  nombre: string;
  descripcion?: string;
  precio_neto?: number;
  precio: number;
  img?: string;
  imagen?: string;
  stock: number;
  estado?: string;
}

const API_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:4000/api';

export function CatalogProducts() {
  const [productos, setProductos] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProductosPublic = async () => {
      try {
        const response = await fetch(`${API_URL}/products/public`);
        
        if (!response.ok) {
          throw new Error('Error de red o endpoint protegido');
        }
        
        const result = await response.json();
        
        if (result.success && result.data) {
          const activos = result.data.filter((p: Product) => p.estado?.toLowerCase() === 'activo' && p.stock > 0);
          setProductos(activos);
          return; // Si tuvo éxito, terminamos aquí
        } else {
          throw new Error('Respuesta del API no fue "success"');
        }
      } catch (error) {
        console.warn('No se pudo obtener productos del backend público, usando datos de respaldo:', error);
        // Fallback a mock data si el endpoint requiere autenticación o falla
        const activos = mockProductos.filter(p => p.estado?.toLowerCase() === 'activo' && p.stock > 0);
        setProductos(activos as Product[]);
      } finally {
        setLoading(false);
      }
    };

    fetchProductosPublic();
  }, []);

  if (loading) {
    return (
      <section className="py-20 relative overflow-hidden" style={{ background: '#FAFAFA' }}>
        <div className="flex justify-center items-center h-40">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0057FF]"></div>
        </div>
      </section>
    );
  }

  if (productos.length === 0) {
    return null;
  }

  return (
    <section id="productos" className="py-20 relative overflow-hidden" style={{ background: '#FAFAFA' }}>
      {/* Background Image with Overlay */}
      <div
        className="absolute inset-0 z-0 opacity-[0.15]"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1503951914875-452162b0f3f1?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          filter: 'grayscale(100%)',
        }}
      >
        <div className="absolute inset-0" style={{ background: 'rgba(250, 250, 250, 0.4)' }}></div>
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4" style={{ color: '#000000', letterSpacing: '-0.01em' }}>Nuestros Productos</h2>
          <p className="text-lg" style={{ color: '#555555', fontWeight: 600, textShadow: '0 0 4px rgba(255, 255, 255, 0.8)' }}>
            Encuentra los mejores productos para el cuidado personal
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {productos.map((producto) => {
            const finalPrice = producto.precio || producto.precio_neto || 0;
            return (
              <Card key={producto.id_producto} className="backdrop-blur-sm transition-all duration-300 overflow-hidden flex flex-col h-full" style={{ background: '#FFFFFF', border: '1px solid #d0d8e4', borderRadius: '16px' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.border = '1.5px solid #0057FF'; e.currentTarget.style.transform = 'translateY(-5px)'; e.currentTarget.style.boxShadow = '0 10px 25px rgba(0,87,255,0.1)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.border = '1px solid #d0d8e4'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}>
                <div className="aspect-square relative flex items-center justify-center bg-gray-50 border-b border-gray-100 overflow-hidden shrink-0">
                  {producto.img ? (
                     <img src={producto.img} alt={producto.nombre} className="w-full h-full object-cover transition-transform duration-500 hover:scale-110" />
                  ) : (
                     <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center">
                       <Package className="w-10 h-10 text-gray-400" />
                     </div>
                  )}
                </div>
                <CardContent className="p-6 flex flex-col flex-1">
                  <div className="flex justify-between items-start mb-2 gap-2">
                    <h3 className="text-lg font-bold line-clamp-2" style={{ color: '#000000', lineHeight: 1.3 }}>{producto.nombre}</h3>
                    <Badge className="font-bold shrink-0 text-white" style={{ background: '#0057FF', border: 'none' }}>
                      ${finalPrice.toFixed(2)}
                    </Badge>
                  </div>
                  {producto.descripcion && (
                    <p className="text-sm text-gray-500 line-clamp-3 mt-auto" title={producto.descripcion}>
                      {producto.descripcion}
                    </p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}
