import { supabase } from './supabaseClient';
import type { Appointment, Invoice, LabTest, Medicine, Prescription, User } from '../types';

type CollectionName = 'users' | 'medicines' | 'appointments' | 'invoices' | 'prescriptions' | 'lab_tests';
type CollectionItem = User | Medicine | Appointment | Invoice | Prescription | LabTest;

interface DatabaseRecord {
  collection: CollectionName;
  id: string;
  data: CollectionItem;
}

export type DatabaseCollections = Partial<Record<CollectionName, CollectionItem[]>>;

export const loadCollections = async (): Promise<DatabaseCollections> => {
  if (!supabase) return {};

  const { data, error } = await supabase.from('medconnect_records').select('collection, id, data');
  if (error) throw error;

  return (data as DatabaseRecord[]).reduce<DatabaseCollections>((collections, record) => {
    const collection = collections[record.collection] ?? [];
    collection.push(record.data);
    collections[record.collection] = collection;
    return collections;
  }, {});
};

export const syncCollection = async (collection: CollectionName, items: CollectionItem[]) => {
  if (!supabase) return;

  const { data: existing, error: existingError } = await supabase
    .from('medconnect_records')
    .select('id')
    .eq('collection', collection);
  if (existingError) throw existingError;

  const ids = items.map(item => item.id);
  const removedIds = (existing ?? [])
    .map(record => record.id as string)
    .filter(id => !ids.includes(id));

  if (removedIds.length > 0) {
    const { error } = await supabase
      .from('medconnect_records')
      .delete()
      .eq('collection', collection)
      .in('id', removedIds);
    if (error) throw error;
  }

  if (items.length === 0) return;

  const records = items.map(item => ({ collection, id: item.id, data: item }));
  const { error } = await supabase.from('medconnect_records').upsert(records, { onConflict: 'collection,id' });
  if (error) throw error;
};