'use client';

import Link from 'next/link';

import { motion } from 'framer-motion';
import {
  ArrowRight,
  BarChart3,
  CalendarClock,
  Car,
  FileSignature,
  Gauge,
  MessagesSquare,
  Rocket,
  Users,
} from 'lucide-react';

import { cn } from '@/lib/utils';

import { useOrganization } from '@/hooks/use-organization';
import { useUser } from '@/hooks/use-user';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

const heroStats = [
  { value: '31%', label: 'more test drives booked', color: 'text-chart-1' },
  { value: '4 min', label: 'average lead response time', color: 'text-chart-2' },
  { value: '1,200+', label: 'dealerships selling with us', color: 'text-chart-5' },
];

const pipelineStages = [
  {
    stage: 'New leads',
    count: 42,
    share: 100,
    color: '[&>[data-slot=progress-indicator]]:bg-chart-1',
  },
  {
    stage: 'Contacted',
    count: 28,
    share: 68,
    color: '[&>[data-slot=progress-indicator]]:bg-chart-2',
  },
  {
    stage: 'Test drive booked',
    count: 17,
    share: 41,
    color: '[&>[data-slot=progress-indicator]]:bg-chart-5',
  },
  {
    stage: 'Financing sent',
    count: 9,
    share: 22,
    color: '[&>[data-slot=progress-indicator]]:bg-chart-4',
  },
  {
    stage: 'Sold this week',
    count: 6,
    share: 14,
    color: '[&>[data-slot=progress-indicator]]:bg-chart-3',
  },
];

const features = [
  {
    icon: MessagesSquare,
    color: 'bg-chart-1/15 text-chart-1',
    title: 'One inbox for every lead',
    description:
      'Autotrader, your website, WhatsApp, phone and walk-ins land in a single queue with automated follow-ups that never let a buyer go cold.',
  },
  {
    icon: Car,
    color: 'bg-chart-2/15 text-chart-2',
    title: 'Inventory that sells itself',
    description:
      'VIN decoding, photo sets, reconditioning status and days-on-lot, synced to every listing portal the moment a price changes.',
  },
  {
    icon: CalendarClock,
    color: 'bg-chart-5/15 text-chart-5',
    title: 'Test drives on autopilot',
    description:
      'Buyers pick a slot from your live calendar, get reminders by SMS, and your salespeople walk in with the car already prepped.',
  },
  {
    icon: FileSignature,
    color: 'bg-chart-3/15 text-chart-3',
    title: 'Deal desk and e-signature',
    description:
      'Build the quote, add trade-in valuation and finance options, then send the contract for signature without leaving the deal.',
  },
  {
    icon: BarChart3,
    color: 'bg-chart-4/20 text-chart-4',
    title: 'Numbers your GM trusts',
    description:
      'Gross per unit, source ROI, aging stock and salesperson performance, refreshed live instead of stitched together in a spreadsheet.',
  },
  {
    icon: Users,
    color: 'bg-primary/10 text-primary',
    title: 'Built for multi-rooftop groups',
    description:
      'Share stock across locations, route leads to the nearest showroom and keep permissions tight for every team and brand.',
  },
];

const workflow = [
  {
    step: '01',
    color: 'bg-chart-1 text-primary-foreground',
    title: 'Capture',
    description:
      'Every enquiry is de-duplicated, enriched with the vehicle they viewed and assigned to a salesperson in seconds.',
  },
  {
    step: '02',
    color: 'bg-chart-2 text-primary-foreground',
    title: 'Convert',
    description:
      'Guided follow-up sequences, saved replies and test-drive booking links turn browsers into showroom appointments.',
  },
  {
    step: '03',
    color: 'bg-chart-5 text-primary-foreground',
    title: 'Close',
    description:
      'Quote, trade-in, finance and contract live on one deal record, so handover is paperwork-free and the margin is visible.',
  },
];

