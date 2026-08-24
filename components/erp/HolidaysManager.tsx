'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { Table, TableRow, TableCell } from './Table';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import { EditIcon, DeleteIcon } from './ActionIcons';
import type { CompanyHoliday } from '@/lib/erp/holidays';
import {
  createHolidayAction,
  updateHolidayAction,
  setHolidayActiveAction,
  deleteHolidayAction,
} from '@/actions/erp/holidays';

interface HolidaysManagerProps {
  holidays: CompanyHoliday[];
  initialYear: number;
  userRole: string;
}

const HOLIDAY_TYPE_INFO: Record<
  CompanyHoliday['holiday_type'],
  { label: string; icon: string; badge: string }
> = {
  public: { label: 'Mandatory / Government Holiday', icon: '🏛️', badge: 'bg-red-500/20 text-red-400' },
  floater: { label: 'Floater Holiday', icon: '🎈', badge: 'bg-amber-500/20 text-amber-400' },
  company: { label: 'Company Holiday', icon: '🏢', badge: 'bg-blue-500/20 text-blue-400' },
  optional: { label: 'Company Holiday', icon: '🏢', badge: 'bg-blue-500/20 text-blue-400' },
};

const CREATABLE_TYPES: CompanyHoliday['holiday_type'][] = ['public', 'floater', 'company'];

const emptyForm = {
  name: '',
  date: '',
  holiday_type: 'public' as CompanyHoliday['holiday_type'],
  description: '',
  is_active: true,
};

