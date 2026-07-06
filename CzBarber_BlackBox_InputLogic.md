# Especificación de Lógica de Entrada para Pruebas de Caja Negra (CzBarber)

Este documento detalla la lógica de entrada, tipos de datos, restricciones de formato, reglas de negocio y flujos alternativos o de error para los 6 procesos principales del sistema **CzBarber**. Está estructurado para servir como base y contexto directo en el diseño de una matriz de clases de equivalencia (Particionamiento de Clases de Equivalencia y Análisis de Valores Límite).

---

## Proceso 1: Gestión de Roles

Este proceso permite la creación y modificación de roles de usuario, junto con la asignación de permisos por módulo (Matriz de Control de Acceso).

### Reglas de Negocio
1. **Integridad del Administrador:** No se puede inactivar ni modificar el estado del rol "Administrador" o "Admin" para evitar bloqueos del sistema. Tampoco se permite eliminarlo.
2. **Matriz de Permisos Restringida:** Ciertas combinaciones de módulo y acción están deshabilitadas nativamente:
   * **Eliminar** deshabilitado para: *Usuarios, Entradas de Productos, Empleados, Clientes, Ventas, Devoluciones, Dashboard General*.
   * **Actualizar (Editar)** deshabilitado para: *Entradas de Productos, Ventas, Devoluciones, Dashboard General*.
   * **Crear (Registrar)** deshabilitado para: *Dashboard General*.
   * **Dashboard General** solo permite la acción de **Leer (Ver)**.
   * **Roles** no permite la acción de **Eliminar**.

### Campos de Entrada y Clases de Equivalencia

| Campo | Tipo de Dato | Restricción / Formato | CP Positivos (Válidos) | CP Negativos / Límites (Inválidos) |
| :--- | :--- | :--- | :--- | :--- |
| **Nombre** | String | Requerido.<br>No debe iniciar con números ni caracteres especiales. | • String que inicia con letra (ej: `"Barbero"`, `"Cajero"`). | • Campo vacío o solo espacios.<br>• Inicia con número (ej: `"1Barbero"`).<br>• Inicia con carácter especial (ej: `"-Barbero"`, `"@Recepcionista"`). |
| **Descripción** | String | Opcional. | • Cualquier cadena de texto descriptiva.<br>• Vacío (null o `""`). | • Cadenas excesivamente largas que excedan los límites de la base de datos (ej: > 500 caracteres). |
| **Estado** | Select | Requerido.<br>Valores fijos: `Activo`, `Inactivo`. | • `"Activo"`<br>• `"Inactivo"` | • Valores nulos/vacíos.<br>• Cambio de estado a `"Inactivo"` si el rol es `"Administrador"` o `"admin"` (Bloqueo/Error de negocio). |
| **Permisos por Módulo** | Matriz de Booleanos | Modificable mediante Checkboxes según el módulo. | • `true` (Habilitar permiso).<br>• `false` (Deshabilitar permiso). | • Intento de enviar `true` en permisos deshabilitados por regla de negocio (ej: `eliminar` en *Ventas*). |

---

## Proceso 2: Gestión de Productos

Este proceso maneja el inventario de productos comercializados por la barbería, permitiendo su registro, actualización y control de stock.

### Reglas de Negocio
1. **Precio y Stock No Negativos:** El precio neto y el stock del producto deben ser estrictamente numéricos y mayores o iguales a cero (o mayores a cero en el caso del precio neto).
2. **Carga de Imágenes Limitada:** Si se proporciona una imagen, esta no debe superar el límite de tamaño establecido (5MB).
3. **Tipo de Adquisición:** Define el tratamiento de inventario, pudiendo ser compra directa o consignación.

### Campos de Entrada y Clases de Equivalencia

