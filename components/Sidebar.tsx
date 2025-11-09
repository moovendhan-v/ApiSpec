'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { Endpoint, groupEndpointsByPath } from '@/lib/openapi-parser';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Search, ChevronRight, FolderOpen, Folder } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface SidebarProps {
  endpoints: Endpoint[];
  selectedEndpoint: Endpoint | null;
  onSelectEndpoint: (endpoint: Endpoint) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export default function APISidebar({
  endpoints,
  selectedEndpoint,
  onSelectEndpoint,
  searchQuery,
  onSearchChange,
}: SidebarProps) {

  useEffect(() => {
    if (!selectedEndpoint) return;
  
    const pathSegments = getPathSegments(selectedEndpoint.path);
    const expandedPaths = new Set<string>();
  
    // Build all parent paths that lead to the selected endpoint
    let currentPath = '';
    for (const segment of pathSegments) {
      currentPath = currentPath ? `${currentPath}/${segment}` : segment;
      expandedPaths.add(currentPath);
    }
  
    setExpandedCategories((prev) => new Set([...prev, ...expandedPaths]));
  }, [selectedEndpoint]);
  
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  const groupedEndpoints = useMemo(() => {
    return groupEndpointsByPath(endpoints);
  }, [endpoints]);

  const filteredEndpoints = useMemo(() => {
    if (!searchQuery) return groupedEndpoints;

    const filtered: Record<string, Endpoint[]> = {};
    const query = searchQuery.toLowerCase();

    for (const [category, categoryEndpoints] of Object.entries(groupedEndpoints)) {
      const matching = categoryEndpoints.filter(
        (ep) =>
          ep.path.toLowerCase().includes(query) ||
          ep.operation.summary?.toLowerCase().includes(query) ||
          ep.method.toLowerCase().includes(query)
      );

      if (matching.length > 0) {
        filtered[category] = matching;
        setExpandedCategories((prev) => new Set(prev).add(category));
      }
    }

    return filtered;
  }, [searchQuery, groupedEndpoints]);

  const toggleCategory = (category: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  };

  const expandAll = () => {
    const allPaths = new Set<string>();
    const collectPaths = (items: Record<string, any>, parentPath = '') => {
      Object.keys(items).forEach(key => {
        const fullPath = parentPath ? `${parentPath}/${key}` : key;
        allPaths.add(fullPath);
        if (items[key].children && Object.keys(items[key].children).length > 0) {
          collectPaths(items[key].children, fullPath);
        }
      });
    };
    collectPaths(buildNestedStructure());
    setExpandedCategories(allPaths);
  };

  const collapseAll = () => {
    setExpandedCategories(new Set());
  };

  const getPathSegments = (path: string): string[] => {
    return path.split('/').filter(Boolean);
  };

  const buildNestedStructure = () => {
    const structure: Record<string, any> = {};

    for (const [category, categoryEndpoints] of Object.entries(filteredEndpoints)) {
      const segments = getPathSegments(category);
      let current = structure;

      for (let i = 0; i < segments.length; i++) {
        const segment = segments[i];
        if (!current[segment]) {
          current[segment] = { endpoints: [], children: {} };
        }

        if (i === segments.length - 1) {
          current[segment].endpoints = categoryEndpoints;
        } else {
          current = current[segment].children;
        }
      }
    }

    return structure;
  };

  const renderNestedItems = (
    items: Record<string, any>,
    level: number = 0,
    parentPath: string = ''
  ) => {
    return Object.entries(items).map(([key, value]: [string, any]) => {
      const fullPath = parentPath ? `${parentPath}/${key}` : key;
      const isExpanded = expandedCategories.has(fullPath);
      const hasChildren = Object.keys(value.children || {}).length > 0;
      const hasEndpoints = value.endpoints && value.endpoints.length > 0;

      if (!hasChildren && !hasEndpoints) return null;

      return (
        <Collapsible
          key={fullPath}
          open={isExpanded}
          onOpenChange={() => toggleCategory(fullPath)}
        >
          <div className="space-y-1">
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                className={cn(
                  "w-full justify-start hover:bg-accent/50 transition-colors h-9",
                  isExpanded && "bg-accent/30"
                )}
                style={{ paddingLeft: `${level * 12 + 12}px` }}
              >
                {isExpanded ? (
                  <FolderOpen className="h-4 w-4 mr-2 text-primary shrink-0" />
                ) : (
                  <Folder className="h-4 w-4 mr-2 text-muted-foreground shrink-0" />
                )}
                <span className="font-medium text-sm truncate">{key}</span>
                <ChevronRight
                  className={cn(
                    "h-3 w-3 ml-auto transition-transform text-muted-foreground shrink-0",
                    isExpanded && "rotate-90"
                  )}
                />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-1">
              {hasEndpoints &&
                value.endpoints.map((endpoint: Endpoint) => {
                  const isSelected =
                    selectedEndpoint?.path === endpoint.path &&
                    selectedEndpoint?.method === endpoint.method;

                  return (
                    <Button
                      key={`${endpoint.method}-${endpoint.path}`}
                      variant="ghost"
                      onClick={() => onSelectEndpoint(endpoint)}
                      className={cn(
                        "w-full justify-start gap-2 hover:bg-accent/50 transition-colors h-8",
                        isSelected && "bg-accent text-accent-foreground border-l-2 border-primary font-medium"
                      )}
                      style={{ paddingLeft: `${(level + 1) * 12 + 12}px` }}
                    >
                      <Badge
                        variant="outline"
                        className={cn(
                          "px-1.5 py-0 text-[10px] font-bold border-0 uppercase shrink-0",
                          endpoint.method.toUpperCase() === 'GET' && "bg-blue-500/15 text-blue-400",
                          endpoint.method.toUpperCase() === 'POST' && "bg-green-500/15 text-green-400",
                          endpoint.method.toUpperCase() === 'PUT' && "bg-orange-500/15 text-orange-400",
                          endpoint.method.toUpperCase() === 'PATCH' && "bg-yellow-500/15 text-yellow-400",
                          endpoint.method.toUpperCase() === 'DELETE' && "bg-red-500/15 text-red-400"
                        )}
                      >
                        {endpoint.method}
                      </Badge>
                      <span className="text-xs truncate text-left">
                        {endpoint.operation.summary || endpoint.path}
                      </span>
                    </Button>
                  );
                })}
              {hasChildren && (
                <div>
                  {renderNestedItems(value.children, level + 1, fullPath)}
                </div>
              )}
            </CollapsibleContent>
          </div>
        </Collapsible>
      );
    });
  };

  const endpointCount = endpoints.length;
  const filteredCount = Object.values(filteredEndpoints).flat().length;

  return (
    <div className="flex flex-col h-full w-full bg-background border-r">
      {/* Header */}
      <div className="border-b p-4 space-y-3 shrink-0">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">API Endpoints</h2>
          <Badge variant="secondary" className="text-xs">
            {searchQuery ? filteredCount : endpointCount}
          </Badge>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search endpoints..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 h-9 bg-muted/50 border-border"
          />
        </div>
        {!searchQuery && (
          <div className="flex gap-2">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={expandAll}
              className="flex-1 h-8 text-xs"
            >
              Expand All
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={collapseAll}
              className="flex-1 h-8 text-xs"
            >
              Collapse All
            </Button>
          </div>
        )}
      </div>
      
      {/* Content */}
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {Object.keys(filteredEndpoints).length === 0 ? (
            <div className="px-4 py-8 text-center space-y-2">
              <p className="text-sm text-muted-foreground">No endpoints found</p>
              {searchQuery && (
                <Button 
                  variant="link" 
                  size="sm"
                  onClick={() => onSearchChange('')}
                  className="h-auto p-0 text-xs text-primary"
                >
                  Clear search
                </Button>
              )}
            </div>
          ) : (
            renderNestedItems(buildNestedStructure())
          )}
        </div>
      </ScrollArea>
    </div>
  );
}