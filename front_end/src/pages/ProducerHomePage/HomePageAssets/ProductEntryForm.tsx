import React, { useState } from "react";
import {
  Modal, ModalOverlay, ModalContent, ModalHeader, ModalCloseButton,
  ModalBody, ModalFooter, Button, FormControl, FormLabel, Input, Textarea, useToast
} from "@chakra-ui/react";
import api from "../../../services/apli-client";

interface ProductEntryFormProps {
  isOpen: boolean;
  onClose: () => void;
}

// ...existing imports...

const ProductEntryForm: React.FC<ProductEntryFormProps> = ({ isOpen, onClose }) => {
  const [image, setImage] = useState<File | null>(null);
  const [product_name, setProductName] = useState("");
  const [description, setDescription] = useState("");
  const toast = useToast();

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

    try {
      // 1. Upload image to S3 with username in the key
      let imageUrl = "";
      if (image) {
        const formData = new FormData();
        // Rename the file for S3 key
        const s3Key = `${username}_${image.name}`;
        formData.append("file", image, s3Key);
        await api.post("/v1/uploadfile/", formData, {
          headers: { "Content-Type": "multipart/form-data" }
        });
        imageUrl = `https://${bucketName}.s3.amazonaws.com/${s3Key}`;
      }

      // 2. Send product data including image_url to backend
      await api.post("/v1/products/", {
        product_id: "", // Let backend generate this
        product_name,
        description,
        image_url: imageUrl // Include the S3 URL
      });

      toast({
        title: "Product submitted!",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      setImage(null);
      setProductName("");
      setDescription("");
      onClose();
    } catch (error) {
      toast({
        title: "Submission failed.",
        description: "Please try again.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const isSubmitEnabled = image !== null && product_name.trim() !== "" && description.trim() !== "";

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
            <Button colorScheme="teal" mr={3} type="submit" disabled={!isSubmitEnabled}>
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