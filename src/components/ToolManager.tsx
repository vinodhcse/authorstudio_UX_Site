import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useToolWindowStore, AVAILABLE_TOOLS, ToolType } from '../stores/toolWindowStore';

interface ToolManagerProps {
  bookId: string;
  versionId: string;
}

const ToolManager: React.FC<ToolManagerProps> = ({ bookId, versionId }) => {
  const { setCurrentContext, openTool, syncWithTauri } = useToolWindowStore();

  useEffect(() => {
    // Set current context when component mounts
    setCurrentContext(bookId, versionId);
    
    // Initial sync when context changes
    syncWithTauri();
  }, [bookId, versionId, setCurrentContext, syncWithTauri]);

  const handleOpenTool = async (toolName: ToolType) => {
    await openTool(toolName, bookId, versionId);
  };

  return (
    <div className="flex flex-wrap gap-3">
      {Object.entries(AVAILABLE_TOOLS).map(([toolName, config]) => (
        <motion.button
          key={toolName}
          whileHover={{ scale: 1.05, y: -2 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => handleOpenTool(toolName as ToolType)}
          className="flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-xl text-white shadow-lg hover:shadow-xl transition-all duration-200"
        >
          <span className="text-xl">{config.icon}</span>
          <div className="text-left">
            <div className="font-medium text-sm">{config.title}</div>
            <div className="text-blue-200 text-xs opacity-80">Open Tool</div>
          </div>
        </motion.button>
      ))}
    </div>
  );
};

export default ToolManager;
