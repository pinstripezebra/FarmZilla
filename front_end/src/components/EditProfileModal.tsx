import React, { useState, useEffect } from "react";
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  VStack,
  useToast,
} from "@chakra-ui/react";
import apiClient from "../services/apli-client";

interface Producer {
  id: string;
  username: string;
  email: string;
  role: string;
  phone_number?: string;
  description?: string;
}

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  producer: Producer;
  onProfileUpdated: (updatedProducer: Producer) => void;
}

const EditProfileModal: React.FC<EditProfileModalProps> = ({
  isOpen,
  onClose,
  producer,
  onProfileUpdated,
}) => {
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [description, setDescription] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const toast = useToast();

  // Initialize form fields when modal opens or producer data changes
  useEffect(() => {
    if (isOpen && producer) {
      setEmail(producer.email || "");
      setPhoneNumber(producer.phone_number || "");
      setDescription(producer.description || "");
    }
  }, [isOpen, producer]);

  // Reset form to current producer values when modal closes
  const handleClose = () => {
    // Reset to original values instead of clearing
    if (producer) {
      setEmail(producer.email || "");
      setPhoneNumber(producer.phone_number || "");
      setDescription(producer.description || "");
    }
    onClose();
  };

  // Reset form to original producer values
  const handleReset = () => {
    if (producer) {
      setEmail(producer.email || "");
      setPhoneNumber(producer.phone_number || "");
      setDescription(producer.description || "");
    }
  };

  const handleSave = async () => {
    if (!email.trim()) {
      toast({
        title: "Email is required",
        description: "Please enter a valid email address.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setIsLoading(true);

    try {
      const updateData = {
        email: email.trim(),
        phone_number: phoneNumber.trim() || null,
        description: description.trim() || null,
      };

      await apiClient.put(`/v1/user/${producer.id}`, updateData);

      // Update the producer object with new data
      const updatedProducer: Producer = {
        ...producer,
        email: updateData.email,
        phone_number: updateData.phone_number || undefined,
        description: updateData.description || undefined,
      };

      onProfileUpdated(updatedProducer);

      toast({
        title: "Profile updated successfully",
        description: "Your profile information has been saved.",
        status: "success",
        duration: 3000,
        isClosable: true,
      });

      handleClose();
    } catch (error: any) {
      console.error("Error updating profile:", error);
      toast({
        title: "Error updating profile",
        description: error.response?.data?.detail || "An error occurred while updating your profile.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="md">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Edit Profile</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack spacing={4}>
            <FormControl isRequired>
              <FormLabel>Email</FormLabel>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={producer?.email || "Enter your email"}
              />
            </FormControl>

            <FormControl>
              <FormLabel>Phone Number</FormLabel>
              <Input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder={producer?.phone_number || "Enter your phone number"}
              />
            </FormControl>

            <FormControl>
              <FormLabel>Farm Description</FormLabel>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={producer?.description || "Describe your farm and products..."}
                resize="vertical"
                rows={4}
              />
            </FormControl>
          </VStack>
        </ModalBody>

        <ModalFooter>
          <Button variant="ghost" mr={3} onClick={handleReset} isDisabled={isLoading}>
            Reset
          </Button>
          <Button variant="ghost" mr={3} onClick={handleClose} isDisabled={isLoading}>
            Cancel
          </Button>
          <Button
            colorScheme="teal"
            onClick={handleSave}
            isLoading={isLoading}
            loadingText="Saving..."
          >
            Save Changes
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default EditProfileModal;