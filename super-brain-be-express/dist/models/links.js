import mongoose, { Schema } from "mongoose";
const linksSchema = new Schema({
    hash: {
        type: String,
        required: true,
    },
    userId: {
        type: mongoose.Types.ObjectId,
        ref: "User",
        required: true,
        unique: true
    }
});
const Links = mongoose.model("Links", linksSchema);
export default Links;
//# sourceMappingURL=links.js.map