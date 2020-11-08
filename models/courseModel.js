const mongoose = require('mongoose');
const slugify = require('slugify');
const Camp = require('./campModel');

const courseSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Course must have a title'],
    trim: true,
  },
  slug: String,
  description: {
    type: String,
    required: [true, 'Course must have description'],
  },
  weeks: {
    type: String,
    required: [true, 'Please add duration for the course in weeks'],
  },

  tuition: {
    type: Number,
    required: [true, 'Course must have tution fee'],
  },
  minimumSkill: {
    type: String,
    required: [true, 'Please add a minimum skill level for the course'],
    enum: ['beginner', 'intermediate', 'advanced'],
  },
  scholarshipsAvailable: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now(),
  },
  bootcamp: {
    type: mongoose.Schema.ObjectId,
    ref: 'Bootcamp',
    required: true,
  },
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true,
  },
});

// static method on model to get avg of course tution fee
courseSchema.statics.calcAverageCost = async function (bcampId) {
  const stats = await this.aggregate([
    {
      $match: { bootcamp: bcampId },
    },
    {
      $group: {
        _id: '$bootcamp', // gouping by tour
        averageCost: { $avg: '$tuition' },
      },
    },
  ]);

  try {
    if (stats.length > 0) {
      await this.model('Bootcamp').findByIdAndUpdate(bcampId, {
        averageCost: stats[0].averageCost,
      });
    } else {
      await this.model('Bootcamp').findByIdAndUpdate(bcampId, {
        averageCost: 1000,
      });
    }
  } catch (err) {
    console.error(err);
  }
};

// calc AverageCost after save
courseSchema.post('save', function (next) {
  this.constructor.calcAverageCost(this.bootcamp);
});
// calc AverageCost before remove

courseSchema.pre('remove', function (next) {
  this.constructor.calcAverageCost(this.bootcamp);
});

const Course = mongoose.model('Course', courseSchema);

module.exports = Course;
