import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import type { CustomReservationType } from "../pages/channels/ReservationTypeManager";

interface ReservationTypeContextType {
  customTypes: CustomReservationType[];
  setCustomTypes: (types: CustomReservationType[]) => void;
}

const ReservationTypeContext = createContext<
  ReservationTypeContextType | undefined
>(undefined);

const STORAGE_KEY = "customReservationTypes";

export const ReservationTypeProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [customTypes, setCustomTypes] = useState<CustomReservationType[]>(
    () => {
      // Load from localStorage on initial render
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    }
  );

  // Save to localStorage whenever customTypes changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(customTypes));
  }, [customTypes]);

  return (
    <ReservationTypeContext.Provider value={{ customTypes, setCustomTypes }}>
      {children}
    </ReservationTypeContext.Provider>
  );
};

export const useReservationTypes = () => {
  const context = useContext(ReservationTypeContext);
  if (context === undefined) {
    throw new Error(
      "useReservationTypes must be used within a ReservationTypeProvider"
    );
  }
  return context;
};
