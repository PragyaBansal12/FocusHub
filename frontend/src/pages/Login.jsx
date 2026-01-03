import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import axios from "axios"; // 🔥 Use axios instead of fetch

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [data, setData] = useState({ email: "", password: "" });

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      // 🔥 Use axios withCredentials so the cookie is stored properly
      const res = await axios.post("http://localhost:5000/api/auth/login", data, {
        withCredentials: true 
      });

      if (res.status === 200) {
        // Result.data is what axios returns
        login(res.data); 
        navigate("/dashboard"); 
      }
    } catch (err) {
      alert(err.response?.data?.message || "Login failed");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[url('/bg.jpg')] bg-cover bg-center">
      <div className="backdrop-blur-lg bg-white/10 p-8 rounded-2xl border border-white/20 w-[90%] max-w-md shadow-xl">
        <h2 className="text-2xl font-semibold text-white mb-6 text-center">FocusHub+ Login</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            placeholder="Email"
            className="w-full p-3 rounded-lg bg-white/20 text-white outline-none"
            onChange={(e) => setData({ ...data, email: e.target.value })}
          />

          <input
            type="password"
            placeholder="Password"
            className="w-full p-3 rounded-lg bg-white/20 text-white outline-none"
            onChange={(e) => setData({ ...data, password: e.target.value })}
          />

          <button className="w-full py-3 rounded-lg bg-white/80 hover:bg-white transition text-black font-semibold">
            Login
          </button>
        </form>

        <p className="text-sm text-white/70 text-center mt-4">
          Don't have an account?{" "}
          <span className="text-white underline cursor-pointer" onClick={() => navigate("/signup")}>
            Sign up
          </span>
        </p>
      </div>
    </div>
  );
}