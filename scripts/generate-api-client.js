#!/usr/bin/env node

/**
 * API Client SDK Generator
 * Generates TypeScript client SDK from OpenAPI specification
 */

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

// Generate TypeScript client SDK
function generateTypeScriptClient(spec) {
  const types = generateTypeScriptTypes(spec);
  const client = generateClientClass(spec);
  
  return `${types}\n\n${client}`;
}

// Generate TypeScript type definitions
function generateTypeScriptTypes(spec) {
  const schemas = spec.components?.schemas || {};
  let types = `// Generated API Types\n\n`;
  
  Object.entries(schemas).forEach(([name, schema]) => {
    types += generateTypeDefinition(name, schema);
  });
  
  return types;
}

// Generate individual type definition
function generateTypeDefinition(name, schema) {
  if (schema.type === 'object') {
    let typeDef = `export interface ${name} {\n`;
    
    if (schema.properties) {
      Object.entries(schema.properties).forEach(([propName, propSchema]) => {
        const optional = schema.required?.includes(propName) ? '' : '?';
        const type = getTypeScriptType(propSchema);
        typeDef += `  ${propName}${optional}: ${type};\n`;
      });
    }
    
    typeDef += `}\n\n`;
    return typeDef;
  }
  
  return `export type ${name} = ${getTypeScriptType(schema)};\n\n`;
}

// Convert OpenAPI type to TypeScript type
function getTypeScriptType(schema) {
  if (schema.$ref) {
    return schema.$ref.replace('#/components/schemas/', '');
  }
  
  switch (schema.type) {
    case 'string':
      if (schema.enum) {
        return schema.enum.map(val => `'${val}'`).join(' | ');
      }
      return 'string';
    case 'number':
    case 'integer':
      return 'number';
    case 'boolean':
      return 'boolean';
    case 'array':
      return `${getTypeScriptType(schema.items)}[]`;
    case 'object':
      if (schema.additionalProperties) {
        return `Record<string, ${getTypeScriptType(schema.additionalProperties)}>`;
      }
      return 'Record<string, any>';
    default:
      return 'any';
  }
}

// Generate main client class
function generateClientClass(spec) {
  const baseUrl = spec.servers?.[0]?.url || '';
  
  let client = `// Generated API Client\n\n`;
  client += `export class SEOAutomationClient {\n`;
  client += `  private baseUrl: string;\n`;
  client += `  private token?: string;\n\n`;
  
  client += `  constructor(options: { baseUrl?: string; token?: string } = {}) {\n`;
  client += `    this.baseUrl = options.baseUrl || '${baseUrl}';\n`;
  client += `    this.token = options.token;\n`;
  client += `  }\n\n`;
  
  client += `  setToken(token: string): void {\n`;
  client += `    this.token = token;\n`;
  client += `  }\n\n`;
  
  client += `  private async request<T>(path: string, options: RequestInit = {}): Promise<T> {\n`;
  client += `    const url = \`\${this.baseUrl}\${path}\`;\n`;
  client += `    const headers = {\n`;
  client += `      'Content-Type': 'application/json',\n`;
  client += `      ...options.headers,\n`;
  client += `    };\n\n`;
  client += `    if (this.token) {\n`;
  client += `      headers['Authorization'] = \`Bearer \${this.token}\`;\n`;
  client += `    }\n\n`;
  client += `    const response = await fetch(url, { ...options, headers });\n`;
  client += `    \n`;
  client += `    if (!response.ok) {\n`;
  client += `      throw new Error(\`API Error: \${response.status} \${response.statusText}\`);\n`;
  client += `    }\n\n`;
  client += `    return response.json();\n`;
  client += `  }\n\n`;
  
  // Generate methods for each endpoint
  Object.entries(spec.paths || {}).forEach(([path, methods]) => {
    Object.entries(methods).forEach(([method, operation]) => {
      if (typeof operation === 'object' && operation.operationId) {
        client += generateClientMethod(path, method, operation);
      }
    });
  });
  
  client += `}\n`;
  return client;
}

