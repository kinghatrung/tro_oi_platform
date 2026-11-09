'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, App, Button, Form, Input, Segmented } from 'antd';
import { ExternalLink, FileText, Save, Undo2 } from 'lucide-react';
import { PageSlug, type AdminPage, type UpsertPageRequest } from '@tro-oi/shared';

import { getAdminPage, updateAdminPage } from '@/api/admin';
import { useSiteSettings } from '@/app/providers';
import { FormPageLayout } from '@/components/admin';
import { POLICY_TEMPLATES } from '@/lib/constants/policyTemplates';

const PAGE_OPTIONS = [
  { value: PageSlug.TERMS, label: 'Điều khoản sử dụng' },
  { value: PageSlug.PRIVACY, label: 'Chính sách bảo mật' },
];
const PLACEHOLDER = /\[\[[^\]]*\]\]/g;

/** Bản nháp chưa lưu theo từng trang (chỉ trên trình duyệt này). */
type Drafts = Partial<Record<PageSlug, UpsertPageRequest>>;
const DRAFT_KEY = 'tro-oi.admin.policyDrafts';

const readDrafts = (): Drafts => {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(DRAFT_KEY) ?? '{}');
    return value && typeof value === 'object' ? (value as Drafts) : {};
  } catch {
    return {};
  }
};

const writeDrafts = (drafts: Drafts) => {
  try {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(drafts));
  } catch {
    // Trình duyệt chặn storage: bản nháp vẫn giữ khi đổi tab, chỉ mất khi tải lại trang
  }
};

const withoutDraft = (drafts: Drafts, slug: PageSlug) =>
  Object.fromEntries(Object.entries(drafts).filter(([key]) => key !== slug)) as Drafts;

const SYNTAX_HELP =
  'Định dạng: "## " tiêu đề mục, "### " tiêu đề nhỏ, "- " gạch đầu dòng, dòng trống = sang đoạn mới. Xoá hết nội dung rồi lưu = gỡ trang.';

/**
 * Soạn & đăng trang Điều khoản / Chính sách bảo mật. Chưa có nội dung → trang công khai 404, ẩn link.
 * Nội dung chưa lưu giữ thành bản nháp theo từng trang (đổi tab / tải lại trang không mất).
 */
