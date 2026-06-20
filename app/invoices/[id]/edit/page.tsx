'use client';

import { useDataStore } from '@/store/data-store';
import { InvoiceForm } from '@/components/invoices/invoice-form';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function EditInvoicePage() {
  const params = useParams();
  const id = params.id as string;
  const invoices = useDataStore((state) => state.invoices);
  const invoice = invoices.find(inv => inv.id === id);

  if (!invoice) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] space-y-4">
        <p className="text-gray-500">Facture introuvable.</p>
        <Link href="/invoices" className="text-primary hover:underline">
          <ArrowLeft className="w-4 h-4 inline mr-2" />
          Retour aux factures
        </Link>
      </div>
    );
  }

  if (invoice.isLocked) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] space-y-4 text-center">
        <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-900">Document verrouillé</h2>
        <p className="text-gray-500 max-w-md">Ce document a été verrouillé par un administrateur ou un manager. Il ne peut plus être modifié.</p>
        <Link href={`/invoices/${id}`} className="mt-6 inline-flex items-center gap-2 bg-gray-900 hover:bg-gray-800 text-white px-6 py-2.5 rounded-full text-sm font-medium transition-all shadow-sm">
          <ArrowLeft className="w-4 h-4" />
          Retour au document
        </Link>
      </div>
    );
  }

  return <InvoiceForm initialData={invoice} />;
}