| Campo | Tipo de Dato | Restricción / Formato | CP Positivos (Válidos) | CP Negativos / Límites (Inválidos) |
| :--- | :--- | :--- | :--- | :--- |
| **Nombre** | String | Requerido.<br>Texto alfanumérico. | • Nombres comunes de productos (ej: `"Cera Moldeadora Minoxidil"`, `"Shampoo Anticaspa"`). | • Campo vacío o solo espacios. |
| **Código** | String | Opcional.<br>Alfanumérico. | • Formato libre (ej: `"PRD-01"`, `"770123456789"`).<br>• Vacío. | • Valores excesivamente largos. |
| **Descripción** | String | Opcional. | • Texto libre.<br>• Vacío. | • Límite de caracteres excedido. |
| **Stock** | Entero | Requerido.<br>Valor $\ge 0$. | • Enteros positivos o cero (ej: `0`, `1`, `50`). | • Números negativos (ej: `-5`).<br>• Números decimales (ej: `5.5`).<br>• Valores no numéricos.<br>• Campo vacío. |
| **Precio Neto** | Decimal | Requerido.<br>Valor $> 0$. | • Números decimales mayores a cero (ej: `15000`, `12500.50`). | • Valor igual a cero (`0`).<br>• Números negativos (ej: `-2500`).<br>• Valores no numéricos o vacíos. |
| **IVA (%)** | Decimal | Opcional.<br>Por defecto: `19.00`. | • Porcentaje de IVA (ej: `19.00`, `0.00`, `5.00`). | • Valores negativos (ej: `-19.00`).<br>• Caracteres no numéricos. |
| **Tipo Adquisición**| Select | Requerido.<br>Valores fijos: `compra_directa`, `consignacion`. | • `"compra_directa"`<br>• `"consignacion"` | • Valores nulos o vacíos.<br>• Opciones no válidas. |
| **Categoría** | Select | Requerido.<br>ID de categoría existente. | • ID de categoría válido (ej: `1`). | • ID inexistente o nulo. |
| **Marca** | Select | Requerido.<br>ID de marca existente. | • ID de marca válido (ej: `1`). | • ID inexistente o nulo. |
| **Imagen** | Archivo | Opcional.<br>Formatos: PNG, JPG, WEBP.<br>Tamaño máx: 5MB. | • Archivo de imagen válido (ej: `producto.png` de 2MB).<br>• Sin imagen (null). | • Archivos mayores a 5MB.<br>• Formatos no válidos (ej: `producto.pdf`, `script.js`, `image.gif`). |
| **Estado** | Select | Requerido.<br>Valores fijos: `Activo`, `Inactivo`. | • `"Activo"`<br>• `"Inactivo"` | • Valores nulos o vacíos. |

---

## Proceso 3: Gestión de Servicios

Este proceso permite la parametrización de los cortes, lavados y tratamientos capilares o de barba que ofrece el negocio.

### Reglas de Negocio
1. **Precio Mayor a Cero:** El precio del servicio no puede ser gratuito ni negativo.
2. **Duración Mínima:** La duración en minutos del servicio debe ser un número entero estrictamente mayor a 0.
3. **Cálculo de Impuestos:** El IVA está gravado al 19.00% de forma fija sobre los servicios. El frontend autocalcula la base gravable y el valor del IVA en base al precio final ingresado.

### Campos de Entrada y Clases de Equivalencia

| Campo | Tipo de Dato | Restricción / Formato | CP Positivos (Válidos) | CP Negativos / Límites (Inválidos) |
| :--- | :--- | :--- | :--- | :--- |
| **Nombre** | String | Requerido.<br>Texto alfanumérico. | • Texto descriptivo del servicio (ej: `"Corte de Cabello + Barba"`, `"Exfoliación"`). | • Campo vacío o solo espacios. |
| **Precio de Venta (Total Final)** | Decimal | Requerido.<br>Valor $> 0$. | • Decimales mayores a 0 (ej: `25000.00`, `45000`). | • Valor igual a cero (`0`).<br>• Valores negativos (ej: `-15000`).<br>• Campos no numéricos o vacíos. |
| **Duración (min)** | Entero | Requerido.<br>Valor $> 0$. | • Enteros positivos mayores a cero (ej: `30`, `45`, `120`). | • Valor igual a cero (`0`).<br>• Valores negativos (ej: `-30`).<br>• Números decimales (ej: `45.5`).<br>• Vacío o no numérico. |
| **Descripción** | String | Opcional. | • Explicación del servicio.<br>• Vacío. | • Límite de caracteres excedido. |
| **Estado** | Select | Requerido.<br>Valores fijos: `Activo`, `Inactivo`. | • `"Activo"`<br>• `"Inactivo"` | • Valores nulos o vacíos. |

---

## Proceso 4: Gestión de Citas

Este proceso gestiona el agendamiento y reserva de servicios para los clientes, asignándolos a barberos específicos en horarios definidos.

### Reglas de Negocio
1. **Restricción de Fecha:** No se permiten agendar citas con fecha anterior al día actual (fechas pasadas están denegadas).
2. **Horarios Estructurados:** Las citas solo pueden registrarse dentro del horario de atención definido por los intervalos (`timeSlots`) de `09:00` a `19:30` cada 30 minutos.
3. **No Overlap (Sin Traslapes):** Un barbero no puede tener más de una cita asignada en el mismo rango de tiempo. Se calcula en base a la hora de inicio y la duración acumulada de los servicios de la cita (`hora_inicio` a `hora_fin`).
4. **Servicio Requerido:** Toda cita debe incluir obligatoriamente al menos un servicio dentro de su detalle.

### Campos de Entrada y Clases de Equivalencia

