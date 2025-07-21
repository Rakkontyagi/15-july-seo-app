
import React from 'react';

export type ContentType = 'blog_post' | 'service_page' | 'product_description' | 'landing_page' | 'email_copy' | 'ad_copy';

interface ContentTypeSelectProps {
  value: ContentType | '';
  onChange: (value: ContentType | '') => void;
  className?: string;
}

const contentTypes: { label: string; value: ContentType }[] = [
  { label: 'Blog Post', value: 'blog_post' },
  { label: 'Service Page', value: 'service_page' },
  { label: 'Product Description', value: 'product_description' },
  { label: 'Landing Page', value: 'landing_page' },
  { label: 'Email Copy', value: 'email_copy' },
  { label: 'Ad Copy', value: 'ad_copy' },
];

const ContentTypeSelect: React.FC<ContentTypeSelectProps> = ({
  value,
  onChange,
  className,
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange(e.target.value as ContentType | '');
  };

  return (
    <select
      value={value}
      onChange={handleChange}
      className={`w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${className}`}
    >
      <option value="">Select Content Type</option>
      {contentTypes.map((type) => (
        <option key={type.value} value={type.value}>
          {type.label}
        </option>
      ))}
    </select>
  );
};

export default ContentTypeSelect;
