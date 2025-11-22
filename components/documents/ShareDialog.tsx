'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  Share2,
  Copy,
  Check,
  Clock,
  Shield,
  Eye,
  Edit,
  Download,
  Link as LinkIcon,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';

interface ShareDialogProps {
  documentId: string;
  documentTitle: string;
  variant?: 'icon' | 'button';
}

interface ShareLink {
  token: string;
  shareUrl: string;
  expiresAt: string;
  expiryHours: number;
  permissions: {
    canView: boolean;
    canEdit: boolean;
    canDownload: boolean;
  };
}

export function ShareDialog({ documentId, documentTitle, variant = 'icon' }: ShareDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [shareLink, setShareLink] = useState<ShareLink | null>(null);
  const [copied, setCopied] = useState(false);

  // Share settings
  const [expiryHours, setExpiryHours] = useState('24');
  const [canEdit, setCanEdit] = useState(false);
  const [canDownload, setCanDownload] = useState(true);

  const generateShareLink = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/documents/${documentId}/share`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          expiryHours: parseInt(expiryHours),
          canEdit,
          canDownload,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setShareLink(data);
        toast.success('Share link generated successfully');
      } else {
        toast.error('Failed to generate share link');
      }
    } catch (error) {
      console.error('Error generating share link:', error);
      toast.error('Failed to generate share link');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success('Link copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error('Failed to copy link');
    }
  };

  const getExpiryLabel = (hours: string) => {
    const h = parseInt(hours);
    if (h < 24) return `${h} hour${h > 1 ? 's' : ''}`;
    const days = Math.floor(h / 24);
    return `${days} day${days > 1 ? 's' : ''}`;
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {variant === 'button' ? (
          <Button variant="outline" size="sm">
            <Share2 className="w-4 h-4 mr-2" />
            Share
          </Button>
        ) : (
          <Button variant="ghost" size="icon" title="Share">
            <Share2 className="w-4 h-4" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="w-5 h-5" />
            Share Document
          </DialogTitle>
          <DialogDescription>
            Generate a secure, time-limited link to share "{documentTitle}"
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="create" className="mt-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="create">Create Link</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="create" className="space-y-4 mt-4">
            {!shareLink ? (
              <div className="space-y-4">
                <div className="p-4 bg-muted rounded-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Expiry Time</span>
                    </div>
                    <Badge variant="outline">{getExpiryLabel(expiryHours)}</Badge>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Eye className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm font-medium">View Access</span>
                    </div>
                    <Badge variant="default">Enabled</Badge>
                  </div>

                  {canEdit && (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Edit className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm font-medium">Edit Access</span>
                      </div>
                      <Badge variant="default">Enabled</Badge>
                    </div>
                  )}

                  {canDownload && (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Download className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm font-medium">Download Access</span>
                      </div>
                      <Badge variant="default">Enabled</Badge>
                    </div>
                  )}
                </div>

                <Button
                  onClick={generateShareLink}
                  disabled={loading}
                  className="w-full"
                  size="lg"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Generating Link...
                    </>
                  ) : (
                    <>
                      <LinkIcon className="w-4 h-4 mr-2" />
                      Generate Share Link
                    </>
                  )}
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                  <div className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <h4 className="font-medium text-green-500 mb-1">
                        Share Link Generated
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        Anyone with this link can access the document until{' '}
                        {new Date(shareLink.expiresAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Share URL</Label>
                  <div className="flex gap-2">
                    <Input
                      value={shareLink.shareUrl}
                      readOnly
                      className="font-mono text-sm"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => copyToClipboard(shareLink.shareUrl)}
                    >
                      {copied ? (
                        <Check className="w-4 h-4 text-green-500" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>

                <div className="p-4 bg-muted rounded-lg space-y-3">
                  <h4 className="font-medium text-sm flex items-center gap-2">
                    <Shield className="w-4 h-4" />
                    Link Details
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Expires in:</span>
                      <span className="font-medium">
                        {getExpiryLabel(shareLink.expiryHours.toString())}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Expires at:</span>
                      <span className="font-medium">
                        {new Date(shareLink.expiresAt).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">View Access:</span>
                      <Badge variant="outline" className="text-xs">
                        {shareLink.permissions.canView ? 'Yes' : 'No'}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Edit Access:</span>
                      <Badge variant="outline" className="text-xs">
                        {shareLink.permissions.canEdit ? 'Yes' : 'No'}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Download Access:</span>
                      <Badge variant="outline" className="text-xs">
                        {shareLink.permissions.canDownload ? 'Yes' : 'No'}
                      </Badge>
                    </div>
                  </div>
                </div>

                <Button
                  variant="outline"
                  onClick={() => setShareLink(null)}
                  className="w-full"
                >
                  Generate New Link
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="settings" className="space-y-4 mt-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="expiry">Link Expiry Time</Label>
                <Select value={expiryHours} onValueChange={setExpiryHours}>
                  <SelectTrigger id="expiry">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 hour</SelectItem>
                    <SelectItem value="6">6 hours</SelectItem>
                    <SelectItem value="12">12 hours</SelectItem>
                    <SelectItem value="24">24 hours (1 day)</SelectItem>
                    <SelectItem value="72">72 hours (3 days)</SelectItem>
                    <SelectItem value="168">1 week</SelectItem>
                    <SelectItem value="336">2 weeks</SelectItem>
                    <SelectItem value="720">30 days</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  The link will automatically expire after this duration
                </p>
              </div>

              <div className="space-y-4 p-4 bg-muted rounded-lg">
                <h4 className="font-medium text-sm">Permissions</h4>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="view" className="text-sm font-normal">
                      View Access
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Allow viewing the document
                    </p>
                  </div>
                  <Badge variant="default" className="text-xs">
                    Always Enabled
                  </Badge>
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="edit" className="text-sm font-normal">
                      Edit Access
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Allow editing the document (coming soon)
                    </p>
                  </div>
                  <Switch
                    id="edit"
                    checked={canEdit}
                    onCheckedChange={setCanEdit}
                    disabled
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="download" className="text-sm font-normal">
                      Download Access
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Allow downloading the document
                    </p>
                  </div>
                  <Switch
                    id="download"
                    checked={canDownload}
                    onCheckedChange={setCanDownload}
                  />
                </div>
              </div>

              <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                <div className="flex items-start gap-2">
                  <Shield className="w-4 h-4 text-yellow-500 flex-shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-yellow-500 mb-1">Security Notice</p>
                    <p className="text-muted-foreground">
                      Anyone with the link can access the document. The link is secured with
                      HMAC signing and will expire automatically.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
