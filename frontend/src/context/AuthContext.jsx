import { createContext, useContext, useState, useEffect } from "react";
import axios from "axios"; 

const AuthContext = createContext();
export const useAuth = () => useContext(AuthContext);

// 🔥 CRITICAL: Configure axios to always send cookies with requests
axios.defaults.withCredentials = true; 
const API_BASE_URL = "http://localhost:5000/api/auth"; 

export default function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // Function to check the session status using the secure cookie
    const checkUserSession = async () => {
        try {
            // This call triggers the authMiddleware on the backend.
            const response = await axios.get(`${API_BASE_URL}/me`); 

            // If 200 OK, the cookie is valid.
            setUser(response.data); 

        } catch (error) {
            // If 401 Unauthorized, the cookie is invalid or missing.
            setUser(null);
        } finally {
            // 🔥 CRITICAL: Set loading to false only after the API call finishes.
            setLoading(false);
        }
    };

    useEffect(() => {
        // Run the session check only once on component mount
        checkUserSession();
    }, []);

    const login = (userData) => {
        // Frontend state updated on successful login/signup, token is in the cookie.
        setUser(userData); 
    };

    const logout = async () => {
        // Remove the user state and trigger backend to clear the cookie
        try {
            // Assuming you implement a /logout route to clear the cookie
            await axios.post(`${API_BASE_URL}/logout`); 
        } catch (error) {
            console.error("Error logging out:", error);
        }
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, loading, isLoggedIn: !!user, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
}