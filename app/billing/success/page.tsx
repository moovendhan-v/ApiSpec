'use client';

import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle } from 'lucide-react';

export default function SuccessPage() {
  const router = useRouter();

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <CheckCircle className="w-16 h-16 text-green-500" />
            </div>
            <CardTitle className="text-2xl">Subscription Successful!</CardTitle>
            <CardDescription>
              Thank you for subscribing. Your account has been upgraded.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-muted p-4 rounded-lg">
              <h3 className="font-semibold mb-2">What's Next?</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Your new plan features are now active</li>
                <li>• You can manage your subscription in the billing page</li>
                <li>• Check your email for the receipt</li>
                <li>• Start creating more API documentation</li>
              </ul>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button onClick={() => router.push('/documents')} className="flex-1">
                Go to Documents
              </Button>
              <Button onClick={() => router.push('/billing')} variant="outline" className="flex-1">
                View Billing
              </Button>
            </div>
            
            <div className="text-center pt-4">
              <Button 
                variant="link" 
                onClick={() => router.push('/pricing')}
                className="text-sm text-muted-foreground"
              >
                ← Back to Pricing
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
