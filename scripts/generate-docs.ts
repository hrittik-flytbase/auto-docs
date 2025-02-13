import { Project, SourceFile, SyntaxKind, Decorator } from 'ts-morph';
import * as path from 'path';
import * as fs from 'fs';

interface EndpointDoc {
  method: string;
  route: string;
  description: string;
  controller: string;
}

function extractHttpMethod(decorator: Decorator): string | null {
  const name = decorator.getName();
  if (['Get', 'Post', 'Put', 'Delete', 'Patch'].includes(name)) {
    return name.toUpperCase();
  }
  return null;
}

function extractRoute(decorator: Decorator): string {
  const args = decorator.getArguments();
  return args.length > 0 ? args[0].getText().replace(/['"]/g, '') : '';
}

function extractSwaggerDescription(decorators: Decorator[]): string {
  const apiOperation = decorators.find(d => d.getName() === 'ApiOperation');
  if (apiOperation) {
    const args = apiOperation.getArguments()[0];
    if (args) {
      const match = args.getText().match(/summary:\s*['"](.+?)['"]/);
      return match ? match[1] : '';
    }
  }
  return '';
}

function processController(sourceFile: SourceFile): EndpointDoc[] {
  const endpoints: EndpointDoc[] = [];
  const controllerClass = sourceFile.getClasses()[0];
  
  if (!controllerClass) return endpoints;

  const controllerDecorator = controllerClass.getDecorator('Controller');
  const baseRoute = controllerDecorator 
    ? extractRoute(controllerDecorator)
    : '';

  const controllerName = controllerClass.getName() || '';

  controllerClass.getMethods().forEach(method => {
    const decorators = method.getDecorators();
    const httpDecorator = decorators.find(d => extractHttpMethod(d) !== null);

    if (httpDecorator) {
      const httpMethod = extractHttpMethod(httpDecorator)!;
      const methodRoute = extractRoute(httpDecorator);
      const fullRoute = path.join('/', baseRoute, methodRoute).replace(/\\/g, '/');
      const description = extractSwaggerDescription(decorators);

      endpoints.push({
        method: httpMethod,
        route: fullRoute,
        description,
        controller: controllerName,
      });
    }
  });

  return endpoints;
}

function generateMarkdownDoc(endpoints: EndpointDoc[]): string {
  let markdown = '# API Documentation\n\n';

  // Group by controller
  const groupedByController = endpoints.reduce((acc, endpoint) => {
    if (!acc[endpoint.controller]) {
      acc[endpoint.controller] = [];
    }
    acc[endpoint.controller].push(endpoint);
    return acc;
  }, {} as Record<string, EndpointDoc[]>);

  // Generate markdown for each controller
  Object.entries(groupedByController).forEach(([controller, endpoints]) => {
    markdown += `## ${controller}\n\n`;
    
    endpoints.forEach(endpoint => {
      markdown += `### ${endpoint.method} \`${endpoint.route}\`\n\n`;
      if (endpoint.description) {
        markdown += `**Description:** ${endpoint.description}\n\n`;
      }
      markdown += '---\n\n';
    });
  });

  return markdown;
}

async function main() {
  // Initialize project
  const project = new Project({
    tsConfigFilePath: path.join(process.cwd(), 'tsconfig.json'),
  });

  // Find all controller files
  const sourceFiles = project.getSourceFiles('**/**.controller.ts');
  
  // Process all controllers
  const allEndpoints: EndpointDoc[] = [];
  sourceFiles.forEach(sourceFile => {
    const endpoints = processController(sourceFile);
    allEndpoints.push(...endpoints);
  });

  // Generate markdown documentation
  const markdown = generateMarkdownDoc(allEndpoints);

  // Create docs directory if it doesn't exist
  const docsDir = path.join(process.cwd(), 'docs');
  if (!fs.existsSync(docsDir)) {
    fs.mkdirSync(docsDir);
  }

  // Write markdown file
  fs.writeFileSync(path.join(docsDir, 'api-documentation.md'), markdown);
  console.log('API documentation generated successfully!');
}

main().catch(console.error);
