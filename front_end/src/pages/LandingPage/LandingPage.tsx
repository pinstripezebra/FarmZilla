
import { Box, useBreakpointValue } from "@chakra-ui/react";
import Features from "./components/Features";
import Introduction from "./components/Introduction";
import AboutUs from "./components/AboutUs";
import data from "./data/data.json";
import LandingNavbar from "./components/LandingNavBar";
import ContactUs from "./components/ContactUs";
import Gallery from "./components/Gallery";

const LandingPage = () => {
    const sectionSpacing = useBreakpointValue({ base: 8, md: 12, lg: 16 });
    const containerPadding = useBreakpointValue({ base: 4, md: 6, lg: 8 });

    return (
        <Box minH="100vh" bg="gray.50">
            <LandingNavbar />
            <Box px={containerPadding}>
                <Box id="introduction" py={sectionSpacing}>
                    <Introduction introData={data.Introduction} />
                </Box>
                <Box id="features" py={sectionSpacing}>
                    <Features features={data.Features} />
                </Box>
                <Box id="aboutus" py={sectionSpacing}>
                    <AboutUs
                        blurb={data.AboutUs.blurb}
                        whyChoose={data.AboutUs.whyChoose}
                    />
                </Box>
                <Box id="gallery" py={sectionSpacing}>
                    <Gallery />
                </Box>
                <Box id="contactus" py={sectionSpacing}>
                    <ContactUs />
                </Box>
            </Box>
        </Box>
    );
};

export default LandingPage;