
'use client';

import { ProductList } from '@/components/user/product-list';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function ProductsPage() {
    return (
        <div className="min-h-screen bg-muted/40 p-4 sm:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto">
                <div className="mb-6 flex items-center gap-4">
                    <Button variant="outline" size="sm" asChild>
                        <Link href="/user">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Dashboard
                        </Link>
                    </Button>
                </div>
                <ProductList />
            </div>
        </div>
    );
}
