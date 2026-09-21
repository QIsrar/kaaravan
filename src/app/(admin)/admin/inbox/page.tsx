'use client';

import { useState } from 'react';
import { AdminHeader } from '@/components/admin/header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Mail,
  Users,
  Download,
  CheckCircle,
  Clock,
  Eye,
  Search,
  MessageSquare,
  Sparkles,
} from 'lucide-react';
import toast from 'react-hot-toast';

interface Inquiry {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: 'unread' | 'resolved';
  date: string;
}

interface Subscriber {
  id: string;
  email: string;
  date: string;
  is_active: boolean;
}

const initialInquiries: Inquiry[] = [
  {
    id: 'inq_1',
    name: 'Zahra Karim',
    email: 'zahra.k@example.com',
    subject: 'Wholesale & Boutique Partnership',
    message:
      'Good afternoon, I operate a modest fashion boutique in London and would love to carry your Silk Chiffon Hijabs and Linen Abayas. Could you share your wholesale lookbook and minimum order quantities?',
    status: 'unread',
    date: '2026-09-21 14:00',
  },
  {
    id: 'inq_2',
    name: 'Sumayya Tariq',
    email: 'sumayya.t@example.com',
    subject: 'Sizing Advice for Linen Abaya',
    message:
      'Hello! I am 5 feet 7 inches tall and wondering if the Regular length in the Linen Everyday Abaya will reach my ankles or if you recommend sizing up for length?',
    status: 'unread',
    date: '2026-09-21 10:30',
  },
  {
    id: 'inq_3',
    name: 'Nadia El-Sayed',
    email: 'nadia.e@example.com',
    subject: 'Restock Question: Emerald Silk Hijab',
    message:
      'Hi team, will you be restocking the Silk Chiffon Hijab in Emerald Green before next month? It was sold out in my cart!',
    status: 'resolved',
    date: '2026-09-20 16:45',
  },
  {
    id: 'inq_4',
    name: 'Fatima Malik',
    email: 'fatima.m@example.com',
    subject: 'Order Tracking Inquiry',
    message:
      'Thank you so much for the quick shipping on my previous order. Just wanted to confirm delivery confirmation for order ord_1a87d4ef.',
    status: 'resolved',
    date: '2026-09-19 11:20',
  },
];

const initialSubscribers: Subscriber[] = [
  { id: 'sub_1', email: 'farah.siddiqui@gmail.com', date: '2026-09-21', is_active: true },
  { id: 'sub_2', email: 'amina.zahra@outlook.com', date: '2026-09-21', is_active: true },
  { id: 'sub_3', email: 'layla.khatib@yahoo.com', date: '2026-09-20', is_active: true },
  { id: 'sub_4', email: 'nour.hassan@example.com', date: '2026-09-20', is_active: true },
  { id: 'sub_5', email: 'mariam.q@domain.co.uk', date: '2026-09-19', is_active: true },
  { id: 'sub_6', email: 'hajar.mansoor@gmail.com', date: '2026-09-18', is_active: true },
  { id: 'sub_7', email: 'zaynab.noor@outlook.com', date: '2026-09-17', is_active: true },
];

