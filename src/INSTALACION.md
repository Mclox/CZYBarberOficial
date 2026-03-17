# 📋 Guía de Instalación - CzBarber

## ✅ Requisitos Previos

Antes de comenzar, asegúrate de tener instalado:

1. **Node.js** (versión 18 o superior)
   - Descarga desde: https://nodejs.org/
   - Verifica la instalación: `node --version`

2. **npm** (viene con Node.js)
   - Verifica la instalación: `npm --version`

3. **Visual Studio Code** (recomendado)
   - Descarga desde: https://code.visualstudio.com/

## 🚀 Pasos de Instalación

### 1️⃣ Descargar el Proyecto

Opción A: Si tienes el proyecto en un ZIP
```bash
# Descomprime el archivo ZIP en una carpeta
# Ejemplo: C:/Proyectos/barberia-elite-gestion
```

Opción B: Si está en Git
```bash
git clone <url-del-repositorio>
cd barberia-elite-gestion
```

### 2️⃣ Abrir en Visual Studio Code

```bash
# Desde la terminal, navega a la carpeta del proyecto
cd ruta/a/barberia-elite-gestion

# Abre Visual Studio Code
code .
```

O desde VS Code:
- File → Open Folder
- Selecciona la carpeta del proyecto

### 3️⃣ Instalar Dependencias

Abre la terminal integrada de VS Code:
- **Windows/Linux**: `Ctrl + Ñ` o `Ctrl + '`
- **Mac**: `Cmd + Ñ` o `Cmd + '`

Ejecuta:
```bash
npm install
```

⏳ Esto tomará unos minutos la primera vez (descarga todas las dependencias).

### 4️⃣ Ejecutar el Proyecto

```bash
npm run dev
```

✅ Si todo está bien, verás algo como:
```
  VITE v5.1.4  ready in 500 ms

  ➜  Local:   http://localhost:3000/
  ➜  Network: use --host to expose
  ➜  press h + enter to show help
```

### 5️⃣ Abrir en el Navegador

El navegador se abrirá automáticamente en:
```
http://localhost:3000
```

Si no se abre automáticamente, ábrelo manualmente y visita esa URL.

## 🎯 Verificar que Funciona

1. Deberías ver la **Landing Page** de CzBarber
2. Haz clic en "Acceder"
3. Usa estas credenciales para probar:

**Admin**
- Email: `admin@barberia.com`
- Password: `admin123`

**Barbero**
- Email: `barbero@barberia.com`
- Password: `barbero123`

**Cliente**
- Email: `cliente@email.com`
- Password: `cliente123`

## 🔧 Comandos Útiles

```bash
# Desarrollo (con hot reload)
npm run dev

# Compilar para producción
npm run build

# Vista previa de producción
npm run preview

# Verificar errores de código
npm run lint
```

## ⚠️ Solución de Problemas Comunes

### Error: "npm no se reconoce como comando"
**Solución**: Necesitas instalar Node.js desde https://nodejs.org/

### Error: "Cannot find module"
**Solución**: 
```bash
# Elimina node_modules y package-lock.json
rm -rf node_modules package-lock.json

# Reinstala
npm install
```

### El puerto 3000 ya está en uso
**Solución**:
```bash
# Opción 1: Mata el proceso que usa el puerto
# Windows:
netstat -ano | findstr :3000
taskkill /PID <número-del-pid> /F

# Linux/Mac:
lsof -ti:3000 | xargs kill -9

# Opción 2: Usa otro puerto
# Modifica vite.config.ts y cambia el puerto a 3001
```

### Error de permisos en Windows
**Solución**: Ejecuta VS Code como Administrador

### Errores de TypeScript
**Solución**: Asegúrate de tener las extensiones recomendadas de VS Code:
- ESLint
- TypeScript Vue Plugin (Volar)

## 🎨 Extensiones Recomendadas para VS Code

Instala estas extensiones para una mejor experiencia:

1. **ES7+ React/Redux/React-Native snippets**
2. **Tailwind CSS IntelliSense**
3. **ESLint**
4. **Prettier - Code formatter**
5. **Auto Rename Tag**
6. **Path Intellisense**

## 📂 Estructura de Carpetas

```
barberia-elite-gestion/
├── node_modules/        # Dependencias (se crea con npm install)
├── public/             # Archivos estáticos
├── features/           # Módulos de la app
├── components/         # Componentes compartidos
├── core/              # Core de la aplicación
├── shared/            # Utilidades compartidas
├── styles/            # Estilos globales
├── index.html         # HTML principal
├── main.tsx           # Punto de entrada
├── App.tsx            # Componente raíz
├── package.json       # Dependencias y scripts
├── tsconfig.json      # Configuración de TypeScript
├── vite.config.ts     # Configuración de Vite
└── README.md          # Documentación
```

## 🎓 Siguientes Pasos

1. ✅ Explora el código en la carpeta `features/`
2. ✅ Revisa los componentes en `components/ui/`
3. ✅ Modifica el tema en `styles/globals.css`
4. ✅ Prueba todos los módulos con diferentes roles
5. ✅ Personaliza según tus necesidades

## 💡 Tips

- **Hot Reload**: Los cambios se reflejan automáticamente sin recargar
- **Console**: Abre las DevTools (F12) para ver errores
- **Terminal**: Mantén la terminal abierta para ver logs
- **Git**: Haz commits frecuentes de tus cambios

## 📞 Soporte

Si tienes problemas:
1. Revisa esta guía completa
2. Verifica la consola del navegador (F12)
3. Revisa la terminal de VS Code
4. Busca el error en Google/StackOverflow

---

¡Listo! 🎉 Ahora tienes todo configurado para desarrollar.
