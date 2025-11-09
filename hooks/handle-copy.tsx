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
  responses?: Record<string, any>;
  security?: any[];
}

interface UseCopyEndpointParams {
  method: string;
  path: string;
  operation: Operation;
}

export const useCopyEndpoint = ({ method, path, operation }: UseCopyEndpointParams) => {
  const [copySuccess, setCopySuccess] = useState(false);

  const handleCopyPage = async () => {
    try {
      const headerParamsList = operation.parameters?.filter((p) => p.in === 'header') || [];
      const queryParamsList = operation.parameters?.filter((p) => p.in === 'query') || [];
      const pathParamsList = operation.parameters?.filter((p) => p.in === 'path') || [];
      const bodyParamsSchema = operation.requestBody?.content?.['application/json'];
      const responses = operation.responses || {};
      const hasAuth = operation.security && operation.security.length > 0;

      let content = `# ${operation.summary || `${method.toUpperCase()} ${path}`}\n\n`;
      
      if (operation.description) {
        content += `## Description\n${operation.description}\n\n`;
      }

      content += `## Endpoint\n`;
      content += `**Method:** ${method.toUpperCase()}\n`;
      content += `**Path:** ${path}\n\n`;

      // Authorization
      if (hasAuth) {
        content += `## Authorization\n`;
        content += `This endpoint requires authentication. Provide your bearer token in the Authorization header:\n`;
        content += `\`\`\`\nAuthorization: Bearer YOUR_TOKEN\n\`\`\`\n\n`;
      }

      // Path Parameters
      if (pathParamsList.length > 0) {
        content += `## Path Parameters\n\n`;
        pathParamsList.forEach(param => {
          content += `- **${param.name}**`;
          if (param.required) content += ` (required)`;
          content += ` - ${param.schema?.type || 'string'}\n`;
          if (param.description) content += `  ${param.description}\n`;
          if (param.example) content += `  Example: \`${param.example}\`\n`;
          content += `\n`;
        });
      }

      // Query Parameters
      if (queryParamsList.length > 0) {
        content += `## Query Parameters\n\n`;
        queryParamsList.forEach(param => {
          content += `- **${param.name}**`;
          if (param.required) content += ` (required)`;
          content += ` - ${param.schema?.type || 'string'}\n`;
          if (param.description) content += `  ${param.description}\n`;
          if (param.example) content += `  Example: \`${param.example}\`\n`;
          content += `\n`;
        });
      }

      // Header Parameters
      if (headerParamsList.length > 0) {
        content += `## Header Parameters\n\n`;
        headerParamsList.forEach(param => {
          content += `- **${param.name}**`;
          if (param.required) content += ` (required)`;
          content += ` - ${param.schema?.type || 'string'}\n`;
          if (param.description) content += `  ${param.description}\n`;
          if (param.example) content += `  Example: \`${param.example}\`\n`;
          content += `\n`;
        });
      }

      // Request Body
      if (bodyParamsSchema) {
        content += `## Request Body\n\n`;
        content += `Content-Type: application/json\n\n`;
        content += `\`\`\`json\n${JSON.stringify(bodyParamsSchema.example || bodyParamsSchema.schema, null, 2)}\n\`\`\`\n\n`;
      }

      // Responses
      if (Object.keys(responses).length > 0) {
        content += `## Responses\n\n`;
        Object.entries(responses).forEach(([statusCode, response]: [string, any]) => {
          content += `### ${statusCode} - ${response.description || 'Response'}\n\n`;
          
          if (response.description) {
            content += `${response.description}\n\n`;
          }

          const responseContent = response.content?.['application/json'];
          if (responseContent) {
            const examples = responseContent.examples || {};
            if (Object.keys(examples).length > 0) {
              Object.entries(examples).forEach(([exampleName, exampleData]: [string, any]) => {
                content += `**${exampleData.summary || exampleName}**\n`;
                content += `\`\`\`json\n${JSON.stringify(exampleData.value || exampleData, null, 2)}\n\`\`\`\n\n`;
              });
            } else if (responseContent.schema || responseContent.example) {
              content += `\`\`\`json\n${JSON.stringify(responseContent.example || responseContent.schema, null, 2)}\n\`\`\`\n\n`;
            }
          }
        });
      }

      await navigator.clipboard.writeText(content);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return {
    copySuccess,
    handleCopyPage
  };
};