# Prodytec — sitio web

Rediseño moderno del sitio institucional de Prodytec S.A., inspirado en el contenido de
[prodytecweb.com](https://www.prodytecweb.com) pero con una estética actual (dark/tech, glassmorphism,
animaciones sutiles) y arquitectura en capas.

## Estructura del proyecto

```
Prodyweb/
├── frontend/               # Sitio estático (HTML + CSS + JS, sin build step)
│   ├── index.html, nosotros.html, servicios.html, soluciones.html,
│   │   blog.html, blog-*.html, contacto.html
│   ├── partials/           # header.html / footer.html, inyectados por JS en cada página
│   └── assets/
│       ├── css/            # variables, base, layout, components + estilos por página
│       ├── js/              # main.js (nav, animaciones, partials) y contact-form.js
│       └── img/
│
└── backend/                 # API Express en capas
    ├── server.js             # punto de entrada
    └── src/
        ├── app.js            # configuración de Express (middlewares, estáticos, rutas)
        ├── config/           # env.js, mailer.js
        ├── routes/           # definición de endpoints
        ├── controllers/      # capa HTTP (req/res)
        ├── services/         # lógica de negocio
        ├── repositories/     # acceso a datos (backend/data/contacts.json)
        ├── middlewares/       # validación, rate limiting, manejo de errores
        └── utils/             # logger
```

## Cómo correrlo localmente

```bash
cd backend
npm install
cp .env.example .env   # opcional: completar SMTP para recibir emails de contacto
npm run dev            # o "npm start"
```

El servidor Express sirve el frontend estático y expone la API en `http://localhost:4000`.
Abrí `http://localhost:4000` en el navegador para ver el sitio completo.

## Formulario de contacto

`POST /api/contact` valida los datos, guarda cada consulta en `backend/data/contacts.json` y, si se
configuran las variables `SMTP_*` en `.env`, envía además un email de notificación. Sin SMTP configurado,
el formulario sigue funcionando y las consultas quedan guardadas localmente.

## Contenido de referencia

Los textos institucionales (historia, valores, productos Etherius, datos de contacto) se basaron en el
contenido público de prodytecweb.com al 2026-07-30, reescrito y reorganizado para el nuevo diseño.
