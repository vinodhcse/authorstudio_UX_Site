import React, { useEffect, useMemo, useState } from 'react';
import { NodeViewWrapper } from '@tiptap/react';

// A lightweight node view that renders using the latest typography settings.
// It listens for a global event `as:typography:updated` to re-render.

interface SceneDividerNodeProps {
  node: any;
  updateAttributes: (attributes: Record<string, any>) => void;
  deleteNode: () => void;
  editor: any;
}

// Global access helper to fetch last typography settings
function getLastTypographySettings(): {
  sceneDivider?: string;
  sceneDividerImage?: string;
  sceneDividerImageWidth?: number;
} {
  const win = window as any;
  // Prefer cached settings placed by TypographySettingsPopup
  if (win.__typography_last__) return win.__typography_last__;
  try {
    const raw = localStorage.getItem('as:typographySettings:last');
    if (raw) return JSON.parse(raw);
  } catch {}
  return {};
}

const centerStyle: React.CSSProperties = {
  display: 'block',
  marginLeft: 'auto',
  marginRight: 'auto',
  textAlign: 'center',
};

const SceneDividerNode: React.FC<SceneDividerNodeProps> = () => {
  const [tick, setTick] = useState(0);

  // Subscribe to typography updates so the node view re-renders itself
  useEffect(() => {
    const handler = () => setTick(t => t + 1);
    window.addEventListener('as:typography:updated', handler as EventListener);
    return () => window.removeEventListener('as:typography:updated', handler as EventListener);
  }, []);

  const settings = useMemo(() => getLastTypographySettings(), [tick]);
  const mode = settings.sceneDivider || 'asterisks';
  const map: Record<string, string> = {
    asterisks: '* * *',
    boxes: '■ ■ ■',
    lines: '— — —',
    dots: '• • •',
  };

  return (
    <NodeViewWrapper as="div" className="my-6" data-node-type="scene-divider">
      {mode === 'image' && settings.sceneDividerImage ? (
        <img
          src={settings.sceneDividerImage}
          alt="Scene Divider"
          style={{ ...centerStyle, width: settings.sceneDividerImageWidth || 400 }}
        />)
        : (
        <p style={centerStyle}>
          <span>{map[mode] || map.asterisks}</span>
        </p>
      )}
    </NodeViewWrapper>
  );
};

export default SceneDividerNode;
