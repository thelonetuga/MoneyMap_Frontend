#!/bin/sh

# Criar o ficheiro de configuração em tempo de execução
echo "window.__ENV__ = {" > ./public/env-config.js
echo "  NEXT_PUBLIC_API_URL: \"$NEXT_PUBLIC_API_URL\"" >> ./public/env-config.js
echo "};" >> ./public/env-config.js

# Executar o comando original (iniciar o servidor)
exec "$@"