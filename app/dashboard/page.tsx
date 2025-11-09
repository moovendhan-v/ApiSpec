"use client"

import React, { useEffect, useState } from 'react';
import { FileText, Users, Clock, TrendingUp, Plus, Search, Filter, MoreVertical, Eye, Download, Share2, Edit, Trash2 } from 'lucide-react';
import { useTheme } from 'next-themes';

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

export default function Dashboard() {
  const [searchQuery, setSearchQuery] = useState('');

  const { theme } = useTheme();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        const response = await fetch('/api/documents');
        if (!response.ok) {
          throw new Error('Failed to fetch documents');
        }
        const data = await response.json();
        setDocuments(data);
      } catch (error) {
        console.error('Error fetching documents:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDocuments();
  }, []);

  const docuemtnCount = documents.length;

  const stats = [
    { label: 'Total API Specs', value: docuemtnCount, icon: FileText, change: '+12%', trend: 'up' },
    { label: 'Team Members', value: '8', icon: Users, change: '+2', trend: 'up' },
    { label: 'Recent Updates', value: '15', icon: Clock, change: 'Today', trend: 'neutral' },
    { label: 'Active Projects', value: '6', icon: TrendingUp, change: '+3', trend: 'up' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Header */}
      <header className="border-b border-white/10 bg-black/20 backdrop-blur-xl sticky top-16 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white">Dashboard</h1>
              <p className="text-slate-400 mt-1">Manage your API specifications</p>
            </div>
            <button className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white px-5 py-2.5 rounded-lg font-medium transition-all shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50">
              <Plus className="w-4 h-4" />
              New API Spec
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, idx) => (
            <div key={idx} className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all hover:scale-105 hover:shadow-xl">
              <div className="flex items-start justify-between mb-4">
                <div className={`p-3 rounded-xl bg-gradient-to-br ${
                  stat.trend === 'up' ? 'from-blue-500/20 to-cyan-500/20' : 'from-slate-500/20 to-slate-600/20'
                }`}>
                  <stat.icon className="w-6 h-6 text-cyan-400" />
                </div>
                <span className={`text-sm font-medium px-2.5 py-1 rounded-full ${
                  stat.trend === 'up' ? 'bg-green-500/20 text-green-400' : 'bg-slate-500/20 text-slate-400'
                }`}>
                  {stat.change}
                </span>
              </div>
              <div className="text-3xl font-bold text-white mb-1">{stat.value}</div>
              <div className="text-slate-400 text-sm">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Search and Filter Bar */}
        {/* <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Search API specifications..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent"
              />
            </div>
            <button className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white px-5 py-3 rounded-xl font-medium transition-all">
              <Filter className="w-4 h-4" />
              Filter
            </button>
          </div>
        </div> */}

        {/* Recent API Specs Table */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden">
          <div className="p-6 border-b border-white/10">
            <h2 className="text-xl font-bold text-white">Recent API Specifications</h2>
            <p className="text-slate-400 text-sm mt-1">Your latest API documentation and specs</p>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left px-6 py-4 text-sm font-semibold text-slate-400">Name</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-slate-400">Version</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-slate-400">Status</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-slate-400">Team</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-slate-400">Last Modified</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-slate-400">Actions</th>
                </tr>
              </thead>
              <tbody>
                {documents.map((spec) => (
                  <tr key={spec.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500/20 to-cyan-500/20 flex items-center justify-center">
                          <FileText className="w-5 h-5 text-cyan-400" />
                        </div>
                        <span className="text-white font-medium">{spec.title}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-slate-300 font-mono text-sm">{spec.createdAt}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                        spec.isPublic ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
                        'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                      }`}>
                        {spec.isPublic ? 'Public' : 'Private'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-300">{spec.user.name}</td>
                    <td className="px-6 py-4 text-slate-400 text-sm">{spec.updatedAt}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button className="p-2 hover:bg-white/10 rounded-lg transition-colors text-slate-400 hover:text-white" title="View">
                          <Eye className="w-4 h-4" />
                        </button>
                        <button className="p-2 hover:bg-white/10 rounded-lg transition-colors text-slate-400 hover:text-white" title="Edit">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button className="p-2 hover:bg-white/10 rounded-lg transition-colors text-slate-400 hover:text-white" title="Share">
                          <Share2 className="w-4 h-4" />
                        </button>
                        <button className="p-2 hover:bg-white/10 rounded-lg transition-colors text-slate-400 hover:text-red-400" title="More">
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="p-6 border-t border-white/10 flex items-center justify-between">
            <p className="text-slate-400 text-sm">Showing {documents.length} of {documents.length} API specifications</p>
            <button className="text-blue-400 hover:text-blue-300 font-medium text-sm transition-colors">
              View All →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}