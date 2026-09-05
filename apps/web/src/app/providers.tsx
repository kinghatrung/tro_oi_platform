import { ConfigProvider, App as AntdApp } from "antd";
import viVN from "antd/locale/vi_VN";

import { theme } from "@/theme/antTheme";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ConfigProvider locale={viVN} theme={theme}>
      <AntdApp>{children}</AntdApp>
    </ConfigProvider>
  );
}
