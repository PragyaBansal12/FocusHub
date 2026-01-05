import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import axios from "axios"; 
import { GoogleLogin } from "@react-oauth/google";
import { Mail, Lock, LogIn, ArrowRight } from "lucide-react";

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [data, setData] = useState({ email: "", password: "" });
  const [error, setError] = useState(""); // 🔥 Added state for sober on-page errors

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); // Clear previous errors

    try {
      const res = await axios.post("http://localhost:5000/api/auth/login", data, {
        withCredentials: true 
      });

      if (res.status === 200) {
        login(res.data); 
        navigate("/dashboard"); 
      }
    } catch (err) {
      // 🔥 Replaced alert with setError for on-page message
      setError(err.response?.data?.message || "Invalid email or password");
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    setError(""); // Clear previous errors
    try {
      const res = await axios.post("http://localhost:5000/api/auth/google-login", {
        token: credentialResponse.credential
      }, {
        withCredentials: true
      });

      if (res.status === 200) {
        login(res.data);
        navigate("/dashboard");
      }
    } catch (err) {
      // 🔥 Replaced alert with setError for on-page message
      setError(err.response?.data?.message || "No account found. Please sign up first.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] dark:bg-[#0F172A] p-4 transition-colors duration-300">
      
      {/* Decorative Background Blurs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-indigo-500/10 rounded-full blur-[100px]"></div>
        <div className="absolute bottom-[10%] right-[-5%] w-80 h-80 bg-emerald-500/10 rounded-full blur-[100px]"></div>
      </div>

      <div className="relative z-10 w-full max-w-md">
        <div className="bg-white dark:bg-[#1E293B] shadow-2xl rounded-3xl p-8 border border-slate-200 dark:border-slate-800 transition-all">
          
          {/* Header Section */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 bg-indigo-600 rounded-2xl text-white shadow-lg mb-4">
              <LogIn size={28} />
            </div>
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white">FocusHub+</h2>
            <p className="text-slate-500 dark:text-slate-400 mt-2">Log in to your account</p>
          </div>

          {/* 🔥 Sober Error Display - Matches Signup page */}
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/50 text-red-600 dark:text-red-400 text-sm flex items-start gap-2">
              <span className="mt-1 w-1.5 h-1.5 shrink-0 rounded-full bg-red-600"></span>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="email"
                placeholder="Email Address"
                className="w-full pl-10 pr-4 py-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                onChange={(e) => setData({ ...data, email: e.target.value })}
                required
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="password"
                placeholder="Password"
                className="w-full pl-10 pr-4 py-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                onChange={(e) => setData({ ...data, password: e.target.value })}
                required
              />
            </div>

            <button className="group w-full py-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-lg shadow-indigo-600/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2">
              Login to Hub
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </form>

          {/* Divider */}
          <div className="my-8 flex items-center gap-4">
            <div className="h-[1px] bg-slate-200 dark:bg-slate-800 flex-grow"></div>
            <span className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.2em]">Or</span>
            <div className="h-[1px] bg-slate-200 dark:bg-slate-800 flex-grow"></div>
          </div>

          {/* 🔥 Correctly Centered Google Login Button */}
          <div className="flex justify-center w-full">
            <div className="inline-block">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => setError("Google Login Failed")}
                useOneTap={false}
                theme={document.documentElement.classList.contains('dark') ? 'filled_black' : 'outline'}
                shape="pill"
                width="280"
              />
            </div>
          </div>

          <p className="text-sm text-slate-500 dark:text-slate-400 text-center mt-8 font-medium">
            Don't have an account?{" "}
            <span 
              className="text-indigo-600 dark:text-indigo-400 underline decoration-indigo-500/30 underline-offset-4 cursor-pointer hover:text-indigo-700 transition-all font-bold" 
              onClick={() => navigate("/signup")}
            >
              Sign up
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}