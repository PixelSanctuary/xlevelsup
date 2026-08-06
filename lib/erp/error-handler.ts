/**
 * Centralized error handling for ERP database operations
 */

import { PostgrestError } from '@supabase/supabase-js';

/**
 * Database error types and their user-friendly messages
 */
const ERROR_MESSAGES: Record<string, string> = {
  // Connection errors
  '08000': 'Database connection failed. Please try again later.',
  '08003': 'Connection is closed. Please refresh and try again.',
  '08006': 'Connection lost. Please check your internet connection.',

  // Authentication errors
  '28000': 'Database authentication failed. Please contact support.',
  '28P01': 'Invalid database credentials. Please contact support.',

  // Data integrity errors
  '23505': 'This record already exists. Please check for duplicates.',
  '23503': 'Cannot delete this record as it is referenced by other data.',
  '23502': 'Required field is missing.',
  '23514': 'Data validation failed. Please check your input.',

  // Permission errors
  '42501': 'You do not have permission to perform this action.',

  // Not found errors
  PGRST116: 'Record not found.',

  // Schema cache errors (column/table missing or a pending migration)
  PGRST204: 'A database column is missing or out of date. Please contact support.',

  // Generic errors
  '42P01': 'Database table not found. Please contact support.',
  '42703': 'Database column not found. Please contact support.',
};

/**
 * Handle database errors and return user-friendly messages
 */
export function handleDatabaseError(error: unknown, operation: string): Error {
  // Log the full error for debugging
  console.error(`Database error during ${operation}:`, error);

  // Handle Postgres/Supabase errors
  if (error && typeof error === 'object' && 'code' in error) {
    const pgError = error as PostgrestError;
    const userMessage =
      ERROR_MESSAGES[pgError.code] ||
      `Failed to ${operation}. Please try again.`;

    return new Error(userMessage);
  }

  // Handle generic errors
  if (error instanceof Error) {
    // Don't expose internal error messages to users
    return new Error(`Failed to ${operation}. Please try again.`);
  }

  // Unknown error type
  return new Error(`An unexpected error occurred during ${operation}.`);
}

/**
 * Wrap database operations with error handling
 */
export async function withErrorHandling<T>(
  operation: string,
  fn: () => Promise<T>,
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    throw handleDatabaseError(error, operation);
  }
}

/**
 * Check if an error is a "not found" error
 */
export function isNotFoundError(error: unknown): boolean {
  if (error && typeof error === 'object' && 'code' in error) {
    const pgError = error as PostgrestError;
    return pgError.code === 'PGRST116';
  }
  return false;
}

/**
 * Check if an error is a duplicate key error
 */
export function isDuplicateError(error: unknown): boolean {
  if (error && typeof error === 'object' && 'code' in error) {
    const pgError = error as PostgrestError;
    return pgError.code === '23505';
  }
  return false;
}

/**
 * Check if an error is a foreign key constraint error
 */
export function isForeignKeyError(error: unknown): boolean {
  if (error && typeof error === 'object' && 'code' in error) {
    const pgError = error as PostgrestError;
    return pgError.code === '23503';
  }
  return false;
}
