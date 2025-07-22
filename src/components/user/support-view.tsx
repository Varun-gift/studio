
'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Phone, Mail } from 'lucide-react';

const supportContacts = [
  {
    name: 'Madhushudhana Raju N',
    phone: '9845038487',
    email: 'Madhushudhana@gmail.com',
  },
  {
    name: 'Ashik',
    phone: '9900064283',
    email: 'ashik@gmail.com',
  },
  {
    name: 'Srinivas Raju',
    phone: '9886640752',
    email: 'srinivasr@gmail.com',
  },
];

export function SupportView() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Contact Support</CardTitle>
        <CardDescription>
          Our team is here to help. Reach out to us via phone or email.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {supportContacts.map((contact) => (
          <div key={contact.name} className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 border rounded-lg">
            <Avatar className="h-12 w-12">
              <AvatarFallback>{contact.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h3 className="font-semibold text-lg">{contact.name}</h3>
              <div className="text-muted-foreground space-y-1 mt-1">
                <a href={`tel:${contact.phone}`} className="flex items-center gap-2 hover:text-primary">
                  <Phone className="h-4 w-4" />
                  <span>{contact.phone}</span>
                </a>
                <a href={`mailto:${contact.email}`} className="flex items-center gap-2 hover:text-primary">
                  <Mail className="h-4 w-4" />
                  <span>{contact.email}</span>
                </a>
              </div>
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
               <Button asChild variant="outline" className="flex-1">
                <a href={`tel:${contact.phone}`}>
                  <Phone className="mr-2 h-4 w-4" /> Call
                </a>
              </Button>
              <Button asChild variant="outline" className="flex-1">
                <a href={`mailto:${contact.email}`}>
                  <Mail className="mr-2 h-4 w-4" /> Email
                </a>
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
