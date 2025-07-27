import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Collaborator, CollaboratorRole } from '../../../types';
import { PlusIcon, TrashIcon } from '../../../constants';

const RoleBadge: React.FC<{ role: CollaboratorRole }> = ({ role }) => {
    const roleStyles = {
        AUTHOR: 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300',
        EDITOR: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300',
        REVIEWER: 'bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-300',
        ADMIN: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300'
    };
    return (
        <span className={`px-2 py-1 text-xs font-medium rounded-full ${roleStyles[role]}`}>
            {role}
        </span>
    );
};

const InviteForm: React.FC<{ onCancel: () => void }> = ({ onCancel }) => (
    <motion.div
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: 'auto' }}
        exit={{ opacity: 0, height: 0 }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className="overflow-hidden"
    >
        <div className="p-4 mt-4 bg-gray-100 dark:bg-gray-800/50 rounded-lg space-y-4 border border-gray-200/50 dark:border-gray-700/50">
             <input type="email" placeholder="Enter collaborator's email" className="block w-full shadow-inner sm:text-sm md:text-base md:py-3 px-3 rounded-lg bg-white/50 dark:bg-black/20 backdrop-blur-sm border border-white/30 dark:border-white/10 focus:ring-purple-500 focus:border-purple-500 text-gray-800 dark:text-gray-200 placeholder:text-gray-500 dark:placeholder:text-gray-400" />
            <select className="block w-full pl-3 pr-10 py-2 md:py-3 text-base border-white/30 dark:border-white/10 bg-white/50 dark:bg-black/20 backdrop-blur-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm md:text-base rounded-lg text-gray-800 dark:text-gray-200">
                <option className="bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200">EDITOR</option>
                <option className="bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200">REVIEWER</option>
            </select>
            <div className="flex justify-end gap-2">
                 <button onClick={onCancel} className="px-4 py-2 text-sm bg-gray-500/10 hover:bg-gray-500/20 dark:bg-gray-700 dark:hover:bg-gray-600 backdrop-blur-sm border border-white/20 text-gray-800 dark:text-gray-200 font-semibold rounded-lg transition-colors">Cancel</button>
                 <button className="px-4 py-2 text-sm bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg">Send Invite</button>
            </div>
        </div>
    </motion.div>
);

const CollaboratorTab: React.FC<{ collaborators: Collaborator[] }> = ({ collaborators }) => {
    const [isInviting, setIsInviting] = useState(false);
    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }} className="space-y-6">
            <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Collaborators</h3>
                <button onClick={() => setIsInviting(!isInviting)} className="flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-full bg-purple-600 text-white hover:bg-purple-700 dark:bg-sky-500 dark:hover:bg-sky-600 transition-all transform hover:scale-105 shadow-md shadow-purple-500/20 dark:shadow-sky-500/30">
                    <PlusIcon className="h-4 w-4" />
                    Invite Collaborator
                </button>
            </div>
            <AnimatePresence>
                {isInviting && <InviteForm onCancel={() => setIsInviting(false)} />}
            </AnimatePresence>

             {collaborators.length > 0 ? (
                <div className="space-y-4">
                    {collaborators.map((c) => (
                        <div key={c.id} className="bg-white/50 dark:bg-black/20 backdrop-blur-sm border border-gray-200/50 dark:border-gray-800/50 rounded-lg p-4 flex items-center justify-between gap-4 hover:border-purple-500/50 dark:hover:border-sky-500/50 transition-colors">
                            <div className="flex items-center gap-4">
                                <img src={c.avatar} alt={c.name} className="w-10 h-10 rounded-full" />
                                <div>
                                    <p className="font-semibold text-gray-800 dark:text-gray-200">{c.name}</p>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">{c.email}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                {c.role && <RoleBadge role={c.role} />}
                                <button className="text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors">
                                    <TrashIcon className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                 <div className="text-center py-12 bg-white/50 dark:bg-black/20 backdrop-blur-sm border border-gray-200/50 dark:border-gray-800/50 rounded-lg">
                    <p className="text-gray-500 dark:text-gray-400">You are the only collaborator.</p>
                </div>
            )}
        </motion.div>
    );
};

export default CollaboratorTab;