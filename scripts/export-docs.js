#!/usr/bin/env node

/**
 * API Documentation Export Script
 *
 * This script exports API documentation from various sources:
 * - Swagger/OpenAPI specifications if available
 * - Postman collections
 * - Database schema and relationships
 *
 * Usage: npm run docs:export
 */

const fs = require('fs');
const path = require('path');
const axios = require('axios');

const DOCS_DIR = path.join(__dirname, '../docs/api');
const EXPORT_DIR = path.join(DOCS_DIR, 'exports');

// Ensure export directory exists
if (!fs.existsSync(EXPORT_DIR)) {
  fs.mkdirSync(EXPORT_DIR, { recursive: true });
}

async function exportSwaggerDocs() {
  try {
    console.log('🔍 Looking for Swagger documentation...');

    // Try to fetch Swagger JSON from the running server
    const swaggerUrl = process.env.NODE_ENV === 'production'
      ? 'https://api.yourdomain.com/api-docs-json'
      : 'http://localhost:3000/api-docs-json';

    try {
      const response = await axios.get(swaggerUrl, {
        timeout: 5000,
        headers: {
          'Accept': 'application/json'
        }
      });

      const swaggerData = response.data;

      // Save Swagger JSON
      fs.writeFileSync(
        path.join(EXPORT_DIR, 'swagger.json'),
        JSON.stringify(swaggerData, null, 2)
      );

      console.log('✅ Swagger JSON exported to docs/api/exports/swagger.json');

      // Generate OpenAPI 3.0 YAML if possible
      if (swaggerData.openapi || swaggerData.swagger) {
        console.log('📋 OpenAPI specification found');
      }

    } catch (error) {
      console.log('ℹ️  No running Swagger server found, will use static files');
    }

  } catch (error) {
    console.error('❌ Error exporting Swagger docs:', error.message);
  }
}

async function exportPostmanCollection() {
  try {
    console.log('📋 Checking Postman collection...');

    const collectionPath = path.join(DOCS_DIR, 'postman_collection.json');

    if (fs.existsSync(collectionPath)) {
      const collection = JSON.parse(fs.readFileSync(collectionPath, 'utf8'));

      // Copy to exports directory
      fs.copyFileSync(
        collectionPath,
        path.join(EXPORT_DIR, 'postman_collection.json')
      );

      console.log('✅ Postman collection copied to exports directory');

      // Generate collection summary
      const summary = {
        name: collection.info.name,
        description: collection.info.description,
        requestCount: countRequests(collection),
        environments: ['local', 'staging', 'production']
      };

      fs.writeFileSync(
        path.join(EXPORT_DIR, 'collection-summary.json'),
        JSON.stringify(summary, null, 2)
      );

      console.log('📊 Collection summary generated');

    } else {
      console.log('⚠️  Postman collection not found, skipping export');
    }

  } catch (error) {
    console.error('❌ Error exporting Postman collection:', error.message);
  }
}

function countRequests(collection) {
  let count = 0;

  function traverse(item) {
    if (item.request) {
      count++;
    }
    if (item.item) {
      item.item.forEach(traverse);
    }
  }

  if (collection.item) {
    collection.item.forEach(traverse);
  }

  return count;
}

async function exportDatabaseSchema() {
  try {
    console.log('🗄️  Exporting database relationships...');

    const mermaidPath = path.join(DOCS_DIR, 'data-map.mermaid.md');

    if (fs.existsSync(mermaidPath)) {
      // Copy Mermaid file to exports
      fs.copyFileSync(
        mermaidPath,
        path.join(EXPORT_DIR, 'data-relationships.mermaid.md')
      );

      console.log('✅ Database relationships exported');

      // Generate simple schema overview
      const content = fs.readFileSync(mermaidPath, 'utf8');
      const entities = extractEntitiesFromMermaid(content);

      const schemaOverview = {
        entities: entities,
        totalEntities: entities.length,
        exportedAt: new Date().toISOString()
      };

      fs.writeFileSync(
        path.join(EXPORT_DIR, 'schema-overview.json'),
        JSON.stringify(schemaOverview, null, 2)
      );

      console.log('📋 Schema overview generated');

    } else {
      console.log('⚠️  Mermaid data map not found, skipping schema export');
    }

  } catch (error) {
    console.error('❌ Error exporting database schema:', error.message);
  }
}

