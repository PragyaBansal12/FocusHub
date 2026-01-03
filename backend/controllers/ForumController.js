import Post from "../models/Post.js";
import Comment from "../models/Comment.js";

// Helper to generate a letter avatar based on name
const DEFAULT_AVATAR = (name) => `https://ui-avatars.com/api/?name=${encodeURIComponent(name || "User")}&background=random&color=fff`;

// Helper to ensure all users in a list have a valid profilePicture
const processUserIcons = (items) => {
  return items.map(item => {
    if (item.user) {
      // Ensure we use profilePicture and fallback to Name Initial if empty
      item.user.profilePicture = item.user.profilePicture || DEFAULT_AVATAR(item.user.name);
    }
    return item;
  });
};

// ============================================
// 1. MAIN FORUM LOGIC (Community Chat)
// ============================================
export async function getPosts(req, res) {
  try {
    let mainPost = await Post.findOne({ title: "Community Discussion" });

    if (!mainPost) {
      mainPost = await Post.create({
        title: "Community Discussion",
        content: "Official public chatroom for all students.",
        user: req.userId || "64f000000000000000000001", 
        isPinned: true
      });
    }

    // 🔥 FIX: Populating 'profilePicture' (matching your Schema)
    const comments = await Comment.find({ post: mainPost._id, parentComment: null })
      .sort({ createdAt: 1 })
      .populate('user', 'name email profilePicture')
      .lean();

    // 🔥 FIX: Process comments to inject default avatars if missing
    const commentsWithPhotos = processUserIcons(comments).map(c => ({
      ...c,
      voteScore: (c.upvotes?.length || 0) - (c.downvotes?.length || 0),
      upvoteCount: c.upvotes?.length || 0,
      downvoteCount: c.downvotes?.length || 0
    }));

    res.json({ post: mainPost, comments: commentsWithPhotos });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching forum', error: err.message });
  }
}

export async function getPost(req, res) {
  try {
    const { id } = req.params;
    
    // 🔥 FIX: Populating 'profilePicture'
    const post = await Post.findById(id).populate('user', 'name profilePicture');
    
    const comments = await Comment.find({ post: id, parentComment: null })
      .sort({ createdAt: 1 })
      .populate('user', 'name email profilePicture')
      .lean();

    // Handle post author photo
    const postData = post.toObject();
    if (postData.user) {
      postData.user.profilePicture = postData.user.profilePicture || DEFAULT_AVATAR(postData.user.name);
    }

    res.json({ post: postData, comments: processUserIcons(comments) });
  } catch (err) {
    res.status(500).json({ message: 'Error', error: err.message });
  }
}

// ============================================
// 2. USER & TAG EXPORTS
// ============================================

export async function getUserPosts(req, res) {
  try {
    const posts = await Post.find({ user: req.userId }).sort({ createdAt: -1 });
    res.json(posts);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching user posts', error: err.message });
  }
}

export async function getTrendingTags(req, res) {
  try {
    res.json({ tags: ["General", "Help", "Projects", "Resources"] });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching tags', error: err.message });
  }
}

export async function getCommentReplies(req, res) {
  try {
    const { commentId } = req.params;
    
    // 🔥 FIX: Populating 'profilePicture'
    const replies = await Comment.find({ parentComment: commentId })
      .populate('user', 'name email profilePicture')
      .lean();

    res.json({ replies: processUserIcons(replies) });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching replies', error: err.message });
  }
}

export async function updatePost(req, res) {
  try {
    const { id } = req.params;
    const updatedPost = await Post.findByIdAndUpdate(id, req.body, { new: true });
    res.json(updatedPost);
  } catch (err) {
    res.status(500).json({ message: 'Error updating', error: err.message });
  }
}