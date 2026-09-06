import type { ThemeConfig } from "antd";

export const theme: ThemeConfig = {
  token: {
    // ========================================
    // COLORS
    // ========================================

    // Primary
    colorPrimary: "#16A6A3",
    colorPrimaryHover: "#0F8F8C",
    colorPrimaryActive: "#087F83",

    // Text
    colorText: "#073B3D",
    colorTextSecondary: "#315B5D",
    colorTextTertiary: "#6B8586",
    colorTextQuaternary: "#8FA7A8",

    // Background
    colorBgBase: "#FFFFFF",
    colorBgContainer: "#FFFFFF",
    colorBgLayout: "#F4FBFA",
    colorBgElevated: "#FFFFFF",
    colorBgSpotlight: "#EAF8F7",

    // Border
    colorBorder: "#D5E9E7",
    colorBorderSecondary: "#E4F1F0",

    // Fill
    colorFill: "#EAF8F7",
    colorFillSecondary: "#F4FBFA",
    colorFillTertiary: "#F8FCFC",

    // Status
    colorSuccess: "#22C55E",
    colorWarning: "#F59E0B",
    colorError: "#EF4444",
    colorInfo: "#16A6A3",

    // Links
    colorLink: "#16A6A3",
    colorLinkHover: "#0F8F8C",
    colorLinkActive: "#087F83",

    // ========================================
    // TYPOGRAPHY
    // ========================================

    fontFamily: "var(--font-sans)",

    fontSize: 14,
    fontSizeSM: 13,
    fontSizeLG: 16,
    fontSizeXL: 20,
    fontSizeHeading1: 38,
    fontSizeHeading2: 30,
    fontSizeHeading3: 24,
    fontSizeHeading4: 20,
    fontSizeHeading5: 16,

    fontWeightStrong: 600,

    lineHeight: 1.6,
    lineHeightHeading1: 1.2,
    lineHeightHeading2: 1.25,
    lineHeightHeading3: 1.3,
    lineHeightHeading4: 1.4,
    lineHeightHeading5: 1.5,

    // ========================================
    // BORDER RADIUS
    // ========================================

    borderRadius: 12,
    borderRadiusSM: 8,
    borderRadiusLG: 16,
    borderRadiusXS: 4,

    // ========================================
    // CONTROL
    // ========================================

    controlHeight: 40,
    controlHeightSM: 32,
    controlHeightLG: 48,

    controlOutlineWidth: 2,
    controlOutline: "rgba(22, 166, 163, 0.15)",

    // ========================================
    // SHADOW
    // ========================================

    boxShadow: "0 4px 12px rgba(7, 59, 61, 0.08)",

    boxShadowSecondary: "0 8px 24px rgba(7, 59, 61, 0.10)",

    boxShadowTertiary: "0 2px 6px rgba(7, 59, 61, 0.06)",

    // ========================================
    // MOTION
    // ========================================

    motionDurationFast: "0.15s",
    motionDurationMid: "0.2s",
    motionDurationSlow: "0.3s",
  },

  // ========================================
  // COMPONENTS
  // ========================================

  components: {
    // ----------------------------------------
    // Button
    // ----------------------------------------

    Button: {
      colorPrimary: "#16A6A3",
      colorPrimaryHover: "#0F8F8C",
      colorPrimaryActive: "#087F83",

      colorText: "#073B3D",
      colorTextDisabled: "#9BB1B2",

      defaultBg: "#FFFFFF",
      defaultBorderColor: "#D5E9E7",
      defaultColor: "#073B3D",

      defaultHoverBg: "#EAF8F7",
      defaultHoverBorderColor: "#16A6A3",
      defaultHoverColor: "#087F83",

      borderRadius: 9999,

      controlHeight: 40,
      controlHeightSM: 32,
      controlHeightLG: 48,

      paddingInline: 16,
      paddingInlineSM: 16,
      paddingInlineLG: 24,

      fontWeight: 600,

      primaryShadow: "0 4px 12px rgba(22, 166, 163, 0.20)",
    },

    // ----------------------------------------
    // Input
    // ----------------------------------------

    Input: {
      colorBgContainer: "#FFFFFF",

      colorBorder: "#D5E9E7",

      colorText: "#073B3D",
      colorTextPlaceholder: "#8FA7A8",

      activeBorderColor: "#16A6A3",
      hoverBorderColor: "#16A6A3",

      activeShadow: "0 0 0 2px rgba(22, 166, 163, 0.12)",

      borderRadius: 10,

      controlHeight: 40,
    },

    // ----------------------------------------
    // InputNumber
    // ----------------------------------------

    InputNumber: {
      colorBgContainer: "#FFFFFF",

      colorBorder: "#D5E9E7",

      activeBorderColor: "#16A6A3",
      hoverBorderColor: "#16A6A3",

      activeShadow: "0 0 0 2px rgba(22, 166, 163, 0.12)",

      borderRadius: 10,

      controlHeight: 40,
    },

    // ----------------------------------------
    // Select
    // ----------------------------------------

    Select: {
      colorBgContainer: "#FFFFFF",

      colorBorder: "#D5E9E7",

      colorText: "#073B3D",
      colorTextPlaceholder: "#8FA7A8",

      optionSelectedBg: "#EAF8F7",
      optionSelectedColor: "#087F83",

      optionActiveBg: "#F4FBFA",

      activeBorderColor: "#16A6A3",
      hoverBorderColor: "#16A6A3",

      activeOutlineColor: "rgba(22, 166, 163, 0.12)",

      borderRadius: 10,

      controlHeight: 40,
    },

    // ----------------------------------------
    // DatePicker
    // ----------------------------------------

    DatePicker: {
      colorBgContainer: "#FFFFFF",

      colorBorder: "#D5E9E7",

      colorText: "#073B3D",
      colorTextPlaceholder: "#8FA7A8",

      activeBorderColor: "#16A6A3",
      hoverBorderColor: "#16A6A3",

      activeShadow: "0 0 0 2px rgba(22, 166, 163, 0.12)",

      borderRadius: 10,

      controlHeight: 40,
    },
    // ----------------------------------------
    // Checkbox
    // ----------------------------------------

    Checkbox: {
      colorPrimary: "#16A6A3",
      colorPrimaryHover: "#0F8F8C",

      borderRadiusSM: 5,

      colorBgContainer: "#FFFFFF",
    },

    // ----------------------------------------
    // Radio
    // ----------------------------------------

    Radio: {
      colorPrimary: "#16A6A3",
      colorPrimaryHover: "#0F8F8C",

      buttonBg: "#FFFFFF",

      buttonCheckedBg: "#EAF8F7",

      buttonSolidCheckedBg: "#16A6A3",
      buttonSolidCheckedHoverBg: "#0F8F8C",

      borderRadius: 8,
    },

    // ----------------------------------------
    // Switch
    // ----------------------------------------

    Switch: {
      colorPrimary: "#16A6A3",
      colorPrimaryHover: "#0F8F8C",

      colorTextQuaternary: "#D5E9E7",

      handleBg: "#FFFFFF",
    },

    // ----------------------------------------
    // Tabs
    // ----------------------------------------

    Tabs: {
      itemColor: "#647F80",

      itemHoverColor: "#16A6A3",

      itemSelectedColor: "#087F83",

      itemActiveColor: "#087F83",

      inkBarColor: "#16A6A3",

      horizontalItemGutter: 28,
    },

    // ----------------------------------------
    // Menu
    // ----------------------------------------

    Menu: {
      itemColor: "#315B5D",

      itemHoverColor: "#087F83",

      itemSelectedColor: "#087F83",

      itemSelectedBg: "#EAF8F7",

      itemHoverBg: "#F4FBFA",

      itemActiveBg: "#EAF8F7",

      activeBarWidth: 3,

      activeBarHeight: 2,

      itemBorderRadius: 8,
    },

    // ----------------------------------------
    // Dropdown
    // ----------------------------------------

    Dropdown: {
      colorBgElevated: "#FFFFFF",

      borderRadiusLG: 12,

      controlItemBgHover: "#F4FBFA",

      controlItemBgActive: "#EAF8F7",
    },

    // ----------------------------------------
    // Card
    // ----------------------------------------

    Card: {
      colorBgContainer: "#FFFFFF",

      colorBorderSecondary: "#E4F1F0",

      borderRadiusLG: 16,

      boxShadowTertiary: "0 4px 16px rgba(7, 59, 61, 0.06)",

      bodyPadding: 20,

      headerFontSize: 18,
    },

    // ----------------------------------------
    // Modal
    // ----------------------------------------

    Modal: {
      contentBg: "#FFFFFF",

      headerBg: "#FFFFFF",

      titleColor: "#073B3D",

      titleFontSize: 20,

      borderRadiusLG: 16,

      footerBg: "#FFFFFF",
    },

    // ----------------------------------------
    // Drawer
    // ----------------------------------------

    Drawer: {
      colorBgElevated: "#FFFFFF",

      colorText: "#073B3D",

      borderRadiusLG: 16,

      footerPaddingBlock: 16,
      footerPaddingInline: 20,
    },

    // ----------------------------------------
    // Badge
    // ----------------------------------------

    Badge: {
      colorPrimary: "#16A6A3",

      colorError: "#EF4444",

      colorSuccess: "#22C55E",

      colorWarning: "#F59E0B",

      textFontSize: 12,
    },

    // ----------------------------------------
    // Tag
    // ----------------------------------------

    Tag: {
      defaultBg: "#EAF8F7",

      defaultColor: "#087F83",

      borderRadiusSM: 9999,

      fontSize: 13,
    },

    // ----------------------------------------
    // Avatar
    // ----------------------------------------

    Avatar: {
      colorBgContainer: "#D9F5F3",

      colorTextPlaceholder: "#087F83",

      borderRadius: 9999,
    },

    // ----------------------------------------
    // Tooltip
    // ----------------------------------------

    Tooltip: {
      colorBgSpotlight: "#073B3D",

      colorTextLightSolid: "#FFFFFF",

      borderRadius: 8,
    },

    // ----------------------------------------
    // Popover
    // ----------------------------------------

    Popover: {
      colorBgElevated: "#FFFFFF",

      borderRadiusLG: 12,

      boxShadowSecondary: "0 8px 24px rgba(7, 59, 61, 0.12)",
    },

    // ----------------------------------------
    // Alert
    // ----------------------------------------

    Alert: {
      colorInfoBg: "#EAF8F7",
      colorInfoBorder: "#B8E5E2",
      colorInfoText: "#087F83",

      colorSuccessBg: "#F0FDF4",
      colorSuccessBorder: "#BBF7D0",

      colorWarningBg: "#FFFBEB",
      colorWarningBorder: "#FDE68A",

      colorErrorBg: "#FEF2F2",
      colorErrorBorder: "#FECACA",

      borderRadiusLG: 12,
    },

    // ----------------------------------------
    // Progress
    // ----------------------------------------

    Progress: {
      defaultColor: "#16A6A3",

      remainingColor: "#EAF8F7",

      lineBorderRadius: 9999,
    },

    // ----------------------------------------
    // Slider
    // ----------------------------------------

    Slider: {
      trackBg: "#16A6A3",

      trackHoverBg: "#0F8F8C",

      handleColor: "#16A6A3",

      handleActiveColor: "#087F83",

      railBg: "#D9F5F3",

      railHoverBg: "#B8E5E2",
    },

    // ----------------------------------------
    // Pagination
    // ----------------------------------------

    Pagination: {
      itemActiveBg: "#16A6A3",

      itemActiveColorDisabled: "#FFFFFF",

      itemBg: "#FFFFFF",

      itemLinkBg: "#FFFFFF",

      itemSize: 36,

      itemSizeSM: 28,

      borderRadius: 8,
    },

    // ----------------------------------------
    // Table
    // ----------------------------------------

    Table: {
      headerBg: "#EAF8F7",

      headerColor: "#073B3D",

      rowHoverBg: "#F4FBFA",

      borderColor: "#E4F1F0",

      colorText: "#315B5D",

      borderRadiusLG: 12,
    },

    // ----------------------------------------
    // List
    // ----------------------------------------

    List: {
      colorText: "#315B5D",

      colorTextDescription: "#6B8586",

      colorBorder: "#E4F1F0",

      itemPadding: "12px 0",
    },

    // ----------------------------------------
    // Divider
    // ----------------------------------------

    Divider: {
      colorSplit: "#E4F1F0",

      marginLG: 24,

      margin: 16,
    },

    // ----------------------------------------
    // Skeleton
    // ----------------------------------------

    Skeleton: {
      colorFill: "#EAF8F7",

      colorFillContent: "#F4FBFA",
    },

    // ----------------------------------------
    // Spin
    // ----------------------------------------

    Spin: {
      colorPrimary: "#16A6A3",
    },

    // ----------------------------------------
    // Upload
    // ----------------------------------------

    Upload: {
      colorPrimary: "#16A6A3",

      colorPrimaryHover: "#0F8F8C",

      colorBorder: "#D5E9E7",

      colorFillAlter: "#F4FBFA",

      borderRadiusLG: 12,
    },

    // ----------------------------------------
    // Breadcrumb
    // ----------------------------------------

    Breadcrumb: {
      itemColor: "#6B8586",

      lastItemColor: "#073B3D",

      linkColor: "#315B5D",

      linkHoverColor: "#16A6A3",

      separatorColor: "#8FA7A8",
    },

    // ----------------------------------------
    // Steps
    // ----------------------------------------

    Steps: {
      colorPrimary: "#16A6A3",

      colorText: "#315B5D",

      colorTextDescription: "#6B8586",

      colorSplit: "#D5E9E7",

      titleLineHeight: 1.4,

      iconSize: 32,
    },

    // ----------------------------------------
    // Segmented
    // ----------------------------------------

    Segmented: {
      itemSelectedBg: "#FFFFFF",

      itemHoverBg: "#F4FBFA",

      itemSelectedColor: "#087F83",

      trackBg: "#EAF8F7",

      borderRadius: 10,
    },

    // ----------------------------------------
    // Empty
    // ----------------------------------------

    Empty: {
      colorTextDescription: "#6B8586",

      colorTextDisabled: "#9BB1B2",
    },

    // ----------------------------------------
    // Result
    // ----------------------------------------

    Result: {
      titleFontSize: 24,

      subtitleFontSize: 16,

      colorTextDescription: "#6B8586",
    },

    // ----------------------------------------
    // Statistic
    // ----------------------------------------

    Statistic: {
      titleFontSize: 14,

      contentFontSize: 28,

      colorTextDescription: "#6B8586",
    },

    // ----------------------------------------
    // Typography
    // ----------------------------------------

    Typography: {
      titleMarginBottom: 12,

      titleMarginTop: 0,

      colorText: "#073B3D",

      colorTextSecondary: "#315B5D",

      colorLink: "#16A6A3",

      colorLinkHover: "#0F8F8C",
    },
  },
};
