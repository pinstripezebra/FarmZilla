import React from "react";
import Features from "./components/Features";
import Introduction from "./components/Introduction";
import AboutUs from "./components/AboutUs";
import data from "./data/data.json";
import LandingNavbar from "./components/LandingNavBar";
import ContactUs from "./components/ContactUs";
import Gallery from "./components/Gallery";


const sectionStyle: React.CSSProperties = {
    marginBottom: "2rem",
};

const LandingPage = () => {
    return (
        <div>
            <LandingNavbar />
            <div id="introduction" style={sectionStyle}>
                <Introduction introData={data.Introduction} />
            </div>
            <div id="features" style={sectionStyle}>
                <Features features={data.Features} />
            </div>
            <div id="aboutus" style={sectionStyle}>
                <AboutUs
                    blurb={data.AboutUs.blurb}
                    whyChoose={data.AboutUs.whyChoose}
                />
            </div>
            <div id="gallery" style={sectionStyle}>
                <Gallery />
            </div>
            <div id="contactus" style={sectionStyle}>
                <ContactUs />
            </div>
        </div>
    );
};

export default LandingPage;