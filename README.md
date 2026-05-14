# Frontend ABET

Frontend en Next.js (App Router) para el sistema de acreditacion ABET. Este README describe como funciona el generator, la estructura de la app, i18n, providers y las piezas globales.

## Requisitos

- Node.js 18+ (recomendado)
- npm / yarn / pnpm

## Scripts

```bash
npm run dev
npm run build
npm run start
npm run lint
```

## Estructura principal

```
src/
  app/                # Rutas y layouts de Next.js (App Router)
  modules/            # Modulos de dominio (auth, tests, etc.)
  shared/             # UI y utilidades compartidas
  providers/          # Contextos globales
  languaje/           # i18n (json de traducciones)
public/
  assets/             # Imagenes estaticas (logo, etc.)
```

Notas:
- `src/app` solo orquesta pantallas y conecta modulos (no logica de negocio compleja).
- `src/modules` contiene logica de dominio, servicios y paginas reutilizables.
- `src/shared` contiene UI, hooks, utils y tipos globales.
- `src/providers` centraliza contextos globales.
- `src/languaje` contiene los mensajes de i18n (nota: el folder se llama "languaje").

## Rutas y layouts (App Router)

- `src/app/layout.tsx`: layout raiz. Inyecta `LocaleProvider` y `LayoutClient`.
- `src/app/(protected)/layout.tsx`: layout cliente para rutas protegidas.
- `src/app/[locale]/layout.tsx`: layout de locale (placeholder actual).
- `src/app/page.tsx`: home. Renderiza `HomeClient`.
- `src/app/auth/login/page.tsx`: login.
- `src/app/tests/*`: paginas demo para UI (modals, charts, tables, public).

### Auth guard y middleware

- `middleware.ts` redirige a `/auth/login` si no existe cookie `bearerToken` y la ruta no es `/auth/*`.
- `useAuthGuard` (en `src/shared/hooks/useAuthGuard.ts`) verifica `bearerToken` en `localStorage` y redirige a login.
- `LayoutClient` aplica el guard en rutas no-auth y monta `Navbar` + `AppSidebar`.

## Providers globales

- `LocaleProvider` (i18n) en `src/providers/locale-provider.tsx`.
- `ABETProvider` en `src/providers/abet-provider.tsx` (estado global de modalidad).
- `SidebarProvider` re-exporta el provider de UI.

`LayoutClient` es el punto de composicion de providers globales y layout visual.

## i18n (languaje / locales)

Los mensajes viven en:
- `src/languaje/locales/es.json`
- `src/languaje/locales/en.json`

`LocaleProvider` expone:
- `locale`: `es` o `en`
- `setLocale(nextLocale)`
- `t('ruta.clave')`

El locale se persiste en:
- `localStorage` con la key `app_locale`
- `document.documentElement.lang`
- cookie `app_locale` (max-age 1 anio)

### Agregar una nueva traduccion

1. Agrega la clave en `es.json` y `en.json`.
2. Usa `t('tu.clave')` desde componentes o modulos.
3. Si es texto de UI global, prefierelo en `shared/components`.

## Sidebar y navegacion

- `AppSidebar` construye el menu usando `t('nav.*')`.
- Para rutas nuevas, agrega un item en el `navigation` o usa el generator (ver abajo).

## Modulos

### Estructura estandar de un modulo

```
src/modules/<modulo>/
  components/
  constants/
  hooks/
  pages/
  schemas/
  services/
  index.ts
```

### Modulo `auth`

- `src/modules/auth/Login.tsx`: pantalla de login.
- `LoginForm` usa `loginMock` (servicio local) y guarda `bearerToken` en `localStorage`.
- Credenciales demo actuales (segun `authService.ts`):
  - `codigo=demo`, `password=demo`
  - `codigo=Admi`, `password=abet123`

### Modulo `tests`

Contiene paginas demo de UI para validar componentes compartidos:
- `charts`, `tables`, `modals`, `public`

## Generator de modulos

El generator crea un modulo completo y la ruta asociada.

### Compilar scripts

```bash
npx tsc -p tsconfig.scripts.json
```

### Crear un modulo

```bash
node dist-scripts/generator/crear-modulo.js <nombre-modulo>
```

### Que genera

Para `rubricas`, crea:

- `src/modules/rubricas/` con subcarpetas y `index.ts` por cada una.
- `src/modules/rubricas/services/rubricasService.ts` con CRUD basico (usa `NEXT_PUBLIC_API_URL`).
- `src/modules/rubricas/index.ts` (barrel).
- `src/app/rubricas/page.tsx` con pagina basica.
- Agrega un item al `navigation` en `src/app/components/app-sidebar.tsx` (usa `FolderIcon`).

### Notas del generator

- Si la ruta ya existe en el sidebar, no la duplica.
- Si no encuentra `const navigation`, avisa en consola.
- Para personalizar el service, edita el archivo generado en `services/`.

## Configuracion global y constantes

- `src/shared/constants/app.ts` define `APP_NAME`, `APP_DESCRIPTION`, `DEFAULT_LOCALE`, `STORAGE_KEYS`, etc.
- `src/app/layout.tsx` consume esas constantes para `metadata`.

## UI compartida

`src/shared/components` contiene:
- Componentes base (Button, Card, Input, Select, Table, Dialogs, etc.)
- Layout (Navbar, Sidebar)
- `LanguageSwitcher` para cambiar idioma

## Assets

- Logo en `public/assets/ABETLogo.png`.

## Variables de entorno

Actualmente se usa:
- `NEXT_PUBLIC_API_URL` (generator la usa para construir URLs en services).

Si agregas mas variables, documentalas aqui y mantenlas en `.env.local`.

## Flujo rapido de desarrollo

1. Inicia el dev server.
2. Usa el login demo para entrar.
3. Explora `/tests/*` para ver componentes.
4. Crea nuevos modulos con el generator cuando sea posible.
