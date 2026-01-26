# NexusArcade 🎮

NexusArcade es una plataforma de juegos rápidos construida con **Laravel** (Backend) y **React** (Frontend).

## 🚀 Requisitos Previos

Antes de comenzar, asegúrate de tener instalado:
- [XAMPP](https://www.apachefriends.org/es/index.html) (con PHP >= 8.2 y MySQL).
- [Node.js y npm](https://nodejs.org/).
- [Composer](https://getcomposer.org/).

## 🛠️ Instalación Local (XAMPP)

Sigue estos pasos para configurar el proyecto en tu máquina local:

### 1. Clonar el repositorio
Si aún no lo has hecho, clona el proyecto en tu carpeta `htdocs` de XAMPP:
```bash
cd C:\xampp\htdocs
git clone https://github.com/Mateo9804/NexusArcade.git
cd NexusArcade
```

### 2. Configuración del Backend (Laravel)
Entra en la carpeta del backend e instala las dependencias:
```bash
cd backend
composer install
npm install
```

Configura el archivo de entorno:
- Copia el archivo `.env.example` a `.env`.
- Crea una base de datos en MySQL (vía phpMyAdmin) llamada `nexus_arcade` (o el nombre que prefieras).
- Actualiza las credenciales de la base de datos en el archivo `.env`.

Genera la clave de la aplicación y ejecuta las migraciones:
```bash
php artisan key:generate
php artisan migrate
```

### 3. Configuración del Frontend (React)
Entra en la carpeta del frontend e instala las dependencias de Node:
```bash
cd ../frontend
npm install
```

## 🏃‍♂️ Cómo ejecutar el proyecto

Para ver el proyecto funcionando, solo necesitas ejecutar un comando desde la carpeta `frontend`:

### Iniciar Frontend y Backend simultáneamente
```bash
cd frontend
npm run dev
```
Esto iniciará:
- El servidor de **Vite** (Frontend) normalmente en `http://localhost:5173`.
- El servidor de **PHP local** (Backend) en `http://localhost:8000` apuntando a la carpeta public.

---
Desarrollado por [Mateo9804](https://github.com/Mateo9804).

