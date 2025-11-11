import React, { useState, useEffect } from "react";
import {
  Modal, ModalOverlay, ModalContent, ModalHeader, ModalCloseButton,
  ModalBody, ModalFooter, Button, FormControl, FormLabel, Input, Textarea, Select, useToast, Image, Box, Text
} from "@chakra-ui/react";
import { useUser } from "../../../context/UserContex";
import { productService, type Product } from "../../../services/productService";

interface ProductModifyFormProps {
  isOpen: boolean;
  onClose: () => void;
  onProductModified?: () => void;
  product: Product | null; // The product to modify
}

const ProductModifyForm: React.FC<ProductModifyFormProps> = ({ 
  isOpen, 
  onClose, 
  onProductModified, 
  product 
}) => {
  const [image, setImage] = useState<File | null>(null);
  const [product_name, setProductName] = useState("");
  const [description, setDescription] = useState("");
  const [cost, setCost] = useState<string>("");
  const [unit, setUnit] = useState<string>("each");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentImageUrl, setCurrentImageUrl] = useState<string>("");
  const toast = useToast();
  const { user } = useUser();

  // Get bucket name from frontend .env (VITE_AWS_BUCKET_NAME)
  const bucketName = import.meta.env.VITE_AWS_BUCKET_NAME as string;
  // Get username from localStorage
  const username = localStorage.getItem("username") || "User";

  // Pre-populate form when product changes
  useEffect(() => {
    if (product && isOpen) {
      setProductName(product.product_name || "");
      setDescription(product.description || "");
      setCost(product.cost ? product.cost.toString() : "");
      setUnit(product.unit || "each");
      setCurrentImageUrl(product.image_url || "");
      // Reset the file input when opening with new product
      setImage(null);
    }
  }, [product, isOpen]);

  const handleClose = () => {
    // Clear form when modal closes
    setImage(null);
    setProductName("");
    setDescription("");
    setCost("");
    setUnit("each");
    setCurrentImageUrl("");
    onClose();
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImage(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user?.id || !product) {
      toast({
        title: "Authentication Error",
        description: "User not authenticated or product not found. Please try again.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. Upload new image to S3 if provided, otherwise use existing image
      let imageUrl = currentImageUrl; // Keep existing image by default
      if (image) {
        const formData = new FormData();
        // Rename the file for S3 key
        const s3Key = `${username}_${image.name}`;
        formData.append("file", image, s3Key);
        await productService.uploadFile(formData);
        imageUrl = `https://${bucketName}.s3.amazonaws.com/${s3Key}`;
      }

      // 2. Delete the existing product
      await productService.deleteProduct(user.id, product.product_id);

      // 3. Create new product with updated data
      await productService.createProduct({
        product_id: "", // Let backend generate this
        product_name,
        description,
        image_url: imageUrl,
        user_id: user.id,
        cost: cost ? parseFloat(cost) : undefined,
        unit: unit
      });

      toast({
        title: "Product updated!",
        description: "Your product has been successfully modified.",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      
      // Call the callback to refresh the products list
      if (onProductModified) {
        onProductModified();
      }
      
      handleClose();
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || error.message || "Failed to update product";
      toast({
        title: "Update failed.",
        description: errorMessage,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const isSubmitEnabled = product_name.trim() !== "" && description.trim() !== "" && cost.trim() !== "";

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="lg">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Modify Product</ModalHeader>
        <ModalCloseButton />
        <form onSubmit={handleSubmit}>
          <ModalBody>
            {/* Current Image Display */}
            {currentImageUrl && !image && (
              <FormControl mb={4}>
                <FormLabel>Current Image</FormLabel>
                <Box width="120px" height="120px" mb={2}>
                  <Image
                    src={currentImageUrl}
                    alt="Current product"
                    width="120px"
                    height="120px"
                    objectFit="cover"
                    borderRadius="md"
                    fallback={
                      <Box
                        width="120px"
                        height="120px"
                        bg="gray.200"
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
                        borderRadius="md"
                      >
                        <Text fontSize="xs" color="gray.500">
                          No Image
                        </Text>
                      </Box>
                    }
                  />
                </Box>
              </FormControl>
            )}

            <FormControl mb={4}>
              <FormLabel>Update Product Image (optional)</FormLabel>
              <Input type="file" accept="image/*" onChange={handleImageChange} />
              <Text fontSize="sm" color="gray.500" mt={1}>
                Leave empty to keep current image
              </Text>
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
                rows={3}
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
              loadingText="Updating..."
            >
              Submit
            </Button>
            <Button variant="ghost" onClick={handleClose}>
              Cancel
            </Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  );
};

export default ProductModifyForm;