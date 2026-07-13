import React, { createContext, useContext, useState, useEffect } from 'react';

const AdminThemeContext = createContext();

export const useAdminTheme = () => useContext(AdminThemeContext);

export const AdminThemeProvider = ({ children }) => {
  const [adminTheme, setAdminTheme] = useState(() => {
    const savedTheme = localStorage.getItem('adminThemePreference');
    if (savedTheme) {
      return savedTheme;
    }
    // We enforce 'light' theme as the default premium dashboard look,
    // overriding the system's dark mode preference for the admin side.
    return 'light';
  });

  useEffect(() => {
    localStorage.setItem('adminThemePreference', adminTheme);
  }, [adminTheme]);

  const toggleAdminTheme = () => {
    setAdminTheme((prevTheme) => (prevTheme === 'light' ? 'dark' : 'light'));
  };

  return (
    <AdminThemeContext.Provider value={{ adminTheme, toggleAdminTheme }}>
      {children}
    </AdminThemeContext.Provider>
  );
};