export default function AdminInboxPage() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [inquiries, setInquiries] = useState<Inquiry[]>(initialInquiries);
  const [subscribers, setSubscribers] = useState<Subscriber[]>(initialSubscribers);
  const [selectedInquiry, setSelectedInquiry] = useState<Inquiry | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredInquiries = inquiries.filter(
    (i) =>
      i.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      i.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      i.subject.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleToggleStatus = (id: string) => {
    setInquiries((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const next = item.status === 'unread' ? 'resolved' : 'unread';
          toast.success(`Inquiry marked as ${next}`);
          return { ...item, status: next };
        }
        return item;
      })
    );
    if (selectedInquiry && selectedInquiry.id === id) {
      setSelectedInquiry((prev) =>
        prev ? { ...prev, status: prev.status === 'unread' ? 'resolved' : 'unread' } : null
      );
    }
  };

  const handleExportCSV = () => {
    const headers = ['Email', 'Subscription Date', 'Status'];
    const rows = subscribers.map((s) => [s.email, s.date, s.is_active ? 'Active' : 'Unsubscribed']);
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `veiled_canvas_subscribers_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Subscriber CSV exported successfully');
  };

  return (
    <div className="flex-1 pb-12">
      <AdminHeader
        onOpenMobile={() => setMobileOpen(true)}
        title="Customer Inbox & Audiences"
        subtitle="Review contact form inquiries, wholesale requests, and newsletter subscriber base"
      />

      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
        <Tabs defaultValue="inquiries" className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <TabsList className="bg-card border border-border">
              <TabsTrigger value="inquiries" className="gap-2 text-xs">
                <MessageSquare size={14} />
                Contact Inquiries ({inquiries.filter((i) => i.status === 'unread').length} Unread)
              </TabsTrigger>
              <TabsTrigger value="subscribers" className="gap-2 text-xs">
                <Users size={14} />
                Newsletter Audience ({subscribers.length})
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Inquiries Tab */}
          <TabsContent value="inquiries" className="space-y-4">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search inquiries by name, email, or subject..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-10"
              />
            </div>

            <Card className="border-border/80 bg-card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-muted/50 border-b border-border text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                    <tr>
                      <th className="py-3.5 px-4 sm:px-6">Sender</th>
                      <th className="py-3.5 px-4">Subject</th>
                      <th className="py-3.5 px-4">Date</th>
                      <th className="py-3.5 px-4">Status</th>
                      <th className="py-3.5 px-4 sm:px-6 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {filteredInquiries.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-12 text-center text-muted-foreground text-sm">
                          No inquiries found.
                        </td>
                      </tr>
                    ) : (
                      filteredInquiries.map((inq) => (
                        <tr key={inq.id} className="hover:bg-muted/30 transition-colors">
                          <td className="py-4 px-4 sm:px-6">
                            <div className="font-semibold text-xs sm:text-sm text-foreground">
                              {inq.name}
                            </div>
                            <div className="text-[11px] text-muted-foreground">{inq.email}</div>
                          </td>
                          <td className="py-4 px-4">
                            <span className="font-medium text-xs sm:text-sm text-foreground">
                              {inq.subject}
                            </span>
                            <p className="text-xs text-muted-foreground line-clamp-1">
                              {inq.message}
                            </p>
                          </td>
                          <td className="py-4 px-4 text-xs text-muted-foreground whitespace-nowrap">
                            {inq.date}
                          </td>
                          <td className="py-4 px-4">
                            <Badge
                              variant="outline"
                              className={`text-[11px] capitalize px-2 py-0.5 border ${
                                inq.status === 'unread'
                                  ? 'bg-amber-500/10 text-amber-600 border-amber-500/20'
                                  : 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                              }`}
                            >
                              {inq.status}
                            </Badge>
                          </td>
                          <td className="py-4 px-4 sm:px-6 text-right space-x-2 whitespace-nowrap">
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 text-xs gap-1.5"
                              onClick={() => setSelectedInquiry(inq)}
                            >
                              <Eye size={13} />
                              Read
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 text-xs"
                              onClick={() => handleToggleStatus(inq.id)}
                            >
                              {inq.status === 'unread' ? 'Mark Resolved' : 'Mark Unread'}
                            </Button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </TabsContent>

          {/* Subscribers Tab */}
          <TabsContent value="subscribers" className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">
                  Active Community Subscribers
                </p>
                <p className="text-xs text-muted-foreground">
                  Subscribers enrolled via footer signup and checkout opt-ins
                </p>
              </div>

              <Button
                onClick={handleExportCSV}
                variant="outline"
                size="sm"
                className="h-9 text-xs gap-1.5"
              >
                <Download size={14} />
                Export CSV List
              </Button>
            </div>

            <Card className="border-border/80 bg-card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-muted/50 border-b border-border text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                    <tr>
                      <th className="py-3.5 px-4 sm:px-6">Subscriber Email</th>
                      <th className="py-3.5 px-4">Subscribed Date</th>
                      <th className="py-3.5 px-4">Engagement Status</th>
                      <th className="py-3.5 px-4 sm:px-6 text-right">Channel</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {subscribers.map((sub) => (
                      <tr key={sub.id} className="hover:bg-muted/30 transition-colors">
                        <td className="py-3.5 px-4 sm:px-6 font-medium text-xs sm:text-sm text-foreground flex items-center gap-2">
                          <Mail size={13} className="text-muted-foreground" />
                          {sub.email}
                        </td>
                        <td className="py-3.5 px-4 text-xs text-muted-foreground">
                          {sub.date}
                        </td>
                        <td className="py-3.5 px-4">
                          <Badge
                            variant="outline"
                            className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[10px]"
                          >
                            Active
                          </Badge>
                        </td>
                        <td className="py-3.5 px-4 sm:px-6 text-right text-xs text-muted-foreground">
                          Storefront Newsletter
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Inquiry Detail Modal */}
      {selectedInquiry && (
        <Dialog open={!!selectedInquiry} onOpenChange={(open) => !open && setSelectedInquiry(null)}>
          <DialogContent className="max-w-lg bg-card border-border">
            <DialogHeader>
              <div className="flex items-center justify-between">
                <DialogTitle className="font-heading text-lg font-bold">
                  {selectedInquiry.subject}
                </DialogTitle>
                <Badge
                  variant="outline"
                  className={`text-[10px] capitalize ${
                    selectedInquiry.status === 'unread'
                      ? 'bg-amber-500/10 text-amber-600'
                      : 'bg-emerald-500/10 text-emerald-600'
                  }`}
                >
                  {selectedInquiry.status}
                </Badge>
              </div>
              <DialogDescription className="text-xs">
                From: {selectedInquiry.name} ({selectedInquiry.email}) on {selectedInquiry.date}
              </DialogDescription>
            </DialogHeader>

            <div className="p-4 rounded-xl bg-muted/40 border border-border text-sm leading-relaxed whitespace-pre-wrap">
              {selectedInquiry.message}
            </div>

            <DialogFooter className="flex flex-row justify-between sm:justify-between items-center gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleToggleStatus(selectedInquiry.id)}
                className="text-xs"
              >
                {selectedInquiry.status === 'unread' ? 'Mark as Resolved' : 'Mark as Unread'}
              </Button>
              <Button
                asChild
                size="sm"
                className="gradient-gold text-espresso font-semibold text-xs"
              >
                <a href={`mailto:${selectedInquiry.email}?subject=Re: ${selectedInquiry.subject}`}>
                  Reply via Email
                </a>
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
