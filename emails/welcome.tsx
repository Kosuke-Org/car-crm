import { Button, Hr, Section, Text } from '@react-email/components';

import { BaseLayout } from '@/lib/email/templates';

interface WelcomeEmailProps {
  firstName: string;
  email: string;
  dashboardUrl?: string;
  settingsUrl?: string;
}

export const WelcomeEmail = ({
  firstName,
  email,
  dashboardUrl,
  settingsUrl,
}: WelcomeEmailProps) => {
  return (
    <BaseLayout preview={`Welcome to AutoYard, ${firstName}! 🎉`}>
      {/* Welcome Message */}
      <Section className="mb-8">
        <Text className="mt-0 mb-4 text-3xl font-bold text-stone-900">
          Welcome, {firstName}! 🎉
        </Text>
        <Text className="mb-4 text-base leading-relaxed text-stone-600">
          Thank you for joining AutoYard! Your account (<strong>{email}</strong>) is ready.
        </Text>
        <Text className="mb-0 text-base leading-relaxed text-stone-600">
          Import your stock and open enquiries, and your whole floor can work from one list instead
          of a shared inbox.
        </Text>
      </Section>

      {/* CTA Section */}
      {(dashboardUrl || settingsUrl) && (
        <Section className="mb-8 rounded-lg bg-stone-50 p-6 text-center">
          <Text className="mt-0 mb-6 text-xl font-semibold text-stone-900">Get Started</Text>
          {dashboardUrl && (
            <Button
              href={dashboardUrl}
              className="mr-3 mb-2 inline-block rounded-lg bg-[#005f63] px-6 py-3 font-semibold text-white no-underline"
            >
              Go to Dashboard
            </Button>
          )}
          {settingsUrl && (
            <Button
              href={settingsUrl}
              className="mb-2 ml-3 inline-block rounded-lg border border-solid border-[#005f63] bg-white px-6 py-3 font-semibold text-[#005f63] no-underline"
            >
              Account Settings
            </Button>
          )}
        </Section>
      )}

      {/* Features Section */}
      <Section className="mb-8">
        <Text className="mb-4 text-xl font-semibold text-stone-900">What&apos;s included:</Text>

        {[
          'Every enquiry in one queue, with a response clock',
          'Vehicle stock with recon status and days on lot',
          'Test drives booked straight into the diary',
          'Part-ex valuations and finance quotes on the deal',
          'Order paperwork signed from a phone in the showroom',
          'Reporting by salesperson and by rooftop',
        ].map((feature, index) => (
          <Text key={index} className="mb-3 flex items-center text-sm text-stone-600">
            <span className="mr-3 font-bold text-[#005f63]">✓</span>
            {feature}
          </Text>
        ))}
      </Section>

      <Hr className="my-6 border-stone-200" />

      <Section>
        <Text className="text-center text-xs text-stone-500">
          This email was sent to {email}. If you have any questions, just reply to this
          email—we&apos;re always happy to help out.
        </Text>
      </Section>
    </BaseLayout>
  );
};
