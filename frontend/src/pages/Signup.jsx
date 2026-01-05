import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { GoogleLogin } from '@react-oauth/google';
import axios from "axios";
import { User, Mail, Lock, ArrowRight } from "lucide-react";

export default function Signup() {
  const navigate = useNavigate();
  const { user, login, loading } = useAuth();
  const [data, setData] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");

  useEffect(() => {
    if (!loading && user) {
      navigate("/dashboard", { replace: true });
    }
  }, [user, loading, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); 

    try {
      const res = await fetch("http://localhost:5000/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await res.json();

      if (res.ok) {
        login(result);
        navigate("/dashboard");
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError("Something went wrong. Please try again.");
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      const res = await axios.post("http://localhost:5000/api/auth/google-signup", {
        token: credentialResponse.credential
      }, {
        withCredentials: true
      });

      if (res.status === 200 || res.status === 201) {
        login(res.data);
        navigate("/dashboard"); 
      }
    } catch (err) {
      setError(err.response?.data?.message || "Google Signup failed");
    }
  };

  if (loading) return null;

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] dark:bg-[#0F172A] p-4 transition-colors duration-300">
      {/* Background Decorative Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-indigo-500/10 rounded-full blur-[100px]"></div>
        <div className="absolute bottom-[10%] right-[-5%] w-80 h-80 bg-emerald-500/10 rounded-full blur-[100px]"></div>
      </div>

      <div className="relative z-10 w-full max-w-md">
        <div className="bg-white dark:bg-[#1E293B] shadow-2xl shadow-indigo-500/10 rounded-3xl p-8 border border-slate-200 dark:border-slate-800">
          
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 bg-indigo-600 rounded-2xl text-white shadow-lg mb-4">
              <User size={28} />
            </div>
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Join FocusHub+</h2>
            <p className="text-slate-500 dark:text-slate-400 mt-2">Start organizing your study journey today.</p>
          </div>

          {/* Error Message - Sober and simple */}
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/50 text-red-600 dark:text-red-400 text-sm flex items-start gap-2">
              <span className="mt-1 w-1.5 h-1.5 shrink-0 rounded-full bg-red-600"></span>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="text"
                placeholder="Full Name"
                className="w-full pl-10 pr-4 py-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                value={data.name}
                onChange={(e) => setData({ ...data, name: e.target.value })}
                required
              />
            </div>

            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="email"
                placeholder="Email Address"
                className="w-full pl-10 pr-4 py-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                value={data.email}
                onChange={(e) => setData({ ...data, email: e.target.value })}
                required
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="password"
                placeholder="Password"
                className="w-full pl-10 pr-4 py-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                value={data.password}
                onChange={(e) => setData({ ...data, password: e.target.value })}
                required
              />
            </div>

            <button className="group w-full py-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-lg shadow-indigo-600/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2">
              Create Account
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </form>

          {/* Divider */}
          <div className="my-8 flex items-center gap-4">
            <div className="h-[1px] bg-slate-200 dark:bg-slate-800 flex-grow"></div>
            <span className="text-slate-400 text-xs font-medium uppercase tracking-wider">Or continue with</span>
            <div className="h-[1px] bg-slate-200 dark:bg-slate-800 flex-grow"></div>
          </div>

          {/* Correctly Centered Google Button */}
          <div className="flex justify-center w-full">
            <div className="inline-block">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => setError("Google Signup Failed")}
                text="signup_with"
                shape="pill"
                theme={document.documentElement.classList.contains('dark') ? 'filled_black' : 'outline'}
                width="280"
              />
            </div>
          </div>

          <p className="text-sm text-slate-500 dark:text-slate-400 text-center mt-8">
            Already a member?{" "}
            <button 
              onClick={() => navigate("/login")}
              className="text-indigo-600 dark:text-indigo-400 font-bold hover:underline underline-offset-4"
            >
              Sign In
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}