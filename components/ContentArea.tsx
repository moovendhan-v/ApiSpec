'use client';

import React, { useState } from 'react';
import { Endpoint, getMethodColor } from '@/lib/openapi-parser';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Separator } from '@/components/ui/separator';
import { Copy, Play, X, Loader2, ChevronDown, Rocket } from 'lucide-react';
import { cn } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';
import PostmanTryItModal from './RequestModel';
import { useCopyEndpoint } from '@/hooks/handle-copy';
import { usePostmanExport } from '@/hooks/postman-export';

interface ContentAreaProps {
  endpoint: Endpoint | null;
}

interface ParamState {
  enabled: boolean;
  value: string;
}

// Custom Markdown components for better styling
const MarkdownComponents = {
  h1: ({ children }: any) => <h1 className="text-2xl font-bold mt-6 mb-4">{children}</h1>,
  h2: ({ children }: any) => <h2 className="text-xl font-bold mt-5 mb-3">{children}</h2>,
  h3: ({ children }: any) => <h3 className="text-lg font-semibold mt-4 mb-2">{children}</h3>,
  h4: ({ children }: any) => <h4 className="text-base font-semibold mt-3 mb-2">{children}</h4>,
  p: ({ children }: any) => <p className="text-muted-foreground leading-relaxed mb-4">{children}</p>,
  ul: ({ children }: any) => <ul className="list-disc list-inside space-y-2 mb-4 text-muted-foreground">{children}</ul>,
  ol: ({ children }: any) => <ol className="list-decimal list-inside space-y-2 mb-4 text-muted-foreground">{children}</ol>,
  li: ({ children }: any) => <li className="ml-4">{children}</li>,
  code: ({ inline, children }: any) =>
    inline ? (
      <code className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono text-foreground">{children}</code>
    ) : (
      <code className="block bg-muted p-4 rounded-md text-sm font-mono overflow-x-auto mb-4">{children}</code>
    ),
  pre: ({ children }: any) => <pre className="bg-muted p-4 rounded-md overflow-x-auto mb-4">{children}</pre>,
  blockquote: ({ children }: any) => (
    <blockquote className="border-l-4 border-primary pl-4 italic my-4 text-muted-foreground">{children}</blockquote>
  ),
  table: ({ children }: any) => (
    <div className="overflow-x-auto mb-4">
      <table className="w-full border-collapse border border-border">{children}</table>
    </div>
  ),
  thead: ({ children }: any) => <thead className="bg-muted">{children}</thead>,
  tbody: ({ children }: any) => <tbody>{children}</tbody>,
  tr: ({ children }: any) => <tr className="border-b border-border">{children}</tr>,
  th: ({ children }: any) => (
    <th className="px-4 py-2 text-left font-semibold text-foreground border border-border">{children}</th>
  ),
  td: ({ children }: any) => (
    <td className="px-4 py-2 text-muted-foreground border border-border">{children}</td>
  ),
  a: ({ children, href }: any) => (
    <a href={href} className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">
      {children}
    </a>
  ),
  hr: () => <hr className="my-6 border-border" />,
  strong: ({ children }: any) => <strong className="font-semibold text-foreground">{children}</strong>,
  em: ({ children }: any) => <em className="italic">{children}</em>,
};

