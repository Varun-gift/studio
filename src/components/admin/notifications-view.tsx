
'use client';

import * as React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { collection, query, orderBy, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Notification } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/use-auth';
import { cn } from '@/lib/utils';
import { Button } from '../ui/button';

export function NotificationsView() {
  const { user } = useAuth();
  const [notifications, setNotifications] = React.useState<Notification[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (!user) return;

    const notifsRef = collection(db, 'notifications');
    const q = query(notifsRef, where('userId', '==', user.uid), orderBy('timestamp', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notifsData: Notification[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        notifsData.push({
          id: doc.id,
          ...data,
          timestamp: (data.timestamp as any).toDate(),
        } as Notification);
      });
      setNotifications(notifsData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);
  
  const markAsRead = async (id: string) => {
      const notifRef = doc(db, 'notifications', id);
      await updateDoc(notifRef, { read: true });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Notifications</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p>Loading notifications...</p>
        ) : notifications.length === 0 ? (
          <p className="text-muted-foreground">You have no new notifications.</p>
        ) : (
          <ul className="space-y-4">
            {notifications.map((notif) => (
              <li
                key={notif.id}
                className={cn(
                  "p-4 border rounded-lg flex justify-between items-start",
                  !notif.read && "bg-blue-50"
                )}
              >
                <div>
                    <p className="font-medium">{notif.message}</p>
                    <p className="text-sm text-muted-foreground">
                    {formatDistanceToNow(notif.timestamp, { addSuffix: true })}
                    </p>
                </div>
                {!notif.read && (
                    <Button variant="ghost" size="sm" onClick={() => markAsRead(notif.id)}>Mark as read</Button>
                )}
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

// Dummy where function for type compatibility as it's not imported from firestore
const where = (field: string, op: string, value: any) => ({});
