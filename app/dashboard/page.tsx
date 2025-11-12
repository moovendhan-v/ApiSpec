"use client"

import React, { useEffect, useState } from 'react';
import { FileText, Users, Clock, TrendingUp, Plus, Search, Filter, MoreVertical, Eye, Download, Share2, Edit, Trash2 } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

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

export default function Dashboard() {
  const [searchQuery, setSearchQuery] = useState('');
  const { theme } = useTheme();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState<PaginationData | null>(null);
  const router = useRouter();
  const itemsPerPage = 10;

  const fetchDocuments = async (page: number) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/documents?page=${page}&limit=${itemsPerPage}`);
      if (!response.ok) {
        throw new Error('Failed to fetch documents');
      }
      const data = await response.json();
      console.log(data);
      setDocuments(data.documents);
      setPagination(data.pagination);
    } catch (error) {
      console.error('Error fetching documents:', error);
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

  const stats = [
    { label: 'Total API Specs', value: pagination?.totalCount || 0, icon: FileText, change: '+12%', trend: 'up' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background pt-16">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pt-16">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, idx) => (
            <div key={idx} className="bg-card border rounded-lg p-6 hover:shadow-lg transition-all">
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 rounded-lg bg-primary/10">
                  <stat.icon className="w-6 h-6 text-primary" />
                </div>
                <span className="text-sm font-medium px-2.5 py-1 rounded-full bg-green-500/10 text-green-600 dark:text-green-400">
                  {stat.change}
                </span>
              </div>
              <div className="text-3xl font-bold mb-1">{stat.value}</div>
              <div className="text-muted-foreground text-sm">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Recent API Specs Table */}
        <div className="bg-card border rounded-lg overflow-hidden">
          <div className="p-6 border-b">
            <h2 className="text-xl font-bold">Recent API Specifications</h2>
            <p className="text-muted-foreground text-sm mt-1">Your latest API documentation and specs</p>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left px-6 py-4 text-sm font-semibold text-muted-foreground">Name</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-muted-foreground">Version</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-muted-foreground">Status</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-muted-foreground">Team</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-muted-foreground">Last Modified</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {documents.map((spec) => (
                  <tr key={spec.id} className="border-b hover:bg-muted/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <FileText className="w-5 h-5 text-primary" />
                        </div>
                        <span className="font-medium">{spec.title}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-mono text-sm">{spec.createdAt}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                        spec.isPublic ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20' :
                        'bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20'
                      }`}>
                        {spec.isPublic ? 'Public' : 'Private'}
                      </span>
                    </td>
                    <td className="px-6 py-4">{spec.user.name}</td>
                    <td className="px-6 py-4 text-muted-foreground text-sm">{spec.updatedAt}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => router.push(`/openapi/${spec.id}`)} 
                          className="p-2 hover:bg-muted rounded-lg transition-colors text-muted-foreground hover:text-foreground" 
                          title="View"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => router.push(`/openapi/${spec.id}/edit`)} 
                          className="p-2 hover:bg-muted rounded-lg transition-colors text-muted-foreground hover:text-foreground" 
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => router.push(`/openapi/${spec.id}/more`)} 
                          className="p-2 hover:bg-muted rounded-lg transition-colors text-muted-foreground hover:text-destructive" 
                          title="More"
                        >
                          {/* <MoreVertical className="w-4 h-4" /> */}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="p-6 border-t flex items-center justify-between">
            <p className="text-muted-foreground text-sm">
              {pagination && `Showing ${(pagination.page - 1) * pagination.limit + 1} to ${Math.min(pagination.page * pagination.limit, pagination.totalCount)} of ${pagination.totalCount} API specifications`}
            </p>
            
            {pagination && pagination.totalPages > 1 && (
              <div className="flex items-center gap-2">
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
          </div>
        </div>
      </div>
    </div>
  );
}