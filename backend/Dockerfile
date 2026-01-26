FROM php:8.2-apache

# Instalar dependencias del sistema necesarias
RUN apt-get update && apt-get install -y \
    libpq-dev \
    zip \
    unzip \
    git \
    && docker-php-ext-install pdo_pgsql \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# Activar el módulo de reescritura de Apache (necesario para Laravel)
RUN a2enmod rewrite

# Instalar Composer directamente
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# Establecer el directorio de trabajo
WORKDIR /var/www/html

# Copiar archivos de configuración primero (para optimizar cache)
COPY composer.json composer.lock ./

# Instalar dependencias de Laravel (con flags para ahorrar memoria)
RUN composer install --no-dev --optimize-autoloader --no-scripts --no-interaction

# Copiar el resto de los archivos
COPY . .

# Dar permisos a las carpetas de Laravel
RUN chown -R www-data:www-data storage bootstrap/cache

# Cambiar la raíz de Apache a la carpeta /public de Laravel
ENV APACHE_DOCUMENT_ROOT /var/www/html/public
RUN sed -ri -e 's!/var/www/html!${APACHE_DOCUMENT_ROOT}!g' /etc/apache2/sites-available/*.conf
RUN sed -ri -e 's!/var/www/html!${APACHE_DOCUMENT_ROOT}!g' /etc/apache2/apache2.conf /etc/apache2/conf-available/*.conf

# Exponer el puerto 80
EXPOSE 80

# Comando final: Migraciones + Apache
CMD php artisan migrate --force && apache2-foreground
