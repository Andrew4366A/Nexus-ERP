import mongoose from "mongoose";

const salaryDefinitionSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    level: { type: String, required: true, trim: true },
    basic: { type: Number, required: true, min: 0 },
    allowance: { type: Number, default: 0, min: 0 },
    deductions: { type: Number, default: 0, min: 0 },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

salaryDefinitionSchema.virtual("gross").get(function gross() {
  return this.basic + this.allowance;
});

salaryDefinitionSchema.virtual("net").get(function net() {
  return this.basic + this.allowance - this.deductions;
});

export const SalaryDefinition = mongoose.model("SalaryDefinition", salaryDefinitionSchema);
