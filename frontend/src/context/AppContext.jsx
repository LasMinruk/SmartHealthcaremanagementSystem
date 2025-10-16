import { createContext, useEffect, useState } from "react";
import { toast } from "react-toastify";
import axios from "axios";

export const AppContext = createContext();

const AppContextProvider = (props) => {
  const currencySymbol = "$";
  const backendUrl =
    import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";

  const [doctors, setDoctors] = useState([]);
  const [token, setToken] = useState(
    localStorage.getItem("token") ? localStorage.getItem("token") : ""
  );
  const [userData, setUserData] = useState(false);

  // Getting Doctors using API
  const getDoctosData = async () => {
    try {
      const { data } = await axios.get(backendUrl + "/api/doctor/list");
      if (data.success) {
        setDoctors(data.doctors);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.log(error);
      toast.error(error.message);
    }
  };

  // Getting User Profile using API
const loadUserProfileData = async (currentToken) => {
    if (!currentToken) return; // Do nothing if there's no token
    try {
      const { data } = await axios.get(backendUrl + "/api/user/get-profile", {
        headers: { token: currentToken }, // Use the provided token
      });
      if (data.success) {
        setUserData(data.userData);
      } else {
        // If profile loading fails, the token is likely invalid.
        localStorage.removeItem("token");
        setToken("");
      }
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    getDoctosData();
  }, []);

  useEffect(() => {
    // This hook correctly loads user data if a token exists when the app starts.
    async function loadData() {
        await loadUserProfileData(token);
    }
    if (token) {
      loadData();
    }
  }, [token]);

//   useEffect(() => {
//     // Prevent auto-redirect if token is invalid/expired
//     if (token) {
//       try {
//         const decoded = JSON.parse(atob(token.split(".")[1]));
//         const now = Date.now() / 1000;
//         if (decoded.exp && decoded.exp > now) {
//           navigate("/");
//         } else {
//           localStorage.removeItem("token");
//           setToken("");
//         }
//       } catch {
//         localStorage.removeItem("token");
//         setToken("");
//       }
//     }
//   }, [token]);

  const value = {
    doctors,
    getDoctosData,
    currencySymbol,
    backendUrl,
    token,
    setToken,
    userData,
    setUserData,
    loadUserProfileData,
  };

  // Note: navigation should be handled within pages, not in context

  return (
    <AppContext.Provider value={value}>{props.children}</AppContext.Provider>
  );
};

export default AppContextProvider;
