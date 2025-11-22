'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import Link from 'next/link';
import { toast } from 'sonner';
import { useTheme } from 'next-themes';
import { FileText } from 'lucide-react';

type Document = {
  id: string;
  title: string;
  description: string | null;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
  user: {
    name: string | null;
    email: string | null;
    image: string | null;
  };
};

type PaginationData = {
  page: number;
  limit: number;
  totalCount: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
};

export default function DocumentsPage() {
  const { theme } = useTheme();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState<PaginationData | null>(null);
  const itemsPerPage = 3;

  const fetchDocuments = async (page: number) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/documents?page=${page}&limit=${itemsPerPage}`);
      if (!response.ok) {
        throw new Error('Failed to fetch documents');
      }
      const data = await response.json();
      setDocuments(data.documents);
      setPagination(data.pagination);
    } catch (error) {
      console.error('Error fetching documents:', error);
      toast.error('Failed to load documents');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments(currentPage);
  }, [currentPage]);

  const goToPage = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto py-8 px-4">
        <div className="flex flex-col space-y-2 mb-8">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold">Published API Specifications</h1>
            <Link href="/createdoc">
              <Button>
                <span className="hidden sm:inline">Create New</span>
                <span className="sm:hidden">+ New</span>
              </Button>
            </Link>
          </div>
          <p className="text-sm text-muted-foreground">
            Browse and manage all published API specifications
          </p>
        </div>

        {documents.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 border rounded-lg bg-card">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <FileText className="w-6 h-6 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium mb-2">No specifications found</h3>
            <p className="text-sm text-muted-foreground mb-4 max-w-md text-center">
              Get started by creating a new API specification or check back later for updates.
            </p>
            <Link href="/dashboard">
              <Button>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="mr-2 h-4 w-4"
                >
                  <path d="M5 12h14" />
                  <path d="M12 5v14" />
                </svg>
                New Specification
              </Button>
            </Link>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {documents.map((doc) => (
                <Card key={doc.id} className="flex flex-col h-full transition-all hover:shadow-lg">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start space-x-2">
                      <div className="space-y-1 flex-1 min-w-0">
                        <CardTitle className="text-xl line-clamp-1">{doc.title}</CardTitle>
                        <CardDescription className="line-clamp-2">
                          {doc.description || 'No description provided'}
                        </CardDescription>
                      </div>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${
                        doc.isPublic 
                          ? 'bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20' 
                          : 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20'
                      }`}>
                        {doc.isPublic ? 'Public' : 'Private'}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent className="flex-grow py-2 px-6">
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center text-muted-foreground">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="mr-2 h-4 w-4 flex-shrink-0"
                        >
                          <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
                          <line x1="16" x2="16" y1="2" y2="6" />
                          <line x1="8" x2="8" y1="2" y2="6" />
                          <line x1="3" x2="21" y1="10" y2="10" />
                        </svg>
                        <span>Created: {format(new Date(doc.createdAt), 'MMM d, yyyy')}</span>
                      </div>
                      {doc.user && (
                        <div className="flex items-center text-muted-foreground">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="mr-2 h-4 w-4 flex-shrink-0"
                          >
                            <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                            <circle cx="12" cy="7" r="4" />
                          </svg>
                          <div className="flex items-center min-w-0">
                            {doc.user.image && (
                              <img 
                                src={doc.user.image} 
                                alt={doc.user.name || 'User'} 
                                className="w-5 h-5 rounded-full mr-2 flex-shrink-0 ring-1 ring-border"
                              />
                            )}
                            <span className="truncate">
                              {doc.user.name || doc.user.email?.split('@')[0]}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                  <CardFooter className="border-t px-6 py-4">
                    <Link href={`/openapi/${doc.id}`} className="w-full">
                      <Button variant="outline" className="w-full group">
                        <span className="group-hover:underline">View Specification</span>
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1"
                        >
                          <path d="M5 12h14" />
                          <path d="m12 5 7 7-7 7" />
                        </svg>
                      </Button>
                    </Link>
                  </CardFooter>
                </Card>
              ))}
            </div>

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
              <div className="mt-8 flex justify-center items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={!pagination.hasPrevPage}
                >
                  Previous
                </Button>
                
                <div className="flex gap-1">
                  {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((page) => (
                    <Button
                      key={page}
                      variant={currentPage === page ? "default" : "outline"}
                      size="sm"
                      onClick={() => goToPage(page)}
                    >
                      {page}
                    </Button>
                  ))}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={!pagination.hasNextPage}
                >
                  Next
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}