function extractEntitiesFromMermaid(content) {
  const entities = [];
  const lines = content.split('\n');

  for (const line of lines) {
    // Look for entity definitions in ER diagram
    const entityMatch = line.match(/(\w+)\s*\{([^}]*)\}/);
    if (entityMatch) {
      const [, entityName, attributes] = entityMatch;
      entities.push({
        name: entityName,
        attributes: attributes.split(',').map(attr => attr.trim()).filter(Boolean)
      });
    }

    // Look for entity names in relationships
    const relationshipMatch = line.match(/(\w+)\s*([|}o<]+|---+[|>o])\s*(\w+)/);
    if (relationshipMatch) {
      const [, source, , target] = relationshipMatch;
      if (!entities.find(e => e.name === source)) {
        entities.push({ name: source, attributes: [] });
      }
      if (!entities.find(e => e.name === target)) {
        entities.push({ name: target, attributes: [] });
      }
    }
  }

  return entities;
}

async function generateReadme() {
  try {
    console.log('📝 Generating export README...');

    const readmeContent = `# API Documentation Export

## 📦 What's Included

This directory contains exported API documentation and related files.

### Files
- **swagger.json** - OpenAPI/Swagger specification (if server was running)
- **postman_collection.json** - Postman collection for API testing
- **collection-summary.json** - Summary of Postman collection
- **data-relationships.mermaid.md** - Database relationship diagrams
- **schema-overview.json** - Database schema overview

## 🚀 How to Use

### Testing APIs
1. Import \`postman_collection.json\` into Postman
2. Set up environment variables for your target environment
3. Run requests to test API endpoints

### Understanding Data Relationships
1. Open \`data-relationships.mermaid.md\` in a Markdown viewer
2. Use Mermaid Live Editor to visualize diagrams
3. Refer to \`schema-overview.json\` for entity details

## 🔄 Regenerating Documentation

Run this script again after making changes:

\`\`\`bash
npm run docs:export
\`\`\`

## 📅 Export Information

- **Generated:** ${new Date().toISOString()}
- **Environment:** ${process.env.NODE_ENV || 'development'}
- **Version:** ${require('../package.json').version}

---
*This documentation was automatically generated by the docs:export script.*
`;

    fs.writeFileSync(path.join(EXPORT_DIR, 'README.md'), readmeContent);
    console.log('✅ Export README generated');

  } catch (error) {
    console.error('❌ Error generating README:', error.message);
  }
}

async function validateExports() {
  try {
    console.log('🔍 Validating exports...');

    const requiredFiles = [
      'postman_collection.json',
      'data-relationships.mermaid.md'
    ];

    const optionalFiles = [
      'swagger.json',
      'collection-summary.json',
      'schema-overview.json',
      'README.md'
    ];

    let allValid = true;

    // Check required files
    for (const file of requiredFiles) {
      const filePath = path.join(EXPORT_DIR, file);
      if (fs.existsSync(filePath)) {
        console.log(`✅ ${file} - Present`);
      } else {
        console.log(`❌ ${file} - Missing`);
        allValid = false;
      }
    }

    // Check optional files
    for (const file of optionalFiles) {
      const filePath = path.join(EXPORT_DIR, file);
      if (fs.existsSync(filePath)) {
        console.log(`✅ ${file} - Present (optional)`);
      } else {
        console.log(`⚠️  ${file} - Missing (optional)`);
      }
    }

    if (allValid) {
      console.log('🎉 All required exports are valid!');
    } else {
      console.log('⚠️  Some required files are missing');
      process.exit(1);
    }

  } catch (error) {
    console.error('❌ Error validating exports:', error.message);
    process.exit(1);
  }
}

// Main execution function
async function main() {
  console.log('🚀 Starting API documentation export...\n');

  try {
    // Export different types of documentation
    await exportSwaggerDocs();
    await exportPostmanCollection();
    await exportDatabaseSchema();
    await generateReadme();

    // Validate the exports
    await validateExports();

    console.log('\n✨ API documentation export completed successfully!');
    console.log(`📁 Check the exports in: ${EXPORT_DIR}`);

  } catch (error) {
    console.error('\n❌ Export failed:', error.message);
    process.exit(1);
  }
}

// Run the export process
if (require.main === module) {
  main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

module.exports = { main, exportSwaggerDocs, exportPostmanCollection, exportDatabaseSchema };
