'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { Table, TableRow, TableCell } from './Table';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import { formatCurrency, formatDisplayDate } from '@/lib/erp/utils';
import { EditIcon, DeleteIcon } from './ActionIcons';
import SensitiveValue from './SensitiveValue';
import { createClientAction, updateClientAction, deleteClientAction } from '@/actions/erp/clients';
import type { Client, ClientFinancialSummary } from '@/types/erp';

interface ClientManagerProps {
  clients: Client[];
  summaries: Record<string, ClientFinancialSummary>;
  userRole: string;
}

function ClientFormFields({ client }: { client?: Client | null }) {
  return (
    <div className='space-y-4'>
      <div>
        <label className='block text-sm font-medium mb-2'>Client Name *</label>
        <input
          type='text'
          name='name'
          required
          defaultValue={client?.name}
          placeholder='e.g. Acme Corp'
          className='w-full px-4 py-2 rounded-lg bg-dark-800 border border-gray-700 text-white focus:outline-none focus:border-cyan transition-colors'
        />
      </div>
      <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
        <div>
          <label className='block text-sm font-medium mb-2'>Phone</label>
          <input
            type='text'
            name='phone'
            defaultValue={client?.phone ?? ''}
            className='w-full px-4 py-2 rounded-lg bg-dark-800 border border-gray-700 text-white focus:outline-none focus:border-cyan transition-colors'
          />
        </div>
        <div>
          <label className='block text-sm font-medium mb-2'>Email</label>
          <input
            type='email'
            name='email'
            defaultValue={client?.email ?? ''}
            className='w-full px-4 py-2 rounded-lg bg-dark-800 border border-gray-700 text-white focus:outline-none focus:border-cyan transition-colors'
          />
        </div>
      </div>
      <div>
        <label className='block text-sm font-medium mb-2'>GSTIN</label>
        <input
          type='text'
          name='gstin'
          defaultValue={client?.gstin ?? ''}
          placeholder='e.g. 33AAAAA0000A1Z5'
          className='w-full px-4 py-2 rounded-lg bg-dark-800 border border-gray-700 text-white focus:outline-none focus:border-cyan transition-colors'
        />
      </div>
      <div>
        <label className='block text-sm font-medium mb-2'>Address Line 1</label>
        <input
          type='text'
          name='address_line1'
          defaultValue={client?.address_line1 ?? ''}
          className='w-full px-4 py-2 rounded-lg bg-dark-800 border border-gray-700 text-white focus:outline-none focus:border-cyan transition-colors'
        />
      </div>
      <div>
        <label className='block text-sm font-medium mb-2'>Address Line 2</label>
        <input
          type='text'
          name='address_line2'
          defaultValue={client?.address_line2 ?? ''}
          className='w-full px-4 py-2 rounded-lg bg-dark-800 border border-gray-700 text-white focus:outline-none focus:border-cyan transition-colors'
        />
      </div>
      <div className='grid grid-cols-1 sm:grid-cols-3 gap-4'>
        <div>
          <label className='block text-sm font-medium mb-2'>City</label>
          <input
            type='text'
            name='city'
            defaultValue={client?.city ?? ''}
            className='w-full px-4 py-2 rounded-lg bg-dark-800 border border-gray-700 text-white focus:outline-none focus:border-cyan transition-colors'
          />
        </div>
        <div>
          <label className='block text-sm font-medium mb-2'>State</label>
          <input
            type='text'
            name='state'
            defaultValue={client?.state ?? ''}
            className='w-full px-4 py-2 rounded-lg bg-dark-800 border border-gray-700 text-white focus:outline-none focus:border-cyan transition-colors'
          />
        </div>
        <div>
          <label className='block text-sm font-medium mb-2'>Pincode</label>
          <input
            type='text'
            name='pincode'
            defaultValue={client?.pincode ?? ''}
            className='w-full px-4 py-2 rounded-lg bg-dark-800 border border-gray-700 text-white focus:outline-none focus:border-cyan transition-colors'
          />
        </div>
      </div>
      <div>
        <label className='block text-sm font-medium mb-2'>Services Offered</label>
        <input
          type='text'
          name='services_offered'
          defaultValue={client?.services_offered ?? ''}
          placeholder='e.g. Website Development, SEO'
          className='w-full px-4 py-2 rounded-lg bg-dark-800 border border-gray-700 text-white focus:outline-none focus:border-cyan transition-colors'
        />
      </div>
      <div>
        <label className='block text-sm font-medium mb-2'>Notes</label>
        <textarea
          name='notes'
          rows={2}
          defaultValue={client?.notes ?? ''}
          className='w-full px-4 py-2 rounded-lg bg-dark-800 border border-gray-700 text-white focus:outline-none focus:border-cyan transition-colors resize-none'
        />
      </div>
    </div>
  );
}

