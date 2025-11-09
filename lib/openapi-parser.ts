export interface OpenAPISpec {
  openapi: string;
  info: {
    title: string;
    description?: string;
    version: string;
  };
  paths: Record<string, PathItem>;
  components?: {
    securitySchemes?: Record<string, SecurityScheme>;
  };
}

export interface PathItem {
  [method: string]: Operation;
}

export interface Operation {
  summary: string;
  description?: string;
  deprecated?: boolean;
  tags?: string[];
  parameters?: Parameter[];
  requestBody?: RequestBody;
  responses: Record<string, Response>;
  security?: SecurityRequirement[];
}

export interface Parameter {
  name: string;
  in: 'query' | 'header' | 'path' | 'cookie';
  description?: string;
  required?: boolean;
  schema?: Schema;
  example?: any;
}

export interface RequestBody {
  content: Record<string, MediaType>;
  required?: boolean;
}

export interface MediaType {
  schema?: Schema;
  example?: any;
  examples?: Record<string, any>;
}

export interface Response {
  description: string;
  content?: Record<string, MediaType>;
  headers?: Record<string, any>;
}

export interface Schema {
  type?: string;
  properties?: Record<string, Schema>;
  required?: string[];
  items?: Schema;
  example?: any;
}

export interface SecurityScheme {
  type: string;
  scheme?: string;
  [key: string]: any;
}

export interface SecurityRequirement {
  [name: string]: string[];
}

export interface Endpoint {
  path: string;
  method: string;
  operation: Operation;
  fullPath: string;
}

export function getAllEndpoints(spec: OpenAPISpec): Endpoint[] {
  const endpoints: Endpoint[] = [];
  
  for (const [path, pathItem] of Object.entries(spec.paths)) {
    for (const [method, operation] of Object.entries(pathItem)) {
      if (['get', 'post', 'put', 'delete', 'patch', 'options', 'head'].includes(method.toLowerCase())) {
        endpoints.push({
          path,
          method: method.toUpperCase(),
          operation: operation as Operation,
          fullPath: path,
        });
      }
    }
  }
  
  return endpoints;
}

export function groupEndpointsByPath(endpoints: Endpoint[]): Record<string, Endpoint[]> {
  const grouped: Record<string, Endpoint[]> = {};
  
  for (const endpoint of endpoints) {
    const pathParts = endpoint.path.split('/').filter(Boolean);
    const category = pathParts[0] || 'root';
    
    if (!grouped[category]) {
      grouped[category] = [];
    }
    grouped[category].push(endpoint);
  }
  
  return grouped;
}

export function getMethodColor(method: string): string {
  const colors: Record<string, string> = {
    GET: 'bg-green-600',
    POST: 'bg-orange-600',
    PUT: 'bg-blue-600',
    PATCH: 'bg-yellow-600',
    DELETE: 'bg-red-600',
  };
  return colors[method] || 'bg-gray-600';
}

export function generateCodeExample(
  endpoint: Endpoint,
  spec: OpenAPISpec,
  language: 'curl' | 'javascript' | 'java' | 'swift' | 'curl-windows' | 'httpie' | 'wget' | 'powershell' = 'curl'
): string {
  const { path, method, operation } = endpoint;
  const baseUrl = (spec as any).servers?.[0]?.url || 'https://api.example.com';
  const fullUrl = `${baseUrl}${path}`;
  
  // Get headers
  const headers: Record<string, string> = {};
  if (operation.parameters) {
    for (const param of operation.parameters) {
      if (param.in === 'header' && param.example) {
        headers[param.name] = String(param.example);
      }
    }
  }
  
  // Check for bearer token
  if (operation.security || spec.components?.securitySchemes?.bearer) {
    headers['Authorization'] = 'Bearer <token>';
  }
  
  // Get body
  let body = '';
  if (operation.requestBody?.content?.['application/json']) {
    const example = operation.requestBody.content['application/json'].example;
    if (example) {
      body = JSON.stringify(example, null, 2);
    }
  }
  
  switch (language) {
    case 'curl':
      let curlCmd = `curl --location --request ${method} '${fullUrl}'`;
      
      for (const [key, value] of Object.entries(headers)) {
        curlCmd += ` \\\n  --header '${key}: ${value}'`;
      }
      
      if (body) {
        curlCmd += ` \\\n  --data-raw '${body.replace(/'/g, "'\\''")}'`;
      }
      
      return curlCmd;
      
    case 'curl-windows':
      let curlWinCmd = `curl.exe -X ${method} "${fullUrl}"`;
      
      for (const [key, value] of Object.entries(headers)) {
        curlWinCmd += ` ^\n  -H "${key}: ${value}"`;
      }
      
      if (body) {
        curlWinCmd += ` ^\n  -d "${body.replace(/"/g, '\\"')}"`;
      }
      
      return curlWinCmd;
      
    case 'httpie':
      let httpieCmd = `http ${method} ${fullUrl}`;
      
      for (const [key, value] of Object.entries(headers)) {
        httpieCmd += ` \\\n  ${key}:${value}`;
      }
      
      if (body) {
        httpieCmd += ` \\\n  <<< '${body.replace(/'/g, "'\\''")}'`;
      }
      
      return httpieCmd;
      
    case 'wget':
      let wgetCmd = `wget --method=${method} --header='Content-Type: application/json'`;
      
      for (const [key, value] of Object.entries(headers)) {
        wgetCmd += ` \\\n  --header='${key}: ${value}'`;
      }
      
      if (body) {
        wgetCmd += ` \\\n  --body-data='${body.replace(/'/g, "'\\''")}'`;
      }
      
      wgetCmd += ` \\\n  ${fullUrl}`;
      
      return wgetCmd;
      
    case 'powershell':
      let psCmd = `$headers = @{\n`;
      for (const [key, value] of Object.entries(headers)) {
        psCmd += `  "${key}" = "${value}"\n`;
      }
      psCmd += `}\n\n`;
      
      if (body) {
        psCmd += `$body = @'\n${body}\n'@\n\n`;
        psCmd += `Invoke-RestMethod -Uri "${fullUrl}" -Method ${method} -Headers $headers -Body $body`;
      } else {
        psCmd += `Invoke-RestMethod -Uri "${fullUrl}" -Method ${method} -Headers $headers`;
      }
      
      return psCmd;
      
    case 'javascript':
      let jsCode = `fetch("${fullUrl}", {\n  method: "${method}",\n`;
      
      if (Object.keys(headers).length > 0) {
        jsCode += `  headers: {\n`;
        for (const [key, value] of Object.entries(headers)) {
          jsCode += `    "${key}": "${value}",\n`;
        }
        jsCode += `  },\n`;
      }
      
      if (body) {
        jsCode += `  body: JSON.stringify(${body}),\n`;
      }
      
      jsCode += `});`;
      return jsCode;
      
    case 'java':
      return `// Java example for ${method} ${path}`;
      
    case 'swift':
      return `// Swift example for ${method} ${path}`;
      
    default:
      return '';
  }
}

