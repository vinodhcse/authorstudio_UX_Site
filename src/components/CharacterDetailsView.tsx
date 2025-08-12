import React, { useState } from 'react';
import { motion, useMotionValue, useTransform } from 'framer-motion';
import { Character } from '../types';
import AssetUploadButton from './AssetUploadButton';

interface CharacterDetailsViewProps {
    character: Character | null;
    onClose?: () => void;
    theme: 'light' | 'dark' | 'system';
    showBackButton?: boolean;
    onBack?: () => void;
    onEdit?: (character: Character) => void;
    bookId?: string; // Add bookId for asset management
}

type CharacterTab = 'details' | 'relations' | 'mentions' | 'heatmap';

const CharacterDetailsView: React.FC<CharacterDetailsViewProps> = ({ 
    character, 
    onClose, 
    theme, 
    showBackButton = false,
    onBack,
    onEdit,
    bookId 
}) => {
    const [activeTab, setActiveTab] = useState<CharacterTab>('details');
    const [showImageUpload, setShowImageUpload] = useState(false);

    // Motion values for 3D effect
    const x = useMotionValue(0);
    const y = useMotionValue(0);
    const rotateX = useTransform(y, [-150, 150], [8, -8]);
    const rotateY = useTransform(x, [-150, 150], [-8, 8]);

    const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
        const rect = event.currentTarget.getBoundingClientRect();
        x.set(event.clientX - rect.left - rect.width / 2);
        y.set(event.clientY - rect.top - rect.height / 2);
    };

    const handleImageUpload = (assetId: string, assetUrl: string) => {
        // TODO: Update character with new image asset
        console.log('Character image uploaded:', assetId, assetUrl);
        setShowImageUpload(false);
    };

    if (!character) {
        return (
            <div className={`${theme === 'dark' ? 'dark' : ''} bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-8 min-h-screen`}>
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
                        Character Not Found
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400 mb-6">
                        The character you're looking for doesn't exist or may have been removed.
                    </p>
                    {onClose && (
                        <button 
                            onClick={onClose}
                            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                        >
                            Go Back
                        </button>
                    )}
                </div>
            </div>
        );
    }

    const DetailCard: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
        <div className="bg-white/50 dark:bg-black/20 backdrop-blur-sm border border-gray-200/50 dark:border-gray-800/50 rounded-lg p-4">
            <h4 className="text-sm font-bold text-gray-800 dark:text-gray-200 mb-3 border-b border-black/10 dark:border-white/10 pb-2">{title}</h4>
            <div className="grid grid-cols-2 gap-4">
                {children}
            </div>
        </div>
    );

    const DetailItem: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
        <div>
            <span className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">{label}</span>
            <span className="text-sm font-semibold text-gray-800 dark:text-gray-200 block truncate">{value}</span>
        </div>
    );

    const renderHeroSection = () => (
        <div className="bg-gradient-to-br from-gray-200 to-gray-50 dark:from-gray-900 dark:to-black rounded-2xl p-6 md:p-8 border border-black/10 dark:border-white/10 shadow-lg mb-8">
            <div className="flex flex-col md:flex-row gap-8 md:gap-12 items-start">
                {/* Left Side: Character Image */}
                <motion.div
                    className="group w-full md:w-1/3 lg:w-1/4 flex-shrink-0 relative"
                    style={{ perspective: 1000 }}
                    onMouseMove={handleMouseMove}
                    onMouseLeave={() => { x.set(0); y.set(0); }}
                >
                    <div className="absolute -inset-4 bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl z-0"></div>
                    <motion.div
                        className="relative aspect-[3/4] rounded-lg shadow-2xl overflow-hidden z-10"
                        style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
                    >
                        <img 
                            src={character.image} 
                            alt={character.name}
                            className="absolute w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center z-20 cursor-pointer">
                            <div className="flex gap-3">
                                <button 
                                    onClick={() => onEdit?.(character)}
                                    className="flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-full bg-white/20 text-white backdrop-blur-md hover:bg-white/30 transition-colors"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                    </svg>
                                    Edit
                                </button>
                                {bookId && (
                                    <button 
                                        onClick={() => setShowImageUpload(true)}
                                        className="flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-full bg-white/20 text-white backdrop-blur-md hover:bg-white/30 transition-colors"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                        </svg>
                                        Upload
                                    </button>
                                )}
                                <button 
                                    className="flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-full bg-white/20 text-white backdrop-blur-md hover:bg-white/30 transition-colors"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                    </svg>
                                    Arc
                                </button>
                            </div>
                        </div>

                        {/* Upload Modal */}
                        {showImageUpload && bookId && (
                            <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-40 p-4">
                                <div className="bg-white dark:bg-gray-800 rounded-lg p-4 max-w-sm w-full">
                                    <div className="flex justify-between items-center mb-4">
                                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Upload Character Image</h3>
                                        <button
                                            onClick={() => setShowImageUpload(false)}
                                            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                    </div>
                                    <AssetUploadButton
                                        entityType="character"
                                        entityId={character.id}
                                        bookId={bookId}
                                        role="avatar"
                                        onAssetUploaded={handleImageUpload}
                                        className="w-full"
                                        acceptedTypes={['image/*']}
                                    >
                                        <div className="w-full p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-center hover:border-blue-500 dark:hover:border-blue-400 transition-colors cursor-pointer">
                                            <svg className="w-8 h-8 mx-auto mb-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                            </svg>
                                            <p className="text-gray-600 dark:text-gray-400">Click to upload or drag & drop</p>
                                        </div>
                                    </AssetUploadButton>
                                </div>
                            </div>
                        )}
                        
                        {/* Importance Badge */}
                        <div className="absolute top-3 right-3 w-10 h-10 bg-purple-500 rounded-full border-3 border-white flex items-center justify-center shadow-lg z-30">
                            <span className="text-sm font-bold text-white">
                                {character.importance === 'Primary' ? '★' : character.importance === 'Secondary' ? '2' : '3'}
                            </span>
                        </div>
                    </motion.div>
                </motion.div>
                
                {/* Right Side: Character Details */}
                <div className="w-full md:w-2/3 lg:w-3/4 space-y-6">
                    {/* Header with navigation */}
                    <div className="flex justify-between items-start">
                        <div>
                            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">
                                {character.fullName || character.name}
                            </h1>
                            <p className="text-md text-gray-600 dark:text-gray-300 mt-2">
                                {character.role || character.title || 'Character'}
                            </p>
                        </div>
                        <div className="flex gap-2">
                            {showBackButton && onBack && (
                                <button 
                                    onClick={onBack}
                                    className="flex-shrink-0 flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-full bg-gray-600 text-white hover:bg-gray-700 transition-all transform hover:scale-105 shadow-md"
                                    title="Go back"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                    </svg>
                                    Back
                                </button>
                            )}
                            {onClose && (
                                <button 
                                    onClick={onClose}
                                    className="flex-shrink-0 flex items-center justify-center w-10 h-10 text-sm font-semibold rounded-full bg-gray-600 text-white hover:bg-gray-700 transition-all transform hover:scale-105 shadow-md"
                                    title="Close character details"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            )}
                        </div>
                    </div>
                    
                    {/* Character Quote */}
                    <blockquote className="text-gray-600 dark:text-gray-400 leading-relaxed text-sm max-w-2xl italic">
                        "{character.quote}"
                    </blockquote>

                    {/* Character Stats Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        <DetailCard title="Character Details">
                            <DetailItem label="Full Name" value={character.fullName || character.name} />
                            <DetailItem label="Age" value={character.age || 'Unknown'} />
                            <DetailItem label="Species" value={character.species || 'Human'} />
                            <DetailItem label="Importance" value={character.importance || 'Primary'} />
                            <DetailItem label="Gender" value={character.gender || 'Unknown'} />
                            <DetailItem label="Nationality" value={character.nationality || 'Unknown'} />
                        </DetailCard>

                        <DetailCard title="Physical Traits">
                            <DetailItem label="Height" value={character.height || 'Unknown'} />
                            <DetailItem label="Hair Color" value={character.hairColor || 'Unknown'} />
                            <DetailItem label="Eye Color" value={character.eyeColor || 'Unknown'} />
                            <DetailItem label="Build" value={character.build || 'Unknown'} />
                            <DetailItem label="Skin Tone" value={character.skinTone || 'Unknown'} />
                            <DetailItem label="Distinguishing" value={character.distinguishingMarks || 'None'} />
                        </DetailCard>
                    </div>
                </div>
            </div>
        </div>
    );

    const TabSwitcher: React.FC = () => {
        const tabs: { id: CharacterTab; label: string; icon: string }[] = [
            { id: 'details', label: 'Details', icon: '📋' },
            { id: 'relations', label: 'Relations', icon: '🤝' },
            { id: 'mentions', label: 'Mentions', icon: '💬' },
            { id: 'heatmap', label: 'Heat Map', icon: '🗺️' }
        ];

        return (
            <div className="flex justify-center my-8">
                <div className="flex items-center space-x-1 p-1 rounded-full bg-gray-200/70 dark:bg-gray-800/50 backdrop-blur-sm border border-gray-300/50 dark:border-gray-700/50">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className="relative px-4 py-2 text-sm font-medium rounded-full focus:outline-none transition-colors"
                        >
                            <span className={`relative z-10 flex items-center gap-2 ${activeTab === tab.id ? 'text-black dark:text-white' : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}`}>
                                <span>{tab.icon}</span>
                                {tab.label}
                            </span>
                            {activeTab === tab.id && (
                                <motion.div
                                    className="absolute inset-0 bg-white dark:bg-black rounded-full shadow-md"
                                    layoutId="activeCharacterTabPill"
                                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                                />
                            )}
                        </button>
                    ))}
                </div>
            </div>
        );
    };

    const renderTabContent = () => {
        switch (activeTab) {
            case 'details':
                return (
                    <div className="space-y-8">
                        {/* Character Overview Cards - Same layout as Character Profile Builder */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {/* Identity Card */}
                            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200/50 dark:border-gray-700/50 shadow-lg">
                                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                    </svg>
                                    Identity
                                </h4>
                                <div className="space-y-2 text-sm">
                                    <p><span className="font-medium">Name:</span> {character.fullName || character.name || 'Not set'}</p>
                                    <p><span className="font-medium">Age:</span> {character.age || 'Not set'}</p>
                                    <p><span className="font-medium">Race:</span> {character.species || 'Human'}</p>
                                    <p><span className="font-medium">Role:</span> {character.role || character.title || 'Not set'}</p>
                                    <p><span className="font-medium">Occupation:</span> {character.title || 'Not set'}</p>
                                </div>
                            </div>

                            {/* Appearance Card */}
                            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200/50 dark:border-gray-700/50 shadow-lg">
                                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                    </svg>
                                    Appearance
                                </h4>
                                <div className="space-y-2 text-sm">
                                    <p><span className="font-medium">Height:</span> {character.height || 'Not set'}</p>
                                    <p><span className="font-medium">Build:</span> {character.build || 'Not set'}</p>
                                    <p><span className="font-medium">Hair:</span> {character.hairColor || 'Not set'}</p>
                                    <p><span className="font-medium">Eyes:</span> {character.eyeColor || 'Not set'}</p>
                                    <p><span className="font-medium">Features:</span> {character.distinguishingMarks || 'None noted'}</p>
                                </div>
                            </div>

                            {/* Personality Card */}
                            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200/50 dark:border-gray-700/50 shadow-lg">
                                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                    </svg>
                                    Personality
                                </h4>
                                <div className="space-y-2 text-sm">
                                    <p><span className="font-medium">Type:</span> {character.personalityType || 'Not set'}</p>
                                    <p><span className="font-medium">Traits:</span> {character.coreTraits?.slice(0, 3).join(', ') || 'Not set'}</p>
                                    <p><span className="font-medium">Strengths:</span> {character.positiveTraits?.slice(0, 2).join(', ') || 'Not set'}</p>
                                    <p><span className="font-medium">Goals:</span> {character.desires?.slice(0, 2).join(', ') || 'Not set'}</p>
                                </div>
                            </div>

                            {/* Skills Card */}
                            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200/50 dark:border-gray-700/50 shadow-lg">
                                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                                    </svg>
                                    Skills
                                </h4>
                                <div className="space-y-2 text-sm">
                                    <p><span className="font-medium">Top Skills:</span> {character.primarySkills?.slice(0, 2).join(', ') || 'None'}</p>
                                    <p><span className="font-medium">Magic Schools:</span> {character.magicalAbilities?.slice(0, 2).join(', ') || 'None'}</p>
                                    <p><span className="font-medium">Combat:</span> {character.combatSkills?.slice(0, 2).join(', ') || 'Not set'}</p>
                                </div>
                            </div>

                            {/* Relationships Card */}
                            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200/50 dark:border-gray-700/50 shadow-lg">
                                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                    </svg>
                                    Relationships
                                </h4>
                                <div className="space-y-2 text-sm">
                                    <p><span className="font-medium">Allies:</span> {character.allies?.slice(0, 2).map(a => a.name).join(', ') || 'None'}</p>
                                    <p><span className="font-medium">Enemies:</span> {character.enemies?.slice(0, 2).map(e => e.name).join(', ') || 'None'}</p>
                                    <p><span className="font-medium">Romance:</span> {character.romanticInterests?.slice(0, 1).map(r => r.name).join(', ') || 'None'}</p>
                                </div>
                            </div>

                            {/* Achievements Card */}
                            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200/50 dark:border-gray-700/50 shadow-lg">
                                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                                    </svg>
                                    Achievements
                                </h4>
                                <div className="space-y-2 text-sm">
                                    <p><span className="font-medium">Greatest Feat:</span> {character.formativeEvents?.[0] || 'Not set'}</p>
                                    <p><span className="font-medium">Importance:</span> {character.importance || 'Primary'}</p>
                                    <p><span className="font-medium">Story Arc:</span> {character.characterArc?.slice(0, 50) + '...' || 'Not set'}</p>
                                </div>
                            </div>
                        </div>

                        {/* Detailed Sections */}
                        {character.backstory && (
                            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200/50 dark:border-gray-700/50 shadow-lg">
                                <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">Background</h3>
                                <p className="text-gray-900 dark:text-gray-100 leading-relaxed">{character.backstory}</p>
                            </div>
                        )}

                        {(character.primarySkills || character.magicalAbilities) && (
                            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200/50 dark:border-gray-700/50 shadow-lg">
                                <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">Skills & Abilities</h3>
                                <div className="space-y-4">
                                    {character.primarySkills && character.primarySkills.length > 0 && (
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Primary Skills</label>
                                            <div className="flex flex-wrap gap-2">
                                                {character.primarySkills.map((skill, index) => (
                                                    <span key={index} className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-sm">
                                                        {skill}
                                                    </span>
                                                ))}
                                        </div>
                                        </div>
                                    )}
                                    {character.magicalAbilities && character.magicalAbilities.length > 0 && (
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Magical Abilities</label>
                                            <div className="flex flex-wrap gap-2">
                                                {character.magicalAbilities.map((ability, index) => (
                                                    <span key={index} className="px-3 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded-full text-sm">
                                                        {ability}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                );

            case 'relations':
                return (
                    <div className="space-y-6">{/* Removed max-height and overflow constraints */}
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Character Relations</h3>
                        
                        {/* Family Relations */}
                        {character.familyRelations && (
                            <div>
                                <h4 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-3">Family</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {character.familyRelations.parents && (
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Parents</label>
                                            <p className="text-gray-900 dark:text-gray-100">{character.familyRelations.parents}</p>
                                        </div>
                                    )}
                                    {character.familyRelations.siblings && (
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Siblings</label>
                                            <p className="text-gray-900 dark:text-gray-100">{character.familyRelations.siblings}</p>
                                        </div>
                                    )}
                                    {character.familyRelations.spouse && (
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Spouse</label>
                                            <p className="text-gray-900 dark:text-gray-100">{character.familyRelations.spouse}</p>
                                        </div>
                                    )}
                                    {character.familyRelations.children && (
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Children</label>
                                            <p className="text-gray-900 dark:text-gray-100">{character.familyRelations.children}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* No relations message */}
                        {!character.familyRelations && (!character.allies || character.allies.length === 0) && (!character.enemies || character.enemies.length === 0) && (
                            <div className="text-center py-8">
                                <div className="text-4xl mb-4">🤝</div>
                                <h4 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No Relations Defined</h4>
                                <p className="text-gray-600 dark:text-gray-400">
                                    Add family members, allies, and enemies to build {character.name}'s network.
                                </p>
                            </div>
                        )}
                    </div>
                );

            case 'mentions':
                return (
                    <div>{/* Removed max-height and overflow constraints */}
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Story Mentions</h3>
                        <div className="text-center py-12">
                            <div className="text-6xl mb-4">💬</div>
                            <h4 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">Mentions Coming Soon</h4>
                            <p className="text-gray-600 dark:text-gray-400">
                                Track where {character.name} appears throughout your story.
                            </p>
                        </div>
                    </div>
                );

            case 'heatmap':
                return (
                    <div>{/* Removed max-height and overflow constraints */}
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Character Heat Map</h3>
                        <div className="text-center py-12">
                            <div className="text-6xl mb-4">🗺️</div>
                            <h4 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">Heat Map Coming Soon</h4>
                            <p className="text-gray-600 dark:text-gray-400">
                                Visual representation of {character.name}'s presence throughout your story.
                            </p>
                        </div>
                    </div>
                );

            default:
                return null;
        }
    };

    return (
        <div className={`${theme === 'dark' ? 'dark' : ''} w-full bg-gray-50 dark:bg-gray-900`}>
            <div className="max-w-7xl mx-auto p-6 pb-20">
                {renderHeroSection()}
                
                <TabSwitcher />
                
                {/* Tab Content - Full page scrolling */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700">
                    <div className="p-8">
                        {renderTabContent()}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CharacterDetailsView;
