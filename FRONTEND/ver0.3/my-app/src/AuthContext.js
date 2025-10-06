import { createContext, useContext, useState } from "react";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [authorized, setAuthorized] = useState(false);
  const [username, setUsername] = useState("");

  return (
    <AuthContext.Provider value={{ authorized, setAuthorized, username, setUsername }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
