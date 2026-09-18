# Sistema de Estacionamiento Privado - API

## Descripción
API RESTful desarrollada para optimizar la gestión vehicular en playas de estacionamiento con alto flujo de tráfico (basada en la problemática del microcentro de Tucumán). 

El sistema permite registrar de forma agil el ingreso de vehículos, consultar autos actualmente estacionados y procesar la salida, asegurando la integridad de los datos entre propietarios y vehículos mediante un modelo relacional eficiente.

## Stack Tecnológico

* **JavaScript (Node.js)**: Lenguaje y entorno de ejecución para el servidor.
* **Express**: Framework para la creación de la API REST.
* **Prisma v7**: ORM para el modelado de datos, migraciones y consultas seguras.
* **PostgreSQL**: Base de datos relacional para garantizar la integridad de la información.
* **Supabase**: Plataforma en la nube para el alojamiento y gestión de PostgreSQL.

## Modelado de Datos

La base de datos utiliza un esquema relacional donde las entidades **Usuario** y **Auto** se vinculan mediante una relación 1 a 1:

* **Relación 1:1**: Cada registro de ingreso asocia a un usuario con un único vehículo mediante la clave `usuarioId`.
* **Unicidad de patente (`@unique`)**: El campo `patente` cuenta con la restricción `@unique` para evitar registros duplicados de un mismo vehículo en el sistema.
* **Control de estado (`activo`)**: Campo booleano en la tabla `Auto` que permite filtrar rápidamente los vehículos que se encuentran actualmente en la playa de estacionamiento (`true`) de aquellos que ya procesaron su salida (`false`).

## Endpoints de la API

La API responde en formato JSON y maneja los códigos de estado HTTP estándar (`200`, `201`, `400`, `404`, `409`).

### 1. Obtener vehiculos activos
* **Ruta**: `GET /usuarios`
* **Descripción**: Devuelve la lista de usuarios con los autos que se encuentran estacionados en el momento (`activo: true`).
* **Respuesta (200)**: Array de objetos con datos del usuario y su vehiculo.

### 2. Registrar ingreso
* **Ruta**: `POST /usuarios`
* **Descripción**: Registra el ingreso de un nuevo vehiculo y su dueño en una sola operacion.
* **Cuerpo de la peticion (JSON)**:
  ```json
  {
    "modeloAuto": "Fiat Cronos",
    "patente": "AA123BB"
  }