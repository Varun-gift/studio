
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
        <CardTitle>Ashik Mobile Generators – Support Contacts</CardTitle>
        <CardDescription>
          Our team is here to help. Reach out to us via phone or email.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {supportContacts.map((contact) => (
          <Card key={contact.name} className="flex flex-col">
            <CardHeader className="flex flex-row items-center gap-4">
               <Avatar className="h-12 w-12">
                  <AvatarFallback>{contact.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
               </Avatar>
                <div>
                  <h3 className="font-semibold text-lg">{contact.name}</h3>
                </div>
            </CardHeader>
            <CardContent className="flex-1 space-y-2">
                <a href={`tel:${contact.phone}`} className="flex items-center gap-2 hover:text-primary text-sm text-muted-foreground">
                  <Phone className="h-4 w-4" />
                  <span>{contact.phone}</span>
                </a>
                <a href={`mailto:${contact.email}`} className="flex items-center gap-2 hover:text-primary text-sm text-muted-foreground">
                  <Mail className="h-4 w-4" />
                  <span className="truncate">{contact.email}</span>
                </a>
            </CardContent>
            <CardContent className="flex gap-2">
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
            </CardContent>
          </Card>
        ))}
      </CardContent>
    </Card>
  );
}
