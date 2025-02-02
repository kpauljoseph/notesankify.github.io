const fs = require('fs').promises;
const path = require('path');
const { marked } = require('marked');

async function generateDocs() {
    try {
        // Read template file
        const template = await fs.readFile(
            path.join(__dirname, '../_templates/doc-page.html'),
            'utf8'
        );

        // Read and process README.md
        const markdown = await fs.readFile(
            path.join(__dirname, '../content/README.md'),
            'utf8'
        );

        // Convert markdown to HTML
        const content = marked(markdown);

        // Create final HTML by replacing placeholder
        const html = template.replace('{{content}}', content);

        // Ensure docs directory exists
        await fs.mkdir(path.join(__dirname, '../docs'), { recursive: true });

        // Write the output file
        await fs.writeFile(
            path.join(__dirname, '../docs/index.html'),
            html
        );

        console.log('Documentation generated successfully!');
    } catch (error) {
        console.error('Error generating documentation:', error);
        throw error;
    }
}

generateDocs().catch(console.error);