import React from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { CalendarDaysIcon, PencilSquareIcon, SparklesIcon } from '@heroicons/react/24/outline';

const CourseManagementDashboard = () => {
    const router = useRouter();
    const { courseId } = router.query;

    const cardVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
    };

    if (!router.isReady || !courseId) {
        return <div>Loading...</div>;
    }

    const managementCards = [
        {
            name: 'Academic Calendar',
            description: 'Manage academic years and semesters.',
            href: `/assessor/course-management/academic-calendar?courseId=${courseId}`,
            icon: CalendarDaysIcon,
        },
        {
            name: 'Curriculum Designer',
            description: 'Define the course structure by assigning modules to specific years and semesters.',
            href: `/assessor/course-management/curriculum?courseId=${courseId}`,
            icon: PencilSquareIcon,
        },
        {
            name: 'Class Scheduling & Enrollment',
            description: 'Assign assessors to modules for a semester and enroll students.',
            href: `/assessor/course-management/offerings?courseId=${courseId}`,
            icon: SparklesIcon,
        },
    ];

    return (
        <>
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-6">Course Management Dashboard</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {managementCards.map((card, index) => (
                    <motion.div
                        key={card.name}
                        variants={cardVariants}
                        initial="hidden"
                        animate="visible"
                        transition={{ delay: index * 0.1 }}
                        className="h-full"
                    >
                        <Link href={card.href} passHref legacyBehavior>
                            <a className="block transform hover:scale-105 transition-transform duration-300 h-full">
                                <div className="bg-card rounded-lg shadow-lg dark:shadow-dark-lg overflow-hidden h-full flex flex-col border border-primary/70">
                                    <div className="p-6">
                                        <div className="flex items-center mb-4">
                                            <card.icon className="h-8 w-8 text-blue-500 dark:text-blue-400 mr-4" />
                                            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{card.name}</h2>
                                        </div>
                                        <p className="text-gray-600 dark:text-gray-300">{card.description}</p>
                                    </div>
                                </div>
                            </a>
                        </Link>
                    </motion.div>
                ))}
            </div>
        </>
    );
};

export default CourseManagementDashboard;
