import { useState } from 'react';
import { Button, FormControl, FormLabel, Image, Input, Modal, ModalBody, ModalCloseButton, ModalContent, ModalFooter, ModalHeader, ModalOverlay, Select, Text, VStack, useToast } from '@chakra-ui/react';
import { FiEdit } from 'react-icons/fi';
import { getStudentRegistrationById, updateStudentCocPayment } from '../../services/studentRegistrationService';
import ETHIOPIAN_BANKS from '../../utils/ethiopianBanks';

export default function TessbinCocPaymentEditor({ student, onSaved }) {
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [reading, setReading] = useState(false);
  const toast = useToast();
  const showError = (error) => toast({ title: 'COC payment update failed', description: error.response?.data?.message || error.message, status: 'error', duration: 4000, isClosable: true });
  const open = async () => {
    setLoading(true);
    try {
      const detail = await getStudentRegistrationById(student._id || student.id);
      setForm({ cocPaymentStatus: detail.cocPaymentStatus || 'Unpaid', cocPaymentBank: detail.cocPaymentBank || '', cocPaymentScreenshot: detail.cocPaymentScreenshot || '' });
    } catch (error) { showError(error); }
    finally { setLoading(false); }
  };
  const upload = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || !file.size || file.size > 5 * 1024 * 1024) {
      showError(new Error('Choose a JPEG, PNG or WEBP receipt up to 5 MB.'));
      return;
    }
    setReading(true);
    try {
      const data = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(new Error('Could not read the receipt. Please try again.'));
        reader.readAsDataURL(file);
      });
      setForm((previous) => ({ ...previous, cocPaymentScreenshot: data }));
    } catch (error) { showError(error); }
    finally { setReading(false); }
  };
  const close = () => { if (!saving && !reading) setForm(null); };
  const save = async () => {
    setSaving(true);
    try {
      const updated = await updateStudentCocPayment(student._id || student.id, form);
      onSaved(updated);
      setForm(null);
      toast({ title: 'COC payment saved', status: 'success', duration: 3000, isClosable: true });
    } catch (error) { showError(error); }
    finally { setSaving(false); }
  };
  return (
    <>
      <Button size="sm" colorScheme="teal" leftIcon={<FiEdit />} isLoading={loading} onClick={open} mb={4}>Add / Edit COC payment</Button>
      <Modal isOpen={Boolean(form)} onClose={close} size="lg" scrollBehavior="inside" closeOnOverlayClick={!saving && !reading}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>COC payment — {student.fullName}</ModalHeader>
          <ModalCloseButton isDisabled={saving || reading} />
          <ModalBody>
            {form && <VStack spacing={4} align="stretch">
              <FormControl><FormLabel>COC payment status</FormLabel><Select value={form.cocPaymentStatus} isDisabled={saving} onChange={(event) => setForm({ ...form, cocPaymentStatus: event.target.value })}><option value="Unpaid">Unpaid</option><option value="Paid">Paid</option></Select></FormControl>
              <FormControl><FormLabel>COC payment bank</FormLabel><Select value={form.cocPaymentBank} isDisabled={saving} onChange={(event) => setForm({ ...form, cocPaymentBank: event.target.value })}><option value="">Select bank</option>{ETHIOPIAN_BANKS.map((bank) => <option key={bank} value={bank}>{bank}</option>)}{form.cocPaymentBank && !ETHIOPIAN_BANKS.includes(form.cocPaymentBank) && <option value={form.cocPaymentBank}>{form.cocPaymentBank}</option>}</Select></FormControl>
              <FormControl><FormLabel>COC payment receipt</FormLabel><Input type="file" accept="image/jpeg,image/png,image/webp" onChange={upload} isDisabled={saving || reading} p={1} /><Text fontSize="xs" mt={1}>One JPEG, PNG or WEBP image, up to 5 MB.</Text></FormControl>
              {reading && <Text>Reading receipt...</Text>}
              {form.cocPaymentScreenshot && <><Image src={form.cocPaymentScreenshot} alt="COC payment receipt" maxH="240px" objectFit="contain" /><Button variant="outline" colorScheme="red" size="sm" isDisabled={saving || reading} onClick={() => setForm({ ...form, cocPaymentScreenshot: '' })}>Remove receipt</Button></>}
            </VStack>}
          </ModalBody>
          <ModalFooter gap={3}><Button onClick={close} isDisabled={saving || reading}>Cancel</Button><Button colorScheme="teal" onClick={save} isLoading={saving} isDisabled={reading}>Save COC payment</Button></ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}
