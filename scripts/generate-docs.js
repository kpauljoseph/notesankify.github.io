import { marked } from 'marked'

const fs = require('fs-extra');
const path = require('path');
// const marked = require('marked');
const handlebars = require('handlebars');

const CONTENT_DIR = path.join(__dirname, '../content');
const OUTPUT_DIR = path.join(__dirname, '../docs');
const TEMPLATE_DIR = path.join(__dirname, '../_templates');

async function registerPartials() {
    // Register header, footer, and head partials
    const partials = ['header', 'footer', 'head'];
    for (const partial of partials) {
        const content = await fs.readFile(
            path.join(TEMPLATE_DIR, `${partial}.html`),
            'utf8'
        );
        handlebars.registerPartial(partial, content);
    }
}

async function generateSidebar() {
    const files = await fs.readdir(CONTENT_DIR, { recursive: true });
    const nav = [];

    const groups = {};
    for (const file of files) {
        if (!file.endsWith('.md')) continue;

        const dir = path.dirname(file);
        const name = path.basename(file, '.md');
        const link = `/${file.replace('.md', '.html')}`;

        if (dir === '.') {
            nav.push({ name, link });
        } else {
            if (!groups[dir]) {
                groups[dir] = [];
            }
            groups[dir].push({ name, link });
        }
    }

    let sidebarHtml = '<ul class="space-y-6">';

    nav.forEach(({ name, link }) => {
        sidebarHtml += `
            <li>
                <a href="${link}" class="text-gray-900 hover:text-[#FF6B6B] font-bold">
                    ${formatTitle(name)}
                </a>
            </li>`;
    });

    for (const [group, items] of Object.entries(groups)) {
        if (group === '.') continue;

        sidebarHtml += `
            <li>
                <h3 class="font-bold text-lg mb-2">${formatTitle(group)}</h3>
                <ul class="space-y-2 pl-4">`;

        items.forEach(({ name, link }) => {
            sidebarHtml += `
                    <li>
                        <a href="${link}" class="text-gray-900 hover:text-[#FF6B6B]">
                            ${formatTitle(name)}
                        </a>
                    </li>`;
        });

        sidebarHtml += `
                </ul>
            </li>`;
    }

    sidebarHtml += '</ul>';
    return sidebarHtml;
}

function formatTitle(name) {
    return name
        .replace(/-/g, ' ')
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}

function processMarkdown(content) {
    marked.use({
        headerIds: true,
        gfm: true
    });

    return marked.parse(content);
}

async function generateDocs() {
    try {
        console.log('Starting documentation generation...');

        await fs.ensureDir(OUTPUT_DIR);

        await registerPartials();

        const templateContent = await fs.readFile(
            path.join(TEMPLATE_DIR, 'doc-page.html'),
            'utf8'
        );
        const template = handlebars.compile(templateContent);

        const sidebar = await generateSidebar();

        const files = await fs.readdir(CONTENT_DIR, { recursive: true });

        for (const file of files) {
            if (!file.endsWith('.md')) continue;

            console.log(`Processing: ${file}`);

            const inputPath = path.join(CONTENT_DIR, file);
            const outputPath = path.join(
                OUTPUT_DIR,
                file.replace('.md', '.html')
            );

            const markdown = await fs.readFile(inputPath, 'utf8');
            const content = processMarkdown(markdown);

            const titleMatch = markdown.match(/^#\s+(.+)$/m);
            const title = titleMatch ? titleMatch[1] : formatTitle(path.basename(file, '.md'));

            const html = template({
                title,
                description: `NotesAnkify documentation - ${title}`,
                url: `/${file.replace('.md', '.html')}`,
                content,
                sidebar
            });

            await fs.ensureDir(path.dirname(outputPath));

            await fs.writeFile(outputPath, html);
            console.log(`Generated: ${outputPath}`);
        }

        console.log('Documentation generation complete!');
    } catch (error) {
        console.error('Error generating documentation:', error);
        process.exit(1);
    }
}

generateDocs();