export default function AdminPolicyPagesPage() {
  const { message, modal } = App.useApp();
  const settings = useSiteSettings();
  const [form] = Form.useForm<UpsertPageRequest>();
  const [slug, setSlug] = useState(PageSlug.TERMS);
  const [page, setPage] = useState<AdminPage | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [drafts, setDrafts] = useState<Drafts>({});
  // Đọc trong callback tải trang mà không phải đưa drafts vào deps (tránh tải lại khi gõ)
  const draftsRef = useRef<Drafts>({});
  const content = Form.useWatch('content', form) ?? '';
  const placeholderCount = content.match(PLACEHOLDER)?.length ?? 0;

  const updateDrafts = useCallback((next: Drafts) => {
    draftsRef.current = next;
    setDrafts(next);
    writeDrafts(next);
  }, []);

  // Khai báo trước effect tải trang: bản nháp đã có sẵn khi API trả về
  useEffect(() => {
    draftsRef.current = readDrafts();
    setDrafts(draftsRef.current);
  }, []);

  useEffect(() => {
    let cancelled = false;
    setPage(null);
    getAdminPage(slug)
      .then((loaded) => {
        if (cancelled) return;
        setPage(loaded);
        form.setFieldsValue(
          draftsRef.current[slug] ?? { title: loaded.title, content: loaded.content },
        );
      })
      .catch((error: Error) => message.error(error.message));
    return () => {
      cancelled = true;
    };
  }, [form, message, slug]);

  /** Ô soạn khác bản đã lưu → ghi bản nháp; trùng lại → xoá bản nháp. */
  const syncDraft = useCallback(() => {
    if (!page || page.slug !== slug) return; // đang tải trang khác
    const values = form.getFieldsValue();
    const isChanged = values.title !== page.title || values.content !== page.content;
    const rest = withoutDraft(draftsRef.current, slug);
    updateDrafts(isChanged ? { ...rest, [slug]: values } : rest);
  }, [form, page, slug, updateDrafts]);

  const discardDraft = () =>
    modal.confirm({
      title: 'Bỏ bản nháp chưa lưu?',
      content: 'Ô soạn quay về nội dung đã lưu gần nhất.',
      okText: 'Bỏ bản nháp',
      okButtonProps: { danger: true },
      cancelText: 'Huỷ',
      onOk: () => {
        updateDrafts(withoutDraft(draftsRef.current, slug));
        if (page) form.setFieldsValue({ title: page.title, content: page.content });
      },
    });

  const insertTemplate = () => {
    const apply = () => {
      form.setFieldsValue({
        content: POLICY_TEMPLATES[slug]({
          siteName: settings.siteName,
          contactEmail: settings.contactEmail,
        }),
      });
      syncDraft(); // setFieldsValue không kích hoạt onValuesChange
    };
    if (!content.trim()) {
      apply();
      return;
    }
    modal.confirm({
      title: 'Thay nội dung đang soạn bằng bản nháp mẫu?',
      content: 'Nội dung hiện tại trong ô soạn sẽ bị thay thế (chưa ảnh hưởng trang đã đăng).',
      okText: 'Thay',
      cancelText: 'Huỷ',
      onOk: apply,
    });
  };

  const handleSubmit = async (values: UpsertPageRequest) => {
    setIsSaving(true);
    try {
      const saved = await updateAdminPage(slug, values);
      setPage(saved);
      updateDrafts(withoutDraft(draftsRef.current, slug));
      message.success(saved.content ? 'Đã lưu và đăng trang' : 'Đã gỡ trang khỏi website');
    } catch (error) {
      message.error((error as Error).message);
    } finally {
      setIsSaving(false);
    }
  };

  const isPublished = Boolean(page?.content);
  const hasDraft = Boolean(drafts[slug]);

  return (
    <FormPageLayout
      title="Trang chính sách"
      loading={!page}
      subtitle={
        page &&
        `${
          isPublished
            ? `Đang hiển thị · cập nhật ${new Date(page.updatedAt!).toLocaleString('vi-VN')}`
            : 'Chưa đăng — trang công khai trả 404 và chân trang ẩn link'
        }${hasDraft ? ' · Có bản nháp chưa lưu' : ''}`
      }
      footer={
        <>
          {hasDraft && (
            <Button icon={<Undo2 size={16} />} onClick={discardDraft}>
              Bỏ bản nháp
            </Button>
          )}
          <Button icon={<FileText size={16} />} onClick={insertTemplate}>
            Chèn bản nháp mẫu
          </Button>
          {isPublished && (
            <Button icon={<ExternalLink size={16} />} href={`/${slug}`} target="_blank">
              Xem trang
            </Button>
          )}
          <Button
            type="primary"
            icon={<Save size={16} />}
            loading={isSaving}
            disabled={placeholderCount > 0}
            onClick={form.submit}
          >
            Lưu & đăng
          </Button>
        </>
      }
    >
      <div className="max-w-240">
        <Segmented
          options={PAGE_OPTIONS.map((option) => ({
            ...option,
            label: drafts[option.value] ? (
              <span title="Có bản nháp chưa lưu">
                {option.label} <span className="text-amber-500">●</span>
              </span>
            ) : (
              option.label
            ),
          }))}
          value={slug}
          onChange={(value) => setSlug(value as PageSlug)}
          className="mb-4!"
        />
        <Alert
          type="warning"
          showIcon
          className="mb-4!"
          title="Bản nháp mẫu không phải văn bản pháp lý"
          description="Bản nháp chỉ mô tả đúng cách website đang hoạt động (dữ liệu thu thập, cookie, dịch vụ bên thứ ba, thời hạn lưu). Hãy nhờ người có chuyên môn pháp lý rà soát và điền các mục [[...]] trước khi đăng — hệ thống không cho đăng khi còn mục chưa điền."
        />
        <Form form={form} layout="vertical" onFinish={handleSubmit} onValuesChange={syncDraft}>
          <Form.Item
            name="title"
            label="Tiêu đề trang"
            rules={[{ required: true, min: 2, max: 100, message: 'Tiêu đề từ 2 đến 100 ký tự' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="content"
            label="Nội dung"
            extra={SYNTAX_HELP}
            validateStatus={placeholderCount > 0 ? 'warning' : undefined}
            help={
              placeholderCount > 0
                ? `Còn ${placeholderCount} mục [[...]] chưa điền — điền hoặc xoá trước khi đăng`
                : undefined
            }
          >
            <Input.TextArea
              autoSize={{ minRows: 18, maxRows: 40 }}
              maxLength={50_000}
              showCount
              className="font-mono! text-sm!"
              placeholder='Bấm "Chèn bản nháp mẫu" để bắt đầu từ bản nháp, hoặc dán nội dung đã được rà soát.'
            />
          </Form.Item>
        </Form>
      </div>
    </FormPageLayout>
  );
}
