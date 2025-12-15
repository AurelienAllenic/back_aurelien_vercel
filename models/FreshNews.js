import mongoose from "mongoose";

const FreshNewsSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    link: {
      type: String,
      required: true,
      trim: true,
    },
    isInternal: {
      type: Boolean,
      required: true,
      default: false,
    },
    isActive: {type: Boolean,default: true,},
  },
  { timestamps: true }
);

FreshNewsSchema.statics.ensureSingleInstance = async function (data) {
  const existing = await this.findOne();
  if (existing) {
    return this.findOneAndUpdate({}, data, { new: true });
  } else {
    return this.create(data);
  }
};

export default mongoose.model("FreshNews", FreshNewsSchema);
