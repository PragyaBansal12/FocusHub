import mongoose from 'mongoose';

const taskSchema = new mongoose.Schema(
{
    user:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User",
        required:true,
        index:true
    },
    title:{
        type:String,
        required:true,
        trim:true,
        maxlength:200
    },
    description:{
        type:String,
        trim:true,
        maxlength:1000
    },
    dueDate:{
        type:Date,
        default:null,
    },
    completed:{
        type:Boolean,
        default:false,
    },
    priority:{
        type:String,
        enum:["low","medium","high"],
        default:"medium",
    },
    tags:[{
        type:String,
        trim:true,
    }],
    timeSpent:{
        type:Number,
        default:0,
    },
    pomodoroSessions:{
        type:Number,
        default:0,
    },

    googleEventId:{
        type:String,
        default:null,
    },
    sendOverdueAlert:{
        type:Boolean,
        default: false,
    }
},
{
    timestamps:true
}
);

export default mongoose.model("Task",taskSchema);