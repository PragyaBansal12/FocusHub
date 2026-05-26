import Razorpay from 'razorpay';
import dotenv from 'dotenv';
dotenv.config();

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

async function createPlans() {
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    console.error("❌ Error: Razorpay keys are missing in .env file!");
    return;
  }

  try {
    console.log("Creating Pro Plan (₹99/month)...");
    const proPlan = await razorpay.plans.create({
      period: "monthly",
      interval: 1,
      item: {
        name: "FocusHub Pro",
        amount: 9900, // Amount in paise (₹99.00)
        currency: "INR",
        description: "Monthly subscription for FocusHub Pro"
      }
    });
    console.log(`✅ Pro Plan Created! Plan ID: ${proPlan.id}`);

    console.log("\nCreating Yearly Plan (₹799/year)...");
    const yearlyPlan = await razorpay.plans.create({
      period: "yearly",
      interval: 1,
      item: {
        name: "FocusHub Yearly",
        amount: 79900, // Amount in paise (₹799.00)
        currency: "INR",
        description: "Yearly subscription for FocusHub"
      }
    });
    console.log(`✅ Yearly Plan Created! Plan ID: ${yearlyPlan.id}`);

    console.log("\nCopy these Plan IDs into your frontend Subscription.jsx file!");
  } catch (error) {
    console.error("❌ Failed to create plans:", error);
  }
}

createPlans();
