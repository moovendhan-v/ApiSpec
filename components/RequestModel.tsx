import React, { useState, useEffect } from 'react';
import { X, Loader2, Send, Plus, Trash2, Eye, EyeOff } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

interface PathParam {
  value: string;
  enabled: boolean;
}

interface Param {
  id: string;
  key: string;
  value: string;
  enabled: boolean;
  description?: string;
  secret?: boolean;
}

interface ApiResponse {
  status: number;
  statusText: string;
  data: any;
  headers?: Record<string, string>;
}

interface PostmanTryItModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  method: string;
  path: string;
  pathParamsList: any[];
  queryParamsList: any[];
  headerParamsList: any[];
  bodyParamsSchema?: any;
  hasAuth: boolean;
  baseUrl?: string;
}

const PostmanTryItModal: React.FC<PostmanTryItModalProps> = ({
  open,
  onOpenChange,
  method,
  path,
  pathParamsList,
  queryParamsList,
  headerParamsList,
  bodyParamsSchema,
  hasAuth,
  baseUrl = 'https://api.example.com'
}) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [response, setResponse] = useState<ApiResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('params');
  const [bodyType, setBodyType] = useState<string>('json');
  const [jsonBody, setJsonBody] = useState<string>('');
  
  const [pathParams, setPathParams] = useState<Record<string, PathParam>>({});
  const [queryParams, setQueryParams] = useState<Param[]>([]);
  const [headers, setHeaders] = useState<Param[]>([]);
  const [bodyParams, setBodyParams] = useState<Param[]>([]);
  const [authToken, setAuthToken] = useState<string>('');

  // Initialize parameters when modal opens or data changes
  useEffect(() => {
    if (open) {
      // Initialize path parameters
      const initialPathParams: Record<string, PathParam> = {};
      pathParamsList.forEach(param => {
        initialPathParams[param.name] = {
          value: param.example ? String(param.example) : '',
          enabled: true
        };
      });
      setPathParams(initialPathParams);

      // Initialize query parameters
      const initialQuery: Param[] = queryParamsList.map((param, index) => ({
        id: `query-${index}`,
        key: param.name,
        value: param.example ? String(param.example) : '',
        enabled: param.required || false,
        description: param.description
      }));
      setQueryParams(initialQuery);

      // Initialize headers
      const initialHeaders: Param[] = headerParamsList.map((param, index) => ({
        id: `header-${index}`,
        key: param.name,
        value: param.example ? String(param.example) : '',
        enabled: param.required || false,
        description: param.description,
        secret: param.name.toLowerCase().includes('authorization') || param.name.toLowerCase().includes('token')
      }));
      
      // Add Content-Type header if body exists
      if (bodyParamsSchema && !initialHeaders.some(h => h.key.toLowerCase() === 'content-type')) {
        initialHeaders.push({
          id: 'header-content-type',
          key: 'Content-Type',
          value: 'application/json',
          enabled: true
        });
      }
      
      setHeaders(initialHeaders);

      // Initialize body parameters
      if (bodyParamsSchema?.schema?.properties) {
        const initialBody: Param[] = Object.entries(bodyParamsSchema.schema.properties).map(([key, value]: [string, any], index) => {
          const exampleValue = bodyParamsSchema.example?.[key] || value.example || '';
          return {
            id: `body-${index}`,
            key,
            value: String(exampleValue),
            enabled: bodyParamsSchema?.schema?.required?.includes(key) || false,
            description: value.description
          };
        });
        setBodyParams(initialBody);

        // Initialize JSON body
        const jsonExample = bodyParamsSchema.example || 
          Object.fromEntries(initialBody.map(p => [p.key, p.value]));
        setJsonBody(JSON.stringify(jsonExample, null, 2));
      }

      // Reset response and error
      setResponse(null);
      setError(null);
      setActiveTab('params');
    }
  }, [open, pathParamsList, queryParamsList, headerParamsList, bodyParamsSchema]);

  const getMethodColor = (method: string): string => {
    const colors: Record<string, string> = {
      GET: 'bg-green-500',
      POST: 'bg-orange-500',
      PUT: 'bg-blue-500',
      DELETE: 'bg-red-500',
      PATCH: 'bg-purple-500'
    };
    return colors[method.toUpperCase()] || 'bg-gray-500';
  };

  const getStatusColor = (status: string): string => {
    const code = parseInt(status);
    if (code >= 200 && code < 300) return 'bg-green-500';
    if (code >= 300 && code < 400) return 'bg-blue-500';
    if (code >= 400 && code < 500) return 'bg-orange-500';
    if (code >= 500) return 'bg-red-500';
    return 'bg-gray-500';
  };

  const executeRequest = async (): Promise<void> => {
    setLoading(true);
    setError(null);
    setResponse(null);

    try {
      let url = path;
      
      // Replace path parameters
      Object.entries(pathParams).forEach(([key, param]) => {
        if (param.enabled && param.value) {
          url = url.replace(`{${key}}`, encodeURIComponent(param.value));
        }
      });
      
      // Add query parameters
      const enabledQuery = queryParams
        .filter(param => param.enabled && param.value)
        .map(param => `${encodeURIComponent(param.key)}=${encodeURIComponent(param.value)}`)
        .join('&');
      
      if (enabledQuery) {
        url += `?${enabledQuery}`;
      }
      
      // Build full URL
      const fullUrl = url.startsWith('http') ? url : `${baseUrl}${url}`;
      
      // Prepare headers
      const requestHeaders: Record<string, string> = {};
      
      headers.forEach(header => {
        if (header.enabled && header.value) {
          requestHeaders[header.key] = header.value;
        }
      });
      
      // Add auth token if provided
      if (hasAuth && authToken) {
        requestHeaders['Authorization'] = `Bearer ${authToken}`;
      }
      
      // Prepare request options
      const requestOptions: RequestInit = {
        method: method.toUpperCase(),
        headers: requestHeaders,
        mode: 'cors',
      };
      
      // Add request body for POST, PUT, PATCH
      if (['POST', 'PUT', 'PATCH'].includes(method.toUpperCase())) {
        if (bodyType === 'json') {
          try {
            const parsed = JSON.parse(jsonBody);
            requestOptions.body = JSON.stringify(parsed);
            requestHeaders['Content-Type'] = 'application/json';
          } catch (e) {
            throw new Error('Invalid JSON in request body');
          }
        } else if (bodyType === 'form-data') {
          const bodyObj: Record<string, any> = {};
          bodyParams.forEach(param => {
            if (param.enabled && param.value) {
              bodyObj[param.key] = param.value;
            }
          });
          
          if (Object.keys(bodyObj).length > 0) {
            requestOptions.body = JSON.stringify(bodyObj);
            requestHeaders['Content-Type'] = 'application/json';
          }
        }
      }
      
      // Make the request
      const res = await fetch(fullUrl, requestOptions);
      
      // Parse response
      const contentType = res.headers.get('content-type');
      let responseData;
      
      if (contentType?.includes('application/json')) {
        responseData = await res.json();
      } else {
        responseData = await res.text();
      }
      
      setResponse({
        status: res.status,
        statusText: res.statusText,
        headers: Object.fromEntries(res.headers.entries()),
        data: responseData,
      });
      
      // Auto-switch to response tab
      setActiveTab('response');
    } catch (err: any) {
      setError(err.message || 'Request failed. Check console for details.');
      console.error('API Request Error:', err);
      setActiveTab('response');
    } finally {
      setLoading(false);
    }
  };

  const addParam = (type: 'query' | 'header' | 'body'): void => {
    const newId = `${type}-${Date.now()}`;
    const newParam: Param = { id: newId, key: '', value: '', enabled: true, description: '' };
    
    if (type === 'query') {
      setQueryParams([...queryParams, newParam]);
    } else if (type === 'header') {
      setHeaders([...headers, newParam]);
    } else if (type === 'body') {
      setBodyParams([...bodyParams, newParam]);
    }
  };

  const removeParam = (type: 'query' | 'header' | 'body', id: string): void => {
    if (type === 'query') {
      setQueryParams(queryParams.filter(p => p.id !== id));
    } else if (type === 'header') {
      setHeaders(headers.filter(h => h.id !== id));
    } else if (type === 'body') {
      setBodyParams(bodyParams.filter(b => b.id !== id));
    }
  };

  const updateParam = (type: 'query' | 'header' | 'body', id: string, field: keyof Param, value: any): void => {
    if (type === 'query') {
      setQueryParams(queryParams.map(p => p.id === id ? { ...p, [field]: value } : p));
    } else if (type === 'header') {
      setHeaders(headers.map(h => h.id === id ? { ...h, [field]: value } : h));
    } else if (type === 'body') {
      setBodyParams(bodyParams.map(b => b.id === id ? { ...b, [field]: value } : b));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] p-0 gap-0">
        {/* Header */}
        <DialogHeader className="px-6 py-4 border-b">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-semibold">API Request</DialogTitle>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => onOpenChange(false)}
              className="h-8 w-8 rounded-full"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        {/* Request Bar */}
        <div className="px-6 py-4 border-b bg-muted/30">
          <div className="flex items-center gap-3">
            <Badge className={cn(getMethodColor(method), "text-white font-bold px-3 py-1")}>
              {method.toUpperCase()}
            </Badge>
            <Input
              value={path}
              readOnly
              className="flex-1 font-mono text-sm bg-background"
            />
            <Button 
              onClick={executeRequest} 
              disabled={loading}
              className="gap-2 min-w-28"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Sending
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Send
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Tabs Section */}
        <div className="flex-1 overflow-hidden">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
            <TabsList className="px-6 pt-4 justify-start rounded-none border-b bg-transparent h-auto">
              <TabsTrigger value="params" className="data-[state=active]:bg-background">
                Params {(Object.keys(pathParams).length + queryParams.length) > 0 && `(${Object.keys(pathParams).length + queryParams.length})`}
              </TabsTrigger>
              {hasAuth && (
                <TabsTrigger value="auth" className="data-[state=active]:bg-background">
                  Authorization
                </TabsTrigger>
              )}
              <TabsTrigger value="headers" className="data-[state=active]:bg-background">
                Headers ({headers.length})
              </TabsTrigger>
              {bodyParamsSchema && (
                <TabsTrigger value="body" className="data-[state=active]:bg-background">
                  Body
                </TabsTrigger>
              )}
              <TabsTrigger value="response" className="data-[state=active]:bg-background">
                Response
              </TabsTrigger>
            </TabsList>

            <div className="flex-1 overflow-y-auto px-6 py-4">
              {/* Path & Query Params Tab */}
              <TabsContent value="params" className="mt-0 space-y-6">
                {/* Path Parameters */}
                {Object.keys(pathParams).length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                      Path Variables
                    </h3>
                    {Object.entries(pathParams).map(([key, param]) => (
                      <div key={key} className="flex items-center gap-3">
                        <Checkbox
                          checked={param.enabled}
                          onCheckedChange={(checked) => {
                            setPathParams(prev => ({
                              ...prev,
                              [key]: { ...prev[key], enabled: !!checked }
                            }));
                          }}
                        />
                        <div className="flex-1 grid grid-cols-2 gap-3">
                          <Input
                            value={key}
                            readOnly
                            className="bg-muted/50 font-mono text-sm"
                            placeholder="Key"
                          />
                          <Input
                            value={param.value}
                            onChange={(e) => {
                              setPathParams(prev => ({
                                ...prev,
                                [key]: { ...prev[key], value: e.target.value }
                              }));
                            }}
                            placeholder="Value"
                            className="font-mono text-sm"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Query Parameters */}
                {queryParams.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                      Query Parameters
                    </h3>
                    {queryParams.map((param) => (
                      <div key={param.id} className="flex items-center gap-3 group">
                        <Checkbox
                          checked={param.enabled}
                          onCheckedChange={(checked) => updateParam('query', param.id, 'enabled', !!checked)}
                        />
                        <div className="flex-1 grid grid-cols-2 gap-3">
                          <Input
                            value={param.key}
                            onChange={(e) => updateParam('query', param.id, 'key', e.target.value)}
                            placeholder="Key"
                            className="font-mono text-sm"
                          />
                          <Input
                            value={param.value}
                            onChange={(e) => updateParam('query', param.id, 'value', e.target.value)}
                            placeholder="Value"
                            className="font-mono text-sm"
                          />
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeParam('query', param.id)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8"
                        >
                          <Trash2 className="h-4 w-4 text-muted-foreground" />
                        </Button>
                      </div>
                    ))}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => addParam('query')}
                      className="gap-2"
                    >
                      <Plus className="h-4 w-4" />
                      Add Parameter
                    </Button>
                  </div>
                )}

                {Object.keys(pathParams).length === 0 && queryParams.length === 0 && (
                  <div className="text-center py-12 text-muted-foreground">
                    No parameters required for this endpoint
                  </div>
                )}
              </TabsContent>

              {/* Authorization Tab */}
              {hasAuth && (
                <TabsContent value="auth" className="mt-0 space-y-4">
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                    Bearer Token
                  </h3>
                  <div className="space-y-2">
                    <Input
                      type="password"
                      value={authToken}
                      onChange={(e) => setAuthToken(e.target.value)}
                      placeholder="Enter your bearer token"
                      className="font-mono text-sm"
                    />
                    <p className="text-xs text-muted-foreground">
                      The token will be sent as: <code className="bg-muted px-1 rounded">Authorization: Bearer YOUR_TOKEN</code>
                    </p>
                  </div>
                </TabsContent>
              )}

              {/* Headers Tab */}
              <TabsContent value="headers" className="mt-0 space-y-3">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  Request Headers
                </h3>
                {headers.map((header) => (
                  <div key={header.id} className="flex items-center gap-3 group">
                    <Checkbox
                      checked={header.enabled}
                      onCheckedChange={(checked) => updateParam('header', header.id, 'enabled', !!checked)}
                    />
                    <div className="flex-1 grid grid-cols-2 gap-3">
                      <Input
                        value={header.key}
                        onChange={(e) => updateParam('header', header.id, 'key', e.target.value)}
                        placeholder="Key"
                        className="font-mono text-sm"
                      />
                      <div className="relative">
                        <Input
                          type={header.secret ? 'password' : 'text'}
                          value={header.value}
                          onChange={(e) => updateParam('header', header.id, 'value', e.target.value)}
                          placeholder="Value"
                          className="font-mono text-sm pr-10"
                        />
                        {header.secret && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="absolute right-0 top-0 h-full w-10"
                            onClick={() => updateParam('header', header.id, 'secret', !header.secret)}
                          >
                            {header.secret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeParam('header', header.id)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8"
                    >
                      <Trash2 className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </div>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => addParam('header')}
                  className="gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Add Header
                </Button>
              </TabsContent>

              {/* Body Tab */}
              {bodyParamsSchema && (
                <TabsContent value="body" className="mt-0 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                      Request Body
                    </h3>
                    <Select value={bodyType} onValueChange={setBodyType}>
                      <SelectTrigger className="w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="json">JSON</SelectItem>
                        <SelectItem value="form-data">form-data</SelectItem>
                        <SelectItem value="raw">raw</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {bodyType === 'form-data' && (
                    <div className="space-y-3">
                      {bodyParams.map((param) => (
                        <div key={param.id} className="flex items-center gap-3 group">
                          <Checkbox
                            checked={param.enabled}
                            onCheckedChange={(checked) => updateParam('body', param.id, 'enabled', !!checked)}
                          />
                          <div className="flex-1 grid grid-cols-2 gap-3">
                            <Input
                              value={param.key}
                              onChange={(e) => updateParam('body', param.id, 'key', e.target.value)}
                              placeholder="Key"
                              className="font-mono text-sm"
                            />
                            <Input
                              value={param.value}
                              onChange={(e) => updateParam('body', param.id, 'value', e.target.value)}
                              placeholder="Value"
                              className="font-mono text-sm"
                            />
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeParam('body', param.id)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8"
                          >
                            <Trash2 className="h-4 w-4 text-muted-foreground" />
                          </Button>
                        </div>
                      ))}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => addParam('body')}
                        className="gap-2"
                      >
                        <Plus className="h-4 w-4" />
                        Add Field
                      </Button>
                    </div>
                  )}

                  {bodyType === 'json' && (
                    <div className="border rounded-lg overflow-hidden">
                      <textarea
                        value={jsonBody}
                        onChange={(e) => setJsonBody(e.target.value)}
                        className="w-full min-h-64 p-4 font-mono text-sm bg-muted/30 focus:outline-none focus:ring-2 focus:ring-ring resize-y"
                        placeholder='{\n  "key": "value"\n}'
                      />
                    </div>
                  )}
                </TabsContent>
              )}

              {/* Response Tab */}
              <TabsContent value="response" className="mt-0 space-y-4">
                {!response && !error && !loading && (
                  <Card className="border-dashed">
                    <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                      <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                        <Send className="w-8 h-8 text-muted-foreground" />
                      </div>
                      <p className="text-lg font-medium">No response yet</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Click the Send button to execute the request
                      </p>
                    </CardContent>
                  </Card>
                )}

                {loading && (
                  <Card>
                    <CardContent className="flex flex-col items-center justify-center py-16">
                      <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
                      <p className="text-lg font-medium">Sending request...</p>
                    </CardContent>
                  </Card>
                )}

                {error && (
                  <Card className="border-destructive">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-2 mb-4">
                        <Badge variant="destructive">Error</Badge>
                      </div>
                      <pre className="text-sm text-destructive font-mono whitespace-pre-wrap">{error}</pre>
                    </CardContent>
                  </Card>
                )}

                {response && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <Badge className={cn(getStatusColor(String(response.status)), "text-white font-semibold")}>
                        {response.status} {response.statusText}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {typeof response.data === 'string' 
                          ? `Size: ${response.data.length} bytes` 
                          : `Size: ${JSON.stringify(response.data).length} bytes`}
                      </span>
                    </div>
                    
                    <Card>
                      <CardContent className="p-0">
                        <pre className="p-4 text-sm font-mono overflow-x-auto max-h-96 overflow-y-auto">
                          <code>
                            {typeof response.data === 'string' 
                              ? response.data 
                              : JSON.stringify(response.data, null, 2)}
                          </code>
                        </pre>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PostmanTryItModal;