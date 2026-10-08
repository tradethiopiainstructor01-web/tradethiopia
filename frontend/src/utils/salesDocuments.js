import axiosInstance from '../services/axiosInstance';

// The sales follow-up list sends this marker instead of each stored document image
// (photos are megabytes each). It is truthy, so "has document" checks keep working,
// and the server ignores it on save, so a list row can never erase a document.
export const STORED_DOCUMENT = '__stored_document__';
export const DOCUMENT_FIELDS = ['passportPhoto', 'nationalIdFrontImage', 'nationalIdBackImage', 'paymentScreenshot'];

// Generated "receipt" placeholders from old follow-up syncs are not real slips.
const PLACEHOLDER_PREFIX = 'data:image/svg+xml';
export const isUploaded = (value) => typeof value === 'string' && value.trim() !== '' && !value.startsWith(PLACEHOLDER_PREFIX);

// Same rule as the server's document reminder: a payment slip counts when it is a
// real upload on the sale or its student registration (hasPaymentScreenshot from
// the list), or a real image just uploaded in this session.
export const hasBankSlip = (customer) => {
  const slip = customer?.paymentScreenshot;
  if (customer?.hasPaymentScreenshot) return true;
  if (slip === STORED_DOCUMENT) return customer?.hasPaymentScreenshot === undefined;
  return isUploaded(slip);
};

// Completed sales still missing the payment slip. Only the slip is mandatory;
// ID front and back are optional.
export const isMissingDocuments = (customer) =>
  (customer?.followupStatus || '').toString().trim().toLowerCase() === 'completed'
  && !hasBankSlip(customer);

export const hasStoredDocumentMarker = (customer) =>
  DOCUMENT_FIELDS.some((field) => customer?.[field] === STORED_DOCUMENT);

// The sale's payment slip, or its student registration's when the sale has none.
export const loadPaymentSlip = async (customer) => {
  const id = customer?._id || customer?.id;
  if (!id) return '';
  const { data } = await axiosInstance.get(`/sales-customers/${id}/payment-slip`, { timeout: 60000 });
  return isUploaded(data?.src) ? data.src : '';
};

// Returns the customer with real document images, fetching that one record only
// when the list row carries markers or its slip lives on the student registration.
// A placeholder "receipt" comes back as no slip, so the form asks for a real one;
// a slip uploaded on the student registration is shown instead of an empty field.
export const withDocuments = async (customer) => {
  const id = customer?._id || customer?.id;
  const slipElsewhere = Boolean(customer?.hasPaymentScreenshot) && !isUploaded(customer?.paymentScreenshot);
  if (!id || (!hasStoredDocumentMarker(customer) && !slipElsewhere)) return customer;
  const { data } = await axiosInstance.get(`/sales-customers/${id}`, { timeout: 60000 });
  const documents = Object.fromEntries(DOCUMENT_FIELDS.map((field) => [field, data?.[field] || '']));
  if (!isUploaded(documents.paymentScreenshot)) {
    documents.paymentScreenshot = '';
    if (customer?.hasPaymentScreenshot || data?.studentRegistrationId) {
      documents.paymentScreenshot = await loadPaymentSlip(customer).catch(() => '');
    }
  }
  return { ...customer, ...documents };
};
