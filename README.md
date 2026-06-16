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

# Introducción 
En los años 90, cuando las páginas web comenzaron a ser interactivas y a conectarse directamente con las bases de datos, surgieron nuevos riesgos de seguridad. En ese contexto apareció la Inyección SQL, registrada por primera vez en 1998.

A pesar de todo lo que ha avanzado la tecnología y la programación desde entonces, esta amenaza no ha desaparecido. Hoy en día, prevenirla sigue siendo un requisito obligatorio y fundamental al desarrollar cualquier sistema que maneje información.

# ¿Qué es SQL Injection?
La Inyección SQL es un ataque que consiste en insertar código SQL malicioso directamente en los campos de entrada de datos de una aplicación, tales como formularios de inicio de sesión, barras de búsqueda o parámetros de la URL.  
Esta vulnerabilidad ocurre principalmente cuando un sistema no filtra, sanitiza ni valida adecuadamente la información ingresada por el usuario. Como resultado, cuando la aplicación procesa esta entrada, el motor de la base de datos recibe el código manipulado y lo ejecuta bajo la premisa de que es una instrucción legítima del sistema.  
En la práctica, este ataque se aprovecha de la mala costumbre de concatenar texto directamente en las consultas del backend. Al explotar esta falla, un atacante puede alterar la lógica original de la base de datos para evadir autenticaciones, extraer información confidencial o ejecutar comandos destructivos.

