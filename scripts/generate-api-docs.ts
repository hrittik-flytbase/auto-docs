import { Project, SourceFile, SyntaxKind, Decorator } from 'ts-morph';
import * as path from 'path';
import * as fs from 'fs';

interface ApiResponse {
  status: number;
  description: string;
}

interface EndpointDoc {
  method: string;
  route: string;
  summary: string;
  requestBody?: {
    type: string;
  };
  response?: ApiResponse;
  errorResponses?: ApiResponse[];
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

function extractSwaggerInfo(method: any) {
  const decorators = method.getDecorators();
  let info: {
    summary: string;
    responses: ApiResponse[];
    requestBodyType?: string;
  } = {
    summary: '',
    responses: []
  };

  // Extract summary from @ApiOperation
  const apiOperation = decorators.find(d => d.getName() === 'ApiOperation');
  if (apiOperation) {
    const args = apiOperation.getArguments()[0];
    if (args) {
      const text = args.getText();
      const summaryMatch = text.match(/summary:\s*['"](.+?)['"]/)
      if (summaryMatch) {
        info.summary = summaryMatch[1];
      }
    }
  }

  // Extract responses from @ApiResponse
  decorators
    .filter(d => d.getName() === 'ApiResponse')
    .forEach(response => {
      const args = response.getArguments()[0];
      if (args) {
        const text = args.getText();
        const statusMatch = text.match(/status:\s*(\d+)/);
        const descriptionMatch = text.match(/description:\s*['"](.+?)['"]/)
        
        if (statusMatch && descriptionMatch) {
          info.responses.push({
            status: parseInt(statusMatch[1]),
            description: descriptionMatch[1]
          });
        }
      }
    });

  // Extract request body type from parameters
  const parameters = method.getParameters();
  parameters.forEach(param => {
    const bodyDecorator = param.getDecorator('Body');
    if (bodyDecorator) {
      const paramType = param.getType();
      // Extract just the type name without the import path
      const typeText = paramType.getText();
      const typeMatch = typeText.match(/\.([^.]+)$/); // Match everything after the last dot
      info.requestBodyType = typeMatch ? typeMatch[1] : typeText;
    }
  });

  return info;
}

function processController(sourceFile: SourceFile): EndpointDoc[] {
  const endpoints: EndpointDoc[] = [];
  const controllerClass = sourceFile.getClasses()[0];
  
  if (!controllerClass) return endpoints;

  const controllerDecorator = controllerClass.getDecorator('Controller');
  const baseRoute = controllerDecorator 
    ? extractRoute(controllerDecorator)
    : '';

  controllerClass.getMethods().forEach(method => {
    const decorators = method.getDecorators();
    const httpDecorator = decorators.find(d => extractHttpMethod(d) !== null);

    if (httpDecorator) {
      const httpMethod = extractHttpMethod(httpDecorator)!;
      const methodRoute = extractRoute(httpDecorator);
      const fullRoute = path.join('/', baseRoute, methodRoute).replace(/\\/g, '/');
      const swaggerInfo = extractSwaggerInfo(method);

      // Separate success response from error responses
      const successResponse = swaggerInfo.responses.find(r => r.status < 400);
      const errorResponses = swaggerInfo.responses.filter(r => r.status >= 400);

      const endpoint: EndpointDoc = {
        method: httpMethod,
        route: fullRoute.replace(/^\/+/, ''), // Remove leading slashes
        summary: swaggerInfo.summary
      };

      // Add request body if present
      if (swaggerInfo.requestBodyType) {
        endpoint.requestBody = {
          type: swaggerInfo.requestBodyType
        };
      }

      // Add responses if present
      if (successResponse) {
        endpoint.response = successResponse;
      }

      if (errorResponses.length > 0) {
        endpoint.errorResponses = errorResponses;
      }

      // Only add endpoints with non-empty routes
      if (endpoint.route) {
        endpoints.push(endpoint);
      }
    }
  });

  return endpoints;
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

  // Create docs directory if it doesn't exist
  const docsDir = path.join(process.cwd(), 'docs');
  if (!fs.existsSync(docsDir)) {
    fs.mkdirSync(docsDir);
  }

  // Write JSON file
  fs.writeFileSync(
    path.join(docsDir, 'api-docs.json'), 
    JSON.stringify(allEndpoints, null, 2)
  );
  
  console.log('API documentation extracted and saved to docs/api-docs.json');
}

main().catch(console.error);
