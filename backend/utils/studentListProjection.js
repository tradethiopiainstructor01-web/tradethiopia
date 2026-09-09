const documentFields = [
  'nationalIdImage', 'nationalIdFrontImage', 'nationalIdBackImage',
  'passportPhoto', 'paymentScreenshot', 'cocPaymentScreenshot', 'educationFile',
];
const hasImage = (field) => ({ $ne: [{ $ifNull: [`$${field}`, ''] }, ''] });

// Keep attachment indicators while excluding large image data from list results.
const studentListProjection = [
  { $addFields: {
    hasNationalIdImage: { $or: [hasImage('nationalIdFrontImage'), hasImage('nationalIdImage')] },
    hasNationalIdFrontImage: { $or: [hasImage('nationalIdFrontImage'), hasImage('nationalIdImage')] },
    hasNationalIdBackImage: hasImage('nationalIdBackImage'),
    hasPassportPhoto: hasImage('passportPhoto'),
    hasEducationFile: hasImage('educationFile'),
    hasPaymentScreenshot: hasImage('paymentScreenshot'),
    hasCocPaymentScreenshot: hasImage('cocPaymentScreenshot'),
  } },
  { $project: Object.fromEntries(documentFields.map((field) => [field, 0])) },
];

module.exports = { studentListProjection };
