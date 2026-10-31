import React from 'react';

export default function PlaceholderPage({ title, icon }) {
  return (
    <div className="card" style={{ margin: '20px 0' }}>
      <div className="card-body placeholder-page">
        <div className="ph-icon">{icon}</div>
        <h2>{title}</h2>
        <p>This module is part of upcoming project phases and will be fully connected in the next iteration.</p>
        <span className="ph-badge">Coming in Future Phase</span>
      </div>
    </div>
  );
}
