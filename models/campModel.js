const mongoose = require('mongoose');
const slugify = require('slugify');

const geocoder = require('../utils/geoCoder');

const campSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Bootcamp must have a name'],
      unique: true,
      trim: true,
      maxlength: [50, 'Bootcamp name cannot be more than 50 characters'],
    },
    slug: String,
    description: {
      type: String,
      required: [true, 'Bootcamp must have description'],
      maxlength: [500, 'Bootcamp name cannot be more than 50 characters'],
    },
    website: {
      type: String,
      match: [
        /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/,
        'Please provide a valid url link with HTTP or HTTPS',
      ],
    },
    phone: {
      type: String,
      maxlength: [20, 'Phone number cannot be greater than 20 characters'],
    },
    email: {
      type: String,
      match: [/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/, 'Please provide a valid email'],
    },
    address: {
      type: String,
      required: [true, 'Bootcamp must have address location'],
    },
    location: {
      type: {
        type: String,
        enum: ['Point'],
      },
      coordinates: {
        type: [Number],
        //   index: '2dsphere',
      },
      formattedAddress: String,
      street: String,
      city: String,
      state: String,
      zipCode: String,
      country: String,
    },
    careers: {
      type: [String],
      required: true,
      enum: [
        'Graphics Design',
        'App Development',
        'Web Development',
        'UI/UX',
        'Business',
        'Other',
      ],
    },
    averageRating: {
      type: Number,
      min: [1, 'Rating must be at least 1'],
      max: [10, 'Rating cannot be greater than 10'],
    },
    averageCost: {
      type: Number,
    },
    photo: {
      type: String,
      default: 'default-camp.jpg',
    },
    housing: {
      type: Boolean,
      default: false,
    },
    jobAssistance: {
      type: Boolean,
      default: false,
    },
    jobGuarantee: {
      type: Boolean,
      default: false,
    },
    acceptGi: {
      type: Boolean,
      default: false,
    },
    createdAt: {
      type: Date,
      default: Date.now(),
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

campSchema.index({ location: '2dsphere' });

// create slug from name
campSchema.pre('save', function (next) {
  this.slug = slugify(this.name, { lower: true });
  next();
});

// Geo Code : create location field
campSchema.pre('save', async function (next) {
  const loc = await geocoder.geocode(this.address);
  this.location = {
    type: 'Point',
    coordinates: [loc[0].longitude, loc[0].latitude],
    formattedAddress: loc[0].formattedAddress,
    street: loc[0].streetName,
    city: loc[0].city,
    state: loc[0].stateCode,
    zipCode: loc[0].zipcode,
    country: loc[0].country,
  };
  // not save address in databaseP
  this.address = undefined;
  next();
});
// delete course when a bootcamp associatd to it gets deleted
campSchema.pre('remove', async function (next) {
  await this.model('Course').deleteMany({ bootcamp: this._id });
  next();
});

// reverse populate with virtuals
campSchema.virtual('courses', {
  ref: 'Course',
  localField: '_id',
  foreignField: 'bootcamp',
  justOne: false,
});

const Camp = mongoose.model('Bootcamp', campSchema);

module.exports = Camp;
