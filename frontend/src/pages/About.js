import React from "react";
import { useNavigate } from "react-router-dom";
import {
    FaFish,
    FaStore,
    FaHandHoldingHeart,
    FaCheckCircle,
    FaMobileAlt,
    FaLeaf,
    FaUsers,
    FaArrowRight
} from "react-icons/fa";
import Navbar from "./Navbar";
import "./About.css";

const About = () => {
    const navigate = useNavigate();

    return (
        <div className="about-wrapper">
            <Navbar />

            <div className="about-container">
                <div className="about-header">
                    <h1 className="about-title">About e-Sea-Merkado</h1>
                    <p className="about-subtitle">
                        Your trusted digital marketplace connecting fresh seafood suppliers with customers across the Philippines
                    </p>
                </div>

                <div className="about-content">
                    {/* Mission Card */}
                    <div className="about-card">
                        <h2>
                            <FaFish className="about-icon" />
                            Our Mission
                        </h2>
                        <p>
                            e-Sea-Merkado is dedicated to revolutionizing the seafood industry by creating a seamless digital platform that connects local fishermen and seafood vendors directly with customers. We believe in making fresh, quality seafood accessible to everyone while supporting our local fishing communities.
                        </p>
                        <p>
                            Through innovative technology and a commitment to sustainability, we're building a bridge between the ocean's bounty and your table, ensuring freshness, quality, and fair prices for all.
                        </p>
                    </div>

                    {/* What We Offer Card */}
                    <div className="about-card">
                        <h2>
                            <FaStore className="about-icon" />
                            What We Offer
                        </h2>
                        <div className="features-grid">
                            <div className="feature-item">
                                <h3>
                                    <FaFish className="feature-icon" />
                                    Fresh Seafood
                                </h3>
                                <p>
                                    Daily catches from trusted local suppliers, delivered fresh to your doorstep
                                </p>
                            </div>
                            <div className="feature-item">
                                <h3>
                                    <FaMobileAlt className="feature-icon" />
                                    Easy Ordering
                                </h3>
                                <p>
                                    Browse, select, and order your favorite seafood with just a few clicks
                                </p>
                            </div>
                            <div className="feature-item">
                                <h3>
                                    <FaHandHoldingHeart className="feature-icon" />
                                    Secure Pick-Up
                                </h3>
                                <p>
                                    Safe and organized pick-up system ensuring you get exactly what you ordered
                                </p>
                            </div>
                            <div className="feature-item">
                                <h3>
                                    <FaCheckCircle className="feature-icon" />
                                    Quality Assured
                                </h3>
                                <p>
                                    Every product is verified for freshness and quality before delivery
                                </p>
                            </div>
                            <div className="feature-item">
                                <h3>
                                    <FaLeaf className="feature-icon" />
                                    Sustainable
                                </h3>
                                <p>
                                    Supporting sustainable fishing practices and local communities
                                </p>
                            </div>
                            <div className="feature-item">
                                <h3>
                                    <FaUsers className="feature-icon" />
                                    Community Driven
                                </h3>
                                <p>
                                    Empowering local fishermen and vendors through digital commerce
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Why Choose Us Card */}
                    <div className="about-card">
                        <h2>
                            <FaCheckCircle className="about-icon" />
                            Why Choose e-Sea-Merkado?
                        </h2>
                        <p>
                            We understand that when it comes to seafood, freshness is everything. That's why we've built a platform that prioritizes speed, quality, and transparency. Every vendor on our platform is carefully vetted, and every product is guaranteed to meet our high standards.
                        </p>
                        <p>
                            By choosing e-Sea-Merkado, you're not just buying seafood – you're supporting local fishing communities, promoting sustainable practices, and enjoying the convenience of modern technology while preserving traditional values.
                        </p>
                    </div>
                </div>

                {/* Call to Action */}
                <div className="cta-section">
                    <h2>Ready to Get Started?</h2>
                    <p>
                        Join hundreds of satisfied customers who trust e-Sea-Merkado for their daily seafood needs
                    </p>
                    <button className="cta-button" onClick={() => navigate('/buyer/login')}>
                        Start Shopping Now
                        <FaArrowRight />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default About;