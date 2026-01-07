#!/bin/bash

# Script para realizar backups automáticos de la base de datos PostgreSQL
# Este script está diseñado para ser ejecutado por un cron job.

# --- CONFIGURACIÓN ---
# Directorio donde se encuentra este script y los archivos .env
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
PROJECT_ROOT="$SCRIPT_DIR/.."

# Directorio donde se guardarán los backups
BACKUP_DIR="$PROJECT_ROOT/backups"

# Número de días que se conservarán los backups
RETENTION_DAYS=7

# --- Cargar variables de entorno de la base de datos ---
# Carga las variables desde el archivo .env.db para no exponerlas en el script
if [ -f "$PROJECT_ROOT/.env.db" ]; then
  export $(grep -v '^#' "$PROJECT_ROOT/.env.db" | xargs)
else
  echo "Error: El archivo .env.db no se encuentra en $PROJECT_ROOT"
  exit 1
fi

# --- LÓGICA DEL SCRIPT ---

echo "Iniciando proceso de backup..."

# Crear el directorio de backups si no existe
mkdir -p "$BACKUP_DIR"

# 1. Conectarse a la base de datos para verificar si los backups están activados
# Se usa PGPASSWORD para evitar que el comando psql pida la contraseña interactivamente.
echo "Verificando el estado de la configuración 'backup_automatico'..."
IS_BACKUP_ENABLED=$(PGPASSWORD=$POSTGRES_PASSWORD psql -h db -U $POSTGRES_USER -d $POSTGRES_DB -t -c "SELECT valor FROM configuracion WHERE clave = 'backup_automatico';")

# Limpiar espacios en blanco de la respuesta
IS_BACKUP_ENABLED=$(echo "$IS_BACKUP_ENABLED" | xargs)

if [ "$IS_BACKUP_ENABLED" != "true" ]; then
  echo "Los backups automáticos están desactivados en la configuración. Saliendo."
  exit 0
fi

echo "Los backups automáticos están activados. Procediendo..."

# 2. Crear el nombre del archivo de backup con la fecha y hora
TIMESTAMP=$(date +"%Y-%m-%d_%H-%M-%S")
BACKUP_FILE="$BACKUP_DIR/${POSTGRES_DB}_${TIMESTAMP}.sql.gz"

# 3. Ejecutar pg_dump y comprimir la salida
# Se usa el nombre del servicio 'db' como host porque este script se ejecutará desde el host
# y se conectará al contenedor de la base de datos a través de la red de Docker.
echo "Creando backup de la base de datos '$POSTGRES_DB' en '$BACKUP_FILE'..."

PGPASSWORD=$POSTGRES_PASSWORD pg_dump -h db -U $POSTGRES_USER -d $POSTGRES_DB | gzip > "$BACKUP_FILE"

# Verificar si el backup se creó correctamente
if [ ${PIPESTATUS[0]} -eq 0 ]; then
  echo "Backup creado exitosamente."
else
  echo "Error: Falló la creación del backup."
  exit 1
fi

# 4. Eliminar backups antiguos
echo "Eliminando backups con más de $RETENTION_DAYS días de antigüedad..."
find "$BACKUP_DIR" -type f -name "*.sql.gz" -mtime +$RETENTION_DAYS -exec rm {} \;

echo "Proceso de backup finalizado."
exit 0
# Fin del script