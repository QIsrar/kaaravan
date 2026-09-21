'use client';

import { motion } from 'framer-motion';
import { Heart, Shield, Leaf, Users, Target, Eye, Award, Globe } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
};

const stagger = {
  visible: { transition: { staggerChildren: 0.15 } },
};

const values = [
  { icon: Heart, title: 'Ethically Made', description: 'Fair wages and transparent supply chains define everything we do.' },
  { icon: Shield, title: 'Premium Quality', description: 'Hand-selected fabrics and meticulous craftsmanship in every piece.' },
  { icon: Leaf, title: 'Sustainable', description: '70% sustainable materials today, targeting 100% by 2027.' },
  { icon: Users, title: 'Community First', description: 'Designed by and for the modest fashion community worldwide.' },
];

const milestones = [
  { year: '2020', title: 'The Beginning', description: 'Founded with a vision to make modest fashion accessible, beautiful, and ethical.' },
  { year: '2021', title: 'First Collection', description: 'Launched our signature hijab line with 12 colors and instant sell-outs.' },
  { year: '2022', title: 'Global Reach', description: 'Expanded to 20+ countries and introduced our Abayas & Dresses collection.' },
  { year: '2023', title: 'Sustainability Pledge', description: 'Committed to 70% sustainable materials and carbon-neutral shipping.' },
  { year: '2024', title: 'Modest Sportswear', description: 'Launched our performance sportswear line for the active modest woman.' },
  { year: '2025', title: 'Community of 15K+', description: 'Grew to 15,000+ happy customers across 40+ countries worldwide.' },
];

const team = [
  { name: 'Amira Hassan', role: 'Founder & CEO', bio: 'Fashion designer turned entrepreneur with a passion for modest fashion innovation.' },
  { name: 'Fatima Al-Rashid', role: 'Head of Sustainability', bio: 'Environmental scientist ensuring every piece meets our ethical standards.' },
  { name: 'Nour Khatib', role: 'Creative Director', bio: 'Award-winning designer bringing modern aesthetics to modest fashion.' },
  { name: 'Layla Mahmoud', role: 'Head of Operations', bio: 'Supply chain expert with 10+ years in ethical fashion manufacturing.' },
];

export default function AboutPage() {
  return (
    <div className="pt-20 lg:pt-24">
      {/* Hero */}
      <section className="bg-gradient-to-br from-cream via-background to-cream-dark py-20 lg:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={stagger}
            className="max-w-3xl mx-auto text-center"
          >
            <motion.h1
              variants={fadeInUp}
              className="font-heading text-4xl lg:text-5xl font-bold mb-6"
            >
              Our Story
            </motion.h1>
            <motion.p
              variants={fadeInUp}
              className="text-lg text-muted-foreground leading-relaxed"
            >
              Veiled Canvas was born from a simple belief: that modesty and modern
              fashion are not opposites — they&apos;re a canvas for self-expression.
              We create premium pieces that celebrate individuality while honoring
              timeless values.
            </motion.p>
          </motion.div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-20 lg:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-8">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeInUp}
            >
              <Card className="h-full border-0 bg-primary/5 p-8">
                <CardContent className="p-0">
                  <div className="w-12 h-12 rounded-xl gradient-gold flex items-center justify-center mb-4">
                    <Target size={24} className="text-espresso" />
                  </div>
                  <h2 className="font-heading text-2xl font-bold mb-4">Our Mission</h2>
                  <p className="text-muted-foreground leading-relaxed">
                    To empower women worldwide with fashion that respects their values
                    without compromising on style, quality, or sustainability. Every piece
                    we create is a statement that modesty is beautiful.
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeInUp}
            >
              <Card className="h-full border-0 bg-gold/5 p-8">
                <CardContent className="p-0">
                  <div className="w-12 h-12 rounded-xl gradient-gold flex items-center justify-center mb-4">
                    <Eye size={24} className="text-espresso" />
                  </div>
                  <h2 className="font-heading text-2xl font-bold mb-4">Our Vision</h2>
                  <p className="text-muted-foreground leading-relaxed">
                    To be the global leader in modest fashion — setting the standard for
                    ethical manufacturing, innovative design, and inclusive representation
                    in the fashion industry.
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-20 lg:py-28 bg-muted/30">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.h2
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
            className="font-heading text-3xl lg:text-4xl font-bold text-center mb-14"
          >
            Our Core Values
          </motion.h2>
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
            className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            {values.map((value) => (
              <motion.div key={value.title} variants={fadeInUp}>
                <Card className="text-center p-6 hover-lift h-full">
                  <CardContent className="p-0">
                    <div className="w-14 h-14 mx-auto mb-4 rounded-2xl gradient-gold flex items-center justify-center">
                      <value.icon size={24} className="text-espresso" />
                    </div>
                    <h3 className="font-heading font-semibold text-lg mb-2">{value.title}</h3>
                    <p className="text-sm text-muted-foreground">{value.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Timeline */}
      <section className="py-20 lg:py-28">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <motion.h2
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
            className="font-heading text-3xl lg:text-4xl font-bold text-center mb-14"
          >
            Our Journey
          </motion.h2>
          <div className="relative">
            {/* Vertical line */}
            <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-border" />

            <div className="space-y-8">
              {milestones.map((milestone, i) => (
                <motion.div
                  key={milestone.year}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="relative flex gap-6"
                >
                  {/* Dot */}
                  <div className="relative z-10 flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground font-heading font-bold text-xs">
                    {milestone.year}
                  </div>

                  <div className="pt-1.5">
                    <h3 className="font-heading font-semibold text-lg">{milestone.title}</h3>
                    <p className="text-sm text-muted-foreground mt-1">{milestone.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="py-20 lg:py-28 bg-muted/30">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.h2
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
            className="font-heading text-3xl lg:text-4xl font-bold text-center mb-14"
          >
            Meet the Team
          </motion.h2>
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
            className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            {team.map((member) => (
              <motion.div key={member.name} variants={fadeInUp}>
                <Card className="text-center p-6 hover-lift h-full">
                  <CardContent className="p-0">
                    <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-primary/20 to-gold/20 flex items-center justify-center">
                      <span className="font-heading text-xl font-bold text-primary">
                        {member.name.split(' ').map(n => n[0]).join('')}
                      </span>
                    </div>
                    <h3 className="font-heading font-semibold">{member.name}</h3>
                    <p className="text-sm text-primary font-medium mb-2">{member.role}</p>
                    <p className="text-xs text-muted-foreground">{member.bio}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>
    </div>
  );
}
