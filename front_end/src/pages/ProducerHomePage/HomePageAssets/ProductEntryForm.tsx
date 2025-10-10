import React, { useState } from "react";
import {
  Modal, ModalOverlay, ModalContent, ModalHeader, ModalCloseButton,
  ModalBody, ModalFooter, Button, Text, FormControl, FormLabel, Input, Textarea
} from "@chakra-ui/react";

interface ProductEntryFormProps {
  isOpen: boolean;
  onClose: () => void;
}

const ProductEntryForm: React.FC<ProductEntryFormProps> = ({ isOpen, onClose }) => {
  const [image, setImage] = useState<File | null>(null);
  const [product_name, setProductName] = useState("");
  const [description, setDescription] = useState("");

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImage(e.target.files[0]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission logic here (e.g., send image and description to backend)
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Add Products</ModalHeader>
        <ModalCloseButton />
        <form onSubmit={handleSubmit}>
          <ModalBody>
            <FormControl mb={4}>
              <FormLabel>Product Image</FormLabel>
              <Input type="file" accept="image/*" onChange={handleImageChange} />
            </FormControl>
            <FormControl mb={4}>
              <FormLabel>Product Name</FormLabel>
              <Textarea
                value={product_name}
                onChange={e => setProductName(e.target.value)}
                placeholder="Enter product name"
              />
            </FormControl>
            <FormControl mb={4}>
              <FormLabel>Description</FormLabel>
              <Textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Enter product description"
              />
            </FormControl>
          </ModalBody>
          <ModalFooter>
            <Button colorScheme="teal" mr={3} type="submit">
              Submit
            </Button>
            <Button variant="ghost" onClick={onClose}>
              Close
            </Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  );
};

export default ProductEntryForm;