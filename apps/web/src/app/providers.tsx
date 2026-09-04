import { ConfigProvider, App as AntdApp } from "antd";
import viVN from "antd/locale/vi_VN";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ConfigProvider locale={viVN}>
      <AntdApp>{children}</AntdApp>
    </ConfigProvider>
  );
}