const testimonials = [
  {
    quote:
      'We were losing weekend leads in a shared mailbox. Within a month our response time went from nine hours to four minutes and September was our best month ever.',
    name: 'Marta Ferrante',
    role: 'General Manager, Ferrante Auto Group',
  },
  {
    quote:
      'Four rooftops, one stock list, one pipeline. I can finally see which channel actually pays for itself before I renew the spend.',
    name: 'Daniel Okafor',
    role: 'Owner, Northline Motors',
  },
];

const faqs = [
  {
    question: 'How long does it take to get running?',
    answer:
      'Most dealerships are live in under a week. We import your stock, contacts and open deals, connect your listing portals and train the team in two short sessions.',
  },
  {
    question: 'Will it work with the portals we already advertise on?',
    answer:
      'Yes. Listings and leads sync both ways with the major marketplaces, plus your own website forms, so pricing and availability stay identical everywhere.',
  },
  {
    question: 'Can independent sellers use it, or is it only for big groups?',
    answer:
      'Both. A single-site dealer with two salespeople gets the same pipeline, inventory and follow-up automation as a group running a dozen rooftops.',
  },
  {
    question: 'What about our existing finance and DMS providers?',
    answer:
      'Deals export to your DMS and finance partners, so the desk keeps its current approval flow while the customer-facing work happens here.',
  },
];

