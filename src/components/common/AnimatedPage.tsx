import React from 'react';
import { motion } from 'framer-motion';

const AnimatedPage: React.FC<{ children: React.ReactNode; pageKey?: string }> = ({ children, pageKey }) => (
  <motion.div key={pageKey}
    initial={{ opacity: 0, y: 8 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -8 }}
  >
    {children}
  </motion.div>
);

export default AnimatedPage;

