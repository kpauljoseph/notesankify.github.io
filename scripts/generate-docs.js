const fs = require('fs').promises;
const path = require('path');
const { marked } = require('marked');
const Handlebars = require('handlebars');

async function generateDocs() {
    try {
        // Read template and markdown
        const [templateContent, markdown] = await Promise.all([
            fs.readFile(path.join(__dirname, '../_templates/doc-page.html'), 'utf8'),
            fs.readFile(path.join(__dirname, '../docs/README.md'), 'utf8')
        ]);

        // Convert markdown to HTML
        const content = marked(markdown);

        // Find the first text-only heading, skipping any HTML
        const title = markdown
            .split('\n')
            .find(line => line.startsWith('# ') && !line.includes('<'))
            ?.replace('# ', '') || 'NotesAnkify Documentation';

        // Compile template
        const template = Handlebars.compile(templateContent);

        // Generate HTML
        const html = template({
            title,
            content
        });

        // Write output
        await fs.mkdir(path.join(__dirname, '../docs'), { recursive: true });
        await fs.writeFile(path.join(__dirname, '../docs/index.html'), html);

        console.log('Documentation generated successfully!');
    } catch (error) {
        console.error('Error generating documentation:', error);
        throw error;
    }
}

generateDocs().catch(console.error);