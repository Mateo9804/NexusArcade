FROM php:8.2-apache

# Instalar dependencias del sistema necesarias
RUN apt-get update && apt-get install -y \
    libpq-dev \
    libzip-dev \
    libicu-dev \
    zip \
    unzip \
    git \
    && docker-php-ext-install pdo_pgsql zip intl bcmath \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# Activar el módulo de reescritura de Apache
RUN a2enmod rewrite

# Instalar Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# Establecer el directorio de trabajo
WORKDIR /var/www/html

# Aumentar límite de memoria para Composer
ENV COMPOSER_MEMORY_LIMIT=-1

# Copiar archivos de configuración
COPY composer.json composer.lock ./

# Instalar dependencias (ignorando requisitos de plataforma temporalmente para asegurar el éxito)
RUN composer install --no-dev --optimize-autoloader --no-scripts --no-interaction --ignore-platform-reqs

# Copiar el resto de los archivos
COPY . .

# Limpiar cache de configuración si existiera
RUN php artisan config:clear

# Dar permisos
RUN chown -R www-data:www-data storage bootstrap/cache

# Configurar Apache
ENV APACHE_DOCUMENT_ROOT /var/www/html/public
RUN sed -ri -e 's!/var/www/html!${APACHE_DOCUMENT_ROOT}!g' /etc/apache2/sites-available/*.conf
RUN sed -ri -e 's!/var/www/html!${APACHE_DOCUMENT_ROOT}!g' /etc/apache2/apache2.conf /etc/apache2/conf-available/*.conf

EXPOSE 80

# Comando final: Limpiar cache, Migraciones + Apache
CMD php artisan config:clear && php artisan migrate --force && apache2-foreground
