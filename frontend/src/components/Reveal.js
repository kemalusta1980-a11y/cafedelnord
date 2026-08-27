import { motion } from "framer-motion";

export const Reveal = ({ children, delay = 0, className = "", ...rest }) => (
  <motion.div
    className={className}
    initial={{ opacity: 0, y: 24 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: "-60px" }}
    transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }}
    {...rest}
  >
    {children}
  </motion.div>
);

export const MaskedLines = ({ lines, className = "", delay = 0 }) => (
  <span className={className}>
    {lines.map((line, i) => (
      <span key={i} className="mask-line">
        <motion.span
          className="block"
          initial={{ y: "110%" }}
          animate={{ y: 0 }}
          transition={{ duration: 0.9, delay: delay + i * 0.14, ease: [0.22, 1, 0.36, 1] }}
        >
          {line}
        </motion.span>
      </span>
    ))}
  </span>
);

export const GoldTitle = ({ text }) => {
  const words = text.split(" ");
  if (words.length === 1) return <span className="text-gold">{text}</span>;
  return (
    <>
      {words.slice(0, -1).join(" ")} <span className="text-gold">{words[words.length - 1]}</span>
    </>
  );
};
