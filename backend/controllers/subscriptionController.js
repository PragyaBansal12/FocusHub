import Razorpay from 'razorpay';
import crypto from 'crypto';
import User from '../models/User.js';

const getRazorpayInstance = () => {
    return new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID || 'dummy_key',
        key_secret: process.env.RAZORPAY_KEY_SECRET || 'dummy_secret',
    });
};

export const createSubscription = async (req, res) => {
    try {
        const { planType } = req.body; // 'pro' or 'yearly'
        
        // Define amounts based on plan type (in paise)
        let amount = 0;
        if (planType === 'pro') amount = 9900; // ₹99
        else if (planType === 'yearly') amount = 79900; // ₹799
        else return res.status(400).json({ success: false, message: 'Invalid plan type' });

        const razorpay = getRazorpayInstance();
        
        // Create an Order instead of a Subscription
        const order = await razorpay.orders.create({
            amount: amount,
            currency: 'INR',
            receipt: `rcpt_${req.user.id.substring(18)}_${Date.now()}` // Max 40 chars
        });

        res.status(200).json({
            success: true,
            orderId: order.id,
            amount: order.amount,
        });
    } catch (error) {
        console.error('Error creating order:', error);
        res.status(500).json({ success: false, message: 'Failed to create order', error: error.message });
    }
};

export const verifySubscription = async (req, res) => {
    try {
        const { razorpay_payment_id, razorpay_order_id, razorpay_signature, planType } = req.body;

        const secret = process.env.RAZORPAY_KEY_SECRET;

        const generated_signature = crypto
            .createHmac('sha256', secret)
            .update(razorpay_order_id + '|' + razorpay_payment_id)
            .digest('hex');

        if (generated_signature === razorpay_signature) {
            // Signature is valid, update user
            const user = await User.findById(req.user.id);
            if (!user) return res.status(404).json({ success: false, message: 'User not found' });

            user.subscriptionPlan = planType; // 'pro' or 'yearly'
            user.razorpaySubscriptionId = razorpay_order_id;
            user.subscriptionStatus = 'active';

            // Calculate expiration date
            const now = new Date();
            if (planType === 'pro') {
                user.subscriptionExpiryDate = new Date(now.setDate(now.getDate() + 30));
            } else if (planType === 'yearly') {
                user.subscriptionExpiryDate = new Date(now.setFullYear(now.getFullYear() + 1));
            }

            await user.save();

            res.status(200).json({ success: true, message: 'Payment verified successfully' });
        } else {
            res.status(400).json({ success: false, message: 'Invalid payment signature' });
        }
    } catch (error) {
        console.error('Error verifying subscription:', error);
        res.status(500).json({ success: false, message: 'Failed to verify subscription', error: error.message });
    }
};