| Campo | Tipo de Dato | Restricción / Formato | CP Positivos (Válidos) | CP Negativos / Límites (Inválidos) |
| :--- | :--- | :--- | :--- | :--- |
| **Cliente** | Select | Requerido.<br>ID de cliente registrado. | • ID existente en la base de datos (ej: `14`). | • Campo vacío.<br>• ID de cliente inexistente. |
| **Barbero** | Select | Requerido.<br>ID de empleado/barbero. | • ID existente en la base de datos (ej: `2`). | • Campo vacío.<br>• ID de barbero inexistente. |
| **Fecha** | Date | Requerido.<br>Formato `YYYY-MM-DD`.<br>$\ge$ Fecha Actual. | • Fecha actual o futura (ej: `Hoy`, `Mañana`, `2026-12-25`). | • Fecha en el pasado (ej: `Ayer`, `2020-01-01`).<br>• Formato incorrecto o fecha inválida. |
| **Hora de Inicio** | Select | Requerido.<br>Intervalos válidos de `09:00` a `19:30` sin traslapes. | • Hora seleccionada en rango y libre para el barbero (ej: `"10:30"`). | • Campo vacío.<br>• Hora que se traslapa con otra cita del mismo barbero.<br>• Horas fuera de rango laboral. |
| **Servicios Seleccionados** | Array de Objetos | Requerido.<br>Mínimo 1 servicio. | • Lista con 1 o más servicios registrados (ej: `[{ id_servicio: 1, cantidad: 1 }]`). | • Lista vacía (error: *"Debes seleccionar al menos un servicio"*).<br>• IDs de servicios inexistentes o inactivos. |
| **Productos Adicionales** | Array de Objetos | Opcional. | • Lista de productos comprados opcionalmente.<br>• Lista vacía. | • IDs de productos inexistentes o inactivos. |
| **Observaciones** | String | Opcional. | • Comentarios de texto libre (ej: `"Cliente prefiere agua fría"`).<br>• Vacío. | • Límite de caracteres excedido. |
| **Estado** | Select | Requerido.<br>Valores típicos: `pendiente`, `confirmada`, `cancelada`. | • `"pendiente"` (valor por defecto)<br>• `"confirmada"`<br>• `"cancelada"` | • Valores nulos o vacíos. |

---

## Proceso 5: Gestión de Clientes

Este proceso abarca el registro de la información de contacto y credenciales de acceso para los clientes del sistema.

### Reglas de Negocio
1. **Formato de Nombres y Apellidos:** Solo se admiten letras, espacios y caracteres especiales de acentuación usuales en español.
2. **Validación estricta de Email:** Debe poseer la estructura formal de una dirección de correo. Una vez registrado el cliente, el email queda deshabilitado para edición (solo lectura) para proteger la identidad del usuario.
3. **Seguridad de Contraseña:** En la creación del registro, la contraseña es obligatoria y debe tener una longitud mínima de 6 caracteres.
4. **Formato y Longitud Telefónica:** Debe admitir únicamente dígitos, espacios y ciertos caracteres de teléfono comunes (`+`, `-`, `()`). Además, debe contener al menos 7 dígitos reales al remover caracteres de formato.

### Campos de Entrada y Clases de Equivalencia

