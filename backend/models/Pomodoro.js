import mongoose from "mongoose";

const pomodoroSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    task: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Task",
      default: null // Optional: session might not be linked to a task
    },
    duration: {
      type: Number, // Duration in seconds
      required: true
    },
    type: {
      type: String,
      enum: ["focus", "break"],
      required: true
    },
    completedAt: {
      type: Date,
      default: Date.now
    }
  },
  { timestamps: true }
);

export default mongoose.model("Pomodoro", pomodoroSchema);