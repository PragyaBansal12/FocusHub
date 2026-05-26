import React, { useState } from 'react';
import { Check, Star, Zap, Shield } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function Subscription() {
    const { user, updateUser } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);

    // Plan IDs should be fetched from env or constants, but for now we hardcode placeholders
    // You must replace these with your actual Razorpay Plan IDs
    const plans = [
        {
            id: 'free',
            name: 'Free',
            price: '₹0',
            period: '/forever',
            description: 'Everything a student needs to get started',
            features: [
                'Up to 10 active tasks',
                'Task priority & due dates',
                '1-hour push notifications',
                'Pomodoro timer (custom intervals)',
                'Analytics (90-day history)',
                '3 material uploads (max 5MB)',
                'Community chat access'
            ],
            buttonText: 'Current Plan',
            popular: false,
            planId: null
        },
        {
            id: 'pro',
            name: 'Pro',
            price: '₹99',
            period: '/month',
            description: 'For students serious about their goals',
            features: [
                'Everything in Free',
                'Unlimited active tasks',
                '3-hour push notifications',
                'Analytics (365-day history)',
                'Unlimited uploads (max 25MB)',
                'Google Calendar Sync'
            ],
            buttonText: 'Upgrade to Pro',
            popular: true,
        },
        {
            id: 'yearly',
            name: 'Yearly',
            price: '₹799',
            period: '/year',
            description: 'Pro features at 33% off',
            features: [
                'Everything in Pro',
                'Save ₹389 every year',
                'Priority support badge',
                'Early access to new features'
            ],
            buttonText: 'Get Yearly',
            popular: false,
        }
    ];

    const loadRazorpayScript = () => {
        return new Promise((resolve) => {
            const script = document.createElement('script');
            script.src = 'https://checkout.razorpay.com/v1/checkout.js';
            script.onload = () => resolve(true);
            script.onerror = () => resolve(false);
            document.body.appendChild(script);
        });
    };

    const handleSubscribe = async (plan) => {
        if (plan.id === 'free') return; // Free plan
        if (user?.subscriptionPlan === plan.id) return; // Already on this plan

        setLoading(true);
        try {
            const res = await loadRazorpayScript();
            if (!res) {
                alert('Razorpay SDK failed to load. Are you online?');
                return;
            }

            // 1. Create Order on Backend
            const { data } = await axios.post('http://localhost:5000/api/subscription/create', {
                planType: plan.id
            });

            if (!data.success) {
                alert('Failed to initialize checkout');
                return;
            }

            // 2. Open Razorpay Checkout
            const options = {
                key: 'rzp_test_StxLY0XB3GBxh8', // User's Razorpay Key ID
                amount: data.amount,
                currency: 'INR',
                order_id: data.orderId,
                name: 'FocusHub+',
                description: `${plan.name} Subscription`,
                image: 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png', // Optional logo
                handler: async function (response) {
                    try {
                        // 3. Verify Payment
                        const verifyRes = await axios.post('http://localhost:5000/api/subscription/verify', {
                            ...response,
                            planType: plan.id
                        });

                        if (verifyRes.data.success) {
                            alert('Payment Successful! Welcome to FocusHub+');
                            updateUser({ subscriptionPlan: plan.id });
                            navigate('/dashboard');
                        }
                    } catch (err) {
                        alert('Payment verification failed.');
                        console.error(err);
                    }
                },
                prefill: {
                    name: user.name,
                    email: user.email,
                },
                theme: {
                    color: '#6366f1' // Indigo-500
                }
            };

            const paymentObject = new window.Razorpay(options);
            paymentObject.open();

        } catch (error) {
            console.error(error);
            alert('Something went wrong.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-7xl mx-auto px-4 py-12">
            {/* Header Section */}
            <div className="text-center max-w-3xl mx-auto mb-16">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-sm font-semibold mb-6">
                    <Star size={16} className="fill-current" />
                    Upgrade your Focus
                </div>
                <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-6">
                    Unlock your full academic potential
                </h1>
                <p className="text-lg text-slate-600 dark:text-slate-400 mb-8">
                    Choose the perfect plan to supercharge your study sessions, stay organized, and hit your goals faster.
                </p>

                {user?.subscriptionPlan !== 'free' && user?.subscriptionExpiryDate && (
                    <div className="inline-block bg-green-100 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-lg px-6 py-3">
                        <p className="text-green-800 dark:text-green-300 font-medium">
                            🎉 You are on the <span className="uppercase font-bold">{user.subscriptionPlan}</span> plan!
                        </p>
                        <p className="text-sm text-green-600 dark:text-green-400 mt-1">
                            Your prepaid access expires on: <span className="font-semibold">{new Date(user.subscriptionExpiryDate).toLocaleDateString()}</span>
                        </p>
                    </div>
                )}
            </div>

            {/* Pricing Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                {plans.map((plan) => {
                    const isCurrentPlan = user?.subscriptionPlan === plan.id;
                    return (
                        <div 
                            key={plan.id}
                            className={`relative rounded-3xl p-8 bg-white dark:bg-[#1E293B] flex flex-col ${
                                plan.popular 
                                    ? 'border-2 border-indigo-500 shadow-xl shadow-indigo-500/10 scale-105 z-10' 
                                    : 'border border-slate-200 dark:border-slate-700/50 shadow-md'
                            }`}
                        >
                            {plan.popular && (
                                <div className="absolute -top-4 left-0 right-0 flex justify-center">
                                    <span className="bg-indigo-500 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide flex items-center gap-1">
                                        <Zap size={14} className="fill-current" /> Most Popular
                                    </span>
                                </div>
                            )}

                            <div className="mb-8">
                                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">{plan.name}</h3>
                                <p className="text-sm text-slate-500 dark:text-slate-400 h-10">{plan.description}</p>
                            </div>

                            <div className="mb-8 flex items-baseline gap-1">
                                <span className="text-4xl font-extrabold text-slate-900 dark:text-white">{plan.price}</span>
                                <span className="text-slate-500 dark:text-slate-400">{plan.period}</span>
                            </div>

                            <button
                                onClick={() => handleSubscribe(plan)}
                                disabled={isCurrentPlan || loading}
                                className={`w-full py-3 px-4 rounded-xl font-semibold transition-all mb-8 ${
                                    isCurrentPlan
                                        ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                                        : plan.popular
                                            ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-md hover:shadow-lg'
                                            : 'bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-900/30 dark:hover:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400'
                                }`}
                            >
                                {isCurrentPlan ? 'Current Plan' : plan.buttonText}
                            </button>

                            <div className="space-y-4 flex-1">
                                {plan.features.map((feature, idx) => (
                                    <div key={idx} className="flex items-start gap-3">
                                        <div className="flex-shrink-0 mt-0.5">
                                            <Check size={18} className="text-green-500" />
                                        </div>
                                        <span className="text-sm text-slate-600 dark:text-slate-300">
                                            {feature}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Footer Trust Section */}
            <div className="mt-20 text-center flex flex-col items-center">
                <Shield size={32} className="text-slate-400 mb-4" />
                <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md">
                    Secure payments powered by Razorpay. Cancel or change your subscription anytime directly from your dashboard.
                </p>
            </div>
        </div>
    );
}
