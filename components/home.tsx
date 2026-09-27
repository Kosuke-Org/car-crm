'use client';

import Link from 'next/link';

import { motion } from 'framer-motion';
import { ArrowRight, Rocket } from 'lucide-react';

import { cn } from '@/lib/utils';

import { useOrganization } from '@/hooks/use-organization';
import { useUser } from '@/hooks/use-user';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

const todaysLeads = [
  {
    name: 'Aisha R.',
    vehicle: '2019 Golf GTI · 42k',
    meta: 'Autotrader · 6 min ago',
    status: 'Needs a reply',
    tone: 'bg-chart-2/15 text-chart-2',
  },
  {
    name: 'Tom B.',
    vehicle: '2021 Kuga ST-Line',
    meta: 'Website form · yesterday',
    status: 'Test drive Sat 10:30',
    tone: 'bg-chart-1/10 text-chart-1',
  },
  {
    name: 'Rehan M.',
    vehicle: '2020 A3 Sportback',
    meta: 'Part-ex quote sent',
    status: 'Waiting on buyer',
    tone: 'bg-muted text-muted-foreground',
  },
  {
    name: 'Lauren D.',
    vehicle: '2018 Civic 1.0 VTEC',
    meta: 'Finance approved',
    status: 'Handover Thu',
    tone: 'bg-chart-3/15 text-chart-3',
  },
];

const replaced = [
  'The sales@ inbox three people half-watch',
  'The stock spreadsheet that is always one price behind',
  'The whiteboard of this weekend’s test drives',
  'Four WhatsApp threads per deal',
  'The Monday report somebody rebuilds by hand',
];

const capabilities = [
  {
    title: 'One queue for every enquiry',
    body: 'Portals, your own website forms, WhatsApp, missed calls and walk-ins land in the same list, de-duplicated and stamped with the car the buyer was actually looking at. Response clocks start the second it arrives, so nothing quietly ages over a weekend.',
    wide: true,
  },
  {
    title: 'Stock that stays honest',
    body: 'VIN decode, recon status, photo sets and days on lot. Change a price once and the portals follow.',
  },
  {
    title: 'Test drives in the diary',
    body: 'Buyers pick a slot themselves. The car is prepped, fuelled and out front when they turn up.',
  },
  {
    title: 'Part-ex and paperwork on one record',
    body: 'Valuation, finance quote and order form sit with the deal, signed from a phone in the showroom.',
  },
  {
    title: 'Numbers per rooftop',
    body: 'Gross per unit, source ROI and aged stock, by site and by salesperson, without exporting anything.',
  },
];

const faqs = [
  {
    question: 'Does it replace our DMS?',
    answer:
      'No. AutoYard handles everything up to the signature — enquiries, stock presentation, appointments, part-ex and the order form. Signed deals push into your DMS, and accounting, service and parts stay where they are.',
  },
  {
    question: 'How long until we are actually using it?',
    answer:
      'A single site is usually running the same week: we import stock and open enquiries, connect your portals and spend two short sessions with the sales team. Groups take longer, mostly because of portal credentials.',
  },
  {
    question: 'We advertise on several portals. Does that still work?',
    answer:
      'Yes. Listings go out and leads come back on the major marketplaces, plus your own site. Price and availability change in one place.',
  },
  {
    question: 'Is it worth it for two salespeople?',
    answer:
      'That is most of our customers. Small pitches feel the response-time difference first, because there is nobody spare to chase a mailbox on a Saturday.',
  },
];

