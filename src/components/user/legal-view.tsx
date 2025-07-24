
'use client';

import { ArrowLeft } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';

interface LegalViewProps {
    onBack: () => void;
}

export function LegalView({ onBack }: LegalViewProps) {
    return (
        <div className="space-y-4">
            <Button variant="outline" size="sm" onClick={onBack} className="mb-4">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Profile
            </Button>
            <Card>
                <CardHeader>
                    <CardTitle>Legal and Terms</CardTitle>
                    <CardDescription>Terms of Service and Privacy Policy.</CardDescription>
                </CardHeader>
                <CardContent>
                    <p>This is a placeholder for Legal and Terms information. This section will be updated with the official terms of service and privacy policy for Ashik Mobile Generators.</p>
                </CardContent>
            </Card>
        </div>
    );
}
