import { Project, SourceFile, SyntaxKind, Decorator } from 'ts-morph';
import * as path from 'path';
import * as fs from 'fs';

interface ApiResponse {
  status: number;
  description: string;
}

interface SchemaProperty {
  type: string;
  description?: string;
  example?: any;
  enum?: string[];
  items?: SchemaProperty;
  properties?: Record<string, SchemaProperty>;
  required?: boolean;
  format?: string;
  nullable?: boolean;
}

interface RequestBodySchema {
  type: string;
  properties?: Record<string, SchemaProperty>;
  required?: string[];
}

interface ResponseSchema {
  status: number;
  description: string;
  schema?: RequestBodySchema;
}

interface EndpointDoc {
  method: string;
  route: string;
  summary: string;
  description?: string;
  requestBody?: RequestBodySchema;
  response?: ResponseSchema;
  errorResponses?: ResponseSchema[];
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

function extractPropertyFromText(text: string): SchemaProperty {
  const property: SchemaProperty = { type: 'string' };
  const typeMatch = text.match(/type:\s*['"]([\w]+)['"]/);
  const descMatch = text.match(/description:\s*['"](.*?)['"]/)
  const exampleMatch = text.match(/example:\s*([^,}\n]+)/);
  const formatMatch = text.match(/format:\s*['"]([\w]+)['"]/);
  const nullableMatch = text.match(/nullable:\s*(true|false)/);
  const itemsMatch = text.match(/items:\s*({[^}]+})/s);
  
  if (typeMatch) property.type = typeMatch[1];
  if (descMatch) property.description = descMatch[1];
  if (exampleMatch) property.example = exampleMatch[1].trim();
  if (formatMatch) property.format = formatMatch[1];
  if (nullableMatch) property.nullable = nullableMatch[1] === 'true';
  
  if (itemsMatch) {
    property.items = extractPropertyFromText(itemsMatch[1]);
  }
  
  return property;
}

function extractSchemaFromText(text: string): RequestBodySchema {
  const schema: RequestBodySchema = { type: 'object' };
  const propertiesMatch = text.match(/properties:\s*({[^}]+})/s);
  
  if (propertiesMatch) {
    schema.properties = {};
    const propertyMatches = propertiesMatch[1].matchAll(/([\w]+):\s*({[^}]+})/g);
    
    for (const match of propertyMatches) {
      const propName = match[1];
      const propText = match[2];
      schema.properties[propName] = extractPropertyFromText(propText);
    }
  }
  
  return schema;
}

function extractSwaggerInfo(method: any) {
  const decorators = method.getDecorators();
  let info = {
    summary: '',
    description: '',
    requestBody: undefined as RequestBodySchema | undefined,
    response: undefined as ResponseSchema | undefined,
    errorResponses: [] as ResponseSchema[]
  };

  // Extract summary and description from @ApiOperation
  const apiOperation = decorators.find(d => d.getName() === 'ApiOperation');
  if (apiOperation) {
    const args = apiOperation.getArguments()[0];
    if (args) {
      const text = args.getText();
      const summaryMatch = text.match(/summary:\s*['"](.*?)['"]/);
      const descriptionMatch = text.match(/description:\s*['"](.*?)['"]/);
      if (summaryMatch) info.summary = summaryMatch[1];
      if (descriptionMatch) info.description = descriptionMatch[1];
    }
  }

  // Extract request body schema
  const parameters = method.getParameters();
  parameters.forEach(param => {
    const bodyDecorator = param.getDecorator('Body');
    if (bodyDecorator) {
      const paramType = param.getType();
      const typeText = paramType.getText();
      // Extract just the type name without the import path
      const typeMatch = typeText.match(/[a-zA-Z_][a-zA-Z0-9_]*$/);
      info.requestBody = { type: typeMatch ? typeMatch[0] : typeText };
    }
  });

  // Extract response schemas
  const responseDecorators = decorators.filter(d => 
    ['ApiResponse', 'ApiOkResponse', 'ApiCreatedResponse', 'ApiBadRequestResponse', 'ApiNotFoundResponse'].includes(d.getName())
  );

  responseDecorators.forEach(decorator => {
    const args = decorator.getArguments()[0];
    if (args) {
      const text = args.getText();
      const descriptionMatch = text.match(/description:\s*['"](.*?)['"]/);
      const schemaMatch = text.match(/schema:\s*({[^}]+})/s);
      const typeMatch = text.match(/type:\s*([^,}\n]+)/);

      const response: ResponseSchema = {
        status: 200, // Default status
        description: descriptionMatch ? descriptionMatch[1] : ''
      };

      // Set appropriate status based on decorator name
      const decoratorName = decorator.getName();
      switch (decoratorName) {
        case 'ApiCreatedResponse':
          response.status = 201;
          break;
        case 'ApiBadRequestResponse':
          response.status = 400;
          break;
        case 'ApiNotFoundResponse':
          response.status = 404;
          break;
      }

      if (schemaMatch) {
        response.schema = extractSchemaFromText(schemaMatch[1]);
      } else if (typeMatch) {
        const type = typeMatch[1].trim();
        if (type.startsWith('[') && type.endsWith(']')) {
          // Handle array types
          response.schema = {
            type: 'array',
            properties: {
              items: {
                type: type.slice(1, -1)
              }
            }
          };
        } else {
          response.schema = { type };
        }
      }

      if (response.status >= 400) {
        info.errorResponses.push(response);
      } else {
        info.response = response;
      }
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

      const endpoint: EndpointDoc = {
        method: httpMethod,
        route: fullRoute.replace(/^\/+/, ''), // Remove leading slashes
        summary: swaggerInfo.summary,
        description: swaggerInfo.description,
        requestBody: swaggerInfo.requestBody,
        response: swaggerInfo.response,
        errorResponses: swaggerInfo.errorResponses
      };

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

main();
