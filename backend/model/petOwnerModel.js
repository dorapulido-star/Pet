import mongoose from "mongoose";

const PetOwnerSchema = new mongoose.Schema({
  ownerName: {
    type: String,
    required: true,
    maxlength: 100
  },
  ownerPhone: {
    type: Number,
    required: true
  },
  ownerAddress: {
    type: String,
    required: true,
    maxlength: 50
  },
  ownerEmail: {
    type: String,
    required: true,
    maxlength: 50
  },
  ownerPhoto: {
    type: String,
    required: true
  }
}, {
  timestamps: true
});

export default mongoose.model('PetOwner', PetOwnerSchema);