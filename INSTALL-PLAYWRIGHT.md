# Instalación de Playwright para pruebas E2E

## Estado actual

✅ Playwright instalado (v1.57.0)
✅ Navegadores descargados (Chromium, Firefox, WebKit)
⚠️ Faltan dependencias del sistema (solo para WSL/Linux)

## Opciones de instalación

### Opción 1: Script automático (Recomendado)

```bash
./e2e/install-deps.sh
```

Este script instalará todas las dependencias del sistema necesarias. Requiere `sudo`.

### Opción 2: Instalación manual con sudo

```bash
sudo npx playwright install-deps
```

### Opción 3: Ejecutar sin instalar dependencias

Si no puedes instalar las dependencias del sistema, puedes ejecutar las pruebas solo en Chromium headless, que requiere menos dependencias:

```bash
pnpm test:e2e:chromium
```

## Verificar instalación

```bash
# Verificar versión
npx playwright --version

# Ejecutar prueba simple
pnpm test:e2e:chromium e2e/homepage.spec.ts
```

## Dependencias faltantes en WSL

Si estás en WSL y ves advertencias sobre librerías faltantes, necesitarás instalar:

```bash
sudo apt-get update
sudo apt-get install -y \
    libgtk-4-1 \
    libgraphene-1.0-0 \
    libwoff2-1.0.2 \
    libvpx9 \
    libevent-2.1-7 \
    libopus0 \
    libavif16 \
    libharfbuzz-icu0 \
    libenchant-2-2 \
    libsecret-1-0 \
    libhyphen0 \
    libmanette-0.2-0 \
    libx264-dev
```

O simplemente ejecuta:

```bash
sudo npx playwright install-deps chromium
```

## Solución de problemas

### Error: "Host system is missing dependencies"

**Causa:** Faltan librerías del sistema en WSL/Linux.

**Solución:**
1. Ejecuta `sudo npx playwright install-deps`
2. O ejecuta solo `pnpm test:e2e:chromium` (requiere menos dependencias)

### Error: "sudo: a terminal is required"

**Causa:** El script necesita privilegios de administrador.

**Solución:**
1. Ejecuta manualmente con sudo: `sudo npx playwright install-deps`
2. O pide al administrador del sistema que instale las dependencias

### Las pruebas funcionan pero sin GUI

Esto es normal en WSL. Las pruebas E2E pueden ejecutarse en modo headless (sin interfaz gráfica visible) sin problemas.

## Ejecutar pruebas

Una vez instalado todo:

```bash
# Todas las pruebas
pnpm test:e2e

# Solo Chromium (más rápido)
pnpm test:e2e:chromium

# Con interfaz visual (si tienes X server)
pnpm test:e2e:ui

# Ver navegador durante las pruebas
pnpm test:e2e:headed

# Modo debug
pnpm test:e2e:debug
```

## CI/CD

Para ejecutar en CI/CD (GitHub Actions, GitLab CI, etc.), usa la imagen oficial de Playwright:

```yaml
# Ejemplo GitHub Actions
- uses: microsoft/playwright-github-action@v1
- run: pnpm install
- run: pnpm test:e2e
```

O usa el contenedor Docker oficial:

```dockerfile
FROM mcr.microsoft.com/playwright:v1.57.0-noble
```
