import CommunityMessage from "../models/CommunityMessage.js";

// Helper to generate a letter avatar based on name
const DEFAULT_AVATAR = (name) => `https://ui-avatars.com/api/?name=${encodeURIComponent(name || "User")}&background=random&color=fff`;

// Helper to ensure all users in a list have a valid profilePicture
const processUserIcons = (items) => {
  return items.map(item => {
    if (item.sender) {
      item.sender.profilePicture = item.sender.profilePicture || DEFAULT_AVATAR(item.sender.name);
    }
    return item;
  });
};

export async function getCommunityMessages(req, res) {
  try {
    // Fetch last 100 messages for the community chat
    const messages = await CommunityMessage.find()
      .sort({ createdAt: -1 })
      .limit(100)
      .populate('sender', 'name email profilePicture')
      .lean();

    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.json({ messages: processUserIcons(messages).reverse() });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching community messages', error: err.message });
  }
}
