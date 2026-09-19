import { Divider, Button, Flex } from 'antd';
import { type ReactNode, type MouseEvent } from 'react';

type FooterVariant =
  /** Hiển thị cả hai nút "Xóa lọc" và "Áp dụng" cạnh nhau */
  | 'both'
  /** Chỉ hiển thị nút "Xóa lọc" (full-width) */
  | 'clear'
  /** Chỉ hiển thị nút "Áp dụng" (full-width) */
  | 'apply';

interface CardDropdownProps {
  /** Tiêu đề hiển thị ở header */
  title?: string;
  /**
   * Các menu item kiểu Ant Design – dùng khi muốn render
   * đúng node `menu` nhận được từ `popupRender={(menu) => ...}`.
   * Truyền biến `menu` thẳng vào đây.
   */
  menu?: ReactNode;
  /** Nội dung tùy chỉnh bên trong body (ví dụ: FloatingInput, v.v.) */
  children?: ReactNode;
  /**
   * Kiểu footer:
   * - `'both'`  – 2 nút "Xóa lọc" + "Áp dụng" (mặc định khi `footer` = true)
   * - `'clear'` – chỉ nút "Xóa lọc"
   * - `'apply'` – chỉ nút "Áp dụng"
   * - `false` / `undefined` – không hiển thị footer
   */
  footer?: FooterVariant | boolean;
  /** Text nút xóa lọc (mặc định: "Xóa lọc") */
  clearText?: string;
  /** Text nút áp dụng (mặc định: "Áp dụng") */
  applyText?: string;
  /** Callback khi nhấn nút "Xóa lọc" */
  onClear?: () => void;
  /** Callback khi nhấn nút "Áp dụng" */
  onApply?: () => void;
  /** Chiều rộng card (mặc định: 360px / w-90) */
  width?: string | number;
  /** Tiêu đề căn giữa (mặc định: true) */
  centerTitle?: boolean;
  /** Truyền onClick để gọi e.stopPropagation() từ bên ngoài nếu cần */
  onClick?: (e: MouseEvent<HTMLDivElement>) => void;
  className?: string;
}

/**
 * Reusable card-style popup dùng làm `popupRender` cho Ant Design Dropdown.
 *
 * @example
 * // Với children tùy chỉnh + 2 nút footer
 * <ButtonDropdown
 *   popupRender={() => (
 *     <CardDropdown title="Khu vực" footer="both" onClear={...} onApply={...}
 *                   onClick={(e) => e.stopPropagation()}>
 *       <FloatingInput title="Chọn tỉnh thành" />
 *       <FloatingInput title="Chọn quận huyện" />
 *     </CardDropdown>
 *   )}
 * />
 *
 * @example
 * // Với ant menu node + nút "Xóa lọc"
 * <ButtonDropdown
 *   menus={items}
 *   popupRender={(menu) => (
 *     <CardDropdown title="Danh mục" menu={menu} footer="clear" onClear={...} />
 *   )}
 * />
 */
export function CardDropdown({
  title,
  menu,
  children,
  footer,
  clearText = 'Xóa lọc',
  applyText = 'Áp dụng',
  onClear,
  onApply,
  width = 360,
  centerTitle = true,
  onClick,
  className,
}: CardDropdownProps) {
  // Chuẩn hoá footer variant
  const footerVariant: FooterVariant | false =
    footer === true ? 'both' : footer === false || footer == null ? false : footer;

  const showClear = Boolean(
    onClear && (footerVariant === 'both' || footerVariant === 'clear'),
  );
  const showApply = Boolean(
    onApply && (footerVariant === 'both' || footerVariant === 'apply'),
  );
  const hasBody = Boolean(menu || children);
  const hasFooter = showClear || showApply;

  return (
    <div
      className={`bg-white rounded-lg shadow-lg overflow-hidden ${className ?? ''}`}
      style={{ width }}
      onClick={onClick}
    >
      {/* Header */}
      {title && (
        <>
          <div className={`p-3 font-bold text-[16px] ${centerTitle ? 'text-center' : ''}`}>
            {title}
          </div>
          <Divider className="my-0!" />
        </>
      )}

      {/* Body: custom children */}
      {children && <div className="p-3 flex flex-col gap-3">{children}</div>}

      {/* Body: ant menu node */}
      {menu}

      {/* Divider trước footer (chỉ khi có body và có footer) */}
      {hasBody && hasFooter && <Divider className="my-0!" />}

      {/* Footer */}
      {hasFooter && (
        <div className="p-3 bg-white">
          {footerVariant === 'both' ? (
            <Flex gap={12}>
              {showClear && (
                <Button className="rounded-md! w-full! h-10! text-[16px]!" onClick={onClear}>
                  {clearText}
                </Button>
              )}
              {showApply && (
                <Button
                  className="rounded-md! w-full! h-10! text-[16px]!"
                  type="primary"
                  onClick={onApply}
                >
                  {applyText}
                </Button>
              )}
            </Flex>
          ) : footerVariant === 'clear' ? (
            showClear && (
              <Button className="rounded-md! w-full! h-10! text-[16px]!" onClick={onClear}>
                {clearText}
              </Button>
            )
          ) : (
            showApply && (
              <Button
                className="rounded-md! w-full! h-10! text-[16px]!"
                type="primary"
                onClick={onApply}
              >
                {applyText}
              </Button>
            )
          )}
        </div>
      )}
    </div>
  );
}