export function Home() {
  const { user } = useUser();
  const { organization } = useOrganization();

  const dashboardUrl = organization ? `/org/${organization.slug}/dashboard` : '/';

  return (
    <div className="bg-background min-h-screen w-full pt-[60px]">
      <section className="from-primary/10 via-chart-2/5 bg-gradient-to-br to-transparent px-4 pt-14 pb-16 sm:px-6 sm:pt-24 sm:pb-24">
        <div className="container mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-[1.1fr_1fr] lg:gap-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Badge className="bg-primary/10 text-primary hover:bg-primary/10 mb-6 px-3 py-1 text-xs">
              The CRM for people who sell cars
            </Badge>

            <h1 className="mb-6 text-4xl leading-[1.05] font-bold tracking-tight sm:text-5xl lg:text-6xl">
              Sell more cars.
              <br />
              <span className="text-primary">Chase fewer leads.</span>
            </h1>

            <p className="text-muted-foreground mb-8 max-w-xl text-base leading-relaxed sm:text-lg">
              DealerFlow brings your stock, enquiries, test drives and contracts into one pipeline,
              so every buyer gets a fast answer and no deal stalls in someone&apos;s inbox.
            </p>

            <div className="flex flex-col gap-3 sm:flex-row">
              {user ? (
                <Button size="lg" className="w-full sm:w-auto" asChild>
                  <Link href={dashboardUrl}>
                    <Rocket className="mr-2 h-4 w-4" />
                    Go to dashboard
                  </Link>
                </Button>
              ) : (
                <Button size="lg" className="w-full sm:w-auto" asChild>
                  <Link href="/sign-up">
                    Start free for 14 days
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              )}
              <Button size="lg" variant="outline" className="w-full sm:w-auto" asChild>
                <Link href="/sign-in">Book a live demo</Link>
              </Button>
            </div>

            <p className="text-muted-foreground mt-4 text-sm">
              No card required. Import your stock and contacts on day one.
            </p>

            <dl className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-3">
              {heroStats.map((stat) => (
                <div key={stat.label}>
                  <dt className={cn('text-2xl font-semibold sm:text-3xl', stat.color)}>
                    {stat.value}
                  </dt>
                  <dd className="text-muted-foreground mt-1 text-sm">{stat.label}</dd>
                </div>
              ))}
            </dl>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
          >
            <Card className="bg-card">
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Showroom pipeline</p>
                    <p className="text-muted-foreground text-xs">Kingsway Motors · this week</p>
                  </div>
                  <Badge className="bg-chart-2/15 text-chart-2 hover:bg-chart-2/15 text-xs">
                    Live
                  </Badge>
                </div>

                <div className="space-y-4">
                  {pipelineStages.map((item) => (
                    <div key={item.stage} className="space-y-2">
                      <div className="flex items-baseline justify-between text-sm">
                        <span className="text-muted-foreground">{item.stage}</span>
                        <span className="font-medium">{item.count}</span>
                      </div>
                      <Progress value={item.share} className={cn('bg-muted h-2', item.color)} />
                    </div>
                  ))}
                </div>

                <div className="border-border flex items-center gap-3 border-t pt-4">
                  <Gauge className="text-chart-1 h-4 w-4" />
                  <p className="text-muted-foreground text-sm">
                    Average days on lot <span className="text-foreground font-medium">24</span>,
                    down from 39
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>

      <section className="px-4 py-16 sm:px-6 sm:py-24">
        <div className="container mx-auto max-w-6xl">
          <motion.div
            className="mb-12 max-w-2xl sm:mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl">
              Everything the forecourt runs on, in one place
            </h2>
            <p className="text-muted-foreground text-base sm:text-lg">
              Purpose-built for used and new car retail, not a generic sales tool bent into shape.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: (index % 3) * 0.1 }}
              >
                <Card className="h-full">
                  <CardContent className="space-y-3">
                    <div
                      className={cn(
                        'flex h-10 w-10 items-center justify-center rounded-lg',
                        feature.color
                      )}
                    >
                      <feature.icon className="h-5 w-5" />
                    </div>
                    <h3 className="text-lg font-semibold">{feature.title}</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-accent/40 px-4 py-16 sm:px-6 sm:py-24">
        <div className="container mx-auto max-w-6xl">
          <motion.h2
            className="mb-12 max-w-2xl text-3xl font-bold tracking-tight sm:mb-16 sm:text-4xl"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            From first click to signed contract
          </motion.h2>

          <div className="grid grid-cols-1 gap-10 md:grid-cols-3 md:gap-12">
            {workflow.map((item, index) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <div
                  className={cn(
                    'mb-4 flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold',
                    item.color
                  )}
                >
                  {item.step}
                </div>
                <h3 className="mb-3 text-xl font-semibold">{item.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{item.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-16 sm:px-6 sm:py-24">
        <div className="container mx-auto grid max-w-6xl gap-6 md:grid-cols-2">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={testimonial.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Card className="h-full">
                <CardContent className="flex h-full flex-col justify-between gap-6">
                  <p className="text-base leading-relaxed">&ldquo;{testimonial.quote}&rdquo;</p>
                  <div>
                    <p className="text-sm font-medium">{testimonial.name}</p>
                    <p className="text-muted-foreground text-sm">{testimonial.role}</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="px-4 py-16 sm:px-6 sm:py-24">
        <div className="container mx-auto grid max-w-5xl gap-10 md:grid-cols-[1fr_1.4fr] md:gap-16">
          <motion.h2
            className="text-3xl font-bold tracking-tight sm:text-4xl"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            Questions dealers ask us
          </motion.h2>

          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq) => (
              <AccordionItem key={faq.question} value={faq.question}>
                <AccordionTrigger className="text-left text-base">{faq.question}</AccordionTrigger>
                <AccordionContent className="text-muted-foreground text-sm leading-relaxed">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      <section className="from-primary/10 via-chart-5/5 bg-gradient-to-tr to-transparent px-4 py-16 sm:px-6 sm:py-28">
        <div className="container mx-auto max-w-3xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="mb-5 text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
              Your next buyer is waiting on a reply
            </h2>
            <p className="text-muted-foreground mb-10 text-base sm:text-lg">
              Set up your showroom, import your stock and answer the first lead today.
            </p>

            <div className="flex flex-col justify-center gap-3 sm:flex-row">
              {user ? (
                <Button size="lg" className="w-full sm:w-auto" asChild>
                  <Link href={dashboardUrl}>
                    <Rocket className="mr-2 h-4 w-4" />
                    Go to dashboard
                  </Link>
                </Button>
              ) : (
                <Button size="lg" className="w-full sm:w-auto" asChild>
                  <Link href="/sign-up">
                    Start free for 14 days
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              )}
              <Button size="lg" variant="outline" className="w-full sm:w-auto" asChild>
                <Link href="/sign-in">Talk to sales</Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
