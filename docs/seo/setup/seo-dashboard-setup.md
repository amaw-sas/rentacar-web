# SEO Dashboard - Guía de Configuración

## Requisitos

1. **Variable de entorno**: `SEO_PASSWORD`

## Configuración Local

1. Crear archivo `.env.local` en la raíz del proyecto:

```bash
# .env.local
SEO_PASSWORD=tu-password-seguro-aqui
```

2. Iniciar el servidor de desarrollo:

```bash
npm run dev
```

3. Acceder a: `http://localhost:3000/seo`

## Configuración en Producción (Firebase)

1. Configurar la variable de entorno en Firebase:

```bash
firebase functions:config:set seo.password="tu-password-seguro"
```

2. O agregar en el archivo de configuración de secretos de Firebase.

## Acceso al Dashboard

1. Ir a `/seo`
2. Serás redirigido a `/seo/login`
3. Ingresar la contraseña configurada
4. La sesión dura 7 días

## Páginas Disponibles

| Ruta | Descripción |
|------|-------------|
| `/seo` | Overview con KPIs principales |
| `/seo/backlinks` | Tracking de backlinks |
| `/seo/tareas` | Checklist y activity tracking |
| `/seo/keywords` | Posiciones y targets |
| `/seo/contenido` | Blog, internal links, CTR |
| `/seo/competidores` | Comparativa DA |
| `/seo/rendimiento` | GSC + Core Web Vitals |
| `/seo/herramientas` | MCPs y cuotas |

## Notas de Seguridad

- El dashboard está protegido con autenticación
- Las rutas `/seo/*` están excluidas de sitemap y robots.txt
- La cookie de sesión es HttpOnly y SameSite
