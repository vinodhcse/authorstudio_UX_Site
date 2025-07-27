const TypographySettingsPopup: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onApply: (settings: TypographySettings) => void;
    editor: TipTapEditor;
}> = ({ isOpen, onClose, onApply, editor }) => {
    const [settings, setSettings] = useState<TypographySettings>({
        fontFamily: 'Georgia, serif',
        fontSize: 'text-base',
        textIndent: 'none',
        chicagoStyle: false,
        lineHeight: 'normal',
        paragraphSpacing: '0.5em',
        pageWidth: 'medium',
        textAlignment: 'left',
        sceneDivider: 'asterisks',
        typewriterMode: false,
        rememberPosition: true,
    });

    const [originalSettings, setOriginalSettings] = useState<TypographySettings | null>(null);

    const fontFamilies = [
        { name: 'Georgia', value: 'Georgia, serif', kdp: true, ingram: true },
        { name: 'Times New Roman', value: 'Times New Roman, serif', kdp: true, ingram: true },
        { name: 'Arial', value: 'Arial, sans-serif', kdp: true, ingram: false },
        { name: 'Helvetica', value: 'Helvetica, sans-serif', kdp: false, ingram: true },
        { name: 'Courier New', value: 'Courier New, monospace', kdp: true, ingram: true },
        { name: 'Palatino', value: 'Palatino, serif', kdp: false, ingram: true },
        { name: 'Garamond', value: 'Garamond, serif', kdp: true, ingram: true },
    ];

    const applySettingsToEditor = (newSettings: TypographySettings) => {
        const editorElement = editor.view.dom as HTMLElement;
        const container = editorElement.closest('.prose') as HTMLElement;
        
        if (container) {
            // Apply font family
            container.style.fontFamily = newSettings.fontFamily;
            
            // Apply font size
            const sizeMap = {
                'text-sm': '14px',
                'text-base': '16px', 
                'text-lg': '18px',
                'text-xl': '20px'
            };
            container.style.fontSize = sizeMap[newSettings.fontSize as keyof typeof sizeMap];
            
            // Apply text indent
            const indentMap = {
                'none': '0',
                'small': '1em',
                'medium': '2em',
                'large': '3em'
            };
            container.style.setProperty('--text-indent', indentMap[newSettings.textIndent as keyof typeof indentMap]);
            
            // Apply line height
            const lineHeightMap = {
                'tight': '1.25',
                'normal': '1.5',
                'relaxed': '1.75',
                'loose': '2'
            };
            container.style.lineHeight = lineHeightMap[newSettings.lineHeight as keyof typeof lineHeightMap];
            
            // Apply paragraph spacing
            container.style.setProperty('--paragraph-spacing', newSettings.paragraphSpacing);
            
            // Clear editor selection to prevent bubble menu
            editor.chain().blur().run();
            
            // Apply text alignment to current content without selecting all
            if (newSettings.textAlignment === 'justified') {
                // Apply justify alignment to all paragraphs via CSS
                container.style.setProperty('text-align', 'justify');
            } else {
                // Apply alignment to all paragraphs via CSS
                container.style.setProperty('text-align', newSettings.textAlignment as string);
            }
            
            // Apply page width
            const widthMap = {
                'narrow': '400px',
                'medium': '600px', 
                'wide': '800px',
                'full': '100%'
            };
            const editorContainer = container.parentElement?.parentElement;
            if (editorContainer) {
                editorContainer.style.maxWidth = widthMap[newSettings.pageWidth as keyof typeof widthMap];
                editorContainer.style.width = '100%';
                editorContainer.style.margin = '0 auto';
            }
        }
    };

    // Store original settings when panel opens
    useEffect(() => {
        if (isOpen && !originalSettings) {
            const editorElement = editor.view.dom as HTMLElement;
            const container = editorElement.closest('.prose') as HTMLElement;
            
            if (container) {
                const current: TypographySettings = {
                    fontFamily: container.style.fontFamily || 'Georgia, serif',
                    fontSize: 'text-base', // default
                    textIndent: 'none',
                    chicagoStyle: false,
                    lineHeight: 'normal',
                    paragraphSpacing: '0.5em',
                    pageWidth: 'medium',
                    textAlignment: 'left',
                    sceneDivider: 'asterisks',
                    typewriterMode: false,
                    rememberPosition: true,
                };
                setOriginalSettings(current);
            }
        }
    }, [isOpen, originalSettings, editor]);

    // Apply changes in real-time
    useEffect(() => {
        if (isOpen) {
            applySettingsToEditor(settings);
        }
    }, [settings, isOpen, editor]);

    const handleApply = () => {
        // Settings are already applied in real-time, just cleanup and close
        setOriginalSettings(null);
        onApply(settings);
        onClose();
    };

    const handleCancel = () => {
        // Revert to original settings if they exist
        if (originalSettings) {
            applySettingsToEditor(originalSettings);
        }
        setOriginalSettings(null);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/30 z-50 flex">
            {/* Backdrop - click to close */}
            <div 
                className="flex-1 cursor-pointer" 
                onClick={onClose}
            />
            
            {/* Side Panel */}
            <motion.div
                initial={{ opacity: 0, x: 400 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 400 }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                className="bg-white dark:bg-gray-800 shadow-2xl w-[420px] h-auto max-h-[90vh] overflow-hidden flex flex-col"
                style={{
                    background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255,255,255,0.1)'
                }}
            >
                {/* Gradient overlay similar to BookCard */}
                <div className="absolute -inset-2 bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400 opacity-10 blur-xl z-0"></div>
                
                <div className="relative z-10 bg-gradient-to-br from-gray-50/80 to-gray-100/80 dark:from-gray-900/80 dark:to-black/80 flex flex-col rounded-lg">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-200/50 dark:border-gray-700/50 backdrop-blur-sm">
                    <motion.div 
                        className="flex items-center gap-3"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 }}
                    >
                        <TypeIcon className="w-6 h-6 text-blue-600" />
                        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                            TYPOGRAPHY
                        </h2>
                    </motion.div>
                    <motion.button
                        onClick={handleCancel}
                        className="p-2 hover:bg-gray-100/50 dark:hover:bg-gray-700/50 rounded-lg transition-colors"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.2 }}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </motion.button>
                </div>

                {/* Content - Compact Design */}
                <div 
                    className="p-4 overflow-y-auto max-h-[70vh] scrollbar-hide" 
                    style={{ 
                        scrollbarWidth: 'none', 
                        msOverflowStyle: 'none'
                    }}
                >
                    <div className="space-y-3">
                        
                        {/* Font Family - Full Width */}
                        <motion.div 
                            className="space-y-2"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                        >
                            <div className="flex items-center gap-2">
                                <svg className="w-3 h-3 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10M12 3v18M8 7h8" />
                                </svg>
                                <h3 className="font-medium text-gray-800 dark:text-gray-200 text-xs">Font Family</h3>
                            </div>
                            <select
                                value={settings.fontFamily}
                                onChange={(e) => setSettings({...settings, fontFamily: e.target.value})}
                                className="w-full p-2 text-xs border border-gray-300 dark:border-gray-600 rounded-md bg-white/70 dark:bg-gray-700/70 text-gray-800 dark:text-gray-200 backdrop-blur-sm transition-all duration-200"
                                style={{ fontFamily: settings.fontFamily }}
                            >
                                {fontFamilies.map((font) => (
                                    <option key={font.value} value={font.value} style={{ fontFamily: font.value }}>
                                        {font.name} {font.kdp && font.ingram ? '●●' : font.kdp ? '●○' : font.ingram ? '○●' : '○○'}
                                    </option>
                                ))}
                            </select>
                        </motion.div>

                        {/* Row 1: Text Size & Text Alignment */}
                        <div className="grid grid-cols-2 gap-4 mt-4">
                            <motion.div 
                                className="space-y-2"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                            >
                                <div className="flex items-center gap-1">
                                    <svg className="w-3 h-3 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4" />
                                    </svg>
                                    <h3 className="font-medium text-gray-800 dark:text-gray-200 text-xs">Text Size</h3>
                                </div>
                                <div className="grid grid-cols-4 gap-1">
                                    {[
                                        { name: 'S', value: 'text-sm', size: 'text-xs' },
                                        { name: 'M', value: 'text-base', size: 'text-sm' },
                                        { name: 'L', value: 'text-lg', size: 'text-base' },
                                        { name: 'XL', value: 'text-xl', size: 'text-lg' },
                                    ].map((size) => (
                                        <motion.button
                                            key={size.value}
                                            onClick={() => setSettings({...settings, fontSize: size.value})}
                                            className={`p-2 rounded border transition-all duration-200 text-center ${
                                                settings.fontSize === size.value
                                                    ? 'border-blue-500 bg-blue-50/80 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                                                    : 'border-gray-200/50 dark:border-gray-600/50 hover:border-gray-300 dark:hover:border-gray-500 bg-white/50 dark:bg-gray-700/50'
                                            }`}
                                            title={`${size.name} Size`}
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                        >
                                            <div className={`font-bold ${size.size}`}>Aa</div>
                                        </motion.button>
                                    ))}
                                </div>
                            </motion.div>

                            <motion.div 
                                className="space-y-2"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 }}
                            >
                                <div className="flex items-center gap-1">
                                    <svg className="w-3 h-3 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h8m-8 6h16" />
                                    </svg>
                                    <h3 className="font-medium text-gray-800 dark:text-gray-200 text-xs">Alignment</h3>
                                </div>
                                <div className="grid grid-cols-4 gap-1">
                                    {[
                                        { name: 'L', value: 'left', icon: '⬅' },
                                        { name: 'C', value: 'center', icon: '⬌' },
                                        { name: 'R', value: 'right', icon: '➡' },
                                        { name: 'J', value: 'justified', icon: '⬍' }
                                    ].map((align) => (
                                        <motion.button
                                            key={align.value}
                                            onClick={() => setSettings({...settings, textAlignment: align.value})}
                                            className={`p-2 rounded border transition-all duration-200 text-center ${
                                                settings.textAlignment === align.value
                                                    ? 'border-blue-500 bg-blue-50/80 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                                                    : 'border-gray-200/50 dark:border-gray-600/50 hover:border-gray-300 dark:hover:border-gray-500 bg-white/50 dark:bg-gray-700/50'
                                            }`}
                                            title={`${align.name} Align`}
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                        >
                                            <div className="text-xs">{align.icon}</div>
                                        </motion.button>
                                    ))}
                                </div>
                            </motion.div>
                        </div>

                        {/* Row 2: Indent & Line Height */}
                        <div className="grid grid-cols-2 gap-4">
                            <motion.div 
                                className="space-y-2"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.4 }}
                            >
                                <div className="flex items-center gap-1">
                                    <svg className="w-3 h-3 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4l-8 8 8 8" />
                                    </svg>
                                    <h3 className="font-medium text-gray-800 dark:text-gray-200 text-xs">Indent</h3>
                                </div>
                                <div className="grid grid-cols-4 gap-1">
                                    {[
                                        { name: '0', value: 'none', icon: '|' },
                                        { name: '1', value: 'small', icon: '|→' },
                                        { name: '2', value: 'medium', icon: '|⇒' },
                                        { name: '3', value: 'large', icon: '|⟶' }
                                    ].map((indent) => (
                                        <motion.button
                                            key={indent.value}
                                            onClick={() => setSettings({...settings, textIndent: indent.value})}
                                            className={`p-2 rounded border transition-all duration-200 text-center ${
                                                settings.textIndent === indent.value
                                                    ? 'border-blue-500 bg-blue-50/80 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                                                    : 'border-gray-200/50 dark:border-gray-600/50 hover:border-gray-300 dark:hover:border-gray-500 bg-white/50 dark:bg-gray-700/50'
                                            }`}
                                            title={`${indent.name} Indent`}
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                        >
                                            <div className="font-mono text-xs">{indent.icon}</div>
                                        </motion.button>
                                    ))}
                                </div>
                            </motion.div>

                            <motion.div 
                                className="space-y-2"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.5 }}
                            >
                                <div className="flex items-center gap-1">
                                    <svg className="w-3 h-3 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                                    </svg>
                                    <h3 className="font-medium text-gray-800 dark:text-gray-200 text-xs">Line Height</h3>
                                </div>
                                <div className="grid grid-cols-4 gap-1">
                                    {[
                                        { name: 'T', value: 'tight', icon: '≡' },
                                        { name: 'N', value: 'normal', icon: '⧻' },
                                        { name: 'R', value: 'relaxed', icon: '⩙' },
                                        { name: 'L', value: 'loose', icon: '⩚' }
                                    ].map((height) => (
                                        <motion.button
                                            key={height.value}
                                            onClick={() => setSettings({...settings, lineHeight: height.value})}
                                            className={`p-2 rounded border transition-all duration-200 text-center ${
                                                settings.lineHeight === height.value
                                                    ? 'border-blue-500 bg-blue-50/80 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                                                    : 'border-gray-200/50 dark:border-gray-600/50 hover:border-gray-300 dark:hover:border-gray-500 bg-white/50 dark:bg-gray-700/50'
                                            }`}
                                            title={`${height.name} Height`}
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                        >
                                            <div className="text-xs">{height.icon}</div>
                                        </motion.button>
                                    ))}
                                </div>
                            </motion.div>
                        </div>

                        {/* Row 3: Paragraph Spacing & Page Width */}
                        <div className="grid grid-cols-2 gap-4">
                            <motion.div 
                                className="space-y-2"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.6 }}
                            >
                                <div className="flex items-center gap-1">
                                    <svg className="w-3 h-3 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01" />
                                    </svg>
                                    <h3 className="font-medium text-gray-800 dark:text-gray-200 text-xs">Paragraph</h3>
                                </div>
                                <div className="grid grid-cols-4 gap-1">
                                    {[
                                        { name: '0', value: '0', icon: '▬' },
                                        { name: '1', value: '0.25em', icon: '▬▬' },
                                        { name: '2', value: '0.5em', icon: '▬ ▬' },
                                        { name: '3', value: '1em', icon: '▬  ▬' }
                                    ].map((spacing) => (
                                        <motion.button
                                            key={spacing.value}
                                            onClick={() => setSettings({...settings, paragraphSpacing: spacing.value})}
                                            className={`p-2 rounded border transition-all duration-200 text-center ${
                                                settings.paragraphSpacing === spacing.value
                                                    ? 'border-blue-500 bg-blue-50/80 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                                                    : 'border-gray-200/50 dark:border-gray-600/50 hover:border-gray-300 dark:hover:border-gray-500 bg-white/50 dark:bg-gray-700/50'
                                            }`}
                                            title={`${spacing.name} Spacing`}
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                        >
                                            <div className="font-mono text-xs">{spacing.icon}</div>
                                        </motion.button>
                                    ))}
                                </div>
                            </motion.div>

                            <motion.div 
                                className="space-y-2"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.7 }}
                            >
                                <div className="flex items-center gap-1">
                                    <svg className="w-3 h-3 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5" />
                                    </svg>
                                    <h3 className="font-medium text-gray-800 dark:text-gray-200 text-xs">Page Width</h3>
                                </div>
                                <div className="grid grid-cols-4 gap-1">
                                    {[
                                        { name: 'N', value: 'narrow', icon: '│' },
                                        { name: 'M', value: 'medium', icon: '┃' },
                                        { name: 'W', value: 'wide', icon: '█' },
                                        { name: 'F', value: 'full', icon: '■' }
                                    ].map((width) => (
                                        <motion.button
                                            key={width.value}
                                            onClick={() => setSettings({...settings, pageWidth: width.value})}
                                            className={`p-2 rounded border transition-all duration-200 text-center ${
                                                settings.pageWidth === width.value
                                                    ? 'border-blue-500 bg-blue-50/80 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                                                    : 'border-gray-200/50 dark:border-gray-600/50 hover:border-gray-300 dark:hover:border-gray-500 bg-white/50 dark:bg-gray-700/50'
                                            }`}
                                            title={`${width.name} Width`}
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                        >
                                            <div className="text-xs">{width.icon}</div>
                                        </motion.button>
                                    ))}
                                </div>
                            </motion.div>
                        </div>

                        {/* Additional Settings - Compact */}
                        <motion.div 
                            className="space-y-3 pt-3 border-t border-gray-200/50 dark:border-gray-700/50"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.8 }}
                        >
                            <div className="grid grid-cols-2 gap-3">
                                {/* Scene Divider */}
                                <div className="space-y-1">
                                    <h4 className="text-xs font-medium text-gray-700 dark:text-gray-300">Scene Divider</h4>
                                    <select
                                        value={settings.sceneDivider}
                                        onChange={(e) => setSettings({...settings, sceneDivider: e.target.value})}
                                        className="w-full p-1 text-xs border border-gray-300/50 dark:border-gray-600/50 rounded bg-white/70 dark:bg-gray-700/70 backdrop-blur-sm"
                                    >
                                        <option value="asterisks">* * *</option>
                                        <option value="boxes">■ ■ ■</option>
                                        <option value="lines">— — —</option>
                                        <option value="dots">• • •</option>
                                    </select>
                                </div>

                                {/* Checkboxes */}
                                <div className="space-y-1">
                                    <label className="flex items-center gap-1 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={settings.chicagoStyle}
                                            onChange={(e) => setSettings({...settings, chicagoStyle: e.target.checked})}
                                            className="w-3 h-3 text-blue-600 rounded"
                                        />
                                        <span className="text-xs text-gray-600 dark:text-gray-400">Chicago</span>
                                    </label>
                                    <label className="flex items-center gap-1 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={settings.typewriterMode}
                                            onChange={(e) => setSettings({...settings, typewriterMode: e.target.checked})}
                                            className="w-3 h-3 text-blue-600 rounded"
                                        />
                                        <span className="text-xs text-gray-600 dark:text-gray-400">Typewriter</span>
                                    </label>
                                    <label className="flex items-center gap-1 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={settings.rememberPosition}
                                            onChange={(e) => setSettings({...settings, rememberPosition: e.target.checked})}
                                            className="w-3 h-3 text-blue-600 rounded"
                                        />
                                        <span className="text-xs text-gray-600 dark:text-gray-400">Remember</span>
                                    </label>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </div>

                {/* Footer - Compact */}
                <motion.div 
                    className="flex items-center justify-between p-3 border-t border-gray-200/50 dark:border-gray-700/50 bg-gray-50/50 dark:bg-gray-900/50 backdrop-blur-sm"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.9 }}
                >
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                        ●● = KDP + IS • ●○ = KDP • ○● = IS
                    </div>
                    <div className="flex gap-2">
                        <motion.button
                            onClick={handleCancel}
                            className="px-3 py-1 text-xs text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors rounded hover:bg-gray-100/50 dark:hover:bg-gray-800/50"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            Cancel
                        </motion.button>
                        <motion.button
                            onClick={handleApply}
                            className="px-4 py-1 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors font-medium shadow-md"
                            whileHover={{ scale: 1.05, boxShadow: "0 4px 12px rgba(59, 130, 246, 0.3)" }}
                            whileTap={{ scale: 0.95 }}
                        >
                            Apply
                        </motion.button>
                    </div>
                </motion.div>
            </div>
            </motion.div>
        </div>
    );
};
