import User from "../models/User.js";

export const subscribeToNotifications = async (req, res) => {
    try {
        const { subscription } = req.body;
        const userId = req.user.id; // from authMiddleware

        if (!subscription) {
            return res.status(400).json({ message: "Subscription object is required" });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Check if subscription already exists to avoid duplicates
        const exists = user.pushSubscriptions.some(
            sub => sub.endpoint === subscription.endpoint
        );

        if (!exists) {
            user.pushSubscriptions.push(subscription);
            await user.save();
        }

        res.status(200).json({ message: "Subscribed successfully" });
    } catch (error) {
        console.error("Error subscribing to notifications:", error);
        res.status(500).json({ message: "Server error" });
    }
};

export const unsubscribeFromNotifications = async (req, res) => {
    try {
        const { endpoint } = req.body;
        const userId = req.user.id;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        user.pushSubscriptions = user.pushSubscriptions.filter(
            sub => sub.endpoint !== endpoint
        );
        await user.save();

        res.status(200).json({ message: "Unsubscribed successfully" });
    } catch (error) {
        console.error("Error unsubscribing from notifications:", error);
        res.status(500).json({ message: "Server error" });
    }
};
