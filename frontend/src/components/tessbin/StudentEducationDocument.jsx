import { useEffect, useState } from 'react';
import { Box, Button, HStack, Modal, ModalOverlay, ModalContent, ModalHeader, ModalCloseButton, ModalBody, ModalFooter, Spinner, Text, useToast } from '@chakra-ui/react';
import { FiDownload, FiEye } from 'react-icons/fi';
import { getStudentRegistrationById } from '../../services/studentRegistrationService';

function StudentDocumentPreview({ student, onClose }) {
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => {
    let active = true;
    let objectUrl;
    const loadPreview = async () => {
      try {
        const detail = await getStudentRegistrationById(student._id || student.id);
        if (!active) return;
        if (!detail.educationFile) throw new Error('This document has been removed. Refresh the list.');
        const [header, encoded] = detail.educationFile.split(',');
        const bytes = Uint8Array.from(atob(encoded), (char) => char.charCodeAt(0));
        const type = header.slice(5).split(';')[0];
        objectUrl = URL.createObjectURL(new Blob([bytes], { type }));
        const document = { url: objectUrl, name: detail.educationFileName || 'Education file', type };
        setPreview(document);
        if (type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
          const { default: mammoth } = await import('mammoth/mammoth.browser');
          if (!active) return;
          const result = await mammoth.extractRawText({ arrayBuffer: bytes.buffer });
          if (active) setPreview({ ...document, text: result.value });
        }
      } catch (err) {
        if (active) setError(err.response?.data?.message || err.message || 'Unable to preview this document.');
      }
    };
    loadPreview();
    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [student]);
  return (
    <Modal isOpen onClose={onClose} size="6xl" scrollBehavior="inside">
      <ModalOverlay />
      <ModalContent mx={{ base: 2, md: 6 }}>
        <ModalHeader pr={12}>
          <Text>Education files — {student.fullName}</Text>
          <Text fontSize="sm" fontWeight="normal" wordBreak="break-word">{preview?.name || student.educationFileName}</Text>
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody minH="200px">
          {error ? <Text role="alert" color="red.500">{error}</Text> : !preview ? (
            <HStack py={8}><Spinner /><Text>Loading document...</Text></HStack>
          ) : preview.type === 'application/pdf' ? (
            <>
              <Box as="iframe" src={preview.url} title={`Education file for ${student.fullName}`} width="100%" height="70vh" border="0" />
              <Text fontSize="sm" mt={2}>If the preview does not display, use Download to open the file.</Text>
            </>
          ) : preview.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ? (
            preview.text === undefined ? <HStack py={8}><Spinner /><Text>Preparing Word preview...</Text></HStack> : (
              <>
                <Text fontSize="sm" mb={4}>Text preview. Download the original to see images and formatting.</Text>
                <Box bg="white" color="gray.900" p={{ base: 4, md: 8 }} borderWidth="1px" borderRadius="md">
                  <Text whiteSpace="pre-wrap" overflowWrap="anywhere">{preview.text.trim() || 'This document contains no text to preview. Download it to view its contents.'}</Text>
                </Box>
              </>
            )
          ) : <Text py={8}>Preview is unavailable for older Word (.doc) files. Download this file to view it in Word, or upload a PDF or .docx version.</Text>}
        </ModalBody>
        <ModalFooter gap={3}>
          {preview && <Button as="a" href={preview.url} download={preview.name} colorScheme="blue" leftIcon={<FiDownload />}>Download</Button>}
          <Button onClick={onClose}>Close</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}


export default function StudentEducationDocument({ student, showLabel = false }) {
  const [previewOpen, setPreviewOpen] = useState(false);
  const [downloading, setDownloading] = useState(null);
  const toast = useToast();
  const download = async (student) => {
    const id = student._id || student.id;
    setDownloading(id);
    try {
      const detail = await getStudentRegistrationById(id);
      if (!detail.educationFile) throw new Error('This document has been removed. Refresh the list.');
      const [header, encoded] = detail.educationFile.split(',');
      const bytes = Uint8Array.from(atob(encoded), (char) => char.charCodeAt(0));
      const url = URL.createObjectURL(new Blob([bytes], { type: header.slice(5).split(';')[0] }));
      const link = document.createElement('a');
      link.href = url;
      link.download = detail.educationFileName || 'education-file';
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (err) {
      toast({ title: 'Download failed', description: err.response?.data?.message || err.message, status: 'error', duration: 4000, isClosable: true });
    } finally {
      setDownloading(null);
    }
  };
  const hasFile = Boolean(student.educationFile || student.hasEducationFile);
  return (
    <Box>
      {showLabel && <Text fontWeight="bold" mb={2}>Education files</Text>}
      {hasFile ? <>
        {showLabel && <Text fontSize="sm" mb={2} wordBreak="break-word">{student.educationFileName || 'Education file'}</Text>}
        <HStack>
          <Button size="sm" colorScheme="teal" leftIcon={<FiEye />} onClick={() => setPreviewOpen(true)}>View</Button>
          <Button size="sm" colorScheme="blue" leftIcon={<FiDownload />} isLoading={Boolean(downloading)} onClick={() => download(student)}>Download</Button>
        </HStack>
      </> : <Text fontSize="sm">No education file uploaded.</Text>}
      {previewOpen && <StudentDocumentPreview student={student} onClose={() => setPreviewOpen(false)} />}
    </Box>
  );
}
