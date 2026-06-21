import { createContext, useContext, useState, useEffect } from "react";

// Create the context
const BranchContext = createContext();

// Create the Provider component
export const BranchProvider = ({ children }) => {
  // Default to Manila, save to localStorage so it remembers when they refresh
  const [branch, setBranch] = useState(localStorage.getItem("bloomora_branch") || "Manila");

  useEffect(() => {
    localStorage.setItem("bloomora_branch", branch);
  }, [branch]);

  return (
    <BranchContext.Provider value={{ branch, setBranch }}>
      {children}
    </BranchContext.Provider>
  );
};

// 🚀 THIS IS THE MISSING PIECE: Export the custom hook
export const useBranch = () => {
  const context = useContext(BranchContext);
  if (context === undefined) {
    throw new Error("useBranch must be used within a BranchProvider");
  }
  return context;
};