"use client";

import { motion } from "framer-motion";
import { GraduationCap } from "lucide-react";

export default function Loading() {
    return (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center space-y-4">
            <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{
                    scale: [1, 1.1, 1],
                    rotate: [0, 5, -5, 0],
                    opacity: 1
                }}
                transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                }}
                className="bg-primary text-primary-foreground p-4 rounded-2xl shadow-xl shadow-primary/20"
            >
                <GraduationCap className="w-12 h-12" />
            </motion.div>
            <div className="flex flex-col items-center space-y-1">
                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="text-lg font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60"
                >
                    Attendance System
                </motion.p>
                <div className="flex gap-1">
                    {[0, 1, 2].map((i) => (
                        <motion.div
                            key={i}
                            animate={{
                                scale: [1, 1.5, 1],
                                opacity: [0.3, 1, 0.3]
                            }}
                            transition={{
                                duration: 1,
                                repeat: Infinity,
                                delay: i * 0.2
                            }}
                            className="w-1.5 h-1.5 bg-primary rounded-full"
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}
