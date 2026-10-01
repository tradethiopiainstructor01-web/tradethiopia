import axiosInstance from '../services/axiosInstance';

// The sales follow-up list sends this marker instead of each stored document image
// (photos are megabytes each). It is truthy, so "has document" checks keep working,
// and the server ignores it on save, so a list row can never erase a document.
export const STORED_DOCUMENT = '__stored_document__';
export const DOCUMENT_FIELDS = ['passportPhoto', 'nationalIdFrontImage', 'nationalIdBackImage', 'paymentScreenshot'];

export const hasStoredDocumentMarker = (customer) =>
  DOCUMENT_FIELDS.some((field) => customer?.[field] === STORED_DOCUMENT);

// Returns the customer with real document images, fetching that one record only
// when the list row carries markers.
export const withDocuments = async (customer) => {
  const id = customer?._id || customer?.id;
  if (!id || !hasStoredDocumentMarker(customer)) return customer;
  const { data } = await axiosInstance.get(`/sales-customers/${id}`, { timeout: 60000 });
  return {
    ...customer,
    ...Object.fromEntries(DOCUMENT_FIELDS.map((field) => [field, data?.[field] || ''])),
  };
};
