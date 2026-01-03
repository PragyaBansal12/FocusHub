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

    // Function to check the session status
    const checkUserSession = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            if (token) {
                axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
            } else {
                // If no token, ensure axios header is cleared
                delete axios.defaults.headers.common["Authorization"];
            }

            const response = await axios.get(`${API_BASE_URL}/me`); 
            setUser(response.data); 
        } catch (error) {
            setUser(null);
            localStorage.removeItem('token');
            delete axios.defaults.headers.common["Authorization"];
        } finally {
            setLoading(false);
        }
    };

    // 1. Initial Load Check
    useEffect(() => {
        checkUserSession();
    }, []);

    // 2. 🔥 CROSS-TAB SYNC LOGIC
    // This listens for changes in localStorage from OTHER tabs
    useEffect(() => {
        const syncTabs = (event) => {
            if (event.key === 'token') {
                console.log("Session change detected in another tab. Syncing...");
                checkUserSession();
            }
        };

        window.addEventListener('storage', syncTabs);
        return () => window.removeEventListener('storage', syncTabs);
    }, []);

    const login = (userData) => {
        const token = userData.token;
        if (token) {
            localStorage.setItem('token', token);
            axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
        }
        setUser(userData.user || userData); 
    };

    const logout = async () => {
        try {
            await axios.post(`${API_BASE_URL}/logout`); 
        } catch (error) {
            console.error("Error logging out:", error);
        } finally {
            // Always clear local state even if server call fails
            setUser(null);
            localStorage.removeItem('token');
            delete axios.defaults.headers.common["Authorization"];
        }
    };

    return (
        <AuthContext.Provider value={{ user, loading, isLoggedIn: !!user, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
}