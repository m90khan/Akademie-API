const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      trim: true,
      required: [true, 'Review title cannot be empty'],
      maxlength: [100, 'Review title cannot be greater than 100 characters'],
    },
    text: {
      type: String,
      required: [true, 'Review text cannot be empty'],
    },
    rating: {
      type: Number,
      default: 7,
      min: [1, 'Rating must be greater than 0'],
      max: [10, 'Rating must be less than or equal to 5'],
    },
    createdAt: {
      type: Date,
      default: Date.now(),
    },
    bootcamp: {
      // parent referencing tour
      type: mongoose.Schema.ObjectId,
      ref: 'Bootcamp',
      required: [true, 'Review must belong to a bootcamp'],
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'Review must belong to a user'],
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);
// Avoid Duplication for reviews  : one user one review
reviewSchema.index({ bootcamp: 1, user: 1 }, { unique: true });

// static method on model to get avg rating of reviews
reviewSchema.statics.getAverageRating = async function (bcampId) {
  const stats = await this.aggregate([
    {
      $match: { bootcamp: bcampId },
    },
    {
      $group: {
        _id: '$bootcamp', // gouping by tour
        averageRating: { $avg: '$rating' },
        ratingsQuantity: { $sum: 1 },
      },
    },
  ]);

  try {
    if (stats.length > 0) {
      await this.model('Bootcamp').findByIdAndUpdate(bcampId, {
        averageRating: stats[0].averageRating,
        ratingsQuantity: stats[0].ratingsQuantity,
      });
    } else {
      await this.model('Bootcamp').findByIdAndUpdate(bcampId, {
        averageRating: 7,
        ratingsQuantity: 0,
      });
    }
  } catch (err) {
    console.error(err);
  }
};

// calc AverageCost after save
reviewSchema.post('save', function (next) {
  this.constructor.getAverageRating(this.bootcamp);
});
// calc AverageCost before remove

reviewSchema.pre('remove', function (next) {
  this.constructor.getAverageRating(this.bootcamp);
});
const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;
