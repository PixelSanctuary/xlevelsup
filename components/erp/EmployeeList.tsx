'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { m as motion } from 'framer-motion';
import { Table, TableRow, TableCell } from './Table';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import EmployeeForm from './EmployeeForm';
import CareerChangeModal from './CareerChangeModal';
import EmployeeCareerHistoryComponent from './EmployeeCareerHistory';
import { EditIcon, DeleteIcon } from './ActionIcons';
import SensitiveValue from './SensitiveValue';
import type { Employee, EmployeeCareerHistory, EmployeeCareerChangeType } from '@/types/erp';
import { formatCurrency, formatDisplayDate } from '@/lib/erp/utils';
import toast from 'react-hot-toast';
import { deleteEmployeeAction } from '@/actions/erp/employees';
import { getEmployeeCareerHistoryAction } from '@/actions/erp/employee-career';

interface EmployeeListProps {
  employees: Employee[];
  departments: string[];
  initialFilters: {
    status?: 'active' | 'inactive';
    department?: string;
    employment_type?: string;
    search?: string;
  };
}

export default function EmployeeList({
  employees,
  departments,
  initialFilters,
}: EmployeeListProps) {
  const router = useRouter();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCareerModal, setShowCareerModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [careerChangeType, setCareerChangeType] = useState<EmployeeCareerChangeType | undefined>();
  const [careerHistory, setCareerHistory] = useState<EmployeeCareerHistory[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [filters, setFilters] = useState(initialFilters);

  const handleFilterChange = (key: string, value: string) => {
    const newFilters = { ...filters, [key]: value || undefined };
    setFilters(newFilters);

    const params = new URLSearchParams();
    if (newFilters.status) params.set('status', newFilters.status);
    if (newFilters.department) params.set('department', newFilters.department);
    if (newFilters.employment_type)
      params.set('employment_type', newFilters.employment_type);
    if (newFilters.search) params.set('search', newFilters.search);

    router.push(`/erp/employees?${params.toString()}`);
  };

  const handleEdit = (employee: Employee) => {
    setSelectedEmployee(employee);
    setShowEditModal(true);
  };

  const handleDelete = async (employee: Employee) => {
    if (!confirm(`Are you sure you want to delete ${employee.name}?`)) return;

    const result = await deleteEmployeeAction(employee.id);
    if (result.success) {
      toast.success('Employee deleted successfully');
      router.refresh();
    } else {
      toast.error(result.error || 'Failed to delete employee');
    }
  };

  const handleCareerChange = (employee: Employee, changeType?: EmployeeCareerChangeType) => {
    setSelectedEmployee(employee);
    setCareerChangeType(changeType);
    setShowCareerModal(true);
  };

  const handleViewHistory = async (employee: Employee) => {
    setSelectedEmployee(employee);
    setShowHistoryModal(true);
    setLoadingHistory(true);
    try {
      const history = await getEmployeeCareerHistoryAction(employee.id);
      setCareerHistory(history);
    } catch {
      toast.error('Failed to load career history');
      setCareerHistory([]);
    } finally {
      setLoadingHistory(false);
    }
  };

  return (
    <div>
      {/* Header */}
      <div className='flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8'>
        <div>
          <h1 className='text-3xl font-bold gradient-text'>
            Employee Management
          </h1>
          <p className='text-gray-400 mt-2'>
            Manage employee records, promotions, and career history
          </p>
        </div>
        <Button
          variant='primary'
          onClick={() => setShowCreateModal(true)}
          className='whitespace-nowrap'
        >
          + Add Employee
        </Button>
      </div>

      {/* Filters */}
      <div className='glass p-4 rounded-lg mb-6'>
        <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
          <div>
            <label className='block text-sm font-medium mb-2'>Search</label>
            <input
              type='text'
              placeholder='Name, email, or ID...'
              value={filters.search || ''}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className='w-full px-4 py-2 rounded-lg bg-dark-800 border border-gray-700 text-white focus:outline-none focus:border-cyan transition-colors'
            />
          </div>
          <div>
            <label className='block text-sm font-medium mb-2'>Status</label>
            <select
              value={filters.status || ''}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className='w-full px-4 py-2 rounded-lg bg-dark-800 border border-gray-700 text-white focus:outline-none focus:border-cyan transition-colors'
            >
              <option value=''>All Statuses</option>
              <option value='active'>Active</option>
              <option value='inactive'>Inactive</option>
            </select>
          </div>
          <div>
            <label className='block text-sm font-medium mb-2'>Department</label>
            <select
              value={filters.department || ''}
              onChange={(e) => handleFilterChange('department', e.target.value)}
              className='w-full px-4 py-2 rounded-lg bg-dark-800 border border-gray-700 text-white focus:outline-none focus:border-cyan transition-colors'
            >
              <option value=''>All Departments</option>
              {departments.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className='block text-sm font-medium mb-2'>
              Employment Type
            </label>
            <select
              value={filters.employment_type || ''}
              onChange={(e) =>
                handleFilterChange('employment_type', e.target.value)
              }
              className='w-full px-4 py-2 rounded-lg bg-dark-800 border border-gray-700 text-white focus:outline-none focus:border-cyan transition-colors'
            >
              <option value=''>All Types</option>
              <option value='full-time'>Full-Time</option>
              <option value='part-time'>Part-Time</option>
              <option value='contract'>Contract</option>
              <option value='temporary'>Temporary</option>
              <option value='freelancer'>Freelancer</option>
              <option value='intern'>Intern</option>
              <option value='consultant'>Consultant</option>
            </select>
          </div>
        </div>
      </div>

      {/* Employee Table */}
      <div className='glass rounded-lg overflow-hidden'>
        {employees.length === 0 ? (
          <div className='text-center py-12'>
            <p className='text-gray-400 mb-4'>No employees found</p>
            <Button variant='primary' onClick={() => setShowCreateModal(true)}>
              Add First Employee
            </Button>
          </div>
        ) : (
          <Table
            headers={[
              'ID',
              'Name',
              'Department',
              'Role',
              'Employment',
              'Salary',
              'Status',
              'Actions',
            ]}
          >
            {employees.map((employee) => {
              const isIntern = employee.employment_type === 'intern';
              const isActive = employee.status === 'active';
              return (
                <TableRow key={employee.id}>
                  <TableCell>{employee.employee_id}</TableCell>
                  <TableCell>
                    <div className='font-medium text-white'>{employee.name}</div>
                    <div className='text-xs text-gray-500'>
                      {employee.email}
                    </div>
                    <div className='text-xs text-gray-600'>
                      Joined: {formatDisplayDate(employee.joining_date)}
                    </div>
                    {employee.date_of_birth && (
                      <div className='text-xs text-gray-600'>
                        DOB: {formatDisplayDate(employee.date_of_birth)}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>{employee.department}</TableCell>
                  <TableCell>{employee.role}</TableCell>
                  <TableCell>
                    <div className='flex items-center gap-1.5'>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${
                        isIntern
                          ? 'bg-yellow-500/20 text-yellow-400'
                          : 'bg-blue-500/20 text-blue-300'
                      }`}>
                        {employee.employment_type?.replace('-', ' ') || 'Full-Time'}
                      </span>
                    </div>
                    {employee.end_date && (
                      <div className='text-xs text-gray-500 mt-0.5'>
                        Until {formatDisplayDate(employee.end_date)}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className='font-medium text-white'>
                      {employee.monthly_salary !== null &&
                      employee.monthly_salary !== undefined
                        ? <SensitiveValue>{formatCurrency(employee.monthly_salary)}</SensitiveValue>
                        : 'Unpaid'}
                    </div>
                    <div className='text-xs text-gray-500 capitalize'>
                      {employee.salary_type}
                      {employee.hourly_rate && ` · ₹${employee.hourly_rate}/hr`}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        employee.status === 'active'
                          ? 'bg-green-500/20 text-green-400'
                          : 'bg-red-500/20 text-red-400'
                      }`}
                    >
                      {employee.status}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className='flex flex-col gap-1.5'>
                      {/* Top row: core actions */}
                      <div className='flex gap-2'>
                        <button
                          onClick={() => handleEdit(employee)}
                          title='Edit'
                          aria-label='Edit'
                          className='text-cyan-400 hover:text-cyan-300 transition-colors'
                        >
                          <EditIcon className='w-3.5 h-3.5' />
                        </button>
                        <button
                          onClick={() => handleDelete(employee)}
                          title='Delete'
                          aria-label='Delete'
                          className='text-red-400 hover:text-red-300 transition-colors'
                        >
                          <DeleteIcon className='w-3.5 h-3.5' />
                        </button>
                      </div>
                      {/* Bottom row: career actions */}
                      <div className='flex gap-1.5 flex-wrap'>
                        {isIntern && isActive && (
                          <button
                            onClick={() => handleCareerChange(employee, 'intern_conversion')}
                            className='text-xs px-2 py-0.5 rounded bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30 transition-colors font-medium whitespace-nowrap'
                          >
                            Convert
                          </button>
                        )}
                        {!isIntern && isActive && (
                          <button
                            onClick={() => handleCareerChange(employee, 'promotion')}
                            className='text-xs px-2 py-0.5 rounded bg-green-500/20 text-green-400 hover:bg-green-500/30 transition-colors font-medium'
                          >
                            Promote
                          </button>
                        )}
                        {isActive && (
                          <button
                            onClick={() => handleCareerChange(employee, 'salary_revision')}
                            className='text-xs px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30 transition-colors font-medium whitespace-nowrap'
                          >
                            Salary
                          </button>
                        )}
                        <button
                          onClick={() => handleViewHistory(employee)}
                          className='text-xs px-2 py-0.5 rounded bg-gray-700/60 text-gray-400 hover:bg-gray-700 transition-colors font-medium'
                        >
                          History
                        </button>
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </Table>
        )}
      </div>

      {/* Create Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title='Add New Employee'
      >
        <EmployeeForm
          onSuccess={() => {
            setShowCreateModal(false);
            router.refresh();
          }}
          departments={departments}
        />
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedEmployee(null);
        }}
        title='Edit Employee'
      >
        {selectedEmployee && (
          <EmployeeForm
            employee={selectedEmployee}
            onSuccess={() => {
              setShowEditModal(false);
              setSelectedEmployee(null);
              router.refresh();
            }}
            departments={departments}
          />
        )}
      </Modal>

      {/* Career Change Modal */}
      {selectedEmployee && (
        <CareerChangeModal
          isOpen={showCareerModal}
          onClose={() => {
            setShowCareerModal(false);
            setSelectedEmployee(null);
            setCareerChangeType(undefined);
          }}
          employee={selectedEmployee}
          defaultChangeType={careerChangeType}
          departments={departments}
          onSuccess={() => {
            setShowCareerModal(false);
            setSelectedEmployee(null);
            setCareerChangeType(undefined);
            router.refresh();
          }}
        />
      )}

      {/* Career History Modal */}
      <Modal
        isOpen={showHistoryModal}
        onClose={() => {
          setShowHistoryModal(false);
          setSelectedEmployee(null);
          setCareerHistory([]);
        }}
        title={`Career History — ${selectedEmployee?.name || ''}`}
      >
        {loadingHistory ? (
          <div className='text-center py-10'>
            <div className='w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto mb-3' />
            <p className='text-gray-400 text-sm'>Loading history…</p>
          </div>
        ) : (
          <div className='max-h-[70vh] overflow-y-auto pr-1'>
            {/* Quick action inside history modal */}
            {selectedEmployee && (
              <div className='flex gap-2 mb-5 flex-wrap'>
                {selectedEmployee.employment_type === 'intern' && (
                  <button
                    onClick={() => {
                      setShowHistoryModal(false);
                      handleCareerChange(selectedEmployee, 'intern_conversion');
                    }}
                    className='text-xs px-3 py-1.5 rounded-lg bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30 transition-colors font-medium border border-yellow-500/30'
                  >
                    🎓 Convert Intern
                  </button>
                )}
                {selectedEmployee.employment_type !== 'intern' && selectedEmployee.status === 'active' && (
                  <button
                    onClick={() => {
                      setShowHistoryModal(false);
                      handleCareerChange(selectedEmployee, 'promotion');
                    }}
                    className='text-xs px-3 py-1.5 rounded-lg bg-green-500/20 text-green-400 hover:bg-green-500/30 transition-colors font-medium border border-green-500/30'
                  >
                    🚀 Promote
                  </button>
                )}
                <button
                  onClick={() => {
                    setShowHistoryModal(false);
                    handleCareerChange(selectedEmployee, 'salary_revision');
                  }}
                  className='text-xs px-3 py-1.5 rounded-lg bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30 transition-colors font-medium border border-cyan-500/30'
                >
                  💰 Revise Salary
                </button>
                <button
                  onClick={() => {
                    setShowHistoryModal(false);
                    handleCareerChange(selectedEmployee, 'department_change');
                  }}
                  className='text-xs px-3 py-1.5 rounded-lg bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 transition-colors font-medium border border-purple-500/30'
                >
                  🏢 Change Dept
                </button>
              </div>
            )}
            <EmployeeCareerHistoryComponent
              history={careerHistory}
              employeeName={selectedEmployee?.name || ''}
            />
          </div>
        )}
      </Modal>
    </div>
  );
}