// Generate individual client method
function generateClientMethod(path, method, operation) {
  const methodName = operation.operationId || 
    `${method}${path.split('/').map(p => p.charAt(0).toUpperCase() + p.slice(1)).join('')}`;
  
  const hasBody = method === 'post' || method === 'put' || method === 'patch';
  const requestSchema = operation.requestBody?.content?.['application/json']?.schema;
  const responseSchema = operation.responses?.['200']?.content?.['application/json']?.schema;
  
  const paramType = requestSchema?.$ref ? 
    requestSchema.$ref.replace('#/components/schemas/', '') : 'any';
  const returnType = responseSchema?.$ref ? 
    responseSchema.$ref.replace('#/components/schemas/', '') : 'any';
  
  let methodCode = `  async ${methodName}(`;
  
  if (hasBody) {
    methodCode += `data: ${paramType}`;
  }
  
  methodCode += `): Promise<${returnType}> {\n`;
  methodCode += `    return this.request<${returnType}>('${path}', {\n`;
  methodCode += `      method: '${method.toUpperCase()}',\n`;
  
  if (hasBody) {
    methodCode += `      body: JSON.stringify(data),\n`;
  }
  
  methodCode += `    });\n`;
  methodCode += `  }\n\n`;
  
  return methodCode;
}

// Generate usage examples
function generateUsageExamples() {
  return `// Usage Examples

import { SEOAutomationClient } from './api-client';

// Initialize client
const client = new SEOAutomationClient({
  baseUrl: 'https://seo-automation-app.vercel.app/api',
  token: 'your-jwt-token'
});

// Authentication
async function login() {
  const result = await client.authLogin({
    email: 'user@example.com',
    password: 'password123'
  });
  
  client.setToken(result.token);
  return result;
}

// Generate content
async function generateContent() {
  const content = await client.contentGenerate({
    keyword: 'SEO best practices',
    industry: 'Digital Marketing',
    targetAudience: 'Marketing professionals',
    wordCount: 1500,
    tone: 'authoritative'
  });
  
  return content;
}

// SERP analysis
async function analyzeSERP() {
  const analysis = await client.serpAnalyze({
    keyword: 'SEO tools',
    location: 'United States',
    numResults: 10
  });
  
  return analysis;
}

// Export client instance
export const seoClient = new SEOAutomationClient();
`;
}

// Main execution
async function main() {
  try {
    console.log('🔧 Generating API client SDK...');
    
    // Read OpenAPI specification
    const specPath = path.join(__dirname, '..', 'docs', 'api', 'openapi.yaml');
    const yamlContent = fs.readFileSync(specPath, 'utf8');
    const spec = yaml.load(yamlContent);
    
    // Generate TypeScript client
    const clientCode = generateTypeScriptClient(spec);
    const examplesCode = generateUsageExamples();
    
    // Ensure output directory exists
    const outputDir = path.join(__dirname, '..', 'src', 'lib', 'api', 'generated');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    // Write generated files
    fs.writeFileSync(path.join(outputDir, 'api-client.ts'), clientCode);
    fs.writeFileSync(path.join(outputDir, 'examples.ts'), examplesCode);
    
    // Generate package.json for standalone usage
    const packageJson = {
      name: '@seo-automation/api-client',
      version: '1.0.0',
      description: 'TypeScript client for SEO Automation API',
      main: 'api-client.ts',
      types: 'api-client.ts',
      keywords: ['seo', 'api', 'client', 'typescript'],
      author: 'SEO Automation Team',
      license: 'MIT'
    };
    
    fs.writeFileSync(
      path.join(outputDir, 'package.json'), 
      JSON.stringify(packageJson, null, 2)
    );
    
    // Generate README
    const readme = `# SEO Automation API Client

TypeScript client library for the SEO Automation API.

## Installation

\`\`\`bash
npm install @seo-automation/api-client
\`\`\`

## Usage

See \`examples.ts\` for complete usage examples.

## Generated Files

- \`api-client.ts\` - Main client class and type definitions
- \`examples.ts\` - Usage examples
- \`package.json\` - Package configuration

This client is automatically generated from the OpenAPI specification.
`;
    
    fs.writeFileSync(path.join(outputDir, 'README.md'), readme);
    
    console.log('✅ API client SDK generated successfully!');
    console.log(`📁 Output directory: ${outputDir}`);
    console.log('📋 Generated files:');
    console.log('   - api-client.ts (main client)');
    console.log('   - examples.ts (usage examples)');
    console.log('   - package.json (package config)');
    console.log('   - README.md (documentation)');
    
  } catch (error) {
    console.error('❌ Failed to generate API client:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { generateTypeScriptClient, generateUsageExamples };