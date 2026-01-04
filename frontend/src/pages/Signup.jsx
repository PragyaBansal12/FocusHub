import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { GoogleLogin } from '@react-oauth/google'; // 🔥 Added this
import axios from "axios"; // 🔥 Added this

export default function Signup() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [data, setData] = useState({ name: "", email: "", password: "" });

  // Existing manual signup logic (using fetch as per your code)
  const handleSubmit = async (e) => {
    e.preventDefault();

    const res = await fetch("http://localhost:5000/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    const result = await res.json();
    if (res.ok) {
      login(result); // Pass the whole result if your context needs user + token
      navigate("/");
    } else {
      alert(result.message);
    }
  };

  // 🔥 NEW: Google Signup Success Handler
  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      const res = await axios.post("http://localhost:5000/api/auth/google-login", {
        token: credentialResponse.credential
      }, {
        withCredentials: true
      });

      if (res.status === 200 || res.status === 201) {
        login(res.data);
        navigate("/"); 
      }
    } catch (err) {
      console.error("Google Signup Error:", err);
      alert(err.response?.data?.message || "Google Signup failed");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[url('/bg.jpg')] bg-cover bg-center">
      <div className="backdrop-blur-lg bg-white/10 p-8 rounded-2xl border border-white/20 w-[90%] max-w-md shadow-xl">
        <h2 className="text-2xl font-semibold text-white mb-6 text-center">Create Account</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            placeholder="Full Name"
            className="w-full p-3 rounded-lg bg-white/20 text-white outline-none"
            onChange={(e) => setData({ ...data, name: e.target.value })}
          />

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
            Sign Up
          </button>
        </form>

        {/* 🔥 Google Signup Button */}
        <div className="mt-6 flex justify-center">
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={() => alert("Google Signup Failed")}
            text="signup_with" // Makes the button say "Sign up with Google"
            shape="pill"
            theme="filled_blue"
          />
        </div>

        <p className="text-sm text-white/70 text-center mt-4">
          Already have an account?{" "}
          <span className="text-white underline cursor-pointer" onClick={() => navigate("/login")}>
            Login
          </span>
        </p>
      </div>
    </div>
  );
}