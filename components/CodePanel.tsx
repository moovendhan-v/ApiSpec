'use client';

import React, { useState, useMemo } from 'react';
import { Endpoint, OpenAPISpec, generateCodeExample } from '@/lib/openapi-parser';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/cjs/styles/prism';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Copy, Check, ChevronDown } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

interface CodePanelProps {
  endpoint: Endpoint | null;
  spec: OpenAPISpec;
}

type RequestType = 'shell' | 'javascript' | 'java' | 'swift';

export default function CodePanel({ endpoint, spec }: CodePanelProps) {
  const [activeTab, setActiveTab] = useState<RequestType>('shell');
  const [activeSubTab, setActiveSubTab] = useState<string>('curl');
  const [copiedRequest, setCopiedRequest] = useState(false);
  const [copiedResponse, setCopiedResponse] = useState(false);
  
  if (!endpoint) {
    return (
      <div className="h-full flex items-center justify-center bg-background p-6">
        <div className="text-center space-y-2">
          <p className="text-muted-foreground">
            Select an endpoint to view code examples
          </p>
          <p className="text-xs text-muted-foreground/70">
            Choose from the API endpoints on the left
          </p>
        </div>
      </div>
    );
  }
  
  const shellTabs = [
    { name: 'cURL', value: 'curl' },
    { name: 'cURL-Windows', value: 'curl-windows' },
    { name: 'Httpie', value: 'httpie' },
    { name: 'wget', value: 'wget' },
    { name: 'PowerShell', value: 'powershell' },
  ];
  
  const getCodeLanguage = useMemo(() => {
    if (activeTab === 'shell') {
      return activeSubTab;
    }
    return activeTab;
  }, [activeTab, activeSubTab]);
  
  const codeExample = useMemo(() => {
    return generateCodeExample(endpoint, spec, getCodeLanguage as any);
  }, [endpoint, spec, getCodeLanguage]);
  
  const getResponseExample = () => {
    const response = endpoint.operation.responses['200'];
    if (response?.content?.['application/json']?.example) {
      return JSON.stringify(response.content['application/json'].example, null, 2);
    }
    return '{}';
  };
  
  const getSyntaxLanguage = () => {
    if (activeTab === 'shell') {
      if (activeSubTab === 'powershell') return 'powershell';
      return 'bash';
    }
    return activeTab;
  };

  const copyToClipboard = async (text: string, type: 'request' | 'response') => {
    await navigator.clipboard.writeText(text);
    if (type === 'request') {
      setCopiedRequest(true);
      setTimeout(() => setCopiedRequest(false), 2000);
    } else {
      setCopiedResponse(true);
      setTimeout(() => setCopiedResponse(false), 2000);
    }
  };
  
  return (
    <div className="h-full flex flex-col bg-background">
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as RequestType)} className="h-full flex flex-col">
        {/* Header with Tabs */}
        <div className="border-b bg-card sticky top-0 z-10">
          <div className="flex items-center justify-between px-4 py-2">
            <h2 className="text-sm font-semibold">Request</h2>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 px-2">
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>Export as Postman Collection</DropdownMenuItem>
                <DropdownMenuItem>Copy as cURL</DropdownMenuItem>
                <DropdownMenuItem>Settings</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          
          {/* Main Language Tabs */}
          <TabsList className="w-full h-auto rounded-none bg-transparent border-b-0 p-0 justify-start">
            <TabsTrigger 
              value="shell" 
              className="rounded-none data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none h-10 px-4"
            >
              Shell
            </TabsTrigger>
            <TabsTrigger 
              value="javascript"
              className="rounded-none data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none h-10 px-4"
            >
              JavaScript
            </TabsTrigger>
            <TabsTrigger 
              value="java"
              className="rounded-none data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none h-10 px-4"
            >
              Java
            </TabsTrigger>
            <TabsTrigger 
              value="swift"
              className="rounded-none data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none h-10 px-4"
            >
              Swift
            </TabsTrigger>
          </TabsList>
          
          {/* Shell Sub-tabs */}
          {activeTab === 'shell' && (
            <div className="border-t bg-muted/30">
              <div className="flex overflow-x-auto px-2">
                {shellTabs.map((subTab) => (
                  <Button
                    key={subTab.value}
                    variant="ghost"
                    size="sm"
                    onClick={() => setActiveSubTab(subTab.value)}
                    className={cn(
                      "rounded-none h-9 text-xs px-3 shrink-0",
                      activeSubTab === subTab.value 
                        ? "bg-background text-foreground font-medium border-b-2 border-primary" 
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {subTab.name}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </div>
        
        {/* Content Area with improved styling */}
        <div className="flex-1 overflow-y-auto">
          <TabsContent value="shell" className="mt-0 p-4 space-y-3">
            <CodeBlock
              title="Request"
              code={codeExample}
              language={getSyntaxLanguage()}
              onCopy={() => copyToClipboard(codeExample, 'request')}
              copied={copiedRequest}
            />
            <CodeBlock
              title="Response"
              code={getResponseExample()}
              language="json"
              onCopy={() => copyToClipboard(getResponseExample(), 'response')}
              copied={copiedResponse}
            />
          </TabsContent>
          
          <TabsContent value="javascript" className="mt-0 p-4 space-y-3">
            <CodeBlock
              title="Request"
              code={codeExample}
              language="javascript"
              onCopy={() => copyToClipboard(codeExample, 'request')}
              copied={copiedRequest}
            />
            <CodeBlock
              title="Response"
              code={getResponseExample()}
              language="json"
              onCopy={() => copyToClipboard(getResponseExample(), 'response')}
              copied={copiedResponse}
            />
          </TabsContent>
          
          <TabsContent value="java" className="mt-0 p-4 space-y-3">
            <CodeBlock
              title="Request"
              code={codeExample}
              language="java"
              onCopy={() => copyToClipboard(codeExample, 'request')}
              copied={copiedRequest}
            />
            <CodeBlock
              title="Response"
              code={getResponseExample()}
              language="json"
              onCopy={() => copyToClipboard(getResponseExample(), 'response')}
              copied={copiedResponse}
            />
          </TabsContent>
          
          <TabsContent value="swift" className="mt-0 p-4 space-y-3">
            <CodeBlock
              title="Request"
              code={codeExample}
              language="swift"
              onCopy={() => copyToClipboard(codeExample, 'request')}
              copied={copiedRequest}
            />
            <CodeBlock
              title="Response"
              code={getResponseExample()}
              language="json"
              onCopy={() => copyToClipboard(getResponseExample(), 'response')}
              copied={copiedResponse}
            />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}

// Enhanced CodeBlock Component
interface CodeBlockProps {
  title: string;
  code: string;
  language: string;
  onCopy: () => void;
  copied: boolean;
}

function CodeBlock({ title, code, language, onCopy, copied }: CodeBlockProps) {
  return (
    <Card className="overflow-hidden shadow-sm">
      <CardHeader className="py-2 px-4 bg-muted/40 border-b">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            {title}
          </CardTitle>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={onCopy}
            className="h-7 px-2 text-xs hover:bg-background"
          >
            {copied ? (
              <>
                <Check className="h-3 w-3 mr-1 text-green-500" />
                Copied
              </>
            ) : (
              <>
                <Copy className="h-3 w-3 mr-1" />
                Copy
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-hidden">
          <SyntaxHighlighter
            language={language}
            style={vscDarkPlus}
            customStyle={{
              margin: 0,
              padding: '1rem',
              fontSize: '0.813rem',
              lineHeight: '1.5',
              background: 'hsl(var(--muted) / 0.3)',
              borderRadius: 0,
            }}
            showLineNumbers
            wrapLines
          >
            {code}
          </SyntaxHighlighter>
        </div>
      </CardContent>
    </Card>
  );
}