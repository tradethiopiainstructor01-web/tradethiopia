import React, { useEffect, useState } from 'react';
import {
  Box,
  Heading,
  Button,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Input,
  InputGroup,
  InputLeftElement,
  Text,
  NumberInput,
  NumberInputField,
  IconButton,
  Flex,
  useToast,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  FormControl,
  FormLabel,
  Textarea,
  Stack,
  Badge,
  useDisclosure,
  Spinner,
  HStack,
  useColorModeValue,
  useBreakpointValue,
} from '@chakra-ui/react';
import { AddIcon, DeleteIcon, EditIcon } from '@chakra-ui/icons';
import { getAllInventory, createInventoryItem, updateInventoryItem, deleteInventoryItem, deliverStock, addBufferStock, transferBufferToStock, getMovements } from '../../services/inventoryService';
import FinanceLayout from './FinanceLayout';

import { FiSearch, FiDownload, FiMinus, FiPlus, FiRepeat, FiClock } from 'react-icons/fi';
const InventoryPage = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();
  const isSmall = useBreakpointValue({ base: true, md: false });
  // movement history per item, stored in localStorage for persistence
  const [movements, setMovements] = useState(() => {
    try {
      const raw = localStorage.getItem('inventoryMovements');
      return raw ? JSON.parse(raw) : {};
    } catch (e) {
      return {};
    }
  });

  // modals for operations
  const { isOpen: isDeliverOpen, onOpen: onOpenDeliver, onClose: onCloseDeliver } = useDisclosure();
  const { isOpen: isAddBufferOpen, onOpen: onOpenAddBuffer, onClose: onCloseAddBuffer } = useDisclosure();
  const { isOpen: isTransferOpen, onOpen: onOpenTransfer, onClose: onCloseTransfer } = useDisclosure();
  const { isOpen: isHistoryOpen, onOpen: onOpenHistory, onClose: onCloseHistory } = useDisclosure();
  const [opAmount, setOpAmount] = useState(0);
  const [opItem, setOpItem] = useState(null);
  const [historyItemId, setHistoryItemId] = useState(null);
  const [serverMovements, setServerMovements] = useState(null);
  const [serverHistoryLoading, setServerHistoryLoading] = useState(false);

  useEffect(() => {
    try { localStorage.setItem('inventoryMovements', JSON.stringify(movements)); } catch (e) { }
  }, [movements]);

  const addMovement = (itemId, type, amount, before, after) => {
    const entry = { type, amount, before, after, ts: new Date().toISOString() };
    setMovements(prev => {
      const copy = { ...prev };
      copy[itemId] = copy[itemId] || [];
      copy[itemId].unshift(entry);
      return copy;
    });
  };

  const fetchItems = async () => {
    try {
      setLoading(true);
      const data = await getAllInventory();
      setItems(data);
    } catch (err) {
      console.error('Error fetching inventory', err);
      toast({ title: 'Failed to load inventory', status: 'error', duration: 3000 });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const openNew = () => {
    setSelected({ name: '', sku: '', description: '', price: 0, quantity: 0 });
    onOpen();
  };

  const exportCsv = () => {
    if (!items || items.length === 0) {
      toast({ title: 'No items to export', status: 'info', duration: 2000 });
      return;
    }
    const headers = ['Name','SKU','Price','Quantity','Buffer','Description'];
    const rows = items.map(i => [i.name, i.sku, i.price ?? 0, i.quantity ?? 0, i.bufferStock ?? 0, (i.description||'')]);
    const csv = [headers, ...rows].map(r => r.map(cell => `"${String(cell).replace(/"/g,'""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `inventory-${new Date().toISOString().slice(0,10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const openEdit = (item) => {
    setSelected(item);
    onOpen();
  };

  const saveItem = async () => {
    try {
      if (!selected) return;
      if (selected._id) {
        const updated = await updateInventoryItem(selected._id, selected);
        setItems(prev => prev.map(i => i._id === updated._id ? updated : i));
        toast({ title: 'Updated', status: 'success', duration: 2000 });
      } else {
        const created = await createInventoryItem(selected);
        setItems(prev => [created, ...prev]);
        toast({ title: 'Created', status: 'success', duration: 2000 });
      }
      onClose();
    } catch (err) {
      console.error(err);
      toast({ title: 'Save failed', status: 'error', duration: 3000 });
    }
  };

  const handleDeliver = (item) => {
    setOpItem(item); setOpAmount(1); onOpenDeliver();
  };

  const confirmDeliver = async () => {
    if (!opItem) return;
    const amount = Number(opAmount);
    if (!amount || amount <= 0) { toast({ title: 'Invalid amount', status: 'warning' }); return; }
    try {
      const before = { qty: opItem.quantity };
      const updated = await deliverStock(opItem._id, amount);
      setItems(prev => prev.map(i => i._id === updated._id ? updated : i));
      addMovement(opItem._id, 'deliver', amount, before, { qty: updated.quantity });
      toast({ title: `Delivered ${amount}`, status: 'success' });
      onCloseDeliver();
    } catch (err) {
      console.error(err);
      toast({ title: err?.response?.data?.message || 'Delivery failed', status: 'error' });
    }
  };

  const handleAddBuffer = (item) => { setOpItem(item); setOpAmount(0); onOpenAddBuffer(); };

  const confirmAddBuffer = async () => {
    if (!opItem) return;
    const amount = Number(opAmount);
    if (!amount || amount <= 0) { toast({ title: 'Invalid amount', status: 'warning' }); return; }
    try {
      const before = { buffer: opItem.bufferStock ?? 0 };
      const updated = await addBufferStock(opItem._id, amount);
      setItems(prev => prev.map(i => i._id === updated._id ? updated : i));
      addMovement(opItem._id, 'add-buffer', amount, before, { buffer: updated.bufferStock });
      toast({ title: `Buffer +${amount}`, status: 'success' });
      onCloseAddBuffer();
    } catch (err) {
      console.error(err);
      toast({ title: err?.response?.data?.message || 'Add buffer failed', status: 'error' });
    }
  };

  const handleTransfer = (item) => { setOpItem(item); setOpAmount(0); onOpenTransfer(); };

  const confirmTransfer = async () => {
    if (!opItem) return;
    const amount = Number(opAmount);
    if (!amount || amount <= 0) { toast({ title: 'Invalid amount', status: 'warning' }); return; }
    try {
      const before = { buffer: opItem.bufferStock ?? 0, qty: opItem.quantity ?? 0 };
      const updated = await transferBufferToStock(opItem._id, amount);
      setItems(prev => prev.map(i => i._id === updated._id ? updated : i));
      addMovement(opItem._id, 'transfer', amount, before, { buffer: updated.bufferStock, qty: updated.quantity });
      toast({ title: `Transferred ${amount}`, status: 'success' });
      onCloseTransfer();
    } catch (err) {
      console.error(err);
      toast({ title: err?.response?.data?.message || 'Transfer failed', status: 'error' });
    }
  };

  const removeItem = async (id) => {
    try {
      await deleteInventoryItem(id);
      setItems(prev => prev.filter(i => i._id !== id));
      toast({ title: 'Removed', status: 'info', duration: 2000 });
    } catch (err) {
      console.error(err);
      toast({ title: 'Delete failed', status: 'error', duration: 3000 });
    }
  };

  return (
    <FinanceLayout>
      <Box p={6}>
      <Flex justify="space-between" align="center" mb={4} direction={{ base: 'column', md: 'row' }}>
        <Box mb={{ base: 3, md: 0 }}>
          <Heading size="md">Inventory Management</Heading>
          <Text fontSize="sm" color="gray.500">Manage products and stock levels</Text>
        </Box>
          <Stack direction={{ base: 'column', md: 'row' }} spacing={{ base: 3, md: 4 }} align="center" width={{ base: '100%', md: 'auto' }}>
            <InputGroup maxW={{ base: '100%', md: '360px' }} borderRadius="md" overflow="hidden">
              <InputLeftElement pointerEvents="none" color={useColorModeValue('gray.400','gray.300')}>
                <FiSearch />
              </InputLeftElement>
              <Input placeholder="Search by name or SKU" value={query} onChange={(e) => setQuery(e.target.value)} bg={useColorModeValue('white','gray.700')} size="sm" />
            </InputGroup>
            <HStack spacing={2}>
              {isSmall ? (
                <IconButton aria-label="Export CSV" icon={<FiDownload />} onClick={exportCsv} variant="outline" size="sm" borderRadius="md" />
              ) : (
                <Button onClick={exportCsv} leftIcon={<FiDownload />} variant="outline" size="sm" borderRadius="md">Export CSV</Button>
              )}
              <Button leftIcon={<AddIcon />} colorScheme="teal" onClick={openNew} size="sm" borderRadius="md">Add Stock</Button>
            </HStack>
          </Stack>
      </Flex>

      <Box bg="white" borderRadius="md" boxShadow="sm" p={4}>
        {loading ? (
          <Flex justify="center" align="center" minH="200px"><Spinner /></Flex>
        ) : (
          (items.length === 0) ? (
            <Flex direction="column" align="center" justify="center" minH="200px">
              <Text fontSize="lg" mb={3}>No inventory items yet</Text>
              <Text fontSize="sm" color="gray.500" mb={4}>Add your first stock item to get started.</Text>
              <Button colorScheme="teal" onClick={openNew}>Add Stock</Button>
            </Flex>
          ) : (
            <Table variant="simple">
              <Thead>
                <Tr>
                  <Th>Name</Th>
                  <Th>SKU</Th>
                  <Th isNumeric>Price</Th>
                  <Th isNumeric>Quantity</Th>
                  <Th isNumeric>Buffer</Th>
                  <Th>Actions</Th>
                </Tr>
              </Thead>
              <Tbody>
                {items
                  .filter(i => !query || (i.name && i.name.toLowerCase().includes(query.toLowerCase())) || (i.sku && i.sku.toLowerCase().includes(query.toLowerCase())))
                  .map(item => (
                  <Tr key={item._id}>
                    <Td>{item.name}</Td>
                    <Td>{item.sku}</Td>
                    <Td isNumeric>${(item.price ?? 0).toFixed(2)}</Td>
                    <Td isNumeric>{item.quantity}</Td>
                    <Td isNumeric>{item.bufferStock ?? 0}</Td>
                    <Td>
                      <HStack>
                        <IconButton icon={<EditIcon />} size="sm" onClick={() => openEdit(item)} aria-label="Edit" />
                        <IconButton icon={<DeleteIcon />} size="sm" colorScheme="red" onClick={() => removeItem(item._id)} aria-label="Delete" />
                        <IconButton icon={<FiMinus />} size="sm" onClick={() => handleDeliver(item)} aria-label="Deliver" title="Deliver (deduct from stock)" />
                        <IconButton icon={<FiPlus />} size="sm" onClick={() => handleAddBuffer(item)} aria-label="Add Buffer" title="Add to buffer stock" />
                        <IconButton icon={<FiRepeat />} size="sm" onClick={() => handleTransfer(item)} aria-label="Transfer Buffer" title="Transfer from buffer to stock" />
                        <IconButton icon={<FiClock />} size="sm" onClick={async () => {
                          setHistoryItemId(item._id);
                          setServerMovements(null);
                          setServerHistoryLoading(true);
                          try {
                            const mv = await getMovements(item._id);
                            setServerMovements(mv || []);
                          } catch (err) {
                            console.error('Failed to load server movements', err);
                            toast({ title: 'Failed to load server history, showing local history', status: 'warning' });
                            setServerMovements(null);
                          } finally {
                            setServerHistoryLoading(false);
                            onOpenHistory();
                          }
                        }} aria-label="History" title="Movement history" />
                      </HStack>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          )
        )}
      </Box>

      <Modal isOpen={isOpen} onClose={onClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>{selected && selected._id ? 'Edit Stock' : 'Add Stock'}</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Stack spacing={3}>
              <FormControl>
                <FormLabel>Product Name</FormLabel>
                <Input value={selected?.name || ''} onChange={(e) => setSelected(prev => ({ ...prev, name: e.target.value }))} />
              </FormControl>
              <FormControl>
                <FormLabel>SKU</FormLabel>
                <Input value={selected?.sku || ''} onChange={(e) => setSelected(prev => ({ ...prev, sku: e.target.value }))} />
              </FormControl>
              <FormControl>
                <FormLabel>Price</FormLabel>
                <NumberInput value={selected?.price ?? 0} min={0} onChange={(val) => setSelected(prev => ({ ...prev, price: Number(val) }))}>
                  <NumberInputField />
                </NumberInput>
              </FormControl>
              <FormControl>
                <FormLabel>Quantity</FormLabel>
                <NumberInput value={selected?.quantity ?? 0} min={0} onChange={(val) => setSelected(prev => ({ ...prev, quantity: Number(val) }))}>
                  <NumberInputField />
                </NumberInput>
              </FormControl>
              <FormControl>
                <FormLabel>Buffer Stock</FormLabel>
                <NumberInput value={selected?.bufferStock ?? 0} min={0} onChange={(val) => setSelected(prev => ({ ...prev, bufferStock: Number(val) }))}>
                  <NumberInputField />
                </NumberInput>
              </FormControl>
              <FormControl>
                <FormLabel>Description</FormLabel>
                <Textarea value={selected?.description || ''} onChange={(e) => setSelected(prev => ({ ...prev, description: e.target.value }))} />
              </FormControl>
            </Stack>
          </ModalBody>
          <ModalFooter>
            <Button colorScheme="teal" mr={3} onClick={saveItem}>{selected && selected._id ? 'Save' : 'Create'}</Button>
            <Button variant="ghost" onClick={onClose}>Cancel</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
      {/* Deliver modal */}
      <Modal isOpen={isDeliverOpen} onClose={onCloseDeliver} isCentered>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Deliver Stock</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Text mb={2}>Item: {opItem?.name}</Text>
            <FormControl>
              <FormLabel>Quantity to deliver</FormLabel>
              <NumberInput value={opAmount} min={1} onChange={(val) => setOpAmount(Number(val))}>
                <NumberInputField />
              </NumberInput>
            </FormControl>
          </ModalBody>
          <ModalFooter>
            <Button colorScheme="teal" mr={3} onClick={confirmDeliver}>Confirm</Button>
            <Button variant="ghost" onClick={onCloseDeliver}>Cancel</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Add Buffer modal */}
      <Modal isOpen={isAddBufferOpen} onClose={onCloseAddBuffer} isCentered>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Add Buffer Stock</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Text mb={2}>Item: {opItem?.name}</Text>
            <FormControl>
              <FormLabel>Buffer quantity to add</FormLabel>
              <NumberInput value={opAmount} min={1} onChange={(val) => setOpAmount(Number(val))}>
                <NumberInputField />
              </NumberInput>
            </FormControl>
          </ModalBody>
          <ModalFooter>
            <Button colorScheme="teal" mr={3} onClick={confirmAddBuffer}>Confirm</Button>
            <Button variant="ghost" onClick={onCloseAddBuffer}>Cancel</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Transfer modal */}
      <Modal isOpen={isTransferOpen} onClose={onCloseTransfer} isCentered>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Transfer Buffer → Stock</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Text mb={2}>Item: {opItem?.name}</Text>
            <Text fontSize="sm" color="gray.500" mb={2}>Available buffer: {opItem?.bufferStock ?? 0}</Text>
            <FormControl>
              <FormLabel>Quantity to transfer</FormLabel>
              <NumberInput value={opAmount} min={1} onChange={(val) => setOpAmount(Number(val))}>
                <NumberInputField />
              </NumberInput>
            </FormControl>
          </ModalBody>
          <ModalFooter>
            <Button colorScheme="teal" mr={3} onClick={confirmTransfer}>Confirm</Button>
            <Button variant="ghost" onClick={onCloseTransfer}>Cancel</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* History modal */}
      <Modal isOpen={isHistoryOpen} onClose={() => { setHistoryItemId(null); onCloseHistory(); }} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Movement History</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {serverHistoryLoading && (
              <Flex justify="center"><Spinner /></Flex>
            )}
            {!serverHistoryLoading && serverMovements !== null && serverMovements.length === 0 && (
              <Text>No server history for this item.</Text>
            )}
            {!serverHistoryLoading && serverMovements !== null && serverMovements.length > 0 && (
              <Table variant="simple">
                <Thead>
                  <Tr><Th>Time</Th><Th>Type</Th><Th isNumeric>Amount</Th><Th>Before</Th><Th>After</Th></Tr>
                </Thead>
                <Tbody>
                  {(serverMovements || []).map((m, idx) => (
                    <Tr key={m._id || idx}>
                      <Td>{new Date(m.createdAt || m.ts).toLocaleString()}</Td>
                      <Td>{m.type}</Td>
                      <Td isNumeric>{m.amount}</Td>
                      <Td>{JSON.stringify(m.before)}</Td>
                      <Td>{JSON.stringify(m.after)}</Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            )}
            {!serverHistoryLoading && serverMovements === null && historyItemId && (movements[historyItemId] || []).length === 0 && (
              <Text>No local history for this item.</Text>
            )}
            {!serverHistoryLoading && serverMovements === null && historyItemId && (movements[historyItemId] || []).length > 0 && (
              <Table variant="simple">
                <Thead>
                  <Tr><Th>Time</Th><Th>Type</Th><Th isNumeric>Amount</Th><Th>Before</Th><Th>After</Th></Tr>
                </Thead>
                <Tbody>
                  {(movements[historyItemId] || []).map((m, idx) => (
                    <Tr key={idx}>
                      <Td>{new Date(m.ts).toLocaleString()}</Td>
                      <Td>{m.type}</Td>
                      <Td isNumeric>{m.amount}</Td>
                      <Td>{JSON.stringify(m.before)}</Td>
                      <Td>{JSON.stringify(m.after)}</Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            )}
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" onClick={() => { setHistoryItemId(null); onCloseHistory(); }}>Close</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
      </Box>
    </FinanceLayout>
  );
};

export default InventoryPage;
