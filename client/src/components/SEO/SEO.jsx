import React from 'react';
import { Helmet } from 'react-helmet-async';

const SEO = ({ aboutData }) => {
  const name = aboutData?.name || "Dhruv Patel";
  const role = aboutData?.role || "Full Stack Developer & AI Engineer";
  
  const title = `${name} | ${role}`;
  const description = aboutData?.description || 
    "Portfolio of Dhruv Patel, a passionate Full Stack Developer and AI Engineer specializing in React, Node.js, RAG AI systems, and scalable web solutions.";

  const originUrl = typeof window !== 'undefined' ? window.location.origin : "https://dhruv-portfolio.vercel.app";
  const currentUrl = typeof window !== 'undefined' ? window.location.href : originUrl;
  const imageUrl = `${originUrl}/favicon.jpg`;

  const keywords = [
    name,
    `${name} Portfolio`,
    "Full Stack Developer",
    "AI Engineer",
    "Software Engineer",
    "React Developer",
    "Node.js Developer",
    "RAG AI Chatbot",
    "Web Developer Portfolio",
    "JavaScript Developer"
  ].join(", ");

  // Schema.org Person Structured Data
  const personSchema = {
    "@context": "https://schema.org",
    "@type": "Person",
    "name": name,
    "jobTitle": role,
    "url": originUrl,
    "image": imageUrl,
    "description": description,
    "sameAs": [
      aboutData?.socials?.github || "https://github.com",
      aboutData?.socials?.linkedin || "https://linkedin.com"
    ].filter(Boolean)
  };

  // Schema.org ProfilePage Structured Data
  const profilePageSchema = {
    "@context": "https://schema.org",
    "@type": "ProfilePage",
    "dateCreated": "2024-01-01T00:00:00+00:00",
    "mainEntity": personSchema
  };

  return (
    <Helmet>
      {/* Standard HTML Metadata */}
      <html lang="en" />
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      <meta name="author" content={name} />
      <meta name="robots" content="index, follow, max-image-preview:large" />
      <meta name="theme-color" content="#0d1117" />
      <link rel="canonical" href={currentUrl} />

      {/* Open Graph Meta Tags (Facebook, LinkedIn, Discord) */}
      <meta property="og:site_name" content={`${name} Portfolio`} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content="profile" />
      <meta property="og:url" content={currentUrl} />
      <meta property="og:image" content={imageUrl} />
      <meta property="og:locale" content="en_US" />

      {/* Twitter Card Meta Tags */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={imageUrl} />

      {/* JSON-LD Structured Data for Search Engine Rich Snippets */}
      <script type="application/ld+json">
        {JSON.stringify(personSchema)}
      </script>
      <script type="application/ld+json">
        {JSON.stringify(profilePageSchema)}
      </script>
    </Helmet>
  );
};

export default SEO;
