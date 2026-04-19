'use client';

import React from "react";
import { motion, type Variants } from "framer-motion";
import { cn } from "@/lib/utils";

interface SectionWithMockupProps {
  title: string | React.ReactNode;
  description: string | React.ReactNode;
  primaryImageSrc: string;
  secondaryImageSrc: string;
  reverseLayout?: boolean;
}

const SectionWithMockup: React.FC<SectionWithMockupProps> = ({
  title,
  description,
  primaryImageSrc,
  secondaryImageSrc,
  reverseLayout = false,
}) => {
  const containerVariants: Variants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.2,
      },
    },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 50 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] },
    },
  };

  const layoutClasses = reverseLayout
    ? "md:grid-cols-2 md:grid-flow-col-dense"
    : "md:grid-cols-2";

  const textOrderClass = reverseLayout ? "md:col-start-2 md:pl-6 lg:pl-10" : "md:pr-6 lg:pr-10";
  const imageOrderClass = reverseLayout
    ? "md:col-start-1 md:justify-self-start"
    : "md:justify-self-end";

  return (
    <section className="relative overflow-hidden bg-background py-24 md:py-40">
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-80 bg-[radial-gradient(55%_55%_at_50%_0%,rgba(43,200,183,0.10),transparent_70%)]"
      />
      <div
        aria-hidden
        className="absolute right-0 top-1/3 h-80 w-80 rounded-full bg-[radial-gradient(circle,rgba(155,153,254,0.12)_0%,transparent_70%)] blur-3xl"
      />

      <div className="container relative z-10 mx-auto w-full max-w-[1220px] px-6 md:px-10">
        <motion.div
          className={`grid w-full grid-cols-1 items-center gap-14 md:gap-10 lg:gap-14 ${layoutClasses}`}
          variants={containerVariants}
          initial={false}
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
        >
          <motion.div
            className={`mx-auto mt-10 flex max-w-[34rem] flex-col items-start gap-4 md:mx-0 md:mt-0 ${textOrderClass}`}
            variants={itemVariants}
          >
            <div className="space-y-3 md:space-y-2">
              <div className="rounded-lg border border-border/70 bg-muted/50 px-4 py-1 text-sm text-foreground/80">
                Connected Systems
              </div>
              <h2 className="text-3xl font-semibold leading-tight text-foreground md:text-[40px] md:leading-[53px]">
                {title}
              </h2>
            </div>

            <p className="text-sm leading-7 text-muted-foreground md:text-[15px]">
              {description}
            </p>
          </motion.div>

          <motion.div
            className={`relative mx-auto mt-10 w-full max-w-[22rem] sm:max-w-[28rem] md:mt-0 md:max-w-[30rem] lg:max-w-[34rem] ${imageOrderClass}`}
            variants={itemVariants}
          >
            <motion.div
              className={cn(
                "absolute inset-y-10 z-0 hidden w-[76%] rounded-[30px] border border-border/35 bg-[#090909] md:block",
                reverseLayout ? "-left-10" : "-right-10"
              )}
              style={{ filter: "blur(1px)" }}
              initial={false}
              whileInView={{ y: reverseLayout ? -12 : -18 }}
              transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
              viewport={{ once: true, amount: 0.5 }}
            >
              <div
                className="relative h-full w-full rounded-[30px] bg-cover bg-center opacity-90"
                style={{
                  backgroundImage: `url(${secondaryImageSrc})`,
                }}
              />
            </motion.div>

            <motion.div
              className="relative z-10 overflow-hidden rounded-[32px] border border-border/50 bg-white/6 shadow-[0_32px_90px_-48px_rgba(15,23,42,0.35)] backdrop-blur-[15px] backdrop-brightness-[100%]"
              initial={false}
              whileInView={{ y: reverseLayout ? 14 : 18 }}
              transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
              viewport={{ once: true, amount: 0.5 }}
            >
              <div className="aspect-[4/5] h-full p-0 sm:aspect-[5/6] lg:aspect-[4/5]">
                <div
                  className="relative h-full"
                  style={{
                    backgroundSize: "100% 100%",
                  }}
                >
                  <div
                    className="h-full w-full bg-cover bg-center"
                    style={{
                      backgroundImage: `url(${primaryImageSrc})`,
                    }}
                  />
                </div>
              </div>
            </motion.div>
          </motion.div>
        </motion.div>
      </div>

      <div
        className="absolute bottom-0 left-0 z-0 h-px w-full"
        style={{
          background:
            "radial-gradient(50% 50% at 50% 50%, rgba(255,255,255,0.24) 0%, rgba(255,255,255,0) 100%)",
        }}
      />
    </section>
  );
};

export default SectionWithMockup;
