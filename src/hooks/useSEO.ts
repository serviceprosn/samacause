import { useEffect } from 'react';

interface SEOProps {
  title: string;
  description?: string;
  keywords?: string;
  ogType?: string;
  ogImage?: string;
  ogUrl?: string;
}

export const useSEO = ({
  title,
  description,
  keywords,
  ogType = 'website',
  ogImage = '/logo sunu cause.png',
  ogUrl
}: SEOProps) => {
  useEffect(() => {
    // Set document title
    const fullTitle = `${title} | Sunu Yité`;
    document.title = fullTitle;

    // Update meta description
    let metaDescription = document.querySelector('meta[name="description"]');
    if (!metaDescription) {
      metaDescription = document.createElement('meta');
      metaDescription.setAttribute('name', 'description');
      document.head.appendChild(metaDescription);
    }
    const finalDesc = description || "Sunu Yité - Plateforme web et mobile de mobilisation citoyenne et de financement participatif solidaire au Sénégal.";
    metaDescription.setAttribute('content', finalDesc);

    // Update meta keywords
    let metaKeywords = document.querySelector('meta[name="keywords"]');
    if (!metaKeywords) {
      metaKeywords = document.createElement('meta');
      metaKeywords.setAttribute('name', 'keywords');
      document.head.appendChild(metaKeywords);
    }
    metaKeywords.setAttribute('content', keywords || "Sénégal, citoyenneté, tontine, pétition, cagnotte, financement participatif, solidarité, impact, Wave, Orange Money");

    // Update Open Graph tags
    const ogTags = {
      'og:title': fullTitle,
      'og:description': finalDesc,
      'og:type': ogType,
      'og:image': ogImage.startsWith('http') || ogImage.startsWith('data:') ? ogImage : `${window.location.origin}${ogImage}`,
      'og:url': ogUrl || window.location.href
    };

    Object.entries(ogTags).forEach(([property, content]) => {
      let tag = document.querySelector(`meta[property="${property}"]`);
      if (!tag) {
        tag = document.createElement('meta');
        tag.setAttribute('property', property);
        document.head.appendChild(tag);
      }
      tag.setAttribute('content', content);
    });

    // Update Twitter Card tags
    const twitterTags = {
      'twitter:card': 'summary_large_image',
      'twitter:title': fullTitle,
      'twitter:description': finalDesc,
      'twitter:image': ogTags['og:image']
    };

    Object.entries(twitterTags).forEach(([name, content]) => {
      let tag = document.querySelector(`meta[name="${name}"]`);
      if (!tag) {
        tag = document.createElement('meta');
        tag.setAttribute('name', name);
        document.head.appendChild(tag);
      }
      tag.setAttribute('content', content);
    });
  }, [title, description, keywords, ogType, ogImage, ogUrl]);
};