export function Home() {
  const { user } = useUser();
  const { organization } = useOrganization();

  const dashboardUrl = organization ? `/org/${organization.slug}/dashboard` : '/';

  const primaryCta = user ? (
    <Button size="lg" className="w-full sm:w-auto" asChild>
      <Link href={dashboardUrl}>
        <Rocket className="mr-2 h-4 w-4" />
        Go to dashboard
      </Link>
    </Button>
  ) : (
    <Button size="lg" className="w-full sm:w-auto" asChild>
      <Link href="/sign-up">
        Start a 14-day trial
        <ArrowRight className="ml-2 h-4 w-4" />
      </Link>
    </Button>
  );

  return (
    <div className="bg-background min-h-screen w-full pt-[60px]">
      <section className="from-accent/60 bg-gradient-to-b to-transparent px-4 pt-16 pb-14 sm:px-6 sm:pt-24 sm:pb-20">
        <div className="container mx-auto grid max-w-6xl gap-14 lg:grid-cols-[1.05fr_1fr] lg:items-center lg:gap-20">
          <motion.div
            className="min-w-0"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <p className="text-primary mb-5 text-sm font-medium tracking-wide">
              CRM for car retail — one pitch or twenty rooftops
            </p>

            <h1 className="max-w-xl text-4xl leading-[1.05] font-bold tracking-tight text-balance sm:text-5xl lg:text-[3.4rem]">
              Every enquiry answered before it goes cold
            </h1>

            <p className="text-muted-foreground mt-6 max-w-xl text-base leading-relaxed sm:text-lg">
              AutoYard keeps leads, stock, test drives and part-ex on one list your whole floor
              works from. No buyer waits until Monday because their email landed in a mailbox nobody
              owns.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              {primaryCta}
              <Button size="lg" variant="outline" className="w-full sm:w-auto" asChild>
                <Link href="/sign-in">See it on your own stock</Link>
              </Button>
            </div>

            <p className="text-muted-foreground mt-4 max-w-md text-sm leading-relaxed">
              Import from your DMS or a CSV on day one. No card, and no setup call unless you want
              one.
            </p>
          </motion.div>

          <motion.div
            className="min-w-0"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <Card>
              <CardContent className="space-y-5">
                <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                  <p className="text-sm font-medium">Today · Kingsway Motors</p>
                  <p className="text-muted-foreground text-xs">4 waiting · longest 11 min</p>
                </div>

                <ul className="space-y-4">
                  {todaysLeads.map((lead) => (
                    <li
                      key={lead.name}
                      className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between sm:gap-4"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">
                          {lead.name} <span className="text-muted-foreground">·</span>{' '}
                          {lead.vehicle}
                        </p>
                        <p className="text-muted-foreground mt-0.5 text-xs">{lead.meta}</p>
                      </div>
                      <span
                        className={cn(
                          'w-fit shrink-0 rounded-md px-2 py-1 text-xs font-medium',
                          lead.tone
                        )}
                      >
                        {lead.status}
                      </span>
                    </li>
                  ))}
                </ul>

                <p className="text-muted-foreground border-t pt-4 text-sm">
                  Average days on lot <span className="text-foreground font-medium">24</span>, down
                  from 39 since March.
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>

      <section className="px-4 py-16 sm:px-6 sm:py-24">
        <div className="container mx-auto grid max-w-6xl gap-10 md:grid-cols-[1fr_1fr] md:gap-20">
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-balance sm:text-4xl">
              One list instead of five tabs
            </h2>
            <p className="text-muted-foreground mt-5 text-base leading-relaxed">
              Most forecourts do not lose deals on price. They lose them in the gap between an
              enquiry arriving and somebody picking it up. AutoYard closes that gap by keeping the
              whole sale — first message to signed order — in one place.
            </p>
          </div>

          <ul className="space-y-3 self-center">
            {replaced.map((item) => (
              <li key={item} className="text-muted-foreground flex gap-3 text-base">
                <span aria-hidden className="bg-chart-2 mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="bg-accent/40 px-4 py-16 sm:px-6 sm:py-24">
        <div className="container mx-auto max-w-6xl">
          <div className="grid gap-x-12 gap-y-10 md:grid-cols-2">
            {capabilities.map((item) => (
              <div key={item.title} className={cn(item.wide && 'md:col-span-2 md:max-w-3xl')}>
                <h3
                  className={cn(
                    'font-semibold tracking-tight',
                    item.wide ? 'text-2xl sm:text-3xl' : 'text-lg'
                  )}
                >
                  {item.title}
                </h3>
                <p
                  className={cn(
                    'text-muted-foreground mt-3 leading-relaxed',
                    item.wide ? 'text-base sm:text-lg' : 'text-sm'
                  )}
                >
                  {item.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-16 sm:px-6 sm:py-24">
        <figure className="container mx-auto max-w-3xl">
          <blockquote className="text-xl leading-relaxed font-medium text-balance sm:text-2xl">
            “Weekend enquiries used to sit nine hours before anyone replied. They are minutes now.
            The part I did not expect: we stopped arguing about who owned which lead.”
          </blockquote>
          <figcaption className="text-muted-foreground mt-6 text-sm">
            Marta Ferrante — general manager, Ferrante Auto Group, four sites near Milan
          </figcaption>
        </figure>
      </section>

      <section className="px-4 pb-16 sm:px-6 sm:pb-24">
        <div className="container mx-auto grid max-w-5xl gap-10 md:grid-cols-[1fr_1.4fr] md:gap-16">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            What dealers ask before signing
          </h2>

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

      <section className="px-4 pb-16 sm:px-6 sm:pb-24">
        <div className="bg-primary text-primary-foreground container mx-auto max-w-6xl rounded-lg px-6 py-14 sm:px-14 sm:py-20">
          <div className="max-w-2xl">
            <h2 className="text-3xl font-bold tracking-tight text-balance sm:text-4xl">
              There is an enquiry waiting right now
            </h2>
            <p className="text-primary-foreground/80 mt-4 text-base sm:text-lg">
              Set up your site, import your stock and answer it from AutoYard today.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              {user ? (
                <Button size="lg" variant="secondary" className="w-full sm:w-auto" asChild>
                  <Link href={dashboardUrl}>
                    <Rocket className="mr-2 h-4 w-4" />
                    Go to dashboard
                  </Link>
                </Button>
              ) : (
                <Button size="lg" variant="secondary" className="w-full sm:w-auto" asChild>
                  <Link href="/sign-up">
                    Start a 14-day trial
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              )}
              <Button
                size="lg"
                variant="outline"
                className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground w-full bg-transparent sm:w-auto"
                asChild
              >
                <Link href="/sign-in">Talk to someone who sold cars</Link>
              </Button>
            </div>

            <p className="text-brand-accent mt-6 text-sm">
              Not a DMS. Not accounting. Just the part where you sell the car.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
