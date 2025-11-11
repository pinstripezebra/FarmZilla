import React, { useState } from "react";
import {
  Modal, ModalOverlay, ModalContent, ModalHeader, ModalCloseButton,
  ModalBody, ModalFooter, Button, FormControl, FormLabel, Input, Textarea, Select, useToast
} from "@chakra-ui/react";
import { useUser } from "../../../context/UserContex";
import { productService } from "../../../services/productService";

interface ProductEntryFormProps {
  isOpen: boolean;
  onClose: () => void;
  onProductAdded?: () => void;
}

// ...existing imports...

const ProductEntryForm: React.FC<ProductEntryFormProps> = ({ isOpen, onClose, onProductAdded }) => {
  const [image, setImage] = useState<File | null>(null);
  const [product_name, setProductName] = useState("");
  const [description, setDescription] = useState("");
  const [cost, setCost] = useState<string>("");
  const [unit, setUnit] = useState<string>("each");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const toast = useToast();
  const { user } = useUser();

  // Get bucket name from frontend .env (VITE_AWS_BUCKET_NAME)
  const bucketName = import.meta.env.VITE_AWS_BUCKET_NAME as string;
  // Get username from localStorage
  const username = localStorage.getItem("username") || "User";

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImage(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user?.id) {
      toast({
        title: "Authentication Error",
        description: "User not authenticated. Please log in again.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. Upload image to S3 with username in the key
      let imageUrl = "";
      if (image) {
        const formData = new FormData();
        // Rename the file for S3 key
        const s3Key = `${username}_${image.name}`;
        formData.append("file", image, s3Key);
        await productService.uploadFile(formData);
        imageUrl = `https://${bucketName}.s3.amazonaws.com/${s3Key}`;
      }

      // 2. Send product data including image_url and user_id to backend
      await productService.createProduct({
        product_id: "", // Let backend generate this
        product_name,
        description,
        image_url: imageUrl,
        user_id: user.id, // Include the user ID
        cost: cost ? parseFloat(cost) : undefined,
        unit: unit
      });

      toast({
        title: "Product submitted!",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      
      // Clear form
      setImage(null);
      setProductName("");
      setDescription("");
      setCost("");
      setUnit("each");
      
      // Call the callback to refresh the products list
      if (onProductAdded) {
        onProductAdded();
      }
      
      onClose();
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || error.message || "Failed to submit product";
      toast({
        title: "Submission failed.",
        description: errorMessage,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const isSubmitEnabled = image !== null && product_name.trim() !== "" && description.trim() !== "" && cost.trim() !== "";

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
            <FormControl mb={4}>
              <FormLabel>Cost ($)</FormLabel>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={cost}
                onChange={e => setCost(e.target.value)}
                placeholder="Enter product cost (e.g., 2.99)"
              />
            </FormControl>
            <FormControl mb={4}>
              <FormLabel>Unit</FormLabel>
              <Select
                value={unit}
                onChange={e => setUnit(e.target.value)}
              >
                <option value="each">Each</option>
                <option value="lb">Per Pound</option>
              </Select>
            </FormControl>
          </ModalBody>
          <ModalFooter>
            <Button 
              colorScheme="teal" 
              mr={3} 
              type="submit" 
              disabled={!isSubmitEnabled || isSubmitting}
              isLoading={isSubmitting}
              loadingText="Submitting..."
            >
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