import mongoose, { Schema, Types } from "mongoose";
const tagsSchema = new Schema({
    name: {
        type: String,
        required: true,
    },
    tagId: {
        type: String,
        unique: true,
        sparse: true,
        default: () => {
            return Types.ObjectId.toString();
        }
    }
}, { timestamps: true });
const Tags = mongoose.model("Tags", tagsSchema);
export default Tags;
//# sourceMappingURL=tags.js.map