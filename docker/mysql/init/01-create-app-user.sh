#!/bin/sh
set -eu

case "${DB_NAME}${DB_USER}" in
  *[!A-Za-z0-9_]*)
    echo "DB_NAME and DB_USER may only contain letters, numbers, and underscores."
    exit 1
    ;;
esac

DB_PASSWORD_ESCAPED=$(printf "%s" "${DB_PASSWORD}" | sed "s/'/''/g")

mysql -uroot -p"${MYSQL_ROOT_PASSWORD}" <<SQL
CREATE DATABASE IF NOT EXISTS ${DB_NAME};
CREATE USER IF NOT EXISTS '${DB_USER}'@'%' IDENTIFIED BY '${DB_PASSWORD_ESCAPED}';
ALTER USER '${DB_USER}'@'%' IDENTIFIED BY '${DB_PASSWORD_ESCAPED}';
REVOKE ALL PRIVILEGES, GRANT OPTION FROM '${DB_USER}'@'%';
GRANT SELECT, INSERT, UPDATE, DELETE ON ${DB_NAME}.* TO '${DB_USER}'@'%';
FLUSH PRIVILEGES;
SQL
