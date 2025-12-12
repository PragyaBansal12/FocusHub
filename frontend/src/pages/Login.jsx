import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
export default function Login() {
  const navigate = useNavigate();
  const {login} = useAuth();
  const [data, setData] = useState({ email: "", password: "" });

  const handleSubmit = async (e) => {
    e.preventDefault();

    const res = await fetch("http://localhost:5000/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    const result = await res.json();
    if (res.ok) {
      login(result.token);
      navigate("/"); // redirect to dashboard
    } else {
      alert(result.message);
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
