# 💈 CzBarber - Sistema de Gestión Empresarial

Sistema completo de gestión empresarial para barbería desarrollado en React + TypeScript + Tailwind CSS.

## 🚀 Características

- ✅ **Sistema de Autenticación** completo con roles y permisos
- ✅ **3 Roles de Usuario**: Admin, Barbero y Cliente
- ✅ **16 Módulos de Gestión**: Roles, Usuarios, Productos, Proveedores, Compras, Ventas, Devoluciones, Consignaciones, Servicios, Citas, Empleados, Clientes, Pagos, etc.
- ✅ **Landing Page Premium** con tema negro y dorado
- ✅ **Configuración de Landing** - El admin puede personalizar logo, fondos y textos sin tocar código 🎨
- ✅ **Completamente Responsive**
- ✅ **Datos Mock** para demostración
- ✅ **Exportación** a Excel/PDF
- ✅ **Paginación** en todas las vistas
- ✅ **Dashboard Personalizado** según el rol

## 🛠️ Tecnologías

- **React 18** - Framework de UI
- **TypeScript** - Tipado estático
- **Tailwind CSS 4** - Estilos
- **Vite** - Build tool
- **ShadCN UI** - Componentes de UI
- **Lucide React** - Iconos
- **Recharts** - Gráficas
- **Sonner** - Notificaciones

## 📦 Instalación

### Paso 1: Clonar o descargar el proyecto

```bash
# Si tienes el proyecto en un ZIP, descomprímelo
# Si está en Git:
git clone <url-del-repositorio>
cd barberia-elite-gestion
```

### Paso 2: Instalar dependencias

```bash
npm install
```

### Paso 3: Ejecutar el proyecto

```bash
npm run dev
```

La aplicación se abrirá automáticamente en `http://localhost:3000`

## 🎯 Usuarios de Prueba

### Admin
- **Usuario**: admin@barberia.com
- **Contraseña**: admin123
- **Acceso**: Total a todos los módulos

### Barbero
- **Usuario**: barbero@barberia.com
- **Contraseña**: barbero123
- **Acceso**: Productos, Devoluciones, Servicios, Citas, Clientes, Pagos, Ventas

### Cliente
- **Usuario**: cliente@email.com
- **Contraseña**: cliente123
- **Acceso**: Dashboard de catálogo y Citas

## 📁 Estructura del Proyecto

```
/
├── features/              # Módulos de la aplicación (Feature-based)
│   ├── auth/             # Autenticación
│   ├── dashboard/        # Dashboard
│   ├── mi-perfil/        # Perfil de usuario
│   ├── roles/            # Gestión de roles
│   ├── usuarios/         # Gestión de usuarios
│   ├── productos/        # Gestión de productos
│   └── ...               # Otros módulos
│
├── components/           # Componentes compartidos
│   ├── ui/              # ShadCN components
│   └── shared/          # Componentes reutilizables
│
├── core/                # Core de la aplicación
│   └── layout/         # Layouts principales
│
├── shared/             # Utilidades compartidas
│   └── lib/           # Funciones utilitarias
│
├── styles/            # Estilos globales
└── App.tsx           # Punto de entrada
```

## 🎨 Tema

El sistema utiliza un tema elegante de barbería con colores:
- **Negro**: Color principal
- **Dorado (#D4AF37)**: Color de acento
- **Responsive**: Adaptado a móviles, tablets y desktop

## 📱 Módulos Disponibles

### Para Admin:
- Mi Perfil
- Dashboard
- Roles
- Usuarios
- Productos
- Proveedores
- Compras
- Devoluciones
- Devoluciones a Proveedor
- Consignaciones
- Servicios
- Citas
- Empleados
- Clientes
- Pre-Registros
- Pagos
- Ventas
- **Config. Landing** 🎨 - Personaliza logo, fondos y textos de la landing page

### Para Barbero:
- Mi Perfil
- Dashboard
- Productos
- Devoluciones
- Servicios
- Citas
- Clientes
- Pagos
- Ventas

### Para Cliente:
- Mi Perfil
- Dashboard (Catálogo)
- Citas

## 🚀 Scripts Disponibles

```bash
# Desarrollo
npm run dev

# Compilar para producción
npm run build

# Vista previa de producción
npm run preview

# Linting
npm run lint
```

## 🎨 Personalización de Landing Page

El administrador puede personalizar la landing page desde el módulo **"Config. Landing"**:

- ✅ Cambiar el logo
- ✅ Cambiar fondos de las secciones (Hero, Servicios, Nosotros)
- ✅ Editar textos y descripciones
- ✅ Modificar información de contacto
- ✅ Actualizar estadísticas

**Ver la guía completa:** [GUIA_CONFIGURACION_LANDING.md](./GUIA_CONFIGURACION_LANDING.md)

## 📝 Notas Importantes

- ⚠️ Este sistema **NO es una tienda online**
- ✅ Es exclusivamente para **gestión interna** del negocio
- ✅ Usa **datos mock** para demostración
- ✅ Sistema de roles y permisos granulares
- ✅ Todas las funcionalidades CRUD están implementadas

## 🤝 Contribuciones

Este es un proyecto de demostración. Si deseas contribuir o reportar bugs, por favor crea un issue.

## 📄 Licencia

MIT License

---

Desarrollado con ❤️ para CzBarber