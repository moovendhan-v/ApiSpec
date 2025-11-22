"use client"

import React, { useEffect, useState } from 'react';
import { FileText, Users, Clock, TrendingUp, Plus, Search, Filter, MoreVertical, Eye, Download, Share2, Edit, Trash2, GitBranch, Activity, Globe, Lock, Calendar, Tag } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

type Document = {
  id: string;
  title: string;
  description: string | null;
  isPublic: boolean;
  version?: number;
  status?: string;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
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

type DashboardStats = {
  totalDocs: number;
  publicDocs: number;
  privateDocs: number;
  recentActivity: number;
  draftDocs: number;
  publishedDocs: number;
};

export default function Dashboard() {
  const [searchQuery, setSearchQuery] = useState('');
  const { theme } = useTheme();
  const { data: session } = useSession();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState<PaginationData | null>(null);
  const [stats, setStats] = useState<DashboardStats>({
    totalDocs: 0,
    publicDocs: 0,
    privateDocs: 0,
    recentActivity: 0,
    draftDocs: 0,
    publishedDocs: 0,
  });
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
      setDocuments(data.documents);
      setPagination(data.pagination);
      
      // Calculate stats
      const publicCount = data.documents.filter((d: Document) => d.isPublic).length;
      const draftCount = data.documents.filter((d: Document) => d.status === 'draft').length;
      const publishedCount = data.documents.filter((d: Document) => d.status === 'published').length;
      const recentCount = data.documents.filter((d: Document) => {
        const updatedDate = new Date(d.updatedAt);
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return updatedDate > weekAgo;
      }).length;

      setStats({
        totalDocs: data.pagination.totalCount,
        publicDocs: publicCount,
        privateDocs: data.pagination.totalCount - publicCount,
        recentActivity: recentCount,
        draftDocs: draftCount,
        publishedDocs: publishedCount,
      });
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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const statCards = [
    { label: 'Total Documents', value: stats.totalDocs, icon: FileText, color: 'blue', change: '+12%' },
    { label: 'Public Specs', value: stats.publicDocs, icon: Globe, color: 'green', change: '+8%' },
    { label: 'Private Specs', value: stats.privateDocs, icon: Lock, color: 'purple', change: '+5%' },
    { label: 'Recent Activity', value: stats.recentActivity, icon: Activity, color: 'orange', change: '+15%' },
    { label: 'Draft Documents', value: stats.draftDocs, icon: Edit, color: 'yellow', change: '-3%' },
    { label: 'Published', value: stats.publishedDocs, icon: TrendingUp, color: 'teal', change: '+20%' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  const getColorClasses = (color: string) => {
    const colors: Record<string, string> = {
      blue: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
      green: 'bg-green-500/10 text-green-600 dark:text-green-400',
      purple: 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
      orange: 'bg-orange-500/10 text-orange-600 dark:text-orange-400',
      yellow: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400',
      teal: 'bg-teal-500/10 text-teal-600 dark:text-teal-400',
    };
    return colors[color] || colors.blue;
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
          <p className="text-muted-foreground">Welcome back, {session?.user?.name || 'User'}! Here's your API documentation overview.</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {statCards.map((stat, idx) => (
            <div key={idx} className="bg-card border rounded-lg p-6 hover:shadow-lg transition-all">
              <div className="flex items-start justify-between mb-4">
                <div className={`p-3 rounded-lg ${getColorClasses(stat.color)}`}>
                  <stat.icon className="w-6 h-6" />
                </div>
                <span className={`text-sm font-medium px-2.5 py-1 rounded-full ${
                  stat.change.startsWith('+') ? 'bg-green-500/10 text-green-600 dark:text-green-400' : 'bg-red-500/10 text-red-600 dark:text-red-400'
                }`}>
                  {stat.change}
                </span>
              </div>
              <div className="text-3xl font-bold mb-1">{stat.value}</div>
              <div className="text-muted-foreground text-sm">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Button onClick={() => router.push('/createdoc')} className="h-auto py-4 flex items-center gap-3">
            <Plus className="w-5 h-5" />
            <span>Create New Document</span>
          </Button>
          <Button variant="outline" onClick={() => router.push('/documents')} className="h-auto py-4 flex items-center gap-3">
            <FileText className="w-5 h-5" />
            <span>View All Documents</span>
          </Button>
          <Button variant="outline" className="h-auto py-4 flex items-center gap-3">
            <GitBranch className="w-5 h-5" />
            <span>Version History</span>
          </Button>
        </div>

        {/* Recent API Specs Table */}
        <div className="bg-card border rounded-lg overflow-hidden">
          <div className="p-6 border-b flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold">Recent API Specifications</h2>
              <p className="text-muted-foreground text-sm mt-1">Your latest API documentation and specs</p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <Filter className="w-4 h-4 mr-2" />
                Filter
              </Button>
              <Button variant="outline" size="sm">
                <Search className="w-4 h-4 mr-2" />
                Search
              </Button>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left px-6 py-4 text-sm font-semibold text-muted-foreground">Document</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-muted-foreground">Version</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-muted-foreground">Status</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-muted-foreground">Visibility</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-muted-foreground">Tags</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-muted-foreground">Last Modified</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {documents.map((spec) => (
                  <tr key={spec.id} className="border-b hover:bg-muted/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <FileText className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <div className="font-medium">{spec.title}</div>
                          {spec.description && (
                            <div className="text-xs text-muted-foreground mt-1 line-clamp-1">
                              {spec.description}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <GitBranch className="w-4 h-4 text-muted-foreground" />
                        <span className="font-mono text-sm">v{spec.version || 1}.0</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                        spec.status === 'published' ? 'bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20' :
                        spec.status === 'draft' ? 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border border-yellow-500/20' :
                        'bg-gray-500/10 text-gray-600 dark:text-gray-400 border border-gray-500/20'
                      }`}>
                        {spec.status || 'draft'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${
                        spec.isPublic ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20' :
                        'bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20'
                      }`}>
                        {spec.isPublic ? <Globe className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
                        {spec.isPublic ? 'Public' : 'Private'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {spec.tags && spec.tags.length > 0 ? (
                          spec.tags.slice(0, 2).map((tag, idx) => (
                            <span key={idx} className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs bg-muted text-muted-foreground">
                              <Tag className="w-3 h-3" />
                              {tag}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-muted-foreground">No tags</span>
                        )}
                        {spec.tags && spec.tags.length > 2 && (
                          <span className="text-xs text-muted-foreground">+{spec.tags.length - 2}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-muted-foreground text-sm">
                        <Clock className="w-4 h-4" />
                        {formatDate(spec.updatedAt)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1">
                        <button 
                          onClick={() => router.push(`/openapi/${spec.id}`)} 
                          className="p-2 hover:bg-muted rounded-lg transition-colors text-muted-foreground hover:text-foreground" 
                          title="View"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => router.push(`/documents/${spec.id}/edit`)} 
                          className="p-2 hover:bg-muted rounded-lg transition-colors text-muted-foreground hover:text-foreground" 
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button 
                          className="p-2 hover:bg-muted rounded-lg transition-colors text-muted-foreground hover:text-foreground" 
                          title="Share"
                        >
                          <Share2 className="w-4 h-4" />
                        </button>
                        <button 
                          className="p-2 hover:bg-muted rounded-lg transition-colors text-muted-foreground hover:text-destructive" 
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
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