function formatDisplayDate(date: string) {
  return new Date(`${date}T00:00:00Z`).toLocaleDateString('en-US', {
    timeZone: 'UTC',
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export default function HolidaysManager({
  holidays,
  initialYear,
  userRole,
}: HolidaysManagerProps) {
  const router = useRouter();
  const [year, setYear] = useState(initialYear);
  const [showModal, setShowModal] = useState(false);
  const [editingHoliday, setEditingHoliday] = useState<CompanyHoliday | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canHardDelete = userRole === 'admin';

  const changeYear = (nextYear: number) => {
    setYear(nextYear);
    router.push(`/erp/holidays?year=${nextYear}`);
  };

  const openAddModal = () => {
    setEditingHoliday(null);
    setForm(emptyForm);
    setShowModal(true);
  };

  const openEditModal = (holiday: CompanyHoliday) => {
    setEditingHoliday(holiday);
    setForm({
      name: holiday.name,
      date: holiday.date,
      holiday_type: holiday.holiday_type,
      description: holiday.description || '',
      is_active: holiday.is_active,
    });
    setShowModal(true);
  };

  const handleSubmit = async () => {
    if (!form.name.trim() || !form.date) {
      toast.error('Name and date are required');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        name: form.name.trim(),
        date: form.date,
        holiday_type: form.holiday_type,
        description: form.description.trim() || undefined,
        is_active: form.is_active,
      };

      const result = editingHoliday
        ? await updateHolidayAction(editingHoliday.id, payload)
        : await createHolidayAction(payload);

      if (result.success) {
        toast.success(editingHoliday ? 'Holiday updated' : 'Holiday added');
        setShowModal(false);
        router.refresh();
      } else {
        toast.error(result.error || 'Failed to save holiday');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleActive = async (holiday: CompanyHoliday) => {
    const nextActive = !holiday.is_active;
    if (
      !confirm(
        nextActive
          ? `Reactivate "${holiday.name}"? It will reappear on employee calendars.`
          : `Archive "${holiday.name}"? It will be hidden from employee calendars but kept on record.`,
      )
    ) {
      return;
    }
    const result = await setHolidayActiveAction(holiday.id, nextActive);
    if (result.success) {
      toast.success(nextActive ? 'Holiday reactivated' : 'Holiday archived');
      router.refresh();
    } else {
      toast.error(result.error || 'Failed to update holiday status');
    }
  };

  const handleDelete = async (holiday: CompanyHoliday) => {
    if (
      !confirm(
        `Permanently delete "${holiday.name}" (${holiday.date})? This cannot be undone — consider archiving instead.`,
      )
    ) {
      return;
    }
    const result = await deleteHolidayAction(holiday.id);
    if (result.success) {
      toast.success('Holiday permanently deleted');
      router.refresh();
    } else {
      toast.error(result.error || 'Failed to delete holiday');
    }
  };

  return (
    <div>
      <div className='flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8'>
        <div>
          <h1 className='text-3xl font-bold gradient-text'>Holiday Calendar Management</h1>
          <p className='text-gray-400 mt-2'>
            Manage mandatory, floater, and company holidays for the year
          </p>
        </div>
        <Button variant='primary' onClick={openAddModal} className='whitespace-nowrap'>
          + Add Holiday
        </Button>
      </div>

      {/* Year selector */}
      <div className='glass p-4 rounded-lg mb-6 flex items-center gap-3'>
        <label className='text-sm font-medium'>Year</label>
        <div className='flex items-center gap-1 bg-[#0a0a0a] border border-gray-800 rounded-lg p-1'>
          <button
            onClick={() => changeYear(year - 1)}
            className='px-3 py-1.5 text-sm text-gray-400 hover:text-white rounded-md hover:bg-gray-850 transition-colors'
            aria-label='Previous year'
          >
            ←
          </button>
          <span className='px-3 py-1.5 text-sm font-semibold text-white'>{year}</span>
          <button
            onClick={() => changeYear(year + 1)}
            className='px-3 py-1.5 text-sm text-gray-400 hover:text-white rounded-md hover:bg-gray-850 transition-colors'
            aria-label='Next year'
          >
            →
          </button>
        </div>
      </div>

      {/* Table */}
      <div className='glass rounded-lg overflow-hidden'>
        {holidays.length === 0 ? (
          <div className='text-center py-12'>
            <p className='text-gray-400 mb-4'>No holidays configured for {year}</p>
            <Button variant='primary' onClick={openAddModal}>
              Add First Holiday
            </Button>
          </div>
        ) : (
          <Table headers={['Date', 'Holiday', 'Type', 'Status', 'Actions']}>
            {holidays.map((holiday) => {
              const info = HOLIDAY_TYPE_INFO[holiday.holiday_type];
              return (
                <TableRow key={holiday.id} className={!holiday.is_active ? 'opacity-50' : ''}>
                  <TableCell>
                    <div className='font-medium text-white'>{formatDisplayDate(holiday.date)}</div>
                  </TableCell>
                  <TableCell>
                    <div className='font-medium text-white'>{holiday.name}</div>
                    {holiday.description && (
                      <div className='text-xs text-gray-500 mt-0.5'>{holiday.description}</div>
                    )}
                  </TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${info.badge}`}>
                      {info.icon} {info.label}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        holiday.is_active
                          ? 'bg-green-500/20 text-green-400'
                          : 'bg-gray-500/20 text-gray-400'
                      }`}
                    >
                      {holiday.is_active ? 'Active' : 'Archived'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className='flex items-center gap-3'>
                      <button
                        onClick={() => openEditModal(holiday)}
                        title='Edit'
                        aria-label='Edit'
                        className='text-cyan hover:text-cyan/80 transition-colors'
                      >
                        <EditIcon />
                      </button>
                      <button
                        onClick={() => handleToggleActive(holiday)}
                        title={holiday.is_active ? 'Archive' : 'Reactivate'}
                        className='text-xs text-gray-400 hover:text-white transition-colors underline'
                      >
                        {holiday.is_active ? 'Archive' : 'Reactivate'}
                      </button>
                      {canHardDelete && (
                        <button
                          onClick={() => handleDelete(holiday)}
                          title='Delete permanently'
                          aria-label='Delete permanently'
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

      {/* Add/Edit Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingHoliday ? 'Edit Holiday' : 'Add Holiday'}
      >
        <div className='space-y-4'>
          <div>
            <label className='block text-sm font-medium mb-2'>Name *</label>
            <input
              type='text'
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder='e.g., Independence Day'
              className='w-full px-4 py-2 rounded-lg bg-dark-800 border border-gray-700 text-white focus:outline-none focus:border-cyan transition-colors'
            />
          </div>

          <div>
            <label className='block text-sm font-medium mb-2'>Date *</label>
            <input
              type='date'
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              className='w-full px-4 py-2 rounded-lg bg-dark-800 border border-gray-700 text-white focus:outline-none focus:border-cyan transition-colors'
            />
          </div>

          <div>
            <label className='block text-sm font-medium mb-2'>Type *</label>
            <select
              value={form.holiday_type}
              onChange={(e) =>
                setForm({ ...form, holiday_type: e.target.value as CompanyHoliday['holiday_type'] })
              }
              className='w-full px-4 py-2 rounded-lg bg-dark-800 border border-gray-700 text-white focus:outline-none focus:border-cyan transition-colors'
            >
              {CREATABLE_TYPES.map((type) => (
                <option key={type} value={type}>
                  {HOLIDAY_TYPE_INFO[type].label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className='block text-sm font-medium mb-2'>Description (Optional)</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={2}
              className='w-full px-4 py-2 rounded-lg bg-dark-800 border border-gray-700 text-white focus:outline-none focus:border-cyan transition-colors'
              placeholder='Any additional details...'
            />
          </div>

          <div className='flex items-center gap-2'>
            <input
              type='checkbox'
              id='holiday_is_active'
              checked={form.is_active}
              onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
              className='w-4 h-4 rounded border-gray-700 bg-dark-800 text-cyan focus:ring-cyan'
            />
            <label htmlFor='holiday_is_active' className='text-sm text-gray-300 select-none cursor-pointer'>
              Active (visible to employees)
            </label>
          </div>

          <Button
            type='button'
            variant='primary'
            className='w-full'
            disabled={isSubmitting}
            onClick={handleSubmit}
          >
            {isSubmitting ? 'Saving...' : editingHoliday ? 'Save Changes' : 'Add Holiday'}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
