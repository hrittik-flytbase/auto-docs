import { Project, SyntaxKind } from 'ts-morph';
import * as fs from 'fs';
import * as path from 'path';

interface RouteInfo {
  method: string;
  route: string;
  summary: string;
}

// Initialize ts-morph project
const project = new Project({
  tsConfigFilePath: path.join(process.cwd(), 'tsconfig.json'),
});

const routes: RouteInfo[] = [];

// Function to clean route path
function cleanRoutePath(route: string): string {
  return route
    .replace(/^\/+/, '') // Remove leading slashes
    .replace(/\/+$/, ''); // Remove trailing slashes
}

// Function to process each controller file
function parseController(sourceFile: string) {
  const file = project.addSourceFileAtPath(sourceFile);

  file.getClasses().forEach(controller => {
    let baseRoute = '';

    // Extract @Controller() decorator to get the base route
    controller.getDecorators().forEach(decorator => {
      if (decorator.getName() === 'Controller') {
        const args = decorator.getArguments();
        if (args.length > 0) {
          baseRoute = args[0].getText().replace(/['"]/g, '');
        }
      }
    });

    // Process each method in the controller
    controller.getMethods().forEach(method => {
      const routeInfo: RouteInfo = {
        method: '',
        route: baseRoute,
        summary: ''
      };

      method.getDecorators().forEach(decorator => {
        const name = decorator.getName();

        // Extract HTTP methods and route paths
        if (['Get', 'Post', 'Put', 'Delete', 'Patch'].includes(name)) {
          routeInfo.method = name.toUpperCase();
          const args = decorator.getArguments();
          if (args.length > 0) {
            const methodPath = args[0].getText().replace(/['"]/g, '');
            routeInfo.route = cleanRoutePath(`${baseRoute}/${methodPath}`);
          } else {
            routeInfo.route = cleanRoutePath(baseRoute);
          }
        }

        // Extract @ApiOperation summary
        if (name === 'ApiOperation') {
          const args = decorator.getArguments();
          if (args.length > 0) {
            const summaryMatch = args[0].getText().match(/summary:\s*['"](.+?)['"]/);
            if (summaryMatch) {
              routeInfo.summary = summaryMatch[1];
            }
          }
        }
      });

      // Only add routes that have both a method and a non-empty route
      if (routeInfo.method && routeInfo.route) {
        routes.push(routeInfo);
      }
    });
  });
}

function main() {
  // Find all controller files in the src directory
  const srcPath = path.join(process.cwd(), 'src');
  const controllerFiles = project.getSourceFiles('**/*.controller.ts');

  // Parse each controller file
  controllerFiles.forEach(file => {
    parseController(file.getFilePath());
  });

  // Create docs directory if it doesn't exist
  const docsDir = path.join(process.cwd(), 'docs');
  if (!fs.existsSync(docsDir)) {
    fs.mkdirSync(docsDir);
  }

  // Save output to a JSON file
  const outputPath = path.join(docsDir, 'api-docs.json');
  fs.writeFileSync(outputPath, JSON.stringify(routes, null, 2));

  console.log('API documentation extracted and saved to docs/api-docs.json');
}

main();
