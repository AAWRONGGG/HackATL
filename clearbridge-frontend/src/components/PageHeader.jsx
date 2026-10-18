import React from 'react';
import { Menu } from 'lucide-react';
import './PageHeader.css';

export default function PageHeader({ title, eyebrow, description, meta, accountControl, onOpenNavigation, children }) {
  return (
    <div className="page-heading">
      <div className="page-heading-row">
        <button type="button" className="hamburger" aria-label="Open navigation" onClick={onOpenNavigation}>
          <Menu aria-hidden="true" />
        </button>
        <h1>{title}</h1>
        {accountControl}
      </div>
      {(eyebrow || meta) && <div className="page-heading-meta">{eyebrow}{meta}</div>}
      <p className="intro page-heading-description">{description}</p>
      {children}
    </div>
  );
}
