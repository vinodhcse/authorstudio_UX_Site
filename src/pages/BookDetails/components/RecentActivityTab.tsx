
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity } from '../../../types';

interface RecentActivityTabProps {
    activities: Activity[];
}

const RecentActivityTab: React.FC<RecentActivityTabProps> = ({ activities }) => {
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.07 }
        }
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: { y: 0, opacity: 1 },
        exit: { opacity: 0, x: -50 }
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
        >
            <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Recent Activity</h3>
            </div>
            
            {activities.length > 0 ? (
                <motion.div
                    className="space-y-4"
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                >
                    <AnimatePresence>
                        {activities.map((activity) => (
                            <motion.div
                                key={activity.id}
                                variants={itemVariants}
                                layout
                                className="bg-white/50 dark:bg-black/20 backdrop-blur-sm border border-gray-200/50 dark:border-gray-800/50 rounded-lg p-4 flex items-center justify-between gap-4"
                            >
                                <div className="flex items-center gap-3">
                                    <img src={activity.user.avatar} alt={activity.user.name} className="w-8 h-8 rounded-full" />
                                    <div>
                                        <p className="text-sm text-gray-800 dark:text-gray-200">
                                            <span className="font-semibold">{activity.user.name}</span>
                                            {` ${activity.action} `}
                                            <span className="font-semibold text-purple-600 dark:text-sky-400">{activity.target}</span>
                                        </p>
                                    </div>
                                </div>
                                <p className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0">{activity.timestamp}</p>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </motion.div>
            ) : (
                <div className="text-center py-12 bg-white/50 dark:bg-black/20 backdrop-blur-sm border border-gray-200/50 dark:border-gray-800/50 rounded-lg">
                    <p className="text-gray-500 dark:text-gray-400">No recent activity for this book.</p>
                </div>
            )}
        </motion.div>
    );
};

export default RecentActivityTab;