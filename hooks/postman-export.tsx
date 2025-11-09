import { useState } from 'react';

interface Operation {
  summary?: string;
  description?: string;
  parameters?: Array<{
    name: string;
    in: string;
    required?: boolean;
    schema?: { type?: string };
    description?: string;
    example?: any;
  }>;
  requestBody?: {
    content?: {
      'application/json'?: {
        schema?: any;
        example?: any;
      };
    };
  };
  security?: any[];
}

interface UsePostmanExportParams {
  method: string;
  path: string;
  operation: Operation;
  baseUrl?: string;
}

export const usePostmanExport = ({ 
  method, 
  path, 
  operation, 
  baseUrl = 'https://api.example.com' 
}: UsePostmanExportParams) => {
  const [isExporting, setIsExporting] = useState(false);

  const handleRunInPostman = () => {
    try {
      setIsExporting(true);

      const headerParamsList = operation.parameters?.filter((p) => p.in === 'header') || [];
      const queryParamsList = operation.parameters?.filter((p) => p.in === 'query') || [];
      const pathParamsList = operation.parameters?.filter((p) => p.in === 'path') || [];
      const bodyParamsSchema = operation.requestBody?.content?.['application/json'];
      const hasAuth = operation.security && operation.security.length > 0;

      // Build URL with path params as variables
      let url = `{{baseUrl}}${path}`;
      
      // Prepare query params
      const queryParams = queryParamsList.map(param => ({
        key: param.name,
        value: param.example ? String(param.example) : '',
        description: param.description || '',
        disabled: !param.required
      }));

      // Prepare headers
      const headers = headerParamsList.map(param => ({
        key: param.name,
        value: param.example ? String(param.example) : '',
        description: param.description || '',
        disabled: !param.required
      }));

      // Add auth header if needed
      if (hasAuth) {
        headers.push({
          key: 'Authorization',
          value: 'Bearer {{token}}',
          description: 'Authentication token',
          disabled: false
        });
      }

      // Prepare body
      let body = null;
      if (bodyParamsSchema && ['POST', 'PUT', 'PATCH'].includes(method.toUpperCase())) {
        body = {
          mode: 'raw',
          raw: JSON.stringify(bodyParamsSchema.example || bodyParamsSchema.schema, null, 2),
          options: {
            raw: {
              language: 'json'
            }
          }
        };
        
        // Ensure Content-Type header is present
        if (!headers.some(h => h.key.toLowerCase() === 'content-type')) {
          headers.push({
            key: 'Content-Type',
            value: 'application/json',
            description: '',
            disabled: false
          });
        }
      }

      // Create Postman Collection v2.1 format
      const postmanCollection = {
        info: {
          name: operation.summary || `${method.toUpperCase()} ${path}`,
          description: operation.description || '',
          schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json'
        },
        item: [
          {
            name: operation.summary || `${method.toUpperCase()} ${path}`,
            request: {
              method: method.toUpperCase(),
              header: headers,
              url: {
                raw: url,
                host: ['{{baseUrl}}'],
                path: path.split('/').filter(Boolean),
                query: queryParams
              },
              body: body,
              description: operation.description || ''
            },
            response: []
          }
        ],
        variable: [
          {
            key: 'baseUrl',
            value: baseUrl,
            type: 'string'
          },
          ...(hasAuth ? [{
            key: 'token',
            value: '',
            type: 'string'
          }] : [])
        ]
      };

      // Convert to JSON string
      const collectionJson = JSON.stringify(postmanCollection, null, 2);
      
      // Create a blob and download
      const blob = new Blob([collectionJson], { type: 'application/json' });
      const url_blob = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url_blob;
      a.download = `${operation.summary?.replace(/[^a-z0-9]/gi, '_') || 'api_request'}.postman_collection.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url_blob);

      console.log('Postman collection downloaded successfully');
    } catch (err) {
      console.error('Failed to generate Postman collection:', err);
    } finally {
      setIsExporting(false);
    }
  };

  return {
    isExporting,
    handleRunInPostman
  };
};