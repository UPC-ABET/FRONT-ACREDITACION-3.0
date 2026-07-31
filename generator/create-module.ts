import * as fs from 'fs';
import * as path from 'path';

const moduleName = process.argv[2];
if (!moduleName) {
	console.error('Usage: node dist-scripts/generator/crear-modulo.js <module-name>');
	process.exit(1);
}

const moduleNameCapitalized = moduleName.charAt(0).toUpperCase() + moduleName.slice(1);
const projectRoot = path.resolve(__dirname, '../../');
const basePath = path.join(projectRoot, 'src/modules', moduleName);

fs.mkdirSync(path.join(basePath, 'types'), { recursive: true });
fs.mkdirSync(path.join(basePath, 'services'), { recursive: true });
fs.mkdirSync(path.join(basePath, 'pages'), { recursive: true });

const typesContent = `export interface ${moduleNameCapitalized} {
	id: string | number;
	[key: string]: unknown;
}

export interface PaginatedResponse<T> {
	data: T[];
	total: number;
	page: number;
	limit: number;
}
`;

fs.writeFileSync(path.join(basePath, 'types', 'index.ts'), typesContent, { encoding: 'utf8' });

const serviceContent = `import { apiGet, apiPost, apiPut, apiDelete } from '@/shared/lib';
import type { ${moduleNameCapitalized}, PaginatedResponse } from '../types';

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

fs.writeFileSync(path.join(basePath, 'services', `${moduleName}Service.ts`), serviceContent, {
	encoding: 'utf8',
});
fs.writeFileSync(
	path.join(basePath, 'services', 'index.ts'),
	`export * from './${moduleName}Service';\n`,
	{ encoding: 'utf8' },
);

const pageComponentName = `${moduleNameCapitalized}Page`;
const pageContent = `export function ${pageComponentName}() {
	return <div>${moduleNameCapitalized}</div>;
}
`;

fs.writeFileSync(path.join(basePath, 'pages', `${pageComponentName}.tsx`), pageContent, {
	encoding: 'utf8',
});
fs.writeFileSync(
	path.join(basePath, 'pages', 'index.ts'),
	`export * from './${pageComponentName}';\n`,
	{ encoding: 'utf8' },
);

const barrelContent = `export * from './pages';
export * from './services';
export * from './types';
`;

fs.writeFileSync(path.join(basePath, 'index.ts'), barrelContent, { encoding: 'utf8' });

const appPageDir = path.join(projectRoot, 'src/app', moduleName);
fs.mkdirSync(appPageDir, { recursive: true });

const appPageContent = `import { ${pageComponentName} } from '@/modules/${moduleName}/pages';

export default ${pageComponentName};
`;

fs.writeFileSync(path.join(appPageDir, 'page.tsx'), appPageContent, { encoding: 'utf8' });

const sidebarPath = path.join(projectRoot, 'src/app/components/AppSidebar.tsx');

if (fs.existsSync(sidebarPath)) {
	let sidebarContent = fs.readFileSync(sidebarPath, 'utf8');
	const navEntry = `  { name: '${moduleNameCapitalized}', href: '/${moduleName}', icon: FolderIcon },`;

	if (sidebarContent.includes(`href: '/${moduleName}'`)) {
		console.log('The route already exists in the navigation.');
	} else {
		const navStart = sidebarContent.indexOf('const navigation');
		const equalsSign = sidebarContent.indexOf('=', navStart);
		const arrayOpen = sidebarContent.indexOf('[', equalsSign);

		if (navStart === -1 || arrayOpen === -1) {
			console.warn('Could not find "const navigation" in the sidebar.');
		} else {
			let depth = 0;
			let closingIndex = -1;

			for (let i = arrayOpen; i < sidebarContent.length; i++) {
				const char = sidebarContent[i];
				if (char === '[') depth++;
				if (char === ']') {
					depth--;
					if (depth === 0) {
						closingIndex = i;
						break;
					}
				}
			}

			if (closingIndex === -1) {
				console.warn('Could not find the closing bracket of the navigation array.');
			} else {
				const hasFolderIconImport = sidebarContent.includes('FolderIcon');

				sidebarContent =
					sidebarContent.slice(0, closingIndex) +
					`\n${navEntry}\n` +
					sidebarContent.slice(closingIndex);

				if (!hasFolderIconImport) {
					sidebarContent = sidebarContent.replace(
						/(import \{[^}]+)(} from '@heroicons\/react\/24\/outline')/,
						`$1  FolderIcon,\n$2`,
					);
				}

				fs.writeFileSync(sidebarPath, sidebarContent, { encoding: 'utf8' });
				console.log(`Route added to sidebar: /${moduleName}`);
			}
		}
	}
} else {
	console.warn('Could not find app-sidebar.tsx.');
}

console.log(`\nModule "${moduleName}" created:`);
console.log(`   src/modules/${moduleName}/index.ts`);
console.log(`   src/modules/${moduleName}/types/index.ts`);
console.log(`   src/modules/${moduleName}/services/index.ts`);
console.log(`   src/modules/${moduleName}/services/${moduleName}Service.ts`);
console.log(`   src/modules/${moduleName}/pages/index.ts`);
console.log(`   src/modules/${moduleName}/pages/${pageComponentName}.tsx`);
console.log(`   src/app/${moduleName}/page.tsx`);
