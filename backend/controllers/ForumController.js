import Post from "../models/Post.js";
import Comment from "../models/Comment.js";

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

    const comments = await Comment.find({ post: mainPost._id, parentComment: null })
      .sort({ createdAt: 1 })
      .populate('user', 'name email picture')
      .lean();

    const commentsWithScores = comments.map(c => ({
      ...c,
      voteScore: (c.upvotes?.length || 0) - (c.downvotes?.length || 0),
      upvoteCount: c.upvotes?.length || 0,
      downvoteCount: c.downvotes?.length || 0
    }));

    res.json({ post: mainPost, comments: commentsWithScores });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching forum', error: err.message });
  }
}

// Router expects "getPost"
export async function getPost(req, res) {
  try {
    const { id } = req.params; // Using 'id' to match your router params
    const post = await Post.findById(id).populate('user', 'name picture');
    const comments = await Comment.find({ post: id, parentComment: null })
      .sort({ createdAt: 1 })
      .populate('user', 'name email picture')
      .lean();
    res.json({ post, comments });
  } catch (err) {
    res.status(500).json({ message: 'Error', error: err.message });
  }
}

// ============================================
// 2. USER & TAG EXPORTS (Matches your forumRoutes.js)
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
    const replies = await Comment.find({ parentComment: commentId })
      .populate('user', 'name email picture')
      .lean();
    res.json({ replies });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching replies', error: err.message });
  }
}

// 🔥 FIXED: This name MUST exist because forumRoutes.js imports it
export async function updatePost(req, res) {
  try {
    const { id } = req.params;
    const updatedPost = await Post.findByIdAndUpdate(id, req.body, { new: true });
    res.json(updatedPost);
  } catch (err) {
    res.status(500).json({ message: 'Error updating', error: err.message });
  }
}