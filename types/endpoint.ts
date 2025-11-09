import { OpenAPISpec } from '@/lib/openapi-parser';

export interface Endpoint {
  path: string;
  method: string;
  summary?: string;
  description?: string;
  operationId?: string;
  parameters?: any[];
  requestBody?: any;
  responses?: Record<string, any>;
  [key: string]: any;
}

export interface EndpointWithOperation extends Endpoint {
  operation: any;
  fullPath: string;
}

export interface DocumentViewProps {
  document: {
    id: string;
    title: string;
    content: string;
    description: string | null;
    isPublic: boolean;
    isOwner?: boolean;
    createdAt: string;
    updatedAt: string;
    user: {
      id: string;
      name: string | null;
      email: string | null;
      image: string | null;
    };
  } | null;
  loading: boolean;
  onSave?: (content: string) => Promise<void>;
}