export default function ClientManager({ clients, summaries, userRole }: ClientManagerProps) {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canManage = userRole === 'admin' || userRole === 'hr';
  const canDelete = userRole === 'admin';

  const filteredClients = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return clients;
    return clients.filter(
      (client) =>
        client.name.toLowerCase().includes(query) ||
        client.client_id.toLowerCase().includes(query) ||
        (client.email || '').toLowerCase().includes(query) ||
        (client.phone || '').toLowerCase().includes(query),
    );
  }, [clients, search]);

  const handleCreate = async (formData: FormData) => {
    setIsSubmitting(true);
    try {
      const result = await createClientAction(formData);
      if (result.success) {
        toast.success('Client added');
        setShowAddModal(false);
        router.refresh();
      } else {
        toast.error(result.error || 'Failed to add client');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdate = async (formData: FormData) => {
    if (!editingClient) return;
    setIsSubmitting(true);
    try {
      const result = await updateClientAction(editingClient.id, formData);
      if (result.success) {
        toast.success('Client updated');
        setEditingClient(null);
        router.refresh();
      } else {
        toast.error(result.error || 'Failed to update client');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (client: Client) => {
    if (!confirm(`Delete client "${client.name}"? This cannot be undone.`)) return;

    const result = await deleteClientAction(client.id);
    if (result.success) {
      toast.success('Client deleted');
      router.refresh();
    } else {
      toast.error(result.error || 'Failed to delete client');
    }
  };

  return (
    <div className='space-y-6'>
      <div className='flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4'>
        <div>
          <h1 className='text-3xl font-bold gradient-text'>Clients</h1>
          <p className='text-gray-400 mt-2'>View and manage your client directory</p>
        </div>
        {canManage && (
          <Button variant='primary' onClick={() => setShowAddModal(true)} className='text-sm whitespace-nowrap'>
            + Add Client
          </Button>
        )}
      </div>

      <div className='glass p-4 rounded-lg'>
        <input
          type='text'
          placeholder='Search by name, ID, phone, or email...'
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className='w-full bg-transparent border border-gray-700 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-cyan'
        />
      </div>

      <div className='glass rounded-xl overflow-hidden'>
        {filteredClients.length === 0 ? (
          <div className='text-center py-16'>
            <p className='text-gray-400 mb-2 font-medium'>No clients found</p>
            <p className='text-xs text-gray-600'>
              {clients.length === 0 ? 'Add your first client to get started' : 'Try a different search'}
            </p>
          </div>
        ) : (
          <Table
            headers={['S.No', 'Client', 'Contact', 'Services Offered', 'GSTIN', 'Total Income', 'Pending', 'Last Activity', 'Actions']}
          >
            {filteredClients.map((client, index) => {
              const summary = summaries[client.name];
              return (
                <TableRow key={client.id}>
                  <TableCell className='text-xs text-gray-500'>{index + 1}</TableCell>
                  <TableCell>
                    <div className='font-semibold text-white'>{client.name}</div>
                    <div className='text-xs text-gray-500'>{client.client_id}</div>
                  </TableCell>
                  <TableCell className='text-xs'>
                    {client.phone && <div>{client.phone}</div>}
                    {client.email && <div className='text-gray-500'>{client.email}</div>}
                    {!client.phone && !client.email && '—'}
                  </TableCell>
                  <TableCell className='text-xs max-w-[200px]'>
                    <div className='truncate' title={client.services_offered || ''}>
                      {client.services_offered || '—'}
                    </div>
                  </TableCell>
                  <TableCell className='text-xs'>{client.gstin || '—'}</TableCell>
                  <TableCell className='font-semibold text-green-400 whitespace-nowrap'>
                    <SensitiveValue>{formatCurrency(summary?.totalIncome ?? 0)}</SensitiveValue>
                  </TableCell>
                  <TableCell className='text-yellow-400 whitespace-nowrap'>
                    {summary?.pendingIncome ? <SensitiveValue>{formatCurrency(summary.pendingIncome)}</SensitiveValue> : '—'}
                  </TableCell>
                  <TableCell className='text-xs whitespace-nowrap'>
                    {summary?.lastTransactionDate ? formatDisplayDate(summary.lastTransactionDate) : '—'}
                  </TableCell>
                  <TableCell>
                    <div className='flex items-center gap-3 whitespace-nowrap'>
                      {canManage && (
                        <button
                          onClick={() => setEditingClient(client)}
                          title='Edit'
                          aria-label='Edit'
                          className='text-cyan hover:text-cyan/70 transition-colors'
                        >
                          <EditIcon />
                        </button>
                      )}
                      {canDelete && (
                        <button
                          onClick={() => handleDelete(client)}
                          title='Delete'
                          aria-label='Delete'
                          className='text-red-400 hover:text-red-300 transition-colors'
                        >
                          <DeleteIcon />
                        </button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </Table>
        )}
      </div>

      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title='Add Client'>
        <form action={handleCreate} className='space-y-4'>
          <ClientFormFields />
          <div className='pt-2'>
            <Button type='submit' variant='primary' className='w-full' disabled={isSubmitting}>
              {isSubmitting ? 'Adding...' : 'Add Client'}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={!!editingClient} onClose={() => setEditingClient(null)} title='Edit Client'>
        <form action={handleUpdate} className='space-y-4'>
          <ClientFormFields client={editingClient} />
          <div className='pt-2'>
            <Button type='submit' variant='primary' className='w-full' disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