export default function ContentArea({ endpoint }: ContentAreaProps) {
  const [showTryItModal, setShowTryItModal] = useState(false);
  const [pathParams, setPathParams] = useState<Record<string, ParamState>>({});
  const [headerParams, setHeaderParams] = useState<Record<string, ParamState>>({});
  const [queryParams, setQueryParams] = useState<Record<string, ParamState>>({});
  const [bodyParams, setBodyParams] = useState<Record<string, ParamState>>({});
  const [authToken, setAuthToken] = useState('');
  const [bodyType, setBodyType] = useState('form-data');
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  if (!endpoint) {
    return (
      <div className="flex items-center justify-center h-full bg-background">
        <p className="text-muted-foreground">Select an endpoint from the sidebar to view details</p>
      </div>
    );
  }

  const { path, method, operation } = endpoint;

  // Use custom hooks
  const { copySuccess, handleCopyPage } = useCopyEndpoint({ method, path, operation });
  const { isExporting, handleRunInPostman } = usePostmanExport({
    method,
    path,
    operation,
    baseUrl: 'https://petstore3.swagger.io/api/v3' // Replace with your actual base URL
  });

  const headerParamsList = operation.parameters?.filter((p) => p.in === 'header') || [];
  const queryParamsList = operation.parameters?.filter((p) => p.in === 'query') || [];
  const pathParamsList = operation.parameters?.filter((p) => p.in === 'path') || [];
  const bodyParamsSchema = operation.requestBody?.content?.['application/json'];

  const hasAuth = operation.security && operation.security.length > 0;
  const responses = operation.responses || {};

  const getStatusColor = (status: string) => {
    const code = parseInt(status);
    if (code >= 200 && code < 300) return 'bg-green-500/10 text-green-500 border-green-500/20';
    if (code >= 400 && code < 500) return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
    if (code >= 500) return 'bg-red-500/10 text-red-500 border-red-500/20';
    return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
  };

  const handleTryIt = () => {
    const initialPathParams: Record<string, ParamState> = {};
    pathParamsList.forEach(param => {
      initialPathParams[param.name] = {
        enabled: true,
        value: param.example ? String(param.example) : ''
      };
    });
    setPathParams(initialPathParams);

    const initialHeaders: Record<string, ParamState> = {};
    headerParamsList.forEach(param => {
      initialHeaders[param.name] = {
        enabled: param.required || false,
        value: param.example ? String(param.example) : ''
      };
    });
    setHeaderParams(initialHeaders);

    const initialQuery: Record<string, ParamState> = {};
    queryParamsList.forEach(param => {
      initialQuery[param.name] = {
        enabled: param.required || false,
        value: param.example ? String(param.example) : ''
      };
    });
    setQueryParams(initialQuery);

    const initialBody: Record<string, ParamState> = {};
    if (bodyParamsSchema?.schema?.properties) {
      Object.entries(bodyParamsSchema.schema.properties).forEach(([key, value]: [string, any]) => {
        const exampleValue = bodyParamsSchema.example?.[key] || value.example || '';
        initialBody[key] = {
          enabled: bodyParamsSchema?.schema?.required?.includes(key) || false,
          value: String(exampleValue)
        };
      });
    }
    setBodyParams(initialBody);

    setAuthToken('');
    setResponse(null);
    setError(null);
    setShowTryItModal(true);
  };


  return (
    <>
      <div className="h-full overflow-y-auto bg-background">
        <div className="max-w-6xl mx-auto p-6 space-y-6">
          {/* Header Section */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 space-y-3">
              <h1 className="text-3xl font-bold text-foreground">
                {operation.summary || `${method.toUpperCase()} ${path}`}
              </h1>
              {operation.description && (
                <div className="prose prose-sm max-w-none">
                  <ReactMarkdown components={MarkdownComponents}>
                    {operation.description}
                  </ReactMarkdown>
                </div>
              )}
              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex items-center gap-2">
                  <Badge className={cn(getMethodColor(method), "text-white font-semibold")}>
                    {method.toUpperCase()}
                  </Badge>
                  <code className="text-sm text-muted-foreground bg-muted px-2 py-1 rounded">
                    {path}
                  </code>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button size="sm" className="bg-primary hover:bg-primary/90" onClick={handleTryIt}>
                  <Play className="w-3 h-3 mr-2" />
                  Try it
                </Button>
                <Button size="sm" variant="outline">
                  <Play className="w-3 h-3 mr-2" />
                  Run in Postman
                </Button>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={handleCopyPage}>
              <Copy className="w-4 h-4 mr-2" />
              Copy Page
            </Button>
          </div>

          <Separator />

          <div className="flex gap-4 text-sm text-muted-foreground">
            <span>Last modified: about 1 month ago</span>
            <span>•</span>
            <span>Maintainer: Not configured</span>
          </div>

          <Separator />

          {/* REQUEST SECTION */}
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">Request</h2>

            {hasAuth && (
              <Card>
                <Accordion type="single" collapsible defaultValue="authorization">
                  <AccordionItem value="authorization" className="border-0">
                    <AccordionTrigger className="hover:no-underline px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="text-green-500">✓</span>
                        <span className="font-medium text-foreground">Authorization</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-6 pb-4">
                      <div className="space-y-2">
                        <p className="text-foreground">
                          Provide your{' '}
                          <span className="text-primary font-medium">bearer token</span> in the Authorization header when making
                          requests to protected resources.
                        </p>
                        <code className="block text-sm text-muted-foreground bg-muted p-3 rounded-md">
                          Authorization: Bearer ********************
                        </code>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </Card>
            )}

            {headerParamsList.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-foreground">Header Parameters</h3>
                <div className="space-y-2">
                  {headerParamsList.map((param) => (
                    <Card key={param.name}>
                      <CardContent className="p-4 space-y-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <code className="text-foreground font-semibold">{param.name}</code>
                          <Badge variant="outline" className="text-xs">
                            {param.schema?.type || 'string'}
                          </Badge>
                          {param.required && (
                            <Badge variant="destructive" className="text-xs">required</Badge>
                          )}
                        </div>
                        {param.description && (
                          <div className="prose prose-sm max-w-none">
                            <ReactMarkdown components={MarkdownComponents}>
                              {param.description}
                            </ReactMarkdown>
                          </div>
                        )}
                        {param.example && (
                          <code className="block text-sm text-muted-foreground bg-muted p-2 rounded">
                            Example: {String(param.example)}
                          </code>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {queryParamsList.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-foreground">Query Parameters</h3>
                <div className="space-y-2">
                  {queryParamsList.map((param) => (
                    <Card key={param.name}>
                      <CardContent className="p-4 space-y-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <code className="text-foreground font-semibold">{param.name}</code>
                          <Badge variant="outline" className="text-xs">
                            {param.schema?.type || 'string'}
                          </Badge>
                          {param.required && (
                            <Badge variant="destructive" className="text-xs">required</Badge>
                          )}
                        </div>
                        {param.description && (
                          <div className="prose prose-sm max-w-none">
                            <ReactMarkdown components={MarkdownComponents}>
                              {param.description}
                            </ReactMarkdown>
                          </div>
                        )}
                        {param.example && (
                          <code className="block text-sm text-muted-foreground bg-muted p-2 rounded">
                            Example: {String(param.example)}
                          </code>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {pathParamsList.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-foreground">Path Parameters</h3>
                <div className="space-y-2">
                  {pathParamsList.map((param) => (
                    <Card key={param.name}>
                      <CardContent className="p-4 space-y-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <code className="text-foreground font-semibold">{param.name}</code>
                          <Badge variant="outline" className="text-xs">
                            {param.schema?.type || 'string'}
                          </Badge>
                          {param.required && (
                            <Badge variant="destructive" className="text-xs">required</Badge>
                          )}
                        </div>
                        {param.description && (
                          <div className="prose prose-sm max-w-none">
                            <ReactMarkdown components={MarkdownComponents}>
                              {param.description}
                            </ReactMarkdown>
                          </div>
                        )}
                        {param.example && (
                          <code className="block text-sm text-muted-foreground bg-muted p-2 rounded">
                            Example: {String(param.example)}
                          </code>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {bodyParamsSchema && (
              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-foreground">Request Body</h3>
                <Card>
                  <CardContent className="p-4 space-y-3">
                    <Badge variant="secondary" className="text-xs">application/json</Badge>
                    {bodyParamsSchema.schema && (
                      <pre className="text-sm overflow-x-auto bg-muted p-4 rounded-md border">
                        <code className="text-foreground">
                          {JSON.stringify(bodyParamsSchema.example || bodyParamsSchema.schema, null, 2)}
                        </code>
                      </pre>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}
          </div>

          <Separator className="my-8" />

          {/* RESPONSE SECTION */}
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">Responses</h2>

            {Object.keys(responses).length === 0 ? (
              <Card>
                <CardContent className="p-6">
                  <p className="text-muted-foreground text-center">No response documentation available</p>
                </CardContent>
              </Card>
            ) : (
              <Accordion type="single" collapsible className="space-y-2">
                {Object.entries(responses).map(([statusCode, response]: [string, any]) => {
                  const content = response.content?.['application/json'];
                  const examples = content?.examples || {};
                  const schema = content?.schema;

                  return (
                    <AccordionItem
                      key={statusCode}
                      value={statusCode}
                      className="border rounded-lg overflow-hidden"
                    >
                      <AccordionTrigger className="hover:no-underline px-6 py-4 hover:bg-accent">
                        <div className="flex items-center gap-3 w-full">
                          <Badge className={cn("font-mono font-semibold", getStatusColor(statusCode))}>
                            {statusCode}
                          </Badge>
                          <span className="text-foreground font-medium text-left flex-1">
                            {response.description || 'Response'}
                          </span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="px-6 pb-4">
                        <div className="space-y-4">
                          {response.description && (
                            <div className="prose prose-sm max-w-none">
                              <ReactMarkdown components={MarkdownComponents}>
                                {response.description}
                              </ReactMarkdown>
                            </div>
                          )}

                          {response.headers && Object.keys(response.headers).length > 0 && (
                            <div className="space-y-2">
                              <h4 className="text-foreground font-semibold text-sm">Response Headers</h4>
                              <div className="space-y-2">
                                {Object.entries(response.headers).map(([headerName, headerInfo]: [string, any]) => (
                                  <Card key={headerName}>
                                    <CardContent className="p-3 space-y-1">
                                      <div className="flex items-center gap-2">
                                        <code className="text-foreground font-medium text-sm">{headerName}</code>
                                        <Badge variant="outline" className="text-xs">
                                          {headerInfo.schema?.type || 'string'}
                                        </Badge>
                                      </div>
                                      {headerInfo.description && (
                                        <div className="prose prose-sm max-w-none">
                                          <ReactMarkdown components={MarkdownComponents}>
                                            {headerInfo.description}
                                          </ReactMarkdown>
                                        </div>
                                      )}
                                    </CardContent>
                                  </Card>
                                ))}
                              </div>
                            </div>
                          )}

                          {content && (
                            <div className="space-y-2">
                              <h4 className="text-foreground font-semibold text-sm">Response Body</h4>

                              {Object.keys(examples).length > 0 ? (
                                <div className="space-y-3">
                                  {Object.entries(examples).map(([exampleName, exampleData]: [string, any]) => (
                                    <div key={exampleName} className="space-y-2">
                                      <p className="text-muted-foreground text-sm">
                                        {exampleData.summary || exampleName}
                                      </p>
                                      <pre className="text-sm overflow-x-auto bg-muted p-4 rounded-md border">
                                        <code className="text-foreground">
                                          {JSON.stringify(exampleData.value || exampleData, null, 2)}
                                        </code>
                                      </pre>
                                    </div>
                                  ))}
                                </div>
                              ) : schema ? (
                                <pre className="text-sm overflow-x-auto bg-muted p-4 rounded-md border">
                                  <code className="text-foreground">
                                    {JSON.stringify(content.example || schema, null, 2)}
                                  </code>
                                </pre>
                              ) : (
                                <p className="text-muted-foreground text-sm">No example available</p>
                              )}
                            </div>
                          )}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  );
                })}
              </Accordion>
            )}
          </div>
        </div>
      </div>

      {/* Try It Modal - Postman Style */}
      <PostmanTryItModal
        open={showTryItModal}
        onOpenChange={setShowTryItModal}
        method={method}
        path={path}
        pathParamsList={pathParamsList}
        queryParamsList={queryParamsList}
        headerParamsList={headerParamsList}
        bodyParamsSchema={bodyParamsSchema}
        hasAuth={hasAuth ?? false}
        baseUrl="https://petstore3.swagger.io/api/v3" // Replace with your actual base URL
      />
    </>
  );
}