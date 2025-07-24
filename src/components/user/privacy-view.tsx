
'use client';

import { ArrowLeft } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';

interface PrivacyViewProps {
    onBack: () => void;
}

export function PrivacyView({ onBack }: PrivacyViewProps) {
    return (
        <div className="space-y-4">
            <Button variant="outline" size="sm" onClick={onBack} className="mb-4">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Profile
            </Button>
            <Card>
                <CardHeader>
                    <CardTitle>Privacy and Sharing</CardTitle>
                    <CardDescription>Manage how your information is shared.</CardDescription>
                </CardHeader>
                <CardContent>
                    <p>This is a placeholder for Privacy and Sharing settings. This section will allow users to manage their data privacy preferences in the future.</p>
                </CardContent>
            </Card>
        </div>
    );
}
