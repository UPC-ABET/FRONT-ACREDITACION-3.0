"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const moduleName = process.argv[2];
if (!moduleName) {
    console.error('Debes indicar el nombre del módulo');
    process.exit(1);
}
const moduleNameCapitalized = moduleName.charAt(0).toUpperCase() + moduleName.slice(1);
const projectRoot = path.resolve(__dirname, '../../');
const basePath = path.join(projectRoot, 'src/modules', moduleName);
// ── Subcarpetas ──────────────────────────────────────────────────────────────
const subfolders = [
    { name: 'components', doc: `/**\n * COMPONENTS\n *\n * Componentes visuales del módulo ${moduleName}.\n */\n\nexport {}` },
    { name: 'constants', doc: `/**\n * CONSTANTS\n *\n * Constantes del módulo ${moduleName}.\n */\n\nexport {}` },
    { name: 'hooks', doc: `/**\n * HOOKS\n *\n * Hooks personalizados del módulo ${moduleName}.\n */\n\nexport {}` },
    { name: 'pages', doc: `/**\n * PAGES\n *\n * Páginas del módulo ${moduleName}.\n */\n\nexport {}` },
    { name: 'schemas', doc: `/**\n * SCHEMAS\n *\n * Esquemas de validación del módulo ${moduleName}.\n */\n\nexport {}` },
    { name: 'services', doc: `/**\n * SERVICES\n *\n * Servicios del módulo ${moduleName}.\n */\n\nexport { ${moduleName}Service } from './${moduleName}Service';` },
];
// ── 1. Crear carpetas + index.ts de cada subcarpeta ──────────────────────────
fs.mkdirSync(basePath, { recursive: true });
for (const folder of subfolders) {
    const folderPath = path.join(basePath, folder.name);
    fs.mkdirSync(folderPath, { recursive: true });
    fs.writeFileSync(path.join(folderPath, 'index.ts'), folder.doc, { encoding: 'utf8' });
}
// ── 2. Servicio CRUD en su propio archivo ────────────────────────────────────
const serviceContent = `import { apiGet, apiPost, apiPut, apiDelete } from '@/shared/lib';

export interface ${moduleNameCapitalized} {
    id: string | number;
    [key: string]: unknown;
}

export interface PaginatedResponse<T> {
    data: T[];
    total: number;
    page: number;
    limit: number;
}

export const ${moduleName}Service = {
    getAll(page = 1, limit = 20): Promise<PaginatedResponse<${moduleNameCapitalized}>> {
        return apiGet(\`/${moduleName}?page=\${page}&limit=\${limit}\`);
    },

    getById(id: string | number): Promise<${moduleNameCapitalized}> {
        return apiGet(\`/${moduleName}/\${id}\`);
    },

    create(body: Omit<${moduleNameCapitalized}, 'id'>): Promise<${moduleNameCapitalized}> {
        return apiPost(\`/${moduleName}\`, body);
    },

    update(id: string | number, body: Partial<Omit<${moduleNameCapitalized}, 'id'>>): Promise<${moduleNameCapitalized}> {
        return apiPut(\`/${moduleName}/\${id}\`, body);
    },

    delete(id: string | number): Promise<void> {
        return apiDelete(\`/${moduleName}/\${id}\`);
    },
};
`;
fs.writeFileSync(path.join(basePath, 'services', `${moduleName}Service.ts`), serviceContent, { encoding: 'utf8' });
// ── 3. index.ts raíz del módulo (barrel) ────────────────────────────────────
const barrelContent = `/**
 * ${moduleNameCapitalized.toUpperCase()} MODULE
 *
 * Punto de entrada del módulo ${moduleName}.
 */

export * from './components';
export * from './constants';
export * from './hooks';
export * from './pages';
export * from './schemas';
export * from './services';
`;
fs.writeFileSync(path.join(basePath, 'index.ts'), barrelContent, { encoding: 'utf8' });
// ── 4. page.tsx en src/app/[modulo] ─────────────────────────────────────────
const appPageDir = path.join(projectRoot, 'src/app', moduleName);
fs.mkdirSync(appPageDir, { recursive: true });
const pageContent = `export default function Page() {
  return <div>Bienvenido a ${moduleNameCapitalized}</div>;
}
`;
fs.writeFileSync(path.join(appPageDir, 'page.tsx'), pageContent, { encoding: 'utf8' });
// ── 5. Agregar ruta al sidebar ───────────────────────────────────────────────
const sidebarPath = path.join(projectRoot, 'src/app/components/app-sidebar.tsx');
if (fs.existsSync(sidebarPath)) {
    let sidebarContent = fs.readFileSync(sidebarPath, 'utf8');
    const navEntry = `  { name: '${moduleNameCapitalized}', href: '/${moduleName}', icon: FolderIcon },`;
    if (sidebarContent.includes(`href: '/${moduleName}'`)) {
        console.log('⚠️  La ruta ya existe en el navigation.');
    }
    else {
        // Encuentra donde empieza el array navigation
        const navStart = sidebarContent.indexOf('const navigation');
        const equalsSign = sidebarContent.indexOf('=', navStart);
        const arrayOpen = sidebarContent.indexOf('[', equalsSign);
        if (navStart === -1 || arrayOpen === -1) {
            console.warn(`⚠️  No se encontró "const navigation" en el sidebar.`);
        }
        else {
            // Recorre carácter a carácter contando [ y ] para encontrar el ] que cierra navigation
            let depth = 0;
            let closingIndex = -1;
            for (let i = arrayOpen; i < sidebarContent.length; i++) {
                const char = sidebarContent[i];
                if (char === '[')
                    depth++;
                if (char === ']') {
                    depth--;
                    if (depth === 0) {
                        closingIndex = i;
                        break;
                    }
                }
            }
            if (closingIndex === -1) {
                console.warn(`⚠️  No se encontró el cierre del array navigation.`);
            }
            else {
                // Inserta la nueva entrada justo antes del ] de cierre
                sidebarContent =
                    sidebarContent.slice(0, closingIndex) +
                        `\n${navEntry}\n` +
                        sidebarContent.slice(closingIndex);
                // Asegura que FolderIcon esté importado
                if (!sidebarContent.includes('FolderIcon')) {
                    sidebarContent = sidebarContent.replace(/(import \{[^}]+)(} from '@heroicons\/react\/24\/outline')/, `$1  FolderIcon,\n$2`);
                }
                fs.writeFileSync(sidebarPath, sidebarContent, { encoding: 'utf8' });
                console.log(`✅ Ruta agregada al sidebar: /${moduleName}`);
            }
        }
    }
}
else {
    console.warn('⚠️  No se encontró app-sidebar.tsx.');
}
console.log(`\n✅ Módulo "${moduleName}" creado:`);
console.log(`   src/modules/${moduleName}/index.ts`);
console.log(`   src/modules/${moduleName}/services/index.ts`);
console.log(`   src/modules/${moduleName}/services/${moduleName}Service.ts`);
console.log(`   src/app/${moduleName}/page.tsx`);
