import { createContext, useState, useEffect } from "react";

export const LabPharmacyContext = createContext();

const LabPharmacyContextProvider = ({ children }) => {
  const backendUrl = import.meta.env.VITE_BACKEND_URL;

  const [lbToken, setLbToken] = useState(
    localStorage.getItem("lbtoken") || ""
  );

  // Sync token with localStorage whenever it changes
  useEffect(() => {
    if (lbToken) {
      localStorage.setItem("lbtoken", lbToken);
    } else {
      localStorage.removeItem("lbtoken");
    }
  }, [lbToken]);

  const value = {
    lbToken,
    setLbToken,
    backendUrl,
  };

  return (
    <LabPharmacyContext.Provider value={value}>
      {children}
    </LabPharmacyContext.Provider>
  );
};

export default LabPharmacyContextProvider;