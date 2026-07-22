import { useState, useEffect, useMemo, useRef } from 'react';
import { Card, CardContent } from './ui/card';
import { Package, ChevronLeft, ChevronRight } from 'lucide-react';
import { Badge } from './ui/badge';
import { mockProductos } from '../shared/lib/mockData';
import { formatCOP } from '../lib/format';

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
  categoria?: string;
  categoria_nombre?: string;
}

const API_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:4000/api';

export function CatalogProducts() {
  const [productos, setProductos] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [isHovered, setIsHovered] = useState(false);
  const [isScrollingManually, setIsScrollingManually] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const manualScrollTimeoutRef = useRef<number | null>(null);

  // Limpiar timeout de scroll manual en desmontaje
  useEffect(() => {
    return () => {
      if (manualScrollTimeoutRef.current) {
        clearTimeout(manualScrollTimeoutRef.current);
      }
    };
  }, []);

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

  // Extraer categorías únicas
  const categorias = useMemo(() => {
    const cats = productos.map(p => p.categoria_nombre || p.categoria || 'Sin categoría');
    const uniqueCats = Array.from(new Set(cats)).sort();
    return ['Todos', ...uniqueCats];
  }, [productos]);

  // Filtrar productos por categoría seleccionada
  const filteredProductos = useMemo(() => {
    if (selectedCategory === 'Todos') return productos;
    return productos.filter(p => (p.categoria_nombre || p.categoria || 'Sin categoría') === selectedCategory);
  }, [productos, selectedCategory]);

  // Duplicar productos solo si es necesario para el carrusel infinito (si hay 4 o más productos)
  const displayProductos = useMemo(() => {
    if (filteredProductos.length >= 4) {
      return [...filteredProductos, ...filteredProductos];
    }
    return filteredProductos;
  }, [filteredProductos]);

  // Reiniciar scroll al cambiar de categoría
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollLeft = 0;
    }
  }, [selectedCategory]);

  // Efecto de autodesplazamiento continuo e infinito
  useEffect(() => {
    const container = scrollRef.current;
    if (!container || isHovered || isScrollingManually || filteredProductos.length < 4) return;

    let animationId: number;
    const speed = 0.55; // Velocidad de desplazamiento en píxeles por frame (fluido y suave)

    const scrollPlay = () => {
      if (container) {
        const singleSetWidth = container.scrollWidth / 2;
        // Si ha pasado del primer bloque, reiniciamos a 0 de forma imperceptible
        if (container.scrollLeft >= singleSetWidth) {
          container.scrollLeft -= singleSetWidth;
        }
        container.scrollLeft += speed;
      }
      animationId = requestAnimationFrame(scrollPlay);
    };

    animationId = requestAnimationFrame(scrollPlay);

    return () => cancelAnimationFrame(animationId);
  }, [filteredProductos, isHovered, isScrollingManually]);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      setIsScrollingManually(true);
      
      const container = scrollRef.current;
      const { scrollLeft, clientWidth, scrollWidth } = container;
      const singleSetWidth = scrollWidth / 2;

      let scrollTo: number;
      if (direction === 'left') {
        scrollTo = scrollLeft - clientWidth * 0.75;
        if (scrollTo < 0) {
          // Jump to the equivalent position in the second set
          container.scrollLeft = singleSetWidth + scrollLeft;
          scrollTo = singleSetWidth + scrollLeft - clientWidth * 0.75;
        }
      } else {
        scrollTo = scrollLeft + clientWidth * 0.75;
        // If destination goes beyond the first set of items
        if (scrollLeft >= singleSetWidth) {
          container.scrollLeft = scrollLeft - singleSetWidth;
          scrollTo = scrollLeft - singleSetWidth + clientWidth * 0.75;
        }
      }
      
      container.scrollTo({ left: scrollTo, behavior: 'smooth' });

      // Reanudar autoplay después de 3 segundos de inactividad
      if (manualScrollTimeoutRef.current) {
        clearTimeout(manualScrollTimeoutRef.current);
      }
      manualScrollTimeoutRef.current = window.setTimeout(() => {
        setIsScrollingManually(false);
      }, 3000);
    }
  };

  const getImageUrl = (imgUrl?: string) => {
    if (!imgUrl) return '';
    if (imgUrl.startsWith('http') || imgUrl.startsWith('data:')) return imgUrl;
    const baseUrl = API_URL.replace('/api', '');
    return `${baseUrl}${imgUrl}`;
  };

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

  // Determinar si debemos centrar los elementos en pantallas grandes (si no hay suficientes productos para desbordar)
  const justifyClass = filteredProductos.length < 4 ? 'md:justify-center' : 'justify-start';

  return (
    <section id="productos" className="py-20 relative overflow-hidden" style={{ background: '#FAFAFA' }}>
      {/* Ocultar barra de desplazamiento y estilos custom */}
      <style>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .catalog-filters {
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          gap: 12px;
          margin-bottom: 40px;
          max-width: 896px;
          margin-left: auto;
          margin-right: auto;
          padding-left: 16px;
          padding-right: 16px;
        }
        .carrusel-wrapper {
          position: relative;
          max-width: 1280px;
          margin-left: auto;
          margin-right: auto;
          padding-left: 4px;
          padding-right: 4px;
        }
        @media (min-width: 640px) {
          .carrusel-wrapper {
            padding-left: 48px;
            padding-right: 48px;
          }
        }
        .carrusel-container {
          display: flex;
          gap: 24px;
          overflow-x: auto;
          scroll-behavior: smooth;
          padding-top: 16px;
          padding-bottom: 16px;
          padding-left: 8px;
          padding-right: 8px;
          scroll-padding: 0 24px;
        }
        .carrusel-container.justify-start {
          justify-content: flex-start;
        }
        @media (min-width: 768px) {
          .carrusel-container.md\\:justify-center {
            justify-content: center;
          }
        }
        .carrusel-item {
          width: 280px;
          flex-shrink: 0;
          display: flex;
          flex-direction: column;
        }
        @media (min-width: 640px) {
          .carrusel-item {
            width: 300px;
          }
        }
        .carrusel-img-container {
          width: 100%;
          aspect-ratio: 1 / 1;
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          background-color: #f9fafb; /* bg-gray-50 */
          border-bottom: 1px solid #f3f4f6; /* border-gray-100 */
          overflow: hidden;
          flex-shrink: 0;
        }
        .carrusel-img {
          width: 100%;
          height: 100%;
          object-fit: contain;
          padding: 16px;
          transition: transform 0.5s ease;
        }
        .carrusel-img:hover {
          transform: scale(1.08);
        }
        .scroll-btn {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          z-index: 20;
          background-color: #ffffff;
          color: #0057FF;
          padding: 12px;
          border-radius: 9999px;
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
          border: 1px solid #e5e7eb;
          transition: all 0.35s ease;
          display: none;
          align-items: center;
          justify-content: center;
          cursor: pointer;
        }
        @media (min-width: 768px) {
          .scroll-btn {
            display: flex;
          }
        }
        .scroll-btn:hover {
          background-color: #f3f4f6;
          transform: translateY(-50%) scale(1.05);
        }
        .scroll-btn:active {
          transform: translateY(-50%) scale(0.95);
        }
        .scroll-btn-left {
          left: 0;
        }
        @media (min-width: 640px) {
          .scroll-btn-left {
            left: 12px;
          }
        }
        .scroll-btn-right {
          right: 0;
        }
        @media (min-width: 640px) {
          .scroll-btn-right {
            right: 12px;
          }
        }
      `}</style>

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
        <div className="text-center" style={{ marginBottom: '60px' }}>
          <h2 className="text-4xl font-bold mb-4" style={{ color: '#000000', letterSpacing: '-0.01em' }}>Nuestros Productos</h2>
          <p className="text-lg" style={{ color: '#000000', fontWeight: 700, textShadow: '0 0 4px rgba(255, 255, 255, 0.8)' }}>
            Encuentra los mejores productos para el cuidado personal
          </p>
        </div>

        {/* Filtros por Categoría */}
        <div className="catalog-filters">
          {categorias.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className="px-5 py-2.5 rounded-full font-bold text-sm transition-all duration-300 shadow-sm cursor-pointer"
              style={{
                background: selectedCategory === cat ? '#0057FF' : '#FFFFFF',
                color: selectedCategory === cat ? '#FFFFFF' : '#555555',
                border: selectedCategory === cat ? '1px solid #0057FF' : '1px solid #d0d8e4',
              }}
              onMouseEnter={e => {
                if (selectedCategory !== cat) {
                  e.currentTarget.style.border = '1px solid #0057FF';
                  e.currentTarget.style.color = '#0057FF';
                }
              }}
              onMouseLeave={e => {
                if (selectedCategory !== cat) {
                  e.currentTarget.style.border = '1px solid #d0d8e4';
                  e.currentTarget.style.color = '#555555';
                }
              }}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Carrusel de Productos */}
        <div className="carrusel-wrapper">
          {/* Botón Izquierdo */}
          {filteredProductos.length >= 4 && (
            <button
              onClick={() => scroll('left')}
              className="scroll-btn scroll-btn-left"
              aria-label="Desplazar a la izquierda"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
          )}

          {/* Contenedor del Carrusel */}
          <div
            ref={scrollRef}
            className={`carrusel-container no-scrollbar ${justifyClass}`}
            onTouchStart={() => setIsHovered(true)}
            onTouchEnd={() => {
              setTimeout(() => setIsHovered(false), 1500);
            }}
          >
            {displayProductos.map((producto, idx) => {
              const finalPrice = producto.precio || producto.precio_neto || 0;
              const categoria = producto.categoria_nombre || producto.categoria || 'Sin categoría';
              
              return (
                <div key={`${producto.id_producto}-${idx}`} className="carrusel-item">
                  <Card className="backdrop-blur-sm transition-all duration-300 overflow-hidden flex flex-col h-full" style={{ background: '#FFFFFF', border: '1px solid #d0d8e4', borderRadius: '16px' }}
                    onMouseEnter={e => {
                      setIsHovered(true);
                      (e.currentTarget as HTMLElement).style.border = '1.5px solid #0057FF';
                      e.currentTarget.style.transform = 'translateY(-5px)';
                      e.currentTarget.style.boxShadow = '0 10px 25px rgba(0,87,255,0.1)';
                    }}
                    onMouseLeave={e => {
                      setIsHovered(false);
                      (e.currentTarget as HTMLElement).style.border = '1px solid #d0d8e4';
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    <div className="carrusel-img-container">
                      {producto.img || producto.nombre?.toLowerCase().includes('minoxidil') || producto.codigo === 'PRD-MIN-01' ? (
                         <img src={
                           producto.nombre?.toLowerCase().includes('minoxidil') || producto.codigo === 'PRD-MIN-01'
                             ? '/assets/images/minoxidil.png'
                             : getImageUrl(producto.img)
                         } alt={producto.nombre} className="carrusel-img" />
                      ) : (
                         <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center">
                           <Package className="w-10 h-10 text-gray-400" />
                         </div>
                      )}
                    </div>
                    <CardContent className="p-6 flex flex-col flex-1">
                      {/* Categoría */}
                      <span className="text-xs font-bold text-[#0057FF] uppercase tracking-wider mb-2 block">
                        {categoria}
                      </span>
                      <div className="flex justify-between items-start mb-2 gap-2">
                        <h3 className="text-lg font-bold line-clamp-2" style={{ color: '#000000', lineHeight: 1.3 }}>{producto.nombre}</h3>
                        <Badge className="font-bold shrink-0 text-white" style={{ background: '#0057FF', border: 'none' }}>
                          {formatCOP(finalPrice)}
                        </Badge>
                      </div>
                      {producto.descripcion && (
                        <p className="text-sm text-gray-500 line-clamp-3 mt-auto" title={producto.descripcion}>
                          {producto.descripcion}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </div>
              );
            })}
          </div>

          {/* Botón Derecho */}
          {filteredProductos.length >= 4 && (
            <button
              onClick={() => scroll('right')}
              className="scroll-btn scroll-btn-right"
              aria-label="Desplazar a la derecha"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
