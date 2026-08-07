import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { FolderOpen, Pencil, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { adminListCategories, createCategory, deleteCategory, toggleCategory, updateCategory } from '@/api/admin';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, EmptyState, Skeleton } from '@/components/ui/Card';
import { Input, Label, Select } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { ConfirmDialog, PageHeader, TableWrap, Td, Th, ToggleSwitch } from '@/components/admin/primitives';
import type { Category } from '@/types';

interface CategoryForm {
  name: string;
  nameEn: string;
  type: 'section' | 'sub';
  parentId: string;
}

const blank = (): CategoryForm => ({ name: '', nameEn: '', type: 'section', parentId: '' });

export function AdminCategoriesPage() {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const queryClient = useQueryClient();

  const categories = useQuery({ queryKey: ['admin', 'categories'], queryFn: adminListCategories });

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [form, setForm] = useState<CategoryForm>(blank());
  const [deleting, setDeleting] = useState<Category | null>(null);

  const sections = (categories.data ?? []).filter((c) => c.type === 'section');

  const openCreate = (): void => {
    setEditing(null);
    setForm(blank());
    setOpen(true);
  };

  const openEdit = (c: Category): void => {
    setEditing(c);
    setForm({ name: c.name, nameEn: c.nameEn, type: c.type, parentId: c.parentId ?? '' });
    setOpen(true);
  };

  const invalidate = (): void => {
    void queryClient.invalidateQueries({ queryKey: ['admin', 'categories'] });
  };

  const saveMutation = useMutation({
    mutationFn: async (): Promise<void> => {
      const payload: Partial<Category> = {
        name: form.name.trim(),
        nameEn: form.nameEn.trim(),
        type: form.type,
        parentId: form.type === 'sub' && form.parentId ? form.parentId : null,
      };
      if (editing) await updateCategory(editing._id, payload);
      else await createCategory(payload);
    },
    onSuccess: () => {
      toast.success(t('admin.saved'));
      invalidate();
      setOpen(false);
      setEditing(null);
    },
    onError: () => toast.error(t('admin.saveFailed')),
  });

  const toggleMutation = useMutation({
    mutationFn: (id: string) => toggleCategory(id),
    onSuccess: () => {
      toast.success(t('admin.saved'));
      invalidate();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteCategory(id),
    onSuccess: () => {
      toast.success(t('common.delete'));
      invalidate();
      setDeleting(null);
    },
  });

  const nameOf = (list: Category[], id: string): string => {
    const found = list.find((c) => c._id === id);
    return found ? (lang === 'ar' ? found.name : found.nameEn || found.name) : '—';
  };

  return (
    <div>
      <PageHeader
        title={t('admin.nav.categories')}
        action={
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" />
            {t('common.add')}
          </Button>
        }
      />

      {categories.isLoading ? (
        <Skeleton className="h-96" />
      ) : categories.data && categories.data.length > 0 ? (
        <TableWrap>
          <thead>
            <tr>
              <Th>{t('admin.nameAr')}</Th>
              <Th>{t('admin.type')}</Th>
              <Th>{t('admin.parent')}</Th>
              <Th>{t('admin.order')}</Th>
              <Th>{t('admin.available')}</Th>
              <Th className="text-end">{t('admin.actions')}</Th>
            </tr>
          </thead>
          <tbody>
            {(categories.data ?? []).map((c) => (
              <tr key={c._id} className="transition-colors hover:bg-night-800/40">
                <Td>
                  <p className="flex items-center gap-2 font-bold text-night-50">
                    <FolderOpen className="h-4 w-4 text-brand-500" />
                    {c.name}
                  </p>
                  {c.nameEn ? <p className="text-xs text-night-500">{c.nameEn}</p> : null}
                </Td>
                <Td>{c.type === 'section' ? t('admin.isSection') : t('admin.isSub')}</Td>
                <Td>{c.type === 'sub' ? nameOf(sections, c.parentId ?? '') : '—'}</Td>
                <Td>{c.order}</Td>
                <Td>
                  <ToggleSwitch checked={c.isActive} onChange={() => toggleMutation.mutate(c._id)} disabled={toggleMutation.isPending} />
                </Td>
                <Td className="text-end">
                  <div className="inline-flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(c)} aria-label={t('common.edit')}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-red-400 hover:bg-red-500/10 hover:text-red-400"
                      onClick={() => setDeleting(c)}
                      aria-label={t('common.delete')}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </Td>
              </tr>
            ))}
          </tbody>
        </TableWrap>
      ) : (
        <Card>
          <CardContent className="py-14">
            <EmptyState title={t('admin.emptyList')} hint={t('admin.emptyListHint')} />
          </CardContent>
        </Card>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title={editing ? t('common.edit') : t('common.add')} size="md">
        <div className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="c-name">{t('admin.nameAr')}</Label>
              <Input id="c-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <Label htmlFor="c-nameen">{t('admin.nameEn')}</Label>
              <Input id="c-nameen" value={form.nameEn} onChange={(e) => setForm({ ...form, nameEn: e.target.value })} />
            </div>
          </div>

          <div>
            <Label htmlFor="c-type">{t('admin.type')}</Label>
            <Select id="c-type" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as CategoryForm['type'] })}>
              <option value="section">{t('admin.isSection')}</option>
              <option value="sub">{t('admin.isSub')}</option>
            </Select>
          </div>

          {form.type === 'sub' ? (
            <div>
              <Label htmlFor="c-parent">{t('admin.parent')}</Label>
              <Select id="c-parent" value={form.parentId} onChange={(e) => setForm({ ...form, parentId: e.target.value })}>
                <option value="">—</option>
                {sections
                  .filter((s) => s._id !== editing?._id)
                  .map((s) => (
                    <option key={s._id} value={s._id}>
                      {lang === 'ar' ? s.name : s.nameEn || s.name}
                    </option>
                  ))}
              </Select>
            </div>
          ) : null}

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button loading={saveMutation.isPending} onClick={() => saveMutation.mutate()}>
              {t('common.save')}
            </Button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        onConfirm={() => deleting && deleteMutation.mutate(deleting._id)}
        title={t('admin.confirmDeleteTitle')}
        message={t('admin.confirmDelete')}
        loading={deleteMutation.isPending}
      />
    </div>
  );
}