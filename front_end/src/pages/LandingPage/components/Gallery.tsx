
import image1 from "../data/usage1.png";
import image2 from "../data/usage2.png";
import image3 from "../data/usage3.png";
import image4 from "../data/usage4.png";
import { useState } from 'react';
import { Box, Heading, Text, SimpleGrid, Image, Modal, ModalOverlay, ModalContent, ModalBody, useDisclosure, Spacer } from "@chakra-ui/react";


const images = [
    { src: image1, alt: "Usage 1" },
    { src: image2, alt: "Usage 2" },
    { src: image3, alt: "Usage 3" },
    { src: image4, alt: "Usage 4" },
];

const Gallery = () => {
    const { isOpen, onOpen, onClose } = useDisclosure();
    const [selectedImg, setSelectedImg] = useState<{ src: string; alt: string } | null>(null);

    const handleImageClick = (img: { src: string; alt: string }) => {
        setSelectedImg(img);
        onOpen();
    };

    return (
        <Box py={10} px={4} textAlign="center" bg="gray.50">
            <Heading as="h2" size="xl" mb={2} position="relative" display="inline-block">
                Gallery
                <Box
                    height="4px"
                    width="60px"
                    bg="teal.400"
                    borderRadius="2px"
                    position="absolute"
                    left="50%"
                    bottom="-8px"
                    transform="translateX(-50%)"
                />
            </Heading>
            <Box height="18px" /> 
            <Spacer />  <Text fontSize="md" color="gray.600" mb={6}>
                FarmZilla connects you with fresh, local produce and farmers markets. Here are some screenshots showcasing how easy it is to find and support local agriculture.
            </Text>
            <SimpleGrid columns={2} spacing={4} maxW="800px" mx="auto">
                {images.map((img, idx) => (
                    <Box
                        key={idx}
                        as="button"
                        onClick={() => handleImageClick(img)}
                        borderRadius="md"
                        overflow="hidden"
                        _hover={{ boxShadow: "lg" }}
                        p={0}
                    >
                        <Image src={img.src} alt={img.alt} objectFit="cover" w="100%" h="200px" />
                    </Box>
                ))}
            </SimpleGrid>
            <Modal isOpen={isOpen} onClose={onClose} isCentered size="xl">
                <ModalOverlay />
                <ModalContent bg="transparent" boxShadow="none" maxW="lg">
                    <ModalBody p={0} display="flex" justifyContent="center" alignItems="center">
                        {selectedImg && (
                            <Image src={selectedImg.src} alt={selectedImg.alt} maxH="80vh" maxW="100%" borderRadius="md" />
                        )}
                    </ModalBody>
                </ModalContent>
            </Modal>
        </Box>
    );
};

export default Gallery;