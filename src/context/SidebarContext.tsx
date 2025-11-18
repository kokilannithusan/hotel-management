import React, { createContext, useContext, useState, useCallback } from "react";

interface SidebarContextType {
  isSidebarVisible: boolean;
  hideSidebar: () => void;
  showSidebar: () => void;
  toggleSidebar: () => void;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export const SidebarProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [isSidebarVisible, setIsSidebarVisible] = useState(true);

  const hideSidebar = useCallback(() => {
    setIsSidebarVisible(false);
  }, []);

  const showSidebar = useCallback(() => {
    setIsSidebarVisible(true);
  }, []);

  const toggleSidebar = useCallback(() => {
    setIsSidebarVisible((prev) => !prev);
  }, []);

  return (
    <SidebarContext.Provider
      value={{ isSidebarVisible, hideSidebar, showSidebar, toggleSidebar }}
    >
      {children}
    </SidebarContext.Provider>
  );
};

export const useSidebar = (): SidebarContextType => {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider");
  }
  return context;
};