| Campo | Tipo de Dato | Restricción / Formato | CP Positivos (Válidos) | CP Negativos / Límites (Inválidos) |
| :--- | :--- | :--- | :--- | :--- |
| **Primer Nombre** | String | Requerido.<br>Solo letras y espacios. | • Letras y espacios (ej: `"Juan"`, `"María José"`, `"René"`). | • Campo vacío o solo espacios.<br>• Contiene números (ej: `"Juan3"`).<br>• Contiene caracteres especiales no permitidos (ej: `"Juan$"`). |
| **Segundo Nombre** | String | Requerido (según validación de formulario).<br>Solo letras y espacios. | • Letras y espacios (ej: `"Andrés"`, `"Carlos"`). | • Campo vacío o solo espacios.<br>• Contiene números o caracteres no válidos. |
| **Primer Apellido** | String | Requerido.<br>Solo letras y espacios. | • Letras y acentos (ej: `"Pérez"`, `"Gómez"`). | • Campo vacío o solo espacios.<br>• Contiene números o caracteres no válidos. |
| **Segundo Apellido** | String | Requerido.<br>Solo letras y espacios. | • Letras y acentos (ej: `"Rodríguez"`, `"Díaz"`). | • Campo vacío o solo espacios.<br>• Contiene números o caracteres no válidos. |
| **Tipo de Documento** | Select | Requerido.<br>Valores fijos: `CC`, `CE`, `NIT`, `PP`. | • `"CC"`, `"CE"`, `"NIT"`, `"PP"`. | • Valores nulos o vacíos. |
| **Documento** | String | Requerido.<br>Solo caracteres alfanuméricos/dígitos. | • Dígitos numéricos (ej: `"1020304050"`). | • Campo vacío o solo espacios. |
| **Email** | String | Requerido.<br>Formato de email estándar.<br>Inmutable en edición. | • Estructura correcta (ej: `"juan.perez@gmail.com"`). | • Campo vacío.<br>• Formato inválido (ej: `"juan"`, `"juan@com"`, `"juan.perez@.com"`). |
| **Email Confirmación** | String | Requerido (solo creación).<br>Debe ser igual al Email. | • Mismo valor que el Email ingresado. | • Campo vacío.<br>• No coincide con el email principal (ej: `"juan@gmail.com"` vs `"juan2@gmail.com"`). |
| **Password** | String | Requerido (solo creación).<br>Mínimo 6 caracteres. | • Cadenas de 6 o más caracteres (ej: `"123456"`, `"ClaveSegura2026"`). | • Campo vacío en creación.<br>• Menor a 6 caracteres (ej: `"123"`). |
| **Confirm Password** | String | Requerido si se digita contraseña.<br>Debe ser igual al Password. | • Coincidencia exacta con la contraseña. | • Diferente a la contraseña ingresada. |
| **Teléfono** | String | Requerido.<br>Solo dígitos/formato telefónico.<br>Mínimo 7 dígitos. | • Formato válido $\ge 7$ dígitos (ej: `"3001234567"`, `"+57 (1) 234-5678"`). | • Campo vacío.<br>• Letras o símbolos no telefónicos.<br>• Menos de 7 dígitos reales (ej: `"12345"`). |
| **Dirección** | String | Opcional.<br>Formato de dirección válido. | • Formato con caracteres permitidos: letras, números, espacios y símbolos `. , # ° ' -` (ej: `"Calle 10 # 5-20 Apto 301"`).<br>• Vacío. | • Caracteres especiales denegados (ej: `"Calle 10 $ 5-20 %"`, contiene `$`, `%`, `@`, etc.). |
| **Estado** | Select | Requerido.<br>Valores fijos: `Activo`, `Inactivo`. | • `"Activo"`<br>• `"Inactivo"` | • Valores nulos o vacíos. |

---

## Proceso 6: Gestión de Ventas

Este proceso gestiona el registro de la transacción final de facturación, donde se detallan los productos vendidos y servicios prestados a un cliente.

### Reglas de Negocio
1. **Transacción No Vacía:** Una venta debe incluir obligatoriamente por lo menos un ítem (producto o servicio) en su listado de detalles.
2. **Validación de Stock Físico:** Al añadir productos a la venta, el sistema valida que la cantidad ingresada no sea superior al stock actual del inventario. Si el stock es insuficiente, se bloquea la adición del ítem.
3. **Cantidades Positivas:** Las cantidades en los ítems de venta deben ser números enteros estrictamente mayores a cero.
4. **Cliente Opcional:** Se permite registrar ventas para clientes de paso utilizando la opción "Cliente General" (ID `null` o `'0'`). Si se especifica un cliente registrado, este debe estar en estado "Activo".
5. **Cálculo Fijo de IVA:** El precio neto de cada ítem es obtenido automáticamente del catálogo, y se procesa el subtotal acumulado para la facturación.

### Campos de Entrada y Clases de Equivalencia

| Campo | Tipo de Dato | Restricción / Formato | CP Positivos (Válidos) | CP Negativos / Límites (Inválidos) |
| :--- | :--- | :--- | :--- | :--- |
| **Cliente** | Select | Opcional. | • ID de cliente activo registrado (ej: `12`).<br>• `"0"` o Vacío (Representa `"Cliente General"`). | • ID de cliente inactivo.<br>• ID de cliente inexistente. |
| **Vendedor** | Select | Requerido.<br>ID del empleado/usuario. | • ID de usuario de caja activo (ej: `1`). | • Campo vacío o nulo.<br>• ID de vendedor inexistente. |
| **Método de Pago** | Select | Requerido.<br>Valores: `Efectivo`, `Tarjeta`, `Transferencia`, etc. | • `"Efectivo"` (defecto)<br>• `"Tarjeta"`<br>• `"Transferencia"` | • Valores nulos o vacíos. |
| **Ítems a Vender** | Array de Objetos | Requerido.<br>Mínimo 1 ítem en lista. | • Arreglo con 1 o más productos/servicios válidos (ej: `[{ id_item: 5, tipo: "producto", cantidad: 2 }]`). | • Lista vacía (error: *"Agrega al menos un producto o servicio"*). |
| **Cantidad por Ítem** | Entero | Requerido.<br>Valor $> 0$.<br>Para productos: $\le$ Stock Disponible. | • Cantidad válida (ej: `1`, `2`, `10` si el stock es $\ge 10$). | • Cantidades menores o iguales a cero (`0`, `-2`).<br>• Decimales.<br>• Cantidad superior al stock físico disponible del producto (error: *"Stock insuficiente"*). |
